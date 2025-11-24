/**
 * Logging Client for Alchemist Logging Service
 * 
 * Frontend client for communicating with the dedicated logging service.
 * Provides methods for logging events, analytics, and real-time streaming.
 */

import { getCurrentUser } from '../context';

class LoggingClient {
  constructor() {
    this.baseUrl = process.env.REACT_APP_LOGGING_SERVICE_URL;
    this.apiVersion = 'v1';
    this.eventQueue = [];
    this.batchSize = 50;
    this.flushInterval = 5000; // 5 seconds
    this.isOnline = navigator.onLine;
    this.websocket = null;
    
    // Start auto-flush for queued events
    this.startAutoFlush();
    
    // Monitor online status
    this.setupOnlineListeners();
  }

  /**
   * Get authentication headers
   */
  async getAuthHeaders() {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}/api/${this.apiVersion}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (parseError) {
        error = { message: 'Network error', status: response.status };
      }
      
      // Enhanced error handling for 422 validation errors
      if (response.status === 422) {
        console.error('Validation error details:', error);
        if (error.detail && Array.isArray(error.detail)) {
          // Pydantic validation errors
          const validationErrors = error.detail.map(err => 
            `${err.loc?.join('.') || 'field'}: ${err.msg || err.message}`
          ).join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
      }
      
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Log a single event
   */
  async logEvent(eventData) {
    if (!this.isOnline) {
      this.queueEvent(eventData);
      return null;
    }
    
    try {
      const response = await this.request('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      
      return response;
    } catch (error) {
      console.error('Failed to log event:', error);
      // Queue for retry when back online
      this.queueEvent(eventData);
      throw error;
    }
  }

  /**
   * Log multiple events in batch
   */
  async logEventsBatch(events) {
    if (!this.isOnline) {
      events.forEach(event => this.queueEvent(event));
      return null;
    }
    
    try {
      const response = await this.request('/events/batch', {
        method: 'POST',
        body: JSON.stringify({ events })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to log batch events:', error);
      // Queue for retry when back online
      events.forEach(event => this.queueEvent(event));
      throw error;
    }
  }

  /**
   * Get events with filters
   */
  async getEvents(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * Get specific event by ID
   */
  async getEvent(eventId) {
    return this.request(`/events/${eventId}`);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const endpoint = `/analytics${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(organizationId, timeRange = '7d') {
    const params = new URLSearchParams({
      organization_id: organizationId,
      time_range: timeRange
    });
    
    return this.request(`/analytics/summary?${params.toString()}`);
  }

  /**
   * Get analytics timeline
   */
  async getAnalyticsTimeline(organizationId, timeRange = '7d', filters = {}) {
    const params = new URLSearchParams({
      organization_id: organizationId,
      time_range: timeRange,
      ...filters
    });
    
    return this.request(`/analytics/timeline?${params.toString()}`);
  }

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics(organizationId) {
    const params = new URLSearchParams({
      organization_id: organizationId
    });
    
    return this.request(`/analytics/real-time?${params.toString()}`);
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(organizationId, timeRange = '7d', format = 'json') {
    const params = new URLSearchParams({
      organization_id: organizationId,
      time_range: timeRange,
      format: format
    });
    
    return this.request(`/analytics/export?${params.toString()}`);
  }

  /**
   * Get service health
   */
  async getHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/${this.apiVersion}/health/`);
      return response.json();
    } catch (error) {
      console.error('Failed to get service health:', error);
      return { status: 'unreachable', error: error.message };
    }
  }

  /**
   * Setup WebSocket connection for real-time events
   */
  setupWebSocket(organizationId, onEvent, onError) {
    if (this.websocket) {
      this.websocket.close();
    }
    
    const wsUrl = `${this.baseUrl.replace('http', 'ws')}/api/${this.apiVersion}/events/stream?organization_id=${organizationId}`;
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      
      // Send authentication message
      this.websocket.send(JSON.stringify({
        type: 'authenticate',
        token: getCurrentUser()?.accessToken
      }));
    };
    
    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'event' && onEvent) {
          onEvent(data.data);
        } else if (data.type === 'error' && onError) {
          onError(data.data);
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) {
        onError(error);
      }
    };
    
    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after delay
      setTimeout(() => {
        this.setupWebSocket(organizationId, onEvent, onError);
      }, 5000);
    };
    
