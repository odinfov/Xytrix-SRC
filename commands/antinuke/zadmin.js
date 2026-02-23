const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Admin = require('../../models/admin');

const config = require('../../config.json');

module.exports = {
    name: 'admin',
    category: 'security',
    description: 'Set admin for the server',
    subcommand: ['add', 'remove', 'list', 'reset'],
    premium: false,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && message.guild.memberCount < 30) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Your server must have at least 30 members to use this feature.`
                        )
                ]
            })
        }
        const antinuke = await client.db.get(`${message.guild.id}_antinuke`)
        if (!antinuke) {
            const antinukedisable = new MessageEmbed()
                .setColor(client.color)
                .setDescription('Antinuke is not enable in this server.');
            return message.channel.send({ embeds: [antinukedisable] });
        }        
    if (!isSpecialMember) {   
        if (message.author.id !== message.guild.ownerId) {
            const extraOwner = await client.db.get(`extraowner_${message.guild.id}`);
            if (!extraOwner || extraOwner.owner !== message.author.id) {
                const embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('You are not authorized to use this command.');
                return message.channel.send({ embeds: [embed] });
            }
        }
    }        
        
        const subcommand = args[0]?.toLowerCase();
        const member = message.mentions.members.first();
        
        const guildId = message.guild.id;
        const isPremium = await client.db.get(`sprem_${guildId}`); 
        let limit = isPremium ? 20 : 5;

        try {
            switch (subcommand) {
                case 'add':
                    {
                        const adminCount = await Admin.countDocuments({ guildId });

                        if (adminCount >= limit) {
                            const embed = new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(
                                    `You have reached the limit of ${limit} admins in this server.`
                                );
                            return message.channel.send({ embeds: [embed] });
                        }                        
                        if (!member) {
                            const embed = new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('Please mention a member.');
                            return message.channel.send({ embeds: [embed] });
                        }

                        const adminId = member.id;
                        const existingAdmin = await Admin.findOne({ guildId, adminId });

                        if (existingAdmin) {
                            const embed = new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('That member is already an admin.');
                            return message.channel.send({ embeds: [embed] });
                        }

                        const newAdmin = new Admin({ guildId, adminId });
                        await newAdmin.save();

                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setTitle('IMP NOTE')
                            .setDescription('```Be careful while adding any user. They will have access to Moderation command```')
                            .addField('**ADMIN ADDED**', `<@${member.user.id}> has been added as an admin.`)
                            .setFooter('Xytrix on Top ???');
                        return message.channel.send({ embeds: [embed] });
                    }

                    case 'remove':
                        {
                            const targetId = member ? member.id : args[1]?.replace(/[<@!>]/g, ''); 
                            if (!targetId) {
                                const embed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Please mention a member or provide their user ID.');
                                return message.channel.send({ embeds: [embed] });
                            }
                    
                            const isValidId = /^\d{17,19}$/.test(targetId);
                            if (!isValidId) {
                                const embed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Invalid member ID.');
                                return message.channel.send({ embeds: [embed] });
                            }
                    
                            const deletedAdmin = await Admin.findOneAndDelete({ guildId, adminId: targetId });
                    
                            if (!deletedAdmin) {
                                const embed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('That member is not an admin.');
                                return message.channel.send({ embeds: [embed] });
                            }
                    
                            const embed = new MessageEmbed()
                                .setColor(client.color)
                                .setTitle('IMP NOTE')
                                .setDescription('```Be careful while adding any user. They will have access to Moderation command```')
                                .addField('**ADMIN REMOVED**', `User <@${targetId}> has been removed from admin.`)
                                .setFooter('Xytrix on Top ???');
                            return message.channel.send({ embeds: [embed] });
                        }                

                    case 'list':
                            {
                                const allAdmins = await Admin.find({ guildId });
                        
                                if (allAdmins.length === 0) {
                                    const embed = new MessageEmbed()
                                        .setColor(client.color)
                                        .setDescription('No admins found in this server.');
                                    return message.channel.send({ embeds: [embed] });
                                }

                                const displayedAdmins = isPremium ? allAdmins : allAdmins.slice(0, limit);
                                
                                const adminList = displayedAdmins.map(admin => `<@${admin.adminId}>`).join('\n');
                                
                                let description = '```Be careful while adding any user. They will have access to Moderation command```';

                                if (!isPremium && allAdmins.length > limit) {
                                    description += `\n**Note: **Your Premium subscription has expired!\nUpgrade now to unlock all the exclusive features and enjoy unlimited access to admin users.`;
                                }
                                
                                const embed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setTitle('List of Admins')
                                    .setDescription(description)
                                    .addField('ADMIN LIST', adminList)
                                    .setFooter('Xytrix on Top ???');
                                
                                return message.channel.send({ embeds: [embed] });
                            }                    
                    case 'reset':
                    {
                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Are you sure you want to reset the admin members list?');

                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('confirm_reset')
                                    .setLabel('Yes')
                                    .setStyle('DANGER'),
                                new MessageButton()
                                    .setCustomId('cancel_reset')
                                    .setLabel('No')
                                    .setStyle('SECONDARY')
                            );

                        const confirmMessage = await message.channel.send({ embeds: [embed], components: [row] });

                        const filter = (interaction) => ['confirm_reset', 'cancel_reset'].includes(interaction.customId) && interaction.user.id === message.author.id;
                        const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000 });

                        collector.on('collect', async (interaction) => {
                            if (interaction.customId === 'confirm_reset') {
                                await Admin.deleteMany({ guildId });
                                const successEmbed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Admin members list has been successfully reset.');
                                await interaction.update({ embeds: [successEmbed], components: [] });
                            } else if (interaction.customId === 'cancel_reset') {
                                const cancelEmbed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Admin members list reset canceled.');
                                await interaction.update({ embeds: [cancelEmbed], components: [] });
                            }
                        });

                        collector.on('end', (_, reason) => {
                            if (reason === 'time') {
                                const timeoutEmbed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('No response received. Admin members list reset canceled.');
                                confirmMessage.edit({ embeds: [timeoutEmbed], components: [] });
                            }
                        });
                    }
                    break;    

                default:
                    {
                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Invalid subcommand. Use `add`, `remove`, `list` or `reset`.');
                        return message.channel.send({ embeds: [embed] });
                    }
            }
        } catch (err) {
            console.error(`Error in command 'admin':`, err);
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription('An error occurred while processing the command.');
            return message.channel.send({ embeds: [embed] });
        }
    },
};
