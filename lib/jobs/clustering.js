import config from "config";
import kmeans from "node-kmeans";
import Promise from "bluebird";

import q from "../conn/q.js";
import {Post, Aggregate} from "../models/";
import CustomTypes from "../models/utils/custom-types.js";

function clusterTileJob(job, done) {
  Post.findAll({
    where: {
      $and: [
        [CustomTypes.pointsWithinRect(
          job.data.minLon,
          job.data.minLat,
          job.data.maxLon,
          job.data.maxLat
        )],
        { privatePost: false }
      ]
    },
    attributes: [
      CustomTypes.readPoint("X", "lon"),
      CustomTypes.readPoint("Y", "lat")
    ]
  }).then((posts) => {
    const points = posts.map((post) => {
      return [post.dataValues.lon, post.dataValues.lat];
    });
    return new Promise((fulfill, reject) => {
      const k = Math.round(Math.sqrt(points.length));
      if(k < 1) {
        return fulfill([]);
      }
      kmeans.clusterize(
        points,
        {k: k},
        (err, result) => {
          if(err && !result) {
            return reject(err);
          }
          fulfill(result);
        });
    });
  }).then((clusters) => {
    return Aggregate.destroy({
      where:
        [CustomTypes.pointsWithinRect(
          job.data.minLon,
          job.data.minLat,
          job.data.maxLon,
          job.data.maxLat)]
    }).then(
      Promise.all(clusters.map((cluster) => {
      return Aggregate.create({
        location: CustomTypes.makePoint(
          cluster.centroid[0], cluster.centroid[1]),
        count: cluster.cluster.length
      });
    })));
  }).then(() => {
    done();
  }).catch((err) => {
    done(err);
  });
}

function clusteringJob(job, done) {
  let reschedPromise = new Promise((resolve) => { resolve(); });
  if(job.data.returnInMs) {
    // Reschedule another job
    reschedPromise = q.create("clustering", {
      returnInMs: job.data.returnInMs
    }).ttl(job.data.returnInMs).delay(job.data.returnInMs).saveAsync();
  }
  reschedPromise.then(() => {
    let subjobPromises = [];
    for(let lon = -180; lon <= 180;
        lon += parseFloat(config.get("clustering.lonSz"))) {
      for(let lat = -90; lat <= 90;
          lat += parseFloat(config.get("clustering.latSz"))) {
        subjobPromises.push(q.create("clusterTile", {
          minLon: lon,
          maxLon: lon + parseFloat(config.get("clustering.latSz")),
          minLat: lat,
          maxLat: lat + parseFloat(config.get("clustering.latSz"))
        }).ttl(job.data.returnInMs).saveAsync());
      }
      job.progress(lon + 180, 360);
    }
    return Promise.all(subjobPromises);
  }).then(() => {
    done();
  }).catch((err) => {
    done(err);
  });
}

export default {
  clusterTileJob: clusterTileJob,
  clusteringJob: clusteringJob
};
