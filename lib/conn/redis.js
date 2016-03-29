"use strict";

import redis from "redis";
import config from "config";
import Promise from "bluebird";


let conn;

if(process.env.REDIS_URL) {
    conn = redis.createClient(
        config.get("redisHER.port"),
        config.get("redisHER.host"),
        {
            "auth_pass": config.get("redisHER.password")
        });
}else{
    conn = redis.createClient(
        config.get("redis.port"),
        config.get("redis.host"),
        {
            "auth_pass": config.get("redis.password")
        });
}

Promise.promisifyAll(conn);

export default conn;
