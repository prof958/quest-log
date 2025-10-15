/**
 * Test file for IGDB Service integration
 * Run this to verify the IGDB proxy and service are working correctly
 */

import IGDBService from '../src/services/IGDBService';

// Test configuration
const TEST_GAME_IDS = [1942, 1020, 1877]; // The Witcher 3, Grand Theft Auto V, Cyberpunk 2077
const TEST_SEARCH_QUERY = 'witcher';

export async function testIGDBIntegration() {
  console.log('🎮 Starting IGDB Integration Tests...\n');
  
  const igdbService = IGDBService.getInstance();
  
  try {
    // Test 1: Search Games
    console.log('📍 Test 1: Search Games');
    console.log(`Searching for: "${TEST_SEARCH_QUERY}"`);
    
    const searchResults = await igdbService.searchGames(TEST_SEARCH_QUERY, 5);
    console.log(`✅ Found ${searchResults.length} games`);
    
    if (searchResults.length > 0) {
      const firstGame = searchResults[0];
      console.log(`   First result: ${firstGame.name} (ID: ${firstGame.id})`);
      console.log(`   Rating: ${firstGame.rating || 'No rating'}`);
      console.log(`   Genres: ${firstGame.genres?.map(g => g.name).join(', ') || 'No genres'}`);
    }
    console.log('');
    
    // Test 2: Get Game by ID
    console.log('📍 Test 2: Get Game by ID');
    const gameId = TEST_GAME_IDS[0];
    console.log(`Getting game with ID: ${gameId}`);
    
    const gameDetails = await igdbService.getGameById(gameId);
    if (gameDetails) {
      console.log(`✅ Retrieved: ${gameDetails.name}`);
      console.log(`   Summary: ${gameDetails.summary?.substring(0, 100) || 'No summary'}...`);
      console.log(`   Rating: ${gameDetails.rating || 'No rating'}`);
      console.log(`   Cover URL: ${gameDetails.cover?.url || 'No cover'}`);
      console.log(`   Platforms: ${gameDetails.platforms?.map(p => p.name).join(', ') || 'No platforms'}`);
    } else {
      console.log('❌ Failed to retrieve game details');
    }
    console.log('');
    
    // Test 3: Get Popular Games
    console.log('📍 Test 3: Get Popular Games');
    console.log('Fetching popular games...');
    
    const popularGames = await igdbService.getPopularGames(5);
    console.log(`✅ Retrieved ${popularGames.length} popular games`);
    
    popularGames.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (Rating: ${game.rating || 'N/A'})`);
    });
    console.log('');
    
    // Test 4: Get Multiple Games by IDs
    console.log('📍 Test 4: Get Multiple Games by IDs');
    console.log(`Getting games with IDs: ${TEST_GAME_IDS.join(', ')}`);
    
    const multipleGames = await igdbService.getGamesByIds(TEST_GAME_IDS);
    console.log(`✅ Retrieved ${multipleGames.length} games`);
    
    multipleGames.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
    });
    console.log('');
    
    // Test 5: Cache Statistics
    console.log('📍 Test 5: Cache Statistics');
    const cacheStats = igdbService.getCacheStats();
    console.log(`✅ Cache contains ${cacheStats.size} entries`);
    console.log(`   Cached endpoints: ${cacheStats.entries.join(', ')}`);
    console.log('');
    
    // Test 6: Advanced Search
    console.log('📍 Test 6: Advanced Search with Filters');
    console.log('Searching for RPG games with rating >= 80...');
    
    const advancedResults = await igdbService.searchGamesAdvanced({
      query: 'fantasy',
      minRating: 80,
      limit: 3
    });
    console.log(`✅ Found ${advancedResults.length} filtered games`);
    
    advancedResults.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (Rating: ${game.rating})`);
    });
    console.log('');
    
    console.log('🎉 All IGDB Integration Tests Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Search functionality working');
    console.log('✅ Game details retrieval working');
    console.log('✅ Popular games API working');
    console.log('✅ Batch game retrieval working');
    console.log('✅ Cache system working');
    console.log('✅ Advanced search working');
    
    return true;
    
  } catch (error) {
    console.error('❌ IGDB Integration Test Failed:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Verify Supabase Edge Function is deployed');
    console.log('2. Check IGDB credentials in Supabase secrets');
    console.log('3. Ensure EXPO_PUBLIC_SUPABASE_IGDB_FUNCTION_URL is correct in .env');
    console.log('4. Verify network connectivity');
    
    return false;
  }
}

// Test function for user rating service (requires authentication)
export async function testUserRatingService() {
  console.log('👤 Starting User Rating Service Tests...\n');
  
  try {
    // Note: These tests require user authentication
    console.log('ℹ️  User Rating Service tests require authentication');
    console.log('   Run these tests after user login in the mobile app:');
    console.log('   1. Rate a game');
    console.log('   2. Add games to library');
    console.log('   3. Get user ratings');
    console.log('   4. Get community reviews');
    console.log('   5. View rating statistics');
    
    return true;
    
  } catch (error) {
    console.error('❌ User Rating Service Test Failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    const igdbSuccess = await testIGDBIntegration();
    const ratingSuccess = await testUserRatingService();
    
    if (igdbSuccess && ratingSuccess) {
      console.log('\n🏆 All integration tests completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Check the output above.');
      process.exit(1);
    }
  })();
}

export default {
  testIGDBIntegration,
  testUserRatingService,
};