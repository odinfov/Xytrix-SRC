const {
    Message,
    Client,
    MessageEmbed,
    MessageButton,
    MessageActionRow
} = require('discord.js')

module.exports = {
    name: 'servericon',
    aliases: ['serverav', 'serveravatar', 'savatar'],
    category: 'info',
    description: `Fetches the guild's logo for display.`,
    premium: false,

    run: async (client, message, args) => {
        const embed = new MessageEmbed()
            .setTitle(`Server Avatar Of ${message.guild.name}`)
            .setColor(client.color)
            .setImage(message.guild.iconURL({ dynamic: true, size: 2048 }))
            .setFooter({ 
                text: `Requested by ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL({ dynamic: true }) 
            });

        message.channel.send({ embeds: [embed] })
    }
}
