const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require('discord.js');
const axios = require('axios');
this.config = require(`${process.cwd()}/config.json`);


const WEBHOOK_URL = 'https://discord.com/api/webhooks/1435682604010573867/AAk8-0JkrXB1605nKRvAiUp829du9X7kdsom9dyd5vfw4T6H0f5rrPrriALv1z87rWBv';

module.exports = {
    name: 'blacklist',
    aliases: ['bl'],
    category: 'owner',
    run: async (client, message, args) => {
        if (!this.config.admin.includes(message.author.id)) return;
        const embed = new MessageEmbed().setColor(client.color);
        let prefix = message.guild.prefix;

        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `Please provide the required arguments.\n${prefix}blacklist \`<add/remove/list>\` \`<user id>\``
                        )
                ]
            });
        }

        if (args[0].toLowerCase() === 'list') {
            let listing = (await client.db.get(`blacklist_${client.user.id}`)) || [];
            let info = [];

            if (listing.length < 1) {
                info.push(`No Users ;-;`);
            } else {
                for (let i = 0; i < listing.length; i++) {
                    const user = await client.users.fetch(`${listing[i]}`);
                    info.push(`${i + 1}) ${user.tag} (${user.id})`);
                }
            }

            return await pagination(message, info, '**Blacklist Users List** :-', client.color);
        }
        

        let check = 0;
        if (!args[1]) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `Please provide the required arguments.\n${prefix}blacklist \`<add/remove/list>\` \`<user id>\``
                        )
                ]
            });
        }

        let user = await client.users.fetch(`${args[1]}`).catch((er) => {
            check += 1;
        });

        if (check == 1) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `Please provide the required arguments.\n${prefix}blacklist \`<add/remove/list>\` \`<user id>\``
                        )
                ]
            });
        }

        let added = (await client.db.get(`blacklist_${client.user.id}`)) || [];
        let opt = args[0].toLowerCase();

        if (opt === 'add' || opt === 'a' || opt === '+') {
            if (added.includes(user.id)) {
                return message.channel.send({
                    content: `${client.emoji.cross} This User is already in the Blacklist.`
                });
            }

            added.push(`${user.id}`);
            added = client.util.removeDuplicates2(added);
            await client.db.set(`blacklist_${client.user.id}`, added);
            client.util.blacklist();

            await sendWebhookLog(
                'Blacklist User Added',
                `**Action By:** ${message.author.tag} (${message.author.id})\n**User:** ${user.tag} (${user.id})`,
                0x2b2d31
            );

            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} **<@${user.id}> (${user.id})** has been added to the **Blacklist**.`
                        )
                ]
            });
        }

        if (opt === 'remove' || opt === 'r' || opt === '-') {
            if (!added.includes(user.id)) {
                return message.channel.send({
                    content: `${client.emoji.cross} This User is not in the Blacklist.`
                });
            }

            added = added.filter((srv) => srv !== `${user.id}`);
            added = client.util.removeDuplicates2(added);
            await client.db.set(`blacklist_${client.user.id}`, added);
            client.util.blacklist();

            await sendWebhookLog(
                'Blacklist User Removed',
                `**Action By:** ${message.author.tag} (${message.author.id})\n**User:** ${user.tag} (${user.id})`,
                0x2b2d31
            );

            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} **<@${user.id}> (${user.id})** has been removed from the **Blacklist**.`
                        )
                ]
            });
        }

        message.channel.send({
            embeds: [
                embed
                    .setColor(client.color)
                    .setDescription(
                        `${prefix}blacklist \`<add/remove/list>\` \`<user id>\``
                    )
            ]
        });
    }
};


const sendWebhookLog = async (title, description, color) => {
    const logEmbed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    try {
        await axios.post(WEBHOOK_URL, {
            username: 'Blacklist Logger',
            embeds: [logEmbed.toJSON()]
        });
    } catch (error) {
        console.error('Error sending webhook log:', error);
    }
};
const pagination = async (message, data, title, color) => {
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
                    .setCustomId('prevButton')
                    .setLabel('Previous')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === 0),
                new MessageButton()
                    .setCustomId('nextButton')
                    .setLabel('Next')
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
                    .setCustomId('prevButton')
                    .setLabel('Previous')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === 0),
                new MessageButton()
                    .setCustomId('nextButton')
                    .setLabel('Next')
                    .setStyle('SECONDARY')
                    .setDisabled(currentPage === pages - 1)
            )] 
    });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = embedMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'prevButton' && currentPage > 0) {
            currentPage--;
        } else if (interaction.customId === 'nextButton' && currentPage < pages - 1) {
            currentPage++;
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
