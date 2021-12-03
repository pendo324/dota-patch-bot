import Database from 'better-sqlite3';
import type { Database as IDatabase, Statement as IStatement } from 'better-sqlite3';
import { dirname } from '../util/dirname.mjs';

const databaseFileName = dirname(['../../', 'data', 'db.sqlite3']);
export const db: IDatabase = new Database(databaseFileName);

const createNotificationRolesTableStatement = `create table if not exists notification_roles('roleId' varchar, 'roleName' varchar, 'channelId' varchar, unique('roleId', 'channelId'));`;
const createNotificationChannelsTableStatement = `create table if not exists notification_channels('channelId' varchar, 'channelName' varchar);`;
const createRoleMessageTableStatement = `create table if not exists role_message('messageId' varchar, 'channelId' varchar, unique('messageId', 'channelId'));`;
const createRoleMessageEmojiTableStatement = `create table if not exists role_message_emoji('emojiId' varchar, 'emojiName' varchar, 'animated' boolean, 'messageId' varchar, unique('emojiId', 'messageId'));`;

db.exec(createNotificationRolesTableStatement);
db.exec(createNotificationChannelsTableStatement);
db.exec(createRoleMessageTableStatement);
db.exec(createRoleMessageEmojiTableStatement);

export interface GetWithId {
  id?: string;
}

export interface GetWithMessageId {
  id?: string;
  messageId: string;
}

export type GetWithChannelId = {
  id?: string;
  channelId: string;
};

export interface NotificationRole {
  roleId: string;
  roleName: string;
  channelId: string;
}

export interface NotificationRoleProps {
  notificationRole: NotificationRole;
}

export const insertNotificationRole = (props: NotificationRoleProps) => {
  const query: IStatement = db.prepare(
    `insert into notification_roles (roleId, roleName, channelId)
    values (@roleId, @roleName, @channelId)
    on conflict (roleId, channelId)
    do update set roleId = @roleId, roleName = @roleName`
  );

  const res = query.run({ ...props.notificationRole });
  if (res.changes) {
    return;
  }
  throw 'Notification role could not be inserted.';
};

export const getNotificationRole = (props: GetWithChannelId): NotificationRole | undefined => {
  const queryById: IStatement = db.prepare(
    'select roleId, roleName, channelId from notification_roles where roleId = @id and channelId = @channelId'
  );
  const queryFirst: IStatement = db.prepare(
    'select roleId, roleName from notification_roles where channelId = @channelId limit 1'
  );

  if (props?.id) {
    const res = queryById.get({ id: props?.id, channelId: props.channelId });
    return res as NotificationRole;
  }
  const res = queryFirst.get({ channelId: props?.channelId });
  return res as NotificationRole;
};

export interface NotificationChannel {
  channelId: string;
  channelName: string;
}

export interface NotificationChannelProps {
  notificationChannel: NotificationChannel;
}

export const insertNotificationsChannel = (props: NotificationChannelProps) => {
  const query: IStatement = db.prepare(
    `insert into notification_channels (channelId, channelName)
    values (@channelId, @channelName)`
  );

  const res = query.run({ ...props.notificationChannel });
  if (res.changes) {
    return;
  }
  throw 'Notification role could not be inserted.';
};

export const getNotificationsChannel = (props?: GetWithChannelId): NotificationChannel | undefined => {
  const queryById: IStatement = db.prepare(
    'select channelId, channelName from notification_channels where channelId = @id'
  );
  const queryFirst: IStatement = db.prepare('select channelId, channelName from notification_channels limit 1');

  if (props?.id) {
    const res = queryById.get({ channelId: props?.id });
    return res as NotificationChannel;
  }
  const res = queryFirst.get();
  return res as NotificationChannel;
};

export const getAllNotificationsChannels = (): NotificationChannel[] => {
  const queryAll: IStatement = db.prepare('select channelId, channelName from notification_channels');

  return queryAll.all() as NotificationChannel[];
};

export interface RoleMessage {
  messageId: string;
  channelId: string;
}

export interface RoleMessageProps {
  roleMessage: RoleMessage;
}

export const insertRoleMessage = (props: RoleMessageProps) => {
  const query: IStatement = db.prepare(
    `insert into role_message (messageId, channelId)
    values (@messageId, @channelId)
    on conflict (messageId, channelId)
    do update set messageId = @messageId`
  );

  const res = query.run({ ...props.roleMessage });
  if (res.changes) {
    return;
  }
  throw 'Notification role message could not be inserted.';
};

export const getRoleMessage = (props: GetWithChannelId): RoleMessage => {
  const queryById: IStatement = db.prepare(
    'select messageId, channelId from role_message where messageId = @id and channelId = @channelId'
  );
  const queryFirst: IStatement = db.prepare(
    'select messageId, channelId from role_message where channelId = @channelId limit 1'
  );

  if (props?.id) {
    const res = queryById.get({ id: props?.id, channelId: props?.channelId });
    return res as RoleMessage;
  }
  const res = queryFirst.get({ channelId: props?.channelId });
  return res as RoleMessage;
};

export interface RoleMessageEmoji {
  emojiId: string;
  emojiName?: string;
  animated: number;
  messageId: string;
}

export interface RoleMessageEmojiProps {
  roleMessageEmoji: RoleMessageEmoji;
}

export const insertRoleMessageEmoji = (props: RoleMessageEmojiProps) => {
  const query: IStatement = db.prepare(
    `insert into role_message_emoji (emojiId, emojiName, animated, messageId)
    values (@emojiId, @emojiName, @animated, @messageId)
    on conflict (emojiId, messageId)
    do update set emojiId = @emojiId, emojiName = @emojiName, animated = @animated`
  );

  const res = query.run({
    ...props.roleMessageEmoji,
    ...(props.roleMessageEmoji?.emojiName ? { emojiName: props.roleMessageEmoji.emojiName } : { emojiName: null })
  });
  if (res.changes) {
    return;
  }
  throw 'Notification role emoji could not be inserted.';
};

export const getRoleMessageEmoji = (props: GetWithMessageId): RoleMessageEmoji | undefined => {
  const queryById: IStatement = db.prepare(
    'select emojiId, emojiName, animated, messageId from role_message_emoji where emojiId = @id and messageId = @messageId'
  );
  const queryFirst: IStatement = db.prepare(
    'select emojiId, emojiName, animated, messageId from role_message_emoji where messageId = @messageId limit 1'
  );

  if (props?.id) {
    const res = queryById.get({ id: props?.id, messageId: props.messageId });
    return res as RoleMessageEmoji;
  }
  const res = queryFirst.get({ messageId: props.messageId });
  return res as RoleMessageEmoji;
};
