import * as dotenv from 'dotenv';

import { Client, Intents, TextChannel } from 'discord.js';
import { formatEmoji } from '@discordjs/builders';

dotenv.config();

import { createPatchEmbed } from './createPatchEmbed.mjs';
import { scheduleFetch } from './persist/patches.mjs';
import { Patch } from './models.mjs';

import {
  getNotificationsChannel,
  insertNotificationsChannel,
  getNotificationRole,
  insertNotificationRole,
  getRoleMessage,
  insertRoleMessage,
  getRoleMessageEmoji,
  insertRoleMessageEmoji,
  getAllNotificationsUsers,
  clearNotificationsUsers,
  getNotificationsUser
} from './db/index.mjs';

import { addUserRole, removeUserRole } from './userRoles.mjs';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING
  ]
});

const onNewPatch = async (newPatch: Patch) => {
  const notificationChannel = getNotificationsChannel();

  const { embed } = await createPatchEmbed({
    patchName: newPatch.patch_name,
    shouldMentionRole: true
  });

  if (notificationChannel?.channelId) {
    const channel = client.channels.cache.get(notificationChannel?.channelId);
    if (channel) {
      if (channel.isText()) {
        channel.send({ embeds: [embed] });
      }
    }
  }
};

const patchData = await scheduleFetch({ onNewPatch });

const latestPatch = patchData.patches.at(-1);

