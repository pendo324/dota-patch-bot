import * as dotenv from 'dotenv';

dotenv.config();

import { Client, Intents, TextChannel } from 'discord.js';
import { formatEmoji } from '@discordjs/builders';

import { createPatchEmbed } from './createPatchEmbed.mjs';
import { scheduleFetch } from './persist/patches.mjs';
import { Patch } from './models.mjs';
import { getNotificationChannel, setNotificationChannel } from './persist/notificationsChannel.mjs';
import { getNotificationRole, setNotificationRole } from './persist/notificationRole.mjs';
import { getMessageEmoji, getRoleMessage, setMessageEmoji, setRoleMessage } from './persist/roleMessage.mjs';
import { addUserRole, removeUserRole } from './userRoles.mjs';
import { getNotificationUsers, clearNotificationUsers } from './persist/notificationUsers.mjs';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING
  ]
});

const onNewPatch = async (newPatch: Patch) => {
  const { notificationChannel } = await getNotificationChannel();

  const { embed } = await createPatchEmbed({
    patchName: newPatch.patch_name,
    shouldMentionRole: true
  });

  if (notificationChannel?.channelId) {
    const channel = client.channels.cache.get(notificationChannel.channelId);
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
  const { notificationChannel } = await getNotificationChannel();
  const { roleMessage } = await getRoleMessage();
  const { roleMessageEmoji } = await getMessageEmoji();
  const { notificationUsers } = await getNotificationUsers();

  if (notificationChannel && roleMessageEmoji && roleMessage) {
    const channel = client.channels.cache.get(notificationChannel.channelId);
    if (channel) {
      if (channel.isText()) {
        const message = await channel.messages.fetch(roleMessage.messageId);
        for (const [_reactionId, reaction] of message.reactions.cache) {
          console.log(reaction.emoji.name);
          if (reaction.emoji.id === roleMessageEmoji?.emojiId) {
            await reaction.users.fetch();
            for (const [_userId, user] of reaction.users.cache) {
              const member = await reaction.message.guild?.members.fetch(user);
              if (member) {
                addUserRole(member);
              }
            }
            console.log(notificationUsers);
            if (notificationUsers?.users) {
              for (const cachedUser of notificationUsers?.users) {
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
            await clearNotificationUsers();
          }
        }
        if (!message.reactions.cache.size) {
          await clearNotificationUsers();
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

    const { notificationRole } = await getNotificationRole();
    const { roleMessageEmoji } = await getMessageEmoji();
    if (!notificationRole) {
      return await interaction.reply({
        ephemeral: true,
        content: 'The notification role must be set using the set_role command before using the set_channel command.'
      });
    }

    if (!roleMessageEmoji) {
      return await interaction.reply({
        ephemeral: true,
        content: 'The notification role emoji the set_notification_emoji command before using the set_channel command.'
      });
    }

    await setNotificationChannel({
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

    const message = await channel.send('React with this role to get notified when a new patch is released.');

    await setRoleMessage({
      roleMessage: {
        messageId: message.id
      }
    });
  } else if (commandName === 'set_notification_role') {
    const notificationRole = interaction.options.getRole('role')!;

    await setNotificationRole({
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

    if (emoteMatches) {
      const emojiName = emoteMatches?.groups?.['emojiName'] as string | undefined;
      const emojiId = emoteMatches?.groups?.['emojiId'] as string | undefined;
      const animated = emoteMatches?.groups?.['animated'] ? true : false;
      if (emojiName && emojiId) {
        const emojiString = animated ? formatEmoji(emojiId, true) : formatEmoji(emojiId);
        interaction.reply({
          ephemeral: true,
          content: `Emoji set to ${emojiString}. set_channel command will now work.`
        });
        return await setMessageEmoji({
          roleMessageEmoji: {
            emojiId,
            emojiName
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
  const { notificationChannel } = await getNotificationChannel();
  const { roleMessage } = await getRoleMessage();
  const { roleMessageEmoji } = await getMessageEmoji();

  if (notificationChannel && roleMessageEmoji && roleMessage && !user.partial) {
    if (reaction.message.id === roleMessage?.messageId) {
      if (reaction.emoji.id === roleMessageEmoji?.emojiId) {
        const member = await reaction.message.guild?.members.fetch(user);
        if (member) {
          addUserRole(member);
        }
      }
    }
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  const { notificationChannel } = await getNotificationChannel();
  const { roleMessage } = await getRoleMessage();
  const { roleMessageEmoji } = await getMessageEmoji();

  if (notificationChannel && roleMessageEmoji && roleMessage && !user.partial) {
    if (reaction.message.id === roleMessage?.messageId) {
      if (reaction.emoji.id === roleMessageEmoji?.emojiId) {
        const member = await reaction.message.guild?.members.fetch(user);
        if (member) {
          removeUserRole(member);
        }
      }
    }
  }
});

client.login(process.env.CLIENT_TOKEN);
