const { MessageEmbed } = require('discord.js');
module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        try {
            if (!message.guild) return;
            
            await client.util.BlacklistCheck(message.guild.id);
            if (message.author.bot) return;

            const mediaConfig = await client.db.get(`mediachannel_${message.guild.id}`);
            if (!mediaConfig || !mediaConfig.channels || !mediaConfig.channels.length) return;

            const isPremium = await client.db.get(`sprem_${message.guild.id}`);
            const mediaChannels = mediaConfig.channels;
            const isMediaChannel = mediaChannels.includes(message.channel.id);

            if (!isMediaChannel) return;

            let hasBypassRole = false;
            if (isPremium) {
                const bypassConfig = await client.db.get(`mediabypass_${message.guild.id}`);
                const bypassRoleID = bypassConfig?.role;
                if (bypassRoleID && message.member.roles.cache.has(bypassRoleID)) {
                    hasBypassRole = true;
                }
            }

            if (!message.attachments.size && !hasBypassRole) {
                await message.delete().catch(err => console.error('Error deleting message:', err));
                
                const errorMessage = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(
                        `This channel is configured as a media-only channel. You are not allowed to send messages here without attachments.`
                    );
                
                await message.channel.send({ embeds: [errorMessage] })
                    .then((x) => {
                        setTimeout(() => x.delete().catch(err => console.error('Error deleting notification:', err)), 3000);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                        if (error.code === 429) {
                            client.util.handleRateLimit();
                        }
                    });
            }
        } catch (error) {
            console.error('Error in media channel handler:', error);
        }
    });
};
