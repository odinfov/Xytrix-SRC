const { MessageEmbed } = require('discord.js');
const db = require('../../models/ticket.js');
const config = require('../../config.json')
module.exports = {
    name: 'ticketstaff',
    category: 'tic',
    aliases: ['staffrole', 'tstaff'],
    subcommand: ['set', 'show'],
    description: 'Update or fetch the ticket staff role.',
    premium: false,
    async run(client, message, args) {
        try {
            
            const ticketCategory = await db.TicketCategory.findOne({ guildId: message.guild.id });
            if (!ticketCategory) {
                const embed = new MessageEmbed()
                    .setDescription('Ticket system is not set up in this server.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }
            let isSpecialMember = config.boss.includes(message.author.id);
            if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} | You must have \`Administrator\` permissions to use this command.`
                            )
                    ]
                });
            }

            if (args[0] === 'update' || args[0] === 'set') {
                
                const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
                if (!role) {
                    const embed = new MessageEmbed()
                        .setDescription('Please mention a role or provide a role ID.')
                        .setColor(client.color);
                    return message.reply({ embeds: [embed] });
                }
                if (ticketCategory) {
                    
                    ticketCategory.roleId = role.id;
                } else {
                    
                    ticketCategory = new db({
                        guildId: message.guild.id,
                        roleId: role.id 
                    });
                }
                await ticketCategory.save();

                const embed = new MessageEmbed()
                    .setDescription(`Ticket staff role has been updated to <@&${role.id}>.`)
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
                
            } else if (args[0] === 'show' || args[0] === 'view') {
                
                const roleId = ticketCategory.roleId;
                const role = message.guild.roles.cache.get(roleId);

                if (!role) {
                    const embed = new MessageEmbed()
                        .setDescription('No ticket staff role has been set.')
                        .setColor(client.color);
                    return message.reply({ embeds: [embed] });
                }

                const embed = new MessageEmbed()
                    .setDescription(`Current ticket staff role is <@&${role.id}>.`)
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            } else {
                const embed = new MessageEmbed()
                    .setDescription('Invalid argument. Use update to set the role or show to check the current role.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error handling ticket staff role:', error);
            const embed = new MessageEmbed()
                .setDescription('An error occurred while processing the command. Please try again later.')
                .setColor(client.color);
            message.reply({ embeds: [embed] });
        }
    }
};
