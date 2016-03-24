require("../lib/");

var config = require("config");
var q = require("../lib/conn/q.js");

var cluRefresh = parseInt(config.get("clustering.refresh")) * 60 * 1000;

q.create("clustering", {
  returnInMs: cluRefresh
}).ttl(cluRefresh).save(function() {
  console.log("done");
});
