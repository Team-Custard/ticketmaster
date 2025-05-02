const settings = require("./config.json");
const { ClusterManager } = require('discord-hybrid-sharding');
require("dotenv").config();

require('./server');

new ClusterManager(`${__dirname}/bot.js`, {
      totalShards: 'auto',
      shardsPerClusters: 4,
      // totalClusters: 7,
      mode: 'process',
      token: process.env['TOKEN'],
    })
    .on('clusterCreate', cluster => console.log(`Launched Cluster ${cluster.id}`))
    .spawn({ timeout: -1 });