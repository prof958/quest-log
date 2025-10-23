/**
 * Activity Log Service
 * Tracks user activities for the Recent Activity feed
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActivityAction = 'added' | 'rated' | 'status_changed';

export interface ActivityLogEntry {
  id: string;
  gameId: number;
  gameName: string;
  action: ActivityAction;
  timestamp: string;
  // Action-specific data
  rating?: number;
  review?: string;
  status?: string;
  previousStatus?: string;
}

export class ActivityLogService {
  private static instance: ActivityLogService;
  private static readonly MAX_ACTIVITIES = 10;
  private static readonly STORAGE_KEY_PREFIX = 'activity_log_';

  public static getInstance(): ActivityLogService {
    if (!ActivityLogService.instance) {
      ActivityLogService.instance = new ActivityLogService();
    }
    return ActivityLogService.instance;
  }

  /**
   * Log a new activity
   */
  public async logActivity(
    userId: string,
    gameId: number,
    gameName: string,
    action: ActivityAction,
    data?: {
      rating?: number;
      review?: string;
      status?: string;
      previousStatus?: string;
    }
  ): Promise<void> {
    try {
      const activities = await this.getActivities(userId);
      
      const newActivity: ActivityLogEntry = {
        id: `${gameId}_${action}_${Date.now()}`,
        gameId,
        gameName,
        action,
        timestamp: new Date().toISOString(),
        ...data
      };

      // Add to beginning of array
      activities.unshift(newActivity);

      // Keep only the most recent MAX_ACTIVITIES
      const trimmedActivities = activities.slice(0, ActivityLogService.MAX_ACTIVITIES);

      // Save to storage
      await AsyncStorage.setItem(
        `${ActivityLogService.STORAGE_KEY_PREFIX}${userId}`,
        JSON.stringify(trimmedActivities)
      );

      console.log(`✅ Logged activity: ${action} for ${gameName}`);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get recent activities for a user
   */
  public async getActivities(userId: string): Promise<ActivityLogEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(`${ActivityLogService.STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  /**
   * Clear all activities for a user
   */
  public async clearActivities(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${ActivityLogService.STORAGE_KEY_PREFIX}${userId}`);
    } catch (error) {
      console.error('Failed to clear activities:', error);
    }
  }
}

export default ActivityLogService;
