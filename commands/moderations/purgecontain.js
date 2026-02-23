const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'purgecontains',
    aliases: ['pc'], 
    category: 'mod',
    description: `Purge the message which contains keyword`,
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
        let prefix = '&' || message.guild.prefix;
        
        if (!args.length) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Invalid usage. Please use \`${prefix}purgecontains <keyword>\`.`
                        )
                ]
            });
        }

        
        const keyword = args.join(' ').toLowerCase();

        
        await message.delete().catch(() => {});

        try {
            
            const messages = await message.channel.messages.fetch({ limit: 50 });

            
            const filteredMessages = messages.filter(msg => msg.content.toLowerCase().includes(keyword));

            
            const deletedMessages = await message.channel.bulkDelete(filteredMessages, true);

            
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully deleted ${deletedMessages.size} messages containing "${keyword}".`
                        )
                ]
            }).then(m => {
                
                setTimeout(() => {
                    m.delete().catch(() => {});
                }, 3000);
            });

        } catch (err) {
            console.error('Error deleting messages:', err);
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} An error occurred while deleting messages.`
                        )
                ]
            });
        }
    }
};
