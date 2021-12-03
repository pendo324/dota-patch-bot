import * as dotenv from 'dotenv';

import { Client, Intents } from 'discord.js';
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
  getAllNotificationsChannels
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

const latestPatch = patchData?.patches.at(-1);

client.on('ready', async () => {
  console.log(`Logged in as ${client?.user?.tag}!`);
  const notificationsChannels = getAllNotificationsChannels();
  for (const notificationsChannel of notificationsChannels) {
    const { channelId } = notificationsChannel;
    if (channelId) {
      const roleMessage = getRoleMessage({ channelId });

      if (roleMessage?.messageId) {
        const roleMessageEmoji = getRoleMessageEmoji({ messageId: roleMessage.messageId });
        const notificationsRole = getNotificationRole({ channelId });
        if (channelId && roleMessage?.messageId && roleMessageEmoji?.emojiId && notificationsRole?.roleId) {
          const channel = client.channels.cache.get(channelId);
          if (channel) {
            if (channel.isText()) {
              const message = await channel.messages.fetch(roleMessage?.messageId);

              for (let [_reactionId, reaction] of message.reactions.cache) {
                if (reaction.emoji.id === roleMessageEmoji.emojiId) {
                  const reactionUsers = await reaction.users.fetch();
                  for (let [_userId, user] of reactionUsers) {
                    const member = await reaction.message.guild?.members.fetch(user.id);
                    if (member) {
                      addUserRole(member, notificationsChannel);
                    }
                  }
                }
              }
            }
          }
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
    const remotePatch = matchingPatches?.at(0)?.patch_number;
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
  } else if (commandName === 'create_notification') {
    const patchChannel = interaction.options.getChannel('channel')!;
    const notificationRole = interaction.options.getRole('role')!;

    if (patchChannel?.type !== 'GUILD_TEXT' || !patchChannel.isText()) {
      return await interaction.reply({
        ephemeral: true,
        content: 'The channel argument must refer to a text channel.'
      });
    }

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
        let emojiString;
        if (emojiName) {
          if (animated) {
            emojiString = formatEmoji(emojiId, true);
          } else {
            emojiString = formatEmoji(emojiId, false);
          }
        } else {
          emojiString = emojiId;
        }

        interaction.reply({
          ephemeral: true,
          content: 'New notification created. Message sent to channel.'
        });

        const message = await patchChannel.send(
          `React with ${emojiString} to get notified when a new patch is released.`
        );

        message.react(emojiId);

        insertNotificationRole({
          notificationRole: {
            roleId: notificationRole.id,
            roleName: notificationRole.name,
            channelId: patchChannel.id
          }
        });

        insertNotificationsChannel({
          notificationChannel: {
            channelId: patchChannel.id,
            channelName: patchChannel.name
          }
        });

        insertRoleMessage({
          roleMessage: {
            messageId: message.id,
            channelId: message.channel.id
          }
        });

        return insertRoleMessageEmoji({
          roleMessageEmoji: {
            emojiId,
            emojiName,
            animated: animated ? 1 : 0,
            messageId: message.id
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
  const channel = reaction.message.channel;
  if (channel?.type === 'GUILD_TEXT' && channel.isText()) {
    const roleMessage = getRoleMessage({ channelId: reaction.message.channel.id });
    if (roleMessage?.channelId) {
      const roleMessageEmoji = getRoleMessageEmoji({ messageId: roleMessage.messageId });
      if (
        !user.partial &&
        reaction.message.id === roleMessage.messageId &&
        ((reaction.emoji.id && reaction.emoji.id === roleMessageEmoji?.emojiId) ||
          reaction.emoji.name === roleMessageEmoji?.emojiId) &&
        reaction.message.channelId === reaction.message.channel.id
      ) {
        const member = await reaction.message.guild?.members.fetch(user);
        if (member) {
          addUserRole(member, { channelId: roleMessage.channelId, channelName: channel.name });
        }
      }
    }
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  const channel = reaction.message.channel;
  if (channel?.type === 'GUILD_TEXT' && channel.isText()) {
    const roleMessage = getRoleMessage({ channelId: reaction.message.channel.id });
    if (roleMessage?.channelId) {
      const roleMessageEmoji = getRoleMessageEmoji({ messageId: roleMessage.messageId });
      if (
        !user.partial &&
        reaction.message.id === roleMessage.messageId &&
        ((reaction.emoji.id && reaction.emoji.id === roleMessageEmoji?.emojiId) ||
          reaction.emoji.name === roleMessageEmoji?.emojiId) &&
        reaction.message.channelId === reaction.message.channel.id
      ) {
        const member = await reaction.message.guild?.members.fetch(user);
        if (member) {
          removeUserRole(member, { channelId: roleMessage.channelId, channelName: channel.name });
        }
      }
    }
  }
});

client.login(process.env.CLIENT_TOKEN);
