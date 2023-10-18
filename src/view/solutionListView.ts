import * as vscode from 'vscode';
import { set, get, omit } from 'lodash';
import * as path from 'path';
import * as fs from 'fs/promises';
import eventService from '../EventService';
import { DepNodeProvider, Dependency } from '../libs/nodeDependencies';
import { querySolutions, queryOneSolution, removeOneSolution } from '../server/solutionService';
import { notificationData, formartEfromLayout, formartUri } from '../libs/utils';
import { SOLUTION_ITEM_CLICK, events, methods, webDir, ext } from '../constant';
import { WebviewDialog } from '../libs/webviewDialog';
import { apiHandle } from '../libs/commonApi';

const nullName = '未命名';
class SolutionList {
    private depNodeProvider;
    private openedViews: any;

    constructor() {
        this.depNodeProvider = new DepNodeProvider([]);
        this.handleEvent();
        this.openedViews = {};
    }

    getDepNodeProvider(){
        return this.depNodeProvider;
    }
    
    /**
     * 处理事件监听
     */
    handleEvent() {
        eventService.on(events.DB_READY, () => {
            // 数据库初始化完毕
            this.toGetData();
        });
        eventService.on(events.ON_ADDED_OR_UPDATE_SOLUTION, (data) => {
            // solution 数据有更改
            const { solution } = data;
            this.closePanel(solution._id)
            // 刷新列表
            this.toGetData()
            // 再打开新的
            this.openPanel.bind(this)(solution);
            this.openedViews[solution._id].setTitle(solution.name)
        });
        eventService.on(events.TO_OPEN_SOLUTION_VIEW, (data) => {
            const { _id } = data;
            const solutionObj = queryOneSolution({ _id })
            if (solutionObj) {
                this.openPanel.bind(this)(solutionObj);
            } else {
                console.error('solutionObj is no found:', data);
            }
        });
        eventService.on(events.REMOVE_SOLUTION, ({ _id })=>{
            const solutionObj = queryOneSolution({ _id });
            if (solutionObj) {
                removeOneSolution(solutionObj);
                this.closePanel(solutionObj._id);
                this.toGetData();
            } else {
                console.error('solutionObj is no found:', _id);
            }
        });
        eventService.on(events.EXPORT_SOLUTION, async ({ _id })=>{
            const fileUri = await vscode.window.showSaveDialog({
                filters: {
                    'solutions': [ ext ]
                }
            });
            const savePath = get(fileUri, 'path');
            if (savePath) {
                let fpath = formartUri(savePath);
                const solutionObj = queryOneSolution({ _id });
                if (solutionObj) {
                    const fileExt = path.extname(fpath);
                    if(fileExt !== `.${ext}`) {
                        fpath = `${fpath}.${ext}`;
                    }
                    const saveObj = omit(solutionObj, ['$loki', '_id']);
                    let writeData = JSON.stringify(saveObj, null, 2);
                    fs.writeFile(fpath, writeData);
                } else {
                    console.error('solutionObj is no found:', _id);
                }
            }
        });
    }

    closePanel(panelId: string){
        if (this.openedViews[panelId]) {
            // 销毁已有的页面
            this.openedViews[panelId].dispose();
            if(this.openedViews[panelId]) {
                delete this.openedViews[panelId];
            }
        }
    }

    getCommand(element: any): vscode.Command {
        return {
            title: element.name,
            command: SOLUTION_ITEM_CLICK,
            tooltip: element.name,
            arguments: [
                element._id
            ]
        }
    }

    /**
     * 打开页面后的出来
     * @param router 要跳转的路由
     * @param onReady 跳转后要处理的事务
     * @returns 
     */
    private generateMessageHandle = (router?: string, onReady?: any) => {
        if (!router) {
            router = '/'
        }
        return async (message: any, webView: vscode.Webview) => {
            if (message.request) {
                apiHandle(message, webView);

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

    openPanel(solution: any) {
        if (this.openedViews[solution._id]) {
            this.openedViews[solution._id].reveal();
            return
        }
        const onReady = async (webView: vscode.Webview) => {
            const newFormDataLayout = await formartEfromLayout(solution);
            let newSolution = { ...solution }
            newSolution = set(newSolution, 'eformData', newFormDataLayout);
            console.log('newFormDataLayout:', newFormDataLayout);
            webView.postMessage(notificationData(methods.SET_STORE, { name: 'solution', payload: { solution: newSolution } }));
        }
        this.openedViews[solution._id] = new WebviewDialog(solution._id, webDir, 'index.html', solution.name || nullName, this.generateMessageHandle('/solution', onReady), vscode.ViewColumn.One,undefined, undefined, true);
        let panel = this.openedViews[solution._id].getPanel();
        panel.onDidDispose(() => {
            console.log('页面销毁monitor:', solution._id);
            if(this.openedViews[solution._id]) {
                delete this.openedViews[solution._id];
            } 
        });
        eventService.emit(events.SELECT_SOLUTION_ITEM, this.depNodeProvider.getItem(solution._id));
    }

    async toGetData() {
        // console.log('toGetTopo----');
        const solutionData = querySolutions() || [];
        console.log('solutionData----', solutionData);
        this.refreshNodes(solutionData);
    }
    refreshNodes(nodes: Array<any>) {
        let dnodes: Dependency[] = [];
        if (nodes.length > 0) {
            dnodes = nodes.map((element: any): Dependency => new Dependency(element._id + '', element.name || nullName, '', [], this.getCommand(element), 'solution'));
        }
        this.depNodeProvider.coverItems(dnodes);
        this.depNodeProvider.refresh();
    }
}

export const SolutionListViewInstance = new SolutionList();
