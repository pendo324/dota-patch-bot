import { GuildMember } from 'discord.js';

import { getNotificationsChannel, getNotificationRole, NotificationChannel } from './db/index.mjs';

export const addUserRole = async (member: GuildMember, notificationsChannel: NotificationChannel) => {
  const notificationsRole = getNotificationRole({ channelId: notificationsChannel.channelId });
  if (notificationsRole) {
    member.roles.add(notificationsRole.roleId);
  }
  // insertNotificationsUser({ notificationUser: { userId: member.user.id } });
};

export const removeUserRole = async (member: GuildMember, notificationsChannel: NotificationChannel) => {
  const notificationsRole = getNotificationRole({ channelId: notificationsChannel.channelId });
  if (notificationsRole) {
    member.roles.remove(notificationsRole.roleId);
  }
  // removeNotificationsUser({ id: member.user.id });
};
