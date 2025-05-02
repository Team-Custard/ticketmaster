const { isMessageInstance } = require("@sapphire/discord.js-utilities");
const { Command, ApplicationCommandRegistry } = require("@sapphire/framework");
const { ChatInputCommandInteraction } = require("discord.js");
const { PermissionFlagsBits, InteractionContextType } = require("discord.js");

class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      cooldownDelay: 3_000,
    });
  }

  /**
   * 
   * @param {ApplicationCommandRegistry} registry 
   */
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("ping").setDescription("Ping bot to see if it is alive")
      .setContexts(InteractionContextType.Guild)
    );
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   * @returns 
   */
  async chatInputRun(interaction) {
    const msg = await interaction.reply({
      content: `Pinging... Please wait`,
      flags: ["Ephemeral"],
      withResponse: true
    }).then(async m => { return m.resource.message });

    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);
      return interaction.editReply(
        `🏓 Pong! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`,
      );
    }

    return interaction.editReply("Failed to retrieve ping :(");
  }
}
module.exports = {
  PingCommand,
};
