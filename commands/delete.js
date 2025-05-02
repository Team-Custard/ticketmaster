const { isMessageInstance } = require("@sapphire/discord.js-utilities");
const { Command, ApplicationCommandRegistry } = require("@sapphire/framework");
const { ChatInputCommandInteraction, EmbedBuilder, Colors, ChannelType, PermissionOverwrites, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { PermissionFlagsBits, InteractionContextType } = require("discord.js");
const ServerSettings = require('../tools/settingsSchema');
const discordTranscripts = require('discord-html-transcripts');
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
      builder.setName("delete").setDescription("Generates a transcript and deletes the ticket")
        .addStringOption(option => 
            option.setName('reason')
            .setDescription('The reason for closing the ticket')
            .setMaxLength(256)
            .setRequired(false)
        )
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
    const reason = interaction.options.getString('reason') || 'No reason specified';

    const ticket = db.tickets.find(t => t.channel == interaction.channel.id && t.deleted == false)
    if (!ticket) return await interaction.reply({
      embeds: [new EmbedBuilder()
      .setTitle(`:x: Error`)
      .setDescription(`Not a valid ticket or the ticket.`)
      .setColor(Colors.Red)],
      flags: ["Ephemeral"]
    });
    
    await interaction.reply({
      content: `${interaction.member} has deleted the ticket.`,
      allowedMentions: { parse: [] },
      withResponse: true
    });

    ticket.deleted = true;
    ticket.closed = true;
    await db.save();

    const attachment = await discordTranscripts.createTranscript(interaction.channel, {
      saveImages: true,
      footerText: "Ticket has {number} message{s} - Ticketmaster",
      poweredBy: false,
      ssr: true
    }).catch(() => undefined)
    
    
    if (attachment) {
      const actionRow = new ActionRowBuilder()
        .setComponents(new ButtonBuilder()
          .setCustomId('ViewTranscript')
          .setStyle(ButtonStyle.Secondary)
          .setLabel('View online')
          .setEmoji('🌐')
      )
      await interaction.guild.members.cache.get(ticket.creator)?.send({
        embeds: [new EmbedBuilder()
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL()
          })
          .setDescription(`Ticket **${ticket.id}** - ${ticket.ticketType}\n* Creator: <@${ticket.creator}>\n* Deleted by: ${interaction.member}\n* Reason: ${reason}`)
          .setFooter({ text: `Ticket created` })
          .setTimestamp(interaction.channel.createdTimestamp)
        ],
        files: [attachment],
        components: [actionRow]
      }).catch(() => undefined)

      if (db.logs.transcripts) {
        const logchannel = await interaction.guild.channels
          .fetch(db.logs.transcripts)
          .catch(() => undefined);
        if (logchannel) {
          const webhook = await webhookFetch.find(logchannel);
  
          if (!webhook) {
            console.log("Welp didn't find a webhook, sry.");
            return;
          }
  
  
          await webhook
            .send({
              content: attachment.name,
              username: this.container.client.user.username,
              avatarURL: this.container.client.user.displayAvatarURL({
                extension: "png",
                size: 512,
              }),
              files: [attachment],
              components: [actionRow]
              //embeds: [embed],
            })
            .catch((err) =>
              console.error(`[error] Error on sending webhook`, err),
            );
        }
      }
    }
    
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
            `${interaction.member} has deleted the ticket ${interaction.channel}\n**Reason:** ${reason}`,
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


    await interaction.channel.delete({ reason: `Ticket deleted by ${interaction.user.tag}` });
  }
}
module.exports = {
  PingCommand,
};
