const { MessageEmbed } = require('discord.js');
let enable = `<:Xytrix_disable2:1431277797120147490> <:Xytrix_enable2:1431277725015998558>`;
let disable = `<a:Xytrix_disable:1431277129441742874> <:Xytrix_enable2:1431277725015998558>`;
let protect = `<:Xytrix_ANT:1433954639040221265>`;
const wait = require('wait');
const config = require('../../config.json');

module.exports = {
    name: 'antinsfw',
    aliases: [],
    cooldown: 5,
    category: 'automod',
    description: `Prevents unauthorized NSFW content to enhance server safety.`,
    subcommand: ['enable', 'disable', 'punishment'],
    premium: true,
    run: async (client, message, args) => {
        const embed = new MessageEmbed().setColor(client.color);
        
        if (message.guild.memberCount < 0) {s
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Your server must have at least 30 members to use this feature.`
                        )
                ]
            });
        }

        let isSpecialMember = config.boss.includes(message.author.id);;
        let own = message.author.id == message.guild.ownerId;
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
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I don't have \`Administrator\` permissions to execute this command.`
                        )
                ]
            });
        }

        if (
            !isSpecialMember && !own &&
            message.member.roles.highest.position <=
                message.guild.me.roles.highest.position
        ) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have a higher role than me to use this command.`
                        )
                ]
            });
        }

        let prefix = message.guild.prefix || '&'; 

        const option = args[0];
        const isActivatedAlready =
            (await client.db.get(`antinsfw_${message.guild.id}`)) ?? null;

        const antinsfw = new MessageEmbed()
            .setThumbnail(client.user.avatarURL({ dynamic: true }))
            .setColor(client.color)
            .setTitle('Anti-NSFW')
            .setDescription(
                "Enhance your server's protection with Anti-NSFW! Our advanced algorithms quickly detect inappropriate content in images and take immediate action, ensuring a safe and respectful environment for your community."
            )
            .addField(
                '__**Anti-NSFW Enable**__',
                `To enable Anti-NSFW, use \`${prefix}antinsfw enable\``
            )
            .addField(
                '__**Anti-NSFW Disable**__',
                `To disable Anti-NSFW, use \`${prefix}antinsfw disable\``
            )
            .addField(
                '__**Anti-NSFW Punishment**__',
                'Configure the punishment for users posting explicit content.'
            )
            .addField(
                'Options',
                '`ban` - Ban users\n`kick` - Kick users\n`mute` - Mute users'
            )
            .setTimestamp()
            .setFooter(client.user.username, client.user.displayAvatarURL());
        
        switch (option) {
            case undefined:
                message.channel.send({ embeds: [antinsfw] });
                break;

            case 'enable':
                if (!isActivatedAlready) {
                    await client.db.set(`antinsfw_${message.guild.id}`, true);
                    await client.db.set(`antinsfwp_${message.guild.id}`, { data: 'mute' });

                    const antinsfwEnableMessage = new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Anti-NSFW Enabled')
                        .setDescription(
                            '**Congratulations! Anti-NSFW has been successfully enabled on your server.**'
                        )
                        .addField(
                            'Enhanced Protection',
                            'Enjoy enhanced protection against explicit content!'
                        )
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );

                    await message.channel.send({
                        embeds: [antinsfwEnableMessage]
                    });
                } else {
                    const antinsfwSettingsEmbed = new MessageEmbed()
                        .setTitle(
                            `Anti-NSFW Settings for ${message.guild.name} ${protect}`
                        )
                        .setColor(client.color)
                        .setDescription(
                            '**Anti-NSFW is already enabled on your server.**'
                        )
                        .addField(
                            'Current Status',
                            `Anti-NSFW is already enabled on your server.\n\nCurrent Status: ${enable}`
                        )
                        .addField(
                            'To Disable',
                            `To disable Anti-NSFW, use \`${prefix}antinsfw disable\``
                        )
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );
                    await message.channel.send({
                        embeds: [antinsfwSettingsEmbed]
                    });
                }
                break;

            case 'disable':
                if (isActivatedAlready) {
                    await client.db.set(`antinsfw_${message.guild.id}`, false);
                    await client.db.set(`antinsfwp_${message.guild.id}`, { data: null });

                    const antinsfwDisableMessage = new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Anti-NSFW Disabled')
                        .setDescription(
                            '**Anti-NSFW has been successfully disabled on your server.**'
                        )
                        .addField(
                            'Impact',
                            'Your server will no longer be protected against explicit content.'
                        )
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );

                    await message.channel.send({
                        embeds: [antinsfwDisableMessage]
                    });
                } else {
                    const antinsfwSettingsEmbed = new MessageEmbed()
                        .setTitle(
                            `Anti-NSFW Settings for ${message.guild.name} ${protect}`
                        )
                        .setColor(client.color)
                        .setDescription(`**Anti-NSFW Status**`)
                        .addField(
                            'Current Status',
                            `Anti-NSFW is currently disabled on your server.\n\nCurrent Status: ${disable}`
                        )
                        .addField(
                            'To Enable',
                            `To enable Anti-NSFW, use \`${prefix}antinsfw enable\``
                        )
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );
                    await message.channel.send({
                        embeds: [antinsfwSettingsEmbed]
                    });
                }
                break;

            case 'punishment':
                let punishment = args[1];
                if (!punishment) {
                    const embedMessage = new MessageEmbed()
                        .setColor(client.color)
                        .setAuthor({
                            name: message.author.tag,
                            iconURL: message.author.displayAvatarURL({
                                dynamic: true
                            })
                        })
                        .setDescription('**Invalid Punishment**')
                        .addField(
                            'Error',
                            'Please provide valid punishment arguments.'
                        )
                        .addField('Valid Options', '`ban`, `kick`, `mute`')
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );

                    return message.channel.send({ embeds: [embedMessage] });
                }

                if (punishment === 'ban') {
                    await client.db.set(`antinsfwp_${message.guild.id}`, { data: 'ban' });

                    const embedMessage = new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Punishment Configured')
                        .setDescription(
                            'The punishment has been successfully configured.'
                        )
                        .addField('Punishment Type', 'Ban')
                        .addField(
                            'Action Taken',
                            'Any user violating the rules will be banned from the server.'
                        )
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );

                    await message.channel.send({ embeds: [embedMessage] });
                }

                if (punishment === 'kick') {
                    await client.db.set(`antinsfwp_${message.guild.id}`, { data: 'kick' });

                    const embedMessage = new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Punishment Configured')
                        .setDescription(
                            'The punishment has been successfully configured.'
                        )
                        .addField('Punishment Type', 'Kick')
                        .addField(
                            'Action Taken',
                            'Any user violating the rules will be kicked from the server.'
                        )
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );

                    await message.channel.send({ embeds: [embedMessage] });
                }

                if (punishment === 'mute') {
                    await client.db.set(`antinsfwp_${message.guild.id}`, { data: 'mute' });

                    const embedMessage = new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Punishment Configured')
                        .setDescription(
                            'The punishment has been successfully configured.'
                        )
                        .addField('Punishment Type', 'Mute')
                        .addField(
                            'Action Taken',
                            'Any user violating the rules will be muted for 5 minutes.'
                        )
                        .setTimestamp()
                        .setFooter(
                            client.user.username,
                            client.user.displayAvatarURL()
                        );

                    await message.channel.send({ embeds: [embedMessage] });
                }
                break;

            default:
                break;
        }
    }
};
