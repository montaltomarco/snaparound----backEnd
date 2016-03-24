#!/bin/env node

// Load dotenv first
var path = require("path");
require("dotenv").config({path: path.join(__dirname, "./.env")});

// Then newrelic
if(process.env.NEW_RELIC_LICENSE_KEY) {
  require("newrelic");
}

var config = require("config");
var cluster = require("cluster");
var Promise = require("bluebird");
var kue = require("kue");
var express = require("express");
var basicAuth = require("basic-auth-connect");
var debug = require("debug")("boot");
var pack = require("./package.json");
var app = require("./lib/").app;
var q = require("./lib/conn/q.js");
var db = require("./lib/conn/db.js");
var expireJobs = require("./lib/jobs/expire.js");
var clJobs = require("./lib/jobs/clustering.js");

var clusterWorkerSize = require("os").cpus().length;

function startServer() {
  return db.sync().then(new Promise(function(fulfill) {
    debug("Starting " + pack.name + " version " + pack.version);
    app().listen(config.get("serve.port"), function () {
      debug("Bound " + pack.name + " to " + config.get("serve.host") + ":"
        + config.get("serve.port"));
      fulfill();
    });
  }));
}

function startJobProcessing() {
  debug("Starting Job Worker");
  q.process("expire", 10, expireJobs);
  q.process("clusterTile", 10, clJobs.clusterTileJob);
  q.process("clustering", 5, clJobs.clusteringJob);
}
switch(config.get("serve.mode")) {
  case "api":
    startServer();
    break;
  case "jobs":
    if (cluster.isMaster) {
      var kueApp = express();
      kueApp.use(basicAuth("admin", config.get("admin.pass")));
      kueApp.use("", kue.app);
      kueApp.listen(config.get("serve.port"));
      for (var i = 0; i < clusterWorkerSize; i += 1) {
        cluster.fork();
      }
    } else {
      startJobProcessing();
    }
    break;
  case "dual":
  default:
    if (cluster.isMaster) {
      startServer().then(function() {
        for (var j = 0; j < clusterWorkerSize; j += 1) {
          cluster.fork();
        }
      });
    } else {
      startJobProcessing();
    }
}



