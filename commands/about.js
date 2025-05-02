const { Command, ApplicationCommandRegistry } = require("@sapphire/framework");
const { BucketScope } = require("@sapphire/framework");
const { Colors } = require("discord.js");
const { EmbedBuilder, InteractionContextType } = require("discord.js");
const { ChatInputCommandInteraction } = require("discord.js");
const { PermissionFlagsBits } = require("discord.js");
const ServerSettings = require('../tools/settingsSchema');

class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
    });
  }

  /**
   * 
   * @param {ApplicationCommandRegistry} registry 
   */
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("about").setDescription("Displays info and the stats on the bot")
      .setContexts(InteractionContextType.Guild)
    );
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async chatInputRun(interaction) {
    const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();
    if (!db) await ServerSettings.create({ _id: interaction.guild.id });
    interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle('About Ticketmaster')
            .setColor(Colors.DarkVividPink)
            .setDescription(`Ticketmaster is a bot by Team Custard that allows you to easily manage tickets in your server.`)
            .addFields([
                {name: `Stats`, value: `**Guilds:** ${this.container.client.guilds.cache.size}\n`+
                `**Users:** ${this.container.client.users.cache.size}\n`+
                `**Uptime:** <t:${Math.floor((Date.now() - this.container.client.uptime) / 1000)}:R>`}
            ])
            .setThumbnail(this.container.client.user.displayAvatarURL({ size: 512 }))
        ],
        flags: ["Ephemeral"]
    })
  }
}
module.exports = {
  PingCommand,
};
