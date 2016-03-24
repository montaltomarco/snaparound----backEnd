"use strict";

import {ABSTRACT, fn, literal} from "sequelize";

class GEOM extends ABSTRACT {
  constructor(type = "Point") {
    super();
    this.type = type;
  }
  toSql() {
    return `GEOGRAPHY(${this.type}, 4326)`;
  }
}

function makePoint(lon, lat) {
  return fn("ST_MakePoint", literal(lon), literal(lat));
}

function pointsWithinCircle(lon, lat, meters, attr="location") {
  return `ST_DWithin(
            ${attr},
            ST_MakePoint(${lon}, ${lat})::geography,
            ${meters}
          )`;
}

function pointsWithinRect(minLon, minLat, maxLon, maxLat, attr="location") {
  return `${attr} &&
            ST_MakeEnvelope(${minLon}, ${minLat},
                            ${maxLon}, ${maxLat},
                            4326)`;
}

function readPoint(coord="X", to="lon", attr="location") {
  return [
    fn(`ST_${coord}`, literal(`${attr}::geometry`)),
    to
  ];
}

export default {
  GEOM: GEOM,
  makePoint: makePoint,
  pointsWithinCircle: pointsWithinCircle,
  pointsWithinRect: pointsWithinRect,
  readPoint: readPoint
};
