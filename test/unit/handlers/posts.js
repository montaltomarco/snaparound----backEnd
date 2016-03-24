"use strict";

import co from "co";
import assert from "assert";
import path from "path";
import request from "supertest";

import { getPosts, postPost, getAllPosts } from "../../../lib/handlers/posts.js";
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

const OTHER_2_ID = 2;
const OTHER_2_NAME = "Fourmi Fourmette";
const OTHER_2_PIC_URL = "http://www.nyan.cat/cats/new.gif";

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
const KFET_MSG = "Drinking a beer";
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
    yield User.build({
      fbUserId: OTHER_2_ID,
      name: OTHER_2_NAME,
      pic: OTHER_2_PIC_URL
    }).save();
    let other = yield User.build({
      fbUserId: OTHER_ID,
      name: OTHER_NAME,
      pic: OTHER_PIC_URL
    }).save();
    yield Post.build({
      location: CustomTypes.makePoint(RHINO_LON, RHINO_LAT),
      msg: RHINO_MSG,
      pic: PIC_URL,
      privatePost: false
    }).save().then((post) => {
      post.setUser(other);
      user.addSharedWithMe(post);
    });
    yield Post.build({
      location: CustomTypes.makePoint(TO_LON, TO_LAT),
      msg: TO_MSG,
      pic: PIC_URL,
      privatePost: false
    }).save().then((post) => {
      post.setUser(other);
      user.addSharedWithMe(post);
    });
    yield Post.build({
      location: CustomTypes.makePoint(ELEPHANTS_LON, ELEPHANTS_LAT),
      msg: ELEPHANTS_MSG,
      pic: PIC_URL,
      privatePost: true
    }).save().then((post) => post.setUser(user));
    yield Post.build({
      location: CustomTypes.makePoint(ELEPHANTS_LON, ELEPHANTS_LAT),
      msg: ELEPHANTS_MSG,
      pic: PIC_URL,
      privatePost: false
    }).save().then((post) => post.setUser(user));
  });

  describe("getAllPosts endpoint", function() {
    it("should retrieve all posts from db", function*() {
      let ctx = {
        session: SESSION_STATE,
        parameter: {
          lon: KFET_LON,
          lat: KFET_LAT
        }
      };
      ctx.session.adminStatus = true;
      yield co(getAllPosts.bind(ctx));
      assert.equal(ctx.body.length, 4);
    });
  });

  describe("getPosts endpoint", function() {
    it("should show visible and hidden posts", function*() {
      let ctx = {
        session: SESSION_STATE,
        parameter: {
          lon: KFET_LON,
          lat: KFET_LAT
        }
      };
      yield co(getPosts.bind(ctx));
      assert.equal(ctx.body.hidden.length, 1);
      assert.equal(ctx.body.visible.length, 1);
      assert.equal(ctx.body.myPosts.length, 2);
      assert.equal(ctx.body.visible[0].msg, RHINO_MSG);
      assert.equal(ctx.body.hidden[0].user.name, OTHER_NAME);
    });
  });

  describe("postPosts endpoint", function() {
    it("should create a new private post shared with friends", function*() {
      let ctx = {
        session: SESSION_STATE,
        parameter: {
          lon: KFET_LON,
          lat: KFET_LAT,
          msg: RHINO_MSG,
          pic: {path: PIC_URL},
          sharedWith: [OTHER_ID, OTHER_2_ID]
        }
      };

      yield co(postPost.bind(ctx));
      assert(ctx.body.postId > 0);
      assert.equal(ctx.body.privatePost, true);
      assert.equal(ctx.body.lon, KFET_LON);
      assert.equal(ctx.body.lat, KFET_LAT);
      assert.equal(ctx.body.msg, RHINO_MSG);
      assert(/https:\/\/s3\.amazonaws\.com.*?\.js/.test(ctx.body.pic));
      assert.equal(ctx.body.user.fbUserId, USER_ID);
      assert.equal(ctx.body.user.name, USER_NAME);
      assert.equal(ctx.body.user.pic, USER_PIC_URL);
      let fromDb = yield Post.find({
        where: {id: ctx.body.postId},
        include: [User],
        attributes: [
          "id",
          CustomTypes.readPoint("X", "lon"),
          CustomTypes.readPoint("Y", "lat"),
          "msg",
          "pic"
        ]
      });
      const sharedwith = yield fromDb.getSharedWith();
      assert.equal(sharedwith.length, 2);
      assert.equal(sharedwith[0].fbUserId, OTHER_2_ID);
      assert.equal(sharedwith[1].fbUserId, OTHER_ID);
      assert.equal(fromDb.msg, RHINO_MSG);
      assert.equal(fromDb.pic, ctx.body.pic);
      assert.equal(fromDb.user.fbUserId, USER_ID);
      assert.equal(fromDb.user.name, USER_NAME);
      assert.equal(fromDb.user.pic, USER_PIC_URL);
      assert.equal(fromDb.dataValues.lon, KFET_LON);
      assert.equal(fromDb.dataValues.lat, KFET_LAT);
      const s3Host = "https://s3.amazonaws.com";
      yield request(s3Host)
        .get(ctx.body.pic.substr(s3Host.length))
        .expect(200)
        .endAsync();
    });
  });

 describe("postPost endpoint", function() {
    it("should create a new public post", function*() {
      let ctx = {
        session: SESSION_STATE,
        parameter: {
          lon: KFET_LON,
          lat: KFET_LAT,
          msg: KFET_MSG,
          pic: {path: PIC_URL},
          sharedWith: []
        }
      };
      yield co(postPost.bind(ctx));
      assert(ctx.body.postId > 0);
      assert.equal(ctx.body.privatePost, false);
      assert.equal(ctx.body.lon, KFET_LON);
      assert.equal(ctx.body.lat, KFET_LAT);
      assert.equal(ctx.body.msg, KFET_MSG);
      assert(/https:\/\/s3\.amazonaws\.com.*?\.js/.test(ctx.body.pic));
      assert.equal(ctx.body.user.fbUserId, USER_ID);
      assert.equal(ctx.body.user.name, USER_NAME);
      assert.equal(ctx.body.user.pic, USER_PIC_URL);
      let fromDb = yield Post.find({
        where: {id: ctx.body.postId},
        include: [User],
        attributes: [
          CustomTypes.readPoint("X", "lon"),
          CustomTypes.readPoint("Y", "lat"),
          "msg",
          "pic"
        ]
      });
      assert.equal(fromDb.msg, KFET_MSG);
      assert.equal(fromDb.pic, ctx.body.pic);
      assert.equal(fromDb.user.fbUserId, USER_ID);
      assert.equal(fromDb.user.name, USER_NAME);
      assert.equal(fromDb.user.pic, USER_PIC_URL);
      assert.equal(fromDb.dataValues.lon, KFET_LON);
      assert.equal(fromDb.dataValues.lat, KFET_LAT);
      const s3Host = "https://s3.amazonaws.com";
      yield request(s3Host)
        .get(ctx.body.pic.substr(s3Host.length))
        .expect(200)
        .endAsync();
    });
  });
});