    return this.websocket;
  }

  /**
   * Close WebSocket connection
   */
  closeWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Queue event for later processing
   */
  queueEvent(eventData) {
    this.eventQueue.push(eventData);
    
    // Limit queue size
    if (this.eventQueue.length > 1000) {
      this.eventQueue.shift(); // Remove oldest event
    }
  }

  /**
   * Start auto-flush for queued events
   */
  startAutoFlush() {
    setInterval(async () => {
      if (this.eventQueue.length > 0 && this.isOnline) {
        await this.flushEventQueue();
      }
    }, this.flushInterval);
  }

  /**
   * Flush queued events
   */
  async flushEventQueue() {
    if (this.eventQueue.length === 0) return;
    
    const eventsToFlush = this.eventQueue.splice(0, this.batchSize);
    
    try {
      await this.logEventsBatch(eventsToFlush);
      console.log(`Flushed ${eventsToFlush.length} queued events`);
    } catch (error) {
      console.error('Failed to flush event queue:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  /**
   * Setup online/offline listeners
   */
  setupOnlineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored, flushing event queue');
      this.flushEventQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost, events will be queued');
    });
  }

  /**
   * Convenience methods for common event types
   */
  async logAgentCreated(organizationId, agentId, agentData = {}) {
    return this.logEvent({
      organization_id: organizationId,
      event_info: {
        event_type: 'agent_created',
        event_category: 'agent',
        severity: 'info',
        source_service: 'agent-studio'
      },
      event_data: {
        resource_type: 'agent',
        resource_id: agentId,
        actor_id: getCurrentUser()?.uid,
        actor_type: 'user',
        event_payload: {
          agent_name: agentData.name,
          agent_type: agentData.type,
          creation_method: 'manual',
          ...agentData
        },
        metadata: {
          user_email: getCurrentUser()?.email,
          session_id: this.getSessionId(),
          url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  async logAgentDeployed(organizationId, agentId, deploymentData = {}) {
    return this.logEvent({
      organization_id: organizationId,
      event_info: {
        event_type: 'agent_deployed',
        event_category: 'agent',
        severity: 'info',
        source_service: 'agent-studio'
      },
      event_data: {
        resource_type: 'agent',
        resource_id: agentId,
        actor_id: getCurrentUser()?.uid,
        actor_type: 'user',
        event_payload: {
          deployment_channel: deploymentData.channel,
          deployment_status: deploymentData.status,
          deployment_timestamp: new Date().toISOString(),
          ...deploymentData
        },
        metadata: {
          user_email: getCurrentUser()?.email,
          session_id: this.getSessionId(),
          url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  async logUserJoined(organizationId, userId, userData = {}) {
    return this.logEvent({
      organization_id: organizationId,
      event_info: {
        event_type: 'user_joined',
        event_category: 'user',
        severity: 'info',
        source_service: 'agent-studio'
      },
      event_data: {
        resource_type: 'user',
        resource_id: userId,
        actor_id: getCurrentUser()?.uid,
        actor_type: 'user',
        event_payload: {
          user_email: userData.email,
          organization_id: organizationId,
          invitation_method: userData.invitationMethod || 'direct',
          ...userData
        },
        metadata: {
          user_email: getCurrentUser()?.email,
          session_id: this.getSessionId(),
          url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  async logErrorOccurred(organizationId, error, resourceType, resourceId, details = {}) {
    return this.logEvent({
      organization_id: organizationId,
      event_info: {
        event_type: 'error_occurred',
        event_category: 'system',
        severity: 'error',
        source_service: 'agent-studio'
      },
      event_data: {
        resource_type: resourceType,
        resource_id: resourceId,
        actor_id: getCurrentUser()?.uid || 'system',
        actor_type: getCurrentUser()?.uid ? 'user' : 'system',
        event_payload: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          error_code: details.code,
          ...details
        },
        metadata: {
          user_email: getCurrentUser()?.email,
          session_id: this.getSessionId(),
          url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('loggingSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('loggingSessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.closeWebSocket();
    if (this.eventQueue.length > 0) {
      this.flushEventQueue();
    }
  }
}

// Create singleton instance
const loggingClient = new LoggingClient();

export default loggingClient;

// Export class for custom instances
export { LoggingClient };

// Convenience exports
export const {
  logEvent,
  logEventsBatch,
  getEvents,
  getEvent,
  getAnalytics,
  getAnalyticsSummary,
  getAnalyticsTimeline,
  getRealTimeAnalytics,
  exportAnalytics,
  getHealth,
  setupWebSocket,
  closeWebSocket,
  logAgentCreated,
  logAgentDeployed,
  logUserJoined,
  logErrorOccurred,
  cleanup
} = loggingClient;