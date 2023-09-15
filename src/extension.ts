// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { SolutionListViewInstance } from './view/solutionListView';
import { methods, events, SOLUTION_ITEM_CLICK, solution_actions, webDir } from './constant';
import eventService from './EventService';
import { init as solutionConfigurationViewInit } from './view/solutionConfigurationView';
import { initDb } from './libs/db';
import { testAll } from './test/testpy';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "extension-base-editor" is now active!');
	initDb();
	// vscode.window.registerTreeDataProvider('visual-solution-list', SolutionListViewInstance.getDepNodeProvider());
	const solutionListTreeView = vscode.window.createTreeView('visual-solution-list', {
		treeDataProvider: SolutionListViewInstance.getDepNodeProvider(),
	});
	eventService.on(events.SELECT_SOLUTION_ITEM, (item) => {
		if (item) {
			solutionListTreeView.reveal(item, { select: true })
		}
	})

	context.subscriptions.push(
		vscode.commands.registerCommand('visual-solution.add', async () => {
			eventService.emit(events.SOLUTION_CONFIGURATION, { action: solution_actions.ADD });
		}),
		vscode.commands.registerCommand(SOLUTION_ITEM_CLICK, async (_id) => {
			eventService.emit(events.TO_OPEN_SOLUTION_VIEW, { _id });
		}),
		vscode.commands.registerCommand('visual-solution.delete', async (item) => {
			eventService.emit(events.REMOVE_SOLUTION, { _id: item.id });
		}),
		vscode.commands.registerCommand('visual-solution.edit', async (item) => {
			eventService.emit(events.SOLUTION_CONFIGURATION, { action: solution_actions.EDIT, data: {_id: item.id} });
			solutionListTreeView.reveal(item, { select: true })
		})
	)
	solutionConfigurationViewInit()
	// testAll()
}

// This method is called when your extension is deactivated
export function deactivate() {}
