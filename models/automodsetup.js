const mongoose = require('mongoose');

const automodConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    alertChannelId: { type: String, required: true },
    bypassRoleId: { type: String, required: true },
    rules: { type: Array, default: [] },
});

module.exports = mongoose.model('AutomodConfig', automodConfigSchema);
