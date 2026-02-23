const translate = require('@iamtraction/google-translate');
const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require('discord.js');

module.exports = {
  name: 'translate',
  aliases: ['tl'],
  category: 'extra',
  description: 'Translates text into the specified language.',
  premium: false,
  args: false,

  async run(client, message, args) {
    let query = null;

    if (args.length > 0) {
      query = args.join(' ');
    } else {
      try {
        const ref = await message.fetchReference();
        query = ref.content;
      } catch (e) {
        query = null;
      }
    }

    if (!query) {
      return message.channel.send('Missing query to translate.');
    }

    const languages = {
      en: 'English',
      fr: 'French',
      fi: 'Finnish',
      el: 'Greek',
      gu: 'Gujarati',
      hi: 'Hindi',
      it: 'Italian',
      ja: 'Japanese',
      la: 'Latin',
      mr: 'Marathi',
      es: 'Spanish'
    };

    const languageOptions = Object.keys(languages).map(key => ({
      label: languages[key],
      value: key
    }));

    const selectMenu = new MessageSelectMenu()
      .setCustomId('tl')
      .setPlaceholder('Select a Language to Translate')
      .addOptions(languageOptions);

    const row = new MessageActionRow().addComponents(selectMenu);

    const initialEmbed = new MessageEmbed()
      .setDescription(`\`\`\`\nTranslating: ${query}\`\`\``)
      .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true }))
      .setColor(client.color)
      .setFooter('Translated by Xytrix');

    const tl = await message.channel.send({ embeds: [initialEmbed], components: [row] });

    const collector = tl.createMessageComponentCollector({
      filter: (interaction) => {
        return interaction.isSelectMenu() && interaction.customId === 'tl' && interaction.user.id === message.author.id;
      },
      time: 100000,
      idle: 100000 / 2
    });

    collector.on('collect', async (interaction) => {
      const selectedLanguage = interaction.values[0];
      const result = await translate(query, { to: selectedLanguage });

      const translatedEmbed = new MessageEmbed()
        .setDescription(`\`\`\`\n${languages[selectedLanguage]}: ${result.text}\`\`\``)
        .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true }))
        .setColor(client.color)
        .setFooter('Translated by Xytrix');

      interaction.update({ embeds: [translatedEmbed], components: [] }).catch(console.error);
    });

    collector.on('end', () => {
      tl.edit({ components: [] }).catch(console.error);
    });
  }
};
