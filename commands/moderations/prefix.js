const { Message, Client, MessageEmbed } = require('discord.js')
const config = require('../../config.json')
module.exports = {
    name: 'prefix',
    aliases: ['setprefix'],
    category: 'mod',
    description: `Set the prefix for your server`,
    premium: false,

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */

    run: async (client, message, args) => {
        let prefix = '&' || message.guild.prefix;
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send(
                'You must have `Administration` perms to change the prefix of this server.'
            )
        }
        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`Your current pefix for this server is \`${prefix}\``)
                ]
            })
        }
        if (args[1]) {
            const embed = new MessageEmbed()
                .setDescription('You can not set prefix a double argument')
                .setColor(client.color)
            return message.channel.send({ embeds: [embed] })
        }
        if (args[0].length > 3) {
            const embed = new MessageEmbed()
                .setDescription(
                    'You can not send prefix more than 3 characters'
                )
                .setColor(client.color)
            return message.channel.send({ embeds: [embed] })
        }
        if (args.join('') === '&') {
            client.db.delete(`prefix_${message.guild.id}`)
            const embed = new MessageEmbed()
                .setDescription('Prefix Has Been Reset To Default')
                .setColor(client.color)
            return await message.channel.send({ embeds: [embed] })
        }

        await client.db.set(`prefix_${message.guild.id}`, args[0])
        client.util.setPrefix(message, client)
        const embed = new MessageEmbed()
            .setDescription(`New Prefix For This Server Is ${args[0]}`)
            .setColor(client.color)
        await message.channel.send({ embeds: [embed] })
    }
}
