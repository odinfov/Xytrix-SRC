const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'reaction',
    aliases: ['react'],
    description: 'See how fast you can get the correct emoji.',
    cooldown: 10,
    category: 'fun',
    premium: false,
    run: async (client, message, args) => {
        const emojis = [
            "🍊",
            "🍓",
            "🍇",
            "🍑",
            "🍉",
        ];

        const embed = new MessageEmbed()
            .setTitle("Reaction time")
            .setDescription(`After 1-10 seconds I will reveal an emoji`)
            .setColor(client.color);

        const msg = await message.channel.send({ embeds: [embed] });

        for (let i = 0; i < emojis.length; i++) {
            setTimeout(() => {
                msg.react(emojis[i]);
            }, i * 700); 
        }

        const random = Math.floor(Math.random() * 10) + 1; 
        const random_emoji = emojis[Math.floor(Math.random() * emojis.length)];

        setTimeout(async () => {
            embed.setDescription(`React to the ${random_emoji} emoji as fast as you can!`);
            await msg.edit({ embeds: [embed] });
            msg.reactionStartTimeStamp = Date.now();
        }, random * 1000);

        const collector = msg.createReactionCollector({ time: 15000 });

        collector.on("collect", (reaction, user) => {
            if (user.bot) return;
            if (reaction.emoji.name === random_emoji) {
                collector.stop();
                msg.reactionEndTimeStamp = Date.now();
                let timeTakenOk = ((msg.reactionEndTimeStamp - msg.reactionStartTimeStamp) / 1000);
                embed.setDescription(`${user.toString()} reacted to the emoji in ${timeTakenOk.toFixed(2)} seconds!`);
                msg.edit({ embeds: [embed] });
            }
        });
    },
};
