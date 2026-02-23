const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'profile',
    aliases: ['badge', 'badges', 'achievement', 'pr'],
    category: 'info',
    description: `Displays badges for members.`,
    premium: false,
    run: async (client, message, args) => {
        if (args[0] && args[0].match(/<@!?(\d+)>/) && args[0].match(/<@!?(\d+)>/)[1] === client.user.id) {
            args.shift();
        }
        let userMention = message.mentions.users.first();
        let userId = args[0];
        if (userMention && userMention.id === client.user.id && message.mentions.users.size > 1) {
            userMention = Array.from(message.mentions.users.values())[1];
        }

        const user = userMention ||
            (userId ? await client.users.fetch(userId).catch(() => null) : null) ||
            message.author;

        const proxy4hide = user.id === '354455090888835073';
        const invictioscan = user.id === '354455090888835073';
        const ofcdev = user.id === '354455090888835073';
        let badges = '';

        const guild = await client.guilds.fetch('1421887452330594337');

        const sus = await guild.members.fetch(user.id).catch((e) => {
            badges = '`No Badge Available`';
        });

        if (proxy4hide) {
            badges += `\n**[Proxy](https://discord.com/users/354455090888835073)**`;
        }

        if (invictioscan) {
            badges += `\n**[Invicti](https://discord.com/users/354455090888835073)**`;
        }

        if (ofcdev.py) {
            badges += `\n**[Devraj](https://discord.com/users/354455090888835073)**`;
        }

        try {
            if (sus.roles.cache.has('1429487441487593655')) {
                badges += `\n<a:OWNER:1427601740060164151>・**Owner**`;
            }

            if (sus.roles.cache.has('1429539936306200607')) {
                badges += `\n<:GIRL_OWNER:1434995175859687535>・**Girl Owner**`;
            }

            if (sus.roles.cache.has('1429490356357042326')) {
                badges += `\n<:developer:1426877748718206986>・**Developer**`;
            }

            if (sus.roles.cache.has('1429493266063032352')) {
                badges += `\n<a:Xytrix_Core_team_badges:1431359892228276295>・**Core Team**`;
            }

            if (sus.roles.cache.has('1429494019486126250')) {
                badges += `\n<a:admin:1431360135816544327>・**Admin**`;
            }

            if (sus.roles.cache.has('1429544648015216801')) {
                badges += `\n<:Xytrix_staffmanager:1431360397113561332>・**Manager**`;
            }

            if (sus.roles.cache.has('1431358781396090900')) {
                badges += `\n<:Xytrix_supporters:1431360592991490229>・**Support Team**`;
            }

            if (sus.roles.cache.has('1429547603866943719')) {
                badges += `\n<a:Xytrix_bughunter:1431360791181004912>・**Bug Hunter**`;
            }

            if (sus.roles.cache.has('1429493816074698973')) {
                badges += `\n<:CC_staff:1431361014066315334>・**Staff**`;
            }

            if (sus.roles.cache.has('1429493942931689623')) {
                badges += `\n<:cm_VIP:1434996356644339876>・**Vip**`;
            }

            if (sus.roles.cache.has('1429493779194183771')) {
                badges += `\n<a:supporters:1431361486801866833>・**Supporter**`;
            }

            if (sus.roles.cache.has('1429493902880014617')) {
                badges += `\n<a:premium:1431362024591589437>・**Premium User**`;
            }

            if (sus.roles.cache.has('1429548333181177886')) {
                badges += `\n<:friends_handshake:1431362120166932541>・**Friends**`;
            }

            if (sus.roles.cache.has('1429547119575957704')) {
                badges += `\n<:Orbitron_noprefix:1431372038907629663>・**No Prefix User**`;
            }

            if (sus.roles.cache.has('1424046783738286201')) {
                badges += `\n<:Xytrix_Members:1431362300798828797>・**Members**`;
            }
        } catch (err) {
            badges = badges || '`No Badge Available`\n[Join support to get badages](https://discord.gg/3xjw8snjnB)`';
        }

        const pr = new MessageEmbed()
            .setAuthor(
                'Profile Overview',
                client.user.displayAvatarURL({ dynamic: true })
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(client.color)
            .setTimestamp()
            .setDescription(`**BADGES** <a:Xytrix_boost:1431296205035540542>\n${badges || '`No Badge Available`\n[Join support to get badages](https://discord.gg/3xjw8snjnB)'}`);

        message.channel.send({ embeds: [pr] });
    }
};
