# Security Management PWA — Full Development Prompt

Build a **production-ready, secure, highly optimized multi-company Security Management System** as a **Progressive Web App (PWA)**.

The system will be used by security guards, company administrators, supervisors, and a Super Admin to manage vehicle entry/exit, security guards, gates, camera captures, number-plate recognition, guard verification, and security audit records.

The application must be designed to work extremely well on **Android phones, iPhones, tablets, laptops, and desktop computers** using a responsive PWA interface.

The priority is:

1. Security
2. Reliability
3. Mobile usability
4. Offline capability
5. Fast performance
6. Image/storage optimization
7. Multi-company data isolation
8. Auditability
9. Scalability

---

# 1. Technology Architecture

Use a modern production-ready stack.

### Frontend

* Next.js
* TypeScript
* React
* Tailwind CSS
* PWA
* Responsive/mobile-first UI
* Service Worker
* Web App Manifest
* Camera API
* IndexedDB for offline data
* Optimized image processing before upload

### Backend / Infrastructure

Prefer:

* Supabase
* PostgreSQL
* Supabase Authentication
* Supabase Storage
* Row Level Security (RLS)
* Realtime where useful
* Server-side API validation

Structure the application so the backend can later be separated into dedicated services if the platform becomes large.

---

# 2. PWA Requirements

This must be a **real PWA**, not simply a responsive website.

Implement:

* Installable PWA
* Android installation
* iOS Add to Home Screen compatibility
* Desktop installation where supported
* Service worker
* App manifest
* Offline shell
* Offline data queue
* Automatic synchronization when internet returns
* Camera access
* Mobile-friendly navigation
* Touch-friendly controls
* Fast loading
* Proper loading states
* Error states
* Retry functionality

The guard interface must remain usable even when the internet connection temporarily disappears.

---

# 3. User Roles

Implement strict role-based access control.

## Super Admin

Can:

* Create companies
* Edit companies
* Suspend companies
* Activate companies
* Create company administrators
* View all companies
* View system-wide statistics
* View system audit logs
* Manage system settings
* Monitor system health
* Manage global security policies

Super Admin must not be able to silently alter security evidence. Sensitive administrative actions must generate audit records.

## Company Admin

Can access only their own company.

Can:

* Manage company profile
* Add/edit/remove guards
* Create security supervisors if enabled
* Create gates
* Manage vehicles
* Manage authorized vehicles
* Manage watchlist vehicles
* View vehicle entry/exit logs
* View guard shifts
* View guard verification
* View incidents
* View reports
* Configure company security settings

## Guard

Mobile-first interface.

Can:

* Login
* Start shift
* End shift
* Record vehicle entry
* Record vehicle exit
* Capture vehicle image
* Capture number plate image
* Run number plate OCR
* Confirm/correct detected number
* Perform hourly verification
* Scan checkpoints
* Report incidents
* View assigned gate
* View assigned shift
* View recent activity

Guards must not access another company's data.

---

# 4. Authentication

Implement secure authentication.

Requirements:

* Email/password or approved authentication method
* Secure password handling through Supabase Auth
* Never store plaintext passwords
* Session management
* Logout
* Password reset
* Login attempt protection
* Rate limiting
* Secure cookies/session handling
* Role-based authorization
* Company-based authorization
* Optional MFA for administrators
* Device/session tracking

Company Admin should be able to create/invite security guards without seeing or storing their plaintext passwords.

---

# 5. Multi-Tenant Architecture

This is one of the most important requirements.

Every company must be completely isolated.

Example:

```text
Company A
  ├── Guards
  ├── Gates
  ├── Vehicles
  ├── Entries
  └── Evidence

Company B
  ├── Guards
  ├── Gates
  ├── Vehicles
  ├── Entries
  └── Evidence
```

Company A users must NEVER be able to access Company B data.

Implement database-level **Row Level Security (RLS)**.

Do not rely only on frontend filtering.

Every company-owned record should have a `company_id`.

Authorization must be enforced on the server/database.

---

# 6. Company Management

Super Admin dashboard:

* Company list
* Create company
* Edit company
* Activate/deactivate company
* Company administrator
* Number of guards
* Number of gates
* Number of vehicles
* Today's entries
* Storage usage
* Recent activity

