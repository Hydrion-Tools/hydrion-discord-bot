const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'mute',
  aliases: ['silence'],
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user in the server.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the mute')
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
        .setDescription('Please specify a valid user to mute.')
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
      try {
        muteRole = await interactionOrMessage.guild.roles.create({
          name: 'Muted',
          color: '#808080',
          permissions: [],
        });

        interactionOrMessage.guild.channels.cache.forEach(channel => {
          channel.permissionOverwrites.edit(muteRole, {
            SendMessages: false,
            Speak: false,
            AddReactions: false,
          }).catch(console.error);
        });

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🔔 Muted Role Created')
          .setDescription('A "Muted" role has been successfully created and configured.')
          .setTimestamp();
        interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error(error);
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('There was an error creating the "Muted" role.')
          .setTimestamp();
        return interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
      }
    }

    try {
      await member.roles.add(muteRole, reason);

      const successEmbed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle('🔇 User Muted')
        .setDescription(`${user.username} has been muted.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: `Username: ${requester.username}` }
        )
        .setTimestamp();

      const devName = config.devname
      const devAvatar = config.devavatar

      successEmbed.setFooter({ text: `Bot made by ${devName}`, iconURL: devAvatar });

      interactionOrMessage.reply({ embeds: [successEmbed] });

      if (isLoggingEnabled && webhookUrl) {
        const logEmbed = new EmbedBuilder()
          .setColor('#FF4500')
          .setTitle('🔇 User Muted')
          .setDescription(`${user.username} was muted by ${requester.id}`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Moderator', value: `User ID: ${requester.username}` }
          )
          .setTimestamp()
          .setFooter({ text: `Bot Made by ${devName}`, iconURL: devAvatar });

        try {
          await axios.post(webhookUrl, {
            username: 'Mute Logger',
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
        .setDescription('There was an error while muting the user.')
        .setTimestamp();
      interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
