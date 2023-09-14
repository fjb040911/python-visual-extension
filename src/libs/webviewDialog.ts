/*
 * @Author: Jianbing.fang
 * @Date: 2022-02-17 14:56:20
 * @LastEditTime: 2022-05-29 22:59:01
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { fixResourceReferences, fixCspSourceReferences } from './utils'

/**
 * 支持传入一个html文件的路径渲染出webview
 */
export class WebviewDialog {
	public readonly panel: vscode.WebviewPanel;
	// public webview(): vscode.Webview { return this.panel.webview; }

	constructor(
		viewType: string,
		resourceRootDir: string,
		dialogHtmlFileName: string,
		iTitle?: string,
		onMessageHandle?: any,
		viewColumn?: vscode.ViewColumn,
		debugOption?: API.DebugWebView,
		webViewPanel?:vscode.WebviewPanel
	) {
		console.log('******************************************************')
		viewColumn = viewColumn || vscode.ViewColumn.One;// vscode.ViewColumn.One
		const options: vscode.WebviewOptions | vscode.WebviewPanelOptions = {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [
				vscode.Uri.file(resourceRootDir),
			]
		};

		const dialogHtmlFile = path.join(resourceRootDir, dialogHtmlFileName);
		let html = fs.readFileSync(dialogHtmlFile, { encoding: 'utf8' });
		const title = iTitle || this.extractHtmlTitle(html, 'Dialog');

		if(webViewPanel)  {
			this.panel =  webViewPanel;
			this.panel.webview.options = {
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(resourceRootDir),
				]
			};
		} else {
			this.panel = vscode.window.createWebviewPanel(
				viewType,
				title,
				viewColumn,
				options);
		}
		if(debugOption) {
			this.panel.webview.html = this.debugPanel(debugOption);
		}else {
			html = fixResourceReferences(html, resourceRootDir, this.panel.webview);
			html = fixCspSourceReferences(html, this.panel.webview);
			this.panel.webview.html = html;
		}
		// https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing
		this.panel.webview.onDidReceiveMessage((message) => {
			// console.log('onDidReceiveMessage=', message)
			// if (message.command === 'cancel') {
			// 	this.panel.dispose();
			// } else if (message.command === 'result') {
			// 	this.result = message.value as TResult;
			// 	this.panel.dispose();
			// }
			if (onMessageHandle) {
				onMessageHandle(message, this.panel.webview);
			}
		});
	}

	debugPanel(opts:API.DebugWebView){
		return `
		<!DOCTYPE html>
			<html>
			<head>
				<title>${opts.title||'未指定'}</title>
				<style>
				html,body,iframe{
					width: 100%;
					height: 100%;
					border: 0;
					overflow: hidden;
				}
				</style>
			</head>
			<body>
				<iframe src="${opts.url}" allowpaymentrequest allow="clipboard-read; clipboard-write; usb;"/>
			</body>
		</html>
		`
	}

	/**
	 *  解析 <title> 标签.
	 */
	private extractHtmlTitle(html: string, defaultTitle: string): string {
		const titleMatch = /\<title\>([^<]*)\<\/title\>/.exec(html);
		const title = (titleMatch && titleMatch[1]) || defaultTitle;
		return title;
	}

	public getPanel(): vscode.WebviewPanel {
		return this.panel
	}
	public getWebView(): vscode.Webview {
		return this.panel.webview;
	}
	public reveal(){
		return this.panel.reveal()
	}
	public postMessage(message: any){
		this.panel.webview.postMessage(message)
	}
	public setTitle(title: string) {
		this.panel.title=title;
	}
	public dispose() {
		this.panel.dispose();
	}
}
