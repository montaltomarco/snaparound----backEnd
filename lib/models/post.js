/*eslint-disable new-cap */
"use strict";

import Sequelize from "sequelize";

import db from "../conn/db.js";
import CustomTypes from "./utils/custom-types.js";

let Post = db.define("post", {
  location: {
    type: CustomTypes.GEOM
  },
  msg: {
    type: Sequelize.STRING(511)
  },
  pic: {
    type: Sequelize.STRING(512)
  },
  expires: {
    type: Sequelize.DATE
  },
  privatePost: {
    type: Sequelize.BOOLEAN
  }
}, {
  freezeTableName: true
});

export default Post;
