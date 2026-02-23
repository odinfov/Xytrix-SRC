const { MessageEmbed } = require('discord.js');
const ReactionRole = require('../models/reaction'); 

module.exports = async (client) => {
    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching the reaction:', error);
                return;
            }
        }

        const reactionRole = await ReactionRole.findOne({
            guildId: reaction.message.guild.id,
            messageId: reaction.message.id,
        });

        if (!reactionRole) return;

        const roleData = reactionRole.roles.find(role => role.emoji === reaction.emoji.id || role.emoji === reaction.emoji.name);
        if (!roleData) return;

        const role = reaction.message.guild.roles.cache.get(roleData.roleId);
        if (!role) return;

        const member = reaction.message.guild.members.cache.get(user.id);
        if (!member) return;

        const dangerousPermissions = ['ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MENTION_EVERYONE', 'MANAGE_WEBHOOKS'];
        if (role.permissions.any(dangerousPermissions)) {
            return
        }

        try {
            await member.roles.add(role);
            console.log(`Added role ${role.name} to user ${user.tag}.`);
        } catch (error) {
            console.error('Error adding role:', error);
        }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching the reaction:', error);
                return;
            }
        }

        const reactionRole = await ReactionRole.findOne({
            guildId: reaction.message.guild.id,
            messageId: reaction.message.id,
        });

        if (!reactionRole) return;

        const roleData = reactionRole.roles.find(role => role.emoji === reaction.emoji.id || role.emoji === reaction.emoji.name);
        if (!roleData) return;

        const role = reaction.message.guild.roles.cache.get(roleData.roleId);
        if (!role) return;

        const member = reaction.message.guild.members.cache.get(user.id);
        if (!member) return;

        try {
            await member.roles.remove(role);
            console.log(`Removed role ${role.name} from user ${user.tag}.`);
        } catch (error) {
            console.error('Error removing role:', error);
        }
    });
};
