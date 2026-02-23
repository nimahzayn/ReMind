# Safe Zone Alert System Flowchart

## Alert Trigger Sequence

```
STEP 1: Patient Location Update
┌─────────────────────────────────────────────────────────┐
│ Patient Device sends location every 5 seconds           │
│                                                         │
│  fetch('/api/location/update', {                       │
│    latitude: 28.602,                                   │
│    longitude: 77.241                                   │
│  })                                                    │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
               
STEP 2: Server Receives Update
┌─────────────────────────────────────────────────────────┐
│ Express: POST /api/location/update                     │
│ • Validate authentication                              │
│ • Save location to MongoDB                             │
│ • Find safe zone for this patient                      │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
               
STEP 3: Distance Calculation
┌─────────────────────────────────────────────────────────┐
│ Haversine Formula: Calculate distance                   │
│                                                         │
│ distance = haversineDistance(                           │
│   patientLat, patientLng,                             │
│   safeZone.centerLat, safeZone.centerLng              │
│ )                                                      │
│                                                         │
│ if distance > safeZone.radius → OUTSIDE               │
│ else → INSIDE (no alert needed)                       │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
               
STEP 4: Find Linked Caregiver
┌─────────────────────────────────────────────────────────┐
│ Query: User.findOne({ linkedPatient: patientId })      │
│                                                         │
│ Returns caregiver ID associated with this patient      │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
               
STEP 5: Find Caregiver's Socket
┌─────────────────────────────────────────────────────────┐
│ Get from connectedCaregivers map:                       │
│                                                         │
│ connectedCaregivers = {                                 │
│   "caregiver_123": "socket_456",                        │
│   "caregiver_789": "socket_012"                         │
│ }                                                      │
│                                                         │
│ caregiverSocketId = connectedCaregivers[caregiver._id] │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
               
STEP 6: Emit Alert (Socket.IO)
┌─────────────────────────────────────────────────────────┐
│ Send ONLY to this caregiver's socket:                   │
│                                                         │
│ req.io.to(caregiverSocketId).emit("alert", {          │
│   patientId: "pat_123",                               │
│   status: "OUTSIDE",                                  │
│   distanceMetres: 350,                                │
│   message: "🚨 ALERT! Patient is 350m outside...",    │
│   timestamp: "2024-02-23T10:30:45.123Z"               │
│ })                                                    │
│                                                         │
│ ✅ Alert reaches ONLY this caregiver                   │
│ ✅ No broadcast to other caregivers                    │
│ ✅ Instant delivery (<100ms)                           │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
               
STEP 7: Caregiver Browser Receives Alert
┌─────────────────────────────────────────────────────────┐
│ SafeZone.jsx: socket.on("alert", (data) ⇒ {           │
│                                                         │
│   1. Show UI Alert                                      │
│      setAlert(data.message)                            │
│      ↓ Displays red alert box                          │
│                                                         │
│   2. Browser Notification                              │
│      new Notification("Patient Safety Alert 🚨", {     │
│        body: data.message,                             │
│        requireInteraction: true                        │
│      })                                                │
│      ↓ Popup appears on device                         │
│                                                         │
│   3. Add to History                                     │
│      setAlertHistory([data, ...prev.slice(0, 9)])     │
│      ↓ Logged in alert history section                 │
│                                                         │
│ })                                                     │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
               
STEP 8: Caregiver Sees Alert
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🚨 RED ALERT BOX                                      │
│  ┌───────────────────────────────────────────────┐    │
│  │ 🚨 ALERT! Patient is 350m outside the safe    │    │
│  │    zone!                                      │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  🔔 BROWSER NOTIFICATION (or OS notification)         │
│  ┌─────────────────────────────────────┐              │
│  │ Patient Safety Alert 🚨             │              │
│  │ 🚨 ALERT! Patient is 350m outside   │              │
│  │ the safe zone!                      │    [Dismiss] │
│  └─────────────────────────────────────┘              │
│                                                         │
│  📋 ALERT HISTORY                                      │
│  ┌─────────────────────────────────────┐              │
│  │ 10:30:45 - 🚨 ALERT! Patient is...  │              │
│  │           Distance: 350m from center │              │
│  │                                     │              │
│  │ 10:25:30 - 🚨 ALERT! Patient is...  │              │
│  │           Distance: 280m from center │              │
│  └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Socket.IO Connection Workflow

```
CAREGIVER DEVICE CONNECT SEQUENCE
═════════════════════════════════

