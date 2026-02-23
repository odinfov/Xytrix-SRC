const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'support',
    aliases: ['sup'],
    category: 'info',
    description: `Provides the URL of the support server.`,
    premium: false,

    run: async (client, message, args) => {
        const embed = new MessageEmbed()
            .setColor(client.color)
            .setDescription('This is my server where you can get help and support: [Support Server](https://discord.gg/3xjw8snjnB)');

        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setLabel('Support')
                .setStyle('LINK')
                .setURL('https://discord.gg/3xjw8snjnB')
        );

        return message.channel.send({ embeds: [embed], components: [row] });
    }
};
