const { Message, Client, MessageEmbed } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'banner',
    category: 'info',
    description: `Displays the user's banner image upon request.`,
    aliases: [],
    premium: false,

    run: async (client, message, args) => {
        try {
            let user = 
                message.mentions.members.first()?.user || 
                await client.users.fetch(args[0]).catch(() => null) || 
                message.author;
                
            if (!user) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`User not found.`)
                    ]
                });
            }

            const data = await axios.get(`https://discord.com/api/users/${user.id}`, {
                headers: {
                    Authorization: `Bot ${client.token}`
                }
            }).then((d) => d.data);

            if (data.banner) {
                let url = data.banner.startsWith('a_')
                    ? '.gif?size=4096'
                    : '.png?size=4096';
                url = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}${url}`;
                message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setAuthor(user.tag, user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`**Banner Of ${user.username}**`)
                            .setFooter(`Requested By ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                            .setImage(url)
                    ]
                });
            } else {
                message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${user.tag} does not have a banner.`)
                    ]
                });
            }
        } catch (error) {
            console.error(error);
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`An error occurred while fetching the banner.`)
                ]
            });
        }
    }
};