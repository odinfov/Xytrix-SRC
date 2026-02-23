const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1435683165397319690/bsWJd3WfFvsRdh-V092O2iWQCzzmEyRUuIf44CucC8cdYnX7zMKce6mmnSkY01CPvBGS';

module.exports = {
    name: 'noprefix',
    aliases: ['np'],
    subcommand: ['add', 'remove', 'list'],
    category: 'owner',
    run: async (client, message, args) => {
        if (!client.config.np.includes(message.author.id)) return;

        const embed = new MessageEmbed().setColor(client.color);
        let prefix = message.guild.prefix;

        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `Please provide the required arguments.\n${prefix}noprefix \`<add/remove/list>\` \`<user id>\` \`<time>\``
                        )
                ]
            });
        }

        if (args[0].toLowerCase() === 'list') {
            let listing = await client.db.get(`noprefix_${client.user.id}`) || [];
            let info = [];
        
            if (listing.length < 1) info.push(`No Users ;-;`);
            else {
                listing.sort((a, b) => {
                    if (a.expiration === 'Unlimited' && b.expiration === 'Unlimited') return 0;
                    if (a.expiration === 'Unlimited') return 1;
                    if (b.expiration === 'Unlimited') return -1;

                    return a.expiration - b.expiration;
                });

                for (let i = 0; i < listing.length; i++) {
                    const userEntry = listing[i];
                    const user = await client.users.fetch(userEntry.userId).catch(() => null);
                    
                    let expiration;
                    if (userEntry.expiration === 'Unlimited') {
                        expiration = 'Unlimited';
                    } else {
                        const now = Date.now();
                        const timeLeft = userEntry.expiration - now;

                        if (timeLeft <= 0) {
                            expiration = `Expired <t:${Math.floor(userEntry.expiration / 1000)}:R>`;
                        } else {
                            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            
                            expiration = `${days}d ${hours}h left - <t:${Math.floor(userEntry.expiration / 1000)}:D>`;
                        }
                    }
        
                    if (user) {
                        info.push(`${i + 1}) ${user.tag} (${user.id}) Expires: ${expiration}`);
                    } else {
                        info.push(`${i + 1}) Unknown User (${userEntry.userId}) Expires: ${expiration}`);
                    }
                }
            }
        
            return await enhancedPagination(message, info, '**No Prefix Users List:-**', client.color);
        }
        if (args[0].toLowerCase() === 'reset') {

            // if (message.author.id !== '760143551920078861') {
            //     return 
            // }
        
            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('yes_reset')
                    .setLabel('Yes')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('no_reset')
                    .setLabel('No')
                    .setStyle('DANGER')
            );
        
            const confirmEmbed = new MessageEmbed()
                .setColor(client.color)
                .setDescription('**Are you sure you want to reset the No Prefix list?**');
            
            const msg = await message.channel.send({
                embeds: [confirmEmbed],
                components: [row]
            });
            
            const filter = i => i.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 15000 });
            
            collector.on('collect', async i => {
                if (i.customId === 'yes_reset') {
                    await client.db.delete(`noprefix_${client.user.id}`);
                    client.util.noprefix();
                    
                    await i.update({
                        embeds: [
                            embed
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.tick} **The No Prefix list has been reset.**`
                                )
                        ],
                        components: []
                    });
                } else if (i.customId === 'no_reset') {
                    await i.update({
                        embeds: [
                            embed
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.cross} **Reset operation cancelled.**`
                                )
                        ],
                        components: []
                    });
                }
            });
            
            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await msg.edit({
                        embeds: [
                            embed
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.cross} **Reset operation timed out.**`
                                )
                        ],
                        components: []
                    });
                }
            });
            
            return;
        }

        let check = 0;
        if (!args[1]) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `Please provide the required arguments.\n${prefix}noprefix \`<add/remove/list>\` \`<user id>\` \`<time>\``
                        )
                ]
            });
        }

        let userId = args[1].replace(/[<@!>]/g, '');
        let user;
        try {
            user = await client.users.fetch(userId);
        } catch (error) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `Invalid User ID or Mention provided.\n${prefix}noprefix \`<add/remove/list>\` \`<@user/user id>\` \`<time>\``
                        )
                ]
            });
        }

        let added = await client.db.get(`noprefix_${client.user.id}`) || [];
        let opt = args[0].toLowerCase();
        let expiryDate = null;

        if (args[2]) {
            const time = args[2];
            const amount = parseInt(time.slice(0, -1));
            const unit = time.slice(-1);

            if (isNaN(amount) || !['d', 'm', 'y'].includes(unit)) {
                return message.channel.send({
                    embeds: [
                        embed
                            .setColor(client.color)
                            .setDescription(
                                `Invalid time format. Use \`1d\` for 1 day, \`1m\` for 1 month, or \`1y\` for 1 year.`
                            )
                    ]
                });
            }

            expiryDate = new Date();
            if (unit === 'd') expiryDate.setDate(expiryDate.getDate() + amount);
            if (unit === 'm') expiryDate.setMonth(expiryDate.getMonth() + amount);
            if (unit === 'y') expiryDate.setFullYear(expiryDate.getFullYear() + amount);
        }

        if (opt == 'add' || opt == 'a' || opt == '+') {
            const existingEntry = added.find(entry => entry.userId === user.id);
        
            if (existingEntry) {
                const currentExpiration = existingEntry.expiration === 'Unlimited' 
                    ? 'Unlimited' 
                    : `<t:${Math.floor(existingEntry.expiration / 1000)}:D>`; 
                
                return message.channel.send({
                    embeds: [
                        embed
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} **<@${user.id}> (${user.id})** already has No Prefix.\nExpires: ${currentExpiration}`
                            )
                    ]
                });
            }
        
            let expiration = 'Unlimited';
            if (args[2]) {
                const timeUnit = args[2].slice(-1);
                const timeAmount = parseInt(args[2].slice(0, -1));
        
                if (timeUnit && !isNaN(timeAmount)) {
                    let expirationDate = new Date();
                    if (timeUnit === 'd') {
                        expirationDate.setDate(expirationDate.getDate() + timeAmount);
                    } else if (timeUnit === 'm') {
                        expirationDate.setMonth(expirationDate.getMonth() + timeAmount);
                    } else if (timeUnit === 'y') {
                        expirationDate.setFullYear(expirationDate.getFullYear() + timeAmount);
                    }
        
                    expiration = `<t:${Math.floor(expirationDate.getTime() / 1000)}:D>`; 
                    added.push({ userId: user.id, expiration: expirationDate.getTime() });
                }
            } else {
                added.push({ userId: user.id, expiration: 'Unlimited' });
            }
        
            await client.db.set(`noprefix_${client.user.id}`, added);
            client.util.noprefix();

            const targetGuildId = '1421887452330594337';
            const roleId = '1429547119575957704';
            
            try {
                const targetGuild = await client.guilds.fetch(targetGuildId);
                if (targetGuild) {
                    const guildMember = await targetGuild.members.fetch(user.id).catch(() => null);
                    if (guildMember) {
                        await guildMember.roles.add(roleId);
                    }
                }
            } catch (error) {
                console.error('Error adding role to user:', error);
            }            
        
            await sendWebhookLog(
                'No Prefix Added',
                `**Action By:** ${message.author.tag} (${message.author.id})\n**User:** ${user.tag} (${user.id})\n**Expires:** ${expiration}`,
                0x2b2d31
            );
        
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} **<@${user.id}> (${user.id})** has been added as a **No Prefix** user. Expires: ${expiration}.`
                        )
                ]
            });
        }

        if (opt == 'remove' || opt == 'r' || opt == '-') {
            if (!added.some(entry => entry.userId === user.id)) {
                return message.channel.send({
                    content: `${client.emoji.cross} This User is not in the No Prefix list.`
                });
            }

            added = added.filter(entry => entry.userId !== user.id);
            await client.db.set(`noprefix_${client.user.id}`, added);
            client.util.noprefix();

            await sendWebhookLog(
                'No Prefix Removed',
                `**Action By:** ${message.author.tag} (${message.author.id})\n**User:** ${user.tag} (${user.id})`,
                0x2b2d31
            );

            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} **<@${user.id}> (${user.id})** has been removed from the **No Prefix** user list.`
                        )
                ]
            });
        }

        message.channel.send({
            embeds: [
                embed
                    .setColor(client.color)
                    .setDescription(
                        `${prefix}noprefix \`<add/remove/list>\` \`<user id>\` \`<time>\``
                    )
            ]
        });
    }
};


