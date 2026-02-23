const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js')
const simplydjs = require('simply-djs')

module.exports = {
    name: 'calculator',
    category: 'info',
    aliases: ['calc'],
    description: `Performs basic calculations for ease of use.`,
    premium: false,
    run: async (client, message, args) => {
        simplydjs.calculator(message, {
            embedColor: client.color,
            credit: false
        })
    }
}
