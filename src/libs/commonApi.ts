import * as vscode from 'vscode';
import { PythonShell, Options } from './python-shell/index';
import { get, find, keys, set, filter } from 'lodash';
import * as fs from 'fs/promises';
import * as path from 'path';
import { notificationData, responseData, jsonToFormData, formartUri, isImg, getExt } from './utils';
import { methods } from '../constant';
import { queryOneSolution, updateSolution } from '../server/solutionService';
import { errorCode } from '../errorCode';
import logOutput from './log.service';

const EFORM_KEY = 'eform';

const pyOptions : Options= {
    mode: 'text',
    // pythonPath: 'path/to/python',
    pythonOptions: ['-u'], // get print results in real-time
    // scriptPath: 'path/to/my/scripts',
    args: []
};


export const apiExe = async (callType: string, exeData: API.IExeData) => {
    if (callType === 'python') {
        const options :Options = { ...pyOptions, ...exeData.options }
        console.log('options:', options)
        logOutput.appendLine(`RUN ${exeData.script}`)
        if(options.args && options.args.length>0) {
            logOutput.appendLine(`args: ${options.args.join(' ')}`)
        }
        return new Promise(async (resolve, reject)=>{
            try{
                const result = await PythonShell.run(formartUri(exeData.script), options);
                if(result && result.length > 0) {
                    for(let i=0; i<result.length; i++) {
                        logOutput.appendLine(result[i])
                    }
                }
                resolve(result)
            }catch(e: any){
                logOutput.error('RUN Python script error:');
                logOutput.error(e);
                resolve(['RUN script error', get(e, 'message', '')]);
                const onPrintCallback = get(exeData, ['options', 'onPrint']);
                if (onPrintCallback) {
                    onPrintCallback({ type: 'error', data: 'RUN script error' });
                    onPrintCallback({ type: 'error', data: get(e, 'message', '') });
                }
            }
        });
    }
}

export const apiHandle = async (message: any, webView: vscode.Webview)=>{
    if (message.request) {
        // 收到API请求
        if (message.method === methods.SELECTE_FOLDER) {
            // 打开路径选择
            let options: vscode.OpenDialogOptions = {
                canSelectMany: false,
                openLabel: 'Select',
                canSelectFiles: false,
                canSelectFolders: true
            };
            const selectOptions = get(message, 'data.options');
            if (selectOptions) {
                options = { ...options, ...selectOptions };
            }
            const fileUri = await vscode.window.showOpenDialog(options);
            console.log('fileUri:', fileUri)
            webView.postMessage(responseData(message.id||'', { fileUri }, true));
        } else if(message.method === methods.EXECUTE_SCRIPT){
            // 执行脚本
            console.log('apiHandle:', message);
            const { data } = message;
            let solution = queryOneSolution({_id: data.solutionId});
            if (!solution) {
                webView.postMessage(responseData(message.id||'', { code: errorCode.data_no_found }, false));
                return;
            }
            const { executionList } = solution;
            const { formData } = data;
            const execution = find(executionList, item=>item.id === data.executionId);
            if (execution) {
                if(execution.type === 'python') {
                    if(!execution.path) {
                        webView.postMessage(responseData(message.id||'', { code: errorCode.required_parameter_missing }, false));
                        return; 
                    }
                    let args = [];
                    const argsData = get(execution, 'argData', []);
                    if(get(execution, 'argType') === 'sys.argv') {
                        args = argsData.map((item: string)=>{
                            if(item === EFORM_KEY){
                                return JSON.stringify(formData)
                            }
                            const subKey = item.replace(`${EFORM_KEY}.`, '');
                            return get(formData, subKey, '');
                        })
                        console.log('args:', args);
                    } else {
                        const argObj = jsonToFormData(formData, '_');
                        const argObjKeys = argsData.map((item: string)=>item.replace('.', '_'));
                        args = argObjKeys.map((item: string)=>{
                            return `--${item}=${argObj[item]}`;
                        })
                    }
                    const exeData: API.IExeData= {
                        script: execution.path,
                        options: {
                            args,
                            noOutput: true,
                            onPrint: (printData: any)=>{
                                console.log('onPrint printData:', printData);
                                webView.postMessage(notificationData('SCRIPT_PRINT', {...printData, messageId: message.id}));
                            }
                        }
                    };
                    let exeResult = await apiExe('python', exeData);
                    if(!exeResult) {
                        exeResult = [];
                    }
                    webView.postMessage(responseData(message.id||'', { result: exeResult }, true));
                    if(data.remember) {
                        // 用户选择了记住参数，需要做覆盖
                        console.log('Remember this args:', formData);
                        solution = set(solution, 'defaultValues', formData);
                        updateSolution(solution);
                    }
                    return;
                }
            } else {
                webView.postMessage(responseData(message.id||'', { code: errorCode.data_no_found }, false));
                return;
            }
        } else if (message.method === methods.GET_IMG_LIST) {
            const dirPath = get(message, 'data.path');
            console.log('dirPath:', dirPath);
            let files = [];
            if(dirPath) {
                try {
                    const dirFiles = await fs.readdir(dirPath);
                    files = filter(dirFiles, file => isImg(file));
                    console.log('files:', dirFiles);
                    webView.postMessage(responseData(message.id||'', { data: files, total: files.length }, true));
                } catch (err) {
                    console.error(err);
                    webView.postMessage(responseData(message.id||'', { data: [], total: 0 }, false));
                }
            } else {
                webView.postMessage(responseData(message.id||'', { code: errorCode.required_parameter_missing }, false));
            }
        } else if (message.method === methods.GET_IMG_DETAILS) {
            const fileName = get(message, 'data.data', []);
            const rootPath = get(message, 'data.path');
            const pagination = get(message, 'data.pagination');
            console.log('fileName:', fileName);
            console.log('rootPath:', rootPath);
            console.log('pagination:', pagination);
            const baseArray: Array<any> = [];
            for(let i = 0; i < fileName.length; i++ ) {
                let filePath;
                if (rootPath) {
                    filePath = path.join(rootPath, fileName[i]);
                } else {
                    filePath = fileName[i];
                }
                try {
                    const baseText = await fs.readFile(filePath, {encoding: 'base64'});
                    baseArray.push(
                        {
                            name: fileName[i],
                            ext: getExt(fileName[i]),
                            baseText
                        }
                    );
                } catch (err) {
                    console.error(err);
                }
            }
            webView.postMessage(responseData(message.id||'', { data: baseArray, pagination }, true));
        }
    }
};

// async function test() {
//     const files = await fs.readdir('/Users/fangjianbing/work/yix/extensions/face');
//     console.log('test files==', files);
//     for(let file of files){
//         console.log('file:', file);
//         console.log('isImg:', isImg(file));
//     }
// }
// test();
