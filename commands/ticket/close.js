const { Permissions, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { TicketCategory, Ticket } = require('../../models/ticket.js');

module.exports = {
    name: 'close',
    category: 'tic',
    aliases: ['closeticket'],
    description: 'Close the current ticket channel',
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

        // Fetch the ticket from the database
        const ticket = await Ticket.findOne({ channelId: channel.id });
        if (!ticket) {
            const embed = new MessageEmbed()
                .setDescription('Ticket data not found. Unable to close the ticket.')
                .setColor(client.color);
            return message.reply({ embeds: [embed] });
        }

        // Fetch the member who created the ticket
        const ticketCreatorId = ticket.userId;
        const ticketCreator = await message.guild.members.fetch(ticketCreatorId);

        // Check if the ticket creator already cannot view/send messages
        const permissions = channel.permissionsFor(ticketCreator);
        if (!permissions || (!permissions.has('VIEW_CHANNEL') && !permissions.has('SEND_MESSAGES'))) {
            const embed = new MessageEmbed()
                .setDescription('Ticket is already closed.')
                .setColor(client.color);
            return message.reply({ embeds: [embed] });
        }

        // Send confirmation message with buttons
        const confirmButton = new MessageButton()
            .setCustomId('confirm_close')
            .setLabel('Confirm')
            .setStyle('SUCCESS');

        const cancelButton = new MessageButton()
            .setCustomId('cancel_close')
            .setLabel('Cancel')
            .setStyle('DANGER');

        const row = new MessageActionRow()
            .addComponents(confirmButton, cancelButton);

        const embed = new MessageEmbed()
            .setDescription(`Are you sure you want to close this ticket channel?`)
            .setColor(client.color);

        const confirmationMessage = await message.reply({ embeds: [embed], components: [row] });

        // Button interaction collector
        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timeout

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_close') {
                try {
                    // Send a new message confirming the closing process
                    const closingEmbed = new MessageEmbed()
                        .setDescription('Closing this ticket in a few seconds...')
                        .setColor(client.color);
                    const closingMessage = await message.channel.send({ embeds: [closingEmbed] });
        
                    // Modify permissions for the ticket creator
                    await channel.permissionOverwrites.edit(ticketCreator, {
                        VIEW_CHANNEL: false,
                        SEND_MESSAGES: false
                    });

                    // Delete the confirmation message
                    confirmationMessage.delete();
        
                    const successEmbed = new MessageEmbed()
                        .setDescription(`Closed the ticket successfully.`)
                        .setColor(client.color);
                    message.channel.send({ embeds: [successEmbed] });
                } catch (error) {
                    console.error('Error closing ticket channel:', error);
                    const errorEmbed = new MessageEmbed()
                        .setDescription('Failed to close the ticket channel. Please try again later.')
                        .setColor(client.color);
                    message.reply({ embeds: [errorEmbed] });
                }
            } else if (interaction.customId === 'cancel_close') {
                // Send a cancel message in response to cancel action
                const cancelEmbed = new MessageEmbed()
                    .setDescription('Canceled closing ticket channel.')
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
                    .setDescription('Canceled closing ticket channel due to timeout.')
                    .setColor(client.color);
                confirmationMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(console.error);
            }
        });
    }
};
