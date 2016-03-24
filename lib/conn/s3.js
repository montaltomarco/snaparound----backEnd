"use strict";

import s3 from "s3";
import config from "config";

export default s3.createClient({
  s3Options: {
    accessKeyId: config.get("s3.key"),
    secretAccessKey: config.get("s3.secret")
  }
});
