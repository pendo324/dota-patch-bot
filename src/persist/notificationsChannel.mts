import { readFile, writeFile } from 'fs/promises';

import { dirname } from '../util/dirname.mjs';

const notificationChannelFileName = dirname(['../../', 'data', 'notificationChannel.json']);

export interface NotificationChannel {
  channelId: string;
  channelName: string;
}

export interface NotificationChannelProps {
  notificationChannel: NotificationChannel;
}

export interface NotificationChannelOnDisk {
  notificationChannel?: NotificationChannel & { setAt: number };
}

export type NotificationRoleReturn = Partial<NotificationChannelOnDisk>;

export const getNotificationChannel = async (): Promise<NotificationRoleReturn> => {
  try {
    const notificationChannel = JSON.parse(
      await readFile(notificationChannelFileName, 'utf8')
    ) as NotificationChannelOnDisk;
    return notificationChannel;
  } catch {
    return { notificationChannel: undefined };
  }
};

export const setNotificationChannel = async (props: NotificationChannelProps) => {
  const notificationChannel: NotificationChannelOnDisk = {
    notificationChannel: {
      ...props.notificationChannel,
      setAt: Date.now()
    }
  };
  try {
    await writeFile(notificationChannelFileName, JSON.stringify(notificationChannel, null, 2));
  } catch {
    console.log('Failed to write notification channel');
  }
};
