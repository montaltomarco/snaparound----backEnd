"use strict";
import Post from "./post.js";
import User from "./user.js";
import Aggregate from "./aggregate.js";
import SharedPost from "./shared-post.js";

Post.belongsTo(User);
User.hasMany(Post);

User.belongsToMany(Post, {
  as: "CollectedPosts",
  through: "collected_posts"
});

Post.belongsToMany(User, {
  as: "CollectedBy",
  through: "collected_posts"
});

User.belongsToMany(Post, {
  as: "SharedWithMe",
  through: "shared_posts"
});

Post.belongsToMany(User, {
  as: "SharedWith",
  through: "shared_posts"
});

export default {
  User: User,
  Post: Post,
  Aggregate: Aggregate,
  SharedPost: SharedPost
};