Company fields:

* Company name
* Company code
* Contact information
* Address
* Status
* Created date
* Admin
* Settings
* Storage usage

---

# 7. Guard Management

Company Admin can:

* Add guard
* Edit guard
* Activate/deactivate guard
* Assign gate
* Assign shift
* Assign supervisor
* View attendance
* View verification history
* View checkpoint history
* View device/session history

Guard profile:

* Name
* Employee/Guard ID
* Mobile number
* Email if available
* Profile photograph
* Assigned company
* Assigned gate
* Assigned shift
* Status
* Joining date

---

# 8. Guard Shift Management

Create a shift system.

Example:

```text
Guard: GUARD-001
Shift: 08:00 - 20:00
Gate: Gate 2
Status: ACTIVE
```

Track:

* Shift start
* Shift end
* Late login
* Early logout
* Missed verification
* Checkpoints completed
* Device used
* Attendance status

Dashboard should clearly show:

```text
ACTIVE
LATE
OFFLINE
MISSED VERIFICATION
SHIFT ENDED
```

---

# 9. Hourly Guard Verification

Every guard must periodically verify that they are actively performing their security duty.

Example:

```text
08:00 ✓ Shift Started
09:00 ✓ Verification
10:00 ✓ Verification
11:00 ✓ Verification
12:00 ❌ Missed
13:00 ✓ Verification
```

Use a configurable verification interval.

Do not require the exact same minute every time. Allow a configurable verification window/randomized prompt where appropriate.

For verification:

* Open camera
* Capture image
* Upload directly
* Record server timestamp
* Record guard ID
* Record gate
* Record shift
* Record device/session
* Record verification ID

Prefer direct camera capture instead of unrestricted gallery uploads for verification.

Do not claim that an image proves a guard was sleeping or awake. The system should detect missed verification and allow a supervisor to review the evidence.

---

# 10. Gate Management

Company Admin can create:

```text
Gate 1
Gate 2
Main Gate
Warehouse Gate
Emergency Gate
```

Each gate should have:

* Gate name
* Gate code
* Location
* Assigned guards
* Cameras
* Status
* Operating hours
* Security instructions

A guard should normally see only their assigned gate information.

---

# 11. Vehicle Management

Company Admin can register authorized vehicles.

Vehicle information:

* Vehicle number
* Vehicle type
* Owner/company
* Driver
* Department
* Authorization status
* Valid from
* Valid until
* Notes

Vehicle types:

* Car
* Truck
* Tractor
* Bus
* Bike
* Trailer
* Other

Support authorized, expired, unknown and watchlist states.

---

# 12. Vehicle Entry

Create a simple guard workflow:

```text
Vehicle Entry
      ↓
Open Camera
      ↓
Capture Vehicle Image
      ↓
Capture/Detect Number Plate
      ↓
OCR
      ↓
Display Detected Number
      ↓
Guard Confirms/Corrects
      ↓
Search Vehicle
      ↓
Authorized / Unknown / Watchlist
      ↓
Save Entry
```

Record:

* Vehicle number
* Original OCR result
* OCR confidence
* Corrected number if applicable
* Vehicle image
* Number plate crop
* Gate
* Guard
* Company
* Date
* Time
* Driver
* Purpose
* Destination
* Remarks

Never overwrite the original OCR result.

If the guard corrects the number, preserve:

* Original OCR
* Corrected number
* User who corrected it
* Timestamp
* Reason

---

# 13. Vehicle Exit

Guard selects or scans the vehicle.

System finds the active entry.

Then:

```text
Vehicle
 ↓
Active Entry
 ↓
Capture Exit Image
 ↓
Confirm Number Plate
 ↓
Save Exit
```

Calculate:

```text
Time Inside = Exit Time - Entry Time
```

If a vehicle has remained inside unusually long, generate a configurable alert for review.

---

# 14. Camera Capture

Use the phone camera directly from the PWA.

Requirements:

* Rear camera preference for vehicle capture
* Front camera for guard verification
* Camera permission handling
* Camera preview
* Capture button
* Retake
* Confirm
* Image compression
* Upload progress
* Retry after failed upload
* Offline queue

