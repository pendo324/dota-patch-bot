import Database from 'better-sqlite3';
import type { Database as IDatabase, Statement as IStatement } from 'better-sqlite3';
import { dirname } from '../util/dirname.mjs';

const databaseFileName = dirname(['../../', 'data', 'db.sqlite3']);
export const db: IDatabase = new Database(databaseFileName);

const createNotificationRolesTableStatement = `create table if not exists notification_roles('roleId' varchar, 'roleName' varchar);`;
const createNotificationChannelsTableStatement = `create table if not exists notification_channels('channelId' varchar, 'channelName' varchar);`;
const createNotificationUsersTableStatement = `create table if not exists notification_users('userId' varchar);`;
const createRoleMessageTableStatement = `create table if not exists role_message('messageId' varchar);`;
const createRoleMessageEmojiTableStatement = `create table if not exists role_message_emoji('emojiId' varchar, 'emojiName' varchar, 'animated' boolean);`;

db.exec(createNotificationRolesTableStatement);
db.exec(createNotificationChannelsTableStatement);
db.exec(createNotificationUsersTableStatement);
db.exec(createRoleMessageTableStatement);
db.exec(createRoleMessageEmojiTableStatement);

export interface IdQueryProps {
  id?: string;
}

export interface NotificationRole {
  roleId: string;
  roleName: string;
}

export interface NotificationRoleProps {
  notificationRole: NotificationRole;
}

export const insertNotificationRole = (props: NotificationRoleProps) => {
  const query: IStatement = db.prepare('insert into notification_roles (roleId, roleName) values (@roleId, @roleName)');

  const res = query.run({ ...props.notificationRole });
  if (res.changes) {
    return;
  }
  throw 'Notification role could not be inserted.';
};

export const getNotificationRole = (props?: IdQueryProps): NotificationRole | undefined => {
  const queryById: IStatement = db.prepare('select roleId, roleName from notification_roles where roleId = @id');
  const queryFirst: IStatement = db.prepare('select roleId, roleName from notification_roles limit 1');

  if (props?.id) {
    const res = queryById.get({ id: props?.id });
    return res as NotificationRole;
  }
  const res = queryFirst.get();
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
    'insert into notification_channels (channelId, channelName) values (@channelId, @channelName)'
  );

  const res = query.run({ ...props.notificationChannel });
  if (res.changes) {
    return;
  }
  throw 'Notification role could not be inserted.';
};

export const getNotificationsChannel = (props?: IdQueryProps): NotificationChannel | undefined => {
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

export interface NotificationUser {
  userId: string;
}

export interface NotificationUserProp {
  notificationUser: NotificationUser;
}

export const insertNotificationsUser = (props: NotificationUserProp) => {
  const query: IStatement = db.prepare('insert into notification_users (userId) values (@userId)');

  const res = query.run({ ...props.notificationUser });
  if (res.changes) {
    return;
  }
  throw 'Notification role could not be inserted.';
};

export const clearNotificationsUsers = () => {
  const query: IStatement = db.prepare('delete from notification_users');
  query.run();
};

export const getAllNotificationsUsers = (): NotificationUser[] | undefined => {
  const query: IStatement = db.prepare('select userId from notification_users');

  const res = query.all();
  return res as NotificationUser[];
};

export const getNotificationsUser = ({ id }: IdQueryProps): NotificationUser | undefined => {
  const queryById: IStatement = db.prepare('select userId from notification_users where userId = @id');

  const res = queryById.get({ id });
  return res as NotificationUser;
};

export const removeNotificationsUser = ({ id }: IdQueryProps) => {
  const query: IStatement = db.prepare('delete from notification_users where userId = @id');

  const res = query.run({ id });
  if (res.changes) {
    return;
  }
  throw 'Notification user could not be removed.';
};

export interface RoleMessage {
  messageId: string;
}

export interface RoleMessageProps {
  roleMessage: RoleMessage;
}

export const insertRoleMessage = (props: RoleMessageProps) => {
  const query: IStatement = db.prepare('insert into role_message (messageId) values (@messageId)');

  const res = query.run({ ...props.roleMessage });
  if (res.changes) {
    return;
  }
  throw 'Notification role message could not be inserted.';
};

export const getRoleMessage = (props?: IdQueryProps): RoleMessage | undefined => {
  const queryById: IStatement = db.prepare('select messageId from role_message where messageId = @id');
  const queryFirst: IStatement = db.prepare('select messageId from role_message limit 1');

  if (props?.id) {
    const res = queryById.get({ id: props?.id });
    return res as RoleMessage;
  }
  const res = queryFirst.get();
  return res as RoleMessage;
};

export interface RoleMessageEmoji {
  emojiId: string;
  emojiName?: string;
  animated: number;
}

export interface RoleMessageEmojiProps {
  roleMessageEmoji: RoleMessageEmoji;
}

export const insertRoleMessageEmoji = (props: RoleMessageEmojiProps) => {
  const query: IStatement = db.prepare(
    'insert into role_message_emoji (emojiId, emojiName, animated) values (@emojiId, @emojiName, @animated)'
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

export const getRoleMessageEmoji = (props?: IdQueryProps): RoleMessageEmoji | undefined => {
  const queryById: IStatement = db.prepare(
    'select emojiId, emojiName, animated from role_message_emoji where emojiId = @id'
  );
  const queryFirst: IStatement = db.prepare('select emojiId, emojiName, animated from role_message_emoji limit 1');

  if (props?.id) {
    const res = queryById.get({ id: props?.id });
    return res as RoleMessageEmoji;
  }
  const res = queryFirst.get();
  return res as RoleMessageEmoji;
};
