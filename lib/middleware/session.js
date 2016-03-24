"use strict";

import request from "supertest";
import config from "config";
import qs from "querystring";

import redis from "../conn/redis.js";
import User from "../models/user.js";

export default function createMiddleware(prefix = "session_") {
  return function* (next) {
    this.session = {};

    if(!this.parameter) {
      this.parameter = {};
      if(next) {
        yield next;
      }
      return;
    }

    const authHeader = this.parameter.authentication.split(" ");
    const authType = authHeader[0];
    const authKey = authHeader[1];
    if(authType === "FBShort") {
      const redisKey = `${prefix}${authKey}`;
      this.session.accessToken = yield redis.hgetAsync(redisKey, "accessToken");
      this.session.fbUserId = yield redis.hgetAsync(redisKey, "fbUserId");

      if(!this.session.accessToken) {
        const fbResponse = yield request(config.get("facebook.apiBaseUrl"))
          .get("/oauth/access_token")
          .query({
            "grant_type": "fb_exchange_token",
            "client_id": config.get("facebook.appId"),
            "client_secret": config.get("facebook.appSecret"),
            "fb_exchange_token": authKey
          })
          .endAsync();
        this.session.accessToken = qs.parse(fbResponse.text).access_token;
        yield redis.hsetAsync(redisKey, "accessToken",
          this.session.accessToken);
      }

      if(!this.session.fbUserId) {
        const fbUserResponse = yield request(config.get("facebook.apiBaseUrl"))
          .get(config.get("facebook.apiPrefix") + "/me")
          .set("Accept", "application/json")
          .redirects(5)
          .query({
            "access_token": this.session.accessToken
          })
          .endAsync();
        this.session.fbUserId = fbUserResponse.body.id;
        const fbPicResponse = yield request(config.get("facebook.apiBaseUrl"))
          .get(`${config.get("facebook.apiPrefix")}/me/picture`)
          .set("Accept", "application/json")
          .query({
            "access_token": this.session.accessToken
          })
          .expect(302)
          .endAsync();
        let pic = null;
        if(fbPicResponse.header.location) {
          pic = fbPicResponse.header.location;
        }
        yield User.findOrCreate({
          where: {
            fbUserId: this.session.fbUserId
          },
          defaults: {
            name: fbUserResponse.body.name,
            pic: pic
          }
        });
        yield redis.hsetAsync(redisKey, "fbUserId",
          this.session.fbUserId);
      }
    } else if(authType === "ADMPass") {
      if(authKey === config.get("admin.pass")) {
        this.session.adminStatus = true;
      }
    }

    if(!this.session.fbUserId && !this.session.accessToken
       && !this.session.adminStatus) {
      let err = new Error("Unable to match facebook token");
      err.name = "AuthenticationError";
      err.status = 401;
      throw err;
    }

    if(next) {
      yield next;
    }
  };
}
