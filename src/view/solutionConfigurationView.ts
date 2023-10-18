import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { v1 } from 'uuid';
import { get } from 'lodash';
import { WebviewDialog } from '../libs/webviewDialog';
import { notificationData, responseData, formartUri } from '../libs/utils';
import { SOLUTION_VIEW_ID, methods, events, webDir, solution_actions, ext } from '../constant';
import eventService from '../EventService';
import { apiHandle } from '../libs/commonApi';
import { insertSolution, updateSolution, queryOneSolution } from '../server/solutionService';
import { errorCode } from '../errorCode';

let panelInstance: any;

const generateMessageHandle = (router?: string, onReady?: any) => {
    if (!router) {
        router = '/'
    }
    return async (message: any, webView: vscode.Webview) => {
        if (message.request) {
            // 收到API请求
            // 先处理公共的API
            apiHandle(message, webView);
            if (message.method === methods.ADD_OR_UPDATE_SOLUTION) {
                // 新增或者更改 solution
                console.log('ADD_SOLUTION=', message.data);
                if(!message.data.name) {
                    webView.postMessage(responseData(message.id, { code: errorCode.required_parameter_missing }, false));
                    return;
                }
                const solutionObj: API.Isolution = { ...message.data };
                if(!solutionObj._id) {
                    // 新增solution
                    solutionObj._id = v1();
                    const addResult = insertSolution(solutionObj);
                    console.log('ADD_SOLUTION RESULT=', addResult);
                    if (addResult.$loki) {
                        // 新增成功                      
                        webView.postMessage(responseData(message.id, { result: addResult }, true));
                        eventService.emit(events.ON_ADDED_OR_UPDATE_SOLUTION, { solution: addResult });
                        panelInstance.dispose();
                    } else {
                        webView.postMessage(responseData(message.id, { result: 'fail' }, false));
                    }
                } else {
                    // 更改solution
                    const updateResult = updateSolution(solutionObj);
                    console.log('updateResult=', updateResult);
                    if (updateResult.$loki) {
                        // 更新成功                      
                        webView.postMessage(responseData(message.id, { result: updateResult }, true));
                        eventService.emit(events.ON_ADDED_OR_UPDATE_SOLUTION, { solution: updateResult });
                        panelInstance.dispose();
                    } else {
                        let upResult = 'fail';
                        if (updateResult.code) {
                            upResult = updateResult;
                        }
                        webView.postMessage(responseData(message.id, { result: upResult }, false));
                    }
                }
            }
        }
        if (message.notification) {
            // 收到通知
            if (message.method === methods.PAGE_STATUS) {
                // 页面状态的通知
                if (message.data === 'ready') {
                    webView.postMessage(notificationData(methods.ROUTER, { router, lan: vscode.env.language }));
                    onReady && onReady(webView);
                }
            }
        }
    }
}


function openDialog(router?: string, onReady?: any, title?: string) {
    let panelTitle = title||'New Solution';
    if (panelInstance) {
        console.log('页面存在', panelInstance.getWebView());
        panelInstance.reveal();
        panelInstance.setTitle(title);
        onReady && onReady(panelInstance.getWebView());
    } else {
        console.log('页面不存在，打开新的');
        panelInstance = new WebviewDialog(SOLUTION_VIEW_ID, webDir, 'index.html', panelTitle, generateMessageHandle(router, onReady), vscode.ViewColumn.One, undefined, undefined, true);
        let panel = panelInstance.getPanel();
        panel.onDidDispose(() => {
            console.log('页面销毁');
            panelInstance = null;
        });
    }
}

function viewCtlHandle() {
    eventService.on(events.SOLUTION_CONFIGURATION, async (message) => {
        console.log('OPEN_FOCUS_CONFIG_PANEL:', message);
        if (message.action === solution_actions.ADD) {
            openDialog('/upsert',
            ( webView: vscode.Webview)=>{
                webView.postMessage(notificationData(methods.SET_STORE, { name: 'upsertSolution', payload: {} }));
            },
            'ADD Solution')
        } else if (message.action === solution_actions.EDIT) {
            const solutionObj = queryOneSolution({ _id: message.data._id });
            if (solutionObj) {
                openDialog('/upsert', 
                ( webView: vscode.Webview)=>{
                    webView.postMessage(notificationData(methods.SET_STORE, { name: 'upsertSolution', payload: solutionObj }));
                },
                'Edit Solution'
                );
            } else {
                console.error('solutionObj is no found:', message.data);
            }
        } else if (message.action === solution_actions.IMPORT) {
            let fileOptions: vscode.OpenDialogOptions = {
                canSelectMany: false,
                openLabel: 'Select',
                canSelectFiles: true,
                canSelectFolders: false,
                filters: {
                    solutions: [ ext ]
                }
            };
            const fileUri = await vscode.window.showOpenDialog(fileOptions);
            console.log('IMPORT solutionText:', fileUri);
            const filePath = get(fileUri, [0, 'path']);
            if (filePath) {
                let fpath = formartUri(filePath);
                const solutionText = await fs.readFile(fpath, {encoding: 'utf8'});
                console.log('solutionText:', solutionText);
                if (solutionText) {
                    try {
                        const solutionObj = JSON.parse(solutionText);
                        openDialog('/upsert', 
                        ( webView: vscode.Webview)=>{
                            webView.postMessage(notificationData(methods.SET_STORE, { name: 'upsertSolution', payload: solutionObj }));
                        },
                        'Edit Solution'
                        );
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    });
}

export const init = () => {
    viewCtlHandle()
}