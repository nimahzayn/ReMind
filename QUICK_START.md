# ReMind - Safe Zone Alert System - Quick Start

## 🚀 Quick Setup (5 Minutes)

### 1. Install Socket.IO
```bash
cd server
npm install socket.io
```

### 2. Start MongoDB (if not running)
MongoDB must be running as a service on your machine.

### 3. Start Server
```bash
cd server
npm run dev
```
✅ Should see: `✅ MongoDB Connected` and `🚀 Server running on port 5000`

### 4. Start Client
```bash
cd client
npm run dev
```
✅ Should see: `➜  Local:   http://localhost:5173/`

---

## 📱 How to Use

### Step 1: Patient Setup
1. Login as **Patient** on one device
2. Copy the **4-digit patient code** (shown in dashboard)
3. Share code with caregiver

### Step 2: Caregiver Setup
1. Login as **Caregiver** on another device  
2. Go to **Live Location** tab
3. Enter the 4-digit patient code → Patient linked ✅
4. Go to **Safe Zone Settings** tab
5. Click map to set safe zone center
6. Drag slider to set radius (start with 200m)
7. Click **💾 Save Safe Zone**

### Step 3: Test Alerts
On patient device:
- Use browser console to simulate location change:
```javascript
await fetch('http://10.10.168.224:5000/api/location/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    latitude: 28.5921 + 0.01,  // Move away
    longitude: 77.2315 + 0.01
  })
});
```

On caregiver device:
- Should see **red alert** immediately! 🚨

---

## 🔔 Alert Types

| Alert Type | When | How |
|-----------|------|-----|
| **UI Alert** | Patient exits zone | Red box on screen |
| **Browser Notification** | Patient exits zone | Popup (if permission granted) |
| **Alert History** | Always | Logged in Safe Zone tab |
| **Status Badge** | Always | Green ✅ Inside / Red 🚨 Outside |

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Server won't start | Check MongoDB is running: `net start MongoDB` (Windows) |
| Connection refused | Verify IP: Check if `10.10.168.224` is your server's IP |
| No alerts | Check browser console: F12 → Console → Look for errors |
| Location not updating | Grant browser location permission |
| No notifications | Check browser notification settings |

---

## 📊 System Requirements

- **MongoDB**: Running as service (SQL free/local instance)
- **Node.js**: v14+ 
- **Browser**: Chrome/Edge/Firefox (with location + notification support)
- **Network**: Both devices on same network (or use ngrok for remote)

---

## 🔐 Important Notes

1. **IP Address**: Currently set to `10.10.168.224`
   - Change in: `SafeZone.jsx` and `authService.js` if different

2. **Caregiver ID registered on connect**
   - Server tracks which caregiver socket = which caregiver ID
   - Alerts sent ONLY to linked caregiver's socket

3. **Location updates every 5 seconds**
   - Server checks distance automatically
   - No manual check needed

---

## 📋 What Changed?

### Backend
- ✅ Added Socket.IO server (`server.js`)
- ✅ Updated location controller to send targeted alerts
- ✅ Tracks connected caregivers by ID

### Frontend  
- ✅ SafeZone component connects to Socket.IO
- ✅ Receives real-time alerts
- ✅ Shows browser notifications
- ✅ Maintains alert history

---

## 🧪 Test Checklist

- [ ] MongoDB running
- [ ] Server started (port 5000)
- [ ] Client started (port 5173)
- [ ] Patient logged in on Device 1
- [ ] Caregiver logged in on Device 2
- [ ] Patient code linked successfully
- [ ] Safe zone saved with center and radius
- [ ] Simulate patient location change
- [ ] Alert appears on caregiver device
- [ ] Browser notification shown
- [ ] Alert logged in history

---

## 📞 Support

See `ALERT_SETUP_GUIDE.md` for detailed documentation
