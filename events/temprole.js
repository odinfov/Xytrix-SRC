const { MessageEmbed } = require('discord.js');

module.exports = async (client) => {
    setInterval(async () => {
        try {
            for (const guild of client.guilds.cache.values()) {
                const guildId = guild.id;

                const tempRoles = await client.db.get(`tempRoles_${guildId}`) || [];
                if (tempRoles.length === 0) continue;

                let hasUpdates = false;
                const updatedTempRoles = tempRoles.filter(roleData => {
                    if (!roleData || Date.now() < roleData.expiresAt) return true;

                    try {
                        const member = guild.members.cache.get(roleData.memberId);
                        const role = guild.roles.cache.get(roleData.roleId);

                        if (member && role && member.roles.cache.has(role.id)) {
                            member.roles.remove(role.id, 'Temporary role duration expired')
                                .then(async () => {
                                    try {
                                        await member.send({
                                            embeds: [
                                                new MessageEmbed()
                                                    .setColor(client.color)
                                                    .setDescription(`Your temporary role **${role.name}** in **${guild.name}** has expired and been removed.`)
                                            ]
                                        });
                                    } catch (error) {
                                    }
                                })
                                .catch(error => {
                                    if (error.code === 429) {
                                        client.util.handleRateLimit();
                                    } else {
                                        console.error('Error removing role:', error);
                                    }
                                });
                        }
                    } catch (error) {
                        console.error('Error processing expired role:', error);
                    }

                    hasUpdates = true;
                    return false;
                });

                if (hasUpdates) {
                    await client.db.set(`tempRoles_${guildId}`, updatedTempRoles);
                }
            }
        } catch (error) {
            console.error('Error in temporary role check:', error);
        }
    }, 60000);

    console.log('Temporary role removal system initialized');
};
