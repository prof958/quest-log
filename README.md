# QuestLog 🎮

**"Letterboxd for Games"** - A gamified video game journal and tracker with comprehensive game database integration and community features.

[![IGDB Integration](https://img.shields.io/badge/IGDB-500k%2B%20Games-brightgreen)](https://www.igdb.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com)
[![React Native](https://img.shields.io/badge/React%20Native-Mobile%20First-blue)](https://reactnative.dev)

## 🎉 **Major Update: IGDB Integration Complete!**

QuestLog now features **full IGDB API integration** providing access to **500k+ games** with professional ratings, rich metadata, and comprehensive search capabilities.

## ✨ Features

### 🎮 **Game Discovery & Management**
- **🔍 Comprehensive Search**: Access to 500k+ games from IGDB database
- **⭐ Professional Ratings**: IGDB ratings with detailed game metadata
- **🖼️ Rich Media**: Cover art, screenshots, videos, and game information
- **📱 Popular Games**: Trending games with community and professional ratings
- **🎯 Advanced Filters**: Search by genres, platforms, release dates, ratings

### 👥 **Community Features** 
- **⭐ User Ratings**: 1-10 scale ratings separate from professional scores
- **✍️ Reviews**: Write and read community game reviews
- **📚 Personal Library**: Track games by status (playing, completed, plan to play, dropped)
- **📊 Community Stats**: Rating distributions and popular community picks
- **🏆 Progress Tracking**: Hours played and completion status

### 🔐 **Authentication & Data**
- **📧 Email/Password**: Traditional authentication support
- **🔗 Google OAuth**: Quick sign-in with Google integration
- **🔒 Secure Data**: Row-level security with Supabase
- **☁️ Cloud Sync**: All data synchronized across devices

### 📱 **Mobile-First Design**
- **📱 React Native**: Cross-platform mobile app with web support
- **⚡ Performance**: Intelligent caching and offline support
- **🎨 Retro Aesthetic**: Custom retro handheld console-inspired UI
- **📱 Responsive**: Optimized for mobile devices with web compatibility

## 🏗️ Tech Stack

- **Frontend**: React Native with Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Real-time)
- **Game Data**: IGDB API via Supabase Edge Functions (500k+ games)
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **API Proxy**: Supabase Edge Functions for CORS and authentication
- **Caching**: Multi-layer caching for mobile performance
- **Styling**: Custom retro theme system

## 📚 Documentation

### 🚀 **Setup & Configuration**
- 📱 **[Database Setup](docs/DATABASE_QUICK_SETUP.md)** - Quick database configuration
- 🔐 **[OAuth Setup](docs/OAUTH_SETUP.md)** - Authentication provider setup  
- 🔑 **[OAuth Configuration](docs/OAUTH_CONFIGURATION.md)** - Detailed OAuth implementation
- 🗄️ **[Supabase Setup](docs/SUPABASE_SETUP.md)** - Backend configuration
- 📋 **[Setup Instructions](docs/SETUP_INSTRUCTIONS.md)** - Complete deployment guide

### 🎮 **IGDB Integration**
- 🏗️ **[IGDB Architecture](docs/IGDB_INTEGRATION_ARCHITECTURE.md)** - Technical implementation details
- 🗃️ **[Database Migration](docs/user_rating_database_setup.sql)** - User rating system setup
- ✅ **[Implementation Success](IGDB_IMPLEMENTATION_SUCCESS.md)** - Complete achievement summary

### 📖 **Project Context**
- 🧠 **[Memory Bank](memory-bank/)** - Project documentation and progress tracking
- 📊 **[Project Brief](memory-bank/projectbrief.md)** - Core vision and goals  
- 🎯 **[Active Context](memory-bank/activeContext.md)** - Current development focus
- 📈 **[Progress](memory-bank/progress.md)** - Development milestones and status

## 🚀 Quick Start

### 📋 Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- IGDB API credentials (Twitch Developer account)

### 1️⃣ **Clone & Install**
```bash
git clone https://github.com/prof958/quest-log.git
cd quest-log/QuestLogApp
npm install
```

### 2️⃣ **Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Add your credentials to .env:
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
EXPO_PUBLIC_IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret
EXPO_PUBLIC_SUPABASE_IGDB_FUNCTION_URL=your_edge_function_url
```

### 3️⃣ **Setup Database**
1. Create Supabase project
2. Run SQL migration from `docs/user_rating_database_setup.sql`
3. Deploy Edge Function: `npx supabase functions deploy igdb-proxy`
4. Set secrets: `npx supabase secrets set IGDB_CLIENT_ID=xxx IGDB_CLIENT_SECRET=xxx`

### 4️⃣ **Start Development**
```bash
npm start      # Mobile development with Expo
npm run web    # Web development (for testing)
```

### 5️⃣ **Access the App**
- 📱 **Mobile**: Scan QR code with Expo Go
- 🌐 **Web**: Open http://localhost:8081
- 🎮 **Features**: Search 500k+ games, add ratings, manage library

## 🎯 Development Status

### ✅ **Completed & Working** 
- **🎮 IGDB Integration**: Full access to 500k+ games database
- **🔐 Authentication**: Email/password + Google OAuth
- **📱 Mobile Architecture**: React Native with web support  
- **☁️ Backend Infrastructure**: Supabase with Edge Functions
- **🗃️ User Rating System**: Database schema with RLS policies
- **🔍 Game Search**: Real-time search across comprehensive database
- **⭐ Popular Games**: Trending games with ratings and metadata
- **🎨 Retro UI**: Custom handheld console-inspired design

### 🔄 **In Progress**
- **📄 GameDetailsScreen**: Comprehensive game information display
- **👥 Community Features**: User reviews and rating integration

### 📋 **Next Phase**
- **🎯 Quest System**: Gaming challenges and objectives
- **⭐ XP System**: Experience points and leveling
- **🏆 Achievement System**: Badges and collectibles  
- **📊 Advanced Analytics**: Gaming statistics and insights
- **📱 Mobile Deployment**: App store distribution

## 🏗️ Architecture

```
React Native App (IGDBService)
    ↓ HTTPS API Calls
Supabase Edge Function (igdb-proxy)  
    ↓ Authenticated Requests
IGDB API (500k+ Games Database)
    ↓ Rich Game Metadata
User Rating System (Supabase Database)
    ↓ Enhanced Gaming Experience
Mobile-Optimized Game Discovery Platform
```

## 📊 Current Capabilities

- ✅ **Search Games**: Real-time search across IGDB's full database
- ✅ **Browse Popular**: Dynamic popular games with professional ratings
- ✅ **Rich Metadata**: Cover art, genres, release dates, ratings, summaries  
- ✅ **Mobile Optimized**: Caching, error handling, performance optimization
- ✅ **User Authentication**: Secure login with profile management
- ✅ **Community Ready**: Database foundation for ratings and reviews

## 🤝 Contributing

This project follows a **mobile-first, iterative development** approach with comprehensive documentation:

- 📋 **Planning**: Check [memory-bank](memory-bank/) for project context
- 🎯 **Current Focus**: See [activeContext.md](memory-bank/activeContext.md)
- 📈 **Progress**: Track milestones in [progress.md](memory-bank/progress.md)
- 🏗️ **Architecture**: Review [systemPatterns.md](memory-bank/systemPatterns.md)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**QuestLog** - Track your gaming journey with professional data and community features! 🎮✨