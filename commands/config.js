const { Command, ApplicationCommandRegistry } = require("@sapphire/framework");
const { BucketScope } = require("@sapphire/framework");
const { Subcommand } = require("@sapphire/plugin-subcommands");
const { Colors, ButtonBuilder, ButtonStyle, ComponentType, ActionRowBuilder } = require("discord.js");
const { EmbedBuilder, InteractionContextType } = require("discord.js");
const { ChatInputCommandInteraction } = require("discord.js");
const { PermissionFlagsBits } = require("discord.js");
const ServerSettings = require('../tools/settingsSchema');

class PingCommand extends Subcommand {
  constructor(context, options) {
    super(context, {
      ...options,
      subcommands: [
        {
            name: 'setup-type',
            chatInputRun: 'chatInputSetupType'
        },
        {
          name: 'delete-type',
          chatInputRun: 'chatInputDeleteType'
        },
        {
          name: 'attach-button',
          chatInputRun: 'chatInputAttachButton'
        },
        {
          name: 'attach-list',
          chatInputRun: 'chatInputAttachList'
        },
        {
          name: 'log-channel',
          chatInputRun: 'chatInputLogChannel'
        }
      ],
      requiredUserPermissions: [PermissionFlagsBits.ManageGuild]
    });
  }

  /**
   * 
   * @param {ApplicationCommandRegistry} registry 
   */
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("config").setDescription("Configures the bot")
      .addSubcommand(subcommand => subcommand
        .setName('setup-type')
        .setDescription('Creates or modifies a ticket type')
        .addStringOption(option => option
            .setName('name')
            .setDescription('The name of the ticket type')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option => option
            .setName('method')
            .setDescription('How the ticket is made')
            .setChoices([
                { name: 'channels - classic and orginized', value: 'channel' },
                //{ name: 'threads - better for large servers', value: 'thread' },
            ])
            .setRequired(true)
        )
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('The channel where this type is created')
            .setRequired(true)
        )
        .addRoleOption(option => option
            .setName('manager')
            .setDescription('The role that can manage this type')
            .setRequired(true)
        )
      )
      .addSubcommand(subcommand => subcommand
        .setName('delete-type')
        .setDescription('Deletes a ticket type')
        .addStringOption(option => option
            .setName('name')
            .setDescription('The name of the ticket type')
            .setRequired(true)
            .setAutocomplete(true)
        )
      )
      .addSubcommand(subcommand => subcommand
        .setName('attach-button')
        .setDescription('Adds a button to open a ticket to an embed')
        .addStringOption(option => option
            .setName('name')
            .setDescription('The name of the ticket type')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option => option
            .setName('message_id')
            .setDescription('The message to attach to. Must be a ticketmaster message')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('label')
            .setDescription('The label for the button')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('color')
            .setDescription('The color of the button')
            .setChoices([
              {name: 'blue', value: 'Primary'},
              {name: 'grey', value: 'Secondary'},
              {name: 'green', value: 'Success'},
              {name: 'red', value: 'Danger'}
            ])
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('emoji')
            .setDescription('The emoji to use')
            .setRequired(false)
        )
      )
      .addSubcommand(subcommand => subcommand
        .setName('attach-list')
        .setDescription('Adds a drop down menu of ticket types')
        .addStringOption(option => option
            .setName('names')
            .setDescription('The names of the ticket types separated by a comma')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('message_id')
            .setDescription('The message to attach to. Must be a ticketmaster message')
            .setRequired(true)
        )
      )
      .addSubcommand(subcommand => subcommand
        .setName('log-channel')
        .setDescription('Sets the log and transcript channels')
        .addChannelOption(option => option
          .setName('channel')
          .setDescription('The channel where logs will go')
          .setRequired(true)
        )
        .addChannelOption(option => option
          .setName('transcripts')
          .setDescription('The channel where transcripts go')
          .setRequired(true)
        )
      )
      .setContexts(InteractionContextType.Guild)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    );
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async chatInputSetupType(interaction) {
    const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();
    const existing = db.ticketTypes.find(r => r.name == interaction.options.getString('name'))
    if (existing) {
        existing.name = interaction.options.getString('name');
        existing.method = interaction.options.getString('method'),
        existing.channel = interaction.options.getChannel('channel').id,
        existing.manager = interaction.options.getRole('manager').id
        
        await db.save();
        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle(':heavy_check_mark: Success')
                .setColor(Colors.Green)
                .setDescription(`Ticket type was updated successfully.`)
            ],
            flags: ["Ephemeral"]
        })
    }

    db.ticketTypes.push({
        name: interaction.options.getString('name'),
        method: interaction.options.getString('method'),
        channel: interaction.options.getChannel('channel').id,
        manager: interaction.options.getRole('manager').id,
    })
    await db.save()
    interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle(':heavy_check_mark: Success')
            .setColor(Colors.Green)
            .setDescription(`Ticket type was created successfully.`)
        ],
        flags: ["Ephemeral"]
    })
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async chatInputDeleteType(interaction) {
    const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();
    const existing = db.ticketTypes.find(r => r.name == interaction.options.getString('name'))
    if (existing) {
        db.ticketTypes.splice(db.ticketTypes.findIndex(r => r.name == interaction.options.getString('name')), 1)
        await db.save();
        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle(':heavy_check_mark: Success')
                .setColor(Colors.Green)
                .setDescription(`Ticket type was deleted successfully.`)
            ],
            flags: ["Ephemeral"]
        })
    }
    interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle(':x: Error')
            .setColor(Colors.Red)
            .setDescription(`Ticket type was not found.`)
        ],
        flags: ["Ephemeral"]
    })
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async chatInputAttachButton(interaction) {
    const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();
    const existing = db.ticketTypes.find(r => r.name == interaction.options.getString('name'))
    if (existing) {
        console.log('L')
        const button = new ButtonBuilder()
        .setLabel(interaction.options.getString('label') || existing.name)
        .setCustomId(`open-${existing.name}`)
        .setEmoji(interaction.options.getString('emoji'))
        .setStyle(ButtonStyle[interaction.options.getString('color')] || ButtonStyle.Secondary)
        console.log('L')
        const message = await interaction.channel.messages.fetch(interaction.options.getString('message_id'));
        if (message.components.length >= 4) return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle(':x: Error')
                .setColor(Colors.Red)
                .setDescription(`The message has too many components. You have to create a new message to attach to.`)
            ],
            flags: ["Ephemeral"]
        })
        console.log('L')

        try {
          if (!message.components.length) {
            const components = message.components.map(c => c);
            const actionRow = new ActionRowBuilder()
            .setComponents(button)
            components.push(actionRow);
            await message.edit({ components: components });
          }
          else {
            const components = message.components.map(c => c);
            components.at(components.length - 1).components.push(button);
            await message.edit({ components: components });
          }
        }
        catch (e) {
          const components = message.components.map(c => c);
          const actionRow = new ActionRowBuilder()
          .setComponents(button)
          components.push(actionRow);
          await message.edit({ components: components });
        }

        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle(':heavy_check_mark: Success')
                .setColor(Colors.Green)
                .setDescription(`Button attached successfully.`)
            ],
            flags: ["Ephemeral"]
        })
    }
    interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle(':x: Error')
            .setColor(Colors.Red)
            .setDescription(`Ticket type was not found.`)
        ],
        flags: ["Ephemeral"]
    })
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async chatInputAttachList(interaction) {
    const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();

    const entries = interaction.options.getString('names').slice().trim().split(',')
    for (let i in entries) {
      const existing = db.ticketTypes.find(r => r.name == i);
      if (existing) {
        
      }
      else continue
    }
    const existing = db.ticketTypes.find(r => r.name == interaction.options.getString('name'))
    if (existing) {
        console.log('L')
        const button = new ButtonBuilder()
        .setLabel(interaction.options.getString('label') || existing.name)
        .setCustomId(`open-${existing.name}`)
        .setEmoji(interaction.options.getString('emoji'))
        .setStyle(ButtonStyle[interaction.options.getString('color')] || ButtonStyle.Secondary)
        console.log('L')
        const message = await interaction.channel.messages.fetch(interaction.options.getString('message_id'));
        if (message.components.length >= 4) return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle(':x: Error')
                .setColor(Colors.Red)
                .setDescription(`The message has too many components. You have to create a new message to attach to.`)
            ],
            flags: ["Ephemeral"]
        })
        console.log('L')

        try {
          if (!message.components.length) {
            const components = message.components.map(c => c);
            const actionRow = new ActionRowBuilder()
            .setComponents(button)
            components.push(actionRow);
            await message.edit({ components: components });
          }
          else {
            const components = message.components.map(c => c);
            components.at(components.length - 1).components.push(button);
            await message.edit({ components: components });
          }
        }
        catch (e) {
          const components = message.components.map(c => c);
          const actionRow = new ActionRowBuilder()
          .setComponents(button)
          components.push(actionRow);
          await message.edit({ components: components });
        }

        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle(':heavy_check_mark: Success')
                .setColor(Colors.Green)
                .setDescription(`Button attached successfully.`)
            ],
            flags: ["Ephemeral"]
        })
    }
    interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle(':x: Error')
            .setColor(Colors.Red)
            .setDescription(`Ticket type was not found.`)
        ],
        flags: ["Ephemeral"]
    })
  }

  /**
   * 
   * @param {ChatInputCommandInteraction} interaction 
   */
  async chatInputLogChannel(interaction) {
    const db = await ServerSettings.findById(interaction.guild.id).cacheQuery();
    const channel = interaction.options.getChannel('channel');
    const transcripts = interaction.options.getChannel('transcripts');

    db.logs.audit = channel.id;
    db.logs.transcripts = transcripts.id;

    await db.save();

    interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle(':heavy_check_mark: Success')
            .setColor(Colors.Green)
            .setDescription(`Ticket log set ${channel} and ${transcripts}.`)
        ],
        flags: ["Ephemeral"]
    })
  }
}
module.exports = {
  PingCommand,
};
