const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "kill",
    aliases: ["kill"],
    description: "Kill someone.",
    category: "fun",
    cooldown: 5,
    premium: false,
    options: [
        {
            name: "user",
            description: "The user you want to kill.",
            type: 6, 
            required: true,
        }
    ],
    run: async (client, message, args) => {
        let gifs = [
            "https://media.tenor.com/cc1EzfBVr4oAAAAC/yandere-tagged.gif",
            "https://media.tenor.com/1dtHuFICZF4AAAAC/kill-smack.gif",
            "https://media.tenor.com/vK9H3WMBoogAAAAC/hxh-killua.gif",
            "https://media.tenor.com/Ce8ZMfAcjdoAAAAC/anime.gif",
            "https://media.tenor.com/-tA7D6xBOFgAAAAC/death-note-hey.gif",
            "https://media.tenor.com/KfyGv-4RtGYAAAAC/anime-reality.gif",
            "https://media.tenor.com/EWhFGCTfmucAAAAC/akame-ga-kill-akame.gif",
            "https://media.tenor.com/hg3U93keb5gAAAAC/meme-memes.gif",
            "https://media.tenor.com/NbBCakbfZnkAAAAC/die-kill.gif",
            "https://media.tenor.com/q7JfjZaXXzEAAAAC/killua-zoldyck.gif",
            "https://media.tenor.com/Pexs__PHM4kAAAAC/akame-ga-kill-banned.gif",
            "https://media.tenor.com/6NbGvdVqTAIAAAAC/chelsea-akame-ga-kill-akame-ga-kill.gif",
            "https://media.tenor.com/0tyBXHo06U8AAAAC/akame-anime.gif",
            "https://media.tenor.com/0veQOMPIUX8AAAAC/idleglance-amv.gif",
            "https://media.tenor.com/vBSRMaLModkAAAAC/memes-anime-memes.gif",
            "https://media.tenor.com/i0PG6AP1qDgAAAAC/anime-cringe.gif",
            "https://media.tenor.com/_Cn1L2n_QygAAAAC/akame-ga-kill.gif",
            "https://media.tenor.com/rfHmIWma-IEAAAAC/amagi-brilliant-park-kanie-seiya.gif",
            "https://media.tenor.com/MjpCu4kpy2kAAAAC/kon-yui-hirasawa.gif",
            "https://media.tenor.com/7rIJkf8pB2EAAAAC/a-channel-tooru.gif",
            "https://media.tenor.com/znxDSuPFrU4AAAAC/akame-ga-kill-seryu-ubiquitous.gif",
            "https://media.tenor.com/6Gw28Q873_UAAAAC/akame-ga-kill.gif",
            "https://media.tenor.com/GhuOJgPvyuAAAAAC/kanna-wanna-kill-cute.gif",
            "https://media.tenor.com/9zIX6hEV6VIAAAAC/satoru-gojo.gif",
            "https://media.tenor.com/IhuAUHZUdOwAAAAC/tatsumi-baleyette.gif",
            "https://media.tenor.com/SXuQo_hAEOwAAAAC/seryuu-mouth-gun-akame-ga-kill.gif",
            "https://media.tenor.com/VC3EDnfJmKEAAAAC/yandere-eyes.gif",
            "https://media.tenor.com/_08hMhfZZ8AAAAAC/kill-la-kill-sakuga.gif",
            "https://media.tenor.com/KuQaMUPoiUIAAAAC/anime-akame-ga-kill.gif",
            "https://media.tenor.com/fdrZD8naUOAAAAAC/anime-kill.gif",
            "https://media.tenor.com/Ze50E1rW44UAAAAC/akudama-drive.gif",
            "https://media.tenor.com/Ssauo2VG5qYAAAAC/akame-akame-of-demon-sword-murasame.gif",
            "https://media.tenor.com/xQ9HqX1H9tsAAAAC/anime-dies-i-hate-you.gif",
            "https://media.tenor.com/X7AozaaIrNkAAAAC/run-akame-ga-kill-akame-ga-kill.gif",
            "https://media.tenor.com/YtRZgG_rRkwAAAAC/lubbock-akame-ga-kill.gif",
            "https://media.tenor.com/-UbmVOLixPcAAAAC/killing-anime-girl.gif",
            "https://media.tenor.com/jLVdk-K5SrMAAAAC/akame-ga-kill-bols-akame-ga-kill.gif",
            "https://media.tenor.com/7wLQeXyCPkIAAAAC/akame-ga-kill-anime.gif",
            "https://media.tenor.com/OkH4FDtOAmYAAAAC/leone-akame-ga-kill-akame-ga-kill.gif",
            "https://media.tenor.com/k8tMlA3AbeIAAAAC/akame-ga-kill.gif",
        ];
        
        let user = args[0] ? await message.client.users.fetch(args[0].replace(/[<@!>]/g, '')) : null;
        if (!user) return message.reply("Please provide a valid user.");
        if (user.id === message.author.id) return message.reply("You cannot kill yourself.");
        
        let gif = gifs[Math.floor(Math.random() * gifs.length)];
        
        let embed = new MessageEmbed()
            .setDescription(`**${message.author.username} killed ${user.username}**`)
            .setImage(gif)
            .setColor(client.color); 
        
        message.channel.send({ embeds: [embed] });
    }
};
