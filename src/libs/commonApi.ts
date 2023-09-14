import * as vscode from 'vscode';
import { PythonShell, Options } from 'python-shell';
import { get, find, keys, set } from 'lodash';
import { responseData, jsonToFormData, formartUri } from './utils';
import { methods } from '../constant';
import { queryOneSolution, updateSolution } from '../server/solutionService';
import { errorCode } from '../errorCode';
import logOutput from './log.service';

const EFORM_KEY = 'eform'

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
                resolve(['RUN script error', get(e, 'message', ''),'>更多请查看 OUTPUT>EVAS-VISUAL-CLI 输出日志'])
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
            }
            const selectOptions = get(message, 'data.options')
            if (selectOptions) {
                options = { ...options, ...selectOptions }
            }
            const fileUri = await vscode.window.showOpenDialog(options)
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
                        const argObj = jsonToFormData(formData, '_')
                        const argObjKeys = argsData.map((item: string)=>item.replace('.', '_'));
                        args = argObjKeys.map((item: string)=>{
                            return `--${item}=${argObj[item]}`
                        })
                    }
                    const exeData: API.IExeData= {
                        script: execution.path,
                        options: {
                            args
                        }
                    }
                    let exeResult = await apiExe('python', exeData);
                    if(!exeResult) {
                        exeResult = [];
                    }
                    webView.postMessage(responseData(message.id||'', { result: exeResult }, true));
                    if(data.remember) {
                        // 用户选择了记住参数，需要做覆盖
                        console.log('Remember this args:', formData)
                        solution = set(solution, 'eformData.defaultValues', formData);
                        updateSolution(solution);
                    }
                    return;
                }
            } else {
                webView.postMessage(responseData(message.id||'', { code: errorCode.data_no_found }, false));
                return;
            }
        }
    }
}
