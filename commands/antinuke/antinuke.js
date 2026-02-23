const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

let enable = `<:Xytrix_Enabled:1435002601216151714> <:Xytrix_enable2:1431277725015998558>`;
let disable = `<:Xytrix_disabled:1435002622619943064> <:Xytrix_disable2:1431277797120147490>`;
let protect = `<:Xytrix_ANT:1433954639040221265>`;
let hii = `<:dota:1242121491491983370>`;

module.exports = {
    name: 'antinuke',    
    category: 'security',
    description: `Protects against unauthorized server nuking activities.`,
    subcommand: ['enable', 'disable', 'config'],
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && message.guild.memberCount < 30) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Your server must have at least 30 members to use this feature.`)
                ]
            });
        }

        let own = message.author.id == message.guild.ownerId;
        const check = await client.util.isExtraOwner(message.author, message.guild);
        if (!isSpecialMember && !own && !check) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Apologies, but only the server owner or an extra owner with a higher role than mine can use this command.`)
                ]
            });
        }

        if (!isSpecialMember && !own && !(message?.guild.members.cache.get(client.user.id).roles.highest.position <= message?.member?.roles?.highest.position)) {
            const higherole = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} Apologies, but only the server owner or an extra owner with a higher role than mine can execute this command.`);
            return message.channel.send({ embeds: [higherole] });
        }

        let prefix = '&' || message.guild.prefix;
        const option = args[0];
        const isActivatedAlready = await client.db.get(`${message.guild.id}_antinuke`);

        let configEmbed;
        if (isActivatedAlready) {
            configEmbed = new MessageEmbed()
                .setThumbnail(client.user.displayAvatarURL())
                .setAuthor({
                    name: `${client.user.username} Security`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setColor(client.color)
                .setDescription(
                    `**Security Settings For ${message.guild.name} ${protect}**\n\nTip: To optimize the functionality of my Anti-Nuke Module, please move my role to the top of the roles list.${hii}\n\n***__Modules Enabled__*** ${protect}\n**Anti Ban: ${enable}\nAnti Unban: ${enable}\nAnti Kick: ${enable}\nAnti Bot: ${enable}\nAnti UnverifiedBot: ${enable}\nAnti Channel Create: ${enable}\nAnti Channel Delete: ${enable}\nAnti Channel Update: ${enable}\nAnti Emoji/Sticker Create: ${enable}\nAnti Emoji/Sticker Delete: ${enable}\nAnti Emoji/Sticker Update: ${enable}\nAnti Everyone/Here Ping: ${enable}\nAnti Link Role: ${enable}\nAnti Grace Role: ${enable}\nAnti Role Create: ${enable}\nAnti Role Delete: ${enable}\nAnti Role Update: ${enable}\nAnti Role Ping: ${enable}\nAnti Member Update: ${enable}\nAnti Integration: ${enable}\nAnti Server Update: ${enable}\nAnti Automod Rule Create: ${enable}\nAnti Automod Rule Update: ${enable}\nAnti Automod Rule Delete: ${enable}\nAnti Guild Event Create: ${enable}\nAnti Guild Event Update: ${enable}\nAnti Guild Event Delete: ${enable}\nAnti Webhook: ${enable}**\n\n**__Anti Link Role__: ${enable}\n__Anti Prune__: ${enable}\n__Auto Recovery__: ${enable}**`
                );
        } else {
            configEmbed = new MessageEmbed()
                .setThumbnail(client.user.displayAvatarURL())
                .setAuthor({
                    name: `${client.user.username} Security`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setColor(client.color)
                .setDescription(`**Security Settings For ${message.guild.name} ${protect}**\n\nTip: To optimize the functionality of my Anti-Nuke Module, please move my role to the top of the roles list.${hii}\n\n***__Modules Disabled__*** ${protect}\n**To enable Antinuke, use \`${prefix}antinuke enable\`**`);
        }

        configEmbed.setFooter({
            text: `Punishment Type: Ban`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        });

        const antinuke = new MessageEmbed()
            .setThumbnail(client.user.avatarURL({ dynamic: true }))
            .setColor(client.color)
            .setTitle(` Antinuke Protection`)
            .setDescription(`Upgrade your server's security with Antinuke! It swiftly detects and takes action against suspicious admin activities, all while protecting your whitelisted members. Strengthen your defenses – enable Antinuke now!`)
            .addFields(
                {
                    name: ` Enable Antinuke`,
                    value: `To enable Antinuke, use \`${prefix}antinuke enable\``
                },
                {
                    name: ` Disable Antinuke`,
                    value: `To disable Antinuke, use \`${prefix}antinuke disable\``
                },
                {
                    name: ` Antinuke Configuration`,
                    value: `To view or configure Antinuke settings, use \`${prefix}antinuke config\``
                }
            );

        if (!option) {
            message.channel.send({ embeds: [antinuke] });
        } else if (option === 'enable') {
            if (isActivatedAlready) {
                const enableEmbed = new MessageEmbed()
                    .setThumbnail(client.user.displayAvatarURL())
                    .setColor(client.color)
                    .setTitle(`Security Settings For ${message.guild.name}`)
                    .setDescription(`It looks like security is already enabled on your server.\n\n**Current Status:** ${enable}\nTo disable, use \`${prefix}antinuke disable\``);
                message.channel.send({ embeds: [enableEmbed] });
            } else {
                await client.db.set(`${message.guild.id}_antinuke`, true);
                await client.db.set(`${message.guild.id}_wl`, { whitelisted: [] });

                let msg = await message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.tick} Initializing Quick Setup!`)
                    ]
                });

                const steps = ['Checking Permissions ...', 'Unbypassable Setup...!!'];
                for (const step of steps) {
                    await client.util.sleep(1000);
                    await msg.edit({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(`${msg.embeds[0].description}\n${client.emoji.tick} ${step}`)
                        ]
                    });
                }

                await client.util.sleep(2000);

                const isActivatedNow = await client.db.get(`${message.guild.id}_antinuke`);
                if (isActivatedNow) {
                    configEmbed = new MessageEmbed()
                        .setThumbnail(client.user.displayAvatarURL())
                        .setAuthor({
                            name: `${client.user.username} Security`,
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setColor(client.color)
                        .setDescription(
                            `**Security Settings For ${message.guild.name} ${protect}**\n\nTip: To optimize the functionality of my Anti-Nuke Module, please move my role to the top of the roles list.${hii}\n\n***__Modules Enabled__*** ${protect}\n**Anti Ban: ${enable}\nAnti Unban: ${enable}\nAnti Kick: ${enable}\nAnti Bot: ${enable}\nAnti UnverifiedBot: ${enable}\nAnti Channel Create: ${enable}\nAnti Channel Delete: ${enable}\nAnti Channel Update: ${enable}\nAnti Emoji/Sticker Create: ${enable}\nAnti Emoji/Sticker Delete: ${enable}\nAnti Emoji/Sticker Update: ${enable}\nAnti Everyone/Here Ping: ${enable}\nAnti Link Role: ${enable}\nAnti Role Create: ${enable}\nAnti Role Delete: ${enable}\nAnti Role Update: ${enable}\nAnti Role Ping: ${enable}\nAnti Member Update: ${enable}\nAnti Integration: ${enable}\nAnti Server Update: ${enable}\nAnti Automod Rule Create: ${enable}\nAnti Automod Rule Update: ${enable}\nAnti Automod Rule Delete: ${enable}\nAnti Guild Event Create: ${enable}\nAnti Guild Event Update: ${enable}\nAnti Guild Event Delete: ${enable}\nAnti Webhook: ${enable}**\n\n**__Anti Link Role__: ${enable}\n__Anti Grace Role__: ${enable}\n__Anti Prune__: ${enable}\n__Auto Recovery__: ${enable}**`
                        );
                }

                await msg.edit({ embeds: [configEmbed] });

                if (message.guild.roles.cache.size > 249)
                    return message.reply(`I Won't Able To Create \`Xytrix Untouchable Shield\` Cause There Are Already 249 Roles In This Server`);

                let role = message?.guild.members.cache.get(client.user.id).roles.highest.position;
                let createdRole = await message.guild.roles.create({
                    name: 'Xytrix Untouchable Shield',
                    position: role ? role : 0,
                    reason: 'Xytrix Role For Ubypassable Setup',
                    permissions: ['ADMINISTRATOR'],
                    color: '#000000'
                });
                await message.guild.me.roles.add(createdRole.id);
            }
        } else if (option === 'disable') {
            if (!isActivatedAlready) {
                const dissable = new MessageEmbed()
                    .setThumbnail(client.user.displayAvatarURL())
                    .setColor(client.color)
                    .setDescription(`**Security Settings For ${message.guild.name} ${protect}\nUmm, looks like your server hasn't enabled security.\n\nCurrent Status: ${disable}\n\nTo Enable use ${prefix}antinuke enable**`);
                message.channel.send({ embeds: [dissable] });
            } else {
                try {
                    const XytrixRole = message.guild.roles.cache.find(role => role.name === 'Xytrix Untouchable Shield');
                    if (XytrixRole) {
                        await XytrixRole.delete('Antinuke module disabled');
                    }
                } catch (error) {
                    console.error('Error deleting Xytrix Untouchable Shield role:', error);
                    await message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(`${client.emoji.cross} Couldn't delete the Xytrix Untouchable Shield role. Please check my permissions.`)
                        ]
                    });
                }
                await client.db.get(`${message.guild.id}_wl`).then(async (data) => {
                    const users = data.whitelisted;
                    let i;
                    for (i = 0; i < users.length; i++) {
                        let data2 = await client.db?.get(`${message.guild.id}_${users[i]}_wl`);
                        if (data2) {
                            await client.db?.delete(`${message.guild.id}_${users[i]}_wl`);
                        }
                    }
                });

                await client.db.set(`${message.guild.id}_antinuke`, null);
                await client.db.set(`${message.guild.id}_wl`, { whitelisted: [] });

                const disabled = new MessageEmbed()
                    .setThumbnail(client.user.displayAvatarURL())
                    .setColor(client.color)
                    .setDescription(`**Security Settings For ${message.guild.name} ${protect}\nSuccessfully disabled security settings for this server.\n\nCurrent Status: ${disable}\n\nTo Enable use ${prefix}antinuke enable**`);
                message.channel.send({ embeds: [disabled] });
            }
        } else if (option === 'config') {
            message.channel.send({ embeds: [configEmbed] });
        } else {
            return message.channel.send({ embeds: [antinuke] });
        }
    }
};
