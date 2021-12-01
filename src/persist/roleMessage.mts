import { readFile, writeFile } from 'fs/promises';

import { dirname } from '../util/dirname.mjs';

const roleMessageFileName = dirname(['../../', 'data', 'roleMessage.json']);
const roleMessageEmojiFileName = dirname(['../../', 'data', 'roleMessageEmoji.json']);

export interface RoleMessage {
  messageId: string;
}

export interface RoleMessageProps {
  roleMessage: RoleMessage;
}

export interface RoleMessageOnDisk {
  roleMessage?: RoleMessage & { setAt: number };
}

export type RoleMessageReturn = Partial<RoleMessageOnDisk>;

export const getRoleMessage = async (): Promise<RoleMessageReturn> => {
  try {
    const roleMessage = JSON.parse(await readFile(roleMessageFileName, 'utf8')) as RoleMessageOnDisk;
    return roleMessage;
  } catch {
    return { roleMessage: undefined };
  }
};

export const setRoleMessage = async (props: RoleMessageProps) => {
  const roleMessage: RoleMessageOnDisk = {
    roleMessage: {
      ...props.roleMessage,
      setAt: Date.now()
    }
  };
  try {
    await writeFile(roleMessageFileName, JSON.stringify(roleMessage, null, 2));
  } catch {
    console.log('Failed to write role message');
  }
};

export interface RoleMessageEmoji {
  emojiId: string;
  emojiName: string;
}

export interface RoleMessageEmojiProps {
  roleMessageEmoji: RoleMessageEmoji;
}

export interface RoleMessageEmojiOnDisk {
  roleMessageEmoji?: RoleMessageEmoji & { setAt: number };
}

export type RoleMessageEmojiReturn = Partial<RoleMessageEmojiOnDisk>;

export const getMessageEmoji = async (): Promise<RoleMessageEmojiReturn> => {
  try {
    const roleMessage = JSON.parse(await readFile(roleMessageEmojiFileName, 'utf8')) as RoleMessageEmojiReturn;
    return roleMessage;
  } catch {
    return { roleMessageEmoji: undefined };
  }
};

export const setMessageEmoji = async (props: RoleMessageEmojiProps) => {
  const roleMessage: RoleMessageEmojiOnDisk = {
    roleMessageEmoji: {
      ...props.roleMessageEmoji,
      setAt: Date.now()
    }
  };
  try {
    await writeFile(roleMessageEmojiFileName, JSON.stringify(roleMessage, null, 2));
  } catch {
    console.log('Failed to write role message emoji');
  }
};
