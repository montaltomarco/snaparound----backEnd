import kue from "kue";
import config from "config";
import Promise from "bluebird";

let q = kue.createQueue({
  redis: {
    port: config.get("redis.port"),
    host: config.get("redis.host"),
    auth: config.get("redis.password")
  }
});
Promise.promisifyAll(q);
export default q;
