# QuestLog Documentation Index

## Project Overview
- [`README.md`](../README.md) - Main project overview and getting started guide

## Setup & Configuration
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) - Complete Supabase project setup instructions
- [`SETUP_INSTRUCTIONS.md`](SETUP_INSTRUCTIONS.md) - Development environment setup
- [`DATABASE_QUICK_SETUP.md`](DATABASE_QUICK_SETUP.md) - Database schema and migrations

## Authentication
- [`OAUTH_PRODUCTION_GUIDE.md`](OAUTH_PRODUCTION_GUIDE.md) - **📋 Complete OAuth production deployment guide**
- [`OAUTH_SETUP.md`](OAUTH_SETUP.md) - OAuth provider configuration
- [`OAUTH_CONFIGURATION.md`](OAUTH_CONFIGURATION.md) - Detailed OAuth implementation
- [`OAUTH_QUICK_REFERENCE.md`](OAUTH_QUICK_REFERENCE.md) - Quick OAuth setup reference
- [`OAUTH_TROUBLESHOOTING.md`](OAUTH_TROUBLESHOOTING.md) - Common OAuth issues and solutions
- [`MOBILE_OAUTH_SETUP.md`](MOBILE_OAUTH_SETUP.md) - Mobile-specific OAuth configuration

## Database & API Integration
- [`database_schema.sql`](database_schema.sql) - Complete database schema
- [`SUPABASE_SECURITY_FIXES_VERIFICATION.sql`](SUPABASE_SECURITY_FIXES_VERIFICATION.sql) - Security verification queries

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

## Quick Start for New Developers

1. **Setup Environment**: Follow [`SETUP_INSTRUCTIONS.md`](SETUP_INSTRUCTIONS.md)
2. **Configure Supabase**: Use [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) 
3. **Setup OAuth**: Follow [`OAUTH_SETUP.md`](OAUTH_SETUP.md)
4. **Review Architecture**: Read [`memory-bank/systemPatterns.md`](../memory-bank/systemPatterns.md)
5. **Check Progress**: See [`memory-bank/progress.md`](../memory-bank/progress.md) for current status

## Production Deployment

For production deployment, especially OAuth configuration, refer to:
- **[`OAUTH_PRODUCTION_GUIDE.md`](OAUTH_PRODUCTION_GUIDE.md)** - Comprehensive production setup guide
- App store configuration requirements
- Environment variable setup
- URL configuration for production domains

---

*Last updated: October 2025*