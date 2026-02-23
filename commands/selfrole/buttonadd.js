const { MessageActionRow, MessageEmbed, Modal, TextInputComponent, MessageButton, MessageSelectMenu } = require('discord.js');
const ButtonRole = require('../../models/buttonrole'); 
const config = require('../../config.json')

module.exports = {
    name: 'buttonrole',
    description: 'Manage button roles',
    category: 'rrole',
    aliases: ['brole'],
    subcommand: ['create', 'remove'],
    premium: false,
    run: async (client, message, args) => {
        const subcommand = args[0];
        const isOwner = message.author.id === message.guild.ownerId;
        let isSpecialMember = config.boss.includes(message.author.id);

        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} You must have \`Administrator\` permissions to use this command.`)
                ]
            });
        }

        if (!message.guild.me.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} I don't have \`Administrator\` permissions to execute this command.`)
                ]
            });
        }

        if (!isSpecialMember && !isOwner && message.member.roles.highest.position <= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} You must have a higher role than me to use this command.`)
                ]
            });
        }

        if (!subcommand) {
            let prefix = '&' || message.guild.prefix
        const embed = new MessageEmbed()
        .setThumbnail(client.user.avatarURL({ dynamic: true }))
        .setColor(client.color)
        .setTitle(`__**Button Role**__`)
        .setDescription(
            `Enhance your server with the Button Role feature! This powerful tool allows users to assign roles to themselves by simply reacting to a message, streamlining role management and increasing user engagement.`
        )
        .addFields([
            {
                name: `__**Button Role Create**__`,
                value: `Effortlessly create a Button role - \`${prefix}buttonrole create\``
            },
            {
                name: `__**Button Role Remove**__`,
                value: `Remove an unrequired Button role - \`${prefix}buttonrole remove\``
            }
        ])
        .setTimestamp();


        return message.channel.send({ embeds: [embed] });
        }

        switch (subcommand) {
            case 'create':
                await createButtonRole(client, message, args.slice(1));
                break;
            case 'remove':
                await removeButtonRole(client, message, args.slice(1));
                break;
            default:

        const embed = new MessageEmbed()
        .setThumbnail(client.user.avatarURL({ dynamic: true }))
        .setColor(client.color)
        .setTitle(`__**Button Role**__`)
        .setDescription(
            `Enhance your server with the Button Role feature! This powerful tool allows users to assign roles to themselves by simply reacting to a message, streamlining role management and increasing user engagement.`
        )
        .addFields([
            {
                name: `__**Button Role Create**__`,
                value: `Effortlessly create a Button role - \`${prefix}buttonrole create\``
            },
            {
                name: `__**Button Role Remove**__`,
                value: `Remove an unrequired Button role - \`${prefix}buttonrole remove\``
            }
        ])
        .setTimestamp();


        return message.channel.send({ embeds: [embed] });
                break;
        }
    }
};

async function createButtonRole(client, message, args) {
    if (!args[0]) {
        return message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription('Please provide the message link.')
            ]
        });
    }

    const messageLink = args[0];
    const regex = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
    const matches = regex.exec(messageLink);

    if (!matches || matches.length < 4) {
        return message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription('Invalid message link. Please provide a valid message link.')
            ]
        });
    }

    const [, guildId, channelId, messageId] = matches;
    let prefix = '&' || message.guild.prefix;

    try {
        const fetchedMessage = await client.channels.cache.get(channelId).messages.fetch(messageId);
        if (fetchedMessage.author.id !== client.user.id) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} You can only add buttons to messages sent by the bot use \`${prefix}embed\` to create.`)
                ]
            });
        }
        await startButtonRoleSetup(client, message, fetchedMessage, guildId, channelId, messageId);
    } catch (error) {
        console.error('Error fetching message:', error);
        return message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription('An error occurred while fetching the message. Please make sure the provided link is correct.')
            ]
        });
    }
}

