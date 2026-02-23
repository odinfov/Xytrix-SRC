const { MessageEmbed, Permissions } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'p4p',
    description: 'Setup the P4P system',
    category: 'setup',
    premium: false,
    run: async (client, message, args) => {
        let own = message.author.id == message.guild.ownerId;
        let isSpecialMember = config.boss.includes(message.author.id);;

        if (!isSpecialMember && !message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} You need \`Administrator\` permissions to use this command.`)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                ]
            });
        }

        if (!own && !isSpecialMember && message.member.roles.highest.position <= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} You must have a higher role than me to use this command.`)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                ]
            });
        }

        const subcommand = args[0];
        const guildId = message.guild.id;

        if (!subcommand) {
            const p4pEmbed = new MessageEmbed()
                .setThumbnail(client.user.avatarURL({ dynamic: true }))
                .setColor(client.color)
                .setTitle(`__**P4P (5)**__`)
                .addFields([
                    { name: `__**p4p setup**__`, value: `Setup the P4P system.` },
                    { name: `__**p4p enable**__`, value: `Enable the P4P system.` },
                    { name: `__**p4p disable**__`, value: `Disable the P4P system.` },
                    { name: `__**p4p reset**__`, value: `Reset the P4P system.` },
                    { name: `__**p4p role @user**__`, value: `Assign or remove the P4P role to/from a user.` }
                ])
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

            return message.channel.send({ embeds: [p4pEmbed] });
        }

        if (subcommand === 'setup') {
            const existingSetup = await client.db.get(`p4pSetup_${guildId}`);
            if (existingSetup) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('P4P system is already set up.')
                        .setFooter({ text: `To enable use p4p enable`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            
            const role = await message.guild.roles.create({
                name: 'Xytrix P4P Role',
                permissions: [],
                reason: 'Role for P4P system'
            });

            
            const channel = await message.guild.channels.create('P4P-logs', {
                type: 'GUILD_TEXT',
                permissionOverwrites: [
                    {
                        id: message.guild.id,
                        deny: [Permissions.FLAGS.VIEW_CHANNEL]
                    }
                ]
            });

            
            const data = {
                roleId: role.id,
                channelId: channel.id,
                enabled: false 
            };

            await client.db.set(`p4pSetup_${guildId}`, data);

            message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('P4P system has been set up successfully!')
                    .setFooter({ text: `To enable use p4p enable`, iconURL: message.author.displayAvatarURL() })
                ]
            });

        } else if (subcommand === 'enable') {
            const setupData = await client.db.get(`p4pSetup_${guildId}`);
            if (!setupData) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('P4P system is not set up.')
                        .setFooter({ text: `To setup use p4p setup`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            const role = message.guild.roles.cache.get(setupData.roleId);
            if (role.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('P4P system is already enabled.')
                        .setFooter({ text: `To disable use p4p disable`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            await role.setPermissions([Permissions.FLAGS.ADMINISTRATOR]);

            
            setupData.enabled = true;
            await client.db.set(`p4pSetup_${guildId}`, setupData);

            message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('P4P system has been enabled successfully!')
                    .setFooter({ text: `To assigin role use p4p role @user`, iconURL: message.author.displayAvatarURL() })
                ]
            });

        } else if (subcommand === 'disable') {
            const setupData = await client.db.get(`p4pSetup_${guildId}`);
            if (!setupData) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('P4P system is not set up.')
                        .setFooter({ text: `To setup use p4p setup`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            const role = message.guild.roles.cache.get(setupData.roleId);
            if (!role.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('P4P system is already disabled.')
                        .setFooter({ text: `To enable use p4p enable`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            await role.setPermissions([]);

            
            setupData.enabled = false;
            await client.db.set(`p4pSetup_${guildId}`, setupData);

            message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('P4P system has been disabled successfully!')
                    .setFooter({ text: `To reset use p4p reset`, iconURL: message.author.displayAvatarURL() })
                ]
            });

        } else if (subcommand === 'role') {
            const setupData = await client.db.get(`p4pSetup_${guildId}`);
            if (!setupData) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('P4P system is not set up.')
                        .setFooter({ text: `To setup use p4p setup`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            if (args[0] && args[0].match(/<@!?(\d+)>/) && args[0].match(/<@!?(\d+)>/)[1] === client.user.id) {
                args.shift();
            }
            let userMention = message.mentions.users.first();
            let userId = args[1];
            if (userMention && userMention.id === client.user.id && message.mentions.users.size > 1) {
                userMention = Array.from(message.mentions.users.values())[1];
            }
            
            const user = userMention || 
                        (userId ? message.guild.members.cache.get(userId) : null);
            if (!user) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Please mention a user or provide a user ID to assign or remove the P4P role.')
                        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            const member = message.guild.members.cache.get(user.id);
            const role = message.guild.roles.cache.get(setupData.roleId);

            if (member && role) {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    message.channel.send({
                        embeds: [new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`Removed the P4P role from <@${user.id}>.`)
                            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        ]
                    });
                } else {
                    await member.roles.add(role);
                    message.channel.send({
                        embeds: [new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`Assigned the P4P role to <@${user.id}>.`)
                            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        ]
                    });
                }
            } else {
                message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Role or user not found.')
                        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

        } else if (subcommand === 'reset') {
            const setupData = await client.db.get(`p4pSetup_${guildId}`);
            if (!setupData) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('P4P system is not set up.')
                        .setFooter({ text: `To setup use p4p setup`, iconURL: message.author.displayAvatarURL() })
                    ]
                });
            }

            
            const role = message.guild.roles.cache.get(setupData.roleId);
            const channel = message.guild.channels.cache.get(setupData.channelId);

            if (role) await role.delete('P4P system reset');
            if (channel) await channel.delete('P4P system reset');

            
            await client.db.delete(`p4pSetup_${guildId}`);

            message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('P4P system has been reset successfully!')
                    .setFooter({ text: `To setup use p4p setup`, iconURL: message.author.displayAvatarURL() })
                ]
            });

        } else {
            const p4pEmbed = new MessageEmbed()
                .setThumbnail(client.user.avatarURL({ dynamic: true }))
                .setColor(client.color)
                .setTitle(`__**P4P (5)**__`)
                .addFields([
                    { name: `__**p4p setup**__`, value: `Setup the P4P system.` },
                    { name: `__**p4p enable**__`, value: `Enable the P4P system.` },
                    { name: `__**p4p disable**__`, value: `Disable the P4P system.` },
                    { name: `__**p4p reset**__`, value: `Reset the P4P system.` },
                    { name: `__**p4p role @user**__`, value: `Assign or remove the P4P role to/from a user.` }
                ])
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

            return message.channel.send({ embeds: [p4pEmbed] });
        }
    },
};
