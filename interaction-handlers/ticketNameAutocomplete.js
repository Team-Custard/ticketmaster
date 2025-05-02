const {
    InteractionHandler,
    InteractionHandlerTypes,
  } = require("@sapphire/framework");
const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
const serverSettings = require("../tools/settingsSchema");

  
  class MenuHandler extends InteractionHandler {
    constructor(ctx, options) {
      super(ctx, {
        ...options,
        interactionHandlerType: InteractionHandlerTypes.Autocomplete,
      });
    }
  
    async parse(interaction) {
      // if (interaction.commandName !== `rolemenu`) return this.none();

      const focusedOption = interaction.options.getFocused(true);
  
      switch (focusedOption.name.toLowerCase()) {
        case 'name': {
          // Search your API or similar. This is example code!
          const db = await serverSettings
            .findById(interaction.guild.id, serverSettings.upsert)
            .cacheQuery();

          // const searchResult = await myApi.searchForSomething(focusedOption.value);
  
          // Map the search results to the structure required for Autocomplete
          if (db?.ticketTypes.length == 0) return this.none();
          if (focusedOption.value) {
            const items = db?.ticketTypes.filter(ticket => ticket.name?.includes(focusedOption.value));
            if (items)
                return this.some(items.map((match) => ({ name: match.name, value: match.name })).splice(0, 25));
            else
                return this.none();
          }
          else {
            return this.some(db?.ticketTypes.filter(ticket => ticket.name?.includes(focusedOption.value)).map((match) => ({ name: match.name, value: match.name })).splice(0, 25));
          }
          
        }
        default:
          return this.none();
      }  
    }
  
    async run(interaction, result) {
        return interaction.respond(result);
    }
  }
  
  module.exports = {
    MenuHandler,
  };
