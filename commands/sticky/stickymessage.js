const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const StickyMessage = require('../../models/sticky');
const config = require('../../config.json')

const replacePlaceholders = async (text, member, server) => {
    if (!text) return '';
    try {
        await member.fetch(); 

        return text
            .replace(/{user\.mention}/g, member ? member.toString() : '')
            .replace(/{user\.name}/g, member ? member.user.username : '')
            .replace(/{server\.name}/g, server.name)
            .replace(/{boostcount}/g, server.premiumSubscriptionCount || 0)
            .replace(/{boostlevel}/g, server.premiumTier || 0)
            .replace(/{user\.avatar}/g, member ? member.user.displayAvatarURL() : '')
            .replace(/{user\.banner}/g, member ? member.user.bannerURL() : '')
            .replace(/{server\.icon}/g, server.iconURL() || '')
            .replace(/{server\.banner}/g, server.bannerURL() || '');
    } catch (err) {
        console.error('Error fetching user data:', err);
        return text;
    }
};

module.exports = {
    name: 'stickymessage',
    description: 'Manage sticky messages',
    category: 'sticky',
    aliases: ['stickymsg', 'sticky'],
    subcommand: ['add', 'view', 'remove', 'limit', 'embed', 'list'],
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('You need `Administrator` permissions to run this command.')
                ]
            });
        }

        const subcommand = args[0]?.toLowerCase();
        const channelId = message.channel.id;
        const guildId = message.guild.id;
        const isPremium = await client.db.get(`sprem_${message.guild.id}`);
        const channelLimit = isPremium ? 5 : 2;

        if (!subcommand) {
            let prefix = message.guild.prefix;
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Sticky Message')
                        .setDescription('Sticky message is an adavane feature that allows you to set a message in a channel that will be sent automatically when a new message is sent in that channel.')
                        .setThumbnail(client.user.displayAvatarURL())
                        .addFields(
                            { name: 'Add sticky message:', value: `To add sticky message, use: \`${prefix}stickymessage add\`` },
                            { name: 'View sticky message:', value: `To view sticky message, use: \`${prefix}stickymessage view\`` },
                            { name: 'Remove sticky message:', value: `To remove sticky message, use: \`${prefix}stickymessage remove\`` },
                            { name: 'Set sticky message limit:', value: `To set sticky message limit, use: \`${prefix}stickymessage limit\``},
                            { name: 'Set sticky message embed:', value: `To set sticky message embed, use: \`${prefix}stickymessage embed\``},
                            { name: 'List sticky messages:', value: `To list sticky messages, use: \`${prefix}stickymessage list\``}
                        )
                        .setColor(client.color)
                ]
            });
        }

        switch (subcommand) {
            case 'add':
                const content = args.slice(1).join(' ');
                if (!content) {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Usage: stickymessage add <message>')
                                .setColor(client.color)
                        ]
                    });
                }

                try {
                    const stickyMessages = await StickyMessage.find({ guildId });
                    if (stickyMessages.length >= channelLimit) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription(`You can only have sticky messages in ${channelLimit} channels.`)
                                    .setColor(client.color)
                            ]
                        });
                    }

                    const existing = await StickyMessage.findOne({ guildId, channelId });
                    if (existing) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('A sticky message already exists in this channel. Use `stickymessage remove` first.')
                                    .setColor(client.color)
                            ]
                        });
                    }

                    const stickyMessage = new StickyMessage({
                        guildId,
                        channelId,
                        content,
                        isEmbed: false
                    });

                    await stickyMessage.save();

                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Sticky message added!')
                                .setColor(client.color)
                        ]
                    });
                } catch (error) {
                    console.error(error);
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Failed to add sticky message.')
                                .setColor(client.color)
                        ]
                    });
                }
                break;

            case 'view':
                try {
                    const sticky = await StickyMessage.findOne({ guildId, channelId });
                    if (!sticky) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('No sticky message found in this channel.')
                                    .setColor(client.color)
                            ]
                        });
                    }
                    const contentPreview = sticky.isEmbed || !sticky.content
                    ? '📌 Embed Message'
                    : sticky.content;                    

                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setTitle('Sticky Message')
                                .setDescription(`Content: ${contentPreview}\nLimit: ${sticky.limit} messages`)
                                .setColor(client.color)
                        ]
                    });
                } catch (error) {
                    console.error(error);
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Failed to retrieve sticky messages.')
                                .setColor(client.color)
                        ]
                    });
                }
                break;

            case 'remove':
                try {
                    const removed = await StickyMessage.findOneAndDelete({ guildId, channelId });
                    if (!removed) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('No sticky message to remove.')
                                    .setColor(client.color)
                            ]
                        });
                    }

                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Sticky message removed.')
                                .setColor(client.color)
                        ]
                    });
                } catch (error) {
                    console.error(error);
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Failed to remove sticky message.')
                                .setColor(client.color)
                        ]
                    });
                }
                break;

            case 'list':
                    try {
                        const stickyMessages = await StickyMessage.find({ guildId });
                        
                        if (!stickyMessages.length) {
                            return message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setDescription('No sticky messages are set up in this server.')
                                        .setColor(client.color)
                                ]
                            });
                        }
                
                        const isPremium = await client.db.get(`sprem_${message.guild.id}`);
                        const channelLimit = isPremium ? 5 : 2;
                        const guildIcon = message.guild.iconURL({ dynamic: true }) || '';
                        const guildName = message.guild.name;

                        const displayedStickies = isPremium ? stickyMessages : stickyMessages.slice(0, channelLimit);
                        
                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setThumbnail(client.user.displayAvatarURL())
                            .setAuthor(`${guildName}'s Sticky Messages`, guildIcon)
                            .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())
                            .setDescription(`**Total sticky messages: ${displayedStickies.length}/${channelLimit}**`);
                
                        for (const sticky of displayedStickies) {
                            const channel = message.guild.channels.cache.get(sticky.channelId);
                            const messageType = sticky.isEmbed ? 'Embed Message' : 'Message';

                            const premiumNote = !isPremium && sticky.isEmbed ? ' (Requires Premium)' : '';
                            
                            const contentPreview = sticky.isEmbed 
                                ? '[Embed Message]' + premiumNote
                                : (sticky.content?.length > 100 
                                    ? sticky.content.substring(0, 97) + '...' 
                                    : sticky.content || 'No content');
                            
                            embed.addField(
                                `${messageType} in ${channel ? `<#${channel.id}>` : 'Unknown Channel'}`,
                                `Content: ${contentPreview}\nChannel ID: ${sticky.channelId}${sticky.limit ? `\nMessage Limit: ${sticky.limit}` : ''}`
                            );
                        }

                        if (!isPremium && stickyMessages.length > channelLimit) {
                            embed.setFooter(`Xytrix on Top ???`, client.user.displayAvatarURL());
                            embed.addField('**Note:**', `Your Premium subscription has expired!\nUpgrade now to unlock all the exclusive features and enjoy sticky messages in up to 5 channels with embed support.`);
                        }
                
                        return message.channel.send({ embeds: [embed] });
                    } catch (error) {
                        console.error(error);
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('Failed to retrieve sticky messages list.')
                                    .setColor(client.color)
                            ]
                        });
                    }
                    break;                

            case 'limit':
                if (!isPremium) {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('This command is only available for premium servers.')
                                .setColor(client.color)
                        ]
                    });
                }

                const limit = parseInt(args[1]);
                if (!limit || isNaN(limit)) {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Usage: stickymessage limit <number>')
                                .setColor(client.color)
                        ]
                    });
                }

                try {
                    const sticky = await StickyMessage.findOne({ guildId, channelId });
                    if (!sticky) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('No sticky message found to update limit.')
                                    .setColor(client.color)
                            ]
                        });
                    }

                    sticky.limit = limit;
                    await sticky.save();

                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(`Sticky message limit set to ${limit} messages.`)
                                .setColor(client.color)
                        ]
                    });
                } catch (error) {
                    console.error(error);
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Failed to update sticky message limit.')
                                .setColor(client.color)
                        ]
                    });
                }
                break;

            case 'embed':
                    if (!isPremium) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('This command is only available for premium servers.')
                                    .setColor(client.color)
                            ]
                        });
                    }
                
                    const channelPrompt = await message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription('Please mention or send the channel ID where you want to set up the sticky message embed.')
                                .setColor(client.color)
                        ]
                    });
                
                    try {
                        
                        const channelResponse = await message.channel.awaitMessages({
                            filter: m => m.author.id === message.author.id,
                            max: 1,
                            time: 30000,
                            errors: ['time']
                        });
                
                        const channelInput = channelResponse.first().content;
                        let targetChannel;
                
                        
                        if (channelInput.match(/^<#\d+>$/)) {
                            targetChannel = message.guild.channels.cache.get(channelInput.match(/\d+/)[0]);
                        } else {
                            targetChannel = message.guild.channels.cache.get(channelInput);
                        }
                
                        if (!targetChannel) {
                            return message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setDescription('Invalid channel. Please provide a valid channel mention or ID.')
                                        .setColor(client.color)
                                ]
                            });
                        }
                
                        
                        const existingSticky = await StickyMessage.findOne({ guildId, channelId: targetChannel.id });
                        if (existingSticky) {
                            return message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setDescription(`There is already a sticky message in <#${targetChannel.id}>. Please remove it first using \`stickymessage remove\` in that channel before setting up a new one.`)
                                        .setColor(client.color)
                                ]
                            });
                        }
                
                        
                        const totalStickies = await StickyMessage.find({ guildId });
                        if (totalStickies.length >= channelLimit) {
                            return message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setDescription(`You can only have sticky messages in ${channelLimit} channels.`)
                                        .setColor(client.color)
                                ]
                            });
                        }
                
                        let embed = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Configure your embed using the buttons below.');
                
                        const row1 = new MessageActionRow()
                            .addComponents(
                                new MessageButton().setCustomId('sticky_author_text').setLabel('Author Text').setStyle('PRIMARY'),
                                new MessageButton().setCustomId('sticky_author_url').setLabel('Author URL').setStyle('PRIMARY'),
                                new MessageButton().setCustomId('sticky_description').setLabel('Description').setStyle('PRIMARY'),
                                new MessageButton().setCustomId('sticky_title').setLabel('Title').setStyle('PRIMARY')
                            );
                
                        const row2 = new MessageActionRow()
                            .addComponents(
                                new MessageButton().setCustomId('sticky_footer_text').setLabel('Footer Text').setStyle('PRIMARY'),
                                new MessageButton().setCustomId('sticky_footer_url').setLabel('Footer URL').setStyle('PRIMARY'),
                                new MessageButton().setCustomId('sticky_main_image').setLabel('Main Image').setStyle('PRIMARY'),
                                new MessageButton().setCustomId('sticky_thumbnail').setLabel('Thumbnail').setStyle('PRIMARY')
                            );
                
                        const row3 = new MessageActionRow()
                            .addComponents(
                                new MessageButton().setCustomId('sticky_save_embed').setLabel('Save Embed').setStyle('SUCCESS'),
                                new MessageButton().setCustomId('sticky_cancel').setLabel('Cancel').setStyle('DANGER')
                            );
                
                        const setupMessage = await message.channel.send({
                            embeds: [embed],
                            components: [row1, row2, row3]
                        });
                
                        const buttonFilter = i => i.user.id === message.author.id && i.customId.startsWith('sticky_');
                        const collector = setupMessage.createMessageComponentCollector({
                            filter: buttonFilter,
                            time: 1000000,
                            idle: 300000
                        });
                
                        collector.on('collect', async i => {
                            if (i.customId === 'sticky_cancel') {
                                collector.stop();
                                await setupMessage.delete();
                                return i.reply({ content: 'Embed creation cancelled.', ephemeral: true });
                            }
                
                            if (i.customId === 'sticky_save_embed') {
                                try {
                                    await StickyMessage.create({
                                        guildId,
                                        channelId: targetChannel.id,
                                        embed: embed.toJSON(),
                                        isEmbed: true
                                    });
                
                                    await i.reply({ content: `Embed sticky message saved successfully in <#${targetChannel.id}>!`, ephemeral: true });
                                    collector.stop();
                                    return setupMessage.delete();
                                } catch (error) {
                                    console.error('Error saving embed:', error);
                                    return i.reply({ content: 'Failed to save the embed. Please try again.', ephemeral: true });
                                }
                            }
                
                            const inputType = i.customId.replace('sticky_', '');
                            await i.reply({ content: `Please send the ${inputType.replace('_', ' ')} for the embed.`, ephemeral: true });
                
                            try {
                                const userInput = await message.channel.awaitMessages({
                                    filter: m => m.author.id === message.author.id,
                                    max: 1,
                                    time: 30000,
                                    errors: ['time']
                                });
                
                                const content = userInput.first().content;
                
                                switch (inputType) {
                                    case 'author_text':
                                        embed.setAuthor({ name: content });
                                        break;
                                    case 'author_url':
                                        embed.setAuthor({ name: embed.author?.name || 'Unknown', url: content });
                                        break;
                                    case 'description':
                                        embed.setDescription(content);
                                        break;
                                    case 'title':
                                        embed.setTitle(content);
                                        break;
                                    case 'footer_text':
                                        embed.setFooter({ text: content });
                                        break;
                                    case 'footer_url':
                                        embed.setFooter({ text: embed.footer?.text || 'Unknown', iconURL: content });
                                        break;
                                    case 'main_image':
                                        embed.setImage(content);
                                        break;
                                    case 'thumbnail':
                                        embed.setThumbnail(content);
                                        break;
                                }
                
                                await setupMessage.edit({ embeds: [embed] });
                                await i.followUp({ content: `${inputType.replace('_', ' ')} updated!`, ephemeral: true });
                            } catch (error) {
                                console.error('Input timeout or error:', error);
                                await i.followUp({ content: 'No response received in time.', ephemeral: true });
                            }
                        });
                
                        collector.on('end', () => {
                            setupMessage.edit({
                                components: [],
                                embeds: [new MessageEmbed().setDescription('Embed setup ended.').setColor(client.color)]
                            }).catch(() => {});
                        });
                
                    } catch (error) {
                        console.error('Channel prompt error:', error);
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('No valid channel provided or time ran out.')
                                    .setColor(client.color)
                            ]
                        });
                    }
                    break;

            default:
                let prefix = message.guild.prefix;
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Sticky Message')
                            .setDescription('Sticky message is an adavane feature that allows you to set a message in a channel that will be sent automatically when a new message is sent in that channel.')
                            .setThumbnail(client.user.displayAvatarURL())
                            .addFields(
                                { name: 'Add sticky message:', value: `To add sticky message, use: \`${prefix}stickymessage add\`` },
                                { name: 'View sticky message:', value: `To view sticky message, use: \`${prefix}stickymessage view\`` },
                                { name: 'Remove sticky message:', value: `To remove sticky message, use: \`${prefix}stickymessage remove\`` },
                                { name: 'Set sticky message limit:', value: `To set sticky message limit, use: \`${prefix}stickymessage limit\``},
                                { name: 'Set sticky message embed:', value: `To set sticky message embed, use: \`${prefix}stickymessage embed\``},
                                { name: 'List sticky messages:', value: `To list sticky messages, use: \`${prefix}stickymessage list\``}
                            )
                            .setColor(client.color)
                    ]
                });
        }
    }
};
