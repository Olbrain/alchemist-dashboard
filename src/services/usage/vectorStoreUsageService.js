/**
 * Vector Store Usage Service
 *
 * Handles vector store usage tracking and billing queries
 */
import { kbApi } from '../config/apiConfig';

/**
 * Query vector store usage data for billing calculations
 *
 * @param {string} organizationId - Organization ID to query usage for
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} [agentId] - Optional: Filter by specific agent ID
 * @returns {Promise<Object>} Usage data with breakdown by agent
 */
export const queryVectorStoreUsage = async (organizationId, startDate, endDate, agentId = null) => {
  try {
    const params = {
      organization_id: organizationId,
      start_date: startDate,
      end_date: endDate
    };

    if (agentId) {
      params.agent_id = agentId;
    }

    const response = await kbApi.get('/billing/vector-store-usage/query', { params });

    return response.data;
  } catch (error) {
    console.error('Failed to query vector store usage:', error);
    throw new Error(error.response?.data?.detail || 'Failed to query vector store usage');
  }
};

/**
 * Trigger a manual usage snapshot (normally done by Cloud Scheduler daily)
 *
 * @returns {Promise<Object>} Snapshot creation results
 */
export const createUsageSnapshot = async () => {
  try {
    const response = await kbApi.post('/billing/vector-store-usage/snapshot');
    return response.data;
  } catch (error) {
    console.error('Failed to create usage snapshot:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create usage snapshot');
  }
};

/**
 * Calculate monthly estimate based on current usage
 *
 * @param {number} dailyCost - Current daily cost
 * @param {number} daysInMonth - Number of days in the month (default 30)
 * @returns {number} Estimated monthly cost
 */
export const calculateMonthlyEstimate = (dailyCost, daysInMonth = 30) => {
  return dailyCost * daysInMonth;
};

/**
 * Format usage data for display
 *
 * @param {number} bytes - Usage in bytes
 * @returns {Object} Formatted usage with GB and display string
 */
export const formatUsage = (bytes) => {
  const gb = bytes / (1024 ** 3);
  const displayValue = gb < 0.01 ? '<0.01' : gb.toFixed(2);

  return {
    gb: gb,
    display: `${displayValue} GB`
  };
};

/**
 * Format cost for display
 *
 * @param {number} cost - Cost in dollars
 * @returns {string} Formatted cost string
 */
export const formatCost = (cost) => {
  if (cost < 0.01) {
    return '$<0.01';
  }
  return `$${cost.toFixed(2)}`;
};
