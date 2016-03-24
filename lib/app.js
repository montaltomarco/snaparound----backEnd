"use strict";

import debug from "debug";
import config from "config";
import koa from "koa";
import responseTime from "koa-response-time";
import compress from "koa-compress";
import logger from "koa-logger";
import body from "koa-body";
import cors from "koa-cors";
import router from "koa-trie-router";
import reqDir from "require-dir";
import swagger from "koa-swagger";

import {} from "./models";
import session from "./middleware/session.js";
import castArray from "./middleware/cast-array.js";

var nr = false;
if(process.env.NEW_RELIC_LICENSE_KEY) {
  nr = require("newrelic");
}

export default function createApp() {
  let d = debug("app");

  let app = koa();

  if(nr) {
    app.use(function*(next) {
      nr.setTransactionName(
        this.method +
        this.path.replace(/\/[0-9]+/g, "/:id")
      );
      yield next;
    });
  }
  app.on("error", function(err){
    debug("err")(err);
    if(nr) {
      nr.noticeError(err);
    }
  });

  app.use(cors());
  if(config.get("app.logging")) {
    d("Logging requests");
    app.use(logger());
  }
  app.use(responseTime());
  if(config.get("app.compression")) {
    d("Compressing responses");
    app.use(compress());
  }
  app.use(body({
    multipart: true,
    formidable: {
      keepExtensions: true
    }
  }));

  app.use(castArray(["sharedWith", "sharedwith"]));

  const specs = reqDir("../spec");
  Object.keys(specs).map((version) => {
    d(`Registering ${version}'s swagger spec`);
    app.use(swagger(specs[version]));
  });

  app.use(session());
  app.use(router(app));

  Object.keys(specs).map((version) => {
    d(`Registering ${version}'s implementation`);
    app.get(`/${version}/spec.json`, function* serveSpec() {
      this.body = specs[version];
    });
    require(`./routes/${version}`)(app);
  });

  return app;
}
