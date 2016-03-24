require("../lib/");

var config = require("config");
var q = require("../lib/conn/q.js");

var expRefresh = parseInt(config.get("expire.refresh")) * 60 * 1000;

q.create("expire", {
  returnInMs: expRefresh
}).ttl(expRefresh).save(function() {
  console.log("done!");
});
