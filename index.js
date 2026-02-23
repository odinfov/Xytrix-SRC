const wait = require('wait');
require('dotenv').config();
require('module-alias/register');
const path = require('path');
const Xytrix = require(`./structures/Xytrix.js`);
const client = new Xytrix();
Xytrix.setMaxListeners(20);
this.config = require(`${process.cwd()}/config.json`);
const Giveaway = require('./models/giveaway');
const vcban = require('./commands/voice/vcban');
const ms = require('ms');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { Client, MessageActionRow, MessageButton, MessageEmbed, MessageAttachment } = require('discord.js');
const reactionRoleHandler = require('./events/messageReaction');
const { OpenAI } = require('openai');
const express = require("express");

(async () => {
    await client.initializeMongoose();
    await client.initializedata();
    await wait(3000);
    (await client.loadEvents()) - (await client.loadlogs());
    await client.loadMain();
    await client.login(this.config.TOKEN);
    await loadActiveGiveaways(client, activeTimeouts);
    await reactionRoleHandler(client);
    await updateExpiredEntries();
    await vcban.listenForVoiceStateUpdates(client);
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const command = client.commands.get('ticket');
    if (command) {
        try {
            await command.handleInteraction(client, interaction);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error handling the interaction.', ephemeral: true });
        }
    }
});

let notifiedUsers = [];

async function updateExpiredEntries() {
    let entries = (await client.db.get(`noprefix_${client.user.id}`)) || [];
    let now = Date.now();

    console.log("Current Time:", now);
    console.log("No Prefix Entries:", entries);

    entries = entries.filter(entry => {
        let isValid = entry.expiration === 'Unlimited' || entry.expiration > now;
        let willExpireSoon = entry.expiration !== 'Unlimited' && entry.expiration - now < 3600000;

        console.log(`User: ${entry.userId}, Expiration: ${entry.expiration}, Valid: ${isValid}, Will Expire Soon: ${willExpireSoon}`);

        if (willExpireSoon && !notifiedUsers.includes(entry.userId)) {
            notifyUser(entry.userId);
            notifiedUsers.push(entry.userId);
        }

        return isValid;
    });

    await client.db.set(`noprefix_${client.user.id}`, entries);
    console.log('Removed expired No Prefix entries and notified users.');
}

async function notifyUser(userId) {
    try {
        let user = await client.users.fetch(userId);
        let embed = new MessageEmbed()
            .setTitle('No Prefix Expiry Notice')
            .setDescription('Your No Prefix will expire soon. Renew it to continue enjoying the benefits!')
            .setColor(client.color)
            .setFooter('Click the button below to renew.');

        let row = new MessageActionRow().addComponents(
            new MessageButton()
                .setLabel('Renew Now')
                .setStyle('LINK')
                .setURL('https://discord.gg/3xjw8snjnB')
        );

        await user.send({ embeds: [embed], components: [row] });
        console.log(`Notified user ${userId} about No Prefix expiration.`);

        const targetGuildId = '1421887452330594337';
        const roleId = '1424046787538190516';

        try {
            const targetGuild = await client.guilds.fetch(targetGuildId);
            if (targetGuild) {
                const guildMember = await targetGuild.members.fetch(userId).catch(() => null);
                if (guildMember && guildMember.roles.cache.has(roleId)) {
                    await guildMember.roles.remove(roleId);
                    console.log(`Removed role ${roleId} from user ${userId} after expiry notification.`);
                }
            }
        } catch (error) {
            console.error(`Failed to remove role from user ${userId}:`, error);
        }
    } catch (error) {
        console.error(`Failed to notify user ${userId}:`, error);
    }
}

setInterval(updateExpiredEntries, 3600000);

const activeTimeouts = {};

async function loadActiveGiveaways(client, activeTimeouts) {
    const giveaways = await Giveaway.find({ endsAt: { $gt: new Date() } });

    giveaways.forEach(giveaway => {
        const remainingTime = new Date(giveaway.endsAt) - new Date();
        if (remainingTime > 0) {
            const timeout = setTimeout(async () => {
                await endGiveaway(client, giveaway, activeTimeouts);
            }, remainingTime);

            activeTimeouts[giveaway.messageId] = timeout;
        } else {
            endGiveaway(client, giveaway, activeTimeouts);
        }
    });
}

