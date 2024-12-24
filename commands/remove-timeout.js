const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'removetimeout',
  aliases: ['rto', 'untimeout'],
  data: new SlashCommandBuilder()
    .setName('removetimeout')
    .setDescription('Remove the timeout of a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove timeout from')
        .setRequired(true)
    ),
  async execute(interactionOrMessage, args = []) {
    const config = require('../config.json');
    const isLoggingEnabled = config['enabled-logging'];
    const webhookUrl = config.webhook;

    if (!interactionOrMessage.guild) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('This command cannot be used in DMs.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    const isInteraction = !!interactionOrMessage.isCommand;
    const user = isInteraction
      ? interactionOrMessage.options.getUser('user')
      : interactionOrMessage.mentions.users.first();

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('Please specify a valid user to remove timeout from.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    const member = interactionOrMessage.guild.members.cache.get(user.id);
    if (!member) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('User is not in this server.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    const requester = interactionOrMessage.user || interactionOrMessage.author;
    if (!requester || !requester.id) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('Unable to determine the moderator.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    if (!interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('You do not have permission to use this command.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    if (!member.isCommunicationDisabled()) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('User is not in timeout.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await member.timeout(null);

      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Timeout Removed')
        .setDescription(`${user.username} has been removed from timeout.`)
        .addFields(
          { name: 'Moderator', value: `Username: ${requester.username}` }
        )
        .setTimestamp();

      const devName = config.devname;
      const devAvatar = config.devavatar;

      successEmbed.setFooter({ text: `Bot made by ${devName}`, iconURL: devAvatar });

      interactionOrMessage.reply({ embeds: [successEmbed] });

      if (isLoggingEnabled && webhookUrl) {
        const logEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Timeout Removed')
          .setDescription(`${user.username} was removed from timeout by ${requester.id}`)
          .addFields(
            { name: 'Moderator', value: `User ID: ${requester.username}` }
          )
          .setTimestamp()
          .setFooter({ text: `Bot Made by ${devName}`, iconURL: devAvatar });

        try {
          await axios.post(webhookUrl, {
            username: 'Timeout Logger',
            embeds: [logEmbed.toJSON()],
          });
        } catch (error) {
          console.error('Error sending log to webhook:', error);
        }
      }
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('There was an error while removing the timeout from the user.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
