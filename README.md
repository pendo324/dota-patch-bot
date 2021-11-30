# dota-patch-bot

## Status

This bot is in heavy development and currently doesn't do much. It still needs a mechanism to add itself to channels, and to tag users with roles.

## Adding to server

Add bot using this URL: https://discord.com/api/oauth2/authorize?client_id=914938531133149254&permissions=395405682768&scope=bot%20applications.commands

# Developing

### Installing packages

1. `npm install --legacy-peer-deps` (`--legacy-peer-deps` is because of using `typescript@next`)
2. `npm run dev-server`

### Pushing new commands to test server

`npm run register-commands`
