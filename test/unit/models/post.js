"use strict";

import db from "../../../lib/conn/db.js";
import CustomTypes from "../../../lib/models/utils/custom-types.js";
import {Post, User} from "../../../lib/models/";
import assert from "assert";

const POST_MSG = "Default Message";
const POST_PIC = "DefaultPic.jpg";
const POST_LAT = 45.114;
const POST_LON = 40.823;

const USER_ID = 102913892;
const USER_NAME = "Lastname Firstname";
const USER_PIC = "picture.jpg";

describe("posts", function() {
  before(function* initPostgres() {
    yield db.sync({force: true});
    this.user = User.build({
      fbUserId: USER_ID,
      name: USER_NAME,
      pic: USER_PIC
    });
    yield this.user.save();
  });

  it("should create a new Sent Post", function* () {
    let post = yield Post.build({
      location: CustomTypes.makePoint(POST_LAT, POST_LON),
      msg: POST_MSG,
      pic: POST_PIC
    }).save();
    yield post.setUser(this.user);
    let assertUser = yield post.getUser();
    assert.equal(assertUser.id, this.user.id);
    let assertPost = (yield this.user.getPosts())[0];
    assert.equal(assertPost.id, post.id);
  });

  it("should create new Shared with Me Posts", function* () {
    let onePost = yield Post.build({
      location: CustomTypes.makePoint(POST_LAT, POST_LON),
      msg: POST_MSG,
      pic: POST_PIC
    }).save();
    yield onePost.addSharedWith(this.user);
    let anotherPost = yield Post.build({
      location: CustomTypes.makePoint(POST_LAT, POST_LON),
      msg: POST_MSG,
      pic: POST_PIC
    }).save();
    yield anotherPost.addSharedWith(this.user);
    let sharedWithUser = (yield onePost.getSharedWith())[0];
    assert.equal(sharedWithUser.id, this.user.id);
    let sharedWithMePost = yield this.user.getSharedWithMe();
    assert.equal(sharedWithMePost[0].id, onePost.id);
    assert.equal(sharedWithMePost[1].id, anotherPost.id);
  });

  it("should create a new Collected Post", function* () {
    let post = yield Post.build({
      location: CustomTypes.makePoint(POST_LAT, POST_LON),
      msg: POST_MSG,
      pic: POST_PIC
    }).save();
    yield post.setCollectedBy(this.user);
    let collectedByUser = yield post.getCollectedBy();
    assert.equal(collectedByUser.id, this.user.id);
    let collectedPost = (yield this.user.getCollectedPosts())[0];
    assert.equal(collectedPost.id, post.id);
  });

});
