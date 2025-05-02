const { isGuildBasedChannel } = require("@sapphire/discord.js-utilities");
const { SapphireClient } = require("@sapphire/framework");
const { GatewayIntentBits, Partials } = require("discord.js");
const database = require("./settingsSchema");
const settings = require("../config.json");

const { ClusterClient, getInfo } = require('discord-hybrid-sharding');

require('@sapphire/plugin-hmr/register');
const redisParse = require('./parseRedisUrl').parse();

class PhoenixClient extends SapphireClient {
  constructor() {
    super({
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
      caseInsensitiveCommands: true,
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ],
      loadDefaultErrorListeners: true,
      loadMessageCommandListeners: false,
      hmr: {
        enabled: settings.enableHmr
      },
      allowedMentions: { parse: ['everyone', 'roles', 'users'], repliedUser: false }
    });
  }

  cluster = new ClusterClient(this);

  async login(token) {
    return super.login(token);
  }

  async destroy() {
    return super.destroy();
  }
}
module.exports = {
  PhoenixClient,
};
