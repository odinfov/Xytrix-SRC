const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'steal',
    aliases: ['addemote', 'addemoji'],
    description: `Steal or copies an emoji or sticker from another server.`,
    cooldown: 5,
    category: 'info',
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);;
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | You must have \`Manage Emojis and Stickers\` permissions to use this command.`
                        )
                ]
            });
        }
        if (!message.guild.me.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | I must have \`Manage Emojis and Stickers\` permissions to use this command.`
                        )
                ]
            });
        }

        let emojis = [];
        let stickers = [];
        if (args.length > 0) {
            emojis = args.filter(arg => arg.match(/<a?:\w+:(\d+)>/));
        } else if (message.reference) {
            const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            const emojiMatches = repliedMessage.content.match(/<a?:\w+:(\d+)>/g);
            const stickerMatches = repliedMessage.stickers.map(sticker => sticker);

            if (emojiMatches) {
                emojis = emojiMatches;
            }
            if (stickerMatches.length > 0) {
                stickers = stickerMatches;
            }
        }

        if (stickers.length > 0) {
            const sticker = stickers[0]; 
            let stickerUrl;
        
            
            if (sticker.format === 'LOTTIE') {
                stickerUrl = `https://media.discordapp.net/stickers/${sticker.id}.gif`; 
            } else if (sticker.format === 'APNG' || sticker.format === 'PNG') {
                stickerUrl = `https://cdn.discordapp.com/stickers/${sticker.id}.png`; 
            } else if (sticker.format === 'GIF') {
                stickerUrl = `https://media.discordapp.net/stickers/${sticker.id}.gif`; 
            } else {
                console.log('Unknown sticker format:', sticker.format);
                return;
            }
            await message.guild.fetch();
            await message.guild.stickers.fetch();
            const maxStickers = message.guild.premiumTier === 'TIER_3' ? 60 :
                                message.guild.premiumTier === 'TIER_2' ? 30 :
                                message.guild.premiumTier === 'TIER_1' ? 15 : 5;

            if (message.guild.stickers.cache.size >= maxStickers) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`This server has reached the maximum number of stickers (${maxStickers}).`)
                    ]
                });
            }

            let name = sticker.name;
            let description = 'Stolen sticker'; 
            let tags = 'sticker'; 

            await message.guild.stickers.create(stickerUrl, name, tags, { description })
                .then(newSticker => {
                    message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(`Successfully stole the sticker ${newSticker.name}!`)
                        ]
                    });
                })
                .catch(err => {
                    console.error('Error stealing sticker:', err);
                    message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('There was an error stealing the sticker.')
                        ]
                    });
                });
            return;
        }

        if (emojis.length === 0) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | No valid emojis found in the message or arguments.`
                        )
                ]
            });
        }

        let currentIndex = 0;
        const allItems = [...emojis, ...stickers];

        const getEmojiUrl = (emoji) => {
            const emojiId = emoji.match(/:(\d+)>/)[1];
            const isAnimated = emoji.startsWith('<a:');
            return `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
        };

        const getEmojiName = (emoji) => {
            const match = emoji.match(/<a?:([^:]+):/);
            return match ? match[1] : 'emoji';
        };

        const getStickerUrl = (sticker) => {
            if (sticker.format === 'APNG' || sticker.format === 'LOTTIE') {
                return sticker.url; 
            } else if (sticker.format === 'GIF') {
                return `https://cdn.discordapp.com/stickers/${sticker.id}.gif`; 
            } else {
                return `https://cdn.discordapp.com/stickers/${sticker.id}.png`; 
            }
        };

        const emojiEmbed = (url) => {
            return new MessageEmbed()
                .setColor(client.color)
                .setImage(url);
        };

        const createActionRow1 = () => {
            return new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('start_item')
                        .setEmoji('⏮️')
                        .setStyle('SECONDARY')
                        .setDisabled(currentIndex === 0),
                    new MessageButton()
                        .setCustomId('previous_item')
                        .setEmoji('◀️')
                        .setStyle('SECONDARY')
                        .setDisabled(currentIndex === 0),
                    new MessageButton()
                        .setCustomId('next_item')
                        .setEmoji('▶️')
                        .setStyle('SECONDARY')
                        .setDisabled(currentIndex === allItems.length - 1),
                    new MessageButton()
                        .setCustomId('end_item')
                        .setEmoji('⏭️')
                        .setStyle('SECONDARY')
                        .setDisabled(currentIndex === allItems.length - 1),
                    new MessageButton()
                        .setCustomId('steal_all')
                        .setLabel('Steal All')
                        .setStyle('SECONDARY')
                );
        };

        const createActionRow2 = () => {
            return new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('steal_emoji')
                        .setLabel('Add as Emoji')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('steal_sticker')
                        .setLabel('Add as Sticker')
                        .setStyle('SECONDARY')
                );
        };

        const updateEmbed = async () => {
            const currentItem = allItems[currentIndex];
            const itemUrl = currentItem.id ? getStickerUrl(currentItem) : getEmojiUrl(currentItem);
            const embed = emojiEmbed(itemUrl);
            const row1 = createActionRow1();
            const row2 = createActionRow2();

            const msg = await message.channel.send({ embeds: [embed], components: [row1, row2] });

            const filter = (interaction) => {
                return interaction.user.id === message.author.id;
            };

            const collector = msg.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async (interaction) => {
                try {
                    const currentItem = allItems[currentIndex]; 
                    const currentItemUrl = currentItem.id ? getStickerUrl(currentItem) : getEmojiUrl(currentItem);
                    const isAnimated = currentItem.startsWith('<a:');

                    if (interaction.customId === 'start_item') {
                        currentIndex = 0;
                        const firstItem = allItems[currentIndex];
                        const firstItemUrl = firstItem.id ? getStickerUrl(firstItem) : getEmojiUrl(firstItem);
                        embed.setImage(firstItemUrl);
                        interaction.update({ embeds: [embed], components: [createActionRow1(), createActionRow2()] });
                    } else if (interaction.customId === 'end_item') {
                        currentIndex = allItems.length - 1;
                        const lastItem = allItems[currentIndex];
                        const lastItemUrl = lastItem.id ? getStickerUrl(lastItem) : getEmojiUrl(lastItem);
                        embed.setImage(lastItemUrl);
                        interaction.update({ embeds: [embed], components: [createActionRow1(), createActionRow2()] });
                    } else if (interaction.customId === 'steal_emoji') {
                        await message.guild.fetch();
                        await message.guild.emojis.fetch();
                        
                        const maxStaticEmojis = message.guild.premiumTier === 'TIER_3' ? 250 :
                                                message.guild.premiumTier === 'TIER_2' ? 150 :
                                                message.guild.premiumTier === 'TIER_1' ? 100 : 50;                        

                        const maxAnimatedEmojis = message.guild.premiumTier === 'TIER_3' ? 250 :
                                                  message.guild.premiumTier === 'TIER_2' ? 150 :
                                                  message.guild.premiumTier === 'TIER_1' ? 100 : 50;

                        const currentStaticEmojis = message.guild.emojis.cache.filter(e => !e.animated).size;
                        const currentAnimatedEmojis = message.guild.emojis.cache.filter(e => e.animated).size;

                        if (isAnimated && currentAnimatedEmojis >= maxAnimatedEmojis) {
                            return interaction.reply({
                                content: `This server has reached the maximum number of animated emojis (${maxAnimatedEmojis}).`,
                                ephemeral: true
                            });
                        } else if (!isAnimated && currentStaticEmojis >= maxStaticEmojis) {
                            return interaction.reply({
                                content: `This server has reached the maximum number of static emojis (${maxStaticEmojis}).`,
                                ephemeral: true
                            });
                        }

                        let name = getEmojiName(currentItem);
                        await message.guild.emojis.create(currentItemUrl, name).then((newEmoji) => {
                            interaction.reply({
                                content: `Successfully stole the emoji ${newEmoji.toString()}!`,
                                ephemeral: true
                            });
                        });
                    } else if (interaction.customId === 'steal_sticker') {
                        await message.guild.fetch();
                        await message.guild.stickers.fetch();
                        const maxStickers = message.guild.premiumTier === 'TIER_3' ? 60 :
                                            message.guild.premiumTier === 'TIER_2' ? 30 :
                                            message.guild.premiumTier === 'TIER_1' ? 15 : 5;
                        if (message.guild.stickers.cache.size >= maxStickers) {
                            return interaction.reply({
                                content: `This server has reached the maximum number of stickers (${maxStickers}).`,
                                ephemeral: true
                            });
                        }
                        let name = currentItem.match(/<a?:([^:]+):/)?.[1] || 'sticker';
                        await message.guild.stickers.create(currentItemUrl, name, 'sticker').then((newSticker) => {
                            interaction.reply({
                                content: `Successfully stole the sticker ${newSticker.name}!`,
                                ephemeral: true
                            });
                        });
                    } else if (interaction.customId === 'next_item') {
                        if (currentIndex < allItems.length - 1) {
                            currentIndex++;
                            const nextItem = allItems[currentIndex];
                            const nextItemUrl = nextItem.id ? getStickerUrl(nextItem) : getEmojiUrl(nextItem);
                            embed.setImage(nextItemUrl);
                            interaction.update({ embeds: [embed], components: [createActionRow1(), createActionRow2()] });
                        }
                    } else if (interaction.customId === 'previous_item') {
                        if (currentIndex > 0) {
                            currentIndex--;
                            const previousItem = allItems[currentIndex];
                            const previousItemUrl = previousItem.id ? getStickerUrl(previousItem) : getEmojiUrl(previousItem);
                            embed.setImage(previousItemUrl);
                            interaction.update({ embeds: [embed], components: [createActionRow1(), createActionRow2()] });
                        }
                    } else if (interaction.customId === 'steal_all') {
                        interaction.reply({ content: 'Please wait, stealing emojis. This may take a few seconds.', ephemeral: true });

                        for (const item of allItems) {
                            try {
                                const itemUrl = item.id ? getStickerUrl(item) : getEmojiUrl(item);
                                const isAnimated = item.startsWith('<a:');

                                if (item.id) { 
                                    await message.guild.fetch();
                                    await message.guild.stickers.fetch();
                                    const maxStickers = message.guild.premiumTier === 3 ? 60 :
                                                        message.guild.premiumTier === 2 ? 30 :
                                                        message.guild.premiumTier === 1 ? 15 : 5;
                                    if (message.guild.stickers.cache.size >= maxStickers) {
                                        interaction.followUp({
                                            content: `This server has reached the maximum number of stickers (${maxStickers}).`,
                                            ephemeral: true
                                        });
                                        continue;
                                    }
                                    let name = currentItem.match(/<a?:([^:]+):/)?.[1] || 'sticker';
                                    await message.guild.stickers.create(itemUrl, name, 'sticker');
                                } else { 
                                    await message.guild.fetch();
                                    await message.guild.emojis.fetch();
                                    const maxStaticEmojis = message.guild.premiumTier === 'TIER_3' ? 250 :
                                                            message.guild.premiumTier === 'TIER_2' ? 150 :
                                                            message.guild.premiumTier === 'TIER_1' ? 100 : 50;

                                    const maxAnimatedEmojis = message.guild.premiumTier === 'TIER_3' ? 250 :
                                                              message.guild.premiumTier === 'TIER_2' ? 150 :
                                                              message.guild.premiumTier === 'TIER_1' ? 100 : 50;

                                    const currentStaticEmojis = message.guild.emojis.cache.filter(e => !e.animated).size;
                                    const currentAnimatedEmojis = message.guild.emojis.cache.filter(e => e.animated).size;

                                    if (isAnimated && currentAnimatedEmojis >= maxAnimatedEmojis) {
                                        interaction.followUp({
                                            content: `This server has reached the maximum number of animated emojis (${maxAnimatedEmojis}).`,
                                            ephemeral: true
                                        });
                                        continue;
                                    } else if (!isAnimated && currentStaticEmojis >= maxStaticEmojis) {
                                        interaction.followUp({
                                            content: `This server has reached the maximum number of static emojis (${maxStaticEmojis}).`,
                                            ephemeral: true
                                        });
                                        continue;
                                    }

                                    let name = getEmojiName(currentItem);
                                    await message.guild.emojis.create(itemUrl, name);
                                }

                                await new Promise(resolve => setTimeout(resolve, 1000)); 
                            } catch (err) {
                                console.error('Error stealing item:', err);
                            }
                        }

                        interaction.followUp({
                            content: 'Successfully stole all emojis!',
                            ephemeral: true
                        });
                    }
                } catch (err) {
                    console.error('Error processing interaction:', err);
                    interaction.reply({
                        content: 'There was an error processing your request.',
                        ephemeral: true
                    });
                }
            });

            collector.on('end', () => {
                const row1 = createActionRow1();
                const row2 = createActionRow2();
                row1.components.forEach(component => component.setDisabled(true));
                row2.components.forEach(component => component.setDisabled(true));
                msg.edit({ components: [row1, row2] }).catch(console.error);
            });
        };

        await updateEmbed();
    }
};
