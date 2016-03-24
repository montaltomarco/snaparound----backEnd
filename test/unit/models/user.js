"use strict";

import db from "../../../lib/conn/db.js";
import {User} from "../../../lib/models/";
import assert from "assert";

const USER_ID = 102913892;
const USER_NAME = "Lastname Firstname";
const USER_PIC = "picture.jpg";

describe("user", function() {
  before(function* initPostgres() {
    yield db.sync({force: true});
  });

  it("should create a new user", function* () {
    let user = User.build({
		fbUserId: USER_ID,
		name: USER_NAME,
		pic: USER_PIC
	});
	user.save();
    assert(user);
  });
});
