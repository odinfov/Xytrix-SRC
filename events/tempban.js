const { MessageEmbed } = require('discord.js');

module.exports = async (client) => {
    const checkBans = async () => {
        try {
            for (const guild of client.guilds.cache.values()) {
                const guildId = guild.id;
                const tempBans = await client.db.get(`tempBans_${guildId}`) || [];
                
                if (tempBans.length === 0) continue;

                const currentTime = Date.now();
                let hasUpdates = false;
                
                const updatedTempBans = tempBans.filter(banData => {
                    if (!banData || currentTime < banData.expiresAt) return true;

                    try {
                        guild.members.unban(banData.userId, 'Temporary ban duration expired')
                            .then(async user => {
                                try {
                                    const dmChannel = await user.createDM();
                                    await dmChannel.send({
                                        embeds: [
                                            new MessageEmbed()
                                                .setColor(client.color)
                                                .setDescription(`Your temporary ban from **${guild.name}** has expired. You can now rejoin the server.`)
                                                .setTimestamp()
                                        ]
                                    });
                                } catch (dmError) {
                                    console.log(`Could not DM user ${banData.userId} about unban`);
                                }
                            })
                            .catch(error => {
                                if (error.code === 10026) {
                                    console.log(`User ${banData.userId} is already unbanned from ${guildId}`);
                                } else if (error.code === 429) {
                                    client.util.handleRateLimit();
                                    return true;
                                } else {
                                    console.error(`Error unbanning user ${banData.userId} from ${guildId}:`, error);
                                }
                            });
                    } catch (error) {
                        console.error('Error processing expired ban:', error);
                    }

                    hasUpdates = true;
                    return false;
                });

                if (hasUpdates) {
                    await client.db.set(`tempBans_${guildId}`, updatedTempBans);
                }
            }
        } catch (error) {
            console.error('Error in temporary ban check:', error);
        }
    };
    await checkBans();
    setInterval(checkBans, 60000);

    console.log('Temporary ban removal system initialized');
};
