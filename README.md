# dota-patch-bot

## Status

This bot is in heavy development and currently doesn't do much. It still needs a mechanism to add itself to channels, and to tag users with roles.

## Adding to server

Add bot using this URL: https://discord.com/api/oauth2/authorize?client_id=914938531133149254&permissions=395405682768&scope=bot%20applications.commands

## Running with Docker
```
sudo docker run -d --restart unless-stopped \
--name dota-patch-bot \
-e CLIENT_ID=<YOUR_CLIENT_ID> \
-e CLIENT_TOKEN=<YOUR_CLIENT_TOKEN> \
-v <PATH/TO/YOUR/DATA/DIR>:/usr/src/app/data/ \
ghcr.io/pendo324/dota-patch-bot
```

# Developing

### Installing packages

1. `npm install`
2. `npm run dev-server`

### Pushing new commands to test server

Locally (`TEST_GUILD_ID` must be set in your environment!):
`npm run register-test-commands`

Globally:
`npm run register-global-commands`
