# Troubleshooting Guide - Safe Zone Alert System

## 🔴 Critical Issues

### ❌ Server Won't Start
**Symptoms**: `node: command not found` or port 5000 already in use

**Solutions**:
```bash
# Check Node.js is installed
node --version  # Should be v14+

# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Kill process using port 5000 (Windows)
taskkill /PID <PID> /F

# Use different port (in server.js)
const PORT = 5001;  # Change from 5000
```

---

### ❌ MongoDB Connection Failed
**Symptoms**: `❌ MongoDB Error: MongoError` in server logs

**Solutions**:

1. **Check MongoDB Service** (Windows):
```powershell
# Check if MongoDB is running
Get-Service MongoDB

# Start MongoDB service
Start-Service MongoDB

# View Event Viewer for MongoDB errors
Get-EventLog -LogName Application -Source MongoDB -Newest 5
```

2. **Check MongoDB Service** (Mac/Linux):
```bash
# Check if MongoDB is running
systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# View logs
sudo tail -f /var/log/mongodb/mongod.log
```

3. **Verify MongoDB URI** in `.env`:
```env
# Should look like this
MONGO_URI=mongodb://localhost:27017/remind

# NOT this (won't work without Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/db
```

4. **Create MongoDB Local Connection**:
```bash
# If MongoDB not installed, download Community Edition
# https://www.mongodb.com/try/download/community

# Start MongoDB from command line
mongod --dbpath "C:\data\db"  # Windows
mongod --dbpath /data/db       # Mac/Linux
```

---

### ❌ Socket.IO Package Not Found
**Symptoms**: `Error: Cannot find module 'socket.io'`

**Solution**:
```bash
cd server
npm install socket.io@4.7.2
npm list socket.io  # Verify installation
```

---

## 🟠 Connection Issues

### ❌ "Cannot POST /api/location/update"
**Symptoms**: Patient location not updating, 404 error

**Causes & Fixes**:
1. **Server not running**:
   ```bash
   cd server
   npm run dev
   # Should show: 🚀 Server running on port 5000
   ```

2. **Wrong IP address**:
   - Check your server machine IP: `ipconfig` (Windows)
   - Update in `SafeZone.jsx` and `authService.js`
   - Example: Change `10.10.168.224` to `192.168.1.100`

3. **Firewall blocking**:
   ```bash
   # Windows: Add Node.js to firewall
   # Settings → Firewall → Allow an app through firewall → Add Node.js
   
   # Linux: Open port 5000
   sudo ufw allow 5000
   ```

---

### ❌ Socket.IO Connection Fails
**Symptoms**: Browser console: `❌ Disconnected from Socket.IO server` or connection never establishes

**Diagnosis**:
```javascript
// Open browser console (F12) and check:

// After 2 seconds, run this:
if (window.io) {
  console.log("Socket.IO loaded");
  const socket = io("http://10.10.168.224:5000");
  
  socket.on("connect", () => console.log("✅ Connected", socket.id));
  socket.on("connect_error", (error) => console.error("❌ Error:", error));
  
  setTimeout(() => socket.close(), 5000);
}
```

**Solutions**:
1. **Verify server is running on correct port**:
   ```bash
   # Server logs should show:
   ✅ MongoDB Connected
   🚀 Server running on port 5000
   ```

2. **Check IP address**:
   ```bash
   # Get server IP
   ipconfig | findstr IPv4  # Windows
   ifconfig                 # Mac/Linux
   
   # Must match IP in client code
   io("http://YOUR_SERVER_IP:5000")
   ```

3. **Test connectivity**:
   ```bash
   # From patient/caregiver device, ping server
   ping 10.10.168.224
   
   # Should reply (not "Destination host unreachable")
   ```

4. **Check CORS**:
   ```javascript
   // In server.js, should have:
   const io = socketIo(server, {
     cors: {
       origin: "*",  // Allow all origins
       methods: ["GET", "POST"],
     },
   });
   ```

---

## 🟡 Functionality Issues

### ❌ Alerts Not Received (But Connected)
**Symptoms**: Socket connected ✅, but no alert when patient exits zone

**Checklist**:
1. **Caregiver registered with server?**
   ```javascript
   // Browser console, should see:
   ✅ Connected to Socket.IO server
   Register caregiver with ID: ...
   
   // If not, check SafeZone.jsx socket setup
   ```

