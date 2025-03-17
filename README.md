# Memory Card Game

A multiplayer memory card game built with Next.js, Three.js, and Firebase. This game allows users to log in with their Google accounts, play against friends in real-time, and progress through various difficulty levels.

## Features

- **User Authentication**: Google login functionality using Firebase Authentication
- **Real-time Multiplayer**: Play against friends in real-time using Firebase Realtime Database
- **3D Card Animations**: Beautiful card flipping animations using Three.js
- **Multiple Difficulty Levels**: 
  - Easy: 16 cards (8 pairs)
  - Medium: 36 cards (18 pairs)
  - Hard: 64 cards (32 pairs)
  - Tough: 100 cards (50 pairs)
  - Genius: 120 cards (60 pairs) with subtle color variations
- **Game Invitation System**: Generate unique links to invite friends to play
- **Score Tracking**: Keep track of scores and game statistics

## Technologies Used

- **Next.js**: React framework for building the user interface
- **TypeScript**: For type-safe code
- **Three.js**: For 3D rendering of cards
- **@react-three/fiber & @react-three/drei**: React components for Three.js
- **Firebase**: For authentication, database, and hosting
- **Tailwind CSS**: For styling

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/memory-game.git
   cd memory-game
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication with Google provider
   - Create a Firestore database
   - Create a Realtime Database
   - Get your Firebase configuration

4. Create a `.env.local` file in the root directory and add your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-database-url
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the game.

## How to Play

1. Sign in with your Google account
2. Create a new game by selecting a difficulty level
3. Share the generated game ID with a friend
4. Your friend can join the game by entering the game ID
5. Take turns flipping cards to find matching pairs
6. The player with the most matches wins

## Deployment

The game can be deployed to Vercel or any other hosting platform that supports Next.js:

```bash
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Three.js](https://threejs.org/)
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
