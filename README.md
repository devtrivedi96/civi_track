# Crowdsourced Civic Issue Reporting System

A comprehensive React application for reporting and managing civic issues in communities. Built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

### Core Functionality
- **Multi-Authentication**: Email/password, Google Sign-In, and Phone OTP authentication
- **Issue Reporting**: Submit reports with photos, location, and categorization
- **Interactive Maps**: View all reports on an interactive map with clustered markers
- **Real-time Updates**: Live status updates and notifications via Firebase Cloud Messaging
- **Admin Dashboard**: Manage reports, assign agents, and update statuses
- **Mobile Responsive**: Optimized for all device sizes with PWA capabilities

### Technical Features
- **Image Handling**: Automatic WebP conversion and compression
- **Geolocation**: Automatic location capture with manual adjustment
- **Push Notifications**: Firebase Cloud Messaging for status updates
- **Security**: Firebase Security Rules with role-based access control
- **Real-time**: Live updates using Firestore real-time listeners

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage, Cloud Messaging)
- **Maps**: Leaflet with React Leaflet
- **State Management**: React Hooks, Context API
- **Forms**: React Hook Form
- **Routing**: React Router v6
- **Image Processing**: React Image File Resizer
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- Modern web browser with geolocation support

## Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd civic-issue-reporting
```

2. **Install dependencies**
```bash
npm install
```

3. **Firebase Setup**

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard
4. Enable Google Analytics (optional)

### Enable Authentication
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable the following providers:
   - Email/Password
   - Google
   - Phone (optional)

### Set up Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location for your database

### Set up Firebase Storage
1. Go to Storage
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location

### Set up Cloud Messaging (Optional)
1. Go to Project Settings > Cloud Messaging
2. Generate a new key pair for VAPID
3. Note down the VAPID key

### Get Firebase Configuration
1. Go to Project Settings > General
2. Scroll down to "Your apps"
3. Click "Add app" and select Web
4. Register your app
5. Copy the configuration object

4. **Environment Variables**
   Create a `.env` file in the root directory and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key_for_fcm
```

5. **Firebase Security Rules**

### Firestore Security Rules
Replace the default rules in Firestore with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles collection
    match /profiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role in ['admin', 'agent']);
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role in ['admin', 'agent']);
    }
    
    // Report comments
    match /reportComments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Status history
    match /statusHistory/{historyId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.changedBy;
    }
  }
}
```

### Storage Security Rules
Replace the default rules in Storage with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

6. **Update Service Worker**
   Update the Firebase configuration in `public/firebase-messaging-sw.js` with your project details.

## Development

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthProvider.tsx
│   ├── Layout.tsx
│   ├── MapView.tsx
│   └── ReportCard.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.ts
├── lib/                # External service configurations
│   └── firebase.ts
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── ReportForm.tsx
│   ├── ReportDetail.tsx
│   ├── MyReports.tsx
│   └── AdminDashboard.tsx
├── utils/              # Utility functions
│   └── imageUtils.ts
└── App.tsx
```

## Usage

### For Citizens
1. **Register/Login**: Create account using email, Google, or phone
2. **Report Issues**: Use the floating + button to report new issues
3. **Upload Photos**: Take photos or upload from gallery (auto-compressed to WebP)
4. **Set Location**: Auto-detect location or manually set on map
5. **Track Progress**: Follow status updates and receive push notifications

### For Admins
1. **Dashboard Access**: Admin users can access the admin dashboard
2. **Manage Reports**: View, verify, assign, and resolve reports
3. **User Management**: Assign agent roles to users
4. **Real-time Updates**: See live updates as reports come in

## Firebase Collections Schema

### profiles
```javascript
{
  id: string,           // User UID
  email: string,
  fullName: string,
  photoURL?: string,
  role: 'user' | 'admin' | 'agent',
  fcmToken?: string,    // For push notifications
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### reports
```javascript
{
  id: string,           // Auto-generated
  title: string,
  description: string,
  category: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  status: 'submitted' | 'verified' | 'assigned' | 'resolved',
  latitude: number,
  longitude: number,
  address?: string,
  images: string[],     // Firebase Storage URLs
  thumbnail?: string,   // Base64 thumbnail
  userId: string,       // Reporter's UID
  assignedTo?: string,  // Agent's UID
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### reportComments
```javascript
{
  id: string,
  reportId: string,
  userId: string,
  comment: string,
  createdAt: Timestamp
}
```

### statusHistory
```javascript
{
  id: string,
  reportId: string,
  status: 'submitted' | 'verified' | 'assigned' | 'resolved',
  changedBy: string,    // User UID who made the change
  notes?: string,
  createdAt: Timestamp
}
```

## Security Features

- Firebase Authentication with multiple providers
- Firestore Security Rules for data protection
- Role-based access control (user, agent, admin)
- Secure image upload with automatic compression
- Input validation and sanitization

## Performance Optimizations

- Image compression and WebP conversion
- Map marker clustering for better performance
- Lazy loading of components
- Real-time listeners with proper cleanup
- Responsive design for all devices

## Push Notifications

The app supports Firebase Cloud Messaging for real-time notifications:

1. **Setup**: VAPID key configured in environment variables
2. **Permission**: Automatic permission request on login
3. **Background**: Service worker handles background notifications
4. **Targeting**: Notifications sent based on user roles and report ownership

## Deployment

### Firebase Hosting (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

### Other Platforms
The app can be deployed to any static hosting service (Vercel, Netlify, etc.) since it's a client-side React application.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please create an issue in the GitHub repository or contact the development team.

## Troubleshooting

### Common Issues

1. **Firebase Configuration**: Ensure all environment variables are set correctly
2. **Authentication**: Check that authentication providers are enabled in Firebase Console
3. **Permissions**: Verify Firestore and Storage security rules are properly configured
4. **Location Services**: Ensure location permissions are granted in browser
5. **Push Notifications**: Check VAPID key configuration and service worker registration

### Development Tips

- Use Firebase Emulator Suite for local development
- Enable Firebase Debug mode for detailed logging
- Test security rules using Firebase Console simulator
- Monitor usage and performance in Firebase Console