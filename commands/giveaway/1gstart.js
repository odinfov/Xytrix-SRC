const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const ms = require('ms');
const Giveaway = require('../../models/giveaway.js'); 
const { endGiveaway } = require('../../index.js');
const { activeTimeouts } = require('../../index.js');
const config = require('../../config.json')

const notificationTracker = {};

setInterval(() => {
    const now = Date.now();
    Object.keys(notificationTracker).forEach(key => {
        if (now - notificationTracker[key] > 6 * 60 * 60 * 1000) {
            delete notificationTracker[key];
        }
    });
}, 6 * 60 * 60 * 1000);

module.exports = {
    name: 'gstart',
    category: 'give',
    aliases: ['giveaway'],
    description: 'Begins a new giveaway event.',
    premium: false,
    async run(client, message, args) {
        let isSpecialMember = config.boss.includes(message.author.id);
        const giveawayData = await Giveaway.findOne({ guildId: message.guild.id });

        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Administration\` perms to run this command.`
                        )
                ]
            })
        }
        if (args.length < 3) {
            return message.reply('You can use this command like this: `gstart [duration] [winners] [prize]`');
        }

        const time = args[0];
        const numWinners = parseInt(args[1], 10);
        const prize = args.slice(2).join(' ');
        const emojiId = '1432739342199296051';
        const emoji = '<a:Xytrix_giveway:1431979199517687880>';

        const validTimeFormats = ['s', 'm', 'h', 'd'];
        if (!validTimeFormats.some(format => time.endsWith(format))) {
            return message.reply('Please input the time in a proper format, for example: 5s, 10m, 1h, 2d.');
        }
        const giveawayDuration = ms(time);
        if (!giveawayDuration) {
            return message.reply('Invalid duration.');
        }
        const endTime = new Date(Date.now() + giveawayDuration);
        await message.delete();

        const embed = new MessageEmbed()
            .setTitle(`<a:Xytrix_giveawaybox:1431977464053370901> **${prize}** <a:Xytrix_giveawaybox:1431977464053370901>`)
            .setDescription(`<a:Xytrix_dot:1431281000901644318> Ends: <t:${Math.floor(endTime / 1000)}:R>\n<a:Xytrix_dot:1431281000901644318> ${numWinners === 1 ? 'Winner: 1' : `Winners: ${numWinners}`}\n<a:Xytrix_dot:1431281000901644318> Hosted by: ${message.author}\n\n<a:Xytrix_dot:1431281000901644318> React with ${emoji} to participate!`)
            .setColor(client.color)
            .setTimestamp();

        const extraText = `<:Xytrix_gwy:1430993235064524912> **New Giveaway** <:Xytrix_gwy:1430993235064524912>`;                        

        const giveawayMessage = await message.channel.send({ content: extraText, embeds: [embed] });
        const customEmoji = client.emojis.cache.get(emojiId);
        if (customEmoji) {
            await giveawayMessage.react(customEmoji);
        } else {
            console.log(`Emoji with ID ${emojiId} not found in cache`);
            try {
                await giveawayMessage.react(emojiId);
            } catch (error) {
                console.error(`Failed to react with emoji ID ${emojiId}:`, error);
            }
        }

        const newGiveaway = new Giveaway({
            messageId: giveawayMessage.id,
            channelId: message.channel.id,
            prize,
            emoji: emojiId,
            endsAt: endTime,
            guildId: message.guild.id,
            numWinners: numWinners,
            hostId: message.author.id
        });
        await newGiveaway.save();

        const filter = (reaction, user) => reaction.emoji.id === emojiId && !user.bot;
        const collector = giveawayMessage.createReactionCollector({ filter, time: giveawayDuration });

        collector.on('collect', async (reaction, user) => {
            try {
                const member = await message.guild.members.fetch(user.id);
                const guildId = message.guild.id;
                const userId = user.id;

                const participationKey = `${userId}_${guildId}_${giveawayMessage.id}`;
                if (!notificationTracker[participationKey]) {
                    notificationTracker[participationKey] = Date.now();

                    const embedDM = new MessageEmbed()
                        .setAuthor(`${client.user.username}`, client.user.displayAvatarURL())
                        .setTitle(`Thanks for participating in the giveaway!`)
                        .setThumbnail(message.guild.iconURL())
                        .setDescription(`You have participated in a giveaway of server **${message.guild.name}**.\n[Vote for me to increase your winning chance!](https://discordbotlist.com/bots/Xytrix)`)
                        .setFooter('Best of luck!')
                        .setColor(client.color);
                    
                    await user.send({ embeds: [embedDM] });
                }
            } catch (error) {
                console.error(`Failed to process reaction for ${user.tag}:`, error);
            }
        });        

        collector.on('end', async () => {
        });

        const timeout = setTimeout(async () => {
            await endGiveaway(client, newGiveaway, activeTimeouts);
            collector.stop();
        }, giveawayDuration);

        activeTimeouts[giveawayMessage.id] = timeout;
    }
};
