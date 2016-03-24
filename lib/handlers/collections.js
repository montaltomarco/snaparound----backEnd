"use strict";

import { Post, User } from "../models";
import CustomTypes from "../models/utils/custom-types.js";

export function* getCollection() {
  this.body = [];
  let user = yield User.find({
    where: {fbUserId: this.session.fbUserId}
  });
  let collectedPosts = yield user.getCollectedPosts({
    attributes: [
      "id",
      "createdAt",
      CustomTypes.readPoint("X", "lon"),
      CustomTypes.readPoint("Y", "lat"),
      "msg",
      "pic"
    ],
    include: [{ model: User }],
    order: [["createdAt", "DESC"]]
  });
  this.body = collectedPosts.map((post) => {
    let r = {
      postId: post.id,
      createdAt: post.createdAt.toISOString(),
      lat: post.dataValues.lat,
      lon: post.dataValues.lon,
      pic: post.pic,
      user: {
        fbUserId: post.user.fbUserId,
        name: post.user.name,
        pic: post.user.pic
      }
    };
    if(post.msg) {
      r.msg = post.msg;
    }
    if(post.expires) {
      r.expires = post.expires.toISOString();
    }
    return r;
  });
}

export function* postPostInCollection () {
  let user = yield User.find({
    where: {fbUserId: this.session.fbUserId}
  });
  let post = yield Post.find({
    where: {id: this.parameter.postId},
    attributes: [
      "id",
      "createdAt",
      CustomTypes.readPoint("X", "lon"),
      CustomTypes.readPoint("Y", "lat"),
      "msg",
      "pic"
    ],
    include: [{ model: User }]
  });
  if(!post) {
    let err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  //TODO : Check if user is currently close enough to post to add the post to his collection
  this.status = 201;
  yield user.addCollectedPosts(post);
  this.body = {
    postId: post.id,
    createdAt: post.createdAt.toISOString(),
    user: {
      fbUserId: post.user.fbUserId,
      name: post.user.name,
      pic: post.user.pic
    },
    lat: post.dataValues.lat,
    lon: post.dataValues.lon,
    pic: post.pic
  };
  if(post.msg) {
    this.body.msg = post.msg;
  }
  if(post.expires) {
    this.body.expires = post.expires.toISOString();
  }
}

export function* deletePostInCollection () {
  let user = yield User.find({
    where: {fbUserId: this.session.fbUserId}
  });
  let post = yield Post.find({
    where: {id: this.parameter.postId}
  });
  if(!post) {
    let err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  this.status = 204;
  yield post.removeCollectedBy(user);
  this.body = "";
}
