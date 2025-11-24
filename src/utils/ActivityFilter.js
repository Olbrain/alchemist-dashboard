/**
 * Unified Activity Filter Class
 * 
 * Centralizes all activity filtering logic to ensure consistency across components.
 * This addresses the core issue where different components had different filtering rules,
 * causing discrepancies like "Recent Activity shows 1 but total shows 0".
 */

import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_SEVERITY,
  SYSTEM_ACTIVITIES
} from '../constants/activityTypes';

export class ActivityFilter {
  constructor(options = {}) {
    this.options = {
      includeTestActivities: false,
      includeSystemActivities: true,
      includeDebugActivities: false,
      defaultTimeRange: '24h',
      ...options
    };

    // Define supported time ranges
    this.supportedTimeRanges = ['1h', '24h', '7d', '30d', 'all'];
  }

  /**
   * Master filter method - applies all filtering rules consistently
   * @param {Array} activities - Raw activities array
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered activities
   */
  filterActivities(activities, filters = {}) {
    if (!Array.isArray(activities)) {
      console.warn('ActivityFilter: Invalid activities array provided');
      return [];
    }

    const {
      timeRange = this.options.defaultTimeRange,
      categories = null,
      severities = null,
      userRelevantOnly = true,
      organizationId = null,
      resourceType = null,
      resourceId = null,
      actorId = null
    } = filters;

    let filteredActivities = [...activities];

    // Step 1: Time range filtering (consistent across all components)
    if (timeRange) {
      filteredActivities = this.filterByTimeRange(filteredActivities, timeRange);
    }

    // Step 2: Organization filtering
    if (organizationId) {
      filteredActivities = this.filterByOrganization(filteredActivities, organizationId);
    }

    // Step 3: User relevance filtering (removes test/debug activities)
    if (userRelevantOnly) {
      filteredActivities = this.filterUserRelevantActivities(filteredActivities);
    }

    // Step 4: Category filtering
    if (categories && Array.isArray(categories)) {
      filteredActivities = this.filterByCategories(filteredActivities, categories);
    }

    // Step 5: Severity filtering
    if (severities && Array.isArray(severities)) {
      filteredActivities = this.filterBySeverities(filteredActivities, severities);
    }

    // Step 6: Resource filtering
    if (resourceType) {
      filteredActivities = this.filterByResourceType(filteredActivities, resourceType);
    }

    if (resourceId) {
      filteredActivities = this.filterByResourceId(filteredActivities, resourceId);
    }

    // Step 7: Actor filtering
    if (actorId) {
      filteredActivities = this.filterByActor(filteredActivities, actorId);
    }

    return filteredActivities;
  }

  /**
   * Normalize time range input to ensure consistency
   * @param {string} timeRange 
   * @returns {string}
   */
  normalizeTimeRange(timeRange) {
    if (!timeRange) return this.options.defaultTimeRange;
    
    // Handle different formats
    const normalized = timeRange.toLowerCase().trim();
    
    // Map common variations
    const mappings = {
      '1hour': '1h',
      'hour': '1h',
      '24hours': '24h',
      'day': '24h',
      'today': '24h',
      '7days': '7d',
      'week': '7d',
      '30days': '30d',
      'month': '30d',
      'all': 'all',
      'everything': 'all'
    };

    if (mappings[normalized]) {
      return mappings[normalized];
    }

    // Check if it's already a valid range
    if (this.supportedTimeRanges.includes(normalized)) {
      return normalized;
    }

    console.warn(`ActivityFilter: Unknown time range '${timeRange}', using default '${this.options.defaultTimeRange}'`);
    return this.options.defaultTimeRange;
  }

