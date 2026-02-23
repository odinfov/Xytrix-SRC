const { Permissions, MessageEmbed } = require('discord.js');
const { TicketCategory } = require('../../models/ticket.js'); // Adjust the import as per your actual setup

module.exports = {
    name: 'rename',
    category: 'tic', // Adjust category as needed
    aliases: ['renameticket'],
    description: 'Rename a ticket channel',
    premium: false,
    async run(client, message, args) {
        
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const embed = new MessageEmbed()
                .setDescription("You don't have the required permissions to use this command.")
                .setColor(client.color);
            return message.reply({ embeds: [embed] });
        }

        // Check if a new name is provided
        const newName = args.join(' ');
        if (!newName) {
            const embed = new MessageEmbed()
                .setDescription("Please provide a new name for the channel.")
                .setColor(client.color);
            return message.reply({ embeds: [embed] });
        }

        // Fetch the ticket category for the guild
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
            // Rename the channel
            await channel.setName(newName);

            const successEmbed = new MessageEmbed()
                .setDescription(`Channel name has been successfully changed to **${newName}**.`)
                .setColor(client.color);
            message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error renaming channel:', error);
            const errorEmbed = new MessageEmbed()
                .setDescription('Failed to rename the channel. Please try again later.')
                .setColor(client.color);
            message.reply({ embeds: [errorEmbed] });
        }
    }
};
