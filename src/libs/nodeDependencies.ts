import * as vscode from 'vscode';
import * as path from 'path';
import { findIndex, find } from 'lodash';

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private options: Dependency[]) {
		this.options = options;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	getDependencys(): Array<Dependency> {
		return this.options;
	}

	getChildren(element?: Dependency): vscode.ProviderResult<Dependency[]> {
		if (element === undefined) {
			return this.options;
		}
		return element.children;
	}

	getParent(element: Dependency): vscode.ProviderResult<Dependency> {
		return element;
	}

	getItem(id: string) {
		const item = find(this.options, item => item.id === id);
		if (item) {
			return item;
		}
		return null;
	}

	/**
	 * 往后增加节点
	 * @param element 
	 */
	addItem(element: Dependency) {
		this.options.push(element)
	}
	/**
	 * 删除指定id的节点
	 * @param id 
	 */
	removeItem(id: string) {
		const itemIndex = findIndex(this.options, item => item.id === id)
		if (itemIndex !== -1) {
			this.options.splice(itemIndex, 1)
		}
	}
	/**
	 * 清空
	 */
	clearItems() {
		this.options = []
	}
	/**
	 * 覆盖所有项目
	 * @param options 
	 */
	coverItems(options: Dependency[]) {
		this.options = options
	}
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly id: string,
		public readonly label: string,
		public readonly icon: string,
		public readonly children?: Dependency[] | undefined,
		// public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command,
		public readonly cValue?: string
	) {
		super(label);
		// super(label, collapsibleState);

		this.icon = icon;
		this.cValue = cValue;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'assets', 'light', this.icon),
		dark: path.join(__filename, '..', '..', 'assets', 'dark', this.icon)
	};

	contextValue = this.cValue;
}
