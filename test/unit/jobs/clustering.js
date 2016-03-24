import assert from "assert";
import Promise from "bluebird";

import db from "../../../lib/conn/db.js";
import {clusterTileJob} from "../../../lib/jobs/clustering.js";
import CustomTypes from "../../../lib/models/utils/custom-types.js";
import {Post, Aggregate} from "../../../lib/models/";

const POST_MSG = "Default Message";
const POST_PIC = "DefaultPic.jpg";
const POST_LAT = 10;
const POST_LON = 11;

describe("TileClusterJob", function() {
  before(function* initPostgres() {
    yield db.sync({force: true});
    for(let cluster = 0; cluster <= 0.1; cluster += 0.01) {
      for(let i = 0; i < 0.0005; i += 0.0001) {
        yield Post.build({
          location: CustomTypes.makePoint(
            POST_LON + cluster + i,
            POST_LAT + cluster + i),
          msg: POST_MSG,
          pic: POST_PIC
        }).save();
      }
    }
  });

  it("should generate clusters in a given tile", function*(){
    yield new Promise((fulfill) => clusterTileJob({data: {
      minLon: POST_LON,
      minLat: POST_LAT,
      maxLon: POST_LON + 1,
      maxLat: POST_LAT + 1
    }}, fulfill));
    let found = yield Aggregate.findAll();
    assert(found.length >= 4 || found.length <= 6);
  });
});
