import kue from "kue";
import config from "config";
import Promise from "bluebird";


let port;
let host;
let password;

console.log("HEROKU VALUE IS "+process.env.HEROKU);

if(process.env.HEROKU) {
    port = config.get("redisHER.port"),
    host = config.get("redisHER.host"),
    password = config.get("redisHER.password");
} else {
    port = config.get("redis.port"),
    host = config.get("redis.host"),
    password = config.get("redis.password");
}

let q = kue.createQueue({
  redis: {
    port: port,
    host: host,
    auth: password
  }
});
Promise.promisifyAll(q);
export default q;
