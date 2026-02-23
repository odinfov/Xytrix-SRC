const { getSettingsar } = require('../models/autorole');
const { Permissions } = require('discord.js');
const joinTimes = new Map();

const config = require('../config.json');

/**
 * @param {import('@src/structures').BotClient} client
 */
module.exports = async (client) => {
    client.on('guildMemberAdd', async (member) => {
        let check = await client.util.BlacklistCheck(member.guild);
        if (check) return;

        if (!member || !member.guild) return;
        const { guild } = member;
        const settings = await getSettingsar(guild);

        let rolesToAdd = [];

        const isRoleSafe = (role) => role && !role.permissions.has(
            Permissions.FLAGS.ADMINISTRATOR,
            Permissions.FLAGS.KICK_MEMBERS,
            Permissions.FLAGS.BAN_MEMBERS,
            Permissions.FLAGS.MANAGE_CHANNELS,
            Permissions.FLAGS.MANAGE_GUILD,
            Permissions.FLAGS.MENTION_EVERYONE,
            Permissions.FLAGS.MANAGE_ROLES,
            Permissions.FLAGS.MANAGE_WEBHOOKS
        );

        if (settings.autorole.length > 0) {
            rolesToAdd.push(...settings.autorole
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(isRoleSafe)
            );
        }

        if (!member.user.bot && settings.humanautorole.length > 0) {
            rolesToAdd.push(...settings.humanautorole
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(isRoleSafe)
            );
        }
        if (member.user.bot && settings.botautorole.length > 0) {
            rolesToAdd.push(...settings.botautorole
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(isRoleSafe)
            );
        }
        if (rolesToAdd.length > 0) {
            try {
                await member.roles.add(rolesToAdd, 'Xytrix Autorole');
            } catch (err) {
                if (err.code === 429) {
                    await client.util.handleRateLimit();
                } else {
                    console.error('Error adding roles:', err);
                }
            }
        }

        if (!settings.welcome.enabled) return;
        client.util.sendWelcome(member, settings);
    });
};
