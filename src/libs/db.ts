import * as Loki from 'lokijs';
import { events } from '../constant';
import eventService from '../EventService';

let db: Loki | null = null;

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
  db = new Loki('VisualCli.db', {
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
