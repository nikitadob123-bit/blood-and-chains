const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory rooms
// roomId -> { players: Map<socketId, {name, role}>, history: [], createdAt }
const rooms = new Map();

function createRoom() {
  const id = uuidv4().slice(0, 8).toUpperCase();
  rooms.set(id, {
    players: new Map(),
    history: [],
    createdAt: Date.now()
  });
  return id;
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('create-room', (callback) => {
    const roomId = createRoom();
    callback({ roomId });
  });

  socket.on('join-room', ({ roomId, name, role }, callback) => {
    roomId = (roomId || '').toUpperCase().trim();
    const room = rooms.get(roomId);

    if (!room) {
      return callback({ error: 'Комната не найдена' });
    }

    // Leave previous room if any
    if (socket.roomId) {
      socket.leave(socket.roomId);
      const prev = rooms.get(socket.roomId);
      if (prev) prev.players.delete(socket.id);
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = name || (role === 'makima' ? 'Макима' : 'Игрок');
    socket.role = role || 'player';

    room.players.set(socket.id, {
      name: socket.playerName,
      role: socket.role
    });

    // Send current history to the new joiner
    callback({
      ok: true,
      roomId,
      history: room.history,
      players: Array.from(room.players.values())
    });

    // Notify others
    socket.to(roomId).emit('player-joined', {
      name: socket.playerName,
      role: socket.role
    });

    io.to(roomId).emit('players-update', Array.from(room.players.values()));
  });

  socket.on('send-message', ({ type, text }) => {
    if (!socket.roomId) return;
    const room = rooms.get(socket.roomId);
    if (!room) return;

    const entry = {
      id: uuidv4(),
      type: type || (socket.role === 'makima' ? 'makima' : 'player'),
      text,
      name: socket.playerName,
      role: socket.role,
      ts: Date.now()
    };

    room.history.push(entry);
    // Keep last 300 messages
    if (room.history.length > 300) room.history.shift();

    io.to(socket.roomId).emit('new-message', entry);
  });

  socket.on('request-history', (callback) => {
    if (!socket.roomId) return callback([]);
    const room = rooms.get(socket.roomId);
    callback(room ? room.history : []);
  });

  socket.on('disconnect', () => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.players.delete(socket.id);
        io.to(socket.roomId).emit('players-update', Array.from(room.players.values()));
        io.to(socket.roomId).emit('player-left', {
          name: socket.playerName,
          role: socket.role
        });
      }
    }
    console.log('Disconnected:', socket.id);
  });
});

// Clean old empty rooms every 30 min
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (room.players.size === 0 && now - room.createdAt > 1000 * 60 * 60 * 6) {
      rooms.delete(id);
    }
  }
}, 1000 * 60 * 30);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Blood & Control server running on port ${PORT}`);
});
