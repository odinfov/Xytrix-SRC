const { MessageEmbed } = require("discord.js");
const config = require('../../config.json')
const Admin = require('../../models/admin');
module.exports = {
    name: 'roleicon',
    category: 'info',
    aliases: [],
    description: `Sets the icon for the specified role.`,
    premium: false,
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let isSpecialMember = config.boss.includes(message.author.id);
        let admin = await Admin.findOne({ guildId, adminId });
        const embed = new MessageEmbed().setColor(client.color);

        
        if (!isSpecialMember && !admin && !message.member.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} You must have \`Manage Roles\` permissions to use this command.`)]
            });
        }

        
        if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} I don't have \`Manage Roles\` permissions to execute this command.`)]
            });
        }

        
        const premiumTier = message.guild.premiumTier;
        const check = parseInt(premiumTier.split("_")[1]);
        if (premiumTier === "NONE" || check < 2) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} Your server doesn't meet the **Roleicon** requirements. Servers with level **2** boosts are allowed to set role icons.`)]
            });
        }

        
        if (!args[0]) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} Usage: ${message.guild.prefix}roleicon <role> <emoji or emoji ID>`)]
            });
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} Please provide a valid role.`)]
            });
        }

        
        if (role.position >= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} ${role} is higher in position than my highest role, so I cannot manage it.`)]
            });
        }

        
        if (role.iconURL() && !args[1]) {
            try {
                await role.setIcon(null);
                return message.channel.send({
                    embeds: [embed.setDescription(`${client.emoji.tick} Successfully removed the icon from ${role}.`)]
                });
            } catch (err) {
                return message.channel.send({
                    embeds: [embed.setDescription(`${client.emoji.cross} Failed to remove the icon from ${role}: ${err.message}`)]
                });
            }
        }

        if (!args[1]) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} Please provide an emoji or emoji ID.`)]
            });
        }

        
        const emojiRegex = /<a?:\w+:(\d{18,})>/;
        let emojiID;

        if (args[1].match(emojiRegex)) {
            emojiID = args[1].match(emojiRegex)[1]; 
        } else if (/^\d{18,}$/.test(args[1])) {
            emojiID = args[1]; 
        } else {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} Please provide a valid emoji or emoji ID.`)]
            });
        }

        const baseUrl = `https://cdn.discordapp.com/emojis/${emojiID}`;

        try {
            await role.setIcon(baseUrl);
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.tick} Successfully set the icon for ${role}.`)]
            });
        } catch (err) {
            return message.channel.send({
                embeds: [embed.setDescription(`${client.emoji.cross} Failed to set the icon for ${role}: ${err.message}`)]
            });
        }
    }
};
