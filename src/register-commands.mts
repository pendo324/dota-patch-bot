import * as dotenv from 'dotenv';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

dotenv.config();

let registerLocal = true;
if (process.argv.length) {
  if (process.argv[2] === '--mode') {
    if (process.argv[3] === 'global') {
      registerLocal = false;
    }
  }
}

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
  new SlashCommandBuilder()
    .setName('create_patch_notification')
    .setDescription('Set which emoji reaction will give users the notification role')
    .addStringOption((option) =>
      option
        .setName('emoji')
        .setDescription('Emoji that users should react with to get notifications')
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName('role').setDescription('Role to give users that subscribe to notifications').setRequired(true)
    )
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Channel to use for patch updates').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('patchinfo')
    .setDescription('Replies with patch info for a given patch. No patch arg defaults to the latest patch')
    .addStringOption((option) => option.setName('patch_number').setDescription('Enter a patch version'))
].map((command) => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN!);

if (registerLocal) {
  rest
    .put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.TEST_GUILD_ID!), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
} else {
  rest
    .put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: commands })
    .then(() => console.log('Successfully registered global application commands.'))
    .catch(console.error);
}
