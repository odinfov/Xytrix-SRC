const { MessageEmbed } = require('discord.js');
const axios = require('axios');
this.config = require(`${process.cwd()}/config.json`);

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1431382043954118769/PMXNgMdhw7gTXASh1mCOcHmyx4U0N4uFoInVYPGkj01YkdgKvBkNwfG2aGO6JN9VxToW';

module.exports = {
    name: 'addpremium',
    aliases: ['addprem', 'premium+', '++'],
    category: 'owner',
    run: async (client, message, args) => {
        let time;
        let count;

        if (!this.config.prem.includes(message.author.id)) return;

        let arr = [];
        const embed = new MessageEmbed().setColor(client.color);

        if (args[0]) {
            let user;
            try {
                user = await client.users.fetch(args[0]);
            } catch (error) {
                return message.channel.send('Invalid Id');
            }

            const hasPremium = await client.db.get(`uprem_${args[0]}`);
            if (hasPremium === 'true') {
                return message.channel.send({
                    embeds: [
                        embed
                            .setColor(client.color)
                            .setDescription(`This user already has premium. Use updatepremium to update their premium status.`)
                    ]
                });
            }

            time = Date.now() + 86400000 * (args[1] || 1);
            count = args[2] || 0;

            await client.db.set(`uprem_${args[0]}`, `true`);
            await client.db.set(`upremend_${args[0]}`, time);
            await client.db.set(`upremcount_${args[0]}`, count);
            await client.db.set(`upremserver_${args[0]}`, arr);

            const logEmbed = new MessageEmbed()
                .setColor(client.color)
                .setTitle('Premium User Added')
                .setDescription(
                    `**Action By:** ${message.author.tag} (${message.author.id})\n` +
                    `**User:** ${user.tag} (${user.id})\n` +
                    `**Premium Count:** \`${count}\`\n` +
                    `**Premium Expiring:** <t:${Math.round(time / 1000)}:F>`
                );

            await sendWebhookLog(logEmbed);

            const targetGuildId = '1421887452330594337';
            const roleId = '1429493902880014617';
            
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

            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${user.tag} (${args[0]}) has been added as a premium user\nPremium Count: \`${count}\`\nPremium Expiring: <t:${Math.round(time / 1000)}>`
                        )
                ]
            });
        } else {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(`Please provide the user ID`)
                ]
            });
        }
    }
};

const sendWebhookLog = async (logEmbed) => {
    try {
        await axios.post(WEBHOOK_URL, {
            username: 'Premium Logger',
            embeds: [logEmbed.toJSON()]
        });
    } catch (error) {
        console.error('Error sending webhook log:', error);
    }
};
