// ES6 bootstrap
require("babel/register");
// Promisifications
var Promise = require("bluebird");
var request = require("supertest");
var fs = require("fs");
var kue = require("kue");
Promise.promisifyAll(request.prototype);
Promise.promisifyAll(request.Test.prototype);
Promise.promisifyAll(fs);
Promise.promisifyAll(kue.prototype);
Promise.promisifyAll(kue.Job.prototype);

exports.app = require("./app.js");
