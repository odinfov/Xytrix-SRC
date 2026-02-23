const mongoose = require('mongoose');

const AutoresponderSchema = new mongoose.Schema({
    guildId: String,
    keyword: String,
    response: String,
    exact: { type: Boolean, default: false }
});

const Autoresponder = mongoose.model('Autoresponder', AutoresponderSchema);

module.exports = Autoresponder;
