const bannedUsers = new Map();

module.exports.vcban = {
    name: 'vcban',
    category: 'voice',
    subcommand: ['list'],
    aliases: [],
    description: `Ban a user from connecting to voice channels in this server or list currently banned users.`,
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let admin = await Admin.findOne({ guildId, adminId });

        if (args[0]?.toLowerCase() === 'list') {
            if (!bannedUsers.has(guildId) || bannedUsers.get(guildId).size === 0) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Voice Channel Bans')
                        .setDescription('No users are currently banned from voice channels in this server.')
                    ]
                });
            }

            const bannedMemberIds = Array.from(bannedUsers.get(guildId));
            const bannedMembers = await Promise.all(
                bannedMemberIds.map(async (userId) => {
                    const member = await message.guild.members.fetch(userId).catch(() => null);
                    return member ? `<@${userId}> (${member.user.tag})` : `<@${userId}> (User left server)`;
                })
            );

            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setTitle('Voice Channel Bans')
                    .setDescription(bannedMembers.join('\n'))
                    .setFooter({ text: `Total Banned Users: ${bannedMembers.length}` })
                ]
            });
        }
        
        if (!admin && !isSpecialMember && !message.member.permissions.has('MOVE_MEMBERS')) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('You must have `Move members` permission to use this command.')]
            });
        }

        if (!message.guild.me.permissions.has('MOVE_MEMBERS')) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('I must have `Move members` permission to use this command.')]
            });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Please either mention a user to ban or use `vcban list` to see banned users.')]
            });
        }

        let own = message.author.id == message.guild.ownerId;
        if (!own && !admin && !isSpecialMember && member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You cannot ban someone with a higher or equal role.`)
                ]
            });
        }

        if (member.roles.highest.position >= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I cannot ban someone with a higher or equal role than me.`)
                ]
            });
        }

        const targetIsSpecialMember = config.boss.includes(member.user.id); 
        if (targetIsSpecialMember) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`You cannot ban <@${member.user.id}> from voice channels.`)]
            });
        }

        const activeAdmins = await Admin.find({ guildId });
        const targetAdminId = member.id;
        const targetAdmin = activeAdmins.find(a => a.adminId === targetAdminId);
        
        if (targetAdmin && !isSpecialMember) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('You cannot ban a server admin from voice channels.')]
            });
        }        

        if (member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`You cannot VC ban a member with Administrator permission.`)]
            });
        }

        if (!message.member.voice.channel) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`You must be connected to a voice channel first.`)]
            });
        }        

        if (!member.voice.channel) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`<@${member.user.id}> is not in a voice channel.`)]
            });
        }

        if (message.member.voice.channel.id !== member.voice.channel.id) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`<@${member.user.id}> is not in the same voice channel as you.`)]
            });
        }

        try {
            if (!bannedUsers.has(guildId)) {
                bannedUsers.set(guildId, new Set());
            }
            bannedUsers.get(guildId).add(member.user.id);
            
            await member.voice.disconnect();
            
            message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`Successfully banned <@${member.user.id}> from voice channels in this server!`)]
            });
        } catch (err) {
            console.error(err);
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`I was unable to voice ban <@${member.user.id}>.`)]
            });
        }
    }
};

module.exports.vcban.listenForVoiceStateUpdates = (client) => {
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (!newState.guild) return;
        const guildId = newState.guild.id;
        if (bannedUsers.has(guildId) && bannedUsers.get(guildId).has(newState.member.id)) {
            if (newState.channelId) {
                newState.disconnect().catch(err => console.log(`Failed to disconnect banned user: ${err}`));
            }
        }
    });
};

module.exports.vcban.bannedUsers = bannedUsers;