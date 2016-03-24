"use strict";

import request from "supertest";
import config from "config";

import { User } from "../models";
import redis from "../conn/redis.js";

export function* getAllUsers() {
  if(!this.session.adminStatus) {
     let err = new Error("Not logged as admin");
     err.name = "AuthenticationError";
     err.status = 401;
     throw err;
   }
   else{
    const users = yield User.findAll();
    this.body = users.map((user) => {
      return {
        fbUserId: user.fbUserId,
        name: user.name,
        pic: user.pic
      };
    });
  }
}

export function* getTrackUsers() {
  if(!this.session.adminStatus) {
     let err = new Error("Not logged as admin");
     err.name = "AuthenticationError";
     err.status = 401;
     throw err;
  }
  else
  {
    let tracks = yield redis.lrangeAsync(`tracking_${this.parameter.fbUserId}`, 0, -1);
    this.body = tracks.map((track) => {
      track = JSON.parse(track);
      return {
        lat: track.lat,
        lon: track.lon,
        date: track.date
      };
    });
  }
}

export function* getMe() {
  let user = yield User.find({
    where: {fbUserId: this.session.fbUserId}
  });
  this.body = {
    fbUserId: user.fbUserId,
    name: user.name,
    pic: user.pic
  };
}

function makeFriendsRequest(token) {
  return request(config.get("facebook.apiBaseUrl"))
    .get(config.get("facebook.apiPrefix") + "/me/friends")
    .set("Accept", "application/json")
    .query({"access_token": token})
    .expect(200);
}

export function* getOn() {
  const friends = yield makeFriendsRequest(this.session.accessToken).endAsync();
  const friendsIds = friends.body.data.map((friend) => {
    return friend.id;
  });
  const usersIn = yield User.findAll({
    where: {
      fbUserId: {
        $in: friendsIds
      }
    }
  });
  this.body = usersIn.map((user) => {
    return {
      fbUserId: user.fbUserId,
      name: user.name,
      pic: user.pic
    };
  });
}

export function* getOff() {
  const friends = yield makeFriendsRequest(this.session.accessToken).endAsync();
  const friendsIds = friends.body.data.map((friend) => {
    return friend.id;
  });
  const usersOn = yield User.findAll({
    where: {
      fbUserId: {
        $in: friendsIds
      }
    },
    select: [
      "fbUserId"
    ]
  });
  const usersOnIds = usersOn.map((user) => { return user.fbUserId; });
  this.body = friends.body.data.filter((friend) => {
    return usersOnIds.indexOf(friend.id) < 0;
  }).map((friend) => {
    return {
      fbUserId: friend.id,
      name: friend.name
    };
  });
}
