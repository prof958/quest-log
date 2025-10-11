# QuestLog

**"Letterboxd for Games"** - A gamified video game journal and tracker with a retro handheld console aesthetic.

## Features

- 🎮 **Game Logging**: Track games played with detailed entries
- ⭐ **XP System**: Earn experience points for activities  
- 🎯 **Quest System**: Complete challenges and objectives
- 📈 **Leveling**: Progress through levels based on XP
- 🏆 **Badge Collection**: Unlock achievements and collectibles
- 📊 **Progress Tracking**: Monitor gaming habits and statistics
- 🔐 **Authentication**: Email/password and Google OAuth support

## Tech Stack

- **Frontend**: React Native with Expo (mobile-first, web-compatible)
- **Backend**: Supabase (database, auth, real-time)
- **Game Data**: RAWG API integration
- **Styling**: Custom retro theme system

## Documentation

- 📱 **[Database Setup](docs/DATABASE_QUICK_SETUP.md)** - Quick database configuration
- 🔐 **[OAuth Setup](docs/OAUTH_SETUP.md)** - Authentication provider setup
- 🔑 **[OAuth Configuration](docs/OAUTH_CONFIGURATION.md)** - Detailed OAuth implementation guide
- 🗄️ **[Supabase Setup](docs/SUPABASE_SETUP.md)** - Backend configuration

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/prof958/quest-log.git
   cd quest-log/QuestLogApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run web    # For web development
   npm start      # For mobile development
   ```

## Development Status

✅ **Completed**
- Authentication system (email/password + Google OAuth)
- Web platform support
- Retro UI foundation
- Database schema and setup

🔄 **In Progress**
- Game logging functionality
- XP and quest systems

📋 **Planned**
- RAWG API integration
- Badge system
- Social features

## Contributing

This project follows a mobile-first, iterative development approach. Check the [memory-bank](memory-bank/) directory for detailed project context and progress tracking.