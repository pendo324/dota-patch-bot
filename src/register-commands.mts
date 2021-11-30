import * as dotenv from 'dotenv';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

dotenv.config();

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
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