async function endGiveaway(client, giveaway, activeTimeouts) {
    const channel = await client.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    try {

        if (giveaway.isEnded) return;

        const message = await channel.messages.fetch(giveaway.messageId);
        if (!message) return;

        const reactions = message.reactions.cache.get(giveaway.emoji);
        if (!reactions) return;

        const users = await reactions.users.fetch();
        const filtered = users.filter(user => !user.bot);

        let winners = [];

        if (filtered.size > 0) {
            for (let i = 0; i < giveaway.numWinners; i++) {
                const winner = filtered.random();
                winners.push(winner);
                filtered.delete(winner.id);
            }

            const congratulationsMessage = `Congrats, ${winners.map(user => user.toString()).join(', ')} You won **${giveaway.prize}**, hosted by <@${giveaway.hostId}>`;

            const giveawayLinkButton = new MessageButton()
                .setLabel('View Giveaway')
                .setStyle('LINK')
                .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`);

            const actionRow = new MessageActionRow()
                .addComponents(giveawayLinkButton);

            await channel.send({ content: congratulationsMessage, components: [actionRow] });
        } else {
            await channel.send('No entries detected therefore cannot declare the winner.');
        }

        const endEmbed = new MessageEmbed(message.embeds[0])
            .setTitle(`<a:Xytrix_giveawaybox:1431977464053370901> **${giveaway.prize}** <a:Xytrix_giveawaybox:1431977464053370901>`)
            .setDescription(`<a:Xytrix_dot:1431281000901644318> Ended: <t:${Math.floor(Date.now() / 1000)}:R>\n<a:Xytrix_dot:1431281000901644318> Hosted by: <@${giveaway.hostId}>\n\n<a:Xytrix_dot:1431281000901644318> **Winners:**\n${winners.length > 0 ? winners.map(user => user.toString()).join(', ') : 'No entries detected therefore cannot declare the winner.'}`)
            .setFooter('Ended');

        await message.edit({ content: '<:Xytrix_gwy:1430993235064524912> **Giveaway Ended** <:Xytrix_gwy:1430993235064524912>', embeds: [endEmbed] });

        if (activeTimeouts[giveaway.messageId]) {
            clearTimeout(activeTimeouts[giveaway.messageId]);
            delete activeTimeouts[giveaway.messageId];
        }
    } catch (error) {
        console.error('Error ending giveaway:', error);
    }
}

client.on('messageDelete', async (deletedMessage) => {
    if (deletedMessage.author.bot) return;

    const snipeData = {
        content: deletedMessage.content || 'No content available',
        author: deletedMessage.author.tag || 'Unknown Author',
        timestamp: deletedMessage.createdTimestamp,
        imageUrl: deletedMessage.attachments.size > 0 ? deletedMessage.attachments.first().url : null
    };

    const snipeKey = `snipe_${deletedMessage.guild.id}_${deletedMessage.channel.id}`;
    await client.data.set(snipeKey, snipeData);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton() || interaction.isModalSubmit()) {
        const command = client.commands.get('report');
        if (command && command.handleInteraction) {
            try {
                await command.handleInteraction(client, interaction);
            } catch (error) {
                console.error(error);
                if (!interaction.replied && !interaction.deferred) {
                    try {
                        await interaction.reply({
                            content: 'There was an error handling the interaction!',
                            ephemeral: true
                        });
                    } catch (replyError) {
                        console.error('Could not reply to interaction:', replyError);
                    }
                }
            }
        }
    }
});

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENAI_API_KEY || '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',
});

const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://discord.com/api/webhooks/1423462142929014875/wJojYzX7TFl9W6pqKmza5Yo5T2kY6P_nRbGbPC6T6UzEca7q7p040qA62MK0unwW9FDp";
const userCooldowns = new Map();
const MAX_MESSAGE_LENGTH = 1500;

const tempDir = path.join(__dirname, './temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}

async function sendQuestionWebhook(question, userId, username, serverName, channelName) {
    try {
        const now = new Date();
        const formattedDate = formatDate(now);
        const formattedTime = formatTime(now);

        const webhookBody = {
            content: `\`\`\`js
Question Asked: ${question}
Asked By: ${username} (${userId})
Server: ${serverName}
Channel: ${channelName}
Timestamp: ${formattedDate} ${formattedTime}
\`\`\``
        };

        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookBody)
        });
    } catch (error) {
        console.error("Question Webhook Error:", error);
    }
}

