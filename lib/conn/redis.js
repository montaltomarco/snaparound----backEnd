"use strict";

import redis from "redis";
import config from "config";
import Promise from "bluebird";

let conn = redis.createClient(
  config.get("redis.port"),
  config.get("redis.host"),
  {
    "auth_pass": config.get("redis.password")
  });
Promise.promisifyAll(conn);

export default conn;