const enhancedPagination = async (message, data, title, color) => {
    const itemsPerPage = 10;
    const pages = Math.ceil(data.length / itemsPerPage);
    let currentPage = 0;

    const generatePage = () => {
        const pageStart = currentPage * itemsPerPage;
        const pageEnd = pageStart + itemsPerPage;
        return data.slice(pageStart, pageEnd).join('\n');
    };

    const updateEmbed = async (msg) => {
        const embed = new MessageEmbed()
            .setTitle(title)
            .setColor(color)
            .setDescription(generatePage())
            .setFooter(`Page ${currentPage + 1} of ${pages}`);

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('firstButton')
                    .setEmoji('⏮️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === 0),
                new MessageButton()
                    .setCustomId('prevButton')
                    .setEmoji('◀️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === 0),
                new MessageButton()
                    .setCustomId('nextButton')
                    .setEmoji('▶️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === pages - 1),
                new MessageButton()
                    .setCustomId('lastButton')
                    .setEmoji('⏭️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === pages - 1)
            );

        await msg.edit({ embeds: [embed], components: [row] });
    };

    const embedMessage = await message.channel.send({ 
        embeds: [new MessageEmbed()
            .setTitle(title)
            .setColor(color)
            .setDescription(generatePage())
            .setFooter(`Page ${currentPage + 1} of ${pages}`)], 
        components: [new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('firstButton')
                    .setEmoji('⏮️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === 0),
                new MessageButton()
                    .setCustomId('prevButton')
                    .setEmoji('◀️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === 0),
                new MessageButton()
                    .setCustomId('nextButton')
                    .setEmoji('▶️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === pages - 1),
                new MessageButton()
                    .setCustomId('lastButton')
                    .setEmoji('⏭️')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === pages - 1)
            )] 
    });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = embedMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'firstButton') {
            currentPage = 0;
        } else if (interaction.customId === 'prevButton' && currentPage > 0) {
            currentPage--;
        } else if (interaction.customId === 'nextButton' && currentPage < pages - 1) {
            currentPage++;
        } else if (interaction.customId === 'lastButton') {
            currentPage = pages - 1;
        }
        await updateEmbed(interaction.message);
        await interaction.deferUpdate();
    });

    collector.on('end', () => {
        if (!embedMessage.deleted && embedMessage.editable) {
            embedMessage.edit({ components: [] });
        }
    });
};

const removeDuplicates = (array) => {
    return [...new Set(array)];
};

const sendWebhookLog = async (title, description, color) => {
    const logEmbed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    try {
        await axios.post(WEBHOOK_URL, {
            username: 'No Prefix Logger',
            embeds: [logEmbed.toJSON()]
        });
    } catch (error) {
        console.error('Error sending webhook log:', error);
    } 
};
