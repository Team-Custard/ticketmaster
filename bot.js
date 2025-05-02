const { PhoenixClient } = require("./tools/PhoenixClient");
const fs = require("fs");
const { fork } = require("child_process");
const { ClusterClient } = require('discord-hybrid-sharding');

require("./tools/database").connect();

const client = new PhoenixClient();
client.cluster.on("ready", (cluster) => {
    console.log(`Cluster ${cluster.id} is ready.`);
});

client.login(process.env.TOKEN);