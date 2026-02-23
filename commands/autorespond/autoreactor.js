const { MessageEmbed } = require('discord.js');
const Autoresponder = require('../../models/autoreactor');
const config = require('../../config.json')

module.exports = {
    name: 'autoreactor',
    description: 'Manage autoreactor keywords and reactions',
    category: 'autores',
    aliases: ['are'],
    subcommand: ['create', 'update', 'delete', `setmode`, 'list'],
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Administration\` perms to run this command.`
                        )
                ]
            });
        }
        let prefix = '&' || message.guild.prefix;
        if (!args[0]) {
            const embedUsage = new MessageEmbed()
                .setTitle(`Autoreactor`)
                .setDescription(`Enhance your server's engagement with autoreactor keywords and reactions. Create, update, or remove autoreactors effortlessly.`)
                .setThumbnail(client.user.avatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: `Create Autoreactor`,
                        value: `To create an autoreactor, use: \`${prefix}autoreactor create <word> <reaction>\``
                    },
                    {
                        name: `Update Autoreactor`,
                        value: `To update an autoresponder, use: \`${prefix}autoreactor create <word> <new reaction>\``
                    },
                    {
                        name: `Remove Autoreactor`,
                        value: `To remove an autoresponder, use: \`${prefix}autoreactor remove <word>\``
                    },
                    {
                        name: `Set Mode`,
                        value: `To set the mode of an autoreactor, use: \`${prefix}autoreactor setmode <word> <exact/include>\``
                    },
                    {
                        name: `List Autoreactors`,
                        value: `To list all autoreactors, use: \`${prefix}autoreactor list\``
                    }
                )
                .setColor(client.color);
            return message.channel.send({ embeds: [embedUsage] });
        }

        const subcommand = args[0].toLowerCase();
        const keyword = args[1]?.toLowerCase();
        const reaction = args[2];
              
        const isPremium = await client.db.get(`sprem_${message.guild.id}`); 

        
        let limit = 5;
        if (isPremium) {
            limit = 50; 
        }

        
        async function isValidEmoji(emoji) {
           
            if (/^\d+$/.test(emoji)) { 
                try {
                    await message.guild.emojis.fetch(emoji);
                    return true;
                } catch {
                    return false;
                }
            }

            
            const unicodeEmojiRegex = /^<a?:\w+:\d+>$/;
            return unicodeEmojiRegex.test(emoji);
        }

        switch (subcommand) {
            case 'create':
            case 'add':    
                if (!keyword || !reaction) {
                    const embedUsageCreate = new MessageEmbed()
                        .setDescription('Usage: autoreactor create <word> <reaction>')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUsageCreate] });
                }

                if (!(await isValidEmoji(reaction))) {
                    const embedInvalidEmoji = new MessageEmbed()
                        .setDescription('Invalid emoji provided. Please provide a valid emoji.')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedInvalidEmoji] });
                }

                try {
                    const existing = await Autoresponder.findOne({ guildId: message.guild.id, keyword });
                    if (existing && existing.reaction) {
                        const embedExisting = new MessageEmbed()
                            .setDescription('Keyword already has a reaction. Use `autoreactor update` to modify it.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedExisting] });
                    }

                    const count = await Autoresponder.countDocuments({ guildId: message.guild.id, reaction: { $exists: true } });
                    if (count >= limit) {
                        const embedLimit = new MessageEmbed()
                            .setDescription(`You have reached the limit of ${limit} autoreactors of server.`)
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedLimit] });
                    }

                    const autoresponder = new Autoresponder({
                        guildId: message.guild.id,
                        keyword,
                        reaction
                    });

                    await autoresponder.save();

                    const embedCreate = new MessageEmbed()
                        .setDescription(`Autoreactor created for keyword ${keyword}.`)
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedCreate] });
                } catch (err) {
                    console.error('Error creating autoreactor:', err);
                    const embedErrorCreate = new MessageEmbed()
                        .setDescription('Failed to create autoreactor.')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedErrorCreate] });
                }

            case 'update':
                if (!keyword || !reaction) {
                   const embedUsageUpdate = new MessageEmbed()
                        .setDescription('Usage: autoreactor update <word> <new reaction>')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUsageUpdate] });
                }

                if (!(await isValidEmoji(reaction))) {
                    const embedInvalidEmoji = new MessageEmbed()
                        .setDescription('Invalid emoji provided. Please provide a valid emoji.')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedInvalidEmoji] });
                }

                try {
                    const existing = await Autoresponder.findOneAndUpdate(
                        { guildId: message.guild.id, keyword },
                        { reaction },
                        { new: true }
                    );

                    if (!existing) {
                        const embedNonExisting = new MessageEmbed()
                            .setDescription('Keyword does not exist. Use `autoreactor create` to add it.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedNonExisting] });
                    }

                    const embedUpdate = new MessageEmbed()
                        .setDescription(`Autoreactor updated for keyword ${keyword}.`)
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUpdate] });
                } catch (err) {
                    console.error('Error updating autoreactor:', err);
                    return message.channel.send('Failed to update autoreactor.');
                }

            case 'remove':
            case 'delete':    
                if (!keyword) {
                    const embedUsageRemove = new MessageEmbed()
                        .setDescription('Usage: autoreactor remove <keyword>')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUsageRemove] });
                }

                try {
                    const deleted = await Autoresponder.findOneAndDelete({ guildId: message.guild.id, keyword, reaction: { $exists: true } });

                    if (!deleted) {
                        const embedNonExistingRemove = new MessageEmbed()
                            .setDescription('Keyword does not exist or has no reaction.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedNonExistingRemove] });
                    }

                    const embedRemove = new MessageEmbed()
                        .setDescription(`Autoreactor removed for ${keyword}.`)
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedRemove] });
                } catch (err) {
                    console.error('Error removing autoreactor:', err);
                    return message.channel.send('Failed to remove autoreactor.');
                }

            case 'list':
            case 'l':    
                try {
                    const autoreactors = await Autoresponder.find({ guildId: message.guild.id, reaction: { $exists: true } });
                    
                    if (autoreactors.length === 0) {
                        const embedNoAutoreactors = new MessageEmbed()
                            .setDescription('You have not created any autoreactors.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedNoAutoreactors] });
                    }
                    
                    const isPremium = await client.db.get(`sprem_${message.guild.id}`); 
                    const limit = isPremium ? 50 : 5;
                    const guildIcon = message.guild.iconURL({ dynamic: true }) || '';
                    const guildName = message.guild.name;
                    
                    const displayedAutoreactors = isPremium ? autoreactors : autoreactors.slice(0, limit);
                            
                    let description = displayedAutoreactors
                        .map((autoreactor, index) => {
                            return `${index + 1}. **${autoreactor.keyword}** : ${autoreactor.reaction}  Mode: ${autoreactor.mode || 'Include'}`;
                        })
                        .join('\n');

                    if (!isPremium && autoreactors.length > 5) {
                        description += `\n\n**Note: **Your Premium subscription has expired!\nUpgrade now to unlock all the exclusive features and enjoy unlimited access to autoreactors.`;
                    }
                    
                    const embedList = new MessageEmbed()
                        .setTitle('Autoreactors !')
                        .setColor(client.color)
                        .setThumbnail(guildIcon)
                        .setDescription(description)                            
                        .setFooter(`Xytrix on Top ???`, client.user.displayAvatarURL())
                        .setAuthor(guildName, guildIcon);
                    
                    return message.channel.send({ embeds: [embedList] });
                } catch (err) {
                    console.error('Error fetching autoreactors:', err);
                    return message.channel.send('Failed to fetch autoreactors.');
                }

            case 'setmode':
                    if (!keyword || !args[2]) {
                        const embedUsageSetMode = new MessageEmbed()
                            .setDescription('Usage: autoreactor setmode <keyword> <exact/include>')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedUsageSetMode] });
                    }
                
                    const modeToSet = args[2].toLowerCase();
                    if (modeToSet !== 'exact' && modeToSet !== 'include') {
                        const embedInvalidMode = new MessageEmbed()
                            .setDescription('Invalid mode. Use `exact` or `include`.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedInvalidMode] });
                    }
                
                    try {
                        const updated = await Autoresponder.findOneAndUpdate(
                            { guildId: message.guild.id, keyword },
                            { mode: modeToSet },
                            { new: true }
                        );
                
                        if (!updated) {
                            const embedNonExistingUpdateMode = new MessageEmbed()
                                .setDescription('Keyword does not exist.')
                                .setColor(client.color);
                            return message.channel.send({ embeds: [embedNonExistingUpdateMode] });
                        }
                
                        const embedSetMode = new MessageEmbed()
                            .setDescription(`Autoreactor mode set to ${modeToSet} for keyword ${keyword}.`)
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedSetMode] });
                    } catch (err) {
                        console.error('Error setting autoreactor mode:', err);
                        return message.channel.send('Failed to set autoreactor mode.');
                    }                

            default:
                const embedInvalidSubcommand = new MessageEmbed()
                    .setDescription('Invalid subcommand. Use `create`, `update`, `remove`, `setmode`, `list`.')
                    .setColor(client.color);
                return message.channel.send({ embeds: [embedInvalidSubcommand] });
        }
    }
};
