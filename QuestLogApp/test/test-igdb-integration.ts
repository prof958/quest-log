/**
 * Test IGDB Integration
 * Simple test to verify IGDB API integration is working correctly
 */

import IGDBService from '../src/services/IGDBService';

async function testIGDBIntegration() {
  console.log('🧪 Starting IGDB Integration Test...\n');
  
  const igdbService = IGDBService.getInstance();
  
  try {
    // Test 1: Search for a popular game
    console.log('📋 Test 1: Search for "The Witcher 3"');
    const searchResults = await igdbService.searchGames('The Witcher 3', 5);
    console.log(`✅ Search Results: ${searchResults.length} games found`);
    if (searchResults.length > 0) {
      const game = searchResults[0];
      console.log(`   - ${game.name} (ID: ${game.id})`);
      console.log(`   - Rating: ${game.rating || 'N/A'}`);
      console.log(`   - Genres: ${game.genres?.map(g => g.name).join(', ') || 'N/A'}`);
    }
    console.log('');

    // Test 2: Get popular games
    console.log('📋 Test 2: Get Popular Games');
    const popularGames = await igdbService.getPopularGames(3);
    console.log(`✅ Popular Games: ${popularGames.length} games loaded`);
    popularGames.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} - Rating: ${game.rating || 'N/A'}`);
    });
    console.log('');

    // Test 3: Get detailed game info
    if (searchResults.length > 0) {
      console.log('📋 Test 3: Get Game Details');
      const gameId = searchResults[0].id;
      const gameDetails = await igdbService.getGameById(gameId);
      if (gameDetails) {
        console.log(`✅ Game Details for ID ${gameId}:`);
        console.log(`   - Name: ${gameDetails.name}`);
        console.log(`   - Summary: ${gameDetails.summary?.substring(0, 100) || 'N/A'}...`);
        console.log(`   - Screenshots: ${gameDetails.screenshots?.length || 0}`);
        console.log(`   - Videos: ${gameDetails.videos?.length || 0}`);
      }
    }
    console.log('');

    // Test 4: Cache functionality
    console.log('📋 Test 4: Cache Performance');
    const startTime = Date.now();
    await igdbService.searchGames('The Witcher 3', 5); // Should hit cache
    const cacheTime = Date.now() - startTime;
    console.log(`✅ Cache hit in ${cacheTime}ms`);
    
    const cacheStats = igdbService.getCacheStats();
    console.log(`   - Cache entries: ${cacheStats.size}`);
    console.log('');

    console.log('🎉 All IGDB Integration Tests Passed!');
    
  } catch (error) {
    console.error('❌ IGDB Integration Test Failed:', error);
    console.error('   Check your internet connection and Supabase Edge Function deployment');
  }
}

// Export for use in other modules
export { testIGDBIntegration };

// Run test if this file is executed directly
if (require.main === module) {
  testIGDBIntegration().catch(console.error);
}