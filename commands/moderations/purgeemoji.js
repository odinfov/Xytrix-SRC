const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'purgeemoji',
    aliases: ['clearemoji', 'pe'],
    category: 'mod',
    description: `Purge the message which contains emojis`,
    premium: false,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Manage Messages\` permissions to use this command.`
                        )
                ]
            });
        }

        let amount = parseInt(args[0]) || 30;

        if (amount > 100) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You can't delete more than **100** messages at a time.`
                        )
                ]
            });
        }

        await message.delete().catch(() => {});

        const messages = await message.channel.messages.fetch({ limit: amount }).catch(() => {});
        const filteredMessages = messages.filter(msg => {
            
            const emojiRegex = /<a?:\w+:\d+>|[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;
            return emojiRegex.test(msg.content);
        });

        const deletedMessages = await message.channel.bulkDelete(filteredMessages, true);

        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(
                        `${client.emoji.tick} Successfully deleted ${deletedMessages.size} messages containing emojis.`
                    )
            ]
        }).then(m => {
            setTimeout(() => {
                m.delete().catch(() => {});
            }, 3000);
        });
    }
}