async function removeButtonRole(client, message, args) {
    if (!args[0]) {
        return message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription('Please provide the message link of the button role you want to remove.')
            ]
        });
    }

    const messageLink = args[0];
    const regex = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
    const matches = regex.exec(messageLink);

    if (!matches || matches.length < 4) {
        return message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription('Invalid message link. Please provide a valid message link.')
            ]
        });
    }

    const [, guildId, channelId, messageId] = matches;

    try {
        const buttonRoles = await ButtonRole.find({ messageId, guildId });
        if (buttonRoles.length === 0) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('No button roles found for the provided message link.')
                ]
            });
        }

        const options = buttonRoles.map(role => ({
            label: `Role ID: ${role.roleId}`,
            description: role.label || 'No Label',
            value: role.customId.substring(0, 100), 
            emoji: role.emoji ||'No Emoji'
        }));

        const selectMenu = new MessageSelectMenu()
            .setCustomId('select_button_role')
            .setPlaceholder('Select a button role to remove')
            .addOptions(options);

        const row = new MessageActionRow().addComponents(selectMenu);

        const selectMessage = await message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setTitle('Remove Button Role')
                .setDescription('Select the button role you want to remove.')
            ],
            components: [row]
        });

        const filter = interaction => interaction.customId === 'select_button_role' && interaction.user.id === message.author.id;
        const collector = selectMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            const selectedCustomId = interaction.values[0];
            const selectedRole = buttonRoles.find(role => role.customId === selectedCustomId);

            if (!selectedRole) {
                return interaction.reply({ content: 'Selected button role not found in the database.', ephemeral: true });
            }

            await ButtonRole.findOneAndDelete({ customId: selectedRole.customId });

            const fetchedMessage = await client.channels.cache.get(channelId).messages.fetch(messageId);
            if (fetchedMessage) {
                const updatedComponents = fetchedMessage.components[0].components.filter(c => c.customId !== selectedRole.customId);

                await fetchedMessage.edit({
                    components: updatedComponents.length > 0 ? [new MessageActionRow().addComponents(updatedComponents)] : []
                });
            }

            await interaction.reply({
                content: `Button role **${selectedRole.label || 'No Label'}** removed successfully.`,
                ephemeral: true
            });

            await selectMessage.delete();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                selectMessage.edit({
                    components: [],
                    content: 'No selection made. Removal process timed out.',
                    embeds: []
                });
            }
        });

    } catch (error) {
        console.error('Error removing button role:', error);
        message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription('An error occurred while removing the button role. Please try again.')
            ]
        });
    }
}

async function startButtonRoleSetup(client, message, fetchedMessage, guildId, channelId, messageId) {
    const embed = new MessageEmbed()
        .setColor(client.color)
        .setTitle('Set Role ID')
        .setDescription('Please provide the role ID by clicking the button below.');

    const setupMessage = await message.channel.send({
        embeds: [embed],
        components: [new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`open_role_modal_${messageId}`)
                .setLabel('Set Role ID')
                .setStyle('SECONDARY')
        )]
    });

    const filter = interaction => interaction.customId === `open_role_modal_${messageId}` && interaction.user.id === message.author.id;
    const collector = setupMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async interaction => {
        if (interaction.isButton()) {
            const modal = new Modal()
                .setCustomId(`role_modal_${messageId}`)
                .setTitle('Set Role ID')
                .addComponents(
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('role_id_input')
                            .setLabel('Provide a role ID for button role setup')
                            .setStyle('SHORT')
                            .setPlaceholder('Enter role ID')
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);

            
            const submitted = await interaction.awaitModalSubmit({ 
                filter: i => i.customId === `role_modal_${messageId}` && i.user.id === message.author.id, 
                time: 60000 
            }).catch(() => null);

            if (submitted) {
                await handleRoleModalSubmit(submitted, message, fetchedMessage, guildId, channelId, messageId, client);
            } else {
                await interaction.followUp({ content: 'Time expired. Please try again.', ephemeral: true });
            }
        }
    });
}

async function handleRoleModalSubmit(interaction, message, fetchedMessage, guildId, channelId, messageId, client) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const roleId = interaction.fields.getTextInputValue('role_id_input').trim();
        const selectedRole = message.guild.roles.cache.get(roleId);

        if (!selectedRole) {
            return interaction.editReply({ content: 'Cannot find the selected role in this server.', ephemeral: true });
        }

        if (selectedRole.managed) {
            return interaction.editReply({ content: 'I cannot give this role as this role is an integration role.', ephemeral: true });
        }

        const dangerousPermissions = [
            'KICK_MEMBERS',
            'BAN_MEMBERS',
            'ADMINISTRATOR',
            'MANAGE_CHANNELS',
            'MANAGE_GUILD',
            'MENTION_EVERYONE',
            'MANAGE_ROLES',
            'MANAGE_WEBHOOKS',
            'MANAGE_EVENTS',
            'MODERATE_MEMBERS',
            'MANAGE_EMOJIS_AND_STICKERS'
        ];
        if (dangerousPermissions.some(permission => selectedRole.permissions.has(permission))) {
            return interaction.editReply({ content: 'This role has dangerous permissions, cannot assign this role.', ephemeral: true });
        }

        const botHighestRole = message.guild.me.roles.highest;
        if (selectedRole.position >= botHighestRole.position) {
            return interaction.editReply({ content: `I cannot give members the <@&${selectedRole.id}> role because it is equal to or higher than my highest role <@&${botHighestRole.id}> in the role list.`, ephemeral: true });
        }

        const colorEmbed = new MessageEmbed()
            .setColor(client.color)
            .setTitle('Choose Button Color')
            .setDescription('Select the color for the button.');

        const colorRow = new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`color_red_${roleId}_${messageId}`).setLabel('Red').setStyle('DANGER'),
            new MessageButton().setCustomId(`color_blue_${roleId}_${messageId}`).setLabel('Blue').setStyle('PRIMARY'),
            new MessageButton().setCustomId(`color_green_${roleId}_${messageId}`).setLabel('Green').setStyle('SUCCESS'),
            new MessageButton().setCustomId(`color_secondary_${roleId}_${messageId}`).setLabel('Secondary').setStyle('SECONDARY')
        );

        await interaction.editReply({ embeds: [colorEmbed], components: [colorRow] });

        const colorFilter = i => i.customId.startsWith(`color_`) && i.user.id === message.author.id;
        const colorCollector = interaction.channel.createMessageComponentCollector({ filter: colorFilter, time: 60000 });

        colorCollector.on('collect', async colorInteraction => {
            await handleColorSelection(colorInteraction, roleId, messageId, client, message, fetchedMessage, interaction, guildId, channelId);
        });
    } catch (error) {
        console.error('Error handling role modal submit:', error);
        await interaction.editReply({ content: 'An error occurred while setting the role ID. Please try again.', ephemeral: true });
    }
}