Do not require users to manually navigate through the phone gallery for normal vehicle/verification workflows.

---

# 15. Number Plate OCR

Implement number-plate recognition as a separate service/module.

The architecture should allow the OCR/ANPR engine to be replaced later.

Return:

```text
plate_number
confidence
plate_crop
processing_time
```

Example:

```text
Detected:
GJ39CA2073

Confidence:
94%
```

If confidence is low:

```text
LOW CONFIDENCE

Please verify the number manually.
```

The guard must always be able to correct OCR.

Never automatically treat OCR as unquestionable truth.

---

# 16. Image Compression and Optimization

This is a critical requirement.

Do NOT upload huge original phone photographs unnecessarily.

Implement client-side image optimization before upload.

Pipeline:

```text
Camera
 ↓
Resize
 ↓
Compress
 ↓
Convert to optimized JPEG/WebP where appropriate
 ↓
Upload
```

Target reasonable image sizes based on the use case.

For example:

* Vehicle image: approximately 300–700 KB
* Plate crop: approximately 50–150 KB
* Guard verification: approximately 200–500 KB

These are targets, not hard requirements. Preserve sufficient quality for security/evidence purposes.

Do not compress evidence so aggressively that the number plate or important details become unreadable.

Store image metadata separately in PostgreSQL.

Do not store image binary data directly inside PostgreSQL.

Use private object storage.

Recommended structure:

```text
/company/{company_id}/
    /vehicles/{year}/{month}/{day}/
    /plates/{year}/{month}/{day}/
    /guard-verification/{year}/{month}/{day}/
    /incidents/{incident_id}/
```

Use private buckets and signed/expiring URLs.

---

# 17. Image Lifecycle

Implement configurable retention policies.

Examples:

```text
Normal vehicle images → configurable retention
Guard verification → configurable retention
Incident evidence → longer retention
Audit logs → long-term retention
```

Do not automatically delete important incident evidence.

Retention must be configurable by authorized administrators and every sensitive deletion must be audited.

---

# 18. Basic Dashboard

Company dashboard should show:

```text
Today's Vehicle Entries
Today's Vehicle Exits
Vehicles Currently Inside
Guards On Duty
Missed Guard Verifications
Unknown Vehicles
Watchlist Alerts
Open Incidents
Gate Status
```

Add:

* Recent vehicle activity
* Recent incidents
* Recent guard activity
* Alerts
* Quick actions

---

# 19. Super Admin Dashboard

Show:

```text
Total Companies
Active Companies
Total Guards
Active Guards
Total Gates
Today's Vehicle Entries
Today's Vehicle Exits
Open Incidents
System Alerts
Storage Usage
```

Include company-level drill-down.

---

# 20. Audit Logs

Create a complete audit system.

Record important actions:

```text
User
Company
Action
Entity
Entity ID
Old Value
New Value
IP
Device/session
Timestamp
Reason where required
```

Examples:

```text
Guard created
Guard disabled
Vehicle created
Vehicle number corrected
Vehicle entry created
Vehicle exit created
Incident created
Evidence viewed
Admin settings changed
User role changed
Report exported
```

Audit logs must be append-only from the normal application interface.

---

# 21. Offline Mode

This is mandatory for the guard application.

When internet is unavailable:

```text
Guard Phone
    ↓
PWA
    ↓
IndexedDB
    ↓
Encrypted/controlled local queue
    ↓
Internet returns
    ↓
Automatic synchronization
```

Offline operations should include:

* Vehicle entry
* Vehicle exit
* Guard verification
* Checkpoint scan
* Incident creation

Every queued event should have a unique client-generated ID.

The synchronization system must prevent duplicate records.

Show:

```text
ONLINE ✓

or

OFFLINE
12 records waiting to sync
```

When synchronized:

```text
SYNCED ✓
```

---

# 22. Data Synchronization

Implement idempotent synchronization.

If the same event is sent twice, the backend must not create two entries.

Use a unique event/client ID.

Example:

```text
client_event_id
```

with a unique database constraint.

Handle:

* Network timeout
* Duplicate submission
* Partial upload
* App closed during upload
* Network switching
* Failed image upload
* Retry queue

