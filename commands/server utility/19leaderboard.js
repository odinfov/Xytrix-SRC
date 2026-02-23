const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let formattedTime = '';
    if (hours > 0) formattedTime += `${hours}h `;
    if (minutes > 0) formattedTime += `${minutes}m `;
    if (remainingSeconds > 0) formattedTime += `${remainingSeconds}s`;
    
    return formattedTime.trim() || '0s';
}

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top'],
    category: 'serveru',
    subcommand: ['messages', 'dailymessages', 'voice', 'dailyvoice', 'invites'],
    description: 'Displays leaderboards for various categories',
    premium: false,
    cooldown: 5,

    run: async (client, message, args) => {
        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Leaderboard Commands')
                        .setDescription(
                            `You didn't provide the leaderboard type.\nLeaderboard Options: \`messages\`, \`dailymessages\`, \`voice\`, \`dailyvoice\`, \`invites\``
                        )
                ]
            });
        }

        const subcommand = args[0].toLowerCase();
        const User = client.secondDb.model('User', require('../../models/user'));
        const Invite = client.secondDb.model('Invite', require('../../models/invite'));

        let items = [];
        let title = '';

        switch (subcommand) {
            case 'messages':
            case 'message':
            case 'msg':
                const messageUsers = await User.find({ guild: message.guild.id })
                    .sort({ messages: -1 })
                    .limit(50);
                
                items = await Promise.all(
                    messageUsers.map(async (u, index) => {
                        try {
                            const member = await message.guild.members.fetch(u.user).catch(() => null);
                            if (!member) return null;
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                            return `${medal} ${member.user.tag} - **${u.messages || 0}** messages`;
                        } catch {
                            return null;
                        }
                    })
                );
                items = items.filter(item => item !== null);
                title = 'Top Message Senders';
                break;

            case 'dailymessages':
            case 'dailymessage':
            case 'dailymsg':
                const dailyMessageUsers = await User.find({ guild: message.guild.id })
                    .sort({ dailyMessages: -1 })
                    .limit(50);
                
                items = await Promise.all(
                    dailyMessageUsers.map(async (u, index) => {
                        try {
                            const member = await message.guild.members.fetch(u.user).catch(() => null);
                            if (!member) return null;
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                            return `${medal} ${member.user.tag} - **${u.dailyMessages || 0}** messages`;
                        } catch {
                            return null;
                        }
                    })
                );
                items = items.filter(item => item !== null);
                title = 'Top Daily Message Senders';
                break;

            case 'voice':
            case 'vc':
                const voiceUsers = await User.find({ guild: message.guild.id })
                    .sort({ voiceTime: -1 })
                    .limit(50);
                
                items = await Promise.all(
                    voiceUsers.map(async (u, index) => {
                        try {
                            const member = await message.guild.members.fetch(u.user).catch(() => null);
                            if (!member) return null;
                            
                            let totalTime = u.voiceTime || 0;
                            if (u.isInVoice && u.voiceJoinTimestamp) {
                                const now = new Date();
                                const currentSession = Math.floor((now - new Date(u.voiceJoinTimestamp)) / 1000);
                                totalTime += currentSession;
                            }
                            
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                            return `${medal} ${member.user.tag} - **${formatDuration(totalTime)}**`;
                        } catch {
                            return null;
                        }
                    })
                );
                items = items.filter(item => item !== null);
                title = 'Top Voice Time';
                break;

            case 'dailyvoice':
            case 'dailyvc':
                const dailyVoiceUsers = await User.find({ guild: message.guild.id })
                    .sort({ dailyVoiceTime: -1 })
                    .limit(50);
                
                items = await Promise.all(
                    dailyVoiceUsers.map(async (u, index) => {
                        try {
                            const member = await message.guild.members.fetch(u.user).catch(() => null);
                            if (!member) return null;
                            
                            let dailyTime = u.dailyVoiceTime || 0;
                            if (u.isInVoice && u.voiceJoinTimestamp) {
                                const now = new Date();
                                const currentSession = Math.floor((now - new Date(u.voiceJoinTimestamp)) / 1000);
                                dailyTime += currentSession;
                            }
                            
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                            return `${medal} ${member.user.tag} - **${formatDuration(dailyTime)}**`;
                        } catch {
                            return null;
                        }
                    })
                );
                items = items.filter(item => item !== null);
                title = 'Top Daily Voice Time';
                break;

            case 'invites':
            case 'invite':
            case 'inv':
                const allInvites = await Invite.find({ guildId: message.guild.id });
                
                const inviteMap = new Map();
                allInvites.forEach(invite => {
                    const current = inviteMap.get(invite.inviterId) || { joins: 0, leaves: 0 };
                    current.joins += invite.joins;
                    current.leaves += invite.leaves;
                    inviteMap.set(invite.inviterId, current);
                });

                const sortedInvites = Array.from(inviteMap.entries())
                    .map(([userId, data]) => ({
                        userId: userId,
                        value: data.joins - data.leaves
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 50);

                items = await Promise.all(
                    sortedInvites.map(async (data, index) => {
                        try {
                            const member = await message.guild.members.fetch(data.userId).catch(() => null);
                            if (!member) return null;
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                            return `${medal} ${member.user.tag} - **${data.value}** invites`;
                        } catch {
                            return null;
                        }
                    })
                );
                items = items.filter(item => item !== null);
                title = 'Top Inviters';
                break;

            default:
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setTitle('Leaderboard Commands')
                            .setDescription(
                                `You didn't provide the leaderboard type.\nLeaderboard Options: \`messages\`, \`dailymessages\`, \`voice\`, \`dailyvoice\`, \`invites\``
                            )
                    ]
                });
        }

        if (!items.length) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`No data found for the leaderboard type \`${subcommand}\``)
                ]
            });
        }

        paginate(message, items, title, client.color);
    }
};

