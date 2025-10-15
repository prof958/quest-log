/**
 * Simple IGDB Test - Add this to any React Native screen temporarily to test
 * 
 * Instructions:
 * 1. Copy this code into any React Native component (like GameSearchScreen)
 * 2. Call testIGDB() in useEffect or button press
 * 3. Check the console logs for results
 */

import IGDBService from '../services/IGDBService';

export const testIGDB = async () => {
  console.log('🧪 Starting IGDB Integration Test...');
  
  try {
    const igdbService = IGDBService.getInstance();
    
    // Test popular games (should work without search query)
    console.log('📋 Testing getPopularGames...');
    const popularGames = await igdbService.getPopularGames(3);
    console.log(`✅ Popular games loaded: ${popularGames.length}`);
    
    if (popularGames.length > 0) {
      popularGames.forEach((game, i) => {
        console.log(`   ${i + 1}. ${game.name} (Rating: ${game.rating || 'N/A'})`);
      });
    } else {
      console.log('❌ No popular games returned - check Edge Function');
    }
    
    // Test search
    console.log('📋 Testing searchGames...');
    const searchResults = await igdbService.searchGames('Mario', 2);
    console.log(`✅ Search results: ${searchResults.length}`);
    
    if (searchResults.length > 0) {
      searchResults.forEach((game, i) => {
        console.log(`   ${i + 1}. ${game.name}`);
      });
    } else {
      console.log('❌ No search results - check Edge Function or search query');
    }
    
    console.log('🎉 IGDB Test Completed!');
    return true;
    
  } catch (error) {
    console.error('❌ IGDB Test Failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('   Error details:', errorMessage);
    
    if (errorMessage.includes('IGDB proxy')) {
      console.error('   → Check Edge Function deployment and secrets');
    } else if (errorMessage.includes('network')) {
      console.error('   → Check internet connection');
    } else {
      console.error('   → Check console for detailed error info');
    }
    
    return false;
  }
};

// Test function you can call from React Native component:
// import { testIGDB } from './path/to/this/file';
// 
// // In your component:
// useEffect(() => {
//   testIGDB();
// }, []);
//
// // Or add a test button:
// <TouchableOpacity onPress={() => testIGDB()}>
//   <Text>Test IGDB</Text>
// </TouchableOpacity>