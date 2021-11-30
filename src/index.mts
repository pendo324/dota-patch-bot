import * as dotenv from 'dotenv';

dotenv.config();

import { Client, Intents } from 'discord.js';
import { createPatchEmbed } from './createPatchEmbed.mjs';
import { scheduleFetch } from './getPatches.mjs';
import { Patch } from './models.mjs';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING
  ]
});

client.on('ready', () => {
  console.log(`Logged in as ${client?.user?.tag}!`);
});

const onNewPatch = async (newPatch: Patch) => {
  for (let [_channelId, channel] of client.channels.cache) {
    if (channel.isText()) {
      const { embed } = await createPatchEmbed({
        patchName: newPatch.patch_name
      });

      channel.send({ embeds: [embed] });
    }
  }
};

const patchData = await scheduleFetch({ onNewPatch });

const latestPatch = patchData.patches.at(-1);

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
  }
});

client.login(process.env.CLIENT_TOKEN);