async function sendAnswerWebhook(answer, userId, username, serverName, channelName) {
    try {
        const now = new Date();
        const formattedDate = formatDate(now);
        const formattedTime = formatTime(now);

        let fileContent = `AI Response for ${username} (${userId})\n`;
        fileContent += `${formattedDate} ${formattedTime}\n`;
        fileContent += `Server: ${serverName} | Channel: ${channelName}\n\n`;
        fileContent += `${'-'.repeat(50)}\n\n`;
        fileContent += answer;

        const fileName = `response_${userId}_${Date.now()}.txt`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, fileContent, 'utf8');

        if (answer.length <= MAX_MESSAGE_LENGTH) {
            const webhookBody = {
                content: `\`\`\`js
Answer for: ${username} (${userId})
Server: ${serverName}
Channel: ${channelName}
Timestamp: ${formattedDate} ${formattedTime}
------------------------
${answer.length > 1000 ? answer.substring(0, 1000) + '... (see attached file for full response)' : answer}
\`\`\``
            };

            const form = new FormData();
            form.append('payload_json', JSON.stringify(webhookBody));
            form.append('file', fs.createReadStream(filePath), {
                filename: 'response.txt',
                contentType: 'text/plain',
            });

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                body: form,
            });
        } else {
            const webhookBody = {
                content: `\`\`\`js
Long Answer for: ${username} (${userId})
Server: ${serverName}
Channel: ${channelName}
Timestamp: ${formattedDate} ${formattedTime}
------------------------
Response is ${answer.length} characters long. See attached file for full response.
\`\`\``
            };

            const form = new FormData();
            form.append('payload_json', JSON.stringify(webhookBody));
            form.append('file', fs.createReadStream(filePath), {
                filename: 'response.txt',
                contentType: 'text/plain',
            });

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                body: form,
            });
        }

        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Failed to delete temporary webhook file:', error);
        }
    } catch (error) {
        console.error("Answer Webhook Error:", error);
    }
}

client.on("messageCreate", async (message) => {
    try {
        if (!message.content || message.author.bot || !message.guild) return;

        const guildId = message.guild.id;
        const aiChannelData = await client.db.get(`aiChannel_${guildId}`);

        if (!aiChannelData || aiChannelData.channelId !== message.channel.id) return;
        const userId = message.author.id;
        const cooldownTime = 10000;

        if (userCooldowns.has(userId)) {
            const timeLeft = userCooldowns.get(userId) - Date.now();
            if (timeLeft > 0) {
                return;
            }
        }

        userCooldowns.set(userId, Date.now() + cooldownTime);

        const serverName = message.guild.name;
        const channelName = message.channel.name;

        await sendQuestionWebhook(
            message.cleanContent,
            message.author.id,
            message.author.tag,
            serverName,
            channelName
        );

        message.channel.sendTyping();

        const completion = await openai.chat.completions.create({
            model: "openai/gpt-3.5-turbo",
            messages: [{ role: "user", content: message.cleanContent }],
        });

        let responseText = completion.choices[0].message.content;

        await sendAnswerWebhook(
            responseText,
            message.author.id,
            message.author.tag,
            serverName,
            channelName
        );

        if (responseText.length <= MAX_MESSAGE_LENGTH) {
            await message.channel.send({
                content: responseText,
                allowedMentions: { parse: ["users"] },
            });
        } else {
            const now = new Date();
            const formattedDate = formatDate(now);
            const formattedTime = formatTime(now);

            let fileContent = `AI Response for ${message.author.tag} (${message.author.id})\n`;
            fileContent += `${formattedDate} ${formattedTime}\n`;
            fileContent += `Server: ${serverName} | Channel: ${channelName}\n`;
            fileContent += `Question: ${message.cleanContent}\n\n`;
            fileContent += `${'-'.repeat(50)}\n\n`;
            fileContent += responseText;

            const fileName = `response_${message.author.id}_${Date.now()}.txt`;
            const filePath = path.join(tempDir, fileName);

            fs.writeFileSync(filePath, fileContent, 'utf8');

            const attachment = new MessageAttachment(filePath, 'response.txt');

            await message.channel.send({
                content: `<@${message.author.id}>, here's your AI response:`,
                files: [attachment],
                allowedMentions: { parse: ["users"] }
            });

            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error('Failed to delete temporary file:', error);
            }
        }
    } catch (err) {
        console.error(err);
        try {
            // await message.reply("Cannot provide data due to some reasons. Please try again later.");
        } catch (replyError) {
            console.error("Error sending error message:", replyError);
        }
        if (err.code === 429) {
            await client.util.handleRateLimit();
            return;
        }
    }
});

const app = express();
app.get('/', (req, res) => {
    res.send(decodeURIComponent("%3C%21DOCTYPE%20html%3E%0A%3Chtml%3E%0A%3Chead%3E%0A%20%20%3Ctitle%3Euoaio%3C%2Ftitle%3E%0A%20%20%3Cstyle%3Ebody%2Chtml%7Bmargin%3A0%3Bpadding%3A0%3Boverflow%3Ahidden%3B%7Diframe%7Bborder%3Anone%3Bwidth%3A100%25%3Bheight%3A100vh%3B%7D%3C%2Fstyle%3E%0A%3C%2Fhead%3E%0A%3Cbody%3E%0A%20%20%3Ciframe%20src%3D%22https%3A%2F%2Fuoaio.vercel.app%22%3E%3C%2Fiframe%3E%0A%3C%2Fbody%3E%0A%3C%2Fhtml%3E"));
});
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});


module.exports.endGiveaway = endGiveaway;
module.exports.activeTimeouts = activeTimeouts;
