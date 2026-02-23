const { Message, Client, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
this.config = require(`${process.cwd()}/config.json`);

module.exports = {
    name: 'restart',
    aliases: ['reboot', 'restartbot'],
    category: 'owner',
    run: async (client, message, args) => {
        if (!this.config.boss.includes(message.author.id)) return;

        const embed = new MessageEmbed()
            .setColor(client.color)
            .setDescription('Are you sure you want to restart the bot?')
            .setTimestamp();

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('confirm_restart')
                    .setLabel('Yes')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('cancel_restart')
                    .setLabel('No')
                    .setStyle('SECONDARY')
            );

        const confirmationMessage = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = (interaction) => {
            return this.config.boss.includes(interaction.user.id) && interaction.isButton();
        };

        const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_restart') {
                const embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Restarting the bot...')
                    .setTimestamp();

                await interaction.update({ embeds: [embed], components: [] });

                
                await client.shard.respawnAll();
                
                setTimeout(() => process.exit(), 1000);
            } else if (interaction.customId === 'cancel_restart') {
                const embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Bot restart canceled.')
                    .setTimestamp();

                await interaction.update({ embeds: [embed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                const embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Bot restart request timed out.')
                    .setTimestamp();

                confirmationMessage.edit({ embeds: [embed], components: [] });
            }
        });
    }
};
