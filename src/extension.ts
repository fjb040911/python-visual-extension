/*
 * @Author: Gavin 83546766@qq.com
 * @Date: 2023-09-28 15:23:21
 * @LastEditors: Gavin 83546766@qq.com
 * @LastEditTime: 2023-10-12 14:50:30
 * @FilePath: /extension-visual-cli/src/extension.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CustomEditorProvider } from './customEditor';
import * as path from 'path';
import { SolutionListViewInstance } from './view/solutionListView';
import { methods, events, SOLUTION_ITEM_CLICK, solution_actions, webDir } from './constant';
import eventService from './EventService';
import { init as solutionConfigurationViewInit } from './view/solutionConfigurationView';
import { initDb } from './libs/db';
// import { testAll } from './test/testpy';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "extension-base-editor" is now active!');
	initDb()
	context.subscriptions.push(
		CustomEditorProvider.register(context, webDir, '/'),
	);
	// vscode.window.registerTreeDataProvider('visual-solution-list', SolutionListViewInstance.getDepNodeProvider());
	const solutionListTreeView = vscode.window.createTreeView('visual-solution-list', {
		treeDataProvider: SolutionListViewInstance.getDepNodeProvider(),
	});
	eventService.on(events.SELECT_SOLUTION_ITEM, (item) => {
		if (item) {
			solutionListTreeView.reveal(item, { select: true });
		}
	});

	// visual-solution.import
	context.subscriptions.push(
		vscode.commands.registerCommand('visual-solution.import', async () => {
			eventService.emit(events.SOLUTION_CONFIGURATION, { action: solution_actions.IMPORT });
		}),
		vscode.commands.registerCommand('visual-solution.add', async () => {
			eventService.emit(events.SOLUTION_CONFIGURATION, { action: solution_actions.ADD });
		}),
		vscode.commands.registerCommand('visual-solution.edit', async (item) => {
			eventService.emit(events.SOLUTION_CONFIGURATION, { action: solution_actions.EDIT, data: {_id: item.id} });
			solutionListTreeView.reveal(item, { select: true });
		}),
		vscode.commands.registerCommand(SOLUTION_ITEM_CLICK, async (_id) => {
			eventService.emit(events.TO_OPEN_SOLUTION_VIEW, { _id });
		}),
		vscode.commands.registerCommand('visual-solution.delete', async (item) => {
			eventService.emit(events.REMOVE_SOLUTION, { _id: item.id });
		}),
		vscode.commands.registerCommand('visual-solution.export', async (item) => {
			eventService.emit(events.EXPORT_SOLUTION,  { _id: item.id });
			solutionListTreeView.reveal(item, { select: true });
		})
	)
	solutionConfigurationViewInit();
	// testAll()
}

// This method is called when your extension is deactivated
export function deactivate() {}
