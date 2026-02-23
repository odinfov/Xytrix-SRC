const { Client, Collection, Intents, WebhookClient, ShardClientUtil } = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
const Utils = require('./util');
const { Database } = require('quickmongo');
const axios = require('axios');
const Sweepers = require('./Sweepers');
const { QuickDB } = require('quick.db');

module.exports = class Xytrix extends Client {
    constructor() {
        super({
            intents: 3276543,
            fetchAllMembers: false,
            shards: 'auto',
            disableEveryone: true,
            allowedMentions: {
                parse: ['users'],
            }
        });

        this.config = require(`${process.cwd()}/config.json`);
        this.logger = require('./logger');
        this.commands = new Collection();
        this.categories = fs.readdirSync('./commands/');
        this.emoji = {
            tick: '<:Xytrix_yes:1430998886494896240>',
            cross: '<:Xytrix_no:1430998925308858369>',
            dot: '<a:Xytrix_dot:1431006158549684247>'
        };
        this.util = new Utils(this);
        this.Sweeper = new Sweepers(this);
        this.color = `0x000000`;
        this.support = `https://discord.gg/3xjw8snjnB`;
        this.cooldowns = new Collection();
        this.snek = require('axios');
        this.ratelimit = new WebhookClient({
            url: 'https://discord.com/api/webhooks/1435683759402778839/fzp6kclcbFtTLlgQvTAC1ZbsTZzAumvaDY5kg_C5ActapHcm0KMxXhMl6ZC1S9NpClPF'
        });
        this.error = new WebhookClient({
            url: 'https://discord.com/api/webhooks/1435684079461990400/qpbbyfMthegP35qzirieycS7bR20_n0wlHgKuS0-Bdd62YQ5Js2mGqy8-jFu7ds0GeYB'
        });

        this.errorHandling();
        this.rateLimitHandling();
    }

    // shardConfig() {
    //     const totalShards = this.shard?.count ?? 1;
    //     this.totalClusters = totalShards * 5;

    //     this.clusters = Array.from({ length: totalShards }, (_, shardIndex) => ({
    //         id: shardIndex,
    //         clusters: Array.from({ length: 5 }, (_, clusterIndex) => {
    //             const clusterId = shardIndex * 5 + clusterIndex;
    //             return {
    //                 id: clusterId,
    //                 servers: []
    //             };
    //         }).filter(cluster => cluster.id < this.totalClusters)
    //     }));
    //     this.on('ready', () => {
    //         this.guilds.cache.forEach(guild => {
    //             const shardId = guild.shardId;
    //             const clusterIndex = guild.id % 5;
    //             const cluster = this.clusters.find(c => c.id === shardId);
    //             if (cluster) {
    //                 cluster.clusters[clusterIndex].servers.push(guild.id);
    //             }
    //         });

    //         this.logger.log(`Total Shards: ${totalShards}, Total Clusters: ${this.totalClusters}`, 'shard');
    //         this.logger.log(`Cluster configuration: ${JSON.stringify(this.clusters, null, 2)}`, 'shard');
    //     });
    // }


    errorHandling() {
        this.on('error', (error) => {
            this.error.send(`\`\`\`js\n${error.stack}\`\`\``);
        });
        process.on('unhandledRejection', (error) => {
            this.error.send(`\`\`\`js\n${error.stack}\`\`\``);
        });
        process.on('uncaughtException', (error) => {
            this.error.send(`\`\`\`js\n${error.stack}\`\`\``);
        });
        process.on('warning', (warn) => {
            this.error.send(`\`\`\`js\n${warn}\`\`\``);
        });
        process.on('uncaughtExceptionMonitor', (err, origin) => {
            this.error.send(`\`\`\`js\n${err},${origin}\`\`\``);
        });
    }

    rateLimitHandling() {
        this.on('rateLimit', (info) => {
            let messageContent = `\`\`\`js\nTimeout: ${info.timeout},\nLimit: ${info.limit},\nMethod: ${info.method},\nPath: ${info.path},\nRoute: ${info.route},\nGlobal: ${info.global}\`\`\``;

            if (info.global) {
                messageContent = `@everyone\n${messageContent}`;
            }

            this.ratelimit.send({
                content: messageContent
            });
        });
    }

    async initializedata() {
        this.data = new QuickDB();
        this.logger.log(`Connecting to Sql...`);
        this.logger.log('Sql Database Connected', 'ready');
    }

    async initializeSecondMongoose() {
        this.secondDb = new Database(this.config.MONGO_DB1);
        this.secondDb.connect();
        this.secondDb = mongoose.createConnection(this.config.MONGO_DB1, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        this.logger.log('Second MongoDB Connected', 'ready');
    }

    async initializeMongoose() {
        this.db = new Database(this.config.MONGO_DB);
        this.db.connect();
        this.logger.log(`Connecting to MongoDb...`);
        mongoose.connect(this.config.MONGO_DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 20000,
            socketTimeoutMS: 45000,
        });
        this.logger.log('Mongoose Database Connected', 'ready');
        await this.initializeSecondMongoose();
    }

    async loadEvents() {
        const eventFiles = fs.readdirSync('./events/').filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            try {
                const event = require(`${process.cwd()}/events/${file}`);
                console.log(`Loading event file: ${file}`);
                console.log(`Event type: ${typeof event}`);

                if (typeof event === 'function') {
                    await event(this);
                    this.logger.log(`Loaded Event ${file}.`, 'event');
                } else {
                    console.error(`Event file ${file} does not export a function`);
                }
            } catch (error) {
                console.error(`Error loading event file ${file}:`, error);
            }
        }
    }

    async loadlogs() {
        fs.readdirSync('./logs/').forEach((file) => {
            let logevent = file.split('.')[0];
            require(`${process.cwd()}/logs/${file}`)(this);
            this.logger.log(`Updated Logs ${logevent}.`, 'event');
        });
    }

    async loadMain() {
        const commandFiles = [];

        const commandDirectories = fs.readdirSync(`${process.cwd()}/commands`);

        for (const directory of commandDirectories) {
            const files = fs
                .readdirSync(`${process.cwd()}/commands/${directory}`)
                .filter((file) => file.endsWith('.js'));

            for (const file of files) {
                commandFiles.push(
                    `${process.cwd()}/commands/${directory}/${file}`
                );
            }
        }

        commandFiles.map((value) => {
            const file = require(value);
            const splitted = value.split('/');
            const directory = splitted[splitted.length - 2];
            if (file.name) {
                const properties = { directory, ...file };
                this.commands.set(file.name, properties);
            }
        });

        const getCommandCounts = () => {
            let actualCommands = 0;
            let totalCommands = 0;

            this.commands.forEach(cmd => {
                actualCommands += 1;
                totalCommands += 1;
                if (cmd.subcommand && Array.isArray(cmd.subcommand)) {
                    totalCommands += cmd.subcommand.length;
                }
            });

            return { actualCommands, totalCommands };
        };

        const { actualCommands, totalCommands } = getCommandCounts();
        this.logger.log(`Total Commands ${actualCommands} Commands.`, 'cmd');
        this.logger.log(`Updated ${totalCommands} Commands.`, 'cmd');
    }
}
