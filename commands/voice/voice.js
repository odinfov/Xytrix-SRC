const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'voice',
    category: 'voice',
    aliases: ['vc'],
    description: 'Shows all the voice commands.',
    premium: false,
    run: async (client, message, args) => {
        const embed = new MessageEmbed()
            .setColor(client.color)
            .setTitle('Voice Commands')
            .addFields(
                { name: '`join2create`', value: '**Setup the join to create voice channel system.**' },
                { name: '`vcban`', value: '**Ban a user from conecting to voice channel.**' },
                { name: '`vcunban`', value: '**UnBan a user from conecting to voice channel.**' },
                { name: '`vcunbanall`', value: '**UnBan all user from conecting to voice channel.**' },
                { name: '`vcban list`', value: '**Shows banned users from voice channels.**' },
                { name: '`vcmute`', value: '**Mutes a user in the voice channel.**' },
                { name: '`vcunmute`', value: '**Unmutes a user in the voice channel.**' },
                { name: '`vcmuteall`', value: '**Mutes all the users in the voice channel.**' },
                { name: '`vcunmuteall`', value: '**Unmutes all the users in the voice channel.**' },
                { name: '`vcdeafen`', value: '**Deafens a user in voice channel.**' },
                { name: '`vcundeafen`', value: '**Undeafens a user in voice channel.**' },
                { name: '`vcdeafenall`', value: '**Deafen all users in voice channel.**' },
                { name: '`vcundeafenall`', value: '**Undeafen all the users in the voice channel.**' },
                { name: '`vckick`', value: '**Disconnects a user from voice channel.**' },
                { name: '`vckickall`', value: '**Disconnects all the users in the voice channel.**' },
                { name: '`vcmove`', value: '**Moves a user from one voice channel to another.**' },
                { name: '`vcmoveall`', value: '**Moves all users from one voice channel to another.**' },
                { name: '`vclist`', value: '**Shows the members list connected to voice channel.**' },
                { name: '`vcrole`', value: '**Manage auto role on VC join and removes it on leave.**'}
            )
            .setTimestamp();

        if (!args.length) {
            return message.channel.send({ embeds: [embed] });
        }
    }
};