---

# 23. Security Alerts

Create an alert engine.

Examples:

```text
Watchlist vehicle detected
Unknown vehicle
Expired vehicle authorization
Guard missed verification
Multiple missed verifications
New/unrecognized device
Suspicious login
Vehicle still inside for unusually long duration
Gate/camera offline
```

Alerts should have:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 24. Performance Optimization

The application must be optimized for low-end Android devices and slower mobile networks.

Implement:

* Lazy loading
* Code splitting
* Dynamic imports
* Image compression
* Responsive images
* Pagination
* Virtualized long lists where needed
* Debounced search
* Server-side filtering
* IndexedDB caching
* Optimistic UI where safe
* Minimal JavaScript on guard screens
* Avoid unnecessary API requests
* Cache static assets
* Efficient database indexes
* Connection pooling
* Background synchronization

Never load thousands of vehicle records into the browser at once.

Use pagination/infinite scrolling.

---

# 25. Database Optimization

Create appropriate indexes for:

```text
company_id
vehicle_number
gate_id
guard_id
shift_id
entry_time
exit_time
created_at
incident_status
watchlist_status
```

Common searches must be fast:

```text
Vehicle number + date
Company + date
Gate + date
Guard + shift
Open incidents
Vehicles currently inside
```

Use server-side queries.

---

# 26. Mobile UX

The Guard interface must be extremely simple.

Main screen:

```text
┌────────────────────────┐
│ Gate 2                 │
│ Guard: Rahul           │
│ Shift: 08:00–20:00     │
│                        │
│ 🚗 VEHICLE ENTRY       │
│                        │
│ 🚪 VEHICLE EXIT        │
│                        │
│ 📷 VERIFICATION        │
│                        │
│ 📍 CHECKPOINT          │
│                        │
│ 🚨 REPORT INCIDENT     │
│                        │
└────────────────────────┘
```

Large buttons.

Minimal typing.

Large camera controls.

Clear success/error messages.

---

# 27. Accessibility

Support:

* Large touch targets
* Good contrast
* Readable fonts
* Keyboard navigation on desktop
* Screen-reader-friendly labels
* Clear error messages
* No color-only status indicators

---

# 28. Error Handling

Never show technical errors to guards.

Instead of:

```text
500 Internal Server Error
```

show:

```text
Unable to save vehicle entry.

Your record has been stored locally and will sync automatically when the connection returns.
```

Where appropriate.

---

# 29. Privacy and Data Protection

The system may contain personal information, photographs and security records.

Implement:

* Least-privilege access
* Private storage
* Access logging
* Retention policies
* Secure deletion procedures
* Data export controls
* Admin audit trail
* No unnecessary collection of personal information
* Clear company-level data ownership

Design the system to comply with applicable Indian privacy/data-protection requirements and the organization's own security policies.

---

# 30. Code Quality

Use:

* TypeScript strict mode
* Strong validation
* Reusable components
* Service/repository separation
* Centralized authorization
* Environment variables for secrets
* No hardcoded API keys
* No secrets committed to Git
* Error logging
* Structured logging
* Consistent naming
* Proper database migrations
* Automated tests

---

# 31. Environment Separation

Create:

```text
Development
Staging
Production
```

Never use production credentials in development.

Use environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Never expose service-role/private keys to the browser.

---

# 32. Security Testing

Before production, test:

* Authentication
* Authorization
* RLS
* Company isolation
* Role escalation
* API manipulation
* SQL injection protection
* XSS protection
* CSRF protection where applicable
* File upload validation
* Malicious file upload
* Session expiration
* Rate limiting
* Audit log integrity
* Offline synchronization
* Duplicate submissions
* Unauthorized evidence access

Perform security testing using authorized test accounts and environments only.

---

# 33. Important Database Tables

Create a clean relational schema including at minimum:

```text
companies
users/profiles
roles
guards
gates
shifts
guard_verifications
checkpoints
checkpoint_scans
vehicles
vehicle_authorizations
vehicle_entries
vehicle_exits
vehicle_watchlist
incidents
incident_evidence
cameras
notifications
alerts
devices
sessions
audit_logs
system_settings
company_settings
```

