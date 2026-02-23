const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'embed',
    description: 'Create and customize an embed',
    category: 'rrole',
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`${client.emoji.cross} You need \`Administrator\` permissions to use this command.`)]
            });
        }

        let embed = new MessageEmbed()
            .setColor(client.color)
            .setDescription('Set up your embed using the buttons below.');

        
        const row1 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('embed_author_text').setLabel('Author Text').setStyle('PRIMARY'),
                new MessageButton().setCustomId('embed_author_url').setLabel('Author URL').setStyle('PRIMARY'),
                new MessageButton().setCustomId('embed_description').setLabel('Description').setStyle('PRIMARY'),
                new MessageButton().setCustomId('embed_title').setLabel('Title').setStyle('PRIMARY')
            );

        const row2 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('embed_footer_text').setLabel('Footer Text').setStyle('PRIMARY'),
                new MessageButton().setCustomId('embed_footer_url').setLabel('Footer URL').setStyle('PRIMARY'),
                new MessageButton().setCustomId('embed_main_image').setLabel('Main Image').setStyle('PRIMARY'),
                new MessageButton().setCustomId('embed_thumbnail').setLabel('Thumbnail').setStyle('PRIMARY')
            );

        const row3 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('embed_color').setLabel('Color').setStyle('PRIMARY'),
                new MessageButton().setCustomId('embed_send_to_channel').setLabel('Send to Channel').setStyle('SUCCESS'),
                new MessageButton().setCustomId('embed_cancel').setLabel('Cancel').setStyle('DANGER')
            );

        let setupMessage;
        let lastButtonClicked = null;
        let awaitingResponse = false;

        try {
            setupMessage = await message.channel.send({
                embeds: [embed],
                components: [row1, row2, row3]
            });
        } catch (err) {
            console.error('Error sending setup message:', err);
            return message.channel.send({ content: 'There was an error sending the setup message. Please try again later.' });
        }

        
        const filter = i => {
            return i.user.id === message.author.id && 
                   i.message.id === setupMessage.id && 
                   i.customId.startsWith('embed_');
        };

        const collector = setupMessage.createMessageComponentCollector({ 
            filter,
            time: 1000000,
            idle: 300000 
        });

        
        const messageFilter = m => m.author.id === message.author.id && awaitingResponse;

        collector.on('collect', async i => {
            if (i.customId === 'embed_cancel') {
                collector.stop();
                await setupMessage.delete();
                return i.reply({ content: 'Embed creation cancelled.', ephemeral: true });
            }

            if (i.customId === 'embed_send_to_channel') {
                awaitingResponse = true;
                await i.reply({ content: 'Please provide the channel ID or ping.', ephemeral: true });

                try {
                    const channelResponse = await message.channel.awaitMessages({
                        filter: messageFilter,
                        max: 1,
                        time: 30000,
                        errors: ['time']
                    });

                    const channelId = channelResponse.first().content;
                    await channelResponse.first().delete();

                    const channel = message.guild.channels.cache.get(channelId.replace(/[<#>]/g, ''));

                    if (!channel) {
                        awaitingResponse = false;
                        return i.followUp({ content: 'Invalid channel ID or ping.', ephemeral: true });
                    }

                    try {
                        await channel.send({ embeds: [embed] });
                        await i.followUp({ content: 'Embed sent to the specified channel.', ephemeral: true });
                        collector.stop();
                        return setupMessage.delete();
                    } catch (err) {
                        console.error('Error sending embed to channel:', err);
                        awaitingResponse = false;
                        await i.followUp({ content: 'There was an error sending the embed to the channel. Please try again later.', ephemeral: true });
                    }
                } catch (err) {
                    console.error('Error waiting for channel response:', err);
                    awaitingResponse = false;
                    await i.followUp({ content: 'No channel specified within the time limit.', ephemeral: true });
                }
                return;
            }

            lastButtonClicked = i.customId.replace('embed_', '');
            awaitingResponse = true;

            await i.reply({ 
                content: `Send the ${lastButtonClicked.replace('_', ' ')} for your embed.`, 
                ephemeral: true 
            });

            try {
                const inputResponse = await message.channel.awaitMessages({
                    filter: messageFilter,
                    max: 1,
                    time: 30000,
                    errors: ['time']
                });

                const input = inputResponse.first().content;
                await inputResponse.first().delete();

                switch (lastButtonClicked) {
                    case 'author_text':
                        embed.setAuthor({ 
                            name: input, 
                            iconURL: embed.author?.iconURL 
                        });
                        break;
                    case 'author_url':
                        if (!embed.author?.name) {
                            await i.followUp({ content: 'Please set the author text first.', ephemeral: true });
                            break;
                        }
                        embed.setAuthor({ 
                            name: embed.author.name, 
                            iconURL: input 
                        });
                        break;
                    case 'description':
                        embed.setDescription(input);
                        break;
                    case 'title':
                        embed.setTitle(input);
                        break;
                    case 'footer_text':
                        embed.setFooter({ 
                            text: input, 
                            iconURL: embed.footer?.iconURL 
                        });
                        break;
                    case 'footer_url':
                        if (!embed.footer?.text) {
                            await i.followUp({ content: 'Please set the footer text first.', ephemeral: true });
                            break;
                        }
                        embed.setFooter({ 
                            text: embed.footer.text, 
                            iconURL: input 
                        });
                        break;
                    case 'main_image':
                        embed.setImage(input);
                        break;
                    case 'thumbnail':
                        embed.setThumbnail(input);
                        break;
                    case 'color':
                        const colorRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
                        if (!colorRegex.test(input)) {
                            await i.followUp({ 
                                content: 'Please provide a valid hex color code (e.g., #FF0000 for red).', 
                                ephemeral: true 
                            });
                            break;
                        }
                        const colorHex = input.startsWith('#') ? input.substring(1) : input;
                        embed.setColor(colorHex);
                        break;
                }

                awaitingResponse = false;
                await setupMessage.edit({ 
                    embeds: [embed], 
                    components: [row1, row2, row3] 
                });
                
                await i.followUp({ 
                    content: `${lastButtonClicked.replace('_', ' ')} has been updated.`, 
                    ephemeral: true 
                });

            } catch (err) {
                console.error('Error handling user input:', err);
                awaitingResponse = false;
                if (!i.replied && !i.deferred) {
                    await i.followUp({ 
                        content: 'No response received within the time limit.', 
                        ephemeral: true 
                    });
                }
            }
        });

        collector.on('end', collected => {
            if (setupMessage) {
                setupMessage.edit({ 
                    components: [],
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Embed creation session ended.')]
                }).catch(() => {});
            }
        });
    }
};
