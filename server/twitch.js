import fs from 'fs';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';

const TOKEN_FILE = './twitch-chat-tokens.json';

let lebronCooldown = false;
let laughCooldown = false;

export async function startTwitch(io, getLebronMode) {
  const authProvider = new RefreshingAuthProvider({
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET
  });

  // Whenever the token refreshes, save the new pair to disk
  authProvider.onRefresh(async (userId, newTokenData) => {
    console.log('Twitch chat token refreshed for', userId);
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(newTokenData, null, 2));
  });

  // Load from saved file if it exists, otherwise fall back to .env for first run
  let tokenData;
  if (fs.existsSync(TOKEN_FILE)) {
    tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    console.log('Loaded saved Twitch chat token from', TOKEN_FILE);
  } else {
    tokenData = {
      accessToken: process.env.TWITCH_USER_ACCESS_TOKEN,
      refreshToken: process.env.TWITCH_USER_REFRESH_TOKEN,
      expiresIn: null,
      obtainmentTimestamp: Date.now()
    };
    console.log('No saved chat token file found, using .env values for first run');
  }

  await authProvider.addUserForToken(
    tokenData,
    ['chat']
  );

  const chatClient = new ChatClient({
    authProvider,
    channels: [process.env.TWITCH_CHANNEL]
  });

  await chatClient.connect();
  console.log('Connected to Twitch');

  chatClient.onMessage((channel, user, text) => {
    if (text.trim() === 'BANG' && getLebronMode() && !lebronCooldown) {
      lebronCooldown = true;
      console.log('Cooldown started, will reset in', 5 * 60 * 1000, 'ms');
      io.emit('twitch:bang');
      setTimeout(() => {
        lebronCooldown = false;
        console.log('Cooldown over');
      }, 5 * 60 * 1000); // 5 minutes
    }
  });

    chatClient.onMessage((channel, user, text) => {
    if (text.trim() === 'LOL' && getLebronMode() && !laughCooldown) {
      laughCooldown = true;
      console.log('Cooldown started, will reset in', 5 * 60 * 1000, 'ms');
      io.emit('twitch:lol');
      setTimeout(() => {
        laughCooldown = false;
        console.log('Cooldown over');
      }, 5 * 60 * 1000); // 5 minutes
    }
  });

  chatClient.onAuthenticationFailure((message) => {
    console.error('Twitch connection error:', message);
  });
}