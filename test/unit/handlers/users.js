"use strict";

import co from "co";
import assert from "assert";
import koa from "koa";
import config from "config";
import {createServer} from "http";

import redis from "../../../lib/conn/redis.js";
import { getPosts } from "../../../lib/handlers/posts.js";
import { getMe, getOn, getOff, getAllUsers, getTrackUsers } from "../../../lib/handlers/users.js";
import db from "../../../lib/conn/db.js";
import { User } from "../../../lib/models";

const LONG_LIVED = "myExistingLongLivedToken";
const USER_ID = "0";
const USER_NAME = "Bobby Bob";
const USER_PIC_URL = "http://www.nyan.cat/cats/original.gif";
const ON_FRIEND_ID = "1";
const ON_FRIEND_NAME = "Bobette Bob";
const ON_FRIEND_PIC_URL = "http://www.nyan.cat/cats/new.gif";
const OFF_FRIEND_ID = "2";
const OFF_FRIEND_NAME = "Bobbu Bob";
const USER_LAT = 45.118;
const USER_LON = 46.234;
const SESSION_STATE = {
  accessToken: LONG_LIVED,
  fbUserId: USER_ID
};

describe("users handler", function() {
  before(function* initPostgres() {
    yield redis.send_commandAsync("FLUSHALL", []);
    yield db.sync({force: true});
    yield User.build({
      fbUserId: USER_ID,
      name: USER_NAME,
      pic: USER_PIC_URL
    }).save();
    yield User.build({
      fbUserId: ON_FRIEND_ID,
      name: ON_FRIEND_NAME,
      pic: ON_FRIEND_PIC_URL
    }).save();
  });
  before(function* startMockApi() {
    let app = koa();
    app.use(function* check() {
      if(this.path === config.get("facebook.apiPrefix") + "/me/friends"
      && this.query.access_token === LONG_LIVED) {
        this.body = {data: [
          {
            id: ON_FRIEND_ID,
            name: ON_FRIEND_NAME
          },
          {
            id: OFF_FRIEND_ID,
            name: OFF_FRIEND_NAME
          }
        ]};
      } else {
        throw new Error("Mismatch");
      }
    });
    this.mockfb = createServer(app.callback());
    this.mockfb.listen(4000);
  });

  describe("getAll Users", function() {
    it("should return all users", function* () {
      let ctx = {session: SESSION_STATE};
      ctx.session.adminStatus = true;
      yield co(getAllUsers.bind(ctx));
      assert.equal(ctx.body.length, 2);
      assert.deepEqual(ctx.body[0], {
        fbUserId: USER_ID,
        name: USER_NAME,
        pic: USER_PIC_URL
      });
      assert.deepEqual(ctx.body[1], {
        fbUserId: ON_FRIEND_ID,
        name: ON_FRIEND_NAME,
        pic: ON_FRIEND_PIC_URL
      });
    });
  });


  describe("Track Users", function() {
    it.skip("should track user with fbUserId", function* () {
      let ctx = {
        session: SESSION_STATE,
        parameter: {
          fbUserId: USER_ID,
          lat: USER_LAT,
          lon: USER_LON
        }
      };
      yield co(getPosts.bind(ctx));
      yield co(getPosts.bind(ctx));
      ctx.session.adminStatus = true;
      yield co(getTrackUsers.bind(ctx));
      assert.equal(ctx.body.length, 2);
      assert.deepEqual(ctx.body[0].lat, USER_LAT);
      assert.deepEqual(ctx.body[0].lon, USER_LON);
      assert.deepEqual(ctx.body[1].lat, USER_LAT);
      assert.deepEqual(ctx.body[1].lon, USER_LON);
    });
  });

  describe("getMe endpoint", function() {
    it("should return current user data", function* () {
      let ctx = {session: SESSION_STATE};
      yield co(getMe.bind(ctx));
      assert.deepEqual(ctx.body, {
        fbUserId: USER_ID,
        name: USER_NAME,
        pic: USER_PIC_URL
      });
    });
  });

  describe("getOn endpoint", function() {
    it("should return Facebook friends on SnapAround", function* () {
      let ctx = {session: SESSION_STATE};
      yield co(getOn.bind(ctx));
      assert.deepEqual(ctx.body, [{
        fbUserId: ON_FRIEND_ID,
        name: ON_FRIEND_NAME,
        pic: ON_FRIEND_PIC_URL
      }]);
    });
  });

  describe("getOff endpoint", function() {
    it("should return Faceboook friends off SnapAround", function* () {
      let ctx = {session: SESSION_STATE};
      yield co(getOff.bind(ctx));
      assert.deepEqual(ctx.body, [{
        fbUserId: OFF_FRIEND_ID,
        name: OFF_FRIEND_NAME
      }]);
    });
  });

  after(function*() {
    this.mockfb.close();
  });
});
