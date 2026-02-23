const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'purgebot',
    aliases: ['pb'],
    category: 'mod',
    description: 'Delete bot messages',
    premium: false,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);;
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

        let amount = args[0] ? parseInt(args[0]) : 50;

        if (isNaN(amount)) {
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

        if (amount > 99) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You can't delete more than **99** bot messages at a time.`
                        )
                ]
            });
        }

        if (amount < 1) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must delete at least **1** message.`
                        )
                ]
            });
        }

        try {
            
            await message.delete().catch(() => {});

            
            const messages = await message.channel.messages.fetch({ limit: 100 });
            
            
            const botMessages = messages.filter(msg => msg.author.bot).first(amount);

            if (botMessages.length === 0) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} No bot messages found to delete.`
                            )
                    ]
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
            }

            
            await message.channel.bulkDelete(botMessages, true).catch(() => {});

            
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully deleted ${botMessages.length} bot messages.`
                        )
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));

        } catch (error) {
            console.error('Error in purgebot command:', error);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} An error occurred while trying to delete messages.`
                        )
                ]
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
    }
};
