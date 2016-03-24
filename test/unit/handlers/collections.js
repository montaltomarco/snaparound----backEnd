"use strict";

import co from "co";
import assert from "assert";
import path from "path";

import { getCollection, postPostInCollection, deletePostInCollection } from "../../../lib/handlers/collections.js";
import db from "../../../lib/conn/db.js";
import { User, Post } from "../../../lib/models";
import CustomTypes from "../../../lib/models/utils/custom-types.js";

const LONG_LIVED = "myExistingLongLivedToken";
const USER_ID = 0;
const USER_NAME = "Bobby Bob";
const USER_PIC_URL = "http://www.nyan.cat/cats/original.gif";
const OTHER_ID = 1;
const OTHER_NAME = "Bobette Bob";
const OTHER_PIC_URL = "http://www.nyan.cat/cats/new.gif";
const RHINO_MSG = "Rhino";
const RHINO_LON = 45.783355;
const RHINO_LAT = 4.874814;
const TO_MSG = "Tete d'Or";
const TO_LON = 45.780187;
const TO_LAT = 4.851229;
const ELEPHANTS_MSG = "The Place to Be";
const ELEPHANTS_LON = 45.566582;
const ELEPHANTS_LAT = 5.922963;
const KFET_LON = 45.783897;
const KFET_LAT = 4.874524;
const PIC_URL = path.join(__dirname, "./users.js");

const SESSION_STATE = {
  accessToken: LONG_LIVED,
  fbUserId: USER_ID
};

describe("posts handlers", function() {
  before(function* initPostgres() {
    yield db.sync({force: true});
    let user = yield User.build({
      fbUserId: USER_ID,
      name: USER_NAME,
      pic: USER_PIC_URL
    }).save();
    let other = yield User.build({
      fbUserId: OTHER_ID,
      name: OTHER_NAME,
      pic: OTHER_PIC_URL
    }).save();
    yield Post.build({
      location: CustomTypes.makePoint(RHINO_LON, RHINO_LAT),
      msg: RHINO_MSG,
      pic: PIC_URL
    }).save().then((post) => {
      post.setUser(other);
      post.setCollectedBy(user);
    });
    yield Post.build({
      location: CustomTypes.makePoint(TO_LON, TO_LAT),
      msg: TO_MSG,
      pic: PIC_URL
    }).save().then((post) => {
      post.setUser(other);
      post.setCollectedBy(user);
    });
    yield Post.build({
      location: CustomTypes.makePoint(ELEPHANTS_LON, ELEPHANTS_LAT),
      msg: ELEPHANTS_MSG,
      pic: PIC_URL
    }).save().then((post) => {
      post.setUser(other);
    });
  });

  describe("getCollections endpoint", function() {
    it("should return my collection", function*() {
      let ctx = {
        session: SESSION_STATE
      };
      yield co(getCollection.bind(ctx));
      assert.equal(ctx.body.length, 2);
      assert.equal(ctx.body[0].msg, TO_MSG);
      assert.equal(ctx.body[0].user.name, OTHER_NAME);
    });
  });

  describe("add a Post in my collection endpoint", function() {
    it("should add a newly collected post to my collection", function*() {
      let ctx = {
        session: SESSION_STATE,
        parameter: {
          lon: KFET_LON,
          lat: KFET_LAT,
          postId: 3
        }
      };
      yield co(postPostInCollection.bind(ctx));
      yield co(getCollection.bind(ctx));
      assert.equal(ctx.body.length, 3);
      assert.equal(ctx.body[2].msg, RHINO_MSG);
      assert.equal(ctx.body[2].user.name, OTHER_NAME);
    });
  });

  describe("remove a Post in my collection endpoint", function() {
    it("should remove a post collected from my collection", function*() {
      let ctx = {
        session: SESSION_STATE,
        parameter: {
          postId: 3
        }
      };
      yield co(deletePostInCollection.bind(ctx));
      yield co(getCollection.bind(ctx));
      assert.equal(ctx.body.length, 2);
    });
  });

});
