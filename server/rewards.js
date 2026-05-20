import { AppTokenAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubMiddleware } from '@twurple/eventsub-http';

export function startRewards(io, app) {
  const authProvider = new AppTokenAuthProvider(
      process.env.TWITCH_CLIENT_ID,
      process.env.TWITCH_CLIENT_SECRET
  );

  const apiClient = new ApiClient({ authProvider });    //provide said passwords to twitch

  const middleware = new EventSubMiddleware({
    apiClient,
    hostName: 'boots-lantern-sculpture.ngrok-free.dev',
    pathPrefix: '/twitch',
    secret: 'supersecret123'
  });

  middleware.apply(app);

  middleware.onChannelRedemptionAdd(process.env.TWITCH_USER_ID, (event) => {
    console.log('Redemption:', event.rewardTitle);
    if (event.rewardTitle === 'Laugh Track') {
      io.emit('reward:laugh');
    } else if (event.rewardTitle === 'Boo') {
      io.emit('reward:boo');
    }
  });

  middleware.markAsReady();
  console.log('Rewards listener started');
}