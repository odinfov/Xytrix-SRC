const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const db = require('../../models/ticket.js')
const { TicketCategory, Ticket } = require('../../models/ticket.js'); 

const memberCooldowns = new Map();

module.exports = {
    name: 'ticket',
    category: 'tic',
    aliases: [],
    subcommand: ['setup', 'reset', 'list'],
    description: 'Set up a ticket system',
    premium: false,
    async run(client, message, args) {
        let own = message.author.id == message.guild.ownerId
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor('#2F3136')
                        .setDescription(
                            `<:Xytrix_no:1430998925308858369> | You must have \`Administrator\` permissions to use this command.`
                        )
                ]
            })
        }
        if (!message.guild.me.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor('#2F3136')
                        .setDescription(
                            `<:Xytrix_no:1430998925308858369> | I don't have \`Administrator\` permissions to execute this command.`
                        )
                ]
            })
        }
        if (
            !own &&
            message.member.roles.highest.position <=
                message.guild.me.roles.highest.position
        ) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor('#2F3136')
                        .setDescription(
                            `<:Xytrix_no:1430998925308858369> | You must have a higher role than me to use this command.`
                        )
                ]
            })
        }

        const subcommand = args[0];
        if (!subcommand || (subcommand !== 'setup' && subcommand !== 'reset' && subcommand !== 'list')) {
            const embed = new MessageEmbed()
                .setThumbnail(client.user.avatarURL({ dynamic: true }))
                .setColor('#2F3136')
                .setTitle(`__**Ticket System**__`)
                .setDescription(
                    `Enhance your server with the Ticket System feature! This powerful tool allows you to create and manage tickets for support or inquiries.`
                )
                .addFields([
                    {
                        name: `__**Ticket Setup**__`,
                        value: `To Setup Ticket System - \`${client.prefix}ticket setup\``
                    },
                    {
                        name: `__**Ticket Reset**__`,
                        value: `To Reset Ticket System - \`${client.prefix}ticket reset\``
                    },
                    {
                        name: `__**Ticket List**__`,
                        value: `To List Ticket Systems - \`${client.prefix}ticket list\``
                    }
                ])
                .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        if (subcommand === 'setup') {
            const isPremium = await client.db.get(`sprem_${message.guild.id}`);
            const ticketSystems = await TicketCategory.countDocuments({ guildId: message.guild.id });
            const maxSystems = isPremium ? 5 : 2;

            if (ticketSystems >= maxSystems && !isPremium) {
                const embed = new MessageEmbed()
                    .setColor('#2F3136')
                    .setDescription(
                        `<:Xytrix_no:1430998925308858369> | You have reached the maximum number of ticket systems \`${maxSystems}\` for this server.\n` +
                        `Upgrade to premium to set up up to \`5\` ticket systems!`
                    );

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setLabel('Buy Premium')
                            .setStyle('LINK')
                            .setURL('https://discord.gg/vHEGPjjbUN')
                    );

                return message.channel.send({ embeds: [embed], components: [row] });
            }

            const channelMsg = await message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor('#2F3136')
                        .setDescription('Please provide the ticket creation channel.')
                ]
            });

            const channelFilter = m => m.author.id === message.author.id;
            const channelCollector = message.channel.createMessageCollector({ filter: channelFilter, time: 30000, max: 1 });

            channelCollector.on('collect', async (msg) => {
                let channel;
                if (msg.mentions.channels.size > 0) {
                    channel = msg.mentions.channels.first();
                } else {
                    const channelId = msg.content.trim();
                    if (/^\d+$/.test(channelId)) {
                        channel = message.guild.channels.cache.get(channelId);
                    }
                }

                if (!channel) {
                    const invalidEmbed = new MessageEmbed()
                        .setColor('#2F3136')
                        .setDescription('Please provide a valid channel mention or ID.');
                    await message.channel.send({ embeds: [invalidEmbed] });
                    return;
                }

                const existingSetup = await TicketCategory.findOne({ channelId: channel.id });
                if (existingSetup) {
                    const invalidEmbed = new MessageEmbed()
                        .setColor('#2F3136')
                        .setDescription(`<:Xytrix_no:1430998925308858369> This channel already has a ticket system set up. Please choose a different channel.`);
                    await message.channel.send({ embeds: [invalidEmbed] });
                    return;
                }

                const transcriptMsg = await message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor('#2F3136')
                            .setDescription('Do you want to set up a transcript channel? `yes` or `no`')
                    ]
                });

                const transcriptCollector = message.channel.createMessageCollector({ filter: channelFilter, time: 30000, max: 1 });

                transcriptCollector.on('collect', async (transcriptMsg) => {
                    if (transcriptMsg.content.toLowerCase() !== 'yes' && transcriptMsg.content.toLowerCase() !== 'no') {
                        const invalidEmbed = new MessageEmbed()
                            .setColor('#2F3136')
                            .setDescription('Please answer with `yes` or `no` only.');
                        await message.channel.send({ embeds: [invalidEmbed] });
                        return;
                    }

                    let transcriptChannel = null;
                    if (transcriptMsg.content.toLowerCase() === 'yes') {
                        const transcriptChannelMsg = await message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor('#2F3136')
                                    .setDescription('Please provide the transcript channel ID or mention the channel.')
                            ]
                        });

                        const transcriptChannelCollector = message.channel.createMessageCollector({ filter: channelFilter, time: 30000, max: 1 });

                        transcriptChannelCollector.on('collect', async (msg) => {
                            transcriptChannel = msg.mentions.channels.first() || message.guild.channels.cache.get(msg.content);
                            if (!transcriptChannel) {
                                const invalidEmbed = new MessageEmbed()
                                    .setColor('#2F3136')
                                    .setDescription('Please provide a valid channel mention or ID.');
                                await message.channel.send({ embeds: [invalidEmbed] });
                                return;
                            }
                            continueSetup();
                        });
                    } else {
                        continueSetup();
                    }

                    async function continueSetup() {
                        const colorMsg = await message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor('#2F3136')
                                    .setDescription('Please provide the ticket embed color (hex code) or type `default` for #2F3136')
                            ]
                        });

                        const colorCollector = message.channel.createMessageCollector({ filter: channelFilter, time: 30000, max: 1 });

                        colorCollector.on('collect', async (colorMsg) => {
                            const input = colorMsg.content.trim().toLowerCase();
                            let embedColor;

                            if (input === 'default') {
                                embedColor = '#2F3136';
                            } else {
                                if (!/^#[0-9A-Fa-f]{6}$/.test(input)) {
                                    const invalidEmbed = new MessageEmbed()
                                        .setColor('#2F3136')
                                        .setDescription('Please provide a valid hex color code (e.g., #2F3136) or type `default`.');
                                    await message.channel.send({ embeds: [invalidEmbed] });
                                    return;
                                }
                                embedColor = input;
                            }

                            const customizeMsg = await message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor('#2F3136')
                                        .setDescription('Would you like to customize the ticket panel embed? `yes` or `no`')
                                ]
                            });

                            const customizeCollector = message.channel.createMessageCollector({ 
                                filter: channelFilter, 
                                time: 30000, 
                                max: 1 
                            });

                            customizeCollector.on('collect', async (customizeMsg) => {
                                if (customizeMsg.content.toLowerCase() !== 'yes' && customizeMsg.content.toLowerCase() !== 'no') {
                                    const invalidEmbed = new MessageEmbed()
                                        .setColor('#2F3136')
                                        .setDescription('Please answer with `yes` or `no` only.');
                                    await message.channel.send({ embeds: [invalidEmbed] });
                                    return;
                                }

                                let title = 'Ticket System';
                                let description = 'To create a ticket, press the button below.';
                                let footer = 'Click the button below to create a ticket';
                                let buttonText = 'Create Ticket';
                                let categoryName = 'Ticket';

                                if (customizeMsg.content.toLowerCase() === 'yes') {
                                    const titleMsg = await message.channel.send({
                                        embeds: [
                                            new MessageEmbed()
                                                .setColor('#2F3136')
                                                .setDescription('Please enter the title for the embed or type `skip` to keep default:')
                                        ]
                                    });

                                    const titleCollector = message.channel.createMessageCollector({ 
                                        filter: channelFilter, 
                                        time: 30000, 
                                        max: 1 
                                    });

                                    titleCollector.on('collect', async (titleMsg) => {
                                        if (titleMsg.content.toLowerCase() !== 'skip') {
                                            if (titleMsg.content.length > 100) {
                                                const invalidEmbed = new MessageEmbed()
                                                    .setColor('#2F3136')
                                                    .setDescription('Title must be 100 characters or less. Please try again.');
                                                await message.channel.send({ embeds: [invalidEmbed] });
                                                return;
                                            }
                                            title = titleMsg.content;
                                        }

                                        const descMsg = await message.channel.send({
                                            embeds: [
                                                new MessageEmbed()
                                                    .setColor('#2F3136')
                                                    .setDescription('Please enter the description for the embed or type `skip` to keep default:')
                                            ]
                                        });

                                        const descCollector = message.channel.createMessageCollector({ 
                                            filter: channelFilter, 
                                            time: 30000, 
                                            max: 1 
                                        });

                                        descCollector.on('collect', async (descMsg) => {
                                            if (descMsg.content.toLowerCase() !== 'skip') {
                                                if (descMsg.content.length > 1000) {
                                                    const invalidEmbed = new MessageEmbed()
                                                        .setColor('#2F3136')
                                                        .setDescription('Description must be 1000 characters or less. Please try again.');
                                                    await message.channel.send({ embeds: [invalidEmbed] });
                                                    return;
                                                }
                                                description = descMsg.content;
                                            }

                                            const footerMsg = await message.channel.send({
                                                embeds: [
                                                    new MessageEmbed()
                                                        .setColor('#2F3136')
                                                        .setDescription('Please enter the footer text or type `skip` to keep default:')
                                                ]
                                            });

                                            const footerCollector = message.channel.createMessageCollector({ 
                                                filter: channelFilter, 
                                                time: 30000, 
                                                max: 1 
                                            });

                                            footerCollector.on('collect', async (footerMsg) => {
                                                if (footerMsg.content.toLowerCase() !== 'skip') {
                                                    if (footerMsg.content.length > 500) {
                                                        const invalidEmbed = new MessageEmbed()
                                                            .setColor('#2F3136')
                                                            .setDescription('Footer must be 500 characters or less. Please try again.');
                                                        await message.channel.send({ embeds: [invalidEmbed] });
                                                        return;
                                                    }
                                                    footer = footerMsg.content;
                                                }

                                                const buttonMsg = await message.channel.send({
                                                    embeds: [
                                                        new MessageEmbed()
                                                            .setColor('#2F3136')
                                                            .setDescription('Please enter the button text or type `skip` to keep default:')
                                                    ]
                                                });

                                                const buttonCollector = message.channel.createMessageCollector({ 
                                                    filter: channelFilter, 
                                                    time: 30000, 
                                                    max: 1 
                                                });

                                                buttonCollector.on('collect', async (buttonMsg) => {
                                                    if (buttonMsg.content.toLowerCase() !== 'skip') {
                                                        if (buttonMsg.content.length > 20) {
                                                            const invalidEmbed = new MessageEmbed()
                                                                .setColor('#2F3136')
                                                                .setDescription('Button text must be 20 characters or less. Please try again.');
                                                            await message.channel.send({ embeds: [invalidEmbed] });
                                                            return;
                                                        }
                                                        buttonText = buttonMsg.content;
                                                    }
                                                    const categoryMsg = await message.channel.send({
                                                        embeds: [
                                                            new MessageEmbed()
                                                                .setColor('#2F3136')
                                                                .setDescription('Please enter the category name or type `skip` to keep default:')
                                                        ]
                                                    });

                                                    const categoryCollector = message.channel.createMessageCollector({ 
                                                        filter: channelFilter, 
                                                        time: 30000, 
                                                        max: 1 
                                                    });

                                                    categoryCollector.on('collect', async (categoryMsg) => {
                                                        if (categoryMsg.content.toLowerCase() !== 'skip') {
                                                            if (categoryMsg.content.length > 20) {
                                                                const invalidEmbed = new MessageEmbed()
                                                                    .setColor('#2F3136')
                                                                    .setDescription('Category name must be 20 characters or less. Please try again.');
                                                                await message.channel.send({ embeds: [invalidEmbed] });
                                                                return;
                                                            }
                                                            categoryName = categoryMsg.content;
                                                        }

                                                        const category = await message.guild.channels.create(categoryName, {
                                                            type: 'GUILD_CATEGORY'
                                                        });

                                                        const embedSetup = new MessageEmbed()
                                                            .setTitle(title)
                                                            .setDescription(description)
                                                            .setColor(embedColor)
                                                            .setAuthor({ 
                                                                name: 'Ticket Panel', 
                                                                iconURL: message.guild.iconURL({ dynamic: true, format: 'png' }) 
                                                            })
                                                            .setFooter({ 
                                                                text: footer, 
                                                                iconURL: client.user.displayAvatarURL({ dynamic: true, format: 'png' }) 
                                                            });

                                                        const row = new MessageActionRow()
                                                            .addComponents(
                                                                new MessageButton()
                                                                    .setCustomId('create_ticket')
                                                                    .setLabel(buttonText)
                                                                    .setStyle('SECONDARY')
                                                            );

                                                        const setupMessage = await channel.send({ embeds: [embedSetup], components: [row] });

                                                        const newSetup = new TicketCategory({
                                                            guildId: message.guild.id,
                                                            categoryId: category.id,
                                                            setupMessageId: setupMessage.id,
                                                            channelId: channel.id,
                                                            transcriptChannelId: transcriptChannel ? transcriptChannel.id : null,
                                                            embedColor: embedColor,
                                                            title: title,
                                                            description: description,
                                                            footer: footer,
                                                            buttonText: buttonText,
                                                            categoryName: categoryName
                                                        });
                                                        await newSetup.save();

                                                        const embedFinal = new MessageEmbed()
                                                            .setDescription(`<:Xytrix_yes:1430998886494896240> Ticket system has been set up in ${channel}.`)
                                                            .setColor('#2F3136');
                                                        message.channel.send({ embeds: [embedFinal] });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                } else {
                                    const category = await message.guild.channels.create(categoryName, {
                                        type: 'GUILD_CATEGORY'
                                    });

                                    const embedSetup = new MessageEmbed()
                                        .setTitle(title)
                                        .setDescription(description)
                                        .setColor(embedColor)
                                        .setAuthor({ 
                                            name: 'Ticket Panel', 
                                            iconURL: message.guild.iconURL({ dynamic: true, format: 'png' }) 
                                        })
                                        .setFooter({ 
                                            text: footer, 
                                            iconURL: client.user.displayAvatarURL({ dynamic: true, format: 'png' }) 
                                        });

                                    const row = new MessageActionRow()
                                        .addComponents(
                                            new MessageButton()
                                                .setCustomId('create_ticket')
                                                .setLabel(buttonText)
                                                .setStyle('SECONDARY')
                                        );

                                    const setupMessage = await channel.send({ embeds: [embedSetup], components: [row] });

                                    const newSetup = new TicketCategory({
                                        guildId: message.guild.id,
                                        categoryId: category.id,
                                        setupMessageId: setupMessage.id,
                                        channelId: channel.id,
                                        transcriptChannelId: transcriptChannel ? transcriptChannel.id : null,
                                        embedColor: embedColor,
                                        title: title,
                                        description: description,
                                        footer: footer,
                                        buttonText: buttonText,
                                        categoryName: categoryName
                                    });
                                    await newSetup.save();

                                    const embedFinal = new MessageEmbed()
                                        .setDescription(`<:Xytrix_yes:1430998886494896240> Ticket system has been set up in ${channel}.`)
                                        .setColor('#2F3136');
                                    message.channel.send({ embeds: [embedFinal] });
                                }
                            });
                        });
                    }
                });
            });
        }

        if (subcommand === 'reset') {
            try {
                const existingSetups = await TicketCategory.find({ guildId: message.guild.id });

                if (existingSetups.length === 0) {
                    const embed = new MessageEmbed()
                        .setDescription('<:Xytrix_no:1430998925308858369> No ticket systems are set up in this server.')
                        .setColor('#2F3136');
                    return message.reply({ embeds: [embed] });
                }

                let deletedCount = 0;

                for (const existingSetup of existingSetups) {
                    const setupChannel = message.guild.channels.cache.get(existingSetup.channelId);
                    if (setupChannel) {
                        try {
                            const setupMessage = await setupChannel.messages.fetch(existingSetup.setupMessageId);
                            if (setupMessage) {
                                await setupMessage.delete();
                            }
                        } catch (error) {
                            console.error(`Error deleting setup message for category ${existingSetup.categoryId}:`, error);
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, 500));

                    const tickets = await Ticket.find({ guildId: message.guild.id, categoryId: existingSetup.categoryId });
                    for (const ticket of tickets) {
                        const channel = message.guild.channels.cache.get(ticket.channelId);
                        if (channel) {
                            try {
                                await channel.delete();
                            } catch (error) {
                                console.error(`Error deleting ticket channel ${ticket.channelId} for category ${existingSetup.categoryId}:`, error);
                            }
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    await Ticket.deleteMany({ guildId: message.guild.id, categoryId: existingSetup.categoryId });

                    await new Promise(resolve => setTimeout(resolve, 500));

                    const categoryChannel = message.guild.channels.cache.get(existingSetup.categoryId);
                    if (categoryChannel) {
                        try {
                            await categoryChannel.delete();
                        } catch (error) {
                            console.error(`Error deleting category channel ${existingSetup.categoryId}:`, error);
                        }
                    }

                    deletedCount++;

                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                await TicketCategory.deleteMany({ guildId: message.guild.id });

                const embed = new MessageEmbed()
                    .setDescription(`<:Xytrix_yes:1430998886494896240> Successfully reset ${deletedCount} ticket system(s). All associated tickets, categories, and settings have been removed.`)
                    .setColor('#2F3136');
                message.reply({ embeds: [embed] });

            } catch (error) {
                console.error('Error resetting ticket systems:', error);
                const embedError = new MessageEmbed()
                    .setDescription('<:Xytrix_no:1430998925308858369> An error occurred while resetting the ticket systems.')
                    .setColor('#2F3136');
                message.reply({ embeds: [embedError] });
            }
        }

        if (subcommand === 'list') {
            const ticketSystems = await TicketCategory.find({ guildId: message.guild.id });

            if (ticketSystems.length === 0) {
                const embed = new MessageEmbed()
                    .setDescription('<:Xytrix_no:1430998925308858369> No ticket systems are set up in this server.')
                    .setColor('#2F3136');
                return message.channel.send({ embeds: [embed] });
            }

            const embed = new MessageEmbed()
                .setColor('#2F3136')
                .setTitle('__**Ticket Systems**__')
                .setDescription('Here are the ticket systems set up in this server:');

            ticketSystems.forEach(system => {
                const channel = message.guild.channels.cache.get(system.channelId);
                const category = message.guild.channels.cache.get(system.categoryId);
                embed.addFields({
                    name: `**Ticket System in ${channel ? channel.name : 'Unknown Channel'}**`,
                    value: `Category: ${category ? category.name : 'Unknown Category'}\nSetup Channel: ${channel ? `<#${channel.id}>` : 'Unknown'}`,
                    inline: false
                });
            });

            message.channel.send({ embeds: [embed] });
        }
    },
    async handleInteraction(client, interaction) {
        if (!interaction.isButton()) return;

        try {
            const now = Date.now();
            let cooldownDuration = 1000;
            const memberId = interaction.user.id;

            if (memberCooldowns.has(memberId)) {
                const expirationTime = memberCooldowns.get(memberId);
                if (now < expirationTime) {
                    const remainingTime = (expirationTime - now) / 1000;
                    const embedCooldown = new MessageEmbed()
                        .setDescription(`Please wait ${remainingTime.toFixed(1)} seconds before trying again.`)
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embedCooldown], ephemeral: true });
                }
            }

            memberCooldowns.set(memberId, now + cooldownDuration);

            if (interaction.customId === 'create_ticket') {
                const category = await TicketCategory.findOne({ 
                    guildId: interaction.guild.id,
                    channelId: interaction.channel.id 
                });

                if (!category) {
                    const embed = new MessageEmbed()
                        .setDescription('Ticket system is not set up.')
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const existingTicket = await Ticket.findOne({ 
                    guildId: interaction.guild.id, 
                    userId: interaction.user.id,
                    categoryId: category.categoryId 
                });

                if (existingTicket) {
                    const existingChannel = interaction.guild.channels.cache.get(existingTicket.channelId);
                    if (existingChannel) {
                        const embed = new MessageEmbed()
                            .setDescription(`You already have a ticket open in ${existingChannel} for this category.`)
                            .setColor(client.color);
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        await Ticket.findOneAndDelete({ 
                            guildId: interaction.guild.id, 
                            userId: interaction.user.id,
                            categoryId: category.categoryId 
                        });
                    }
                }

                await interaction.reply({ content: 'Creating ticket in a few seconds...', ephemeral: true });

                const ticketChannel = await interaction.guild.channels.create(`${interaction.user.username}`, {
                    type: 'GUILD_TEXT',
                    parent: category.categoryId,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ['VIEW_CHANNEL']
                        },
                        {
                            id: interaction.user.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                            id: client.user.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_CHANNELS']
                        }
                    ]
                });

                const newTicket = new Ticket({
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    channelId: ticketChannel.id,
                    categoryId: category.categoryId 
                });
                await newTicket.save();

                const embedTicket = new MessageEmbed()
                    .setTitle('Ticket Created')
                    .setDescription('Thank you for reaching out!\n A staff member will be with you shortly to assist you.')
                    .setColor(client.color)
                    .setFooter({ 
                        text: 'Crafted with love', 
                        iconURL: client.user.displayAvatarURL({ dynamic: true, format: 'png' }) 
                    });

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('close_ticket')
                            .setLabel('Close Ticket')
                            .setStyle('SECONDARY'),
                        new MessageButton()
                            .setCustomId('add_user')
                            .setLabel('Add User')
                            .setStyle('SECONDARY')
                    );

                let pingContent = `<@${interaction.user.id}>`;
                if (category.roleId) {
                    const staffRole = interaction.guild.roles.cache.get(category.roleId);
                    if (staffRole) {
                        pingContent += ` <@&${category.roleId}>`;
                    }
                }

                await ticketChannel.send({ content: pingContent, embeds: [embedTicket], components: [row] });

                const embedReply = new MessageEmbed()
                    .setDescription(`Ticket created successfully: ${ticketChannel}`)
                    .setColor(client.color);
                interaction.followUp({ embeds: [embedReply], ephemeral: true });
            }

            if (interaction.customId === 'close_ticket') {
                const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });

                if (!ticket) {
                    const embed = new MessageEmbed()
                        .setDescription('This ticket does not exist in the database.')
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS) && interaction.user.id !== ticket.userId) {
                    const embed = new MessageEmbed()
                        .setDescription('You do not have permission to close this ticket.')
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const embedConfirm = new MessageEmbed()
                    .setDescription('Are you sure you would like to close this ticket?')
                    .setColor(client.color);

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('confirm_close_ticket')
                            .setLabel('Close')
                            .setStyle('SECONDARY'),
                        new MessageButton()
                            .setCustomId('cancel_close_ticket')
                            .setLabel('Cancel')
                            .setStyle('SECONDARY')
                    );

                await interaction.reply({ embeds: [embedConfirm], components: [row], ephemeral: false });
            }

            if (interaction.customId === 'confirm_close_ticket') {
                const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });

                if (!ticket) {
                    const embed = new MessageEmbed()
                        .setDescription('This ticket does not exist in the database.')
                        .setColor(client.color);
                    return interaction.replied ? interaction.followUp({ embeds: [embed], ephemeral: true }) : interaction.reply({ embeds: [embed], ephemeral: true });
                }


                const category = await TicketCategory.findOne({ guildId: interaction.guild.id, categoryId: ticket.categoryId });

                await Ticket.deleteOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });

                if (category && category.transcriptChannelId) {
                    const transcriptChannel = interaction.guild.channels.cache.get(category.transcriptChannelId);
                    if (transcriptChannel) {
                         const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        const transcript = messages.reverse().map(msg => {
                            return `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`;
                        }).join('\n');

                        const transcriptEmbed = new MessageEmbed()
                            .setTitle(`Ticket Transcript - ${interaction.channel.name}`)
                            .setDescription(`Ticket created by: <@${ticket.userId}>\nClosed by: ${interaction.user.tag}\n\n**Transcript:**\n\`\`\`${transcript}\`\`\``)
                            .setColor(client.color)
                            .setTimestamp();

                        await transcriptChannel.send({ embeds: [transcriptEmbed] }).catch(console.error);
                    }
                }

                await interaction.channel.permissionOverwrites.edit(ticket.userId, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: false
                }).catch(console.error);

                const embed = new MessageEmbed()
                    .setDescription(`Ticket closed by ${interaction.user}\nThis ticket will be deleted in 5 seconds.`)
                    .setColor(client.color);
                await interaction.channel.send({ embeds: [embed] }).catch(console.error);

                if (category) {
                    const setupChannel = interaction.guild.channels.cache.get(category.channelId);
                    if (setupChannel) {
                        try {
                            const originalTicketMessage = await setupChannel.messages.fetch(category.setupMessageId).catch(fetchError => {
                                console.error(`Error fetching original ticket message:`, fetchError);
                                return null; 
                            });
                            
                            console.log(`Fetch result for setup message:`, originalTicketMessage);

                            if (originalTicketMessage) {
                                const editedRow = new MessageActionRow()
                                    .addComponents(
                                        new MessageButton()
                                            .setCustomId('ticket_closed_placeholder')
                                            .setLabel('Ticket Closed')
                                            .setStyle('SECONDARY')
                                            .setDisabled(true)
                                    );
                                await originalTicketMessage.edit({ components: [editedRow] }).catch(console.error);
                            }
                        } catch (error) {
                            console.error(`Error editing original ticket message for category ${category.categoryId}:`, error);
                        }
                    }
                }

                const confirmEmbed = new MessageEmbed()
                    .setDescription('Ticket has been closed.')
                    .setColor(client.color);
                await (interaction.replied ? interaction.followUp({ embeds: [confirmEmbed], ephemeral: true }) : interaction.reply({ embeds: [confirmEmbed], ephemeral: true })).catch(console.error);


                if (interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                    const embedOptions = new MessageEmbed()
                        .setDescription('What would you like to do with this ticket?')
                        .setColor(client.color);

                    const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('delete_channel')
                                .setLabel('Delete')
                                .setStyle('SECONDARY'),
                            new MessageButton()
                                .setCustomId('keep_channel')
                                .setLabel('Keep')
                                .setStyle('SECONDARY')
                        );

                    await interaction.channel.send({ embeds: [embedOptions], components: [row] });
                }
            }

            if (interaction.customId === 'delete_channel') {
                if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                    const embed = new MessageEmbed()
                        .setDescription('You do not have permission to delete this ticket.')
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const embed = new MessageEmbed()
                    .setDescription('This ticket will be deleted in 5 seconds.')
                    .setColor(client.color);
                await interaction.reply({ embeds: [embed] });

                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                    } catch (error) {
                        console.error('Error deleting channel:', error);
                    }
                }, 5000);
            }

            if (interaction.customId === 'keep_channel') {
                if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                    const embed = new MessageEmbed()
                        .setDescription('You do not have permission to keep this ticket.')
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const embed = new MessageEmbed()
                    .setDescription('This ticket will be kept.')
                    .setColor(client.color);
                await interaction.update({ embeds: [embed], components: [] });
            }

            if (interaction.customId === 'cancel_close_ticket') {
                const embed = new MessageEmbed()
                    .setDescription('Ticket close action has been canceled.')
                    .setColor(client.color);
                await interaction.update({ embeds: [embed], components: [] });

                setTimeout(() => interaction.deleteReply(), 2000);
            }

            if (interaction.customId === 'add_user') {
                const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });

                if (!ticket) {
                    const embed = new MessageEmbed()
                        .setDescription('This is not a ticket channel.')
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS) && interaction.user.id !== ticket.userId) {
                     const embed = new MessageEmbed()
                        .setDescription('You do not have permission to add users to this ticket.')
                        .setColor(client.color);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await interaction.reply({ content: 'Please mention the user you want to add to this ticket.', ephemeral: true });

                const filter = m => m.author.id === interaction.user.id;
                const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });

                collector.on('collect', async m => {
                    const targetUser = m.mentions.users.first() || await client.users.fetch(m.content).catch(() => null);

                    if (!targetUser) {
                        const embed = new MessageEmbed()
                            .setDescription('Invalid user mentioned or provided ID.')
                            .setColor(client.color);
                        return m.reply({ embeds: [embed] });
                    }

                    try {
                        await interaction.channel.permissionOverwrites.edit(targetUser.id, {
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: true
                        });

                        const embed = new MessageEmbed()
                            .setDescription(`<@${targetUser.id}> has been added to the ticket.`)
                            .setColor(client.color);
                        await interaction.channel.send({ embeds: [embed] });

                    } catch (error) {
                        console.error('Error adding user to ticket:', error);
                        const embed = new MessageEmbed()
                            .setDescription('There was an error adding the user to the ticket.')
                            .setColor(client.color);
                        await interaction.channel.send({ embeds: [embed] });
                    }
                    if (m.deletable) m.delete().catch(console.error);
                });

                 collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        const embed = new MessageEmbed()
                            .setDescription('You took too long to mention a user.')
                            .setColor(client.color);
                        if (collected.size === 0) interaction.channel.send({ embeds: [embed] }).catch(console.error);
                    }
                });

            }

        } catch (error) {
            console.error('Error handling interaction:', error);
            const embedError = new MessageEmbed()
                .setDescription('An error occurred while processing your request.')
                .setColor(client.color);
            await interaction.reply({ embeds: [embedError], ephemeral: true });
        }
    }
};