const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "tickle",
    aliases: ["tickle"],
    description: "Tickle someone.",
    category: "fun",
    cooldown: 5,
    premium: false,
    options: [
        {
            name: "user",
            description: "The user you want to tickle.",
            type: 6, 
            required: true,
        }
    ],
    run: async (client, message, args) => {
        let user = args[0] ? await message.client.users.fetch(args[0].replace(/[<@!>]/g, '')) : null;
        if (!user) return message.reply("Please provide a valid user.");
        if (user.id === message.author.id) return message.reply("You cannot tickle yourself.");

        try {
            
            const fetch = (await import('node-fetch')).default;

            
            let response = await fetch('https://nekos.life/api/v2/img/tickle');
            let body = await response.json();

            if (!body || !body.url) return message.reply("Failed to fetch tickle image.");

            let embed = new MessageEmbed()
                .setDescription(`**${message.author.username} tickled ${user.username}**`)
                .setImage(body.url)
                .setColor(client.color); 

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching tickle image:', error);
            message.reply('Failed to fetch tickle image. Please try again later.');
        }
    }
};