  /**
   * Filter activities by time range - CONSISTENT implementation
   * @param {Array} activities 
   * @param {string} timeRange 
   * @returns {Array}
   */
  filterByTimeRange(activities, timeRange) {
    // Normalize the time range first
    const normalizedRange = this.normalizeTimeRange(timeRange);
    
    if (normalizedRange === 'all') {
      return activities; // No time filtering
    }

    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const cutoffTime = new Date(now.getTime() - timeRangeMs[normalizedRange]);
    
    return activities.filter(activity => {
      // Handle different timestamp formats consistently
      let activityDate;
      
      if (activity.created_at instanceof Date) {
        activityDate = activity.created_at;
      } else if (activity.created_at && activity.created_at.toDate) {
        // Firestore Timestamp object
        activityDate = activity.created_at.toDate();
      } else if (activity.created_at) {
        // String or number timestamp
        activityDate = new Date(activity.created_at);
      } else {
        // Fallback - consider invalid activities as very old
        return false;
      }
      
      // Validate the date
      if (isNaN(activityDate.getTime())) {
        console.warn(`ActivityFilter: Invalid date for activity ${activity.id}:`, activity.created_at);
        return false;
      }
      
      return activityDate >= cutoffTime;
    });
  }

  /**
   * Filter activities by organization - handles missing org IDs gracefully
   * @param {Array} activities 
   * @param {string} organizationId 
   * @returns {Array}
   */
  filterByOrganization(activities, organizationId) {
    if (!organizationId) {
      return activities;
    }

    return activities.filter(activity => {
      const activityOrgId = activity.organization_id || activity.organizationId;
      return activityOrgId === organizationId;
    });
  }

