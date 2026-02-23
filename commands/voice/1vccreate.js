const { MessageEmbed, MessageActionRow, MessageButton, Permissions, Modal, TextInputComponent } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'jointocreate',
    description: 'Setup the join to create voice channel system',
    category: 'voice',
    aliases: ['j2c'],
    subcommand: ['setup', 'reset', 'view'],
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription(`${client.emoji.cross} You must have \`Administrator\` permissions to use this command.`)]
            });
        }

        const subcommand = args[0];

        if (!subcommand) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('Please provide a valid subcommand: `setup`, `reset`, or `view`.')]
            });
        }

        const guildId = message.guild.id;

        if (subcommand === 'setup') {
            const existingSetup = await client.db.get(`voiceChannelSetup_${guildId}`);
            if (existingSetup) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Join to create system is already set up in this server. Please use `jointocreate reset` first if you want to create a new setup.')]
                });
            }
            
            let category = await message.guild.channels.create('Xytrix', { 
                type: 'GUILD_CATEGORY',
                permissionOverwrites: [
                    {
                        id: message.guild.id, 
                        allow: [Permissions.FLAGS.VIEW_CHANNEL],
                        deny: [Permissions.FLAGS.SEND_MESSAGES] 
                    }
                ]
            });

            
            let controlChannel = await message.guild.channels.create('control', {
                type: 'GUILD_TEXT',
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: message.guild.id, 
                        allow: [Permissions.FLAGS.VIEW_CHANNEL], 
                        deny: [Permissions.FLAGS.SEND_MESSAGES] 
                    }
                ]
            });

            
            let templateChannel = await message.guild.channels.create('Create Vc .', {
                type: 'GUILD_VOICE',
                parent: category.id,
                userLimit: 2,
                permissionOverwrites: [
                    {
                        id: message.guild.id, 
                        allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK] 
                    }
                ]
            });

            
            const embed = new MessageEmbed()
            .setColor(client.color)
            .setAuthor({
                name: `${client.user.username}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setTitle('Voice Interface')
            .setThumbnail(client.user.displayAvatarURL())
            .setImage('https://cdn.discordapp.com/attachments/1430601251371880481/1431307745574785024/1761320740459.jpg?ex=68fcf0b6&is=68fb9f36&hm=fc417a85f8dd4bcdcdc25a525be2655dbcf8b59b1daf01db02c3477a6c89a305&')
            .setDescription('Use the buttons below to control your voice channel.');

        const row1 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('lock').setEmoji('<:Xytrix_lock:1431299275756671056>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('unlock').setEmoji('<:Xytrix_unlock:1431299432233701508>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('hide').setEmoji('<:Xytrix_hide:1433948052388974672>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('unhide').setEmoji('<:Xytrix_unhide:1433951020005851217>').setStyle('SECONDARY')
            );

        const row2 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('channel_name').setEmoji('<:Xytrix_rename:1431299694507724901>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('user_limit').setEmoji('<:Xytrix_limit:1431299842381975702>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('change_region').setEmoji('<:Xytrix_region:1431299983029833910>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('change_bitrate').setEmoji('<:Xytrix_bitrate:1431300781264338975>').setStyle('SECONDARY')
            );

        const row3 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('mute').setEmoji('<:Xytrix_mute:1431300239712849920>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('unmute').setEmoji('<:Xytrix_voice:1430992734042329108>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('deafen').setEmoji('<:Xytrix_defean:1431300513193787462>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('undeafen').setEmoji('<:Xytrix_undeafean:1431300968858914938>').setStyle('SECONDARY')
            );

        const row4 = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('ban').setEmoji('<:Xytrix_ban:1433947999649665024>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('kick').setEmoji('<:Xytrix_kick:1433947952795357346>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('transfer_ownership').setEmoji('<:transfer:1431306190159347772>').setStyle('SECONDARY'),
                new MessageButton().setCustomId('claim_ownership').setEmoji('<:Xytrix_claim:1431301429024260196>').setStyle('SECONDARY')
            );
        


        await controlChannel.send({ embeds: [embed], components: [row1, row2, row3, row4] });

            
            const data = {
                categoryId: category.id,
                controlChannelId: controlChannel.id,
                templateChannelId: templateChannel.id
            };

            await client.db.set(`voiceChannelSetup_${guildId}`, data);

            message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('Join to Create system has been set up successfully!')]
            });

        } else if (subcommand === 'reset') {
            const setupData = await client.db.get(`voiceChannelSetup_${guildId}`);
            if (!setupData) {
                return message.channel.send({
                    embeds: [new MessageEmbed().setColor(client.color).setDescription('No setup found to reset.')]
                });
            }

            
            const category = message.guild.channels.cache.get(setupData.categoryId);
            const controlChannel = message.guild.channels.cache.get(setupData.controlChannelId);
            const templateChannel = message.guild.channels.cache.get(setupData.templateChannelId);

            if (category) await category.delete();
            if (controlChannel) await controlChannel.delete();
            if (templateChannel) await templateChannel.delete();

            
            await client.db.delete(`voiceChannelSetup_${guildId}`);

            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('Join to Create system has been reset successfully!')]
            });

        } else if (subcommand === 'view') {
            const setupData = await client.db.get(`voiceChannelSetup_${guildId}`);
            if (!setupData) {
                return message.channel.send({
                    embeds: [new MessageEmbed().setColor(client.color).setDescription('No setup found.')]
                });
            }

            const category = message.guild.channels.cache.get(setupData.categoryId);
            const controlChannel = message.guild.channels.cache.get(setupData.controlChannelId);
            const templateChannel = message.guild.channels.cache.get(setupData.templateChannelId);

            const embed = new MessageEmbed()
                .setColor(client.color)
                .setTitle('Join to Create System Configuration')
                .setDescription(`**Category:** ${category ? category.name : 'Not Found'} (${setupData.categoryId})\n**Control Channel:** ${controlChannel ? `<#${controlChannel.id}>` : 'Not Found'} (${setupData.controlChannelId})\n**Voice Channel:** ${templateChannel ? `<#${templateChannel.id}>` : 'Not Found'} (${setupData.templateChannelId})`);

            return message.channel.send({ embeds: [embed] });

        } else {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('Invalid subcommand. Please use `setup`, `reset`, or `view`.')]
            });
        }
    },
};
