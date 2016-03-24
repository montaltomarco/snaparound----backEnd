"use strict";

import redis from "../conn/redis.js";

export function* setDeviceId() {
  yield redis.setAsync(`iosdeviceid_${this.session.fbUserId}`,
    this.parameter.iosDeviceId);
  this.body = "OK";
}