function paginate(message, items, title, color) {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
        const embed = new MessageEmbed()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTitle(title)
            .setColor(color);
        
        const start = page * itemsPerPage;
        const end = Math.min(items.length, (page + 1) * itemsPerPage);
        
        let description = '';
        for (let i = start; i < end; i++) {
            description += `${items[i]}\n`;
        }
        
        embed.setDescription(description.trim());
        embed.setFooter({ text: `Page ${page + 1} of ${totalPages}`, iconURL: message.guild.iconURL({ dynamic: true }) });
        embed.setTimestamp();
        
        return embed;
    };

    const generateButtons = (page) => {
        return new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('start')
                .setEmoji('⏮️')
                .setStyle('SECONDARY')
                .setDisabled(page === 0),
            new MessageButton()
                .setCustomId('prev')
                .setEmoji('◀️')
                .setStyle('SECONDARY')
                .setDisabled(page === 0),
            new MessageButton()
                .setCustomId('delete')
                .setEmoji('⏹️')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('next')
                .setEmoji('▶️')
                .setStyle('SECONDARY')
                .setDisabled(page === totalPages - 1),
            new MessageButton()
                .setCustomId('end')
                .setEmoji('⏭️')
                .setStyle('SECONDARY')
                .setDisabled(page === totalPages - 1)
        );
    };

    const filter = (interaction) => 
        ['start', 'prev', 'next', 'end', 'delete'].includes(interaction.customId) && 
        interaction.user.id === message.author.id;

    message.channel.send({ 
        embeds: [generateEmbed(currentPage)], 
        components: [generateButtons(currentPage)] 
    }).then(msg => {
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', (interaction) => {
            if (interaction.customId === 'start') {
                currentPage = 0;
            } else if (interaction.customId === 'prev') {
                currentPage--;
            } else if (interaction.customId === 'next') {
                currentPage++;
            } else if (interaction.customId === 'end') {
                currentPage = totalPages - 1;
            } else if (interaction.customId === 'delete') {
                return msg.delete();
            }

            interaction.update({ 
                embeds: [generateEmbed(currentPage)], 
                components: [generateButtons(currentPage)] 
            });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    });
}