client.on('ready', async () => {
  console.log(`Logged in as ${client?.user?.tag}!`);
  const notificationsChannel = getNotificationsChannel();
  const roleMessage = getRoleMessage();
  const roleMessageEmoji = getRoleMessageEmoji();

  if (notificationsChannel?.channelId && roleMessage?.messageId && roleMessageEmoji?.emojiId) {
    const channel = client.channels.cache.get(notificationsChannel?.channelId);
    if (channel) {
      if (channel.isText()) {
        const message = await channel.messages.fetch(roleMessage?.messageId);
        for (const [_reactionId, reaction] of message.reactions.cache) {
          if (reaction.emoji.id === roleMessageEmoji?.emojiId) {
            await reaction.users.fetch();
            const notificationUsers = getAllNotificationsUsers();
            for (const [_userId, user] of reaction.users.cache) {
              const member = await reaction.message.guild?.members.fetch(user);
              if (member && !getNotificationsUser({ id: user.id })) {
                addUserRole(member);
              }
            }
            if (notificationUsers) {
              for (const cachedUser of notificationUsers) {
                const realUser = reaction.users.resolve(cachedUser.userId);
                if (!realUser) {
                  const member = await reaction.message.guild?.members.fetch(cachedUser.userId);
                  if (member) {
                    removeUserRole(member);
                  }
                }
              }
            }
          } else {
            clearNotificationsUsers();
          }
        }
        if (!message.reactions.cache.size) {
          clearNotificationsUsers();
        }
      }
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'patchinfo') {
    const patch = interaction.options.getString('patch_number') ?? latestPatch?.patch_number;
    const matchingPatches = patchData?.patches?.filter((p) => p?.patch_number === patch);
    const remotePatch = matchingPatches.at(0)?.patch_number;
    if (remotePatch) {
      const { embed } = await createPatchEmbed({
        patchName: remotePatch
      });
      await interaction.reply({
        embeds: [embed]
      });
    } else {
      await interaction.reply('Valve API down. Try again later.');
    }
  } else if (commandName === 'set_channel') {
    const patchChannel = interaction.options.getChannel('channel');
    if (patchChannel?.type !== 'GUILD_TEXT') {
      return await interaction.reply({
        ephemeral: true,
        content: 'The channel argument must refer to a text channel.'
      });
    }

    const notificationRole = getNotificationRole();
    if (!notificationRole) {
      return await interaction.reply({
        ephemeral: true,
        content: 'The notification role must be set using the set_role command before using the set_channel command.'
      });
    }

    const notificationRoleEmoji = getRoleMessageEmoji();
    if (!notificationRoleEmoji) {
      return await interaction.reply({
        ephemeral: true,
        content: 'The notification role emoji the set_notification_emoji command before using the set_channel command.'
      });
    }

    insertNotificationsChannel({
      notificationChannel: {
        channelId: patchChannel.id,
        channelName: patchChannel.name
      }
    });

    const channel = client.channels.cache.get(patchChannel.id) as TextChannel;

    await interaction.reply({
      ephemeral: true,
      content: 'Notificaiton channel set. Sending message that will be used to add users to group now.'
    });

    let emojiString;
    if (notificationRoleEmoji?.emojiName) {
      if (notificationRoleEmoji.animated === 1) {
        emojiString = formatEmoji(notificationRoleEmoji.emojiId, true);
      } else {
        emojiString = formatEmoji(notificationRoleEmoji.emojiId, false);
      }
    } else {
      emojiString = notificationRoleEmoji.emojiId;
    }

    const message = await channel.send(`React with ${emojiString} to get notified when a new patch is released.`);

    message.react(notificationRoleEmoji.emojiId);

    insertRoleMessage({
      roleMessage: {
        messageId: message.id
      }
    });
  } else if (commandName === 'set_notification_role') {
    const notificationRole = interaction.options.getRole('role')!;

    insertNotificationRole({
      notificationRole: {
        roleId: notificationRole.id,
        roleName: notificationRole.name
      }
    });

    interaction.reply({ ephemeral: true, content: 'Role set. set_channel command will now work.' });
  } else if (commandName === 'set_notification_emoji') {
    const emojiString = interaction.options.getString('emoji')!;
    const emoteRegex = /<(?<animated>a)?:(?<emojiName>.+):(?<emojiId>\d+)>/;
    const emoteMatches = emojiString.match(emoteRegex);

    const emojiRegex = /(?<emojiId>\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;
    const emojiMatches = emojiString.match(emojiRegex);

    const emoteOrEmoji = emoteMatches ?? emojiMatches;

    if (emoteOrEmoji) {
      const emojiName = emoteOrEmoji?.groups?.['emojiName'] as string | undefined;
      const emojiId = emoteOrEmoji?.groups?.['emojiId'] as string | undefined;
      const animated = emoteOrEmoji?.groups?.['animated'] ? true : false;
      if ((emojiName && emojiId) || (emojiMatches && emojiId)) {
        const emojiString = animated ? formatEmoji(emojiId, true) : formatEmoji(emojiId);
        interaction.reply({
          ephemeral: true,
          content: `Emoji set to ${emojiString}. set_channel command will now work.`
        });
        return insertRoleMessageEmoji({
          roleMessageEmoji: {
            emojiId,
            emojiName,
            animated: animated ? 1 : 0
          }
        });
      }
    }

    interaction.reply({
      ephemeral: true,
      content: 'Unable to set emoji. Did you send an emoji as part of the emoji parameter?'
    });
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  const notificationsChannel = getNotificationsChannel();
  const roleMessage = getRoleMessage();
  const roleMessageEmoji = getRoleMessageEmoji();

  if (notificationsChannel?.channelId && roleMessage?.messageId && roleMessageEmoji?.emojiId && !user.partial) {
    if (
      reaction.message.id === roleMessage.messageId &&
      ((reaction.emoji.id && reaction.emoji.id === roleMessageEmoji?.emojiId) ||
        reaction.emoji.name === roleMessageEmoji?.emojiId) &&
      reaction.message.channelId === notificationsChannel.channelId
    ) {
      const member = await reaction.message.guild?.members.fetch(user);
      if (member) {
        addUserRole(member);
      }
    }
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  const notificationsChannel = getNotificationsChannel();
  const roleMessage = getRoleMessage();
  const roleMessageEmoji = getRoleMessageEmoji();

  if (notificationsChannel?.channelId && roleMessage?.messageId && roleMessageEmoji?.emojiId && !user.partial) {
    if (
      reaction.message.id === roleMessage.messageId &&
      ((reaction.emoji.id && reaction.emoji.id === roleMessageEmoji?.emojiId) ||
        reaction.emoji.name === roleMessageEmoji?.emojiId) &&
      reaction.message.channelId === notificationsChannel.channelId
    ) {
      const member = await reaction.message.guild?.members.fetch(user);
      if (member) {
        removeUserRole(member);
      }
    }
  }
});

client.login(process.env.CLIENT_TOKEN);
