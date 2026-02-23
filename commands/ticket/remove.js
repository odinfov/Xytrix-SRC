const { Permissions, MessageEmbed } = require('discord.js');
const db = require('../../models/ticket.js')
const { TicketCategory, Ticket } = require('../../models/ticket.js'); 

module.exports = {
    name: 'remove',
    category: 'tic',
    aliases: ['removemember'],
    description: 'Remove a member from the current ticket channel',
    premium: false,
    async run(client, message, args) {
        // Check if the user invoking the command has the necessary permissions
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const embed = new MessageEmbed()
                .setDescription("You don't have the required permissions to use this command.")
                .setColor(client.color);
            return message.reply({ embeds: [embed] });
        }
            const ticketCategory = await TicketCategory.findOne({ guildId: message.guild.id });
            if (!ticketCategory) {
                const embed = new MessageEmbed()
                    .setDescription('Ticket system is not set up in this server.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }    
            const ticketCategoryId = ticketCategory.categoryId;
            const channel = message.channel;

            // Check if the channel is in the ticket category
            if (channel.parentId !== ticketCategoryId) {
                const embed = new MessageEmbed()
                    .setDescription('This command can only be used in a ticket channel.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }               

        try {
            // Extract member ID from mention or ID
            const memberId = args[0].replace(/\D/g, ''); // Removes all non-numeric characters

            if (!memberId) {
                const embed = new MessageEmbed()
                    .setDescription('Please provide a member ID or mention.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }

            let member;
            try {
                member = await message.guild.members.fetch(memberId);
            } catch (error) {
                console.error('Error fetching member:', error);
                const embed = new MessageEmbed()
                    .setDescription('Invalid member ID or mention.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }

            if (!member) {
                const embed = new MessageEmbed()
                    .setDescription('Member not found.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }
            const currentPermissions = channel.permissionsFor(member);
            if (!currentPermissions.has(Permissions.FLAGS.VIEW_CHANNEL) && !currentPermissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
                const embed = new MessageEmbed()
                    .setDescription('This user is not in the ticket.')
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }            

            // Update permissions to remove member's ability to view and send messages
            await message.channel.permissionOverwrites.edit(member.id, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false
            });

            const embed = new MessageEmbed()
                .setDescription(`Successfully removed <@${member.id}> from the ticket channel.`)
                .setColor(client.color);
            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error removing member from ticket channel:', error);
            const embed = new MessageEmbed()
                .setDescription('Failed to remove member from the ticket channel. Please try again later.')
                .setColor(client.color);
            message.reply({ embeds: [embed] });
        }
    }
};
