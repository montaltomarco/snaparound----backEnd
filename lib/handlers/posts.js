"use strict";

import Promise from "bluebird";
import config from "config";
import uuidG from "uuid";
import {Notification, Device} from "apn";

import { Post, User, Aggregate, SharedPost } from "../models";
import CustomTypes from "../models/utils/custom-types.js";
import db from "../conn/db.js";
import s3 from "../conn/s3.js";
import redis from "../conn/redis.js";
import apnConn from "../conn/apn.js";


function returnPost(post) {
  let ret = {
    postId: post.id,
    createdAt: post.createdAt.toISOString(),
    lat: post.dataValues.lat,
    lon: post.dataValues.lon,
    pic: post.pic
  };
  if(post.user) {
    ret.user = {
      fbUserId: post.user.fbUserId,
      name: post.user.name,
      pic: post.user.pic
    };
  }
  if(post.expires) {
    ret.expires = post.expires.toISOString();
  }
  if(post.msg) {
    ret.msg = post.msg;
  }
  return ret;
}

export function* getAllPosts() {
  if(!this.session.adminStatus) {
     let err = new Error("Not logged as admin");
     err.name = "AuthenticationError";
     err.status = 401;
     throw err;
   }
   else{
    const posts = yield Post.findAll({
      include: [{ model: User }]
    });
    this.body = posts.map((post) => {
      return returnPost(post);
    });
  }
}

export function* getPosts() {
  /*yield redis.lpushAsync(`tracking_${this.session.fbUserId}`, JSON.stringify({
    date: new Date().toISOString(),
    lon: this.parameter.lon,
    lat: this.parameter.lat
  }));*/
  let user = yield User.find(this.session.fbUserId);
  const [aggregates, visible, sharedWithMe, myPosts] = yield Promise.all([
    Aggregate.findAll({
      where: {
        $and: [
          [CustomTypes.pointsWithinCircle(
           this.parameter.lon,
           this.parameter.lat,
           config.get("queries.hiddenRange"))],
          {
            $not: [CustomTypes.pointsWithinCircle(
                   this.parameter.lon,
                   this.parameter.lat,
                   config.get("queries.visibleRange"))]
          }
        ]
      },
      attributes: [
        "count",
        CustomTypes.readPoint("X", "lon"),
        CustomTypes.readPoint("Y", "lat")
      ]
    }),
    Post.findAll({
      where: [CustomTypes.pointsWithinCircle(
              this.parameter.lon,
              this.parameter.lat,
              config.get("queries.visibleRange"))],
      attributes: [
        "id",
        CustomTypes.readPoint("X", "lon"),
        CustomTypes.readPoint("Y", "lat"),
        "msg",
        "pic",
        "expires",
        "createdAt",
        "privatePost"
      ],
      include: [{ model: User }],
      order: [["createdAt", "DESC"]]
    }),
    user.getSharedWithMe({
      attributes: [
        "id",
        CustomTypes.readPoint("X", "lon"),
        CustomTypes.readPoint("Y", "lat"),
        "userFbUserId"
      ],
      include: [{ model: User }]
    }),
    user.getPosts({
      attributes: [
        "id",
        CustomTypes.readPoint("X", "lon"),
        CustomTypes.readPoint("Y", "lat"),
        "msg",
        "pic",
        "expires",
        "createdAt"
      ],
      include: [{ model: User }],
      order: [["createdAt", "DESC"]]
    })
  ]);
  const hidden = aggregates.concat(sharedWithMe);
  const visibleIds = visible.map((post) => post.id);
  const sharedWithMeIds = sharedWithMe.map((post) => post.id);
  this.body = {
    hidden: hidden.filter((postOrAggregate) => {
      // Delete visible sharedWithMe posts
      return !postOrAggregate.id || visibleIds.indexOf(postOrAggregate.id) < 0;
    }).map((postOrAggregate) => {
      if(postOrAggregate.user) {
        return {
          user: {
            fbUserId: postOrAggregate.user.fbUserId,
            name: postOrAggregate.user.name,
            pic: postOrAggregate.user.pic
          },
          count: 1,
          lat: postOrAggregate.dataValues.lat,
          lon: postOrAggregate.dataValues.lon
        };
      } else {
        return {
          count: postOrAggregate.count,
          lat: postOrAggregate.dataValues.lat,
          lon: postOrAggregate.dataValues.lon
        };
      }
    }),
    visible: visible.filter((post) => {
      // Delete private posts not shared with me
      return !post.privatePost || sharedWithMeIds.indexOf(post.id) >= 0;
    }).map((post) => {
      return returnPost(post);
    }),
    myPosts: myPosts.map((post) => {
      return returnPost(post);
    })
  };
}
export function* postPost() {
  // TODO: check lon/lat
  const localPt = this.parameter.pic.path;
  const extSplit = localPt.split(".");
  const ext = extSplit[extSplit.length - 1];
  const bucket = config.get("s3.bucket");
  const uuid = uuidG.v4();
  const basePt = config.get("s3.basePath");
  const s3Pt = `${basePt}${uuid}.${ext}`;
  const s3PublicUrl = `https://s3-eu-west-1.amazonaws.com/${bucket}/${s3Pt}`;
  let uploadPromise = new Promise((fulfill, reject) => {
    let uploader = s3.uploadFile({
      localFile: this.parameter.pic.path,
      s3Params: {
        Bucket: bucket,
        Key: s3Pt,
        ACL: "public-read"
      }
    });
    uploader.on("end", fulfill);
    uploader.on("error", reject);
  });
  let user = yield User.find(this.session.fbUserId);
  let savedPost;
  yield db.transaction((t) => {
    return Post.create({
      location: CustomTypes.makePoint(this.parameter.lon, this.parameter.lat),
      msg: this.parameter.msg,
      pic: s3PublicUrl,
      expires: this.parameter.expires || null,
      privatePost: ((this.parameter.sharedWith || []).length > 0)
    }, {transaction: t}).then(function(post) {
      savedPost = post;
      return post.setUser(user, {transaction: t});
    });
  });
  // Create temporary aggregate
  if(!savedPost.privatePost) {
    yield Aggregate.create({
      location: CustomTypes.makePoint(this.parameter.lon, this.parameter.lat),
      count: 1
    });
  }
  yield Promise.all((this.parameter.sharedWith || []).map((userId) => {
    return redis.getAsync(`iosdeviceid_${userId}`).then((deviceId) => {
      if(deviceId) {
        let device = new Device(deviceId);
        let notification = new Notification();
        notification.alert = `${user.name} left you a picture... Go see it!`;
        notification.payload = {
          lon: this.parameter.lon,
          lat: this.parameter.lat
        };
        apnConn.pushNotification(notification, device);
      }
      return SharedPost.create({userFbUserId: userId, postId: savedPost.id});
    });

  }));
  this.status = 201;
  this.body = {
    postId: savedPost.id,
    createdAt: savedPost.createdAt.toISOString(),
    lon: this.parameter.lon,
    lat: this.parameter.lat,
    pic: savedPost.pic,
    privatePost: savedPost.privatePost,
    user: {
      fbUserId: user.fbUserId,
      name: user.name,
      pic: user.pic
    }
  };
  if(savedPost.msg) {
    this.body.msg = savedPost.msg;
  }
  if(savedPost.expires) {
    this.body.expires = savedPost.expires.toISOString();
  }
  yield uploadPromise;
}
