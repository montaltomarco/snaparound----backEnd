"use strict";

import Sequelize from "sequelize";
import config from "config";

let db;

if(process.env.DATABASE_URL) {
    db = new Sequelize(process.env.DATABASE_URL, {
        dialect: config.get("db.dialect"),
        storage: config.get("db.storage"),
        dialectOptions: {
            ssl: true
        }
    });

} else if(config.has("db.uri")) {
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