async function handleColorSelection(colorInteraction, roleId, messageId, client, message, fetchedMessage, interaction, guildId, channelId) {
    const color = colorInteraction.customId.split('_')[1];
    const buttonColor = color.toUpperCase();

    const labelEmbed = new MessageEmbed()
        .setColor(client.color)
        .setTitle('Set Button Label')
        .setDescription('Provide a custom label for the button.');

    const labelRow = new MessageActionRow().addComponents(
        new MessageButton().setCustomId(`open_label_modal_${roleId}_${messageId}`).setLabel('Set Label').setStyle('SECONDARY')
    );

    await colorInteraction.update({ embeds: [labelEmbed], components: [labelRow] });

    const labelFilter = i => i.customId === `open_label_modal_${roleId}_${messageId}` && i.user.id === message.author.id;
    const labelCollector = interaction.channel.createMessageComponentCollector({ filter: labelFilter, time: 60000 });

    labelCollector.on('collect', async labelInteraction => {
        await handleLabelSelection(labelInteraction, roleId, messageId, client, message, fetchedMessage, buttonColor, interaction, guildId, channelId);
    });
}

async function handleLabelSelection(labelInteraction, roleId, messageId, client, message, fetchedMessage, buttonColor, interaction, guildId, channelId) {
    const labelModal = new Modal()
        .setCustomId(`label_modal_${roleId}_${messageId}`)
        .setTitle('Set Button Label')
        .addComponents(
            new MessageActionRow().addComponents(
                new TextInputComponent()
                    .setCustomId('label_input')
                    .setLabel('Provide a label for the button')
                    .setStyle('SHORT')
                    .setPlaceholder('Enter button label')
            ),
            new MessageActionRow().addComponents(
                new TextInputComponent()
                    .setCustomId('emoji_input')
                    .setLabel('Provide an emoji ID or Unicode for the button')
                    .setStyle('SHORT')
                    .setPlaceholder('Enter emoji ID or Unicode')
            )          
        );
    await labelInteraction.showModal(labelModal);

    client.on('interactionCreate', async interaction => {
        if (interaction.isModalSubmit() && interaction.customId === `label_modal_${roleId}_${messageId}`) {
            await interaction.deferReply({ ephemeral: true });
            try {
                const label = interaction.fields.getTextInputValue('label_input').trim();
                const emoji = interaction.fields.getTextInputValue('emoji_input').trim();
                if (!label && !emoji) {
                    return interaction.editReply({ content: 'You must provide either a label or an emoji for the button.', ephemeral: true });
                }
                let emojiValid = false;
                if (/^\d+$/.test(emoji)) {
                    
                    const customEmoji = message.guild.emojis.cache.get(emoji);
                    if (customEmoji) {
                        emojiValid = true; 
                    }
                } else {
                    return interaction.editReply({ content: 'Invalid emoji ID provided. Please provide a valid emoji ID.', ephemeral: true });
                }
        
                if (!emojiValid) {
                    return interaction.editReply({ content: 'Invalid emoji ID provided. Please provide a valid emoji ID.', ephemeral: true });
                }                

                const uniqueCustomId = `role_button_${roleId}_${messageId}_${Date.now()}`;

                const buttonRole = new ButtonRole({
                    messageId: fetchedMessage.id,
                    roleId: roleId,
                    label: label || null,
                    emoji: emoji || null,
                    buttonColor: buttonColor,
                    channelId: channelId,
                    guildId: guildId,
                    customId: uniqueCustomId
                });

                await buttonRole.save();

                const existingRows = fetchedMessage.components || [];
                let lastRow = existingRows.length > 0 ? existingRows[existingRows.length - 1] : null;

                
                if (!lastRow || lastRow.components.length >= 5) {
                    lastRow = new MessageActionRow();  
                    existingRows.push(lastRow);  
                }

                
                lastRow.addComponents(
                    new MessageButton()
                        .setCustomId(uniqueCustomId)
                        .setLabel(label || '')
                        .setStyle(buttonColor)
                        .setEmoji(emoji || undefined)
                );

                await fetchedMessage.edit({ components: existingRows });

                await interaction.editReply({
                    content: `Button role setup created successfully!\n\n**Role:** <@&${roleId}>\n**Label:** ${label}\n**Emoji:** ${emoji || 'None'}\n**Color:** ${buttonColor}`,
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error saving button role setup:', error);
                await interaction.editReply({ content: 'An error occurred while creating the button role setup. Please try again.', ephemeral: true });
            }
        }
    });
}