Use UUID primary keys where appropriate.

Use foreign keys.

Use timestamps.

Use status enums/check constraints where appropriate.

Add `company_id` to all tenant-owned tables.

---

# 34. Vehicle Investigation Timeline

For every vehicle, provide a complete timeline.

Example:

```text
GJ39CA2073

20:14:03
Vehicle entered Gate 2

20:14:04
OCR detected GJ39CA2073

20:14:10
Guard confirmed plate

22:31:15
Vehicle still inside

23:42:02
Vehicle exited Gate 2
```

Show associated images and evidence.

---

# 35. Currently Inside Dashboard

Provide a live list of vehicles currently inside.

Show:

```text
Vehicle
Entry Time
Gate
Guard
Driver
Duration
Status
```

Allow filtering by gate/company/status.

---

# 36. Future Architecture

Design the system so these can be added later without major rewriting:

* CCTV integration
* Automatic ANPR
* Multiple cameras
* AI-assisted video analysis
* QR/NFC checkpoints
* Push notifications
* WhatsApp/SMS notifications
* Face/liveness verification where legally and operationally appropriate
* Access-control integration
* NVR integration
* Advanced analytics
* Incident workflow
* Mobile native application
* Subscription/billing
* Multiple sites per company

Do not implement unnecessary future features in the MVP, but keep the architecture extensible.

---

# 37. Final MVP Feature Checklist

The first production MVP MUST contain:

* [ ] Super Admin
* [ ] Company Admin
* [ ] Guard
* [ ] Secure Login
* [ ] Role-based access control
* [ ] Multi-company architecture
* [ ] Company management
* [ ] Guard management
* [ ] Gate management
* [ ] Vehicle management
* [ ] Vehicle authorization
* [ ] Vehicle entry
* [ ] Vehicle exit
* [ ] Camera capture
* [ ] Number plate OCR
* [ ] OCR confidence
* [ ] Manual plate correction
* [ ] Original OCR preservation
* [ ] Guard shift management
* [ ] Hourly guard verification
* [ ] Guard verification camera
* [ ] Basic dashboard
* [ ] Vehicle currently-inside tracking
* [ ] Audit logs
* [ ] Image compression
* [ ] Private image storage
* [ ] Offline PWA
* [ ] Offline queue
* [ ] Automatic synchronization
* [ ] Duplicate-event prevention
* [ ] Database indexes
* [ ] Pagination
* [ ] Mobile-first UI
* [ ] Responsive desktop UI
* [ ] Secure database RLS
* [ ] Session management
* [ ] Error handling
* [ ] Loading states
* [ ] Retry mechanisms
* [ ] Security alerts
* [ ] Production-ready environment configuration

---

# 38. Definition of Done

The application is not considered complete until:

1. A Super Admin can create a company.
2. Company Admin can log in and manage only their company.
3. Company Admin can create guards and gates.
4. A guard can log in from a phone.
5. A guard can start a shift.
6. A guard can capture a vehicle photograph.
7. The system can process the number plate.
8. Guard can verify/correct the OCR result.
9. Vehicle entry is stored.
10. Vehicle exit is stored.
11. System calculates time inside.
12. Guard can perform periodic verification.
13. Missed verification generates an alert.
14. Images are compressed before upload.
15. Images are stored privately.
16. Guard can continue basic operations while temporarily offline.
17. Offline records synchronize automatically.
18. Duplicate records are prevented.
19. Company A cannot access Company B data.
20. Every sensitive action is recorded in the audit log.
21. The application is installable as a PWA.
22. The application works properly on mobile and desktop.
23. The application performs well on slow networks and lower-end phones.
24. No secrets are exposed in frontend code.
25. The application passes authentication, authorization and RLS security testing.

Build the system incrementally. First create the database schema, authentication, roles, multi-tenant RLS and core layouts. Then implement company/guard/gate/vehicle management. Then implement vehicle entry/exit and camera/OCR. Then implement guard shifts and hourly verification. Finally implement offline synchronization, image optimization, alerts, audit logs and performance optimization.

Do not build a visually impressive dashboard while leaving security, authorization, offline handling and database architecture incomplete. **Security, correctness and reliability have priority over visual effects.**
