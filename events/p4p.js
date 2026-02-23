const { MessageEmbed } = require('discord.js');

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (!message.guild) return;
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const p4pData = await client.db.get(`p4pSetup_${guildId}`);
        
        if (p4pData && p4pData.enabled) {
            const role = message.guild.roles.cache.get(p4pData.roleId);
            const logsChannel = message.guild.channels.cache.get(p4pData.channelId);

            
            let member;
            try {
                member = await message.guild.members.fetch(message.author.id);
            } catch (error) {
                console.error('Error fetching member:', error);
                return;
            }

            
            if (role && member.roles.cache.has(role.id)) {
                
                try {
                    await member.ban({ reason: 'P4P | ENABLED' });

                    
                    const embed = new MessageEmbed()
                    .setColor(client.color)
                    .setTitle('P4P Logs | Member Banned')
                    .setDescription(`**Member Banned:** <@${member.id}> | \`${member.id}\`\n**Content:** \`${message.content}\`\n**Reason:**\n**P4P** | **ENABLED**`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setFooter(client.user.username, client.user.displayAvatarURL())
                    .setTimestamp();

                    if (logsChannel) {
                        
                        if (logsChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) {
                            await logsChannel.send({ embeds: [embed] });
                        } 
                    } 
                } catch (error) {
                    if (err.code === 429) {
                        await client.util.handleRateLimit()
                    }                    
                }
            } 
        } 
    });
};
