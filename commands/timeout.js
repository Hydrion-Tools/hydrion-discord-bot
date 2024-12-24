const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'timeout',
  aliases: ['stfu', 'to'],
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user in the server.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('The duration of the timeout in seconds')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false)
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
    const duration = isInteraction
      ? interactionOrMessage.options.getInteger('duration')
      : args[1];
    const reason = isInteraction
      ? interactionOrMessage.options.getString('reason') || 'No reason provided'
      : args.slice(2).join(' ') || 'No reason provided';

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('Please specify a valid user to timeout.')
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

    const timeoutDuration = duration * 1000; // Convert to milliseconds
    try {
      await member.timeout(timeoutDuration, reason);

      const successEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('⏳ User Timed Out')
        .setDescription(`${user.username} has been timed out for ${duration} seconds.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: `Username: ${requester.username}` }
        )
        .setTimestamp();

      const devName = config.devname;
      const devAvatar = config.devavatar;

      successEmbed.setFooter({ text: `Bot made by ${devName}`, iconURL: devAvatar });

      interactionOrMessage.reply({ embeds: [successEmbed] });

      if (isLoggingEnabled && webhookUrl) {
        const logEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('⏳ User Timed Out')
          .setDescription(`${user.username} was timed out by ${requester.id}`)
          .addFields(
            { name: 'Reason', value: reason },
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
        .setDescription('There was an error while timing out the user.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
