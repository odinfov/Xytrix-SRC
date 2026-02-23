const { MessageActionRow, MessageButton, Modal, TextInputComponent, Permissions, MessageSelectMenu, MessageEmbed } = require('discord.js');

module.exports = async (client) => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        try {
            if (oldState.channel) {
                const channelId = oldState.channel.id;
                const voiceChannelData = await client.db.get(`voiceChannel_${channelId}`);

                if (voiceChannelData) {
                    if (channelId === voiceChannelData.id) {
                        if (oldState.member.id === voiceChannelData.creatorId && oldState.channel.members.size > 0) {
                            const nonBotMembers = oldState.channel.members.filter(member => !member.user.bot);

                            if (nonBotMembers.size > 0) {
                                const memberArray = Array.from(nonBotMembers.values());
                                const newOwner = memberArray[0];

                                await oldState.channel.setName(`${newOwner.user.username}'s VC`);

                                await client.db.set(`voiceChannel_${channelId}`, {
                                    id: channelId,
                                    creatorId: newOwner.id
                                });
                                await oldState.channel.permissionOverwrites.delete(voiceChannelData.creatorId);
                                await oldState.channel.permissionOverwrites.edit(newOwner.id, {
                                    VIEW_CHANNEL: true,
                                    CONNECT: true,
                                    SPEAK: true
                                });
                            }
                        }
                        if (oldState.channel.members.size === 0) {
                            await oldState.channel.delete();
                            await client.db.delete(`voiceChannel_${channelId}`);
                        } else if (oldState.channel.members.size === 1) {
                            const remainingUser = oldState.channel.members.first();
                            if (remainingUser && remainingUser.user.bot) {
                                await oldState.channel.delete();
                                await client.db.delete(`voiceChannel_${channelId}`);
                            }
                        }
                    }
                }
            }

            if (newState.channel) {
                const blacklist = await client.db.get(`blacklist_${client.user.id}`) || [];
                if (blacklist.includes(newState.member.id)) return;

                const setupData = await client.db.get(`voiceChannelSetup_${newState.guild.id}`);
                if (setupData && newState.channel.id === setupData.templateChannelId) {
                    if (newState.member.user.bot) return;
                    const userChannelCount = await client.db.get(`userChannelCount_${newState.member.id}`) || { count: 0, timestamp: Date.now() };

                    if (Date.now() - userChannelCount.timestamp > 60000) {
                        userChannelCount.count = 0;
                    }

                    userChannelCount.count += 1;
                    userChannelCount.timestamp = Date.now();

                    await client.db.set(`userChannelCount_${newState.member.id}`, userChannelCount);

                    if (userChannelCount.count > 17) {
                        let added = await client.db.get(`blacklist_${client.user.id}`) || [];
                        added.push(newState.member.id);
                        added = [...new Set(added)];
                        await client.db.set(`blacklist_${client.user.id}`, added);
                        return;
                    }

                    const newVC = await newState.guild.channels.create(`${newState.member.user.username}'s VC`, {
                        type: 'GUILD_VOICE',
                        parent: setupData.categoryId,
                        permissionOverwrites: [
                            {
                                id: newState.guild.id,
                                allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK]
                            },
                            {
                                id: newState.member.id,
                                allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK]
                            }
                        ]
                    });

                    await newState.setChannel(newVC);
                    await client.db.set(`voiceChannel_${newVC.id}`, {
                        id: newVC.id,
                        creatorId: newState.member.id
                    });

                    try {
                        if (newVC.type === 'GUILD_VOICE') {
                            const embed = new MessageEmbed()
                                .setColor(client.color)
                                .setAuthor({
                                    name: `${client.user.username}`,
                                    iconURL: client.user.displayAvatarURL()
                                })
                                .setTitle('Voice Interface')
                                .setThumbnail(client.user.displayAvatarURL())
                                .setImage('https://cdn.discordapp.com/attachments/1430601251371880481/1431307745574785024/1761320740459.jpg?ex=68fcf0b6&is=68fb9f36&hm=fc417a85f8dd4bcdcdc25a525be2655dbcf8b59b1daf01db02c3477a6c89a305&')
                                .setDescription('Use the buttons below to control your voice channel.');

                             const row1 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('lock').setEmoji('<:Xytrix_lock:1431299275756671056>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('unlock').setEmoji('<:Xytrix_unlock:1431299432233701508>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('hide').setEmoji('<:Xytrix_hide:1433948052388974672>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('unhide').setEmoji('<:Xytrix_unhide:1433951020005851217>').setStyle('SECONDARY')
            );

        const row2 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('channel_name').setEmoji('<:Xytrix_rename:1431299694507724901>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('user_limit').setEmoji('<:Xytrix_limit:1431299842381975702>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('change_region').setEmoji('<:Xytrix_region:1431299983029833910>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('change_bitrate').setEmoji('<:Xytrix_bitrate:1431300781264338975>').setStyle('SECONDARY')
            );

        const row3 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('mute').setEmoji('<:Xytrix_mute:1431300239712849920>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('unmute').setEmoji('<:Xytrix_voice:1430992734042329108>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('deafen').setEmoji('<:Xytrix_defean:1431300513193787462>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('undeafen').setEmoji('<:Xytrix_undeafean:1431300968858914938>').setStyle('SECONDARY')
            );

        const row4 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('ban').setEmoji('<:Xytrix_ban:1433947999649665024>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('kick').setEmoji('<:Xytrix_kick:1433947952795357346>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('transfer_ownership').setEmoji('<:transfer:1431306190159347772>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('claim_ownership').setEmoji('<:Xytrix_claim:1431301429024260196>').setStyle('SECONDARY')
            );

                            setTimeout(async () => {
                                try {
                                    const fetchedChannel = await newState.guild.channels.fetch(newVC.id);

                                    if (fetchedChannel.isText()) {
                                        await fetchedChannel.send({
                                            content: `<@${newState.member.id}> Control Your Voice Channel Using The Control Butons Below`,
                                            embeds: [embed], components: [row1, row2, row3, row4]
                                        });
                                    } else {
                                        const textChannel = fetchedChannel.textChannel;
                                        if (textChannel) {
                                            await textChannel.send({
                                                content: `<@${newState.member.id}> created a new voice channel!`,
                                                embeds: [embed], components: [row1, row2, row3, row4]
                                            });
                                        }
                                    }
                                } catch (err) {
                                    console.error('Error sending to voice text chat:', err);
                                }
                            }, 1000);
                        }
                    } catch (error) {
                        console.error('Error sending embed message:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling voice state update:', error);
            if (error.code === 429) {
                client.util.handleRateLimit();
            }
        }
    });

    client.on('interactionCreate', async (interaction) => {

        try {
            if (interaction.isButton()) {
                const { customId, user, guild } = interaction;
                const setupData = await client.db.get(`voiceChannelSetup_${guild.id}`);
                const voiceChannelData = await client.db.get(`voiceChannel_${interaction.channelId}`);

                const validButtons = ['lock', 'unlock', 'hide', 'unhide', 'mute', 'unmute', 'deafen', 'undeafen', 'ban', 'kick', 'claim_ownership', 'transfer_ownership', 'change_region', 'change_bitrate', 'user_limit', 'channel_name', 'claim_owner_ontop'];

                if (!validButtons.includes(customId)) {
                    return;
                }

                if (!setupData) {
                    return interaction.reply({ content: 'No setup found for this server.', ephemeral: true });
                }

                const member = guild.members.cache.get(user.id);
                const voiceChannel = member.voice.channel;

                if (!voiceChannel) {
                    return interaction.reply({ content: 'You must be in a voice channel to use these buttons.', ephemeral: true });
                }

                const voiceChannelCreatorData = await client.db.get(`voiceChannel_${voiceChannel.id}`);

                if (!voiceChannelCreatorData || voiceChannel.id !== voiceChannelCreatorData.id) {
                    return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                }
                const isOwner = voiceChannelCreatorData.creatorId !== user.id;

                switch (customId) {
                    case 'lock':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        await voiceChannel.permissionOverwrites.edit(guild.id, {
                            CONNECT: false
                        });
                        await interaction.reply({ content: 'Channel locked.', ephemeral: true });
                        break;

                    case 'unlock':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        await voiceChannel.permissionOverwrites.edit(guild.id, {
                            CONNECT: true
                        });
                        await interaction.reply({ content: 'Channel unlocked.', ephemeral: true });
                        break;

                    case 'hide':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        await voiceChannel.permissionOverwrites.edit(guild.id, {
                            VIEW_CHANNEL: false
                        });
                        await interaction.reply({ content: 'Channel hidden.', ephemeral: true });
                        break;

                    case 'unhide':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        await voiceChannel.permissionOverwrites.edit(guild.id, {
                            VIEW_CHANNEL: true
                        });
                        await interaction.reply({ content: 'Channel unhidden.', ephemeral: true });
                        break;

                    case 'mute':
                    case 'unmute':
                    case 'deafen':
                    case 'undeafen':
                    case 'ban':
                    case 'kick':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        const members = voiceChannel.members
                            .filter(m => m.id !== voiceChannelCreatorData.creatorId)
                            .map(m => ({
                                label: m.user.username,
                                value: m.id
                            }));
                        if (members.length === 0) {
                            return interaction.reply({ content: 'No members to select.', ephemeral: true });
                        }

                        const selectMenu = new MessageSelectMenu()
                            .setCustomId(`${customId}_select`)
                            .setPlaceholder('Select a member')
                            .addOptions(members);

                        const actionRow = new MessageActionRow().addComponents(selectMenu);
                        await interaction.reply({ content: `Select a member to ${customId}`, components: [actionRow], ephemeral: true });
                        break;

                    case 'claim_ownership':
                        if (user.id === voiceChannelCreatorData.creatorId) {
                            return interaction.reply({ content: 'You are already the owner of this voice channel.', ephemeral: true });
                        }
                        const currentOwner = guild.members.cache.get(voiceChannelCreatorData.creatorId);
                        const requestEmbed = new MessageEmbed()
                            .setColor(client.color)
                            .setTitle('Ownership Request')
                            .setDescription(`User ${user.tag} is requesting ownership of the VC. Do you want to transfer ownership?`);

                        const claimButton = new MessageButton()
                            .setCustomId('claim_owner_ontop')
                            .setLabel('Transfer Ownership')
                            .setStyle('PRIMARY');

                        const claimRow = new MessageActionRow().addComponents(claimButton);

                        const message = await voiceChannel.send({ content: `<@${currentOwner.id}> Do you want to transfer the voicechannel ?`, embeds: [requestEmbed], components: [claimRow] });

                        setTimeout(async () => {
                            try {
                                await message.delete();
                                await client.db.delete(`ownership_request_${voiceChannel.id}`);
                            } catch (error) {
                                console.error('Error handling ownership request timeout:', error);
                            }
                        }, 120000);

                        await client.db.set(`ownership_request_${voiceChannel.id}`, {
                            requesterId: user.id,
                            timestamp: Date.now()
                        });

                        await interaction.reply({ content: 'Ownership request sent.', ephemeral: true });
                        break;

                    case 'transfer_ownership':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        const transferModal = new Modal()
                            .setCustomId('transfer_ownership_modal')
                            .setTitle('Transfer Ownership');

                        const userIdInput = new TextInputComponent()
                            .setCustomId('user_id')
                            .setLabel('Enter the User ID of the new owner:')
                            .setStyle('SHORT');

                        const transferActionRow = new MessageActionRow().addComponents(userIdInput);
                        transferModal.addComponents(transferActionRow);

                        await interaction.showModal(transferModal);
                        break;

                    case 'change_region':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        const regionModal = new Modal()
                            .setCustomId('change_region_modal')
                            .setTitle('Change Region');

                        const regionInput = new TextInputComponent()
                            .setCustomId('region')
                            .setLabel('Enter the new region:')
                            .setStyle('SHORT')
                            .setPlaceholder('e.g., eu-west')
                            .setRequired(true);

                        const regionActionRow = new MessageActionRow().addComponents(regionInput);
                        regionModal.addComponents(regionActionRow);

                        await interaction.showModal(regionModal);
                        break;

                    case 'change_bitrate':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        const bitrateModal = new Modal()
                            .setCustomId('change_bitrate_modal')
                            .setTitle('Change Bitrate');

                        const bitrateInput = new TextInputComponent()
                            .setCustomId('bitrate')
                            .setLabel('Enter the new bitrate (e.g., 64000):')
                            .setStyle('SHORT')
                            .setPlaceholder('e.g., 64000')
                            .setRequired(true);

                        const bitrateActionRow = new MessageActionRow().addComponents(bitrateInput);
                        bitrateModal.addComponents(bitrateActionRow);

                        await interaction.showModal(bitrateModal);
                        break;

                    case 'user_limit':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        const userLimitModal = new Modal()
                            .setCustomId('user_limit_modal')
                            .setTitle('Change User Limit');

                        const limitInput = new TextInputComponent()
                            .setCustomId('user_limit')
                            .setLabel('Enter the new user limit:')
                            .setStyle('SHORT')
                            .setPlaceholder('e.g., 10')
                            .setRequired(true);

                        const limitActionRow = new MessageActionRow().addComponents(limitInput);
                        userLimitModal.addComponents(limitActionRow);

                        await interaction.showModal(userLimitModal);
                        break;

                    case 'channel_name':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        const channelNameModal = new Modal()
                            .setCustomId('channel_name_modal')
                            .setTitle('Change Channel Name');

                        const nameInput = new TextInputComponent()
                            .setCustomId('channel_name')
                            .setLabel('Enter the new channel name:')
                            .setStyle('SHORT')
                            .setPlaceholder('e.g., Gaming Room')
                            .setRequired(true);

                        const nameActionRow = new MessageActionRow().addComponents(nameInput);
                        channelNameModal.addComponents(nameActionRow);

                        await interaction.showModal(channelNameModal);
                        break;

                    case 'claim_owner_ontop':
                        if (isOwner) {
                            return interaction.reply({ content: 'You do not have permission to use these buttons.', ephemeral: true });
                        }
                        const requesterData = await client.db.get(`ownership_request_${voiceChannel.id}`);
                        if (!requesterData) {
                            return interaction.reply({ content: 'No ownership request found.', ephemeral: true });
                        }

                        const requester = interaction.guild.members.cache.get(requesterData.requesterId);
                        if (!requester || requester.voice.channel.id !== voiceChannel.id) {
                            return interaction.reply({ content: 'Requester not found in the voice channel.', ephemeral: true });
                        }

                        await client.db.delete(`voiceChannel_${voiceChannel.id}`);

                        await client.db.set(`voiceChannel_${voiceChannel.id}`, {
                            id: voiceChannel.id,
                            creatorId: requester.id
                        });

                        await voiceChannel.permissionOverwrites.delete(interaction.user.id);

                        await voiceChannel.permissionOverwrites.edit(requester.id, {
                            VIEW_CHANNEL: true,
                            CONNECT: true,
                            SPEAK: true
                        });

                        await interaction.reply({ content: `Ownership transferred to ${requester.user.tag}.`, ephemeral: true });
                        await client.db.delete(`ownership_request_${voiceChannel.id}`);
                        break;

                    default:
                        await interaction.reply({ content: 'Unknown button interaction.', ephemeral: true });
                }
            }

            if (interaction.isSelectMenu()) {
                const action = interaction.customId.split('_')[0];
                if (['mute', 'unmute', 'deafen', 'undeafen', 'kick', 'ban'].includes(action)) {
                    await handleMemberSelection(interaction, action);
                } else {
                    return
                }
            }

            if (interaction.isModalSubmit()) {
                await interaction.deferReply({ ephemeral: true });
                const { customId, fields, guild } = interaction;

                try {
                    const setupData = await client.db.get(`voiceChannelSetup_${guild.id}`);
                    const member = guild.members.cache.get(interaction.user.id);
                    const voiceChannel = member?.voice?.channel;

                    const validModals = [
                        'transfer_ownership_modal',
                        'change_region_modal',
                        'change_bitrate_modal',
                        'user_limit_modal',
                        'channel_name_modal'
                    ];

                    if (!validModals.includes(customId)) {
                        return;
                    }

                    if (!setupData || !voiceChannel) {
                        return interaction.editReply({ content: 'Setup data not found or you are not in a voice channel.' });
                    }

                    const voiceChannelCreatorData = await client.db.get(`voiceChannel_${voiceChannel.id}`);

                    if (!voiceChannelCreatorData || voiceChannel.id !== voiceChannelCreatorData.id || voiceChannelCreatorData.creatorId !== interaction.user.id) {
                        return interaction.editReply({ content: 'You do not have permission to use this modal.' });
                    }

                    switch (customId) {
                        case 'transfer_ownership_modal':
                            const userId = fields.getTextInputValue('user_id');
                            const newOwner = guild.members.cache.get(userId);

                            if (interaction.user.id === userId) {
                                return interaction.editReply({ content: 'Dumbo!! You cannot transfer ownership to yourself.' });
                            }

                            if (!newOwner || !newOwner.voice.channel || newOwner.voice.channel.id !== voiceChannel.id) {
                                return interaction.editReply({ content: 'User not found in the voice channel.' });
                            }

                            await client.db.delete(`voiceChannel_${voiceChannel.id}`);
                            await client.db.set(`voiceChannel_${voiceChannel.id}`, {
                                id: voiceChannel.id,
                                creatorId: newOwner.id
                            });

                            await voiceChannel.permissionOverwrites.delete(interaction.user.id);
                            await voiceChannel.permissionOverwrites.edit(newOwner.id, {
                                VIEW_CHANNEL: true,
                                CONNECT: true,
                                SPEAK: true
                            });

                            await interaction.editReply({ content: `Ownership transferred to ${newOwner.user.tag}.` });
                            break;

                        case 'change_region_modal':
                            const region = fields.getTextInputValue('region');
                            const validRegions = [
                                'us-west', 'us-east', 'us-central', 'us-south',
                                'eu-west', 'eu-central', 'singapore', 'japan',
                                'india', 'brazil', 'sydney', 'southafrica'
                            ];

                            if (!validRegions.includes(region)) {
                                return interaction.editReply({ content: 'Invalid region. Valid regions: ' + validRegions.join(', ') });
                            }

                            await voiceChannel.setRTCRegion(region);
                            await interaction.editReply({ content: `Region changed to ${region}.` });
                            break;

                        case 'change_bitrate_modal':
                            const bitrate = parseInt(fields.getTextInputValue('bitrate'), 10);

                            if (isNaN(bitrate) || bitrate < 8000 || bitrate > 96000) {
                                return interaction.editReply({ content: 'Invalid bitrate. Please enter a value between 8000 and 96000.' });
                            }

                            await voiceChannel.setBitrate(bitrate);
                            await interaction.editReply({ content: `Bitrate changed to ${bitrate}.` });
                            break;

                        case 'user_limit_modal':
                            const userLimit = parseInt(fields.getTextInputValue('user_limit'), 10);

                            if (isNaN(userLimit) || userLimit < 0 || userLimit > 99) {
                                return interaction.editReply({ content: 'Invalid user limit. Please enter a value between 0 and 99.' });
                            }

                            await voiceChannel.setUserLimit(userLimit);
                            await interaction.editReply({ content: `User limit changed to ${userLimit}.` });
                            break;

                        case 'channel_name_modal':
                            const channelName = fields.getTextInputValue('channel_name');

                            if (!channelName || channelName.trim().length === 0) {
                                return interaction.editReply({ content: 'Invalid channel name. Name cannot be empty.' });
                            }

                            if (channelName.length > 100) {
                                return interaction.editReply({ content: 'Channel name too long. Maximum 100 characters allowed.' });
                            }

                            const timeoutPromise = new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Channel name change timed out after 10 seconds')), 10000)
                            );

                            try {
                                await Promise.race([
                                    voiceChannel.setName(channelName.trim()),
                                    timeoutPromise
                                ]);

                                await interaction.editReply({ content: `Channel name changed to "${channelName}".` });
                            } catch (nameError) {
                                let errorMsg = 'Failed to change channel name.';
                                if (nameError.message.includes('timed out')) {
                                    errorMsg = 'Channel name change timed out. Please try again.';
                                } else if (nameError.code === 50013) {
                                    errorMsg = 'Missing permissions to change channel name.';
                                } else if (nameError.code === 10003) {
                                    errorMsg = 'Voice channel not found.';
                                } else if (nameError.code === 50035) {
                                    errorMsg = 'Invalid channel name format.';
                                } else if (nameError.code === 20028 || nameError.message.includes('Maximum number of channel name changes')) {
                                    errorMsg = 'Limit Exceeded. Cannot Change Channel Name. Try Again Later.';
                                }

                                await interaction.editReply({ content: errorMsg });
                            }
                            break;


                        default:
                            return interaction.editReply({ content: 'Unknown modal interaction.' });
                    }

                } catch (modalError) {

                    let errorMessage = 'An error occurred while processing your request.';

                    if (modalError.code === 50013) {
                        errorMessage = 'Missing permissions to perform this action.';
                    } else if (modalError.code === 50001) {
                        errorMessage = 'Missing access to perform this action.';
                    } else if (modalError.code === 429) {
                        errorMessage = 'Rate limit exceeded. Please try again later.';
                    } else if (modalError.code === 10003) {
                        errorMessage = 'Channel not found.';
                    } else if (modalError.message?.includes('name')) {
                        errorMessage = 'Invalid channel name. Please try a different name.';
                    } else if (modalError.message?.includes('timed out')) {
                        errorMessage = 'Operation timed out. Please try again.';
                    }

                    try {
                        await interaction.editReply({ content: errorMessage });
                    } catch (replyError) {
                    }
                }
            }

        } catch (error) {

            if (error.code === 429) {
                console.error('[RATE LIMIT] Rate limit hit - Error 429');
                if (client.util?.handleRateLimit) {
                    client.util.handleRateLimit();
                }
            }

            try {
                if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({
                        content: 'An error occurred while processing your request. Please check console for details.'
                    });
                } else if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'An error occurred while processing your request. Please check console for details.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('[FINAL REPLY ERROR] Error sending final error reply:', replyError);
            }
        }
    });

    async function handleMemberSelection(interaction, action) {
        const validActions = ['mute', 'unmute', 'deafen', 'undeafen', 'kick', 'ban'];

        if (!validActions.includes(action)) {
            return;
        }

        const selectedMemberId = interaction.values[0];
        const member = interaction.guild.members.cache.get(selectedMemberId);

        if (!member) {
            return interaction.update({ content: 'Member not found.', components: [] });
        }
        const voiceChannel = member.voice.channel;
        switch (action) {
            case 'mute':
                await member.voice.setMute(true);
                await interaction.update({ content: `${member.user.username} has been muted.`, components: [] });
                break;

            case 'unmute':
                await member.voice.setMute(false);
                await interaction.update({ content: `${member.user.username} has been unmuted.`, components: [] });
                break;

            case 'deafen':
                await member.voice.setDeaf(true);
                await interaction.update({ content: `${member.user.username} has been deafened.`, components: [] });
                break;

            case 'undeafen':
                await member.voice.setDeaf(false);
                await interaction.update({ content: `${member.user.username} has been undeafened.`, components: [] });
                break;

            case 'kick':
                await member.voice.disconnect();
                await interaction.update({ content: `${member.user.username} has been kicked from the voice channel.`, components: [] });
                break;

            case 'ban':
                await member.voice.disconnect();
                await voiceChannel.permissionOverwrites.edit(member.id, {
                    VIEW_CHANNEL: false
                });
                await interaction.update({ content: `${member.user.username} has been banned from the voice channel.`, components: [] });
                break;

            default:
                await interaction.update({ content: 'Unknown action.', components: [] });
        }
    }

};
