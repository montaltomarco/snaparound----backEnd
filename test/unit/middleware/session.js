"use strict";

import co from "co";
import assert from "assert";
import koa from "koa";
import config from "config";
import {createServer} from "http";

import session from "../../../lib/middleware/session.js";
import redis from "../../../lib/conn/redis.js";
import db from "../../../lib/conn/db.js";
import {User} from "../../../lib/models";

const EXISTING_SHORT_LIVED = "myExistingShortLivedToken";
const EXISTING_LONG_LIVED = "myExistingLongLivedToken";
const EXISTING_USER_ID = 0;
const NEW_SHORT_LIVED = "myNewShortLivedToken";
const NEW_LONG_LIVED = "myNewLongLivedToken";
const NEW_USER_ID = 1;
const NEW_USER_NAME = "Bobby Bob";
const NEW_USER_PIC_URL = "http://www.nyan.cat/cats/original.gif";

describe("session middleware", function() {
  before(function* initRedis() {
    yield redis.send_commandAsync("FLUSHALL", []);
    yield redis.hsetAsync(
      `session_${EXISTING_SHORT_LIVED}`,
      "accessToken", EXISTING_LONG_LIVED);
    yield redis.hsetAsync(
      `session_${EXISTING_SHORT_LIVED}`,
      "fbUserId", EXISTING_USER_ID);
  });
  before(function* initPostgres() {
    yield db.sync({force: true});
  });
  before(function* startMockApi() {
    let app = koa();
    app.use(function* check() {
      if(this.path === "/oauth/access_token"
      && this.query.grant_type === "fb_exchange_token"
      && this.query.client_id === config.get("facebook.appId")
      && this.query.client_secret === config.get("facebook.appSecret")
      && this.query.fb_exchange_token === NEW_SHORT_LIVED) {
        this.body = `access_token=${NEW_LONG_LIVED}`;
      } else if(this.path === config.get("facebook.apiPrefix") + "/me"
             && this.query.access_token === NEW_LONG_LIVED) {
        this.body = {
          id: NEW_USER_ID + "",
          name: NEW_USER_NAME,
          pic: NEW_USER_PIC_URL
        };
      } else if(this.path === config.get("facebook.apiPrefix") + "/me/picture"
             && this.query.access_token === NEW_LONG_LIVED) {
        this.status = 302;
        this.set("Location", NEW_USER_PIC_URL);
      } else {
        throw new Error("Mismatch");
      }
    });
    this.mockfb = createServer(app.callback());
    this.mockfb.listen(4000);
  });

  it("should retrieve an existing session", function* () {
    let ctx = {
      parameter: {
        authentication: `FBShort ${EXISTING_SHORT_LIVED}`
      }
    };
    yield co(session().bind(ctx));
    assert.equal(ctx.session.accessToken, EXISTING_LONG_LIVED);
    assert.equal(ctx.session.fbUserId, EXISTING_USER_ID);
  });

  it("should retrieve a new session from facebook", function* () {
    let ctx = {
      parameter: {
        authentication: `FBShort ${NEW_SHORT_LIVED}`
      }
    };
    yield co(session().bind(ctx));
    assert.equal(ctx.session.accessToken, NEW_LONG_LIVED);
    assert.equal(ctx.session.fbUserId, NEW_USER_ID);
    assert.equal(
      yield redis.hgetAsync(`session_${NEW_SHORT_LIVED}`, "accessToken"),
      NEW_LONG_LIVED);
    assert.equal(
      yield redis.hgetAsync(`session_${NEW_SHORT_LIVED}`, "fbUserId"),
      NEW_USER_ID);
    let user = yield User.find({
      where: {fbUserId: ctx.session.fbUserId}
    });
    assert.equal(user.name, NEW_USER_NAME);
    assert.equal(user.pic, NEW_USER_PIC_URL);
  });

  after(function*() {
    this.mockfb.close();
  });
});
