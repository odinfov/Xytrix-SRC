const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "wouldyourather",
    aliases: ["wyr", 'wouldyourather'],
    description: "Get a random would you rather question.",
    category: "fun",
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const fetch = (await import('node-fetch')).default; 

            const response = await fetch("https://api.truthordarebot.xyz/v1/wyr");
            const body = await response.json();
            
            if (!body || !body.question) {
                return message.channel.send("An error occurred, please try again.");
            }

            const embed = new MessageEmbed()
                .setTitle("Would You Rather")
                .setDescription(body.question)
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            message.channel.send("An error occurred while fetching the would you rather question. Please try again later.");
        }
    }
};
