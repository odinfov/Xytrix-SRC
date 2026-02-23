const { MessageEmbed } = require('discord.js');
const Admin = require('../../models/admin');
const config = require('../../config.json')
module.exports = {
    name: 'unmuteall',
    aliases: ['untimeoutall'],
    category: 'mod',
    cooldown: 30,
    description: `Unmute all muted members in the server`,
    premium: false,
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let own = message.author.id === message.guild.ownerId;
        let isSpecialMember = config.boss.includes(message.author.id);

        let admin = await Admin.findOne({ guildId, adminId });
        if (!isSpecialMember && !admin && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`ADMINISTRATOR\` permissions to use this command.`
                        )
                ]
            });
        }
        if (!message.guild.me.permissions.has('ADMINISTRATOR')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I must have \`ADMINISTRATOR\` permissions to run this command.`
                        )
                ]
            });
        }
        if (!isSpecialMember && !admin && !own && client.util.hasHigher(message.member) == false) {
            let error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `Your highest role must be higher than my highest role to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }        

        const members = await message.guild.members.fetch();
        const mutedMembers = members.filter(member => member.isCommunicationDisabled());

        if (mutedMembers.size === 0) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} There are no muted members in this server.`)
                ]
            });
        }

        const fetchEmbed = await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`🔄 | Fetching members, please wait...`)
            ]
        });

        await sleep(800);

        fetchEmbed.edit({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Successfully started unmuting all members...`)
            ]
        });

        let unmutedCount = 0;

        for (const member of mutedMembers.values()) {
            try {
                await member.timeout(null, `${message.author.tag} | Unmute all command`);
                unmutedCount++;
                await sleep(1000); 
            } catch (error) {
                console.error(`Failed to unmute ${member.user.tag}:`, error);
                if (error.code === 429) {
                    await sleep(10000);
                }
            }
        }

        await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Successfully Unmuted ${unmutedCount} User's`)
            ]
        });
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
