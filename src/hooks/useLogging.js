/**
 * React Hook for Logging Service Integration
 * 
 * Provides easy access to logging functionality in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import loggingClient from '../services/logging/loggingClient';

export const useLogging = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [health, setHealth] = useState({ status: 'unknown' });
  
  const organizationId = localStorage.getItem('currentOrganizationId');

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check service health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await loggingClient.getHealth();
        setHealth(healthData);
      } catch (error) {
        setHealth({ status: 'unreachable', error: error.message });
      }
    };
    
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Log event with automatic context
  const logEvent = useCallback(async (eventData) => {
    if (!user || !organizationId) return null;
    
    const eventWithContext = {
      ...eventData,
      organization_id: organizationId,
      event_data: {
        ...eventData.event_data,
        actor_id: user.uid,
        actor_type: 'user',
        metadata: {
          user_email: user.email,
          session_id: loggingClient.getSessionId(),
          url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...eventData.event_data?.metadata
        }
      }
    };
    
    try {
      return await loggingClient.logEvent(eventWithContext);
    } catch (error) {
      console.error('Failed to log event:', error);
      return null;
    }
  }, [user, organizationId]);

  // Convenience methods for common events
  const logAgentCreated = useCallback(async (agentId, agentData) => {
    if (!organizationId) return null;
    return loggingClient.logAgentCreated(organizationId, agentId, agentData);
  }, [organizationId]);

  const logAgentDeployed = useCallback(async (agentId, deploymentData) => {
    if (!organizationId) return null;
    return loggingClient.logAgentDeployed(organizationId, agentId, deploymentData);
  }, [organizationId]);

  const logUserJoined = useCallback(async (userId, userData) => {
    if (!organizationId) return null;
    return loggingClient.logUserJoined(organizationId, userId, userData);
  }, [organizationId]);

  const logError = useCallback(async (error, resourceType, resourceId, details) => {
    if (!organizationId) return null;
    return loggingClient.logErrorOccurred(organizationId, error, resourceType, resourceId, details);
  }, [organizationId]);

  // Analytics methods
  const getAnalytics = useCallback(async (filters = {}) => {
    if (!organizationId) return null;
    return loggingClient.getAnalytics({ organization_id: organizationId, ...filters });
  }, [organizationId]);

  const getAnalyticsSummary = useCallback(async (timeRange = '7d') => {
    if (!organizationId) return null;
    return loggingClient.getAnalyticsSummary(organizationId, timeRange);
  }, [organizationId]);

  const getAnalyticsTimeline = useCallback(async (timeRange = '7d', filters = {}) => {
    if (!organizationId) return null;
    return loggingClient.getAnalyticsTimeline(organizationId, timeRange, filters);
  }, [organizationId]);

  const getRealTimeAnalytics = useCallback(async () => {
    if (!organizationId) return null;
    return loggingClient.getRealTimeAnalytics(organizationId);
  }, [organizationId]);

  const exportAnalytics = useCallback(async (timeRange = '7d', format = 'json') => {
    if (!organizationId) return null;
    return loggingClient.exportAnalytics(organizationId, timeRange, format);
  }, [organizationId]);

  // Event querying
  const getEvents = useCallback(async (filters = {}) => {
    if (!organizationId) return null;
    return loggingClient.getEvents({ organization_id: organizationId, ...filters });
  }, [organizationId]);

  const getEvent = useCallback(async (eventId) => {
    return loggingClient.getEvent(eventId);
  }, []);

  return {
    // Connection status
    isOnline,
    health,
    
    // Event logging
    logEvent,
    logAgentCreated,
    logAgentDeployed,
    logUserJoined,
    logError,
    
    // Analytics
    getAnalytics,
    getAnalyticsSummary,
    getAnalyticsTimeline,
    getRealTimeAnalytics,
    exportAnalytics,
    
    // Event querying
    getEvents,
    getEvent,
    
    // WebSocket support
    setupWebSocket: (onEvent, onError) => {
      if (!organizationId) return null;
      return loggingClient.setupWebSocket(organizationId, onEvent, onError);
    },
    closeWebSocket: () => loggingClient.closeWebSocket(),
    
    // Utility
    organizationId,
    user
  };
};

// Higher-order component for automatic error logging
export const withErrorLogging = (WrappedComponent) => {
  return function ErrorLoggedComponent(props) {
    const { logError } = useLogging();
    
    useEffect(() => {
      const handleError = (error) => {
        logError(error, 'system', 'error_boundary', {
          component: WrappedComponent.name,
          props: Object.keys(props)
        });
      };
      
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleError);
      };
    }, [logError]);
    
    return <WrappedComponent {...props} />;
  };
};

// Hook for real-time event streaming
export const useEventStream = (filters = {}) => {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const { organizationId } = useLogging();

  useEffect(() => {
    if (!organizationId) return;

    const handleEvent = (event) => {
      setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
    };

    const handleError = (err) => {
      setError(err);
      setConnected(false);
    };

    const websocket = loggingClient.setupWebSocket(organizationId, handleEvent, handleError);
    
    if (websocket) {
      websocket.addEventListener('open', () => {
        setConnected(true);
        setError(null);
      });
      
      websocket.addEventListener('close', () => {
        setConnected(false);
      });
    }

    return () => {
      loggingClient.closeWebSocket();
    };
  }, [organizationId]);

  return {
    events,
    connected,
    error,
    clearEvents: () => setEvents([])
  };
};

// Hook for analytics dashboard
export const useAnalyticsDashboard = (timeRange = '7d') => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAnalyticsSummary, organizationId } = useLogging();

  const refreshAnalytics = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyticsSummary(timeRange);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAnalyticsSummary, timeRange, organizationId]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics
  };
};

export default useLogging;