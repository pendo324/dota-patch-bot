import { readFile, writeFile } from 'fs/promises';

import { dirname } from '../util/dirname.mjs';

const notificationRoleFileName = dirname(['../../', 'data', 'notificationRole.json']);

export interface NotificationRole {
  roleId: string;
  roleName: string;
}

export interface NotificationRoleProps {
  notificationRole: NotificationRole;
}

export interface NotificationRoleOnDisk {
  notificationRole?: NotificationRole & { setAt: number };
}

export type NotificationRoleReturn = Partial<NotificationRoleOnDisk>;

export const getNotificationRole = async (): Promise<NotificationRoleReturn> => {
  try {
    const notificationRole = JSON.parse(await readFile(notificationRoleFileName, 'utf8')) as NotificationRoleOnDisk;
    return notificationRole;
  } catch {
    return { notificationRole: undefined };
  }
};

export const setNotificationRole = async (props: NotificationRoleProps) => {
  const notificationRole: NotificationRoleOnDisk = {
    notificationRole: {
      ...props.notificationRole,
      setAt: Date.now()
    }
  };
  try {
    await writeFile(notificationRoleFileName, JSON.stringify(notificationRole, null, 2));
  } catch {
    console.log('Failed to write notification role');
  }
};
