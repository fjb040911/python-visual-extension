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
    EXECUTE_SCRIPT: 'EXECUTE_SCRIPT' // 执行脚本请求
}

// solution节点被点击
export const SOLUTION_ITEM_CLICK = 'SOLUTION_ITEM_CLICK';
// TEST页面的id
export const SOLUTION_VIEW_ID = 'SOLUTION_VIEW_ID'

export const events = {
    DB_READY: "DB_READY",
    SOLUTION_CONFIGURATION: 'SOLUTION_CONFIGURATION', // 打开或者聚焦到SOLUTION添加或者编辑页面
    ON_ADDED_OR_UPDATE_SOLUTION: 'ON_ADDED_OR_UPDATE_SOLUTION', // 有新增或者修改SOLUTION
    TO_OPEN_SOLUTION_VIEW: 'TO_OPEN_SOLUTION_VIEW', // 去打开一个新solution的面板
    SELECT_SOLUTION_ITEM: 'SELECT_SOLUTION_ITEM', // 设置选中一个 solution 的样式
    REMOVE_SOLUTION: 'REMOVE_SOLUTION', // 删除solution
}

export const solution_actions = {
    ADD: 'ADD',
    EDIT: 'EDIT',
    REMOVE: 'REMOVE'
}

export const webDir = path.resolve(__dirname, '../web-dist');
