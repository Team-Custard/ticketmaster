const { isMessageInstance } = require("@sapphire/discord.js-utilities");
const { Command, ApplicationCommandRegistry } = require("@sapphire/framework");
const { ChatInputCommandInteraction, EmbedBuilder, Colors, ChannelType, PermissionOverwrites } = require("discord.js");
const { PermissionFlagsBits, InteractionContextType } = require("discord.js");
const ServerSettings = require('../tools/settingsSchema');
const webhookFetch = require("../tools/webhookFetch");

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
      builder.setName("reopen").setDescription("Reopens a previously closed ticket")
      .setContexts(InteractionContextType.Guild)
    );
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   * @returns 
   */
  async chatInputRun(interaction) {
    const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();

    const ticket = db.tickets.find(t => t.channel == interaction.channel.id && t.closed == true)
    if (!ticket) return await interaction.reply({
      embeds: [new EmbedBuilder()
      .setTitle(`:x: Error`)
      .setDescription(`Not a valid ticket or the ticket is not closed.`)
      .setColor(Colors.Red)],
      flags: ["Ephemeral"]
    });

    ticket.closed = false;
    await interaction.channel.permissionOverwrites.edit(ticket.creator, { SendMessages: true });
    await db.save();

    if (db.logs.audit) {
      const logchannel = await interaction.guild.channels
        .fetch(db.logs.audit)
        .catch(() => undefined);
      if (logchannel) {
        const webhook = await webhookFetch.find(logchannel);

        if (!webhook) {
          console.log("Welp didn't find a webhook, sry.");
          return;
        }
        const embed = new EmbedBuilder()
          .setAuthor({
            name: interaction.member.user.username,
            iconURL: interaction.member.user.displayAvatarURL({ dynamic: true, size: 256 }),
          })
          .setDescription(
            `${interaction.member} has reopened the ticket ${interaction.channel}`,
          )
          .setColor(Colors.Purple)
          .setTimestamp(new Date());

        await webhook
          .send({
            // content: '',
            username: this.container.client.user.username,
            avatarURL: this.container.client.user.displayAvatarURL({
              extension: "png",
              size: 512,
            }),
            embeds: [embed],
          })
          .catch((err) =>
            console.error(`[error] Error on sending webhook`, err),
          );
      }
    }

    await interaction.reply({
      content: `${interaction.member} has reopened the ticket.`,
      allowedMentions: { parse: [] },
      withResponse: true
    });
  }
}
module.exports = {
  PingCommand,
};