2. **Patient linked to caregiver?**
   ```javascript
   // In SafeZone component, check:
   console.log(user?.linkedPatient)  // Should have patient ID
   
   // In MongoDB:
   db.users.findOne({ _id: ObjectId("caregiver_id") })
   // Should have: linkedPatient: ObjectId("patient_id")
   ```

3. **Safe zone saved?**
   - Check database:
   ```javascript
   db.safezones.findOne({ patientId: ObjectId("patient_id") })
   // Should show: centerLat, centerLng, radius
   ```

4. **Patient is actually outside?**
   - Patient must be > radius meters from center
   - Test by simulating location (see next section)

---

### ❌ Location Not Updating
**Symptoms**: Patient location stays same, doesn't refresh

**Causes & Fixes**:
1. **Browser location permission denied**:
   - Check URL bar for location icon (might show "blocked")
   - Click → Allow location access
   - Refresh page

2. **Patient not authenticated**:
   ```javascript
   // Browser console:
   localStorage.getItem("token")  // Should exist
   localStorage.getItem("user")   // Should have role: "patient"
   ```

3. **Network error**:
   - Open Network tab (F12 → Network)
   - Do any POST to `/api/location/update`
   - Should see 200 OK response
   - If 401/403: Re-login
   - If 500: Check server logs

4. **GPS signal poor**:
   - Move closer to window
   - Try outdoors
   - Wait 30 seconds for GPS lock

---

### ❌ No Browser Notifications
**Symptoms**: Red alert appears but no notification popup

**Solutions**:

1. **Check permission**:
   ```javascript
   // Browser console:
   console.log(Notification.permission)
   // Should be: "granted"
   
   // If "default":
   Notification.requestPermission().then(permission => {
     console.log("Permission:", permission);
   });
   
   // If "denied": Settings → Notifications → Find localhost → Allow
   ```

2. **Browser doesn't support**:
   ```javascript
   // Check support:
   if (!('Notification' in window)) {
     console.log("Notifications not supported");
   }
   ```

3. **Test notification**:
   ```javascript
   // Browser console:
   if (Notification.permission === "granted") {
     new Notification("Test", {
       body: "This is a test notification",
       requireInteraction: true
     });
   }
   ```

---

## 🔵 Testing & Verification

### ✅ Verify Caregiver Registration

**Server logs should show**:
```
🔌 Socket connected: qbnds8vhs...
✅ Caregiver abc123def456 registered with socket qbnds8vhs...
```

**If not showing**:
1. Page reloaded? Check if component re-mounts
2. Socket.io client loaded? Check network tab in F12
3. Check SafeZone.jsx: `socket.emit("register_caregiver", user._id)`

---

### ✅ Test Alert System (Manual)

**Step 1: Patient Console Simulation**
```javascript
// Run on PATIENT device in browser console:

const updateLocation = async () => {
  const token = localStorage.getItem("token");
  
  // Simulate patient moving 2km away
  const response = await fetch(
    "http://10.10.168.224:5000/api/location/update",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: 28.602,   // Original
        longitude: 77.241   // Original
        // For outside zone: add 0.01-0.02 to move ~1-2km
      }),
    }
  );
  
  console.log(await response.json());
};

updateLocation();
```

**Step 2: Check CAREGIVER Response**
- Browser console: Should show received alert
- Screen: Red alert box should appear
- Notification: Popup should appear
- History: Alert added to list

**Step 3: Server Logs Should Show**:
```
📬 Alert sent to caregiver abc123def456
```

---

### ✅ Database Verification

```javascript
// MongoDB shell commands:

// Check if patient linked
db.users.findOne({ username: "caregiver1" })
// Should have: linkedPatient: ObjectId("...")

// Check if safe zone saved
db.safezones.findOne({ patientId: ObjectId("patient_id") })
// Should have: centerLat, centerLng, radius

// Check locations recorded
db.locations.find({ patientId: ObjectId("patient_id") }).pretty()
// Should show latest location with timestamp

// Real-time check during location update:
db.locations.watch()  // Streams live updates
```

---

## 🟢 Performance Issues

