/*eslint-disable new-cap */
"use strict";

import Sequelize from "sequelize";

import db from "../conn/db.js";
import CustomTypes from "./utils/custom-types.js";

let Aggregate = db.define("aggregate", {
  location: {
    type: CustomTypes.GEOM
  },
  count: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true
});

export default Aggregate;
