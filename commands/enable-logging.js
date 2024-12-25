const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

module.exports = {
  name: 'enable-logging',
  data: new SlashCommandBuilder()
    .setName('enable-logging')
    .setDescription('Enable logging for actions in the server.'),
  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Error')
              .setDescription('This command cannot be used in DMs.')
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Error')
              .setDescription('You do not have permission to use this command.')
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }

      let config = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }

      config['enabled-logging'] = true;

      let logChannel = interaction.guild.channels.cache.find((c) => c.name === 'logs');
      if (!logChannel) {
        logChannel = await interaction.guild.channels.create({
          name: 'logs',
          type: 0,
          topic: 'Log channel for bot actions',
          reason: 'Logging enabled',
        });
      }

      const webhook = await logChannel.createWebhook({
        name: 'Logging Webhook',
        reason: 'Webhook created for logging',
      });

      config.webhook = webhook.url;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Logging Enabled')
            .setDescription(
              'Logging has been successfully enabled, and a log channel with a webhook has been created.'
            )
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription('There was an issue enabling logging.')
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }
  },
};
