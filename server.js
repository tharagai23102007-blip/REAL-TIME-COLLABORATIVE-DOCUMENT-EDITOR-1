const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const documentState = {
  content: '',
  bold: false,
  italic: false,
  underline: false
};

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', document: documentState });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.join('document-room');
  socket.emit('document-state', documentState);

  socket.on('join-room', (roomId = 'document-room') => {
    socket.join(roomId);
    socket.emit('document-state', documentState);
  });

  socket.on('update-document', (nextDocument) => {
    const updatedState = { ...documentState, ...nextDocument };
    Object.assign(documentState, updatedState);
    io.to('document-room').emit('document-state', documentState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));