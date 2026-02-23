const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "truth",
    aliases: ["truth"],
    description: "Get a random truth question.",
    category: "fun",
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const fetch = (await import('node-fetch')).default; 

            const response = await fetch("https://api.truthordarebot.xyz/v1/truth");
            const body = await response.json();
            
            if (!body || !body.question) {
                return message.channel.send("An error occurred, please try again.");
            }

            const embed = new MessageEmbed()
                .setTitle("Truth")
                .setDescription(body.question)
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            message.channel.send("An error occurred while fetching the truth question. Please try again later.");
        }
    }
};
