const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

module.exports = {
  name: 'disable-logging',
  data: new SlashCommandBuilder()
    .setName('disable-logging')
    .setDescription('Disable logging for actions in the server.'),
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

      config['enabled-logging'] = false;
      config.webhook = null;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const logChannel = interaction.guild.channels.cache.find((c) => c.name === 'logs');
      if (logChannel) {
        const webhooks = await logChannel.fetchWebhooks();
        const webhook = webhooks.first();
        if (webhook) {
          await webhook.delete('Logging disabled');
        }
        await logChannel.delete('Logging disabled');
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('✅ Logging Disabled')
            .setDescription('Logging has been successfully disabled, and the log channel has been deleted.')
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
            .setDescription('There was an issue disabling logging.')
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }
  },
};
