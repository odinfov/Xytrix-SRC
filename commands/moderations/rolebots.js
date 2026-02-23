const { Message, Client, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const wait = require('util').promisify(setTimeout);
const config = require('../../config.json')
let roleAssignmentInProgress = false;

module.exports = {
    name: 'rolebots',
    aliases: ['rbots'],
    subcommand: ['status'],
    category: 'mod',
    description: `Assigns a role to all bots in the server or checks the status of role assignment.`,
    premium: false,

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        const embed = new MessageEmbed().setColor(client.color);
        let own = message.author.id === message.guild.ownerId;
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have \`Manage Roles\` permissions to use this command.`)
                ]
            });
        }
        if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I don't have \`Manage Roles\` permissions to execute this command.`)
                ]
            });
        }
        if (!isSpecialMember && !own && message.member.roles.highest.position <= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have a higher role than me to use this command.`)
                ]
            });
        }

        if (args[0] === 'status') {
            if (!roleAssignmentInProgress) {
                return message.channel.send({
                    embeds: [
                        embed
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} No role assignment process is currently running.`)
                    ]
                });
            }

            await message.guild.members.fetch();
            const totalBots = message.guild.members.cache.filter(member => member.user.bot).size;
            const botsWithRole = message.guild.members.cache.filter(member => member.user.bot && member.roles.cache.has(roleAssignmentInProgress.role.id)).size;
            const percentageWithRole = ((botsWithRole / totalBots) * 100).toFixed(2);
            const estimatedTime = Math.ceil((totalBots - botsWithRole) * 0.4);

            return message.channel.send({
                embeds: [
                    embed
                        .setTitle('Role Assignment Report')
                        .addField('Role:', `<@&${roleAssignmentInProgress.role.id}>`, false)
                        .addField('Percentage of Bots:', `${percentageWithRole}%`, false)
                        .addField('Estimated Time:', `<t:${Math.floor((Date.now() + estimatedTime * 1000) / 1000)}:R>`, false)
                        .setTimestamp()
                ]
            });
        }

        if (roleAssignmentInProgress) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} A role assignment process is already running. Please wait for it to complete.`)
                ]
            });
        }

        let roleToAdd = await findMatchingRoles(message.guild, args.join(' '));
        roleToAdd = roleToAdd[0];
        if (!roleToAdd) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You didn't provide a valid role.\n\`${message.guild.prefix}rolebots <role>\``)
                ]
            });
        }
        const dangerousPermissions = [
            "ADMINISTRATOR", 
            "KICK_MEMBERS", 
            "BAN_MEMBERS", 
            "MANAGE_CHANNELS", 
            "MANAGE_GUILD", 
            "MENTION_EVERYONE", 
            "MANAGE_ROLES", 
            "MANAGE_WEBHOOKS"
        ];

        for (const permission of dangerousPermissions) {
            if (roleToAdd.permissions.has(permission)) {
                return message.channel.send({
                    embeds: [
                        embed
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} This Role Is Having Dangerous Permission. I cannot assign that role to bots.`)
                    ]
                });
            }
        }

        if (roleToAdd.position >= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} The role you are trying to assign is higher or equal to my highest role. I cannot proceed with the role assignment.`)
                ]
            });
        }

        const startTime = Date.now();
        await message.guild.members.fetch(); 
        const botMembers = message.guild.members.cache.filter(member => member.user.bot).size;
        const estimatedTime = (botMembers * 400) / 2;

        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('yes_button')
                .setLabel('Yes')
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('no_button')
                .setLabel('No')
                .setStyle('DANGER'),
        );

        const interactionMessage = await message.channel.send({
            embeds: [
                embed.setDescription(`Do you want to start adding roles to all bot?`)
            ], components: [row],
        });

        const collector = interactionMessage.createMessageComponentCollector({ time: 10000 });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'You cannot use these buttons.', ephemeral: true });
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'yes_button') {
                    roleAssignmentInProgress = { role: roleToAdd }; 

                    await interaction.update({
                        embeds: [
                            embed.setDescription(`${client.emoji.tick} Successfully started adding <@&${roleToAdd.id}> to all bots.`)
                        ],
                        components: [],
                    });

                    collector.stop();

                    const members = await message.guild.members.fetch();
                    for (const member of members.values()) {
                        if (!member.user.bot) continue; 
                        try {
                            if (member.roles.cache.has(roleToAdd.id)) continue;
                            await member.roles.add(roleToAdd.id, `${message.author.tag}(${message.author.id})`);
                            await wait(400);
                        } catch (error) {
                            if (error.code === 429) {
                                await handleRateLimit(client, embed, interactionMessage);
                                await member.roles.add(roleToAdd.id, `${message.author.tag}(${message.author.id})`); 
                            } else if (error.code === 10011) { 
                                await interactionMessage.edit({
                                    embeds: [
                                        embed.setDescription(`${client.emoji.cross} The role no longer exists. Role addition process canceled.`)
                                    ],
                                    components: [],
                                });
                                roleAssignmentInProgress = false; 
                                return;
                            } else {
                                console.error(`Failed to add role to ${member.user.tag}: ${error.message}`);
                            }
                        }
                    }

                    roleAssignmentInProgress = false; 

                    await message.channel.send({
                        embeds: [
                            embed.setDescription(`${client.emoji.tick} Successfully Given Role To All Bots.`)
                            .setTitle(`Role Assignment Successful`)
                            .setTimestamp()
                        ],
                        components: [],
                    });
                } else if (interaction.customId === 'no_button') {
                    await interaction.update({
                        embeds: [
                            embed.setDescription(`Role addition process canceled.`)
                        ],
                        components: [],
                    });

                    collector.stop();
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interactionMessage.edit({
                    embeds: [
                        embed.setDescription(`Role addition process canceled. No response received.`)
                    ],
                    components: [],
                });
            }
        });
    }
}

async function findMatchingRoles(guild, query) {
    const ROLE_MENTION = /<?@?&?(\d{17,20})>?/;
    if (!guild || !query || typeof query !== 'string') return [];

    const patternMatch = query.match(ROLE_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const role = guild.roles.cache.find((r) => r.id === id);
        if (role) return [role];
    }

    const exact = [];
    const startsWith = [];
    const includes = [];
    guild.roles.cache.forEach((role) => {
        const lowerName = role.name.toLowerCase();
        if (role.name === query) exact.push(role);
        if (lowerName.startsWith(query.toLowerCase())) startsWith.push(role);
        if (lowerName.includes(query.toLowerCase())) includes.push(role);
    });
    if (exact.length > 0) return exact;
    if (startsWith.length > 0) return startsWith;
    if (includes.length > 0) return includes;
    return [];
}

async function handleRateLimit(client, embed, interactionMessage) {
    embed.setDescription(`An error occurred while giving roles to bots.`);
    await interactionMessage.edit({ embeds: [embed] });
    await wait(20000); 
}
