import { GuildMember } from 'discord.js';

import { getNotificationRole, insertNotificationsUser, removeNotificationsUser } from './db/index.mjs';

export const addUserRole = async (member: GuildMember) => {
  const notificationsRole = getNotificationRole();
  if (notificationsRole) {
    member.roles.add(notificationsRole.roleId);
    insertNotificationsUser({ notificationUser: { userId: member.user.id } });
  }
};

export const removeUserRole = async (member: GuildMember) => {
  const notificationsRole = getNotificationRole();
  if (notificationsRole) {
    member.roles.remove(notificationsRole.roleId);
    removeNotificationsUser({ id: member.user.id });
  }
};
