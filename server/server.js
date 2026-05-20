import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import OBSWebSocket from 'obs-websocket-js';
import dotenv from 'dotenv';
import { startTwitch } from './twitch.js';
import { startRewards } from './rewards.js';

dotenv.config();

const app = express(); //creates Express app
const httpServer = createServer(app); //wraps Express in plain shareable Node server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});                            //the cors part lets it accept connections from any url.
                                

const obs = new OBSWebSocket(); //this is what will actually connect to OBS
let obsConnected = false;       //variable to check/switch if OBS is connected
let obsRetrying = false;        //variable to check if we are already retrying

let lebronMode = false;   //lebron mode variable

async function connectToOBS() { //this connects to OBS
  try {
    await obs.connect(
      process.env.OBS_WS_URL || 'ws://localhost:4455',
      process.env.OBS_PASSWORD || ''
    );
    obsConnected = true;
    obsRetrying = false;
    console.log('Connected to OBS');
    io.emit('obs:status', { connected: true });
  } catch (err) {
    obsConnected = false;
    console.error('OBS connection failed:', err.message);
    if (!obsRetrying) {
      obsRetrying = true;
      setTimeout(() => {
        obsRetrying = false;
        connectToOBS();
      }, 5000);   //wait 5 seconds and run it back
    } 
  }
}

obs.on('ConnectionClosed', () => { //handles disconnection
  obsConnected = false;
  console.log('OBS disconnected');
  io.emit('obs:status', { connected: false });
  if (!obsRetrying) {
    obsRetrying = true;
    setTimeout(() => {
      obsRetrying = false;
      connectToOBS();
    }, 5000);
  }
});
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('obs:status', { connected: obsConnected });
  socket.emit('lebron:state', lebronMode);

  socket.on('lebron:toggle', (value) => {
    lebronMode = value;
    io.emit('lebron:state', lebronMode);
    console.log('Lebron mode:', lebronMode);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

connectToOBS(); //starts the attempt to connect to obs

startTwitch(io, () => lebronMode);    //starts my chat reading which looks for BANG
startRewards(io, app);         //starts my channel point reward monitoring

const PORT = process.env.PORT || 3001; //checks env file or uses port 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);    //starts server upon connection and sends a message
});



