const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();
client.prefixCommands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const enable_slash = config['enable-slash-command'];
const enabled_prefix = config['enable-prefix-command'];
const prefix = config.prefix || '!';
const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (command.data) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }

    if (command.name) {
        client.prefixCommands.set(command.name, command);
        if (command.aliases) {
            command.aliases.forEach(alias => {
                client.prefixCommands.set(alias, command);
            });
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

async function registercmd() {
    try {
        if (enable_slash) {
            console.log('Registering application (/) commands.');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log('Successfully registered application (/) commands.');
        } else if (!enable_slash) {
            console.log('Disabling all application (/) commands.');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: [] }
            );
            console.log('Successfully removed all application (/) commands.');
        }        
    } catch (error) {

    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    if (!enabled_prefix || message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error while executing this command!');
    }
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

registercmd();

client.login(process.env.TOKEN);
