// server.js

const express       = require('express');
const WebSocket     = require('ws');
const SocketServer  = WebSocket.Server;
const uuidV4        = require('uuid/v4');
const escapeHtml    = require('escape-html');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

let userCount = 0;
// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected')
  userCount++

  const userColour = assignRandomColor();

  broadcastUserCount()

  ws.on('message', function incoming(message) {
    message = JSON.parse(message)
    message.id = uuidV4()

    switch (message.type) {
      case "postMessage":
        processMessage(message, userColour)
        break
      case "postNotification":
        processNotification(message)
        break
    }

    wss.clients.forEach( (c) => {
      if (c.readyState === WebSocket.OPEN) {

        c.send(JSON.stringify(message));
      }
    })

  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected')
    userCount--
    broadcastUserCount()
  });
});

function broadcastUserCount() {
  wss.clients.forEach( (c) => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify({type: "userCount", content: userCount}));
    }
  })
}

const colours = ['#0f08e5', '#905a09', '#7a0789', '#a50e3a', '#ef6548', 'red']
function assignRandomColor() {
  return colours[Math.floor(Math.random()*colours.length)]
}

function processMessage( message, userColour ) {
  message.type = "incomingMessage"
  message.colour = userColour
  message.content = escapeHtml(message.content)
  message.content = message.content.replace(/http:\/\/\S*.\w\w{1,2}\/\S*\.(jpg|jpeg|png|gif|gifv)/g, '<img class="chat-image" src="$&">')
}

function processNotification( message ) {
  message.type = "incomingNotification"
}