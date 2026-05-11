import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import OBSWebSocket from 'obs-websocket-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express(); //creates Express app
const httpServer = createServer(app); //wraps Express in plain shareable Node server
const io = new Server(httpServer, {
  cors: { origin: '*' }           //attaches Socket.io server to the http / express server
});                              //the cors part lets it accept connections from any url.
                                

const obs = new OBSWebSocket(); //this is what will actually connect to OBS
let obsConnected = false;       //variable to check/switch if OBS is connected

async function connectToOBS() { //this connects to OBS
  try {
    await obs.connect(
      process.env.OBS_WS_URL || 'ws://localhost:4455',
      process.env.OBS_PASSWORD || ''
    );
    obsConnected = true;
    console.log('Connected to OBS');
    io.emit('obs:status', { connected: true });
  } catch (err) {
    obsConnected = false;
    console.error('OBS connection failed:', err.message);
    setTimeout(connectToOBS, 5000); //wait 5 seconds and run it back
  }
}

obs.on('ConnectionClosed', () => {  //code handles a succesful disconnection
  obsConnected = false;
  console.log('OBS disconnected');
  io.emit('obs:status', { connected: false });
  setTimeout(connectToOBS, 5000); //then automaticall engages 5 second runback
});

io.on('connection', (socket) => {   //manages client connections, informs status of OBS
  console.log('Client connected:', socket.id);

  socket.emit('obs:status', { connected: obsConnected });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

connectToOBS(); //starts the attempt to connect to obs

const PORT = process.env.PORT || 3001; //checks env file or uses port 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);    //starts server upon connection and sends a message
});