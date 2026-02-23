const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'purgeimage',
    aliases: ['clearimage', 'pi'],
    category: 'mod',
    description: `Purge the message which contains images`,
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
        const filteredMessages = messages.filter(msg => msg.attachments.size > 0 && (msg.attachments.first().contentType.startsWith('image')));

        const deletedMessages = await message.channel.bulkDelete(filteredMessages, true);

        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(
                        `${client.emoji.tick} Successfully deleted ${deletedMessages.size} image messages.`
                    )
            ]
        }).then(m => {
            setTimeout(() => {
                m.delete().catch(() => {});
            }, 3000);
        });
    }
}
