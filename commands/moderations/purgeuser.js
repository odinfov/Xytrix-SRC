const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'purgeuser',
    aliases: ['clearuser', 'pu'],
    category: 'mod',
    description: `Purge the messages for specific user`,
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

        if (args[0] && args[0].match(/<@!?(\d+)>/) && args[0].match(/<@!?(\d+)>/)[1] === client.user.id) {
            args.shift();
        }
        let userMention = message.mentions.users.first();
        if (userMention && userMention.id === client.user.id && message.mentions.users.size > 1) {
            userMention = Array.from(message.mentions.users.values())[1];
        }
        
        const user = userMention;
        if (!user) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must mention a user whose messages you want to delete.`
                        )
                ]
            });
        }

        let amount = args[1];
        if (!amount) {
            amount = 30;
        }

        if (!parseInt(amount)) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must provide a valid number of messages to be deleted.`
                        )
                ]
            });
        }

        if (amount > 100) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You can't search more than **100** messages at a time.`
                        )
                ]
            });
        }

        await message.delete().catch(() => {});

        const messages = await message.channel.messages.fetch({ limit: amount }).catch(() => {});
        const userMessages = messages.filter(msg => msg.author.id === user.id);

        await DeleteMessages(message.channel, Array.from(userMessages.values()));

        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(
                        `${client.emoji.tick} Successfully deleted ${userMessages.size} messages from ${user.tag}.`
                    )
            ]
        }).then(m => {
            setTimeout(() => {
                m.delete().catch(() => {});
            }, 2000);
        });
    }
}

async function DeleteMessages(channel, messages) {
    for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100);
        await channel.bulkDelete(batch).catch(() => {});
    }
}
