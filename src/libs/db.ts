/*
 * @Author: Gavin 83546766@qq.com
 * @Date: 2023-09-28 15:21:39
 * @LastEditors: Gavin 83546766@qq.com
 * @LastEditTime: 2023-10-04 21:54:06
 * @FilePath: /extension-visual-cli/src/libs/db.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as Loki from 'lokijs';
import { events } from '../constant';
import eventService from '../EventService';
import * as path from 'path';
import * as fs from 'fs';
const packageInfo = require('../../package.json');

let db: Loki | null = null;

const userHome = process.env.HOME||process.env.USERPROFILE||'';

const appDir = path.join(userHome, packageInfo.name);

const makeAppDir = ()=>{
  if (fs.existsSync(appDir)) {
    console.log('App dir already exit');
    return;
  }
  fs.mkdirSync(appDir);
};

makeAppDir();

// 定义要被初始化的表
const collections: API.Collections = {
  VISUALCLI: 'visualcli',
};

const getCollection = (collectionName: string) => {
  console.log('db:',db)
  let cc = db?.getCollection(collectionName);
  if (!cc) {
    cc = db?.addCollection(collectionName);
  }
  console.log('getCollection:', cc)
  return cc;
};

const databaseInitialize = () => {
  for (let p in collections) {
    if (collections.hasOwnProperty(p)) {
      getCollection(collections[p]);
    }
  }
  eventService.emit(events.DB_READY)
};

/**
 * 新建数据库
 */
const initDb = () => {
  db = new Loki(path.join(appDir, 'VisualCli.db'), {
    autoload: true,
    autosave: true,
    autosaveInterval: 4000,
    persistenceMethod: "fs",
    autoloadCallback: databaseInitialize,
  });
  // console.log('db----', db);
};

export {
  initDb, 
  db, 
  getCollection, 
  collections
};

// module.exports = { initDb, db, getCollection, collections,  };
