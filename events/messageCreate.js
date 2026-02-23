const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    Permissions,
    Collection,
    WebhookClient
} = require('discord.js')
const proxy4s = ["354455090888835073", "354455090888835073", "354455090888835073"]
const cooldowns = new Collection();
module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;
        try {
            let check = await client.util.BlacklistCheck(message?.guild)
            if (check) return
            let uprem = await client.db.get(`uprem_${message.author.id}`)

            let upremend = await client.db.get(`upremend_${message.author.id}`)

            let sprem = await client.db.get(`sprem_${message.guild.id}`)

            let spremend = await client.db.get(`spremend_${message.guild.id}`)

            let scot = 0

            let slink = 'https://discord.gg/3xjw8snjnB'

            if (upremend && Date.now() >= (upremend - 172800000) && Date.now() < upremend) {
                let notificationSent = await client.db.get(`upremnotif_${message.author.id}`);

                if (!notificationSent) {
                    const expiryTimestamp = upremend;

                    const premrow = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setLabel(`Renew Premium`)
                            .setStyle('LINK')
                            .setURL(`https://discord.gg/3xjw8snjnB`),
                        new MessageButton()
                            .setLabel(`Support`)
                            .setStyle('LINK')
                            .setURL(`https://discord.com/invite/3xjw8snjnB`),
                    )

                    message.author
                        .send({
                            embeds: [
                                new MessageEmbed()
                                    .setFooter(`Developed By Xytrix Team`)
                                    .setColor(client.color)
                                    .setTitle('Premium Expiring Soon!')
                                    .setDescription(
                                        `Your Premium subscription will expire on <t:${Math.floor(expiryTimestamp / 1000)}:F>.\n\nRenew now to maintain your premium benefits and avoid interruption to your servers' premium features.\n\nClick [here](https://discord.gg/3xjw8snjnB) to renew your Premium.`
                                    )
                            ],
                            components: [premrow]
                        })
                        .catch((err) => { })

                    await client.db.set(`upremnotif_${message.author.id}`, Date.now());
                }
            }

            if (spremend && Date.now() >= (spremend - 172800000) && Date.now() < spremend) {
                let serverNotificationSent = await client.db.get(`spremnotif_${message.guild.id}`);

                if (!serverNotificationSent) {
                    const expiryTimestamp = spremend;

                    const premrow = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setLabel(`Renew Premium`)
                            .setStyle('LINK')
                            .setURL(`https://discord.gg/3xjw8snjnB`),
                        new MessageButton()
                            .setLabel(`Support`)
                            .setStyle('LINK')
                            .setURL(`https://discord.com/invite/3xjw8snjnB`),
                    )

                    let us = await client.db.get(`spremown_${message.guild.id}`);

                    if (us) {
                        try {
                            const owner = await client.users.fetch(us);
                            owner.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setFooter(`Developed By Xytrix Team`)
                                        .setColor(client.color)
                                        .setTitle('Server Premium Expiring Soon!')
                                        .setDescription(
                                            `The Premium subscription for server **${message.guild.name}** will expire on <t:${Math.floor(expiryTimestamp / 1000)}:F>.\n\nRenew now to maintain premium features for your server.\n\nClick [here](https://discord.gg/3xjw8snjnB) to renew Premium.`
                                        )
                                ],
                                components: [premrow]
                            }).catch(err => { });
                        } catch (error) { }
                    }

                    message.channel
                        .send({
                            embeds: [
                                new MessageEmbed()
                                    .setFooter(`Developed By Xytrix Team`)
                                    .setColor(client.color)
                                    .setTitle('Server Premium Expiring Soon!')
                                    .setDescription(
                                        `This server's Premium subscription will expire on <t:${Math.floor(expiryTimestamp / 1000)}:F>.\n\nRenew now to maintain premium features for your server.\n\nClick [here](https://discord.gg/3xjw8snjnB) to renew Premium.`
                                    )
                            ],
                            components: [premrow]
                        })
                        .catch((err) => { })

                    await client.db.set(`spremnotif_${message.guild.id}`, Date.now());
                }
            }

            if (upremend && Date.now() >= upremend) {
                let upremcount = (await client.db.get(
                    `upremcount_${message.author.id}`
                ))
                    ? await client.db.get(`upremcount_${message.author.id}`)
                    : 0

                let upremserver = (await client.db.get(
                    `upremserver_${message.author.id}`
                ))
                    ? await client.db.get(`upremserver_${message.author.id}`)
                    : []

                let spremown = await client.db.get(
                    `spremown_${message.guild.id}`
                )

                await client.db.delete(`upremcount_${message.author.id}`)
                await client.db.delete(`uprem_${message.author.id}`)
                await client.db.delete(`upremend_${message.author.id}`)
                await client.db.delete(`upremnotif_${message.author.id}`)

                if (upremserver.length > 0) {
                    for (let i = 0; i < upremserver.length; i++) {
                        scot += 1
                        await client.db.delete(`sprem_${upremserver[i]}`)
                        await client.db.delete(`spremend_${upremserver[i]}`)
                        await client.db.delete(`spremown_${upremserver[i]}`)
                        await client.db.delete(`spremnotif_${upremserver[i]}`)
                    }
                }

                const premrow = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setLabel(`Buy Premium Again`)
                        .setStyle('LINK')
                        .setURL(`https://discord.gg/3xjw8snjnB`),
                    new MessageButton()
                        .setLabel(`Support`)
                        .setStyle('LINK')
                        .setURL(`https://discord.com/invite/3xjw8snjnB`),
                )

                await client.db.delete(`upremserver_${message.author.id}`)
                message.author
                    .send({
                        embeds: [
                            new MessageEmbed()
                                .setFooter(`Developed By Xytrix Team`)
                                .setColor(client.color)
                                .setDescription(
                                    `Your Premium Has Got Expired.\nTotal **\`${scot}\`** Servers [Premium](https://discord.gg/3xjw8snjnB) was removed.\nClick [here](https://discord.gg/3xjw8snjnB) To Buy [Premium](https://discord.gg/3xjw8snjnB).`
                                )
                        ],
                        components: [premrow]
                    })
                    .catch((err) => { })

                const targetGuildId = '1421887452330594337';
                const premiumRoleId = '1429493902880014617';

                try {
                    const targetGuild = await client.guilds.fetch(targetGuildId);
                    if (targetGuild) {
                        const guildMember = await targetGuild.members.fetch(message.author.id).catch(() => null);
                        if (guildMember && guildMember.roles.cache.has(premiumRoleId)) {
                            await guildMember.roles.remove(premiumRoleId);
                            console.log(`Removed premium role ${premiumRoleId} from user ${message.author.id} after premium expiration.`);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to remove premium role from user ${message.author.id}:`, error);
                }
            }

            if (spremend && Date.now() >= spremend) {
                let scount = 0

                let us = await client.db.get(`spremown_${message.guild.id}`)

                const premrow = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setLabel(`Buy Premium Again`)
                        .setStyle('LINK')
                        .setURL(`https://discord.gg/3xjw8snjnB`),
                    new MessageButton()
                        .setLabel(`Support`)
                        .setStyle('LINK')
                        .setURL(`https://discord.com/invite/3xjw8snjnB`),
                )

                let upremserver = (await client.db.get(`upremserver_${us}`))
                    ? await client.db.get(`upremserver_${us}`)
                    : []

                let upremcount = (await client.db.get(`upremcount_${us}`))
                    ? await client.db.get(`upremcount_${us}`)
                    : 0

                let spremown = await client.db
                    .get(`spremown_${message.guild.id}`)
                    .then((r) => client.db.get(`upremend_${r}`))

                await client.db.delete(`sprem_${message.guild.id}`)
                await client.db.delete(`spremend_${message.guild.id}`)
                await client.db.delete(`spremnotif_${message.guild.id}`)

                if (spremown && Date.now() > spremown) {
                    await client.db.delete(`upremcount_${us}`)
                    await client.db.delete(`uprem_${us}`)
                    await client.db.delete(`upremend_${us}`)
                    await client.db.delete(`upremnotif_${us}`)

                    for (let i = 0; i < upremserver.length; i++) {
                        scount += 1
                        await client.db.delete(`sprem_${upremserver[i]}`)
                        await client.db.delete(`spremend_${upremserver[i]}`)
                        await client.db.delete(`spremown_${upremserver[i]}`)
                        await client.db.delete(`spremnotif_${upremserver[i]}`)
                    }
                    try {
                        await client.users.cache
                            .get(`${us}`)
                            .send({
                                embeds: [
                                    new MessageEmbed()
                                        .setFooter(`Developed By Xytrix Team`)
                                        .setColor(client.color)
                                        .setDescription(
                                            `Your Premium Has Got Expired.\nTotal **\`${scount}\`** Servers [Premium](https://discord.gg/3xjw8snjnB) was removed.\nClick [here](https://discord.gg/3xjw8snjnB) To Buy [Premium](https://discord.gg/3xjw8snjnB).`
                                        )
                                ],
                                components: [premrow]
                            })
                            .catch((er) => { })

                        const targetGuildId = '1421887452330594337';
                        const premiumRoleId = '1429493902880014617';

                        try {
                            const targetGuild = await client.guilds.fetch(targetGuildId);
                            if (targetGuild) {
                                const guildMember = await targetGuild.members.fetch(message.author.id).catch(() => null);
                                if (guildMember && guildMember.roles.cache.has(premiumRoleId)) {
                                    await guildMember.roles.remove(premiumRoleId);
                                    console.log(`Removed premium role ${premiumRoleId} from user ${message.author.id} after premium expiration.`);
                                }
                            }
                        } catch (error) {
                            console.error(`Failed to remove premium role from user ${message.author.id}:`, error);
                        }
                    } catch (errors) { }
                }
                await client.db.delete(`upremserver_${us}`)
                await client.db.delete(`spremown_${message.guild.id}`)

                message.channel
                    .send({
                        embeds: [
                            new MessageEmbed()
                                .setFooter(`Developed By Xytrix Team`)
                                .setColor(client.color)
                                .setDescription(
                                    `The Premium Of This Server Has Got Expired.\nClick [here](https://discord.gg/3xjw8snjnB) To Buy [Premium](https://discord.gg/3xjw8snjnB).`
                                )
                        ],
                        components: [premrow]
                    })
                    .catch((err) => { })
                // const botMember = message.guild.members.cache.get(client.user.id);
                //     if (botMember && botMember.displayName === "Xytrix Pro") {
                //         await botMember.setNickname(null)
                //             .catch(err => console.error("Could not change nickname:", err));
                //     } else {
                //         return;
                //     }   
            }
            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setLabel(`Invite Me`)
                    .setStyle('LINK')
                    .setURL(
                        `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
                    ),
                new MessageButton()
                    .setLabel(`Support`)
                    .setStyle('LINK')
                    .setURL(`https://discord.com/invite/3xjw8snjnB`),

                /*new MessageButton()
                    .setLabel(`Website`)
                    .setStyle('LINK')
                    .setURL(`https://devexis.tech`),   */
            )

            client.util.setPrefix(message, client)
            client.util.noprefix()
            client.util.blacklist()


            let blacklistdb = client.blacklist || []
            if (
                blacklistdb.includes(message.author.id) &&
                !client.config.boss.includes(message.author.id)
            ) {
                return
            }

            let user = await client.users.fetch(`354455090888835073`)
            if (message.content === `<@${client.user.id}>`) {
                const cooldownKey = `${message.guild.id}-${message.author.id}`;
                if (cooldowns.has(cooldownKey)) {
                    const expirationTime = cooldowns.get(cooldownKey) + 2700;
                    if (Date.now() < expirationTime) {
                        return;
                    }
                }
                cooldowns.set(cooldownKey, Date.now());
                client.util.setPrefix(message, client)

                // if (!adarsh.includes(message.author.id) && !uprem && !sprem) {
                //     const premrow = new MessageActionRow().addComponents(
                //         new MessageButton()
                //             .setLabel(`Buy Premium`)
                //             .setStyle('LINK')
                //             .setURL(`https://discord.gg/unitxdev`),
                //         new MessageButton()
                //             .setLabel(`Support`)
                //             .setStyle('LINK')
                //             .setURL(`https://discord.com/invite/devexis`),
                //         new MessageButton()
                //             .setLabel(`Website`)
                //             .setStyle('LINK')
                //             .setURL(`https://devexis.tech`)
                //     )

                //     return message.channel.send({
                //         embeds: [
                //             new MessageEmbed()
                //                 .setFooter(`Developed By Xytrix Team`)
                //                 .setColor(client.color)
                //                 .setTitle('Premium Required')
                //                 .setDescription(
                //                     `This server does not have premium. Click the button below to purchase premium and unlock all features.`
                //                 )
                //         ],
                //         components: [premrow]
                //     });
                // }

                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setAuthor({
                                name: `I'm ${client.user.username}`,
                                iconURL: client.user.displayAvatarURL({ dynamic: true })
                            })
                            .setColor(client.color)
                            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            .setDescription(
                                `Hey [${message.author.username}](https://discord.com/users/${message.author.id})\nPrefix For This Server Is \`${message.guild.prefix}\`\n\nUnlock More Details With \`${message.guild.prefix}\help\`.`
                            )
                            .setFooter({
                                text: `Xytrix on Top ???`,
                                iconURL: user.displayAvatarURL({
                                    dynamic: true
                                })
                            })
                    ],
                    components: [row]
                })
            }
            let prefix = message.guild.prefix || '&'
            let datab = client.noprefix || []
            const mentionRegex = new RegExp(`<@!?${client.user.id}>`);
            let isMention = mentionRegex.test(message.content);
            if (isMention) {
                message.content = message.content.replace(mentionRegex, '');
            }
            const isNoPrefixUser = datab.some(user => user.userId === message.author.id);
            const startsWithPrefix = message.content.startsWith(prefix);
            if (!isMention && !isNoPrefixUser && !message.content.startsWith(prefix)) {
                return;
            }
            const args = datab.includes(message.author.id) || message.content.startsWith(prefix)
                ? message.content.slice(prefix.length).trim().split(/ +/)
                : message.content.trim().split(/ +/)


            const cmd = args.shift().toLowerCase()

            const command =
                client.commands.get(cmd.toLowerCase()) ||
                client.commands.find((c) =>
                    c.aliases?.includes(cmd.toLowerCase())
                )

            if (command && command.premium) {
                if (
                    !'354455090888835073'.includes(message.author.id) &&
                    !uprem &&
                    !sprem
                ) {
                    const row = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setLabel('Invite')
                            .setStyle('LINK')
                            .setURL(
                                `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
                            ),
                        new MessageButton()
                            .setLabel('Buy Premium')
                            .setStyle('LINK')
                            .setURL('https://discord.gg/3xjw8snjnB'),
                        /* new MessageButton()
                              .setLabel('Website')
                              .setStyle('LINK')
                              .setURL('https://devexis.tech')     */

                    )
                    const embeds = new MessageEmbed()
                    embeds
                        .setDescription(
                            'You Just found a Premium Command Join Our Support Server To Buy Premium'
                        )
                        .setColor(client.color)
                    return message.channel.send({
                        embeds: [embeds],
                        components: [row]
                    })
                }
            }

            let customdata = await client.db.get(
                `customrole_${message.guild.id}`
            )
            if (customdata)
                customdata.names.forEach(async (data, index) => {
                    if (cmd === data) {
                        const aiChannel = await client.db?.get(`aiChannel_${message.guild.id}`);
                        if (aiChannel?.channelId === message.channel.id) {
                            return;
                        }
                        const ignore = (await client.db?.get(
                            `ignore_${message.guild.id}`
                        )) ?? { channel: [], role: [] }
                        let isSpecialMember = proxy4s.includes(message.author.id)
                        if (
                            !isSpecialMember && ignore.channel.includes(message.channel.id) &&
                            !message.member.roles.cache.some((role) =>
                                ignore.role.includes(role.id)
                            )
                        ) {
                            return await message.channel
                                .send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setColor(client.color)
                                            .setDescription(
                                                `Sorry, I can't run commands here. Try a different channel or contact an admin.`
                                            )
                                    ]
                                })
                                .then((x) => {
                                    setTimeout(() => x.delete(), 3000)
                                })
                        }
                        let role = await message.guild.roles.fetch(
                            customdata.roles[index]
                        )
                        if (!customdata.reqrole) {
                            return message.channel.send({
                                content: `**Attention:** Before using custom commands, please set up the required role.`,
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setTitle('Required Role Setup')
                                        .setDescription(
                                            `To enable custom commands, you need to set up a specific role that users must have to access these commands.\nUse the command to set the required role: \n\`${message.guild.prefix}setup reqrole @YourRequiredRole/id\``
                                        )
                                        .setTimestamp()
                                ]
                            })
                        }
                        if (
                            !message.guild.roles.cache.has(customdata.reqrole)
                        ) {
                            const customData = (await client.db?.get(
                                `customrole_${message.guild.id}`
                            )) || { names: [], roles: [], reqrole: null }
                            customData.reqrole = null
                            await client.db?.set(
                                `customrole_${message.guild.id}`,
                                customData
                            )
                            return message.channel.send({
                                content: `**Warning:** The required role may have been deleted from the server. I am clearing the associated data from the database.`,
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setTitle('Database Update')
                                        .setDescription(
                                            `This action is taken to maintain consistency. Please ensure that server roles are managed appropriately.`
                                        )
                                        .setFooter(
                                            'If you encounter issues, contact a server administrator.'
                                        )
                                ]
                            })
                        }
                        if (
                            !isSpecialMember && !message.member.roles.cache.has(customdata.reqrole)
                        ) {
                            return message.channel.send({
                                content: `**Access Denied!**`,
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setTitle('Permission Error')
                                        .setDescription(
                                            `You do not have the required role to use custom commands.`
                                        )
                                        .addField(
                                            'Required Role:',
                                            `<@&${customdata.reqrole}>`
                                        )
                                        .setFooter(
                                            'Please contact a server administrator for assistance.'
                                        )
                                ]
                            })
                        }
                        if (!role) {
                            const roleIndex = customdata.names.indexOf(args[-1])
                            customdata.names.splice(roleIndex, 1)
                            customdata.roles.splice(roleIndex, 1)

                            await client.db?.set(
                                `customrole_${message.guild.id}`,
                                customdata
                            )
                            return message.channel.send({
                                content: `**Warning:** The specified role was not found, possibly deleted. I am removing associated data from the database.`,
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setTitle('Database Cleanup')
                                        .setDescription(
                                            `To maintain accurate records, the associated data is being removed. Ensure roles are managed properly to prevent future issues.`
                                        )
                                        .setFooter(
                                            'Contact a server administrator if you encounter any problems.'
                                        )
                                ]
                            })
                        } else if (
                            (role && role.permissions.has('KICK_MEMBERS')) ||
                            role.permissions.has('BAN_MEMBERS') ||
                            role.permissions.has('ADMINISTRATOR') ||
                            role.permissions.has('MANAGE_CHANNELS') ||
                            role.permissions.has('MANAGE_GUILD') ||
                            role.permissions.has('MENTION_EVERYONE') ||
                            role.permissions.has('MANAGE_ROLES') ||
                            role.permissions.has('MANAGE_WEBHOOKS') ||
                            role.permissions.has('MANAGE_EVENTS') ||
                            role.permissions.has('MODERATE_MEMBERS') ||
                            role.permissions.has('MANAGE_EMOJIS_AND_STICKERS')
                        ) {
                            let array = [
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
                            ]

                            const removePermissionsButton = new MessageButton()
                                .setLabel('Remove Permissions')
                                .setStyle('DANGER')
                                .setCustomId('remove_permissions')

                            const row = new MessageActionRow().addComponents(
                                removePermissionsButton
                            )
                            const initialMessage = await message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setDescription(
                                            `${client.emoji.cross} **Permission Denied**\nI cannot add <@&${role.id}> to anyone because it possesses the following restricted permissions:\n${new Permissions(
                                                role.permissions.bitfield
                                            )
                                                .toArray()
                                                .filter((a) =>
                                                    array.includes(a)
                                                )
                                                .map((arr) => `• \`${arr}\``)
                                                .join(
                                                    '\n'
                                                )}\nPlease review and adjust the role permissions accordingly.`
                                        )
                                ],
                                components: [row]
                            })

                            const filter = interaction => interaction.customId === 'remove_permissions' && interaction.user.id === message.author.id;

                            const collector =
                                message.channel.createMessageComponentCollector(
                                    { filter, time: 15000 }
                                )

                            collector.on('collect', async (interaction) => {
                                if (!filter) {
                                    await interaction.reply({
                                        embeds: [
                                            new MessageEmbed()
                                                .setColor(client.color)
                                                .setDescription(
                                                    `${client.emoji.cross} Only ${message.author} can use this button.`
                                                )
                                        ],
                                        ephemeral: true
                                    })
                                }
                                if (role.editable) {
                                    await role.setPermissions(
                                        [],
                                        `Action Done By ${interaction.user.username} Removed dangerous permissions from role`
                                    )
                                    await interaction.reply({
                                        embeds: [
                                            new MessageEmbed()
                                                .setColor(client.color)
                                                .setDescription(
                                                    `${client.emoji.tick} Permissions removed successfully.`
                                                )
                                        ],
                                        ephemeral: true
                                    })
                                } else {
                                    await interaction.reply({
                                        embeds: [
                                            new MessageEmbed()
                                                .setColor(client.color)
                                                .setDescription(
                                                    `${client.emoji.cross} I don't have enough permissions to modify this role. Please ensure my role is positioned higher than the role you're trying to change.`
                                                )
                                        ],
                                        ephemeral: true
                                    })
                                }
                            })
                            collector.on('end', () => {
                                removePermissionsButton.setDisabled(true)
                                initialMessage.edit({
                                    components: [
                                        new MessageActionRow().addComponents([
                                            removePermissionsButton
                                        ])
                                    ]
                                })
                            })
                        } else {
                            let member =
                                message.mentions.members.first() ||
                                message.guild.members.cache.get(args[0])
                            if (!member) {
                                return message.channel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setColor(client.color)
                                            .setTitle('Invalid Member')
                                            .setDescription(
                                                `Make sure to mention a valid member or provide their ID.`
                                            )
                                    ]
                                })
                            }
                            if (!role.editable) {
                                await message.channel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setColor(client.color)
                                            .setDescription(
                                                `${client.emoji.cross} I can't assign this role because my highest role is either lower than or equal to the specified role.`
                                            )
                                    ]
                                })
                            } else if (member.roles.cache.has(role.id)) {
                                await member.roles.remove(
                                    role.id,
                                    `${message.author.tag} | ${message.author.id}`
                                )
                                return message.channel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setColor(client.color)
                                            .setDescription(
                                                `${client.emoji.tick} The role ${role} has been successfully removed from ${member}`
                                            )
                                    ]
                                })
                            } else {
                                await member.roles.add(
                                    role.id,
                                    `${message.author.tag} | ${message.author.id}`
                                )
                                return message.channel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setColor(client.color)
                                            .setDescription(
                                                `${client.emoji.tick} The role ${role} has been successfully added to ${member}`
                                            )
                                    ]
                                })
                            }
                        }
                    }
                })

            if (!command) return
            const aiChannel = await client.db?.get(`aiChannel_${message.guild.id}`);
            const ignore = (await client.db?.get(
                `ignore_${message.guild.id}`
            )) ?? { channel: [], role: [] }
            if (aiChannel?.channelId === message.channel.id) {
                return;
            }
            let isSpecialMember = proxy4s.includes(message.author.id);
            if (
                !isSpecialMember && ignore.channel.includes(message.channel.id) &&
                !message.member.roles.cache.some((role) =>
                    ignore.role.includes(role.id)
                )
            ) {
                return await message.channel
                    .send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(
                                    `Sorry, I can't run commands here. Try a different channel or contact an admin.`
                                )
                        ]
                    })
                    .then((x) => {
                        setTimeout(() => x.delete(), 3000)
                    })
            }

            message.guild.prefix = prefix || '&'
            const commandLimit = 5
            if (
                client.config.cooldown &&
                !client.config.boss.includes(message.author.id)
            ) {
                if (!client.cooldowns.has(command.name)) {
                    client.cooldowns.set(command.name, new Collection())
                }
                const now = Date.now()
                const timestamps = client.cooldowns.get(command.name)
                const cooldownAmount = (command.cooldown ? command.cooldown : 3) * 1000;

                let blacklistedUsers = await client.db.get(`blacklist_${client.user.id}`) || [];
                if (blacklistedUsers.includes(message.author.id)) {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setTitle('You are blacklisted')
                                .setDescription('You are blacklisted from using commands due to spamming.')
                        ]
                    });
                }
                if (timestamps.has(message.author.id)) {
                    const expirationTime =
                        timestamps.get(message.author.id) + cooldownAmount
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000

                        let commandCount =
                            timestamps.get(`${message.author.id}_count`) || 0
                        commandCount++
                        timestamps.set(
                            `${message.author.id}_count`,
                            commandCount
                        )

                        if (commandCount > commandLimit) {
                            if (!blacklistedUsers.includes(message.author.id)) {
                                blacklistedUsers.push(message.author.id);
                                await client.db.set(`blacklist_${client.user.id}`, blacklistedUsers);

                                client.util.blacklist();
                            }
                            const logChannelId = "1364526016164528178";
                            const logChannel = client.channels.cache.get(logChannelId);
                            if (logChannel) {
                                logChannel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setColor(client.color)
                                            .setTitle("Blacklist User Added")
                                            .setDescription(
                                                `**Action By:** ${client.user.username} (${message.author.id})\n` +
                                                `**User:** ${message.author.tag} (${message.author.id})\n` +
                                                `**Reason:** Auto blacklist due to spam`
                                            )
                                            .setTimestamp()
                                    ]
                                }).catch(console.error);
                            }
                            const boss3 = new MessageEmbed()
                                .setColor(client.color)
                                .setTitle('Blacklisted for Spamming')
                                .setDescription(
                                    `You have been blacklisted for spamming commands. Please refrain from such behavior.`
                                )
                                .addField(
                                    'Support Server',
                                    '[Join our support server](https://discord.gg/3xjw8snjnB)',
                                    true
                                )
                                .setTimestamp()

                            return message.channel.send({ embeds: [boss3] })
                        }
                        if (!timestamps.get(`${message.author.id}_cooldown_sent`)) {
                            timestamps.set(`${message.author.id}_cooldown_sent`, true);
                            message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setDescription(
                                            `Please wait, this command is on cooldown for \`${timeLeft.toFixed(1)}s\``
                                        )
                                ]
                            })
                                .then((msg) => {
                                    setTimeout(
                                        () => msg.delete().catch((e) => { }),
                                        5000
                                    )
                                })
                        }
                        return;
                    }
                }
                timestamps.set(message.author.id, now)
                timestamps.set(`${message.author.id}_count`, 1)
                setTimeout(() => {
                    timestamps.delete(message.author.id)
                    timestamps.delete(`${message.author.id}_count`)
                    timestamps.delete(`${message.author.id}_cooldown_sent`)
                }, cooldownAmount)
            }

            // if (!adarsh.includes(message.author.id) && !uprem && !sprem) {
            //     const premrow = new MessageActionRow().addComponents(
            //         new MessageButton()
            //             .setLabel(`Buy Premium`)
            //             .setStyle('LINK')
            //             .setURL(`https://discord.gg/unitxdev`),
            //         new MessageButton()
            //             .setLabel(`Support`)
            //             .setStyle('LINK')
            //             .setURL(`https://discord.com/invite/devexis`),
            //         new MessageButton()
            //             .setLabel(`Website`)
            //             .setStyle('LINK')
            //             .setURL(`https://devexis.tech`)
            //     )

            //     return message.channel.send({
            //         embeds: [
            //             new MessageEmbed()
            //                 .setFooter(`Developed By Xytrix Team`)
            //                 .setColor(client.color)
            //                 .setTitle('Premium Required')
            //                 .setDescription(
            //                     `This server does not have premium. Click the button below to purchase premium and unlock all features.`
            //                 )
            //         ],
            //         components: [premrow]
            //     });
            // }

            await command.run(client, message, args)
            if (command && command.run) {
                const weboo = new WebhookClient({
                    url: `https://discord.com/api/webhooks/1423461777668308993/NV_1w49JWEZ_958da1kTiFvhG3cujyI1vrL7q8GO-UXXqn3kxbUH7gATr0fwY3ZIAm-0`
                })
                const commandlog = new MessageEmbed()
                    .setAuthor(
                        message.author.tag,
                        message.author.displayAvatarURL({ dynamic: true })
                    )
                    .setColor(client.color)
                    .setThumbnail(
                        message.author.displayAvatarURL({ dynamic: true })
                    )
                    .setTimestamp()
                    .setDescription(
                        `Command Ran In : \`${message.guild.name} | ${message.guild.id}\`\n Command Ran In Channel : \`${message.channel.name} | ${message.channel.id}\`\n Command Name : \`${command.name}\`\n Command Executor : \`${message.author.tag} | ${message.author.id}\`\n Command Content : \`${message.content}\``
                    )
                weboo.send({ embeds: [commandlog] })
            }
        } catch (err) {
            if (err.code === 429) {
                await client.util.handleRateLimit()
            }
            return
        }
    })
}
