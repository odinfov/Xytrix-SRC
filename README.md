# 🌌 Xytrix - Premium Discord Bot

Xytrix is a high-performance, feature-rich Discord bot designed to provide top-tier security, moderation, and engagement tools for your community. Built on Discord.js v13, it offers a seamless experience with a focus on reliability and advanced functionality.

---

## 🚀 How to Use

Follow these steps to get your own instance of Xytrix up and running:

### 1. Prerequisites
- **Node.js**: Version 20.0.0 or higher.
- **MongoDB**: A running MongoDB instance or a connection URI from MongoDB Atlas.

### 2. Installation
Clone the repository and install the required dependencies:
```bash
git clone https://github.com/odinfov/Xytrix-SRC.git
cd Xytrix-SRC
npm install
```

### 3. Configuration
Open `config.json` and fill in your bot details:
- `TOKEN`: Your Discord Bot Token.
- `MONGO_DB`: Your MongoDB connection URI.
- `invite`: Your bot's invite link.

### 4. Starting the Bot
Run the following command to start the bot:
```bash
npm start
```

---

## ✨ Features

Xytrix is packed with features to manage and entertain your server:

- **🛡️ Advanced Antinuke**: Industry-leading protection against malicious actions.
- **🤖 AI Integration**: Powerful AI conversations powered by OpenAI (OpenRouter).
- **📝 Logging System**: Comprehensive logs for messages, members, and server updates.
- **🎫 Ticket System**: Efficient support system with interactive buttons.
- **🎉 Giveaways**: Manage server giveaways with ease.
- **🎙️ Voice Utilities**: Generate and manage voice channels dynamically.
- **🛠️ Moderation**: Complete suite of tools including ban, kick, mute, and temp-roles.
- **🎨 Fun & Information**: Variety of commands to keep the server active and informed.

---

## 🔒 Security (Antinuke)

Security is at the heart of Xytrix. Our **Antinuke System** monitors and prevents the following:
- **Mass Actions**: Detects and stops mass bans, kicks, and role/channel deletions.
- **Unauthorized Bots**: Prevents bots from being added by non-authorized users.
- **Webhook Abuse**: Monitors webhook creation and deletion to prevent spam.
- **Everyone Ping Protection**: Filters unauthorized `@everyone` and `@here` mentions.
- **Atomic Rollbacks**: Automatically reverts unauthorized changes to roles and channels.

---

## 👋 Welcomer

The **Welcomer System** is designed to give your new members a warm landing:
- **Custom Embeds**: Personalize welcome messages with server-specific information.
- **Image Welcomes**: (Optional) Use Canvas-powered images to greet members.
- **Automated Roles**: Assign roles to new members instantly upon joining.
- **Invite Tracking**: Detailed information on who invited the new member.

---

## 📂 Project Structure

```text
Xytrix-SRC/
├── commands/           # Command handlers categorized by type
│   ├── antinuke/       # Advanced security commands
│   ├── moderation/     # Standard administrative tools
│   ├── welcomer/       # Greeting system setup
│   └── ...             # Other categories (AI, Fun, Voice, etc.)
├── events/             # Discord event listeners (Message, Join, etc.)
├── models/             # Mongoose schemas for MongoDB
├── structures/         # Core bot classes and utility functions
├── logs/               # Local log files
├── config.json         # Main configuration file
├── index.js            # Entry point for the bot
└── package.json        # Project metadata and dependencies
```

---

## 🤝 Support

If you encounter any issues or have suggestions, feel free to join our support server:
[Join Support Server](https://discord.gg/coredev)

---
*Developed with ❤️ by the Xytrix Team*
