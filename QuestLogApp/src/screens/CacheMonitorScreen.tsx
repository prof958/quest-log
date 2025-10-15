import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { IGDBService } from '../services/IGDBService';

/**
 * Cache Performance Monitor
 * Shows real-time cache statistics and performance metrics
 */
export const CacheMonitorScreen: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCacheStats = async () => {
    try {
      const igdbService = IGDBService.getInstance();
      const stats = igdbService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCacheStats();
    setRefreshing(false);
  };

  const clearCache = async () => {
    try {
      const igdbService = IGDBService.getInstance();
      igdbService.clearCache();
      await loadCacheStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  useEffect(() => {
    loadCacheStats();
    const interval = setInterval(loadCacheStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!cacheStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading cache statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>IGDB Cache Performance</Text>
      
      {/* Overall Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Performance</Text>
        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: getEfficiencyColor(cacheStats.efficiency) }]}>
            <Text style={styles.statValue}>{cacheStats.hitRate}%</Text>
            <Text style={styles.statLabel}>Hit Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cacheStats.avgResponseTime}ms</Text>
            <Text style={styles.statLabel}>Avg Response</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cacheStats.totalRequests}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cacheStats.efficiency}</Text>
            <Text style={styles.statLabel}>Efficiency</Text>
          </View>
        </View>
      </View>

      {/* Cache Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Breakdown</Text>
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Client Cache Hits:</Text>
            <Text style={[styles.breakdownValue, styles.successValue]}>
              {cacheStats.hits} ({cacheStats.clientCacheHitRate}%)
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Server Cache Hits:</Text>
            <Text style={[styles.breakdownValue, styles.infoValue]}>
              {cacheStats.serverCacheHits} ({cacheStats.serverCacheHitRate}%)
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Cache Misses (API Calls):</Text>
            <Text style={[styles.breakdownValue, styles.errorValue]}>
              {cacheStats.misses}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Local Cache Entries:</Text>
            <Text style={styles.breakdownValue}>
              {cacheStats.localCacheSize}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        <View style={styles.insightContainer}>
          {getPerformanceInsights(cacheStats).map((insight, index) => (
            <View key={index} style={[styles.insightCard, { backgroundColor: insight.color }]}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.clearButton} onPress={clearCache}>
          <Text style={styles.clearButtonText}>Clear Local Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
};

function getEfficiencyColor(efficiency: string): string {
  switch (efficiency) {
    case 'Excellent': return '#4CAF50';
    case 'Good': return '#8BC34A';
    case 'Fair': return '#FFC107';
    case 'Poor': return '#F44336';
    default: return '#9E9E9E';
  }
}

function getPerformanceInsights(stats: any) {
  const insights = [];

  if (parseFloat(stats.hitRate) > 80) {
    insights.push({
      title: 'Excellent Cache Performance',
      description: 'Your app is efficiently using cached data, reducing API calls and improving speed.',
      color: '#E8F5E8'
    });
  } else if (parseFloat(stats.hitRate) > 50) {
    insights.push({
      title: 'Good Cache Performance',
      description: 'Cache is working well. Consider preloading popular content for even better performance.',
      color: '#F0F8F0'
    });
  } else if (stats.totalRequests > 5) {
    insights.push({
      title: 'Cache Needs Improvement',
      description: 'Low cache hit rate detected. Try optimizing request patterns or cache TTL.',
      color: '#FFF3E0'
    });
  }

  if (stats.avgResponseTime < 100) {
    insights.push({
      title: 'Fast Response Times',
      description: 'Queries are executing quickly thanks to effective caching.',
      color: '#E3F2FD'
    });
  } else if (stats.avgResponseTime > 500) {
    insights.push({
      title: 'Slow Response Times',
      description: 'Consider optimizing queries or checking network connectivity.',
      color: '#FFEBEE'
    });
  }

  if (stats.serverCacheHits > stats.hits) {
    insights.push({
      title: 'Database Cache Working',
      description: 'Server-side caching is effectively reducing IGDB API calls.',
      color: '#F3E5F5'
    });
  }

  return insights;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  breakdownContainer: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  successValue: {
    color: '#4CAF50',
  },
  infoValue: {
    color: '#2196F3',
  },
  errorValue: {
    color: '#F44336',
  },
  insightContainer: {
    gap: 8,
  },
  insightCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default CacheMonitorScreen;