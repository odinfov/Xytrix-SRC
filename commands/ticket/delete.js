const { Permissions, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { TicketCategory, Ticket } = require('../../models/ticket.js');

module.exports = {
    name: 'delete',
    category: 'tic',
    aliases: ['deleteticket'],
    description: 'Delete the current ticket channel',
    premium: false,
    async run(client, message, args) {
        // Check if the user invoking the command has the necessary permissions
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const embed = new MessageEmbed()
                .setDescription("You don't have the required permissions to use this command.")
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

        // Send confirmation message with buttons
        const confirmButton = new MessageButton()
            .setCustomId('confirm_delete')
            .setLabel('Confirm')
            .setStyle('SUCCESS');

        const cancelButton = new MessageButton()
            .setCustomId('cancel_delete')
            .setLabel('Cancel')
            .setStyle('DANGER');

        const row = new MessageActionRow()
            .addComponents(confirmButton, cancelButton);

        const embed = new MessageEmbed()
            .setDescription('Are you sure you want to delete this ticket channel?')
            .setColor(client.color);

        const confirmationMessage = await message.reply({ embeds: [embed], components: [row] });

        // Button interaction collector
        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timeout

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_delete') {
                try {
                    // Send a new message confirming the deletion process
                    const deletingEmbed = new MessageEmbed()
                        .setDescription('Deleting this ticket in a few seconds...')
                        .setColor(client.color);
                    const deletingMessage = await message.channel.send({ embeds: [deletingEmbed] });
        
                    // Find the ticket in the database and delete it
                    await Ticket.findOneAndDelete({ channelId: channel.id });
        
                    // Delete the confirmation message
                    confirmationMessage.delete();
        
                    // Delete the channel after a delay
                    setTimeout(() => {
                        channel.delete().catch(error => {
                            console.error('Error deleting channel:', error);
                        });
                    }, 5000); // 5 seconds delay
                } catch (error) {
                    console.error('Error deleting ticket channel:', error);
                    const errorEmbed = new MessageEmbed()
                        .setDescription('Failed to delete the ticket channel. Please try again later.')
                        .setColor(client.color);
                    message.reply({ embeds: [errorEmbed] });
                }
            } else if (interaction.customId === 'cancel_delete') {
                // Send a cancel message in response to cancel action
                const cancelEmbed = new MessageEmbed()
                    .setDescription('Canceled deleting ticket channel.')
                    .setColor(client.color);
                await message.channel.send({ embeds: [cancelEmbed] });
        
                // Delete the confirmation message and end collector
                confirmationMessage.delete();
            }
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                // If collector ended due to timeout, remove components and update embed
                const timeoutEmbed = new MessageEmbed()
                    .setDescription('Canceled deleting ticket channel due to timeout.')
                    .setColor(client.color);
                confirmationMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(console.error);
            }
        });
        
    }
};
