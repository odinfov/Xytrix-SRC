const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: "rockpaperscissors",
    aliases: ["rps"],
    description: "Play Rock Paper Scissors.",
    category: "fun",
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        const choices = ["rock", "paper", "scissors"];
        const choice = choices[Math.floor(Math.random() * choices.length)];

        const embed = new MessageEmbed()
            .setTitle("Rock Paper Scissors")
            .setDescription(`You think you can beat me?\n\nChoose one of the following: \`rock\`, \`paper\`, \`scissors\``)
            .setColor(client.color);

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("rock")
                    .setLabel("Rock")
                    .setStyle("SECONDARY")
                    .setEmoji("1047524220994863214"),
                new MessageButton()
                    .setCustomId("paper")
                    .setLabel("Paper")
                    .setStyle("SECONDARY")
                    .setEmoji("1047524227093377104"),
                new MessageButton()
                    .setCustomId("scissors")
                    .setLabel("Scissors")
                    .setStyle("SECONDARY")
                    .setEmoji("1047524299080212490")
            );

        message.channel.send({ embeds: [embed], components: [row] }).then(async msg => {
            const filter = (i) => i.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

            collector.on("collect", async i => {
                let resultEmbed;

                if (i.customId === choice) {
                    resultEmbed = new MessageEmbed()
                        .setTitle("Rock Paper Scissors")
                        .setDescription(`I also chose ${choice}! It's a tie!`)
                        .setColor(client.color);
                } else if ((i.customId === "rock" && choice === "paper") ||
                           (i.customId === "paper" && choice === "scissors") ||
                           (i.customId === "scissors" && choice === "rock")) {
                    resultEmbed = new MessageEmbed()
                        .setTitle("Rock Paper Scissors")
                        .setDescription(`I chose ${choice}! I win!`)
                        .setColor(client.color);
                } else {
                    resultEmbed = new MessageEmbed()
                        .setTitle("Rock Paper Scissors")
                        .setDescription(`I chose ${choice}! You win!`)
                        .setColor(client.color);
                }

                i.update({ embeds: [resultEmbed], components: [] });
                collector.stop();
            });

            collector.once("end", async collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new MessageEmbed()
                        .setTitle("Rock Paper Scissors")
                        .setDescription(`You didn't choose anything!`)
                        .setColor(client.color);
                    msg.edit({ embeds: [timeoutEmbed], components: [] });
                }
            });
        });
    }
};