1. Browser loads SafeZone component
   └─▶ useEffect: Create Socket.IO connection
       socketRef.current = io("http://10.10.168.224:5000")

2. Socket connects to server
   └─▶ socket.on("connect", () ⇒ {
         ✅ Connected!
         Emit: register_caregiver(caregiverId)
       })

3. Server receives "register_caregiver" event
   └─▶ io.on("connection", (socket) ⇒ {
         connectedCaregivers[caregiverId] = socket.id
         ✅ Caregiver registered and ready to receive alerts
       })

4. Caregiver ready to receive alerts
   └─▶ SafeZone component listening on "alert" event
       Whenever patient exits zone → Alert received instantly


DEVICE DISCONNECT SEQUENCE
═══════════════════════════

1. Caregiver closes browser/tab
   └─▶ Socket disconnects

2. Server detects disconnect
   └─▶ socket.on("disconnect", () ⇒ {
         Delete entry from connectedCaregivers
         ❌ This caregiver no longer receives alerts
       })

3. Later, if patient exits zone
   └─▶ Server looks for caregiver's socket
       Socket ID not found in connectedCaregivers
       ❌ Alert not sent (caregiver offline)
       ⚠️ Patient remains unsafe
```

---

## Multi-Caregiver Isolation

```
SCENARIO: Multiple caregivers in system
═════════════════════════════════════════

┌─────────────────┐    ┌─────────────────┐
│  Caregiver A    │    │  Caregiver B    │
│  Monitoring:    │    │  Monitoring:    │
│  • Patient 1    │    │  • Patient 3    │
│  • Patient 2    │    │  • Patient 4    │
└────────┬────────┘    └────────┬────────┘
         │                      │
         │ Socket.IO           │ Socket.IO
         │ socket_111          │ socket_222
         │                      │
         ▼                      ▼
  ┌──────────────────────────────────┐
  │     Server Socket.IO             │
  │  connectedCaregivers = {         │
  │    "careiver_A": "socket_111",  │
  │    "careiver_B": "socket_222"   │
  │  }                               │
  └──────────────────────────────────┘


ALERT SCENARIO: Patient 1 exits zone
═════════════════════════════════════

1. Patient 1 location update received
2. Server finds: Patient 1 linked to Caregiver A
3. Server finds: Caregiver A's socket = socket_111
4. Server emits: req.io.to("socket_111").emit("alert", ...)
   
   ✅ Caregiver A receives alert
   ❌ Caregiver B does NOT receive alert (different caregiver)
   ❌ Patient 3 and 4 unaffected


This ensures:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Privacy: Other caregivers can't see patient locations
• No interference: Multiple simultaneously running alerts don't conflict
• Accuracy: Each caregiver only monitors their linked patients
```

---

## Real-Time Update Timing

```
TIMELINE: Alert Detection to Notification
══════════════════════════════════════════

T+0ms:     Patient location updated
           └─ Local timestamp: 10:30:45.123

T+0-50ms:  Network round trip to server
           └─ Server receives location

T+0-100ms: Database query
           └─ Save location
           └─ Find safe zone
           └─ Find caregiver

T+0-150ms: Distance calculation
           └─ Haversine formula
           └─ Check if outside

T+0-175ms: Socket.IO emission
           └─ Find caregiver's socket
           └─ Send alert event

T+0-200ms: Network round trip back to client
           └─ Browser receives "alert" event

T+0-210ms: React state update
           └─ setAlert(message)
           └─ Browser re-renders

T+0-220ms: Caregiver sees alert
           └─ Red alert box visible
           └─ Sound/vibration possible

T+0-300ms: Browser notification
           └─ Native OS notification shown
           └─ Requires interaction to dismiss

═══════════════════════════════════════════════

TOTAL DELAY: ~250-300 milliseconds
(Excellent for real-time safety alerts)

