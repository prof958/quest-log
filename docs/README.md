# QuestLog Documentation Index

## Project Overview
- [`README.md`](../README.md) - Main project overview and getting started guide

## 🚀 Setup & Configuration
- [`setup/SUPABASE_SETUP.md`](setup/SUPABASE_SETUP.md) - Complete Supabase project setup instructions
- [`setup/SETUP_INSTRUCTIONS.md`](setup/SETUP_INSTRUCTIONS.md) - Development environment setup
- [`setup/DATABASE_QUICK_SETUP.md`](setup/DATABASE_QUICK_SETUP.md) - Database schema and migrations

## 🔐 Authentication
- [`oauth/OAUTH_PRODUCTION_GUIDE.md`](oauth/OAUTH_PRODUCTION_GUIDE.md) - **📋 Complete OAuth production deployment guide**
- [`oauth/OAUTH_SETUP.md`](oauth/OAUTH_SETUP.md) - OAuth provider configuration
- [`oauth/OAUTH_CONFIGURATION.md`](oauth/OAUTH_CONFIGURATION.md) - Detailed OAuth implementation
- [`oauth/OAUTH_QUICK_REFERENCE.md`](oauth/OAUTH_QUICK_REFERENCE.md) - Quick OAuth setup reference
- [`oauth/OAUTH_TROUBLESHOOTING.md`](oauth/OAUTH_TROUBLESHOOTING.md) - Common OAuth issues and solutions
- [`oauth/MOBILE_OAUTH_SETUP.md`](oauth/MOBILE_OAUTH_SETUP.md) - Mobile-specific OAuth configuration

## 🗄️ Database & SQL
- [`sql/database_schema.sql`](sql/database_schema.sql) - Complete database schema
- [`sql/COMPLETE_FIX_NEW_USER_OAUTH.sql`](sql/COMPLETE_FIX_NEW_USER_OAUTH.sql) - **✅ Working OAuth user creation fix**
- [`sql/user_rating_database_setup.sql`](sql/user_rating_database_setup.sql) - User rating system tables
- [`sql/igdb_cache_system_migration.sql`](sql/igdb_cache_system_migration.sql) - IGDB caching system
- [`sql/SUPABASE_SECURITY_FIXES_VERIFICATION.sql`](sql/SUPABASE_SECURITY_FIXES_VERIFICATION.sql) - Security verification queries

## 🏗️ Architecture & Implementation
- [`database/IGDB_INTEGRATION_ARCHITECTURE.md`](database/IGDB_INTEGRATION_ARCHITECTURE.md) - IGDB API architecture
- [`database/IGDB_RATE_LIMITING_STRATEGY.md`](database/IGDB_RATE_LIMITING_STRATEGY.md) - Rate limiting implementation
- [`database/ENHANCED_CACHING_IMPLEMENTATION.md`](database/ENHANCED_CACHING_IMPLEMENTATION.md) - Caching system details

## Project Milestones & Architecture
- [`IGDB_IMPLEMENTATION_SUCCESS.md`](IGDB_IMPLEMENTATION_SUCCESS.md) - IGDB API integration milestone
- [`ENHANCED_CACHING_MILESTONE.md`](ENHANCED_CACHING_MILESTONE.md) - Caching system implementation
- [`api-research.md`](api-research.md) - API research and decisions

## Testing & Quality Assurance
- [`testing/`](testing/) - Testing utilities and scripts
  - [`test-cache-system.js`](testing/test-cache-system.js) - Cache system testing
  - [`Test-IGDBCache.ps1`](testing/Test-IGDBCache.ps1) - PowerShell cache testing

## Memory Bank (Development Context)
The [`memory-bank/`](../memory-bank/) directory contains development context and project evolution:
- [`projectbrief.md`](../memory-bank/projectbrief.md) - Core project requirements
- [`productContext.md`](../memory-bank/productContext.md) - Product vision and goals  
- [`activeContext.md`](../memory-bank/activeContext.md) - Current development focus
- [`systemPatterns.md`](../memory-bank/systemPatterns.md) - Architecture and patterns
- [`techContext.md`](../memory-bank/techContext.md) - Technology stack details
- [`progress.md`](../memory-bank/progress.md) - Development progress tracking

## Key Implementation Files

### Authentication System
- `QuestLogApp/src/services/AuthService.ts` - Authentication service with mobile OAuth
- `QuestLogApp/src/context/AuthContext.tsx` - Global authentication state
- `QuestLogApp/src/screens/LoginScreen.tsx` - Login interface with OAuth

### Game Data Integration  
- `QuestLogApp/src/services/IGDBService.ts` - IGDB API integration
- `QuestLogApp/src/screens/GameSearchScreen.tsx` - Game search interface
- `supabase/functions/igdb-proxy/` - Edge Function for IGDB API proxy

### Core Configuration
- `QuestLogApp/src/lib/supabase.ts` - Supabase client configuration
- `QuestLogApp/app.json` - Expo app configuration with OAuth scheme

---

## 🚀 Quick Start for New Developers

1. **Setup Environment**: Follow [`setup/SETUP_INSTRUCTIONS.md`](setup/SETUP_INSTRUCTIONS.md)
2. **Configure Supabase**: Use [`setup/SUPABASE_SETUP.md`](setup/SUPABASE_SETUP.md) 
3. **Setup OAuth**: Follow [`oauth/OAUTH_SETUP.md`](oauth/OAUTH_SETUP.md)
4. **Run SQL Setup**: Execute [`sql/database_schema.sql`](sql/database_schema.sql) in Supabase
5. **Fix New User OAuth**: Run [`sql/COMPLETE_FIX_NEW_USER_OAUTH.sql`](sql/COMPLETE_FIX_NEW_USER_OAUTH.sql)
6. **Review Architecture**: Read [`memory-bank/systemPatterns.md`](../memory-bank/systemPatterns.md)

## 🚀 Production Deployment

For production deployment, especially OAuth configuration, refer to:
- **[`oauth/OAUTH_PRODUCTION_GUIDE.md`](oauth/OAUTH_PRODUCTION_GUIDE.md)** - Comprehensive production setup guide
- App store configuration requirements
- Environment variable setup
- URL configuration for production domains

---

*Last updated: October 2025*