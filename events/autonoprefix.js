module.exports = async (client) => {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        try {
            
            if (oldMember.guild.id !== '1421887452330594337') return;
            const support = oldMember.guild;
            const boostRole = support.roles.cache.get(support.roles.premiumSubscriberRole?.id);
            
            if (!boostRole) {
                return;
            }
            const hadBoost = oldMember.roles.cache.has(boostRole.id);
            const hasBoost = newMember.roles.cache.has(boostRole.id);

            const logChannel = await client.channels.fetch('1364525934035603487').catch(console.error);
            if (!logChannel) {
                return;
            }
            if (!hadBoost && hasBoost) {

                let npList = await client.db.get(`noprefix_${client.user.id}`) || [];

                npList.push({
                    userId: newMember.id,
                    expiration: 'Unlimited'
                });

                await client.db.set(`noprefix_${client.user.id}`, npList);

                if (typeof client.util.noprefix === 'function') {
                    client.util.noprefix();
                }

                await logChannel.send({
                    content: `Auto Noprefix Added To ${newMember} With Reason: \`Boosted The Server\``,
                    allowedMentions: { users: [] }
                }).catch(console.error);
            }

            if (hadBoost && !hasBoost) {

                let npList = await client.db.get(`noprefix_${client.user.id}`) || [];

                npList = npList.filter(entry => entry.userId !== oldMember.id);

                await client.db.set(`noprefix_${client.user.id}`, npList);
                if (typeof client.util.noprefix === 'function') {
                    client.util.noprefix();
                }
                await logChannel.send({
                    content: `Auto Noprefix Removed From ${oldMember} With Reason: \`Removed The Boost\``,
                    allowedMentions: { users: [] }
                }).catch(console.error);
            }
        } catch (error) {
            console.error('Error in guildMemberUpdate handler:', error);
        }
    });
};