  /**
   * Filter user-relevant activities - UNIFIED implementation
   * This is the core method that was inconsistent across components
   * @param {Array} activities 
   * @returns {Array}
   */
  filterUserRelevantActivities(activities) {
    return activities.filter(activity => {
      const activityType = activity.activity_type;
      
      if (!activityType) {
        return false; // Invalid activity
      }

      // Filter out test activities (unless explicitly enabled)
      if (!this.options.includeTestActivities) {
        if (activityType.includes('test_') || 
            activityType.includes('debug_') || 
            activityType.includes('_test') ||
            activityType.includes('_debug')) {
          return false;
        }
      }

      // Filter out debug activities (unless explicitly enabled)
      if (!this.options.includeDebugActivities) {
        if (activityType.includes('debug') || 
            activityType.includes('_debug_') ||
            activityType.startsWith('debug_')) {
          return false;
        }
      }

      // Filter out system maintenance activities
      if (activityType.includes('maintenance') || 
          activityType.includes('cleanup') ||
          activityType.includes('migration') ||
          activityType.includes('backup')) {
        return false;
      }

      // Filter out very technical activities
      if (activityType.includes('firestore_') ||
          activityType.includes('database_') ||
          activityType.includes('auth_token') ||
          activityType.includes('session_') ||
          activityType.includes('cache_')) {
        return false;
      }

      // Filter out system activities (unless explicitly enabled)
      if (!this.options.includeSystemActivities) {
        const systemActivities = Object.values(SYSTEM_ACTIVITIES);
        if (systemActivities.includes(activityType)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Filter activities by categories
   * @param {Array} activities 
   * @param {Array} categories 
   * @returns {Array}
   */
  filterByCategories(activities, categories) {
    return activities.filter(activity => {
      const category = activity.metadata?.category;
      return categories.includes(category);
    });
  }

  /**
   * Filter activities by severities
   * @param {Array} activities 
   * @param {Array} severities 
   * @returns {Array}
   */
  filterBySeverities(activities, severities) {
    return activities.filter(activity => {
      const severity = activity.metadata?.severity || ACTIVITY_SEVERITY.INFO;
      return severities.includes(severity);
    });
  }

  /**
   * Filter activities by resource type
   * @param {Array} activities 
   * @param {string} resourceType 
   * @returns {Array}
   */
  filterByResourceType(activities, resourceType) {
    return activities.filter(activity => {
      return activity.resource_type === resourceType;
    });
  }

  /**
   * Filter activities by resource ID
   * @param {Array} activities 
   * @param {string} resourceId 
   * @returns {Array}
   */
  filterByResourceId(activities, resourceId) {
    return activities.filter(activity => {
      return activity.resource_id === resourceId;
    });
  }

  /**
   * Filter activities by actor
   * @param {Array} activities 
   * @param {string} actorId 
   * @returns {Array}
   */
  filterByActor(activities, actorId) {
    return activities.filter(activity => {
      return activity.actor_id === actorId;
    });
  }

  /**
   * Get notification-relevant activities (for NotificationDropdown)
   * This method ensures NotificationDropdown and ActivityAnalytics use the same logic
   * @param {Array} activities 
   * @param {Object} options 
   * @returns {Array}
   */
  getNotificationActivities(activities, options = {}) {
    const {
      limit = 15,
      timeRange = '24h',
      organizationId = null
    } = options;

    // Use the unified filtering logic
    const filtered = this.filterActivities(activities, {
      timeRange,
      organizationId,
      userRelevantOnly: true,
      categories: [
        ACTIVITY_CATEGORIES.AGENT,
        ACTIVITY_CATEGORIES.PROJECT,
        ACTIVITY_CATEGORIES.USER,
        ACTIVITY_CATEGORIES.ORGANIZATION
      ]
    });

    // Sort by most recent and limit
    return filtered
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  /**
   * Get analytics-relevant activities (for ActivityAnalytics)
   * @param {Array} activities 
   * @param {Object} options 
   * @returns {Array}
   */
  getAnalyticsActivities(activities, options = {}) {
    const {
      timeRange = '24h',
      organizationId = null,
      includeAllCategories = false
    } = options;

    const filterOptions = {
      timeRange,
      organizationId,
      userRelevantOnly: true
    };

    // For analytics, include all categories unless specified
    if (!includeAllCategories) {
      filterOptions.categories = [
        ACTIVITY_CATEGORIES.AGENT,
        ACTIVITY_CATEGORIES.PROJECT,
        ACTIVITY_CATEGORIES.USER,
        ACTIVITY_CATEGORIES.ORGANIZATION
      ];
    }

    return this.filterActivities(activities, filterOptions);
  }

  /**
   * Get activity count - ensures consistent counting across components
   * @param {Array} activities 
   * @param {Object} filters 
   * @returns {number}
   */
  getActivityCount(activities, filters = {}) {
    return this.filterActivities(activities, filters).length;
  }

  /**
   * Validate activity object structure
   * @param {Object} activity 
   * @returns {boolean}
   */
  isValidActivity(activity) {
    if (!activity || typeof activity !== 'object') {
      return false;
    }

    // Required fields
    const requiredFields = ['activity_type', 'created_at'];
    for (const field of requiredFields) {
      if (!activity[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Debug method to analyze filtering discrepancies
   * @param {Array} activities 
   * @param {Object} filters 
   * @returns {Object}
   */
  debugFiltering(activities, filters = {}) {
    const debug = {
      input: {
        totalActivities: activities.length,
        filters
      },
      steps: {},
      output: {
        filteredActivities: 0
      }
    };

    let currentActivities = [...activities];
    debug.steps.initial = currentActivities.length;

    // Apply each filter step and track results
    if (filters.timeRange) {
      currentActivities = this.filterByTimeRange(currentActivities, filters.timeRange);
      debug.steps.afterTimeRange = currentActivities.length;
    }

    if (filters.organizationId) {
      currentActivities = this.filterByOrganization(currentActivities, filters.organizationId);
      debug.steps.afterOrganization = currentActivities.length;
    }

    if (filters.userRelevantOnly) {
      currentActivities = this.filterUserRelevantActivities(currentActivities);
      debug.steps.afterUserRelevant = currentActivities.length;
    }

    if (filters.categories) {
      currentActivities = this.filterByCategories(currentActivities, filters.categories);
      debug.steps.afterCategories = currentActivities.length;
    }

    debug.output.filteredActivities = currentActivities.length;
    debug.output.sampleActivities = currentActivities.slice(0, 3).map(a => ({
      id: a.id,
      type: a.activity_type,
      category: a.metadata?.category,
      created_at: a.created_at
    }));

    return debug;
  }
}

// Export singleton instance with default options
export const defaultActivityFilter = new ActivityFilter({
  includeTestActivities: false,
  includeSystemActivities: false, // Changed from true to reduce noise
  includeDebugActivities: false,
  defaultTimeRange: '24h'
});

// Export class for custom instances
export default ActivityFilter;