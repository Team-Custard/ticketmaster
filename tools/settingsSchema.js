const { Schema, model, models } = require("mongoose");
const { SpeedGooseCacheAutoCleaner } = require("speedgoose");

const settingsSchema = new Schema({
  _id: { type: String, required: true },
  tickets: [{
    id: Number,
    creator: String,
    ticketType: String,
    channel: String,
    claimer: String,
    closed: Boolean,
    deleted: Boolean,
  }],
  ticketTypes: [{
    name: String,
    method: String,
    manager: String,
    channel: String,
    paused: Boolean,
  }],
  logs: {
    audit: String,
    transcripts: String,
  },
  embeds: [{
    name: String,
    data: {
      author: {
        name: String,
        icon_url: String,
        url: String
      },
      title: String,
      url: String,
      description: String,
      thumbnail: String,
      image: String,
      fields: [{
        name: String,
        value: String,
        inline: Boolean,
      }],
      footer: {
        text: String,
        icon_url: String,
      },
      timestamp: Number
    }
  }]
}).plugin(SpeedGooseCacheAutoCleaner);

const settings = models[require("../config.json").process.botmode == "prod"
  ? "tickets"
  : "ticketStaging"] || model(
  require("../config.json").process.botmode == "prod"
    ? "tickets"
    : "ticketStaging",
  settingsSchema,
);

module.exports = settings;
exports.upsert = { upsert: true, setDefaultsOnInsert: true };
