const { Message, Client, MessageEmbed } = require('discord.js')

module.exports = {
    name: 'boostcount',
    aliases: ['bc'],
    category: 'info',
    premium: false,

    run: async (client, message, args) => {
        
        const boostCount = message.guild.premiumSubscriptionCount || 0;

        
        const embed = new MessageEmbed()
            .setColor(client.color)
            .setTitle(`${message.guild.name}`)
            .setDescription(`**<:hash:1270978455181463623> BoostCount**\n**<a:Xytrix_boost:1431296205035540542> ${boostCount} Boosts**`);

        
        message.channel.send({ embeds: [embed] });
    }
}
