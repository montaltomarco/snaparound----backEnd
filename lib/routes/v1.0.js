"use strict";

import { getMe, getOn, getOff, getAllUsers, getTrackUsers} from "../handlers/users.js";
import { getPosts, postPost, getAllPosts } from "../handlers/posts.js";
import { getCollection, postPostInCollection, deletePostInCollection } from "../handlers/collections.js";
import { setDeviceId } from "../handlers/notifications.js";
import { welcomeUser } from "../handlers/testsRoutes.js";

export default function setupRoutes(app) {
  app.get('/', welcomeUser);

  app.get("/v1.0/allusers", getAllUsers);
  app.get("/v1.0/track/:fbUserId", getTrackUsers);
  app.get("/v1.0/me", getMe);
  app.get("/v1.0/friends/on", getOn);
  app.get("/v1.0/friends/off", getOff);

  app.get("/v1.0/allposts", getAllPosts);
  app.get("/v1.0/posts", getPosts);
  app.post("/v1.0/posts", postPost);
  app.get("/v1.0/collection", getCollection);
  app.post("/v1.0/collection/:postId", postPostInCollection);
  app.delete("/v1.0/collection/:postId", deletePostInCollection);

  app.post("/v1.0/notifications/apnDeviceId", setDeviceId);
}
