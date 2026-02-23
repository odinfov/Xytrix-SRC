const { MessageEmbed } = require('discord.js');
const ButtonRole = require('../models/buttonrole');

module.exports = async (client) => {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;

        const customId = interaction.customId;
        if (!customId.startsWith('role_button_')) return;

        const [, , roleId, messageId] = customId.split('_');

        const guild = interaction.guild;
        const role = guild.roles.cache.get(roleId);
        const member = guild.members.cache.get(interaction.user.id);

        if (!role) {
            return interaction.reply({ content: 'This role does not exist on this server.', ephemeral: true });
        }

        const buttonRoleSetup = await ButtonRole.findOne({ messageId, roleId });
        if (!buttonRoleSetup) {
            return interaction.reply({ content: 'This button role setup does not exist.', ephemeral: true });
        }

        if (!member) {
            return interaction.reply({ content: 'You are not a member of this server.', ephemeral: true });
        }
        
        const dangerousPermissions = ['ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MENTION_EVERYONE', 'MANAGE_WEBHOOKS'];
        if (role.permissions.any(dangerousPermissions)) {
            return interaction.reply({ content: 'I cannot assign roles with dangerous permissions.', ephemeral: true });
        }

        try {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                return interaction.reply({ content: `You no longer have the role ${role.name}.`, ephemeral: true });
            } else {
                await member.roles.add(roleId);
                return interaction.reply({ content: `You have been given the role ${role.name}.`, ephemeral: true });
            }
        } catch (error) {
            console.error('Error managing role:', error);
            return interaction.reply({ content: 'An error occurred while managing the role. Please try again.', ephemeral: true });
        }
    });
};
