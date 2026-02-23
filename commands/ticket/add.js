const { Permissions, MessageEmbed } = require('discord.js');
const db = require('../../models/ticket.js')
const { TicketCategory, Ticket } = require('../../models/ticket.js'); 

module.exports = {
    name: 'add',
    category: 'tic',
    aliases: ['addmember'],
    description: 'Add a member to the current ticket channel',
    premium: false,
    async run(client, message, args) {
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const embed = new MessageEmbed()
                .setDescription("You don't have the required permissions to use this command.")
                .setColor(client.color);
            return message.reply({ embeds: [embed] });
        }

        try {
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

            const memberId = args[0]?.replace(/<|@|!|>/g, ''); // Clean up the mention to get just the ID
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

            // Check if the member already has permissions to view and send messages in the channel
            const permissions = message.channel.permissionsFor(member);
            if (permissions.has(Permissions.FLAGS.VIEW_CHANNEL) && permissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
                const embed = new MessageEmbed()
                    .setDescription(`Member <@${member.id}> is already in the ticket channel.`)
                    .setColor(client.color);
                return message.reply({ embeds: [embed] });
            }

            // Update permissions to allow member to view and send messages
            await message.channel.permissionOverwrites.edit(member.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true
            });

            const embed = new MessageEmbed()
                .setDescription(`Successfully added <@${member.id}> to the ticket channel.`)
                .setColor(client.color);
            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error adding member to ticket channel:', error);
            const embed = new MessageEmbed()
                .setDescription('Failed to add member to the ticket channel. Please try again later.')
                .setColor(client.color);
            message.reply({ embeds: [embed] });
        }
    }
};
