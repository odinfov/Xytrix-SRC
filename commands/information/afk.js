const { MessageEmbed } = require('discord.js');
const db = require('../../models/afk.js');

module.exports = {
    name: 'afk',
    description: "Set's You Away From Keyboard",
    category: 'info',
    aliases: [],
    premium: false,
    run: async (client, message, args) => {
        const reason = args.join(' ') ? args.join(' ') : "I'm AFK :)";

        // Regular expression to detect links or specific keywords
        const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/|\.gg\/|\gg\/)/i;
        if (linkRegex.test(reason)) {
            const embed = new MessageEmbed()
                .setTitle('You cannot use links or advertise.')
                .setColor(client.color);
            return message.channel.send({ embeds: [embed] });
        }

        const data = await db.findOne({
            Guild: message.guildId,
            Member: message.author.id
        });

        if (data) {
            const embed = new MessageEmbed()
                .setTitle('UwU, you are already AFK.')
                .setColor(client.color);
            return message.channel.send({ embeds: [embed] });
        } else {
            const newData = new db({
                Member: message.author.id,
                Reason: reason,
                Time: Date.now()
            });
            await newData.save();
            const embed = new MessageEmbed()
                .setDescription(`Your AFK is now set to: **${reason}**`)
                .setColor(client.color);
            return message.channel.send({ embeds: [embed] });
        }
    }
};