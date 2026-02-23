const express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Make io accessible to routes and controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import models
const SafeZone = require("./models/SafeZone");

// Routes
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);

// SafeZone Routes
app.get("/api/safezone/:patientId", async (req, res) => {
  try {
    const safeZone = await SafeZone.findOne({ patientId: req.params.patientId });
    if (!safeZone) return res.status(404).json({ message: "No safe zone found" });
    res.json(safeZone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/safezone", async (req, res) => {
  try {
    const { patientId, centerLat, centerLng, radius } = req.body;
    let safeZone = await SafeZone.findOne({ patientId });
    
    if (safeZone) {
      safeZone.latitude = centerLat;
      safeZone.longitude = centerLng;
      safeZone.radiusMeters = radius;
    } else {
      safeZone = new SafeZone({
        patientId,
        latitude: centerLat,
        longitude: centerLng,
        radiusMeters: radius,
      });
    }
    
    await safeZone.save();
    res.json({ message: "Safe zone saved", safeZone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ...existing code...
// Track connected caregivers: { caregiverId: socketId }
const connectedCaregivers = {};

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Register caregiver socket
  socket.on("register_caregiver", (caregiverId) => {
    connectedCaregivers[caregiverId] = socket.id;
    console.log(`✅ Caregiver ${caregiverId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (let cId in connectedCaregivers) {
      if (connectedCaregivers[cId] === socket.id) {
        delete connectedCaregivers[cId];
        console.log(`❌ Caregiver ${cId} disconnected`);
      }
    }
  });
});

// Store connectedCaregivers globally for access in controllers
app.locals.connectedCaregivers = connectedCaregivers;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));