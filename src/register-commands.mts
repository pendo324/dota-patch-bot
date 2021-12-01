import * as dotenv from 'dotenv';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

dotenv.config();

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
  new SlashCommandBuilder()
    .setName('set_channel')
    .setDescription('Set which channel the bot will send patch updates')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Channel to use for patch updates').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('set_notification_role')
    .setDescription('Set which channel the bot will send patch updates')
    .addRoleOption((option) =>
      option.setName('role').setDescription('Role to give users that subscribe to notifications').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('set_notification_emoji')
    .setDescription('Set which emoji reaction will give users the notification role')
    .addStringOption((option) =>
      option
        .setName('emoji')
        .setDescription('Emoji that users should react with to get notifications')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('patchinfo')
    .setDescription('Replies with patch info for a given patch. No patch arg defaults to the latest patch')
    .addStringOption((option) => option.setName('patch_number').setDescription('Enter a patch version'))
].map((command) => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN!);

rest
  .put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.TEST_GUILD_ID!), { body: commands })
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error);
