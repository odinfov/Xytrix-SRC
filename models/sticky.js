const mongoose = require('mongoose');

const stickyMessageSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String },
    content: { type: String },
    embed: { type: Object },
    isEmbed: { type: Boolean, default: false },
    limit: { type: Number, default: 6 }
});

module.exports = mongoose.model('StickyMessage', stickyMessageSchema);