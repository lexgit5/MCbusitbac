import tmi from 'tmi.js';

let lebronCooldown = false;

export function startTwitch(io, getLebronMode) {
  const twitchClient = new tmi.Client({
    options: { debug: true },
    connection: {
      reconnect: true,
      secure: true
    },
    identity: {
      username: process.env.TWITCH_CHANNEL,
      password: process.env.TWITCH_TOKEN
    },
    channels: [process.env.TWITCH_CHANNEL]
  });

  twitchClient.connect()
    .then(() => console.log('Connected to Twitch'))
    .catch(err => console.error('Twitch connection error:', err));

  twitchClient.on('message', (channel, tags, message, self) => {
    if (message.trim() === 'BANG' && getLebronMode() && !lebronCooldown) {
      lebronCooldown = true;
      console.log('Cooldown started, will reset in', 5 * 60 * 1000, 'ms');
      io.emit('twitch:bang');
      setTimeout(() => {
        lebronCooldown = false;
        console.log('Cooldown over');
      }, 5 * 60 * 1000); // 5 minutes
    }
  });
}