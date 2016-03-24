"use strict";

import Sequelize from "sequelize";
import config from "config";

let db;

if(config.has("db.uri")) {
  db = new Sequelize(config.get("db.uri"));
} else {
  db = new Sequelize(config.get("db.database"),
    config.get("db.username"), config.get("db.password"), {
      host: config.get("db.host"),
      dialect: config.get("db.dialect"),
      storage: config.get("db.storage")
    });
}

export default db;
