import { GuildMember } from 'discord.js';

import { getNotificationRole } from './persist/notificationRole.mjs';
import { addNotificationUser, removeNotificationUser } from './persist/notificationUsers.mjs';

export const addUserRole = async (member: GuildMember) => {
  const { notificationRole } = await getNotificationRole();
  if (notificationRole?.roleId) {
    member.roles.add(notificationRole.roleId);
    addNotificationUser({ notificationUser: { userId: member.user.id } });
  }
};

export const removeUserRole = async (member: GuildMember) => {
  const { notificationRole } = await getNotificationRole();
  if (notificationRole?.roleId) {
    member.roles.remove(notificationRole.roleId);
    removeNotificationUser({ notificationUser: { userId: member.user.id } });
  }
};
