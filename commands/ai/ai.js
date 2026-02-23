const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'ai',
    category: 'ai',
    aliases: ['ai'],
    subcommand: ['activate', 'reset', 'view'],
    description: `Manage AI channels for advanced automate conversations.`,
    premium: true,

    run: async (client, message, args) => {
        let prefix = '&' || message.guild.prefix;
        const guildId = message.guild.id;
        const subcommand = args[0]?.toLowerCase();

        const createEmbed = (description) => {
            return new MessageEmbed()
                .setColor(client.color)
                .setDescription(description)
        };

        if (!subcommand || !['activate', 'reset', 'view'].includes(subcommand)) {
            const aiEmbed = new MessageEmbed()
                .setThumbnail(client.user.avatarURL({ dynamic: true }))
                .setColor(client.color)
                .setTitle(`Artificial Intelligence`)
                .setDescription(`Enhance your server's engagement with AI powered discussions. Activate AI channels and automate conversations effortlessly.`)
                .addFields(
                    {
                        name: ` Activate AI`,
                        value: `To activate AI in a channel, use: \`${prefix}ai activate\``
                    },
                    {
                        name: ` Reset AI`,
                        value: `To reset AI activation, use: \`${prefix}ai reset\``
                    },
                    {
                        name: ` View AI Channel`,
                        value: `To check which channel has AI enabled, use: \`${prefix}ai view\``
                    }
                );
            return message.channel.send({ embeds: [aiEmbed] });
        }
        
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Administration\` perms to run this command.`
                        )
                ]
            })
        }

        if (subcommand === 'activate') {
            if (!args[1]) {
                const errorEmbed = createEmbed(
                    `Please mention a text channel or provide a channel ID.`
                );
                return message.channel.send({ embeds: [errorEmbed] });
            }

            let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            if (!channel || channel.type !== 'GUILD_TEXT') {
                const errorEmbed = createEmbed(
                    `Please mention a text channel or provide a valid channel ID.`
                );
                return message.channel.send({ embeds: [errorEmbed] });
            }

            let data = await client.db.get(`aiChannel_${guildId}`);
            if (data) {
                const alreadyActiveEmbed = createEmbed(
                    `AI is already activated in <#${data.channelId}>.`
                );
                return message.channel.send({ embeds: [alreadyActiveEmbed] });
            }

            try {
                await channel.setRateLimitPerUser(10, 'AI Channel activation');
                await channel.setTopic('AI Channel of Xytrix Ask Anything You Want, Anytime! | Instant Answers with a 10 Second Cooldown Between Messages. Expertise at your fingertips.');
                await client.db.set(`aiChannel_${guildId}`, { channelId: channel.id });
                
                const successEmbed = createEmbed(
                    `AI has been activated in ${channel} with a 10-second slowmode.`
                );
                return message.channel.send({ embeds: [successEmbed] });
            } catch (error) {
                console.error('Error setting slowmode:', error);
                const errorEmbed = createEmbed(
                    `Failed to set channel slowmode. Please check bot permissions.`
                );
                return message.channel.send({ embeds: [errorEmbed] });
            }

        } else if (subcommand === 'reset') {
            await client.db.delete(`aiChannel_${guildId}`);
            const resetEmbed = createEmbed(
                `AI module has been reset.`
            );
            return message.channel.send({ embeds: [resetEmbed] });

        } else if (subcommand === 'view') {
            let data = await client.db.get(`aiChannel_${guildId}`);
            if (!data) {
                const notActiveEmbed = createEmbed(
                    `AI is not activated in any channel.`
                );
                return message.channel.send({ embeds: [notActiveEmbed] });
            }
            
            const viewEmbed = createEmbed(
                `AI is activated in <#${data.channelId}>.`
            );
            return message.channel.send({ embeds: [viewEmbed] });
        }
    }
};
