/*
 * @Author: Gavin 83546766@qq.com
 * @Date: 2023-09-28 15:21:39
 * @LastEditors: Gavin 83546766@qq.com
 * @LastEditTime: 2023-10-12 14:20:54
 * @FilePath: /extension-visual-cli/src/constant.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as path from 'path';

export const methods = {
    PAGE_STATUS: 'PAGE_STATUS',
    ROUTER: 'ROUTER',
    SET_STORE: 'SET_STORE',
    DATA_UPDATE: 'DATA_UPDATE', // 数据更新
    SELECTE_FOLDER: 'SELECTE_FOLDER', // 选择文件
    ADD_ITEM: 'ADD_ITEM', // 新增数据
    DEL_ITEM: 'DEL_ITEM', // 删除数据
    CSV_UPDATE: 'CSV_UPDATE', //更新csv文件
    ADD_OR_UPDATE_SOLUTION: 'ADD_OR_UPDATE_SOLUTION',
    EXECUTE_SCRIPT: 'EXECUTE_SCRIPT', // 执行脚本请求
    GET_IMG_LIST: 'GET_IMG_LIST', // 获取目录下的图片列表
    GET_IMG_DETAILS: 'GET_IMG_DETAILS', // 获取图片详情
}

// solution节点被点击
export const SOLUTION_ITEM_CLICK = 'SOLUTION_ITEM_CLICK';
// TEST页面的id
export const SOLUTION_VIEW_ID = 'SOLUTION_VIEW_ID'

export const events = {
    DB_READY: "DB_READY",
    SOLUTION_CONFIGURATION: 'SOLUTION_CONFIGURATION', // 打开或者聚焦到SOLUTION添加或者编辑页面
    SOLUTION_IMPORT: 'SOLUTION_IMPORT', // 触发导入的动作
    ON_ADDED_OR_UPDATE_SOLUTION: 'ON_ADDED_OR_UPDATE_SOLUTION', // 有新增或者修改SOLUTION
    TO_OPEN_SOLUTION_VIEW: 'TO_OPEN_SOLUTION_VIEW', // 去打开一个新solution的面板
    SELECT_SOLUTION_ITEM: 'SELECT_SOLUTION_ITEM', // 设置选中一个 solution 的样式
    REMOVE_SOLUTION: 'REMOVE_SOLUTION', // 删除solution
    EXPORT_SOLUTION: 'EXPORT_SOLUTION', // 导出solution
};

export const solution_actions = {
    ADD: 'ADD',
    EDIT: 'EDIT',
    REMOVE: 'REMOVE',
    IMPORT: 'IMPORT'
};

export const ext = 'solution'; // 定义导入导出文件的扩展格式

export const webDir = path.resolve(__dirname, '../web-dist');
