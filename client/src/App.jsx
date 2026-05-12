import { useEffect, useState } from 'react';  //stores data, runs code on component load
import { io } from 'socket.io-client';        //imports Socket client to connect to node server
import Switch from '@mui/material/Switch';    //awesome switch

const socket = io(import.meta.env.VITE_SERVER_URL, { //reads URL from my .env file
  extraHeaders: {
    'ngrok-skip-browser-warning': 'true'
  }
});  

function App() {
  const [serverConnected, setServerConnected] = useState(false); // are we connected to the server
  const [obsConnected, setObsConnected] = useState(false);       // are we connected to OBS

  const [lebronMode, setLebronMode] = useState(false);           // is lebron mode on

  useEffect(() => {
    
    socket.on('connect', () => setServerConnected(true));        // fires when we connect/disconnect to server
    socket.on('disconnect', () => setServerConnected(false));
    socket.on('obs:status', ({ connected }) => setObsConnected(connected));   //updates status accordingly
    socket.on('lebron:state', (value) => setLebronMode(value));

    socket.on('twitch:bang', () => {
      const audio = new Audio('/lebraudio.mp3');
      audio.play()
        .catch(err => console.error('Audio error:', err));
    });

    return () => {    //removes listeners when we unload the component
      socket.off('connect');
      socket.off('disconnect');
      socket.off('obs:status');
      socket.off('twitch:bang'); //lebron thing
      socket.off('lebron:state');
    };
  }, []);

  return (  //this will show up on screen
    <div>
      <div>
        <p>Server: {serverConnected ? 'Connected' : 'Disconnected'}</p>
        <p>OBS: {obsConnected ? 'Connected' : 'Disconnected'}</p>
        <br />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
        <p style={{paddingTop: '6px', paddingLeft: '12.5px'}}>Lebron Mode</p>
        <Switch 
          checked={lebronMode}
          onChange={(e) => socket.emit('lebron:toggle', e.target.checked)}
        />
      </div>
    </div>
  );

}

export default App;   //renders App