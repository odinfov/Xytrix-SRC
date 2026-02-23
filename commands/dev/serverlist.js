const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
this.config = require(`${process.cwd()}/config.json`);
module.exports = {
    name: 'serverslist',
    category: 'owner',
    aliases: ['slist'],
    description: '',
    run: async (client, message, args) => {
        if (!this.config.boss.includes(message.author.id)) return;
        let servers = client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount).map(r => r);
        let serverslist = [];
        for (let i = 0; i < servers.length; i++) {
            let name = servers[i].name,
                id = servers[i].id;
            serverslist.push(`${i + 1}) ${name} (${id})`);
        }

        const itemsPerPage = 10;
        const pages = Math.ceil(serverslist.length / itemsPerPage);
        let currentPage = 0;

        const generatePage = () => {
            const pageStart = currentPage * itemsPerPage;
            const pageEnd = pageStart + itemsPerPage;
            return serverslist.slice(pageStart, pageEnd).join('\n');
        };

        const updateEmbed = async () => {
            const embed = new MessageEmbed()
                .setTitle(`Server List Of ${client.user.username}`)
                .setColor(client.color)
                .setDescription(generatePage());

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('prevButton')
                        .setLabel('Previous')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('nextButton')
                        .setLabel('Next')
                        .setStyle('SECONDARY')
                );

            const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });

            const filter = (interaction) => interaction.user.id === message.author.id;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'prevButton') {
                    if (currentPage > 0) {
                        currentPage--;
                        await interaction.update({ embeds: [embed.setDescription(generatePage())], components: [row] });
                    }
                } else if (interaction.customId === 'nextButton') {
                    if (currentPage < pages - 1) {
                        currentPage++;
                        await interaction.update({ embeds: [embed.setDescription(generatePage())], components: [row] });
                    }
                }
            });

            collector.on('end', () => {
                if (!sentMessage.deleted && sentMessage.editable) {
                    sentMessage.edit({ components: [] });
                }
            });
        };

        await updateEmbed();
    }
};
