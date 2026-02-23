const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'list',
    aliases: ['l'],
    category: 'mod',
    subcommand: ['admin', 'bot', 'inrole', 'ban', 'roles', 'boost', 'joinpos'],
    description: `Displays a list of the following categories`,
    premium: false,

    run: async (client, message, args) => {
        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `You didn't provide the list type.\nList Options: \`admin\`, \`bot\`, \`inrole\`, \`ban\`, \`roles\`, \`boost\`, \`joinpos\``
                        )
                ]
            });
        }

        const listType = args[0].toLowerCase();
        let items = [];

        await message.guild.members.fetch(); 

        switch (listType) {
            case 'admin':
            case 'admins':
            case 'administration':
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setTitle('Choose List Type')
                            .setDescription('Please choose whether to list Admin Bots or Admin Humans or Admin Roles:')
                    ],
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton()
                                .setCustomId('admin_bots')
                                .setLabel('Bots')
                                .setStyle('SECONDARY'),
                            new MessageButton()
                                .setCustomId('admin_humans')
                                .setLabel('Humans')
                                .setStyle('SECONDARY'),
                            new MessageButton()
                                .setCustomId('admin_roles')
                                .setLabel('Roles')
                                .setStyle('SECONDARY')
                        )
                    ]
                }).then(msg => {
                    const filter = (interaction) => 
                        ['admin_bots', 'admin_humans', 'admin_roles'].includes(interaction.customId) && 
                        interaction.user.id === message.author.id;
                    
                    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', (interaction) => {
                        if (interaction.customId === 'admin_bots') {
                            items = message.guild.members.cache
                                .filter((member) => member.permissions.has('ADMINISTRATOR') && member.user.bot)
                                .map((member) => `<@${member.id}> | ${member.id}`);
                        } else if (interaction.customId === 'admin_humans') {
                            items = message.guild.members.cache
                                .filter((member) => member.permissions.has('ADMINISTRATOR') && !member.user.bot)
                                .map((member) => `<@${member.id}> | ${member.id}`);
                        } else if (interaction.customId === 'admin_roles') {
                            items = message.guild.roles.cache
                                .filter(role => {
                                    
                                    const roleName = role.name.toLowerCase();
                                    const isIntegrationRole = 
                                        roleName.includes('integration') || 
                                        roleName.includes('bot') || 
                                        role.tags?.botId || 
                                        role.tags?.integrationId;
                                    
                                    return role.permissions.has('ADMINISTRATOR') && !isIntegrationRole;
                                })
                                .sort((a, b) => b.position - a.position)
                                .map(role => `<@&${role.id}> | ${role.id}`);
                        }

                        if (!items.length) {
                            return interaction.update({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setDescription(`No items found for the selected category`)
                                ],
                                components: []
                            }).then(() => {
                                msg.delete();
                            });
                        }

                        paginate(message, items, 
                            interaction.customId === 'admin_roles' ? 'Administrator Roles' : 
                            interaction.customId === 'admin_bots' ? 'Administrator Bots' : 
                            'Administrator Humans', 
                            client.color
                        );
                        interaction.update({ components: [] }).then(() => {
                            msg.delete();
                        });
                    });

                    collector.on('end', () => {
                        msg.edit({ components: [] });
                    });
                });

            case 'bot':
            case 'bots':
                items = message.guild.members.cache
                    .filter((member) => member.user.bot)
                    .map((member, index) => `<@${member.id}> | ${member.id}`);
                break;

            case 'inrole':
                const roleId = args[1]?.replace(/[<@&>]/g, '');
                const role = message.guild.roles.cache.get(roleId) || message.guild.roles.cache.find(r => r.name === args.slice(1).join(' '));
                if (!role) {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.cross} No roles found.`
                                )
                        ]
                    });
                }
                items = role.members
                    .sort((a, b) => b.user.bot - a.user.bot)
                    .map((member) => `<@${member.user.id}>`);
                break;

            case 'ban':
            case 'bans':
                const bans = await message.guild.bans.fetch();
                items = bans.map((ban) => `${ban.user.username} | ${ban.user.id}`);
                break;

            case 'roles':
            case 'role':
                items = message.guild.roles.cache
                    .sort((a, b) => b.position - a.position)
                    .map((role) => `<@&${role.id}> | ${role.id}`);
                break;

            case 'boosts':
            case 'boost':
            case 'booster':  
            case 'boosters':                              
                items = message.guild.members.cache
                    .filter((member) => member.premiumSince !== null)
                    .map((member) => `<@${member.id}> | ${member.id}`);
                break;
                
            case 'joinpos':
            case 'joinposition':
                items = message.guild.members.cache
                    .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
                    .map((member) => 
                        `<@${member.id}> <t:${Math.floor(member.joinedTimestamp / 1000)}:R> | ${member.id}`
                    );
                break;

            default:
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `You didn't provide the list type.\nList Options: \`admin\`, \`bot\`, \`inrole\`, \`ban\`, \`roles\`, \`boost\`, \`joinpos\``
                            )
                    ]
                });
        }
        

        if (!items.length) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`No items found for the list type \`${listType}\``)
                ]
            });
        }

        paginate(message, items, listType, client.color);
    }
};

function paginate(message, items, listType, color) {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
        const embed = new MessageEmbed()
            .setAuthor(message.guild.name, message.guild.iconURL())
            .setTitle(`List of ${listType.charAt(0).toUpperCase() + listType.slice(1)} In This Server`)
            .setColor(color);

        
        const start = page * itemsPerPage;
        const end = Math.min(items.length, (page + 1) * itemsPerPage);

        
        let description = '';
        for (let i = start; i < end; i++) {
            description += `${i + 1}. ${items[i]}\n`; 
        }

        embed.setDescription(description.trim());
        embed.setFooter(`Page ${page + 1} of ${totalPages}`);

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

    const filter = (interaction) => ['start', 'prev', 'next', 'end', 'delete'].includes(interaction.customId) && interaction.user.id === message.author.id;

    message.channel.send({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] }).then(msg => {
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
            interaction.update({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
        });

        collector.on('end', () => {
            msg.edit({ components: [] });
        });
    });
}
