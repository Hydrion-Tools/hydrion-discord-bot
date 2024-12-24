const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'kick',
  aliases: [],
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
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
    const reason = isInteraction
      ? interactionOrMessage.options.getString('reason') || 'No reason provided'
      : args.slice(1).join(' ') || 'No reason provided';

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('Please specify a valid user to kick.')
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

    if (!interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('You do not have permission to use this command.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await member.kick(reason);

      const successEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚪 User Kicked')
        .setDescription(`${user.username} has been kicked.`)
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
          .setColor('#FF0000')
          .setTitle('🚪 User Kicked')
          .setDescription(`${user.username} was kicked by ${requester.id}`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Moderator', value: `User ID: ${requester.username}` }
          )
          .setTimestamp()
          .setFooter({ text: `Bot Made by ${devName}`, iconURL: devAvatar });

        try {
          await axios.post(webhookUrl, {
            username: 'Kick Logger',
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
        .setDescription('There was an error while kicking the user.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
