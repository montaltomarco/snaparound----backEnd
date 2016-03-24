import Promise from "bluebird";

import q from "../conn/q.js";
import {Post} from "../models/";

export default function expireJob(job, done) {
  let reschedPromise = new Promise((resolve) => { resolve(); });
  if(job.data.returnInMs) {
    // Reschedule another job
    reschedPromise = q.create("expire", {
      returnInMs: job.data.returnInMs
    }).ttl(job.data.returnInMs).delay(job.data.returnInMs).saveAsync();
  }
  let destroyPromise = Post.destroy({
    where: {
      expires: {
        $lt: new Date(),
        $not: null
      }
    }
  });
  Promise.all([reschedPromise, destroyPromise]).then(() => {
    done();
  }).catch((err) => {
    done(err);
  });
}
