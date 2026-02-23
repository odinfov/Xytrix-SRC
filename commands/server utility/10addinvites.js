const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'addinvite',
    description: 'Add invites to a member',
    category: 'serveru',
    cooldown: 5,
    aliases: ['addinv'],

    run: async (client, message, args) => {
        try {
            let isSpecialMember = config.boss.includes(message.author.id);
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
            const Invite = client.secondDb.model('Invite', require('../../models/invite'));
            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            const inviteCount = parseInt(args[1], 10);

            if (!member || isNaN(inviteCount) || inviteCount <= 0) {
                return message.channel.send('Please mention a valid member and specify a positive number of invites to add.');
            }

            let userInvite = await Invite.findOne({ guildId: message.guild.id, inviterId: member.id });

            if (!userInvite) {
                userInvite = new Invite({
                    guildId: message.guild.id,
                    inviterId: member.id,
                    joins: 0,
                    leaves: 0,
                    rejoins: 0,
                });
            }

            userInvite.joins += inviteCount;
            await userInvite.save();
            const userInvites = await Invite.find({ guildId: message.guild.id, inviterId: message.author.id });
            const Joins = userInvites.reduce((sum, invite) => sum + invite.joins, 0);

            const embed = new MessageEmbed()
                .setAuthor( member.user.tag , member.user.displayAvatarURL({ dynamic: true }))
                // .setDescription(`Added **${inviteCount}** invites to **${member.user.tag}'s** invite count.`)
                .addField('Total Joins', `**${Joins}**`, true)
                .addField('Added Invites', `**${inviteCount}**`, true)
                .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error adding invites:', err);
            message.channel.send('An error occurred while adding invites.');
        }
    }
};
