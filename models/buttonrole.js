const mongoose = require('mongoose');

const buttonRoleSchema = new mongoose.Schema({
    messageId: { type: String, required: true },
    roleId: { type: String, required: true },
    label: { type: String, required: false }, 
    emoji: { type: String, default: null }, 
    buttonColor: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    customId: { type: String, required: true }
});

module.exports = mongoose.model('ButtonRole', buttonRoleSchema);
