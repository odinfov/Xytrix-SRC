const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'invited',
    description: 'Shows the members who joined using your or specified user\'s invite link',
    category: 'serveru',
    cooldown: 5,
    usage: '[user/userId]',

    run: async (client, message, args) => {
        try {
            let targetUser = message.author;
            let targetMember = message.member;

            if (args.length > 0) {
                const userInput = args[0].replace(/[<@!>]/g, '');
                
                try {
                    targetMember = await message.guild.members.fetch({ 
                        user: userInput
                    }).catch(() => null);
                    
                    if (targetMember) {
                        targetUser = targetMember.user;
                    } else {
                        targetUser = await client.users.fetch(userInput).catch(() => null);
                        
                        if (!targetUser) {
                            return message.channel.send('Could not find that user. Please provide a valid user mention or ID.');
                        }
                    }
                } catch (err) {
                    targetUser = message.author;
                    targetMember = message.member;
                }
            }

            const Invite = client.secondDb.model('Invite', require('../../models/invite'));
            const userInvites = await Invite.find({ guildId: message.guild.id, inviterId: targetUser.id });

            if (!userInvites.length) {
                return message.channel.send(`${targetUser.id === message.author.id ? 'You have' : `${targetUser.username} has`} no invites tracked in this server.`);
            }

            let invitedMembers = [];
            for (const invite of userInvites) {
                for (const memberId of invite.members) {
                    const member = await message.guild.members.fetch(memberId).catch(() => null);
                    if (member) {
                        invitedMembers.push(member);
                    }
                }
            }

            if (invitedMembers.length === 0) {
                return message.channel.send(`No members have joined using ${targetUser.id === message.author.id ? 'your' : `${targetUser.username}'s`} invite link yet.`);
            }

            const itemsPerPage = 5; 
            const pages = Math.ceil(invitedMembers.length / itemsPerPage);
            let currentPage = 0;

            const generateEmbed = (page) => {
                const startIndex = page * itemsPerPage;
                const currentMembers = invitedMembers.slice(startIndex, startIndex + itemsPerPage);
                
                const embed = new MessageEmbed()
                    .setAuthor(`${targetUser.username}'s Invited Members`, targetUser.displayAvatarURL({ dynamic: true }))
                    .setColor(client.color)
                    .setFooter(`Page ${page + 1}/${pages}  •  Total Members: ${invitedMembers.length}`)

                let description = `Here are the members who joined using ${targetUser.id === message.author.id ? 'your' : `${targetUser.username}'s`} invite link:\n\n`;

                currentMembers.forEach((member, index) => {
                    const createdTimestamp = Math.floor(member.user.createdAt.getTime() / 1000);
                    const joinedTimestamp = Math.floor(member.joinedAt.getTime() / 1000);
                    
                    description += `${startIndex + index + 1}. <@${member.user.id}>\nCreated: <t:${createdTimestamp}:R> | Joined: <t:${joinedTimestamp}:R>\n`;
                });
                
                embed.setDescription(description);
                return embed;
            };

            const getButtonRow = (disableAll = false) => {
                const row = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setCustomId('first')
                        .setStyle('SECONDARY')
                        .setEmoji('⏮️')
                        .setDisabled(disableAll || currentPage === 0),
                    new MessageButton()
                        .setCustomId('prev')
                        .setStyle('SECONDARY')
                        .setEmoji('◀️')
                        .setDisabled(disableAll || currentPage === 0),
                    new MessageButton()
                        .setCustomId('next')
                        .setStyle('SECONDARY')
                        .setEmoji('▶️')
                        .setDisabled(disableAll || currentPage === pages - 1),
                    new MessageButton()
                        .setCustomId('last')
                        .setStyle('SECONDARY')
                        .setEmoji('⏭️')
                        .setDisabled(disableAll || currentPage === pages - 1)
                );
                return row;
            };

            const embedMessage = await message.channel.send({
                embeds: [generateEmbed(currentPage)],
                components: [getButtonRow()]
            });

            const collector = embedMessage.createMessageComponentCollector({
                filter: (interaction) => 
                    ['first', 'prev', 'next', 'last'].includes(interaction.customId) && 
                    interaction.user.id === message.author.id,
                time: 60000 
            });

            collector.on('collect', async (interaction) => {
                switch (interaction.customId) {
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(pages - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = pages - 1;
                        break;
                }

                await interaction.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [getButtonRow()]
                });
            });

            collector.on('end', () => {
                embedMessage.edit({
                    embeds: [generateEmbed(currentPage)],
                    components: [getButtonRow(true)]
                }).catch(() => {});
            });
            
        } catch (err) {
            console.error('Error in `invited` command:', err);
            message.channel.send('An error occurred while fetching the invited members. Please try again later.');
        }
    }
};
