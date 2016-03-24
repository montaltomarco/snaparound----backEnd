import assert from "assert";
import Promise from "bluebird";

import db from "../../../lib/conn/db.js";
import expireJob from "../../../lib/jobs/expire.js";
import CustomTypes from "../../../lib/models/utils/custom-types.js";
import {Post, User} from "../../../lib/models/";

const POST_MSG = "Default Message";
const POST_PIC = "DefaultPic.jpg";
const POST_LAT = 45.114;
const POST_LON = 40.823;

const USER_ID = 102913892;
const USER_NAME = "Lastname Firstname";
const USER_PIC = "picture.jpg";

describe("ExpireJob", function() {
  before(function* initPostgres() {
    yield db.sync({force: true});
    this.user = User.build({
      fbUserId: USER_ID,
      name: USER_NAME,
      pic: USER_PIC
    });
    yield this.user.save();
    const now = new Date();
    yield Post.build({
      location: CustomTypes.makePoint(POST_LAT, POST_LON),
      msg: POST_MSG,
      pic: POST_PIC,
      expires: new Date(now.getTime() + 10000)
    }).save();
    yield Post.build({
      location: CustomTypes.makePoint(POST_LAT, POST_LON),
      msg: POST_MSG,
      pic: POST_PIC,
      expires: new Date(now.getTime() - 10000)
    }).save();
    yield Post.build({
      location: CustomTypes.makePoint(POST_LAT, POST_LON),
      msg: POST_MSG,
      pic: POST_PIC
    }).save();
  });

  it("should delete expired jobs", function*(){
    yield new Promise((fulfill) => expireJob({data: {}}, fulfill));
    let found = yield Post.findAll();
    assert.equal(found.length, 2);
  });
});
