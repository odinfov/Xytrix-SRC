const { MessageActionRow, MessageEmbed, Modal, TextInputComponent, MessageButton, MessageSelectMenu } = require('discord.js');
const ReactionRole = require('../../models/reaction'); 
const config = require('../../config.json')

module.exports = {
    name: 'reactionrole',
    description: 'Manage reaction roles (create or remove)',
    category: 'rrole',
    aliases: ['rrole', 'rr'],
    subcommand: ['create', 'remove'],
    premium: false,
    run: async (client, message, args) => {

        let own = message.author.id == message.guild.ownerId;
        let isSpecialMember = config.boss.includes(message.author.id);;
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Administrator\` permissions to use this command.`
                        )
                ]
            });
        }
        if (!message.guild.me.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I don't have \`Administrator\` permissions to execute this command.`
                        )
                ]
            });
        }
        if (!isSpecialMember && !own && message.member.roles.highest.position <= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have a higher role than me to use this command.`
                        )
                ]
            });
        }

        if (!args[0] || !['create', 'remove'].includes(args[0].toLowerCase())) {
            let prefix = '&' || message.guild.prefix
            const embed = new MessageEmbed()
            .setThumbnail(client.user.avatarURL({ dynamic: true }))
            .setColor(client.color)
            .setTitle(`__**Reaction Role**__`)
            .setDescription(
                `Enhance your server with the Reaction Role feature! This powerful tool allows users to assign roles to themselves by simply reacting to a message, streamlining role management and increasing user engagement.`
            )
            .addFields([
                {
                    name: `__**Reaction Role Create**__`,
                    value: `Effortlessly create a reaction role - \`${prefix}reactionrole create\``
                },
                {
                    name: `__**Reaction Role Remove**__`,
                    value: `Remove an unrequired reaction role - \`${prefix}reactionrole remove\``
                }
            ])
            .setTimestamp();
    
    
            return message.channel.send({ embeds: [embed] });
        }

        const subCommand = args[0].toLowerCase();

        if (subCommand === 'create') {
            
            if (!args[1]) {
                const errorEmbed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Please provide the message link.');
                return message.channel.send({ embeds: [errorEmbed] });
            }

            const messageLink = args[1];
            const regex = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
            const matches = regex.exec(messageLink);

            if (!matches || matches.length < 4) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Invalid message link. Please provide a valid message link.')
                    ]
                });
            }

            const [, guildId, channelId, messageId] = matches;

            const fetchMessage = async (messageId, channelId) => {
                const channel = await client.channels.fetch(channelId);
                return await channel.messages.fetch(messageId);
            };

            const startReactionRoleSetup = async (fetchedMessage) => {
                const embed = new MessageEmbed()
                    .setColor(client.color)
                    .setTitle('Set Role ID')
                    .setDescription('Please provide the role ID by clicking the button below.');

                const setupMessage = await message.channel.send({
                    embeds: [embed],
                    components: [new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId(`open_role_modal_${fetchedMessage.id}`)
                            .setLabel('Set Role ID')
                            .setStyle('SECONDARY')
                    )]
                });

                const filter = interaction => interaction.customId === `open_role_modal_${fetchedMessage.id}`;
                const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async interaction => {
                    if (interaction.isButton() && interaction.customId === `open_role_modal_${fetchedMessage.id}`) {
                        const modal = new Modal()
                            .setCustomId(`role_modal_${fetchedMessage.id}`)
                            .setTitle('Set Role ID')
                            .addComponents(
                                new MessageActionRow().addComponents(
                                    new TextInputComponent()
                                        .setCustomId('role_id_input')
                                        .setLabel('Provide a role ID for reaction role setup')
                                        .setStyle('SHORT')
                                        .setPlaceholder('Enter role ID')
                                        .setRequired(true)
                                )
                            );
                        await interaction.showModal(modal);
                    }
                });

                client.on('interactionCreate', async interaction => {
                    if (interaction.isModalSubmit() && interaction.customId === `role_modal_${fetchedMessage.id}`) {
                        await interaction.deferReply({ ephemeral: true });
                        try {
                            const roleId = interaction.fields.getTextInputValue('role_id_input').trim();
                            const selectedRole = message.guild.roles.cache.get(roleId);

                            if (!selectedRole) {
                                return interaction.editReply({
                                    content: 'Cannot find the selected role in this server.',
                                    ephemeral: true
                                });
                            }

                            if (selectedRole.managed) {
                                return interaction.editReply({
                                    content: 'I cannot give this role as this role is an integration role.',
                                    ephemeral: true
                                });
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
                                return interaction.editReply({
                                    content: 'This role has dangerous permissions, cannot assign this role.',
                                    ephemeral: true
                                });
                            }
                            const botHighestRole = message.guild.me.roles.highest;
                            if (selectedRole.position >= botHighestRole.position) {
                                return interaction.editReply({
                                    content: `I cannot give members the <@&${selectedRole.id}> role because it is equal to or higher than my highest role <@&${botHighestRole.id}> in the role list.`,
                                    ephemeral: true
                                });
                            }

                            const updatedEmbed = new MessageEmbed()
                                .setTitle('Set Emoji')
                                .setDescription('Choose a custom label or emoji with the popup form.')
                                .setColor(client.color);

                            const button = new MessageButton()
                                .setCustomId(`set_emoji_button_${roleId}_${fetchedMessage.id}`)
                                .setLabel('Set Emoji')
                                .setStyle('SECONDARY');

                            const updatedRow = new MessageActionRow().addComponents(button);

                            await interaction.editReply({
                                embeds: [updatedEmbed],
                                components: [updatedRow]
                            });

                            const buttonFilter = btnInteraction => btnInteraction.customId === `set_emoji_button_${roleId}_${fetchedMessage.id}` && btnInteraction.user.id === message.author.id;
                            const buttonCollector = interaction.channel.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });

                            buttonCollector.on('collect', async btnInteraction => {
                                if (btnInteraction.customId === `set_emoji_button_${roleId}_${fetchedMessage.id}`) {
                                    const emojiModal = new Modal()
                                        .setCustomId(`emoji_modal_${roleId}_${fetchedMessage.id}`)
                                        .setTitle('Set Emoji')
                                        .addComponents(
                                            new MessageActionRow().addComponents(
                                                new TextInputComponent()
                                                    .setCustomId('emoji_input')
                                                    .setLabel('Provide an emoji ID for reaction role setup')
                                                    .setStyle('SHORT')
                                                    .setPlaceholder('Enter emoji ID')
                                                    .setRequired(true)
                                            )
                                        );

                                    await btnInteraction.showModal(emojiModal);
                                }
                            });

                            client.on('interactionCreate', async interaction => {
                                if (interaction.isModalSubmit() && interaction.customId === `emoji_modal_${roleId}_${fetchedMessage.id}`) {
                                    await interaction.deferReply({ ephemeral: true });
                                    try {
                                        const selectedRoleId = interaction.customId.split('_')[2];
                                        const emojiId = interaction.fields.getTextInputValue('emoji_input').trim();

                                        let emoji;
                                        try {
                                            emoji = await message.guild.emojis.fetch(emojiId);
                                        } catch {
                                            return interaction.editReply({
                                                content: 'Invalid emoji ID. Please provide a valid emoji ID.',
                                                ephemeral: true
                                            });
                                        }
                                        const existingReactionRole = await ReactionRole.findOne({
                                            guildId: message.guild.id,
                                            messageId: fetchedMessage.id
                                        });

                                        if (existingReactionRole && existingReactionRole.roles.some(role => role.emoji === emojiId)) {
                                            return interaction.editReply({
                                                content: 'A reaction role with this emoji already exists for this message.'
                                            });
                                        }

                                        if (existingReactionRole) {
                                            if (!existingReactionRole.roles.some(role => role.roleId === selectedRoleId && role.emoji === emojiId)) {
                                                existingReactionRole.roles.push({ emoji: emojiId, roleId: selectedRoleId });
                                                await existingReactionRole.save();
                                            } else {
                                                return interaction.editReply({
                                                    content: 'A reaction role with this emoji already exists for this message.'
                                                });
                                            }
                                        } else {
                                            const newReactionRole = new ReactionRole({
                                                guildId: message.guild.id,
                                                messageId: fetchedMessage.id,
                                                channelId: fetchedMessage.channel.id,
                                                roles: [{ emoji: emojiId, roleId: selectedRoleId }]
                                            });
                                            await newReactionRole.save();
                                        }

                                        fetchedMessage.react(emojiId);

                                        return interaction.editReply({
                                            content: `Reaction role set up successfully! Members can now react with ${emoji} to get the <@&${selectedRoleId}> role.`
                                        });
                                    } catch (error) {
                                        console.error('Error setting up reaction role:', error);
                                        return interaction.editReply({
                                            content: 'An error occurred while setting up the reaction role. Please try again later.',
                                            ephemeral: true
                                        });
                                    }
                                }
                            });
                        } catch (error) {
                            console.error('Error setting up reaction role:', error);
                            return interaction.editReply({
                                content: 'An error occurred while setting up the reaction role. Please try again later.',
                                ephemeral: true
                            });
                        }
                    }
                });
            };

            fetchMessage(messageId, channelId)
                .then(fetchedMessage => {
                    if (fetchedMessage) {
                        startReactionRoleSetup(fetchedMessage);
                    } else {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Could not fetch the message. Make sure the link is correct.')
                            ]
                        });
                    }
                })
                .catch(err => {
                    console.error('Error fetching message:', err);
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('Could not fetch the message. Make sure the link is correct.')
                        ]
                    });
                });
        } else if (subCommand === 'remove') {
            
            if (!args[1]) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Please provide the message link.')
                    ]
                });
            }

            const messageLink = args[1];
            const regex = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
            const matches = regex.exec(messageLink);

            if (!matches || matches.length < 4) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Invalid message link. Please provide a valid message link.')
                    ]
                });
            }

            const [, guildId, channelId, messageId] = matches;

            const fetchedMessage = await client.channels.cache.get(channelId)?.messages.fetch(messageId);

            if (!fetchedMessage) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Could not fetch the message. Make sure the link is correct.')
                    ]
                });
            }

            const existingReactionRole = await ReactionRole.findOne({
                guildId: message.guild.id,
                messageId: fetchedMessage.id
            });

            if (!existingReactionRole) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('No reaction roles found for this message.')
                    ]
                });
            }

            const roleOptions = existingReactionRole.roles.map(role => ({
                label: `Role ID: ${role.roleId}`,
                value: role.roleId,
                description: `Emoji: ${role.emoji}`,
                emoji: role.emoji
            }));

            const roleSelectMenu = new MessageSelectMenu()
                .setCustomId(`role_select_menu_${fetchedMessage.id}`)
                .setPlaceholder('Select a role to remove')
                .addOptions(roleOptions);

            const row = new MessageActionRow().addComponents(roleSelectMenu);

            const removeRoleMessage = await message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Remove Reaction Role')
                        .setDescription('Select the role you want to remove.')
                ],
                components: [row]
            });

            const filter = interaction => interaction.customId === `role_select_menu_${fetchedMessage.id}`;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async interaction => {
                if (interaction.isSelectMenu() && interaction.customId === `role_select_menu_${fetchedMessage.id}`) {
                    const selectedRoleId = interaction.values[0];
                    const roleIndex = existingReactionRole.roles.findIndex(role => role.roleId === selectedRoleId);

                    if (roleIndex > -1) {
                        const emojiId = existingReactionRole.roles[roleIndex].emoji;

                        existingReactionRole.roles.splice(roleIndex, 1);
                        await existingReactionRole.save();

                        const emojiReaction = fetchedMessage.reactions.cache.get(emojiId);
                        if (emojiReaction) {
                            await emojiReaction.remove();
                        }
                    }

                    const confirmationEmbed = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`Reaction role with role ID <@&${selectedRoleId}> removed successfully.`);

                    return interaction.update({
                        embeds: [confirmationEmbed],
                        components: []
                    });
                }
            });
        }
    }
};
