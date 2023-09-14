import * as vscode from 'vscode';
import { getNonce, fixResourceReferences, fixCspSourceReferences, notificationData, responseData } from './libs/utils';
import * as fs from 'fs';
import * as path from 'path';
import { get } from 'lodash';
import { methods } from './constant';

/**
 * Provider for cat scratch editors.
 * 
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 * 
 * This provider demonstrates:
 * 
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class CustomEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext, resourceRootDir: string, router: string): vscode.Disposable {
		const provider = new CustomEditorProvider(context, resourceRootDir, router);
		const providerRegistration = vscode.window.registerCustomEditorProvider(CustomEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'customs.eform';

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly resourceRootDir: string,
		private readonly router: string,
	) { }

	/**
	 * Called when our custom editor is opened.
	 * 
	 * 
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		const updateWebview = async () => {
			webviewPanel.webview.postMessage(notificationData(methods.DATA_UPDATE, { document: await this.getDocumentAsJson(document) }));
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(async e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		const messageHandle = async (message: API.IMessage) => {
			if (message.notification) {
				if (message.method === methods.PAGE_STATUS) {
					// 页面状态的通知
					if (message.data === 'ready') {
						// 改变路由和发送页面数据
						webviewPanel.webview.postMessage(notificationData(methods.ROUTER, this.router));
						updateWebview();
					}
				} else if (message.method === methods.CSV_UPDATE) {
					this.csvDataUpdate(document, message.data);
				}
			}
			if (message.request) {
				// 收到请求
				// 在这里扩展你的业务逻辑。 下列代码是例子
				if (message.method === methods.SELECTE_FOLDER) {
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
					webviewPanel.webview.postMessage(responseData(message.id || '', { fileUri }, true));
				}

				// else if ( message.method === methods.ADD_ITEM ) {
				//     // 新增数据的测试案例
				//     this.addNewItem(document, message.data);
				//     webviewPanel.webview.postMessage(responseData(message.id||'', { document: this.getDocumentAsJson(document) }, true));
				// } else if ( message.method === methods.DEL_ITEM ) {
				//     this.deleteItem(document, message.data);
				//     webviewPanel.webview.postMessage(responseData(message.id||'', { document: this.getDocumentAsJson(document) }, true));
				// }
			}
		}

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(messageHandle);
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to script and css for the webview
		const dialogHtmlFile = path.join(this.resourceRootDir, 'index.html');
		let html = fs.readFileSync(dialogHtmlFile, { encoding: 'utf8' });
		html = fixResourceReferences(html, this.resourceRootDir, webview);
		html = fixCspSourceReferences(html, webview);
		return html
	}
	private async csvDataUpdate(document: vscode.TextDocument, data: any) {
		return this.updateTextDocument(document, data);
	}

	/**
	 * Add a new scratch to the current document.
	 */
	// private async addNewItem(document: vscode.TextDocument, item: any) {
	// 	const json = await this.getDocumentAsJson(document);
	// 	json.items = [
	// 		...(Array.isArray(json.items) ? json.items : []),
	// 		{
	// 			id: getNonce(),
	// 			text: item.text,
	// 			created: Date.now(),
	// 		}
	// 	];

	// 	return this.updateTextDocument(document, json);
	// }


	/**
	 * Write out the json to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, json: any) {
		console.log('updateTextDocument:', json)
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(json, null, 2)
		);

		return vscode.workspace.applyEdit(edit);
	}
}
