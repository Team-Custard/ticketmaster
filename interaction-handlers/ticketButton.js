const {
    InteractionHandler,
    InteractionHandlerTypes,
  } = require("@sapphire/framework");
const {
    EmbedBuilder,
    Colors,
    ChannelType,
    PermissionFlagsBits,
    ButtonInteraction,
} = require("discord.js");
const ServerSettings = require("../tools/settingsSchema");
const webhookFetch = require("../tools/webhookFetch");

  
  class MenuHandler extends InteractionHandler {
    constructor(ctx, options) {
      super(ctx, {
        ...options,
        interactionHandlerType: InteractionHandlerTypes.Button,
      });
    }
  
    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @returns 
     */
    async parse(interaction) {
      if (!interaction.customId.startsWith('open')) return this.none();

      this.run(interaction);
    }

    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @returns 
     */
    async run(interaction) {
        const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();
        const options = interaction.customId.split('-');
        const ticketType = options[1];
        
        const theType = db.ticketTypes.find(r => r.name == ticketType)
        if (!theType) return await interaction.reply({
            embeds: [new EmbedBuilder()
            .setTitle(`:x: Error`)
            .setDescription(`The ticket type was not found.`)
            .setColor(Colors.Red)],
            flags: ["Ephemeral"]
        });
    
        const existed = db.tickets.find(t => t.creator == interaction.user.id && t.closed == false)
        if (existed) return await interaction.reply({
            embeds: [new EmbedBuilder()
            .setTitle(`:x: Error`)
            .setDescription(`You already have a ticket open. You must close it before you can open another one.`)
            .setColor(Colors.Red)],
            flags: ["Ephemeral"]
        });
    
        const msg = await interaction.reply({
            content: `Creating ticket...`,
            flags: ["Ephemeral"],
            withResponse: true
        })
    
        try {
            const ticket = {
                id: db.tickets.length+1,
                creator: interaction.member.id,
                ticketType: ticketType,
                claimer: null,
                closed: false,
                deleted: false,
            }
    
            const channel = await interaction.guild.channels.create({
                name: `${ticket.id}-${ticket.ticketType}`,
                type: ChannelType.GuildText,
                topic: `--- Ticketmaster ---\nTicket ${ticket.id} - Type: ${ticket.ticketType}\nCurrently ${ticket.closed ? 'closed' : 'open'}, claimed by ${ticket.claimer ? `<@${ticket.claimer}>` : 'nobody'}.`,
                parent: theType.channel,
                permissionOverwrites: [
                    {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                    id: theType.manager,
                    allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                    }
                ],
                reason: `Ticket created by ${interaction.user.id}`
            })
    
            ticket.channel = channel.id;

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
                    `${interaction.member} has created a new ticket ${channel}\n**Type:** ${ticketType}`,
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
    
            db.tickets.push(ticket);
            await db.save();
            return interaction.editReply({
                content: '',
                embeds: [new EmbedBuilder()
                .setTitle(`:heavy_check_mark: Success`)
                .setDescription(`Your ticket has been opened in ${channel}.`)
                .setColor(Colors.Green)]
            });
        }
        catch (err) {
            console.error(err);
            return interaction.editReply({
                content: '',
                embeds: [new EmbedBuilder()
                .setTitle(`:x: Error`)
                .setDescription(`Unable to open your ticket due to an error. \`${err}\`.`)
                .setColor(Colors.Red)]
            });
        }
    }
  }
  
  module.exports = {
    MenuHandler,
  };
