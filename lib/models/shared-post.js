/*eslint-disable new-cap */
"use strict";

import Sequelize from "sequelize";
import db from "../conn/db.js";

let SharedPost = db.define("shared_posts", {
  userFbUserId: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: false
  },
  postId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    unique: false
  }
});

export default SharedPost;
