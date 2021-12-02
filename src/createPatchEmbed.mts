import * as axios from 'axios';
import { MessageEmbed } from 'discord.js';
import { roleMention, time } from '@discordjs/builders';

import { PatchInfo } from './models.mjs';
import { getNotificationRole } from './db/index.mjs';

const patchUrlPrefix = `https://www.dota2.com/datafeed/patchnotes?version=`;

export interface CreatePatchEmbedProps {
  patchName: string;
  shouldMentionRole?: boolean;
}

export interface CreatePatchReturnWarning {
  problem: string;
  hint: string;
}

export interface CreatePatchReturn {
  embed: MessageEmbed;
  warnings?: CreatePatchReturnWarning[];
}

export const createPatchEmbed = async ({
  patchName,
  shouldMentionRole
}: CreatePatchEmbedProps): Promise<CreatePatchReturn> => {
  const patchRes = await axios.default.get(`${patchUrlPrefix}${patchName}`);
  const patchInfo = patchRes.data as PatchInfo;

  const warnings: CreatePatchReturnWarning[] = [];

  const patchDate = new Date(patchInfo.patch_timestamp * 1000);

  const embed = new MessageEmbed()
    .setTitle(`Patch ${patchName}`)
    .setURL(`https://www.dota2.com/patches/${patchName}`)
    .addFields(
      { name: 'General updates', value: `${patchInfo?.generic?.length ?? 0}`, inline: false },
      { name: 'Item updates', value: `${patchInfo?.items?.length ?? 0}`, inline: false },
      { name: 'Hero updates', value: `${patchInfo?.heroes?.length ?? 0}`, inline: false },
      { name: 'Release date', value: time(patchDate), inline: false }
    );

  if (shouldMentionRole) {
    const notificationRole = await getNotificationRole();
    if (notificationRole?.roleId) {
      embed.setAuthor(roleMention(notificationRole.roleId));
    }
  }

  return {
    embed,
    warnings
  };
};
