const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');  // Update this path

module.exports = {
  name: 'enable-logging',
  data: new SlashCommandBuilder()
    .setName('enable-logging')
    .setDescription('Enable logging for actions in the server.'),
  async execute(interaction) {
    try {
      const config = require(configPath);

      // Ensure the command is run in a guild
      if (!interaction.guild) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('This command cannot be used in DMs.')
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check if the user has the necessary permissions
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('You do not have permission to use this command.')
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Enable logging
      config['enabled-logging'] = true;

      // Create a logs channel if it doesn't exist
      let logChannel = interaction.guild.channels.cache.find(c => c.name === 'logs');
      if (!logChannel) {
        logChannel = await interaction.guild.channels.create({
          name: 'logs',
          type: 0,  // Use the integer value for GUILD_TEXT channel type
          topic: 'Log channel for bot actions',
          reason: 'Logging enabled',
        });
      }

      // Create the webhook in the logs channel
      const webhook = await logChannel.createWebhook('Logging Webhook', {
        reason: 'Webhook created for logging',
      });

      // Update config with webhook URL and enable logging
      config.webhook = webhook.url;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Send success embed
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Logging Enabled')
        .setDescription('Logging has been successfully enabled and a log channel has been created.')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('There was an issue enabling logging.')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
