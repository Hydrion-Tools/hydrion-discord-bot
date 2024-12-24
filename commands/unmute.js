const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'unmute',
  aliases: ['speak'],
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user in the server.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
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
        .setDescription('Please specify a valid user to unmute.')
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

    let muteRole = interactionOrMessage.guild.roles.cache.find(role => role.name === 'Muted');
    if (!muteRole) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('Muted role not found.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await member.roles.remove(muteRole);

      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔊 User Unmuted')
        .setDescription(`${user.username} has been unmuted.`)
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
          .setTitle('🔊 User Unmuted')
          .setDescription(`${user.username} was unmuted by ${requester.id}`)
          .addFields(
            { name: 'Moderator', value: `User ID: ${requester.username}` }
          )
          .setTimestamp()
          .setFooter({ text: `Bot Made by ${devName}`, iconURL: devAvatar });

        try {
          await axios.post(webhookUrl, {
            username: 'Unmute Logger',
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
        .setDescription('There was an error while unmuting the user.')
        .setTimestamp();
      return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
