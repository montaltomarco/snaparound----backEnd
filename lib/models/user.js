/*eslint-disable new-cap */
"use strict";

import Sequelize from "sequelize";

import db from "../conn/db.js";

let User = db.define("user", {
  fbUserId: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoincrement: true
  },
  name: {
    type: Sequelize.STRING(127),
    allowNull: false
  },
  pic: {
    type: Sequelize.STRING(512),
    allowNull: false
  }
}, {
  freezeTableName: true
});

export default User;
