/**
 * IGDB Cache System Test Script
 * Verifies the enhanced caching implementation
 */

import { IGDBService } from '../src/services/IGDBService';

interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  performance?: {
    responseTime: number;
    cacheStatus?: string;
  };
}

class IGDBCacheTest {
  private igdbService: IGDBService;
  private testResults: TestResult[] = [];

  constructor() {
    this.igdbService = IGDBService.getInstance();
  }

  private async measurePerformance<T>(
    testName: string,
    testFunction: () => Promise<T>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFunction();
      const responseTime = Date.now() - startTime;
      
      return {
        test: testName,
        success: true,
        performance: {
          responseTime,
        }
      };
    } catch (error) {
      return {
        test: testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: {
          responseTime: Date.now() - startTime,
        }
      };
    }
  }

  /**
   * Test 1: Basic search functionality
   */
  async testBasicSearch(): Promise<TestResult> {
    return this.measurePerformance('Basic Search', async () => {
      const results = await this.igdbService.searchGames('Zelda', 5);
      if (!results || results.length === 0) {
        throw new Error('No search results returned');
      }
      console.log(`✅ Search returned ${results.length} games`);
    });
  }

  /**
   * Test 2: Cache hit performance (same search twice)
   */
  async testCacheHit(): Promise<TestResult> {
    console.log('🔄 Testing cache performance...');
    
    // First request (should be cache miss)
    const firstResult = await this.measurePerformance('First Request', async () => {
      await this.igdbService.searchGames('Mario', 3);
    });

    // Second request (should be cache hit)
    const secondResult = await this.measurePerformance('Second Request (Cache Hit)', async () => {
      await this.igdbService.searchGames('Mario', 3);
    });

    const performanceImprovement = firstResult.performance!.responseTime / secondResult.performance!.responseTime;
    
    console.log(`📊 Performance improvement: ${performanceImprovement.toFixed(1)}x faster`);
    console.log(`   First request: ${firstResult.performance!.responseTime}ms`);
    console.log(`   Second request: ${secondResult.performance!.responseTime}ms`);

    if (performanceImprovement < 2) {
      return {
        test: 'Cache Hit Performance',
        success: false,
        error: `Expected 2x+ improvement, got ${performanceImprovement.toFixed(1)}x`
      };
    }

    return {
      test: 'Cache Hit Performance',
      success: true,
      performance: {
        responseTime: secondResult.performance!.responseTime,
      }
    };
  }

  /**
   * Test 3: Popular games
   */
  async testPopularGames(): Promise<TestResult> {
    return this.measurePerformance('Popular Games', async () => {
      const results = await this.igdbService.getPopularGames(10);
      if (!results || results.length === 0) {
        throw new Error('No popular games returned');
      }
      console.log(`✅ Popular games returned ${results.length} games`);
    });
  }

  /**
   * Test 4: Trending games  
   */
  async testTrendingGames(): Promise<TestResult> {
    return this.measurePerformance('Trending Games', async () => {
      const results = await this.igdbService.getTrendingGames(5);
      console.log(`✅ Trending games returned ${results.length} games`);
    });
  }

  /**
   * Test 5: Game details with full data
   */
  async testGameDetails(): Promise<TestResult> {
    return this.measurePerformance('Game Details', async () => {
      // Use a known game ID (The Legend of Zelda: Breath of the Wild)
      const gameId = 7346;
      const game = await this.igdbService.getGameDetails(gameId);
      
      if (!game || !game.name) {
        throw new Error('Game details not returned properly');
      }
      
      console.log(`✅ Game details for: ${game.name}`);
      console.log(`   Summary: ${game.summary?.substring(0, 100)}...`);
      console.log(`   Rating: ${game.rating || 'N/A'}`);
    });
  }

  /**
   * Test 6: Cache statistics
   */
  async testCacheStatistics(): Promise<TestResult> {
    return this.measurePerformance('Cache Statistics', async () => {
      const stats = this.igdbService.getCacheStats();
      
      console.log('📊 Cache Statistics:');
      console.log(`   Total Requests: ${stats.totalRequests}`);
      console.log(`   Hit Rate: ${stats.hitRate}%`);
      console.log(`   Client Cache Hits: ${stats.hits}`);
      console.log(`   Server Cache Hits: ${stats.serverCacheHits}`);
      console.log(`   Cache Misses: ${stats.misses}`);
      console.log(`   Average Response Time: ${stats.avgResponseTime}ms`);
      console.log(`   Local Cache Size: ${stats.localCacheSize} entries`);
      console.log(`   Efficiency: ${stats.efficiency}`);

      if (stats.totalRequests === 0) {
        throw new Error('No requests recorded in cache statistics');
      }
    });
  }

  /**
   * Test 7: Concurrent requests (rate limiting test)
   */
  async testConcurrentRequests(): Promise<TestResult> {
    console.log('🚀 Testing concurrent requests...');
    
    const startTime = Date.now();
    
    const promises = [
      this.igdbService.searchGames('Pokemon', 3),
      this.igdbService.searchGames('FIFA', 3),
      this.igdbService.searchGames('Call of Duty', 3),
      this.igdbService.getPopularGames(5),
      this.igdbService.getTrendingGames(3),
    ];

    try {
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const totalGames = results.reduce((sum, result) => sum + (Array.isArray(result) ? result.length : 0), 0);
      
      console.log(`✅ Concurrent requests completed in ${totalTime}ms`);
      console.log(`   Total games retrieved: ${totalGames}`);
      console.log(`   Average time per request: ${Math.round(totalTime / promises.length)}ms`);

      return {
        test: 'Concurrent Requests',
        success: true,
        performance: {
          responseTime: totalTime,
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting IGDB Cache System Tests\n');
    console.log('=' .repeat(50));

    // Clear cache to start fresh
    this.igdbService.clearCache();

    const tests = [
      () => this.testBasicSearch(),
      () => this.testCacheHit(),
      () => this.testPopularGames(),
      () => this.testTrendingGames(),
      () => this.testGameDetails(),
      () => this.testConcurrentRequests(),
      () => this.testCacheStatistics(),
    ];

    let passedTests = 0;
    let totalResponseTime = 0;

    for (const test of tests) {
      try {
        console.log('\n' + '-'.repeat(30));
        const result = await test();
        this.testResults.push(result);
        
        if (result.success) {
          passedTests++;
          console.log(`✅ ${result.test}: PASSED (${result.performance?.responseTime}ms)`);
        } else {
          console.log(`❌ ${result.test}: FAILED - ${result.error}`);
        }
        
        if (result.performance) {
          totalResponseTime += result.performance.responseTime;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`❌ Test failed with exception: ${error}`);
        this.testResults.push({
          test: 'Unknown Test',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Final results
    console.log('\n' + '='.repeat(50));
    console.log('🏆 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Tests Passed: ${passedTests}/${tests.length}`);
    console.log(`Success Rate: ${Math.round(passedTests / tests.length * 100)}%`);
    console.log(`Total Response Time: ${totalResponseTime}ms`);
    console.log(`Average Response Time: ${Math.round(totalResponseTime / tests.length)}ms`);

    // Final cache statistics
    console.log('\n📊 FINAL CACHE STATISTICS:');
    const finalStats = this.igdbService.getCacheStats();
    console.log(`Cache Hit Rate: ${finalStats.hitRate}%`);
    console.log(`Total Requests: ${finalStats.totalRequests}`);
    console.log(`API Calls Saved: ${finalStats.hits + finalStats.serverCacheHits}`);
    console.log(`Efficiency Rating: ${finalStats.efficiency}`);

    if (passedTests === tests.length && parseFloat(finalStats.hitRate) > 50) {
      console.log('\n🎉 ALL TESTS PASSED! Cache system is working optimally.');
    } else {
      console.log('\n⚠️  Some tests failed or cache performance is below expectations.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testRunner = new IGDBCacheTest();
  testRunner.runAllTests().catch(console.error);
}

export default IGDBCacheTest;