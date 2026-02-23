const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const os = require("os");

module.exports = {
  name: "stats",
  category: "info",
  aliases: ["botinfo", "bi", "st"],
  description: "Displays information about the bot.",
  premium: false,
  run: async (client, message, args) => {
    const uptime = Math.round(client.uptime / 1000);

    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    let guildsCount = client.guilds.cache.size;
    let totalMembers = client.guilds.cache.reduce(
      (x, y) => x + y.memberCount,
      0
    );

    let memberDisplay = totalMembers;
    if (memberDisplay >= 1000 && memberDisplay < 1000000)
      memberDisplay = (memberDisplay / 1000).toFixed(1) + "k";
    else if (memberDisplay >= 1000000)
      memberDisplay = (memberDisplay / 1000000).toFixed(1) + "m";

    const totalUsers = client.users.cache.size;
    const latency = client.ws.ping;

    const memoryUsage = process.memoryUsage();
    const usedRAM = memoryUsage.rss / (1024 * 1024); // MB
    const totalRAM = os.totalmem() / (1024 * 1024 * 1024); // GB
    const freeRAM = os.freemem() / (1024 * 1024 * 1024); // GB

    const cpuUsage = process.cpuUsage();
    const totalCPUUsage = (cpuUsage.user + cpuUsage.system) / 1000000;
    const cpuPercent = (totalCPUUsage / (uptime || 1) * 100).toFixed(2);

    const platform = os.platform();
    const arch = os.arch();
    const cpuCount = os.cpus().length;

    const getTotalCommandCount = () => {
      let total = 0;
      client.commands.forEach((cmd) => {
        total += 1;
        if (cmd.subcommand && Array.isArray(cmd.subcommand)) {
          total += cmd.subcommand.length;
        }
      });
      return total;
    };

    const totalCommands = getTotalCommandCount();

    const embedGeneral = new MessageEmbed()
      .setAuthor({
        name: `${client.user.username} Information`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("General Information")
      .setColor(client.color || "#5865F2")
      .addField(
        "Client",
        `
Guilds: ${guildsCount}
Users: ${memberDisplay} (${totalUsers} Cached)
Latency: ${latency} ms
Online Since: ${days}d ${hours}h ${minutes}m ${seconds}s
Total Commands: ${totalCommands}
Shard Id: 1`,
        false
      )
      .addField(
        "System",
        `
Memory: ${usedRAM.toFixed(2)} MB
CPU Usage: ${cpuPercent}%
Platform: ${platform} (${arch})`,
        false
      )
      .setFooter({
        text: `Requested By ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });

    const embedTeam = new MessageEmbed()
      .setAuthor({
        name: `${client.user.username} Information`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("Team Information")
      .setColor(client.color || "#5865F2")
      .addFields(
        {
          name: " Owners",
          value: `<:blank:1431364543573135372><a:Xytrix_Owner:1431012278781870192> - [ 𝑷𝒓𝒐𝒙𝒚 </>](https://discord.com/users/354455090888835073)\n<:blank:1431364543573135372><a:Xytrix_Owner:1431012278781870192> - [ 𝗜𝗻𝘃𝗶𝗰𝘁𝗶 ?](https://discord.com/users/354455090888835073)`,
          inline: false,
        },
        {
          name: " Developer",
          value: `<:blank:1431364543573135372><a:Xytrix_Developer:1431012603710406847> [ 𝑫𝒆𝒗𝒓𝒂𝒋 </>](https://discord.com/users/354455090888835073)`,
          inline: false,
        }
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({
        text: `Requested By ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });

    const systemInfoButton = new MessageButton()
      .setCustomId("system_info")
      .setLabel("General Info")
      .setStyle("SECONDARY");

    const teamInfoButton = new MessageButton()
      .setCustomId("team_info")
      .setLabel("Team Info")
      .setStyle("SECONDARY");

    const row = new MessageActionRow().addComponents(
      systemInfoButton,
      teamInfoButton
    );

    const msg = await message.channel.send({
      embeds: [embedGeneral],
      components: [row],
    });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "system_info") {
        await interaction.update({ embeds: [embedGeneral], components: [row] });
      } else if (interaction.customId === "team_info") {
        await interaction.update({ embeds: [embedTeam], components: [row] });
      }
    });

    collector.on("end", () => {
      row.components.forEach((component) => component.setDisabled(true));
      msg.edit({ components: [row] });
    });
  },
};