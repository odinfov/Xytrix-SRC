const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "slap",
    aliases: ["slap"],
    description: "Slap someone.",
    category: "fun",
    cooldown: 5,
    premium: false,
    options: [
        {
            name: "user",
            description: "The user you want to slap.",
            type: 6, 
            required: true,
        }
    ],
    run: async (client, message, args) => {
        let user = args[0] ? await message.client.users.fetch(args[0].replace(/[<@!>]/g, '')) : null;
        if (!user) return message.reply("Please provide a valid user.");
        if (user.id === message.author.id) return message.reply("You cannot slap yourself.");

        try {
            
            const fetch = (await import('node-fetch')).default;

            
            let response = await fetch('https://nekos.life/api/v2/img/slap');
            let body = await response.json();

            if (!body || !body.url) return message.reply("Failed to fetch slap image.");

            let embed = new MessageEmbed()
                .setDescription(`**${message.author.username} slaped ${user.username}**`)
                .setImage(body.url)
                .setColor(client.color); 

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching slap image:', error);
            message.reply('Failed to fetch slap image. Please try again later.');
        }
    }
};
