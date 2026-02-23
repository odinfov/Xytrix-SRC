const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const mongoose = require('mongoose');
const config = require(`${process.cwd()}/config.json`);
const axios = require("axios");


mongoose.connect(config.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

const vanitySchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    vanityCode: { type: String, required: true },
});

const Vanity = mongoose.model('Vanity', vanitySchema);


module.exports = {
    name: 'antivanity',
    category: 'utility',
    description: `Prevents unauthorized changes to server vanity URL.`,
    subcommand: ['enable', 'disable'],
    premium: true,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        try {
            
            if (message.author.id !== message.guild.ownerId && !isSpecialMember) {
                const error = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Only the server owner can use this command.');
                return message.channel.send({ embeds: [error] });
            }

           
            const guild = message.guild;
            if (!guild.features.includes('VANITY_URL')) {
                const error = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('This server does not have the VANITY_URL feature enabled.');
                return message.channel.send({ embeds: [error] });
            }

            
            if (!args[0]) {
                const error = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Please provide an option `enable` or `disable`.');
                return message.channel.send({ embeds: [error] });
            }
            const antinuke = await client.db.get(`${message.guild.id}_antinuke`)
            if (!antinuke) {
                const antinukedisable = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Antinuke is not enable in this server.');
                return message.channel.send({ embeds: [antinukedisable] });
            }

            const option = args[0].toLowerCase();
            const guildId = guild.id;

            if (option === 'enable') {
                
                let member1;
                try {
                    member1 = await message.guild.members.fetch('823382745174114355');
                } catch (err) {
                    console.error('Member 1 not found:', err);
                
                    const error = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Vanity Guard not available for this server. Please contact support.');
                
                    return message.channel.send({ embeds: [error] });
                }                
                let vanityData;
                try {
                    vanityData = await Vanity.findOne({ guildId: guildId });
                } catch (err) {
                    console.error('Database error:', err);
                    const error = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Failed to fetch data from the database.');
                    return message.channel.send({ embeds: [error] });
                }

                if (vanityData) {
                    const error = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Antivanity is already enabled in this server.');
                    return message.channel.send({ embeds: [error] });
                }

                
                let description = '- By clicking Accept you agree to our terms and conditions.\n - Disable Onboarding\n - Disable Rules\n- After antivanity enable successfully you can enable all the thing above listed above\n\n**NOTE -**Xytrix will grant an external Discord account special permissions in your server to safeguard your vanity URL. If anyone tries to change your vanity URL, this account will automatically restore it to the original, ensuring it remains protected from theft.';
                const embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(description);

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('accept')
                            .setLabel('Yes')
                            .setStyle('SUCCESS'),
                        new MessageButton()
                            .setCustomId('reject')
                            .setLabel('No')
                            .setStyle('DANGER')
                    );

                const initialMessage = await message.channel.send({ embeds: [embed], components: [row] });

                const filter = i => i.user.id === message.author.id;
                const collector = initialMessage.createMessageComponentCollector({ filter, time: 30000 });

                collector.on('collect', async i => {
                    if (!filter(i)) {
                        const error = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Bro, Only the server owner can use these buttons.');
                        return i.reply({ embeds: [error], ephemeral: true });
                    }
                
                    if (i.customId === 'accept') {
                        
                        await i.deferUpdate();
                        collector.stop('accepted');

                        
                        const vanityCode = guild.vanityURLCode;

                        
                        let role = message?.guild.members.cache.get(client.user.id).roles.highest.position;
                        try {
                            role = await message.guild.roles.create({
                                name: 'VanityGuard',
                                permissions: ['ADMINISTRATOR'],
                                position: role ? role : 0,
                                reason: 'AntiVanity Enabled',
                            });
                            description = 'Successfully Created VanityGuard Role';
                            await initialMessage.edit({ embeds: [new MessageEmbed().setColor(client.color).setDescription(description)], 
                                components: [] });
                        } catch (err) {
                            console.error('Failed to create role:', err);
                            const error = new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('Failed to create VanityGuard role.');
                            return message.channel.send({ embeds: [error] });
                        }

                        const member1 = await message.guild.members.fetch('823382745174114355');
                        const member2 = await message.guild.members.fetch('1434686982281236480');

                        if (member1) {
                            try {
                                await member1.roles.add(role, 'AntiVanity Enabled');
                                description += '\nSuccessfully Given Role To Bot';
                                await initialMessage.edit({
                                    embeds: [new MessageEmbed().setColor(client.color).setDescription(description)]
                                });
                            } catch (err) {
                                console.error('Failed to add role to member:', err);
                                const error = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Failed to add VanityGuard role to the bot.');
                                return message.channel.send({ embeds: [error] });
                            }
                        }
                        
                        if (member2) {
                            try {
                                await member2.roles.add(role, 'AntiVanity Enabled');
                                description += '\nSuccessfully Given Role To VanityGuard';
                                await initialMessage.edit({
                                    embeds: [new MessageEmbed().setColor(client.color).setDescription(description)]
                                });
                            } catch (err) {
                                console.error('Failed to add role to member:', err);
                                const error = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Failed to add role to the VanityGuard.');
                                return message.channel.send({ embeds: [error] });
                            }
                        }

                        
                        try {
                            const newVanity = new Vanity({ guildId: guildId, vanityCode: vanityCode });
                            await newVanity.save();
                            await initialMessage.edit({ embeds: [new MessageEmbed().setColor(client.color).setDescription(description)] });

                            
                            await initialMessage.delete();

                            
                            const successEmbed = new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(`Successfully Antivanity enabled for code **${vanityCode}**.`);
                            return message.channel.send({ embeds: [successEmbed] });
                        } catch (err) {
                            console.error('Database error:', err);
                            const error = new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('Failed to store vanity code in the database.');
                            return message.channel.send({ embeds: [error] });
                        }

                    } else if (i.customId === 'reject') {
                        await i.deferUpdate();
                        collector.stop('rejected');

                        const error = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Antivanity system rejected.');
                        await initialMessage.edit({ embeds: [error], components: [] });
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason !== 'accepted' && reason !== 'rejected') {
                        const error = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('You have taken too long to respond.');
                        await initialMessage.edit({ embeds: [error], components: [] });
                    }
                });

            } else if (option === 'disable') {
                
                let vanityData;
                try {
                    vanityData = await Vanity.findOneAndDelete({ guildId: guildId });
                } catch (err) {
                    console.error('Database error:', err);
                    const error = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Failed to fetch data from the database.');
                    return message.channel.send({ embeds: [error] });
                }

                if (!vanityData) {
                    const error = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Antivanity is not enabled in this server.');
                    return message.channel.send({ embeds: [error] });
                }

                
                const role = message.guild.roles.cache.find(role => role.name === 'VanityGuard');
                if (role) {
                    try {
                        await role.delete('AntiVanity Disable');
                    } catch (err) {
                        console.error('Failed to delete role:', err);
                        const error = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Failed to delete VanityGuard role.');
                        return message.channel.send({ embeds: [error] });
                    }
                }
                let member1;
                try {
                    member1 = await message.guild.members.fetch('823382745174114355');
                    if (member1) {
                        await member1.kick('Antivanity Disabled');
                    }
                } catch (err) {
                    console.error('Failed to kick member1:', err);
                    const error = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Failed to kick VanityGuard bot.');
                    return message.channel.send({ embeds: [error] });
                }

                
                try {
                    await Vanity.deleteOne({ guildId: guildId });
                } catch (err) {
                    console.error('Database error:', err);
                    const error = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Failed to delete data from the database.');
                    return message.channel.send({ embeds: [error] });
                }

                
                const successEmbed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Antivanity disabled and data deleted successfully.');
                return message.channel.send({ embeds: [successEmbed] });

            } else {
                const error = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('Invalid option. Please provide `enable` or `disable`.');
                return message.channel.send({ embeds: [error] });
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription('An unexpected error occurred while executing this command.');
            return message.channel.send({ embeds: [error] });
        }
    }
};
