import { readFile, writeFile } from 'fs/promises';

import { dirname } from '../util/dirname.mjs';

const notificationUserFileName = dirname(['../../', 'data', 'notificationUser.json']);

export interface BaseNotificationUser {
  userId: string;
}

export interface NotificationUserProp {
  notificationUser: BaseNotificationUser;
}

export interface NotificationUser extends BaseNotificationUser {
  addedAt: number;
}

export interface NotificationUsersOnDisk {
  notificationUsers?: {
    users: Array<NotificationUser>;
    setAt: number;
  };
}

export type NotificationUsersReturn = Partial<NotificationUsersOnDisk>;

export const getNotificationUsers = async (): Promise<NotificationUsersReturn> => {
  try {
    const notificationUser = JSON.parse(await readFile(notificationUserFileName, 'utf8')) as NotificationUsersOnDisk;
    return notificationUser;
  } catch {
    return { notificationUsers: undefined };
  }
};

export const addNotificationUser = async (props: NotificationUserProp) => {
  const { notificationUsers } = await getNotificationUsers();
  const now = Date.now();
  const notificationUser: NotificationUsersOnDisk = {
    notificationUsers: {
      users: [
        ...(notificationUsers?.users ? notificationUsers.users : []),
        { ...props.notificationUser, addedAt: now }
      ],
      setAt: now
    }
  };
  try {
    await writeFile(notificationUserFileName, JSON.stringify(notificationUser, null, 2));
  } catch {
    console.log('Failed to write notification users');
  }
};

export const removeNotificationUser = async (props: NotificationUserProp) => {
  const { notificationUsers } = await getNotificationUsers();
  const now = Date.now();
  const newNotificationUsers = notificationUsers?.users?.filter(
    (notificationUser) => notificationUser?.userId !== props.notificationUser.userId
  );
  const notificationUser: NotificationUsersOnDisk = {
    notificationUsers: {
      users: newNotificationUsers ?? [],
      setAt: now
    }
  };
  try {
    await writeFile(notificationUserFileName, JSON.stringify(notificationUser, null, 2));
  } catch {
    console.log('Failed to write notification users');
  }
};

export const clearNotificationUsers = async () => {
  try {
    await writeFile(notificationUserFileName, JSON.stringify({ notificationUsers: [], setAt: Date.now() }, null, 2));
  } catch {
    console.log('Failed to write notification users');
  }
};
