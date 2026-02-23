const { MessageEmbed } = require('discord.js');
const Autoresponder = require('../../models/autoresponder'); 
const config = require('../../config.json')

module.exports = {
    name: 'autoresponder',
    description: 'Manage autoresponder keywords and responses',
    category: 'autores',
    aliases: ['ar'],
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
            })
        }
        let prefix = '&' || message.guild.prefix;
        if (!args[0]) {
            const embedUsage = new MessageEmbed()
                .setTitle(`Autoresponder`)
                .setThumbnail(client.user.avatarURL({ dynamic: true }))
                .setDescription(`Enhance your server's engagement with autoresponder keywords and responses. Create, update, or remove autoresponders effortlessly.`)
                .addFields(
                    {
                        name: `Create Autoresponder`,
                        value: `To enable autoresponder, use: \`${prefix}autoresponder create <keyword> <response>\``
                    },
                    {
                        name: `Update Autoresponder`,
                        value: `To update autoresponder, use: \`${prefix}autoresponder update <keyword> <new response>\``
                    },
                    {
                        name: `Remove Autoresponder`,
                        value: `To remove autoresponder, use: \`${prefix}autoresponder remove <keyword>\``
                    },
                    {
                        name: `Set Mode`,
                        value: `To set mode, use: \`${prefix}autoresponder setmode <keyword> <exact/include>\``
                    },
                    {
                        name: `List Autoresponders`,
                        value: `To list all autoresponders, use: \`${prefix}autoresponder list\``
                    }

                )
                .setColor(client.color);
            return message.channel.send({ embeds: [embedUsage] });
        }

        const subcommand = args[0].toLowerCase();
        const keyword = args[1]?.toLowerCase();
        const response = args.slice(2).join(' ');

        const isPremium = await client.db.get(`sprem_${message.guild.id}`); 

        
        let limit = 5;
        if (isPremium) {
            limit = 50; 
        }

        switch (subcommand) {
            case 'create':
            case 'add':    
                if (!keyword || !response) {
                    const embedUsageCreate = new MessageEmbed()
                        .setDescription('Usage: autoresponder create <word> <response>')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUsageCreate] });
                }

                const mode = args[args.length - 1].toLowerCase();
                const exact = mode === 'exact';

                try {
                    const existing = await Autoresponder.findOne({ guildId: message.guild.id, keyword });
                    if (existing) {
                        const embedExisting = new MessageEmbed()
                            .setDescription('Keyword already exists. Use `autoresponder update` to modify it.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedExisting] });
                    }

                    const count = await Autoresponder.countDocuments({ guildId: message.guild.id });
                    if (count >= limit) {
                        const embedLimit = new MessageEmbed()
                            .setDescription(`You have reached the limit of ${limit} autoresponders of server.`)
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedLimit] });
                    }

                    const autoresponder = new Autoresponder({
                        guildId: message.guild.id,
                        keyword,
                        response,
                        exact
                    });

                    await autoresponder.save();

                    const embedCreate = new MessageEmbed()
                        .setDescription(`Autoresponder created for keyword ${keyword} with mode: ${exact ? 'exact' : 'include'}.`)
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedCreate] });
                } catch (err) {
                    console.error('Error creating autoresponder:', err);
                    const embedErrorCreate = new MessageEmbed()
                        .setDescription('Failed to create autoresponder.')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedErrorCreate] });
                }

            case 'update':
                if (!keyword || !response) {
                   const embedUsageUpdate = new MessageEmbed()
                        .setDescription('Usage: autoresponder update <word> <new response>')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUsageUpdate] });
                }

                try {
                    const existing = await Autoresponder.findOneAndUpdate(
                        { guildId: message.guild.id, keyword },
                        { response },
                        { new: true }
                    );

                    if (!existing) {
                        const embedNonExisting = new MessageEmbed()
                            .setDescription('Keyword does not exist. Use `autoresponder create` to add it.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedNonExisting] });
                    }

                    const embedUpdate = new MessageEmbed()
                        .setDescription(`Autoresponder updated for keyword ${keyword}.`)
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUpdate] });
                } catch (err) {
                    console.error('Error updating autoresponder:', err);
                    return message.channel.send('Failed to update autoresponder.');
                }

            case 'remove':
            case 'delete':    
                if (!keyword) {
                    const embedUsageRemove = new MessageEmbed()
                        .setDescription('Usage: autoresponder remove <keyword>')
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedUsageRemove] });
                }

                try {
                    const deleted = await Autoresponder.findOneAndDelete({ guildId: message.guild.id, keyword });

                    if (!deleted) {
                        const embedNonExistingRemove = new MessageEmbed()
                            .setDescription('Keyword does not exist.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedNonExistingRemove] });
                    }

                    const embedRemove = new MessageEmbed()
                        .setDescription(`Autoresponder removed for ${keyword}.`)
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedRemove] });
                } catch (err) {
                    console.error('Error removing autoresponder:', err);
                    return message.channel.send('Failed to remove autoresponder.');
                }

            case 'list':
            case 'l':    
                try {
                    const autoresponders = await Autoresponder.find({ guildId: message.guild.id });
                    
                    if (autoresponders.length === 0) {
                        const embedNoAutoresponders = new MessageEmbed()
                            .setDescription('You have not created any autoresponders.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedNoAutoresponders] });
                    }
                            
                    const isPremium = await client.db.get(`sprem_${message.guild.id}`);
                    const limit = isPremium ? 50 : 5;
                    const guildIcon = message.guild.iconURL({ dynamic: true }) || '';
                    const guildName = message.guild.name;
                            
                    const displayedAutoresponders = isPremium ? autoresponders : autoresponders.slice(0, limit);
                            
                    let description = displayedAutoresponders
                        .map((autoresponder, index) => `${index + 1}. **${autoresponder.keyword}**  Mode: ${autoresponder.exact ? 'Exact' : 'Include'}`)
                        .join('\n');
                                
                    if (!isPremium && autoresponders.length > 5) {
                        description += `\n\n**Note: **Your Premium subscription has expired!\nUpgrade now to unlock all the exclusive features and enjoy unlimited access to autoresponders.`;
                    }
                            
                    const embedList = new MessageEmbed()
                        .setTitle('Autoresponders !')
                        .setColor(client.color)
                        .setThumbnail(guildIcon)
                        .setDescription(description)                            
                        .setFooter(`Xytrix on Top ???`, client.user.displayAvatarURL())
                        .setAuthor(guildName, guildIcon);
                                
                    return message.channel.send({ embeds: [embedList] });
                } catch (err) {
                    console.error('Error fetching autoresponders:', err);
                    return message.channel.send('Failed to fetch autoresponders.');
                }

            case 'setmode':
                if (!keyword || !args[2]) {
                    const embedUsageSetMode = new MessageEmbed()
                        .setDescription('Usage: autoresponder setmode <keyword> <exact/include>')
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
                        { exact: modeToSet === 'exact' },
                        { new: true }
                    );

                    if (!updated) {
                        const embedNonExistingUpdateMode = new MessageEmbed()
                            .setDescription('Keyword does not exist.')
                            .setColor(client.color);
                        return message.channel.send({ embeds: [embedNonExistingUpdateMode] });
                    }

                    const embedSetMode = new MessageEmbed()
                        .setDescription(`Autoresponder mode set to ${modeToSet} for keyword ${keyword}.`)
                        .setColor(client.color);
                    return message.channel.send({ embeds: [embedSetMode] });
                } catch (err) {
                    console.error('Error setting autoresponder mode:', err);
                    return message.channel.send('Failed to set autoresponder mode.');
                }

            default:
                const embedInvalidSubcommand = new MessageEmbed()
                    .setDescription('Invalid subcommand. Use `create`, `update`, `remove`, `setmode`, `list`.')
                    .setColor(client.color);
                return message.channel.send({ embeds: [embedInvalidSubcommand] });
        }
    }
};
