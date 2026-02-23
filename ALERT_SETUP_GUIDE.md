# Patient Safe Zone Alert System - Setup Guide

## Overview
Your ReMind app now has a **real-time alert system** that notifies the caregiver when a patient exits their designated safe zone.

## How It Works

### Architecture
1. **Patient Device**: Sends location updates every 5 seconds
2. **Server**: Checks if patient location is inside/outside safe zone
3. **Caregiver Device**: Receives real-time alerts via Socket.IO

### Flow
```
Patient Location Update → Server Check Safe Zone → Socket.IO Alert → Caregiver UI + Browser Notification
```

---

## Setup Instructions

### Step 1: Install Dependencies

#### Server Side
```bash
cd server
npm install socket.io
```

#### Client Side (Already Included)
socket.io-client is already in your dependencies!

### Step 2: Environment Setup
Ensure your `.env` file in the server directory has:
```
MONGO_URI=mongodb://localhost:27017/remind
PORT=5000
```

---

## Usage Guide

### For Caregivers

#### 1. Link Patient
- Open the app and navigate to **Live Location** tab
- Enter the patient's 4-digit code
- Patient will be linked and location tracking starts

#### 2. Set Safe Zone
- Go to **Safe Zone Settings** tab
- Click on the map to move the center of the safe zone
- Use the slider to adjust the radius (50-2000 meters)
- Click **Save Safe Zone** button

#### 3. Receive Alerts
When patient exits the safe zone:
- ❌ **UI Alert**: Red alert box appears on screen showing distance outside zone
- 🔔 **Browser Notification**: Desktop/mobile notification (if browser permission granted)
- 📋 **Alert History**: All alerts are logged with timestamp and distance

### For Patients

#### 1. Register/Login
- Create account with "Patient" role
- Copy your 4-digit patient code (shown in dashboard)
- Share with caregiver

#### 2. Enable Location
- Once caregiver links you, location tracking starts automatically
- Allow browser location permission when prompted
- Location updates every 5 seconds

---

## Alert Features

### Real-Time Notifications
- **Triggered When**: Patient distance > Safe Zone radius
- **Alert Message**: Shows exact distance outside zone
- **Browser Notification**: Persistent (requires interaction to dismiss)

### Alert History
- Last 10 alerts displayed
- Shows timestamp, message, and distance
- Automatically updated as new alerts occur

### Distance Display
- Shows patient's current distance from safe zone center
- Real-time update (every 5 seconds)
- Color-coded: Green (inside) / Red (outside)

---

## Running the Application

### Terminal 1: Server
```bash
cd server
npm install
npm run dev
```
Expected output:
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### Terminal 2: Client
```bash
cd client
npm install
npm run dev
```
Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Terminal 3: MongoDB (if not running as service)
```bash
mongod
```

---

## Testing the Alert System

### Test Scenario 1: Local Testing
1. Open two browser windows/tabs on same device
2. Tab 1: Login as **Caregiver**
3. Tab 2: Login as **Patient**
4. On Tab 2, open browser dev tools (F12)
5. Go to Console and run:
```javascript
// Simulate location change (outside safe zone)
await fetch('http://10.10.168.224:5000/api/location/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    latitude: 28.5921 + 0.01,  // Move ~1km away
    longitude: 77.2315 + 0.01
  })
});
```
6. Check Tab 1 (Caregiver) - should see alert!

### Test Scenario 2: Multiple Devices
1. Device 1 (Caregiver): Open caregiver dashboard
2. Device 2 (Patient): Simulate location using GPS spoofing app or manual update
3. Verify alert appears on Device 1 only

---

## Architecture Details

### Server Components

#### Socket.IO Setup (`server.js`)
- Tracks connected caregivers: `connectedCaregivers` object
- Maps caregiver ID → socket ID
- Broadcasting alerts to specific caregiver sockets

#### Location Controller (`controllers/locationController.js`)
- Handles patient location updates
- Calculates distance using Haversine formula
- Emits alerts ONLY to linked caregiver's socket

#### Key Functions
```javascript
// In updateLocation():
if (status === "OUTSIDE") {
  // Find caregiver linked to this patient
  const caregiver = await User.findOne({ linkedPatient: patientId });
  
  // Send alert to that specific caregiver
  req.io.to(caregiverSocketId).emit("alert", alertData);
}
```

### Client Components

#### SafeZone Component (`client/src/components/SafeZone.jsx`)
- Connects to Socket.IO on mount
- Registers caregiver ID with server
- Listens for "alert" events
- Shows alerts, notifications, and history

#### Key Listeners
```javascript
socket.on("alert", (data) => {
  // Show UI alert
  setAlert(data.message);
  
  // Add to history
  setAlertHistory(prev => [data, ...prev.slice(0, 9)]);
  
  // Browser notification
  if (Notification.permission === "granted") {
    new Notification("Patient Safety Alert 🚨", {
      body: data.message,
      requireInteraction: true
    });
  }
});
```

---

## Network Configuration

### IP Address
The hardcoded IP is: `10.10.168.224`

**To use your network:**
1. Find your server machine IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. Replace `10.10.168.224` in:
   - `client/src/components/SafeZone.jsx`
   - `client/src/services/authService.js`
   - Any other files with hardcoded IP

### Firewall
Ensure port 5000 is accessible:
- Windows: Allow Node.js in Windows Defender Firewall
- Linux: `sudo ufw allow 5000`

---

## Troubleshooting

### Alert Not Received
1. **Check Console**: Open browser dev tools (F12)
   - Should see: `✅ Connected to Socket.IO server`
   - Should see: `Register caregiver with ID: ...`

2. **Verify Patient is Linked**
   - Check SafeZone shows `linked = true`
   - Confirm patient code was entered

3. **Check Server Logs**
   - Verify: `📬 Alert sent to caregiver ...` message

### Location Not Updating
1. Allow browser location permission
2. Check browser console for errors
3. Verify MongoDB is running
4. Check server is running on port 5000

### No Browser Notifications
1. Allow notification permission when prompted
2. Check: `Notification.permission` in console should be `"granted"`
3. Some browsers require HTTPS for notifications (except localhost)

### Socket Connection Issues
1. Verify firewall allows port 5000
2. Check IP address is correct
3. Ensure MongoDB is running
4. Restart both server and client

---

## Database Models Used

### User Model
```javascript
{
  username: String,
  password: String,      // bcrypt hashed
  role: "patient" | "caregiver",
  patientCode: String,   // 4-digit code for patients
  linkedPatient: ObjectId // References patient ID for caregivers
}
```

### Location Model
```javascript
{
  patientId: ObjectId,
  latitude: Number,
  longitude: Number,
  updatedAt: Date
}
```

### SafeZone Model
```javascript
{
  patientId: ObjectId,
  centerLat: Number,
  centerLng: Number,
  radius: Number         // in meters
}
```

---

## API Endpoints Reference

### Location Routes
```
POST /api/location/update
- Patient sends location
- Triggering alert check

GET /api/location/patient
- Caregiver gets patient's current location

POST /api/location/link
- Caregiver links patient by code

GET /api/location/status/:patientId
- Get patient's current zone status
```

---

## Future Enhancements

- [ ] SMS/Email alerts
- [ ] Geofence notifications on mobile
- [ ] Panic button for patient
- [ ] Multiple safe zones per patient
- [ ] Alert scheduling (quiet hours)
- [ ] Location history playback
- [ ] Multi-caregiver support per patient

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Check browser console (F12) for client errors
4. Verify IP addresses and firewall settings

---

**Created**: February 2026
**Version**: 1.0
