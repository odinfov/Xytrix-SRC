const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: `Show's the help command.`,
    category: 'info',
    premium: false,
    run: async (client, message, args) => {
        let prefix = message.guild?.prefix || '&';

        const query = args[0];

        const getTotalCommandCount = () => {
            let total = 0;
            client.commands.forEach(cmd => {

                total += 1;

                if (cmd.subcommand && cmd.subcommand.length > 0) {
                    total += cmd.subcommand.length;
                }
            });
            return total;
        };


        const formatCommandWithSubcommands = (cmd) => {
            let formattedCommands = [`\`${cmd.name}\``];

            if (cmd.subcommand && cmd.subcommand.length > 0) {
                formattedCommands = formattedCommands.concat(
                    cmd.subcommand.map(sub => `\`${cmd.name} ${sub}\``)
                );
            }

            return formattedCommands.join(', ');
        };

        if (query) {
            const command = client.commands.get(query) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(query));

            if (!command) {
                return message.reply('Command not found!');
            }

            if (command.category === 'owner') {
                return message.reply('Command not found!');
            }

            const aliases = command.aliases && command.aliases.length > 0 ? `\`${command.aliases.join(', ')}\`` : 'None';
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(command.description || 'No description available.');

            embed.addField('Aliases', `\`${aliases}\``);

            if (command.subcommand && command.subcommand.length > 0) {
                const allCommands = [`\`${command.name}\``].concat(
                    command.subcommand.map(sub => `\`${command.name} ${sub}\``)
                );
                embed.addField('Available Commands', allCommands.join(', '));
            }

            if (typeof command.premium !== 'undefined') {
                embed.addField('Premium', command.premium ? `\`Yes\`` : `\`No\``);
            }

            embed.addField('Usage', `\`${prefix}${command.name}${command.subcommand ? ' <subcommand>' : ''}\``);

            let proxy4s = await client.users.fetch(`354455090888835073`)
            embed.setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .setFooter({
                    text: `Xytrix on Top ???`,
                    iconURL: proxy4s.displayAvatarURL({
                        dynamic: true
                    })
                })

            return message.channel.send({ embeds: [embed] });
        }

        const selectMenu = new MessageSelectMenu()
            .setCustomId('categorySelect')
            .setPlaceholder('Select a module')
            .addOptions([
                {
                    label: 'Home',
                    value: 'home',
                    description: 'Return to main menu',
                    emoji: '1430991094748811405',
                },
                {
                    label: 'AntiNuke',
                    value: 'antinuke',
                    description: 'Commands related to AntiNuke',
                    emoji: '1430991397015523338',
                },
                {
                    label: 'Moderation',
                    value: 'mod',
                    description: 'Commands related to Moderation',
                    emoji: '1430994703624568962',
                },
                {
                    label: 'Utility',
                    value: 'info',
                    description: 'Utility commands',
                    emoji: '1430994131152535752',
                },
                {
                    label: 'Welcomer',
                    value: 'welcomer',
                    description: 'Commands for Welcomer',
                    emoji: '1430997030096081037',
                },
                {
                    label: 'Ticket',
                    value: 'Ticket',
                    description: 'Commands for Ticket',
                    emoji: '1430991839422451773',
                },
                {
                    label: 'Selfrole',
                    value: 'Selfrole',
                    description: 'Commands for Selfrole',
                    emoji: '1430992192079663257',
                },
                {
                    label: 'AI',
                    value: 'AI',
                    description: 'Commands for AI',
                    emoji: '1430992387110600841',
                },
                {
                    label: 'Voice',
                    value: 'voice',
                    description: 'Commands related to Voice',
                    emoji: '1430992734042329108',
                },
                {
                    label: 'Advance Automod',
                    value: 'automod',
                    description: 'Commands for Advance Automod',
                    emoji: '1430995527092404334',
                },
                {
                    label: 'Custom Role',
                    value: 'customrole',
                    description: 'Commands for Custom Roles',
                    emoji: '1430998268023930940',
                },
                {
                    label: 'Logging',
                    value: 'logging',
                    description: 'Commands for Logging',
                    emoji: '1430998421996834957',
                },
                {
                    label: 'Server Activity',
                    value: 'Server Utility',
                    description: 'Commands for Server Activity',
                    emoji: '1430995877325049866',
                },
                {
                    label: 'Sticky Message',
                    value: 'Sticky Message',
                    description: 'Commands for Sticky Message',
                    emoji: '1430993936867917916',
                },
                {
                    label: 'Giveaway',
                    value: 'Giveaway',
                    description: 'Commands for Giveaway',
                    emoji: '1430993235064524912',
                },
                {
                    label: 'Autorespond',
                    value: 'Autorespond',
                    description: 'Commands for Autorespond',
                    emoji: '1430993728780107776',
                },
                {
                    label: 'Fun',
                    value: 'Fun',
                    description: 'Commands for Fun',
                    emoji: '1430993355403301036',
                },
            ]);

        const buttons = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('home')
                .setLabel('Home')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('delete')
                .setLabel('Delete')
                .setStyle('DANGER'),
            /*new MessageButton()
                .setLabel('Website')
                .setStyle('LINK')
                .setURL('https://devexis.tech')*/
            new MessageButton()
                .setLabel('Invite Me')
                .setStyle('LINK')
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`)
        );

        const initialEmbed = new MessageEmbed()
            .setColor(client.color)
            .setAuthor({
                name: `${client.user.username} Help Menu`,
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            })
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `Hello ! I'm Xytrix, Your Bot For Server\nSecurity With Powerful Antinuke Features.\n\nPrefix For This Server \`${prefix}\`\nTotal Commands \`${getTotalCommandCount()}\``)
            .addField(
                '__Main Modules__',
                `
                \<:Xytrix_antinuke:1430991397015523338> **AntiNuke**\n\<:Xytrix_moderation:1430994703624568962>  **Moderation**\n\<:Xytrix_utility:1430994131152535752> **Utility**\n\<:Xytrix_welc:1430997030096081037> **Welcomer**\n\<:Xytrix_ticket:1430991839422451773> **Ticket**\n\<:Xytrix_selfrole:1430992192079663257> **Reaction Role**\n\<:Xytrix_ai:1430992387110600841> **AI**\n\<:Xytrix_voice:1430992734042329108> **Voice**\n\<:Xytrix_Cusrtomrole:1430998268023930940> **Customrole**\n\<:Xytrix_logging:1430998421996834957> **Logging**\n\<:Xytrix_serveractivity:1430995877325049866> **Server Activity**\n\<:Xytrix_stickymsg:1430993936867917916> **Sticky Message**\n\<:Xytrix_automod:1430995527092404334> **Advance Automod**\n\<:Xytrix_gwy:1430993235064524912> **Giveaway**\n\<:Xytrix_autorespond:1430993728780107776> **Autorespond**\n\<:Xytrix_fun:1430993355403301036> **Fun**
                `,
                false
            )
            // .addField(
            //     '__Extra Modules__',
            //     `
            //     <:voice:1366754308011327578> **Voice**\n<:customrole:1366754284498325597> **Customrole**\n<:logging:1366754293075546192> **Logging**\n<:logging:1366754293075546192> **Server Utility**\n<:logging:1366754293075546192> **Sticky Message**\n<:automod:1366754278772838410> **Automod**\n<:giveway:1366754290181345374> **Giveaway**\n<:autorespond:1366754281230958653> **Autorespond**\n<:fun:1366754286951727236> **Fun**
            //     `,
            //     false
            // )
            .addField(
                'Links',
                `**[Invite](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot) | [Support](https://discord.gg/coredev) **`,
                true
            );

        const helpMessage = await message.channel.send({ embeds: [initialEmbed], components: [new MessageActionRow().addComponents(selectMenu), buttons] });

        const collector = helpMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 120000
        });

        const updateEmbed = (embed, category, commands) => {
            embed.fields = [];
            embed.setDescription(`**${category.charAt(0).toUpperCase() + category.slice(1)} Commands**\n${commands}`);
            return embed;
        };

        collector.on('collect', async (i) => {
            if (i.isButton()) {
                if (i.customId === 'home') {
                    await helpMessage.edit({ embeds: [initialEmbed] });
                    i.deferUpdate();
                } else if (i.customId === 'delete') {
                    await helpMessage.delete();
                    i.deferUpdate();
                }
            } else if (i.isSelectMenu()) {
                const category = i.values[0];
                if (category === 'home') {
                    await helpMessage.edit({ embeds: [initialEmbed] });
                    i.deferUpdate();
                    return;
                }
                let filteredCommands = [];

                switch (category) {
                    case 'antinuke':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'security')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'mod':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'mod')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'info':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'info')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'welcomer':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'welcomer')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'voice':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'voice')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'automod':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'automod')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'customrole':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'customrole')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'logging':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'logging')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'Ticket':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'tic')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'Giveaway':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'give')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'Autorespond':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'autores')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'Fun':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'fun')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'Selfrole':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'rrole')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'AI':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'ai')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'Server Utility':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'serveru')
                            .map(formatCommandWithSubcommands);
                        break;
                    case 'Sticky Message':
                        filteredCommands = client.commands
                            .filter((x) => x.category && x.category === 'sticky')
                            .map(formatCommandWithSubcommands);
                        break;
                }

                const updatedEmbed = updateEmbed(new MessageEmbed(initialEmbed), category, filteredCommands.join(', '));
                await helpMessage.edit({ embeds: [updatedEmbed] });
                i.deferUpdate();
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                selectMenu.setDisabled(true);
                buttons.components.forEach(button => button.setDisabled(true));
                helpMessage.edit({ components: [new MessageActionRow().addComponents(selectMenu), buttons] });
            }
        });

        const otherUserCollector = helpMessage.createMessageComponentCollector({
            filter: (i) => i.user.id !== message.author.id,
            time: 120000
        });

        otherUserCollector.on('collect', async (i) => {
            await i.reply({ content: 'Bro, This is not your interaction.', ephemeral: true });
        });

        setTimeout(async () => {
            selectMenu.setDisabled(true);
            buttons.components.forEach(button => button.setDisabled(true));
            await helpMessage.edit({ components: [new MessageActionRow().addComponents(selectMenu), buttons] });
            await helpMessage.edit({ embeds: [initialEmbed] });
        }, 120000);
    }
};
