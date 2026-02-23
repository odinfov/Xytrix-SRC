const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require('discord.js');
const axios = require('axios');
this.config = require(`${process.cwd()}/config.json`);

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1435682904863805480/_4gvY47Ui7IHhdBnVPVBnm4nqo-wnDbxCI8DEkadGwEDCkIQ8EorSTAmsoy1LnulMW9A';

module.exports = {
    name: 'blacklistserver',
    aliases: ['bs'],
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
                            `Please provide the required arguments.\n${prefix}blacklistserver \`<add/remove/list>\` \`<server id>\``
                        )
                ]
            });
        }

        let opt = args[0].toLowerCase();

        if (opt === 'list') {
            let listing = (await client.data.get(`blacklistserver_${client.user.id}`)) || [];
            let info = [];

            if (listing.length < 1) info.push(`No servers ;-;`);
            else {
                for (let i = 0; i < listing.length; i++) {
                    let ss = await client.guilds.fetch(listing[i]).catch(() => null);
                    if (ss) {
                        info.push(`${i + 1}) ${ss.name} (${ss.id})`);
                    } else {
                        info.push(`${i + 1}) Unknown Server (${listing[i]})`);
                    }
                }
            }

            return await client.util.pagination(
                message,
                info,
                '**Blacklist Server List** :-',
                client.color
            );
        }

        if (!args[1]) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `Please provide the required arguments.\n${prefix}blacklistserver \`<add/remove/list>\` \`<server id>\``
                        )
                ]
            });
        }

        let serverID = args[1];
        let added = (await client.data.get(`blacklistserver_${client.user.id}`)) || [];

        if (opt === 'add' || opt === 'a' || opt === '+') {
            if (added.includes(serverID)) {
                return message.channel.send({
                    content: `${client.emoji.cross} This Server is already in the Blacklist.`
                });
            }

            added.push(serverID);
            added = client.util.removeDuplicates2(added);
            await client.data.set(`blacklistserver_${client.user.id}`, added);
            client.util.blacklistserver();

            await sendWebhookLog(
                'Blacklist Server Added',
                `**Action By:** ${message.author.tag} (${message.author.id})\n**Server ID:** ${serverID}`,
                0x2b2d31
            );

            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} **Server ID:** ${serverID} has been added to the **Blacklist** server.`
                        )
                ]
            });
        }

        if (opt === 'remove' || opt === 'r' || opt === '-') {
            if (!added.includes(serverID)) {
                return message.channel.send({
                    content: `${client.emoji.cross} This Server is not in the Blacklist.`
                });
            }

            added = added.filter((srv) => srv !== serverID);
            added = client.util.removeDuplicates2(added);
            await client.data.set(`blacklistserver_${client.user.id}`, added);
            client.util.blacklistserver();

            await sendWebhookLog(
                'Blacklist Server Removed',
                `**Action By:** ${message.author.tag} (${message.author.id})\n**Server ID:** ${serverID}`,
                0x2b2d31
            );

            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} **Server ID:** ${serverID} has been removed from the **Blacklist** server.`
                        )
                ]
            });
        }

        message.channel.send({
            embeds: [
                embed
                    .setColor(client.color)
                    .setDescription(
                        `${prefix}blacklistserver \`<add/remove/list>\` \`<server id>\``
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
