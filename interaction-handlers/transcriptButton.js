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
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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
      if (!interaction.customId.startsWith('ViewTranscript')) return this.none();

      this.run(interaction);
    }

    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @returns 
     */
    async run(interaction) {
        const message = interaction.message;

        if (message.attachments.size == 0) return interaction.reply({
            content: ':x: No transcript found',
            flags: ['Ephemeral']
        })

        const attachment = message.attachments.first();
        const url = attachment.url.replace('cdn.discordapp.com/attachments', 'ticketmaster.sylveondev.xyz/transcript');

        const actionRow = new ActionRowBuilder()
        .setComponents(new ButtonBuilder()
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View transcript')
        )
        
        await interaction.reply({
            components: [actionRow],
            flags: ["Ephemeral"]
        })
    }
  }
  
  module.exports = {
    MenuHandler,
  };
