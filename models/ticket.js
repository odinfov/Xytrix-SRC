const mongoose = require('mongoose'); 

const TicketCategorySchema = new mongoose.Schema({
    guildId: String,
    categoryId: String,
    setupMessageId: String,
    channelId: String,
    transcriptChannelId: String,
    embedColor: {
        type: String,
        default: '#2F3136'
    },
    title: {
        type: String,
        default: 'Ticket System'
    },
    description: {
        type: String,
        default: 'To create a ticket, press the button below.'
    },
    footer: {
        type: String,
        default: 'Click the button below to create a ticket'
    },
    buttonText: {
        type: String,
        default: 'Create Ticket'
    },
    categoryName: {
        type: String,
        default: 'Ticket'
    },
    roleId: {
        type: String,
        default: null
    }
});

TicketCategorySchema.statics.resetCategories = async function(guildId) {
    await this.deleteMany({ guildId });
};

const TicketSchema = new mongoose.Schema({
    guildId: String,
    userId: String,
    channelId: String,
    categoryId: String
});

const TicketCategory = mongoose.model('TicketCategory', TicketCategorySchema);
const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = { TicketCategory, Ticket };