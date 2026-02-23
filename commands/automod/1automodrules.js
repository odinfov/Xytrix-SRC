const { MessageEmbed } = require('discord.js');
const AutomodConfig = require('../../models/automodsetup');
const mongoose = require('mongoose');
const config = require('../../config.json')

const automodSetupSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    alertChannelId: { type: String, required: true },
    bypassRoleId: { type: String, required: true },
});

const AutomodSetup = mongoose.model('AutomodSetup', automodSetupSchema);

module.exports = {
    name: 'automodrules',
    aliases: ['amod'],
    cooldown: 30,
    category: 'automod',
    description: 'Setup automod configurations for your server.',
    subcommand:['enable','disable'],
    premium: true,
    run: async (client, message, args) => {
        if (message.guild.memberCount < 0) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Your server must have at least 30 members to use this feature.`
                        )
                ]
            });
        }
        let isSpecialMember = config.boss.includes(message.author.id);
        let own = message.author.id == message.guild.ownerId;
        if (!isSpecialMember) {
            if (!message.member.permissions.has('ADMINISTRATOR')) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} You must have \`Administrator\` permissions to use this command.`
                            )
                    ]
                });
            }
        }

        if (!message.guild.me.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I don't have \`Administrator\` permissions to execute this command.`
                        )
                ]
            });
        }

        if (!isSpecialMember) {
            if (
                !own &&
                message.member.roles.highest.position <=
                message.guild.me.roles.highest.position
            ) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} You must have a higher role than me to use this command.`
                            )
                    ]
                });
            }
        }
        let prefix = '&' || message.guild.prefix;
        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'enable') {
            await enableAutomod(client, message);
        } else if (subcommand === 'disable') {
            await disableAutomod(client, message);
        } else {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Automod Rules') 
                        .setThumbnail(client.user.avatarURL({ dynamic: true }))
                        .setDescription(`**Automod Rules is a powerful tool that helps you manage your server by automatically moderating content and user behavior.**`)
                        .addFields(
                            {
                                name: 'Enable Automod',
                                value: `To enable automod, use: \`${prefix}automodrules enable\``
                            },
                            {
                                name: 'Disable Automod',
                                value: `To disable automod, use: \`${prefix}automodrules disable\``
                            }
                        )
                ]
            });
        }
    }
};

