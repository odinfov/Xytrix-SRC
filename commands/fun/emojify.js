const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "emojify",
    aliases: ["emojify"],
    description: "Emojify the provided text.",
    category: "fun",
    cooldown: 5,
    premium: false,
    options: [
        {
            name: "text",
            description: "The text to emojify.",
            type: 3, 
            required: true,
        }
    ],
    run: async (client, message, args) => {
        const text = args.join(" ");
        if (!text) return message.channel.send("Please provide text to emojify.");
        const emojified = emojify(text);
        message.channel.send(emojified);
    }
};

function emojify(content) {
    const chars = {
        '0': ':zero:',
        '1': ':one:',
        '2': ':two:',
        '3': ':three:',
        '4': ':four:',
        '5': ':five:',
        '6': ':six:',
        '7': ':seven:',
        '8': ':eight:',
        '9': ':nine:',
        '!': ':exclamation:',
        '?': ':question:',
        '#': ':hash:',
        '*': ':asterisk:'
    };

    content = content.toLowerCase().split('');

    content = content.map(letter => {
        if (/[a-z]/g.test(letter)) return `:regional_indicator_${letter}:`;
        else if (chars[letter]) return chars[letter];
        else return letter;
    });

    return content.join('');
}
