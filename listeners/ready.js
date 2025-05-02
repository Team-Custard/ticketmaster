const { Listener } = require("@sapphire/framework");
const { ActivityType, Client } = require("discord.js");

class ReadyListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      once: true,
      event: "ready",
    });
  }
  /**
   * 
   * @param {Client} client 
   */
  run(client) {
    const { username, id } = client.user;
    this.container.logger.info(
      `Bot client successfully started as ${username} (${id})`,
    );
    client.user.setActivity({
      name: `tickets 🎟️`,
      type: ActivityType.Listening,
    });
  }
}
module.exports = {
  ReadyListener,
};