### ⚠️ High CPU Usage (Server)
**Symptoms**: Server process uses 90%+ CPU

**Causes & Fixes**:
1. **Infinite loop in alert emission**:
   - Check: Each alert sent only once per update
   - Fix: Remove any `setInterval` emitting alerts

2. **MongoDB query inefficiency**:
   ```javascript
   // Add indexes:
   db.locations.createIndex({ patientId: 1 })
   db.safezones.createIndex({ patientId: 1 })
   db.users.createIndex({ linkedPatient: 1 })
   ```

3. **Haversine calculation in loop**:
   - Should calculate only once per location update
   - Not in every frame render

---

### ⚠️ High Bandwidth Usage
**Symptoms**: Network meter constantly high even when idle

**Causes & Fixes**:
1. **Location polling too frequent**:
   - Current: 5 seconds (correct)
   - Check: `setInterval(..., 5000)` not `1000`

2. **Unnecessary socket reconnections**:
   ```javascript
   // In SafeZone.jsx, use ref to prevent recreating socket
   const socketRef = useRef(null);  // ✅ Correct
   const socket = io(...)           // ❌ Wrong - recreates each render
   ```

3. **Alert history consuming memory**:
   - Limited to 10 items: `prev.slice(0, 9)` ✅
   - If unlimited: Change to `.slice(0, 9)`

---

## 🔧 Advanced Debugging

### Enable Verbose Logging

**Client Side**:
```javascript
// SafeZone.jsx - add console logs:

socketRef.current.on("alert", (data) => {
  console.log("🚨 ALERT RECEIVED:", JSON.stringify(data, null, 2));
  console.log("Distance:", data.distanceMetres, "meters");
  console.log("Radius:", radius, "meters");
  console.log("Outside?", data.distanceMetres > radius);
});
```

**Server Side**:
```javascript
// controllers/locationController.js:

console.log("📍 Patient location:", { latitude, longitude });
console.log("🛡️ Safe zone:", safeZone);
console.log("📏 Distance:", distanceMetres, "meters");
console.log("🔍 Status:", status);

if (status === "OUTSIDE") {
  console.log("👤 Finding caregiver for patient:", patientId);
  console.log("👥 Connected caregivers:", Object.keys(connectedCaregivers));
  console.log("📬 Sending to socket:", caregiverSocketId);
}
```

---

### Network Debugging

**Chrome DevTools**:
1. F12 → Network tab
2. Filter: `ping`, `update`, `fetch`
3. Look for:
   - `POST /api/location/update` → Status 200
   - Payload shows correct latitude/longitude
   - Response: `{"message": "Location updated"}`

**Socket.IO Debugging**:
1. F12 → Network tab
2. Filter: `ws://` or `wss://`
3. Click WebSocket connection
4. Look for messages being sent/received
5. Check for "alert" events in message list

---

## 📋 Pre-Launch Checklist

- [ ] MongoDB running and accessible
- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Can login as patient
- [ ] Can login as caregiver
- [ ] Can link patient by code
- [ ] Can set safe zone
- [ ] Can simulate location change
- [ ] Alert appears on caregiver device
- [ ] Browser notification shows
- [ ] Alert added to history
- [ ] Multiple alerts appear in history
- [ ] Server logs show "Alert sent" messages
- [ ] Tested on both devices/browsers
- [ ] Firewall allows port 5000
- [ ] IP addresses are correct

---

## 🆘 Still Not Working?

**Collect Debug Information**:
1. **Server Terminal Output**:
   ```bash
   # Take screenshot or copy all console output
   ```

2. **Browser Console (F12)**:
   ```javascript
   // Copy output from console tab
   // Look for connect errors, alert events, etc.
   ```

3. **Network Tab (F12 → Network)**:
   ```
   // Look for failed requests to:
   // - http://10.10.168.224:5000/api/location/update
   // - WebSocket connection
   ```

4. **MongoDB Check**:
   ```javascript
   // In MongoDB shell:
   db.users.count()    // Should be >0
   db.locations.count() // Should be >0
   db.safezones.count() // Should be >0
   ```

**Share this information**:
- Server log output
- Browser console errors
- Network tab failed requests
- MongoDB connection status
- IP address being used

---

**Troubleshooting Guide Version**: 1.0
**Last Updated**: February 2026
