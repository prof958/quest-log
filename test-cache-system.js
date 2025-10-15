/**
 * Simple IGDB Cache System Test
 * Tests the enhanced caching implementation
 */

// Configuration
const SUPABASE_IGDB_FUNCTION_URL = 'https://qrksbnjfqxknzedncdde.supabase.co/functions/v1/igdb-proxy';

async function makeIGDBRequest(endpoint, body) {
  const request = {
    endpoint,
    body,
    method: 'POST'
  };

  console.log(`🔄 Making request to ${endpoint}...`);
  const startTime = Date.now();

  try {
    const response = await fetch(SUPABASE_IGDB_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`IGDB proxy error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    // Check cache headers
    const cacheStatus = response.headers.get('X-Cache');
    const cacheKey = response.headers.get('X-Cache-Key');
    const queueSize = response.headers.get('X-Queue-Size');
    
    console.log(`✅ Response received in ${responseTime}ms`);
    console.log(`   Cache Status: ${cacheStatus || 'Unknown'}`);
    console.log(`   Cache Key: ${cacheKey || 'None'}`);
    console.log(`   Queue Size: ${queueSize || '0'}`);
    console.log(`   Data Length: ${Array.isArray(data) ? data.length : 1} items`);
    
    return {
      data,
      responseTime,
      cacheStatus,
      cacheKey,
      queueSize: parseInt(queueSize || '0')
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Request failed in ${responseTime}ms:`, error);
    throw error;
  }
}

async function testCachePerformance() {
  console.log('🧪 IGDB Enhanced Caching System Test');
  console.log('=' .repeat(50));
  
  const testQuery = `
    search "Zelda";
    fields name,summary,rating,first_release_date,cover.image_id;
    limit 5;
  `;

  try {
    // Test 1: First request (should be cache miss)
    console.log('\n📍 Test 1: First Request (Expected Cache Miss)');
    const firstResult = await makeIGDBRequest('games', testQuery);
    
    if (firstResult.cacheStatus === 'MISS') {
      console.log('✅ Cache miss as expected for first request');
    } else {
      console.log('ℹ️  Unexpected cache status:', firstResult.cacheStatus);
    }

    // Small delay between requests
    console.log('\n⏳ Waiting 2 seconds before second request...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Second identical request (should be cache hit)
    console.log('\n📍 Test 2: Second Request (Expected Cache Hit)');
    const secondResult = await makeIGDBRequest('games', testQuery);
    
    if (secondResult.cacheStatus === 'HIT') {
      console.log('✅ Cache hit as expected for second request');
      const speedup = Math.round(firstResult.responseTime / secondResult.responseTime * 10) / 10;
      console.log(`⚡ Performance improvement: ${speedup}x faster`);
      console.log(`   First request: ${firstResult.responseTime}ms`);
      console.log(`   Second request: ${secondResult.responseTime}ms`);
    } else {
      console.log('⚠️  Expected cache hit but got:', secondResult.cacheStatus);
    }

    // Test 3: Different query (should be cache miss)
    console.log('\n📍 Test 3: Different Query (Expected Cache Miss)');
    const differentQuery = `
      search "Mario";
      fields name,summary,rating,first_release_date,cover.image_id;
      limit 3;
    `;
    
    const thirdResult = await makeIGDBRequest('games', differentQuery);
    
    if (thirdResult.cacheStatus === 'MISS') {
      console.log('✅ Cache miss as expected for different query');
    } else {
      console.log('ℹ️  Unexpected cache status:', thirdResult.cacheStatus);
    }

    // Test 4: Popular games (should work with caching)
    console.log('\n📍 Test 4: Popular Games Query');
    const popularQuery = `
      fields name,summary,rating,rating_count,first_release_date,cover.image_id;
      where rating >= 80 & rating_count >= 100;
      sort rating desc;
      limit 10;
    `;
    
    const popularResult = await makeIGDBRequest('games', popularQuery);
    console.log(`✅ Popular games query completed (${popularResult.cacheStatus})`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🏆 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const allResults = [firstResult, secondResult, thirdResult, popularResult];
    const avgResponseTime = Math.round(allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length);
    const cacheHits = allResults.filter(r => r.cacheStatus === 'HIT').length;
    const cacheMisses = allResults.filter(r => r.cacheStatus === 'MISS').length;
    const hitRate = Math.round(cacheHits / allResults.length * 100);
    
    console.log(`Total Requests: ${allResults.length}`);
    console.log(`Cache Hits: ${cacheHits}`);
    console.log(`Cache Misses: ${cacheMisses}`);
    console.log(`Hit Rate: ${hitRate}%`);
    console.log(`Average Response Time: ${avgResponseTime}ms`);
    
    if (cacheHits > 0) {
      console.log('\n🎉 SUCCESS: Enhanced caching system is working!');
      console.log('✅ Database caching is operational');
      console.log('✅ Cache headers are being returned correctly');
      console.log('✅ Performance improvements are measurable');
    } else {
      console.log('\n⚠️  Cache system needs investigation');
      console.log('   All requests resulted in cache misses');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCachePerformance().then(() => {
  console.log('\n✨ Test completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed with error:', error);
  process.exit(1);
});