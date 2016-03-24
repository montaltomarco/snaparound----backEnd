"use strict";

import co from "co";
import assert from "assert";

import castArray from "../../../lib/middleware/cast-array.js";

describe("castArray middleware", function() {
  it("should cast a given parameter to array", function* () {
    let ctx = {
      request: {
        body: {
          fields: {
            "bob": "bob,bobby,bobette"
          }
        }
      }
    };
    yield co(castArray(["bob"]).bind(ctx));
    assert.equal(ctx.request.body.fields.bob.length, 3);
  });
});
