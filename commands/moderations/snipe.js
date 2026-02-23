const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'snipe',
    aliases: [],
    category: 'mod',
    description: `Displays the most recent deleted message of the channel.`,
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`You must have \`Manage Message\` permissions to run this command.`)
                ]
            });
        }

        
        let snipeKey = `snipe_${message.guild.id}_${message.channel.id}`;
        let snipe = await client.data.get(snipeKey);

        if (!snipe) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`There Are No Deleted Messages`)
                ]
            });
        }

        
        const embed = new MessageEmbed()
            .setColor(client.color)
            .setTitle('Sniped Message')
            .addFields([
                {
                    name: `Author`,
                    value: `${snipe.author}`
                },
                {
                    name: `Timestamp`,
                    value: `${new Date(snipe.timestamp).toLocaleString()}`
                }
            ])
            .setDescription(`Content\n${snipe.content}`);

        if (snipe.imageUrl) {
            embed.setImage(snipe.imageUrl);
        }

        message.channel.send({ embeds: [embed] });
    }
};