This is MUCH faster than:
• SMS alerts (3-10 seconds)
• Email alerts (5-30 seconds)  
• Checking app periodically (manual)
```

---

## Error Handling Flow

```
WHAT IF: Patient not linked to caregiver?
══════════════════════════════════════════

Patient exits zone
      │
      ▼
Query: User.findOne({ linkedPatient: patientId })
      │
      ├─▶ Caregiver found? NO
      │   └─▶ No alert sent ✓
      │       (System working correctly)
      │
      └─▶ Caregiver found? YES
          └─▶ connectedCaregivers[caregiverId] = ?
              │
              ├─▶ Caregiver offline? (socket not found)
              │   └─▶ No alert sent
              │       (Caregiver device not connected)
              │
              └─▶ Caregiver online? (socket found)
                  └─▶ Alert sent ✅
                      └─▶ Caregiver browser receives


WHAT IF: Safe zone not set?
═════════════════════════════

Patient location updated
      │
      ▼
Query: SafeZone.findOne({ patientId })
      │
      ├─▶ Safe zone found? NO
      │   └─▶ No distance check
      │   └─▶ No alert sent ✓
      │       (System working correctly - zone not configured)
      │
      └─▶ Safe zone found? YES
          └─▶ Calculate distance
              └─▶ Compare with radius
                  └─▶ Alert if outside


Caregiver needs to:
1. Link patient first
2. Then set safe zone
3. Then alerts work
```

---

## Browser Notification Permission Flow

```
FIRST LOAD: Requesting Permission
══════════════════════════════════

SafeZone component mounts
      │
      ▼
Check: "Notification" in window
      │
      ├─▶ Browser doesn't support? SKIP
      │   └─ No notifications possible
      │
      └─▶ Browser supports? YES
          └─▶ Check: Notification.permission
              │
              ├─▶ "granted" ✅
              │   └─ Can send notifications immediately
              │
              ├─▶ "denied" ❌
              │   └─ User blocked notifications
              │   └─ Can't override
              │
              └─▶ "default" ?
                  └─ First time - REQUEST
                     Notification.requestPermission()
                     │
                     ├─▶ User clicks "Allow"
                     │   └─ permission = "granted" ✅
                     │
                     └─▶ User clicks "Block"
                         └─ permission = "denied" ❌


ALERT ALERT TRIGGER: Notification Sent
════════════════════════════════════════

Threshold breached (outside zone)
      │
      ▼
Check: "Notification" in window && permission === "granted"
      │
      ├─▶ Not supported or denied? SKIP
      │   └─ Only show UI alert
      │
      └─▶ Permission granted? YES
          └─▶ new Notification("Patient Safety Alert 🚨", {
                body: "🚨 ALERT! Patient is 350m outside...",
                icon: "data:image/svg+xml,<svg>...</svg>",
                requireInteraction: true  ← User must dismiss
              })
              │
              ├─▶ Browser notification appears
              ├─▶ Sound plays (by default)
              ├─▶ Device vibrates (if mobile)
              └─▶ Caregiver sees + hears alert
```

---

## Distance Calculation Accuracy

```
HAVERSINE FORMULA ACCURACY
═════════════════════════════

Input:
  • Patient lat: 28.602
  • Patient lng: 77.241
  • Zone center lat: 28.601
  • Zone center lng: 77.240

Calculate:
  R = 6371000 meters (Earth radius)
  
  dLat = (28.601 - 28.602) * π/180 = -0.0000174515 rad
  dLng = (77.240 - 77.241) * π/180 = -0.0000174515 rad
  
  a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLng/2)
  a = 0.00000003... (very small)
  
  distance = R * 2 * atan2(√a, √(1-a))
  distance = 111.2 meters


ACCURACY:
┌─────────────────────────────────────┐
│ Accuracy: ±0.5% error               │
│ (±0.5m per 100m distance)          │
│                                     │
│ Good for:                           │
│ ✓ Safe zone boundaries              │
│ ✓ Determining inside/outside        │
│ ✓ Distance display to user          │
└─────────────────────────────────────┘


LIMITATIONS:
• Ignores elevation (treats as flat)
• Assumes spherical Earth (not ellipsoid)
• Works best for distances < 500km
• Can be affected by GPS signal quality on patient device
```

---

**Visual Guide Version**: 1.0
**Last Updated**: February 2026
