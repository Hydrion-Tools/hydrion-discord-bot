const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');  // Update this path

module.exports = {
  name: 'disable-logging',
  data: new SlashCommandBuilder()
    .setName('disable-logging')
    .setDescription('Disable logging for actions in the server.'),
  async execute(interactionOrMessage) {
    try {
      const config = require(configPath);

      if (!interactionOrMessage.guild) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('This command cannot be used in DMs.')
          .setTimestamp();
        return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
      }

      if (!interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('You do not have permission to use this command.')
          .setTimestamp();
        return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
      }

      // Disable logging
      config['enabled-logging'] = false;
      config.webhook = null;  // Clear the webhook URL in the config

      // Write to config.json
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Find and delete the logs channel and webhook
      const logChannel = interactionOrMessage.guild.channels.cache.find(c => c.name === 'logs');
      if (logChannel) {
        const webhooks = await logChannel.fetchWebhooks();
        const webhook = webhooks.first(); // Assuming only one webhook is created
        if (webhook) {
          await webhook.delete('Logging disabled');  // Delete the webhook
        }
        await logChannel.delete('Logging disabled');  // Delete the channel
      }

      // Send success embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('✅ Logging Disabled')
        .setDescription('Logging has been successfully disabled, and the log channel has been deleted.')
        .setTimestamp();
      interactionOrMessage.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('There was an issue disabling logging.')
        .setTimestamp();
      interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
