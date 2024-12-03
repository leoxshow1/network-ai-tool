const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const networkRoutes = require('./routes/network');
const networkScanner = require('./services/networkScanner');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/api/network', networkRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New Socket.IO connection established');

  // Handle scan progress updates
  networkScanner.on('scanProgress', (data) => {
    socket.emit('networkUpdate', {
      type: 'scanProgress',
      metrics: {
        networkHealth: data.progress,
        activeDevices: data.devices?.length || 0,
        bandwidthUsage: 0
      }
    });
  });

  // Handle scan completion
  networkScanner.on('scanComplete', (results) => {
    socket.emit('networkUpdate', {
      type: 'scanComplete',
      metrics: {
        networkHealth: 100,
        activeDevices: results.devices?.length || 0,
        bandwidthUsage: 0
      }
    });
  });

  // Handle scan errors
  networkScanner.on('scanError', (error) => {
    socket.emit('error', {
      type: 'scanError',
      error: error.message
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});