async function enableAutomod(client, message) {
    try {
        let existingSetup = await AutomodSetup.findOne({ guildId: message.guild.id });

        if (existingSetup) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`Automod setup is already enabled for this server.`)
                ]
            });
        }

        const existingRules = await message.guild.autoModerationRules.fetch();
        const maxRules = 9;

        const initialEmbed = new MessageEmbed()
            .setColor(client.color)
            .setTitle('Automod Setup')
            .setDescription('**This will take a few minutes to setup.**');

        const setupMessage = await message.channel.send({ embeds: [initialEmbed] });

        for (const rule of existingRules.values()) {
            try {
                await rule.delete();
                await new Promise(resolve => setTimeout(resolve, 2500));
            } catch (error) {
                console.error(`Failed to delete rule: ${rule.name}`);
            }
        }
        const alertChannel = await message.guild.channels.create('Xytrix - Automod Alerts', {
            type: 'GUILD_TEXT',
            topic: 'Channel for automod alerts',
            permissionOverwrites: [
                {
                    id: message.guild.id,
                    deny: ['SEND_MESSAGES', 'VIEW_CHANNEL']
                }
            ]
        });

        initialEmbed.setDescription(`${initialEmbed.description}\nChannel Created Successfully <#${alertChannel.id}>`);
        await setupMessage.edit({ embeds: [initialEmbed] });

        const bypassRole = await message.guild.roles.create({
            name: 'Xytrix Automod Bypass',
            permissions: []
        });

        initialEmbed.setDescription(`${initialEmbed.description}\nRole Created Successfully <@&${bypassRole.id}>\n`);
        await setupMessage.edit({ embeds: [initialEmbed] });

        const createOrEditRuleWithDelay = async (ruleData) => {
            try {
                await message.guild.autoModerationRules.create(ruleData);
            } catch (error) {
                console.error(`Failed to create rule: ${ruleData.name}, trying to edit existing rule.`, error);
                const existingRule = existingRules.find(rule => rule.eventType === ruleData.eventType && rule.triggerType === ruleData.triggerType);
                if (existingRule) {
                    await existingRule.edit(ruleData);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            initialEmbed.setDescription(`${initialEmbed.description}\n**Automod Rule Created :** ${ruleData.name}`);
            await setupMessage.edit({ embeds: [initialEmbed] });
        };

        const ruleDataArray = [
            {
                name: 'Xytrix | Anti Mass Mention',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 5,
                triggerMetadata: {
                    mentionTotalLimit: 5,
                    mentionSpamRule: true
                },
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: alertChannel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            },
            {
                name: 'Xytrix | Anti Spam',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 3,
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: message.channel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            },
            {
                name: 'Xytrix | Anti Pornography',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 4,
                triggerMetadata: {
                    presets: [1, 2, 3]
                },
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: alertChannel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            },
            {
                name: 'Xytrix | Anti Toxicity',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 1,
                triggerMetadata: {
                    keywordFilter: ['aulad', 'aulad*', 'bakchodi', 'bakchodi*', 'Beti chod', 'Beti chod*', 'Betichod', 'Betichod*', 'Bhadhava', 'Bhadhava*', 'Bhadwe', 'Bhadwe*', 'Bhen ke laude', 'Bhen ke laude*', 'Bhenkelaude', 'Bhenkelaude*', 'bhenkelode', '*bhenkelode*', 'bhosda', '*bhosda*', 'bhosdike', '*bhosdike*', 'bhoshda', '*bhoshda*', 'bhoshdike', '*bhoshdike*', 'bkl', '*bkl*', 'bsdk', '*bsdk*', 'Chinaal', 'Chinaal*', 'Chipkali ke gaand ke pasine', 'Chipkali ke gaand ke pasine*', 'chut', 'chutiya', '*chutiya*', 'chuut', 'fuckoff', '*fuckoff*', 'fuckyou', '*fuckyou*', 'gaand', '*gaand*', 'gaand mein muthi daal', 'gaand mein muthi daal*', 'gaandu', 'gand', '*gand*', 'gandu', '*gandu*', 'gay', 'Hijra', 'Hijra*', 'Jhaant', 'jhaat', '*jhaat*', 'jhaat ke baal', '*jhaat ke baal*', 'Kamina', 'Kamina*', 'Kuttiya', 'Kuttiya*', 'Lauda', 'Lauda*', 'loda', '*loda*', 'lodalele', '*lodalele*', 'lode', '*lode*', '*lodi*', 'lund', '*lund*', 'luund', '*luund*', 'muthi', 'randi', '*randi*', 'randikabacha', '*randikabacha*', 'randike', '*randike*', 'randwa', '*randwa*', 'randwi', 'randwi*', 'rape', '*rape*', 'sax', '*sax*', 'sex', '*sex*', 'tmkc', '*tmkc*', 'lodu', '*lodu*']
                },
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: alertChannel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            },
            {
                name: 'Xytrix | Anti Toxicity 2',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 1,
                triggerMetadata: {
                    keywordFilter: ['bhenkelode', '*bhenkelode*', '*bhosda*', 'bhosdike', '*bhosdike*', 'bhoshda', '*bhoshda*', 'bkl', '*bkl*', 'blowjob', '*blowjob*', 'bsdk', '*bsdk*', 'chut', 'fuck', '*fuck*', 'fuckyou', '*fuckyou*', 'lawdi', '*lawdi*', 'loda', '*loda*', 'maakichut', '*maakichut*', 'madarchod', '*madarchod*', 'bhenchod', 'bhenchod*', 'bhench0d', '*bhenchod*', 'bhenhch0d*', 'madarch0d', 'Nigga', '*Nigga*', 'nuke', 'prune', '*prune*', 'raand', '*raand*', 'rand', '*rand*', 'randi', '*randi*', 'randiya', '*randiya*', 'sax', '*sax*', 'sex', '*sex*', 'terimaakichut', '*terimaakichut*', 'tmkc', '*tmkc*']
                },
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: alertChannel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            },
            {
                name: 'Xytrix | Automod',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 1,
                triggerMetadata: {
                    keywordFilter: ['bkl', 'randi', 'bsdk', 'mkc']
                },
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: alertChannel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            },
            {
                name: 'Xytrix | Anti TOS',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 1,
                triggerMetadata: {
                    keywordFilter: [`-NUS*`, `anal`, `anus`, `anus*`, `ANUS*`, `arse`, `asshat`, `asshat*`, `asshole`, `asshole*`, `b0`, `b1tch`, `b1tch*`,
                    `ballsac`, `ballsac*`, `ballsack`, `ballsack*`, `bct`, `bct*`, `bct.`, `bcta`, `bcta*`, `bdsm`, `bdsm*`, `beastiality`,
                    `beastiality*`, `beefcurtains`, `beefcurtains*`, `biatch`, `biatch*`, `bitch`, `bitch*`, `blowjob`, `blowjob*`, `Blowjob`,
                    `Blowjob*`, `blowjobs`, `blowjobs*`, `bo0b`, `bollock`, `bollock*`, `bollok`, `bollok*`, `boner`, `boner*`, `boob`, `boobs`,
                    `booty`, `booty*`, `Boquete`, `Boquete*`, `BOQUETE*`, `BOSSETA*`, `Brasino`, `buceta`, `buceta*`, `BUCETA*`, `Bucetão`,
                    `Bucetão*`, `bucetinha`, `bucetinha*`, `Bucetuda`, `Bucetuda*`, `Bucetudinha`, `Bucetudinha*`, `bucta`, `bucta*`, `Busseta`,
                    `Busseta*`, `BUSSETA*`, `Buttock`, `Buttock*`, `buttplug`, `buttplug*`, `buzeta`, `buzeta*`, `ceu pau`, `chupo paus`, `clitoris`,
                    `clitoris*`, `cock`, `comendo a tua`, `comendo o teu`, `comendo teu`, `comendo tua`, `comerei a sua`, `comerei o seu`, `comerei sua`,
                    `comi a sua`, `comi o seu`, `comi sua`, `Culhao`, `Culhao*`, `cum`, `cunt`, `cunt*`, `Curalho`, `Curalho*`, `Cuzinho`, `Cuzinho*`,
                    `Cuzuda`, `Cuzuda*`, `CUZUDA*`, `Cuzudo`, `Cuzudo*`, `CUZUDO*`, `da o cu`, `deepthroat`, `deepthroat*`, `dei o cu`, `dick`, `dick*`,
                    `dildo`, `dildov`, `*discord.com/invite*`, `*discord.gg*`, `ecchi`, `ecchi*`, `ejaculate`, `erection`, `erection*`, `f0de`, `f0de*`,
                    `feck`, `feck*`, `felching`, `felching*`, `fellate`, `fellate*`, `fellatio`, `fellatio*`, `fiIho da pta`, `Fiquei ate ereto`, `Fiquei até ereto`,
                    `fodar`, `fodar*`, `fode`, `fode*`, `FODE*`, `foder`, `foder*`, `FODIDA*`, `FORNICA*`, `fuc`, `fuck*`, `fucks`, `fucks*`, `Fucky`,
                    `FUDE¦+O*`, `FUDECAO*`, `FUDENDO*`, `FUDIDA*`, `FUDIDO*`, `g0z@ndo`, `g0z@ndo*`, `g0z@r`, `g0z@r*`, `g0zando`, `g0zando*`, `g0zar`,
                    `g0zar*`, `gemida`, `gemida*`, `genitals`, `genitals*`, `gey`, `gey*`, `gosei`, `gosei*`, `goz@r`, `goz@r*`, `gozando`, `gozando*`,
                    `gozar`, `gozar*`, `Gozei`, `Gozei*`, `horny`, `horny*`, `*https://*`, `Kudasai`, `Kudasai*`, `kys`, `kys*`, `labia`, `labia*`,
                    `M.A.M.A.D.A`, `M.A.M.A.D.A*`, `mama`, `mamado`, `mamado*`, `mamo`, `masterbating`, `masterbating*`, `masturbate`, `masturbate*`,
                    `memama`, `memama*`, `meu penis`, `meu pênis`, `Nadega`, `Nadega*`, `nakedphotos`, `nakedphotos*`, `P-NIS*`, `p0rn`, `P0rn0`, `P0rn0*`,
                    `paugrand`, `paugrand*`, `peituda`, `peituda*`, `pelad0`, `pelad0*`, `PELAD4`, `PELAD4*`, `pen15`, `pen15*`, `pen1s`, `pen1s*`, `penezis`,
                    `penezis*`, `penis`, `piroca`, `piroca*`, `Piroca`, `Piroca*`, `Piroco`, `Piroco*`, `Pirocudo`, `piroquinha`, `piroquinha*`, `piss`, `porn`,
                    `PornHub`, `PornHub*`, `porno`, `pornô`, `pornohug`, `pornohug*`, `pu55y`, `pu55y*`, `PUNHET+O*`, `Punheta`, `Punheta*`, `PUNHETA*`,
                    `PUNHETAO*`, `punheteiro`, `punheteiro*`, `pussy`, `pussy*`, `r@b@`, `r@b@*`, `r@ba`, `r@ba*`, `rab@`, `rab@*`, `raba`, `raba*`,
                    `rape`, `rimjob`, `rimjob*`, `rule34`, `rule34*`, `scat`, `scat*`, `scrotum`, `scrotum*`, `seqsu`, `seqsu*`, `Sequisu`, `Sequisu*`,
                    `seu c`, `seu cu`, `seu pau`, `seu penis`, `seu pênis`, `Sex0`, `Sex0*`, `sexslaves`, `sexslaves*`, `sh1t`, `shemale`, `shemale*`,
                    `smegma`, `smegma*`, `sperm`, `spunk`, `spunk*`, `strap-on`, `strap-on*`, `strapon`, `strapon*`, `stripper`, `stripper*`, `Tesao*`,
                    `testicle`, `testicle*`, `testicules`, `testicules*`, `tetinha`, `tetinha*`, `Tezao`, `Tezao*`, `Tezuda`, `Tezuda*`, `Tezudo`,
                    `Tezudo*`, `throat`, `throat*`, `tits`, `tits*`, `titt`, `titty`, `titty*`, `toma no cu`, `tosser`, `tosser*`, `trannie`, `trannie*`,
                    `trannies`, `trannies*`, `tranny`, `tranny*`, `Transa`, `Transa*`, `tubgirl`, `tubgirl*`, `turd`, `turd*`, `twat`, `twat*`, `vadge`,
                    `vadge*`, `vagane`, `vagane*`, `vagina`, `vagina*`, `vai se foder`, `vai toma no c`, `vai toma no cu`, `vai tomar no`, `você mama`,
                    `wank`, `wank*`, `wanker`, `wanker*`, `whore`, `whore*`, `x-rated`, `x-rated*`, `Xereca*`, `XERERECA*`, `XEXECA*`, `Xota`, `Xota*`,
                    `Xoxota*`, `xVideos`, `xVideos*`, `xVidros`, `xVidros*`, `Yamete`, `Yamete*`, `you mama`, `zoophile`, `zoophile*`]
                },
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: alertChannel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            },
            {
                name: 'Xytrix | Anti Promo',
                creatorId: client.user.id,
                enabled: true,
                eventType: 1,
                triggerType: 1,
                triggerMetadata: {
                    keywordFilter: ['http', 'https', 'discord.gg', 'www', 'discordapp.com', 'invite.gg', 'dsc.gg', 
                    'dsc.link', 'dis.gd', 'disboard.org', 'discord.me', 'bit.ly', 'tinyurl.com', 
                    'goo.gl', 'buff.ly', 'adf.ly', 't.co', 'ow.ly', 'is.gd', 'rebrand.ly', 'cutt.ly', 
                    'shorte.st', 'tiny.cc', 'bl.ink', 't.ly', 'v.gd', 'linktr.ee', 'l.linklyhq.com', 
                    'ziip.co', 'migre.me', 'tr.im', 'pop.li', 'plu.sh', 'su.pr', 'cl.lk', '.com', '*.com*', '*.com'],
                    regexPatterns: ['https:', 'discord\\.gg/', 'gg/', '\\.gg/', 'discordapp.com']
                },
                exemptRoles: [bypassRole.id],
                actions: [
                    {
                        type: 1,
                        metadata: {
                            channel: alertChannel.id,
                            durationSeconds: 10,
                            customMessage: 'This message has been blocked by Xytrix.'
                        }
                    },
                    {
                        type: 2,
                        metadata: {
                            channel: alertChannel.id
                        }
                    }
                ]
            }
        ];

        for (const ruleData of ruleDataArray) {
            await createOrEditRuleWithDelay(ruleData);
        }
        const newSetup = new AutomodSetup({
            guildId: message.guild.id,
            alertChannelId: alertChannel.id,
            bypassRoleId: bypassRole.id,
        });
        await newSetup.save();
        const finalEmbed = new MessageEmbed()
            .setColor(client.color)
            .setTitle('Automod Setup Completed')
            .setDescription(`**The Automod setup is complete. Logs will be sent to** <#${alertChannel.id}>.\n\n**NOTE**: **Users with the <@&${bypassRole.id}> role will be safe from automod rules.**`);

        await setupMessage.edit({ embeds: [finalEmbed] });

    } catch (error) {
        console.error(error);
        message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription('There was an error during the automod setup. Please try again later.')
            ]
        });
    }
}

async function disableAutomod(client, message) {
    try {
        let existingSetup = await AutomodSetup.findOne({ guildId: message.guild.id });

        if (!existingSetup) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`Automod setup is not enabled for this server.`)
                ]
            });
        }

        const alertChannel = message.guild.channels.cache.get(existingSetup.alertChannelId);
        if (alertChannel) {
            await alertChannel.delete();
        }

        const bypassRole = message.guild.roles.cache.get(existingSetup.bypassRoleId);
        if (bypassRole) {
            await bypassRole.delete();
        }

        await AutomodSetup.deleteOne({ guildId: message.guild.id });

        message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(client.color)
                .setDescription(`Automod setup has been disabled and all related data has been removed.`)
            ]
        });

        const rules = await message.guild.autoModerationRules.fetch();
        for (const rule of rules.values()) {
            if (rule.creatorId === client.user.id) {
                await rule.delete();
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }        

    } catch (error) {
        console.error(error);
    }
}
