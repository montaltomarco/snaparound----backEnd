// Test bootstrap

// ES6 bootstrap
require("babel/register");
// Load dotenv
var path = require("path");
require("dotenv").config({path: path.join(__dirname, "./.env")});
// Generators in tests
require("co-mocha");
// Promisifications
var Promise = require("bluebird");
var request = require("supertest");
var fs = require("fs");
Promise.promisifyAll(request.prototype);
Promise.promisifyAll(request.Test.prototype);
Promise.promisifyAll(fs);

// Require Tests
var requireDir = require("require-dir");
requireDir(__dirname, {recurse: true});
