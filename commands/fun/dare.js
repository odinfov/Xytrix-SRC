const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "dare",
    aliases: ["dare"],
    description: "Get a random dare question.",
    category: "fun",
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const fetch = (await import('node-fetch')).default;

            const response = await fetch("https://api.truthordarebot.xyz/v1/dare");
            const body = await response.json();
            
            if (!body || !body.question) {
                return message.channel.send("An error occurred, please try again.");
            }

            const embed = new MessageEmbed()
                .setTitle("Dare")
                .setDescription(body.question)
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            message.channel.send("An error occurred while fetching the dare. Please try again later.");
        }
    }
};
