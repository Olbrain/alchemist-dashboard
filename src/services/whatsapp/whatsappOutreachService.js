/**
 * WhatsApp Outreach Service
 *
 * Service for managing WhatsApp outreach tasks via direct Firestore writes.
 * Cloud Functions handle scheduling automatically when tasks are created.
 */

import { db } from '../../utils/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { agentBuilderApi } from '../config/apiConfig';

/**
 * Create a new outreach task
 * @param {string} agentId - Agent ID
 * @param {Object} taskData - Task data
 * @returns {Promise<string>} - Created task ID
 */
export const createOutreachTask = async (agentId, taskData) => {
  try {
    // Validate required fields
    if (!taskData.outreach_type) {
      throw new Error('outreach_type is required');
    }

    if (!taskData.contact_ids && !taskData.tags) {
      throw new Error('Either contact_ids or tags must be provided');
    }

    if (!taskData.template_id && !taskData.agent_instructions) {
      throw new Error('Either template_id or agent_instructions must be provided');
    }

    // Validate outreach_type specific fields
    if (taskData.outreach_type === 'scheduled' && !taskData.scheduled_time) {
      throw new Error('scheduled_time is required for scheduled outreach');
    }

    if (taskData.outreach_type === 'recurring') {
      if (!taskData.scheduled_time) {
        throw new Error('scheduled_time is required for recurring outreach');
      }
      if (!taskData.recurrence_frequency) {
        throw new Error('recurrence_frequency is required for recurring outreach');
      }
    }

    // Helper function to convert time components to Date/ISO string
    const timeComponentsToISO = (timeComponents) => {
      if (!timeComponents) return null;

      // If it's already a string (ISO format), return as is
      if (typeof timeComponents === 'string') {
        return timeComponents;
      }

      // If it's time components object, create Date and convert to ISO
      if (typeof timeComponents === 'object' && timeComponents.year) {
        const date = new Date(
          timeComponents.year,
          timeComponents.month - 1, // JS months are 0-indexed
          timeComponents.day,
          timeComponents.hour,
          timeComponents.minute,
          0, // seconds
          0  // milliseconds
        );
        return date.toISOString();
      }

      return null;
    };

    // Use backend API to create outreach task
    const response = await agentBuilderApi.post('/api/whatsapp/outreach', {
      agent_id: agentId,
      name: taskData.name || `Outreach ${new Date().toISOString()}`,
      description: taskData.description || null,
      template_id: taskData.template_id || '',
      contact_list_ids: taskData.contact_ids || [],
      schedule_type: taskData.outreach_type,
      scheduled_time: timeComponentsToISO(taskData.scheduled_time),
      status: 'pending',
      settings: {
        tags: taskData.tags || [],
        agent_instructions: taskData.agent_instructions || null,
        recurrence_frequency: taskData.recurrence_frequency || null,
        recurrence_end_date: taskData.recurrence_end_date || null,
        timezone: taskData.timezone || 'UTC'
      },
      metadata: {}
    });

    console.log('Outreach task created via backend API:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error creating outreach task:', error);
    throw error;
  }
};

/**
 * Get outreach task by ID
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object|null>} - Task data or null
 */
export const getOutreachTask = async (agentId, taskId) => {
  try {
    const taskRef = doc(db, 'outreach', agentId, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      return null;
    }

    return {
      id: taskDoc.id,
      ...taskDoc.data()
    };
  } catch (error) {
    console.error('Error getting outreach task:', error);
    throw error;
  }
};

/**
 * List outreach tasks for an agent
 * @param {string} agentId - Agent ID
 * @param {string|null} statusFilter - Optional status filter
 * @returns {Promise<Array>} - Array of tasks
 */
export const listOutreachTasks = async (agentId, statusFilter = null) => {
  try {
    const tasksRef = collection(db, 'outreach', agentId, 'tasks');
    let q;

    if (statusFilter) {
      q = query(
        tasksRef,
        where('status', '==', statusFilter),
        orderBy('created_at', 'desc')
      );
    } else {
      q = query(tasksRef, orderBy('created_at', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    const tasks = [];

    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return tasks;
  } catch (error) {
    console.error('Error listing outreach tasks:', error);
    throw error;
  }
};

/**
 * Update outreach task
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateOutreachTask = async (agentId, taskId, updates) => {
  try {
    // Use backend API to update outreach task
    await agentBuilderApi.put(`/api/whatsapp/outreach/${taskId}`, updates);

    console.log('Outreach task updated via backend API:', taskId);
  } catch (error) {
    console.error('Error updating outreach task:', error);
    throw error;
  }
};

/**
 * Cancel outreach task
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export const cancelOutreachTask = async (agentId, taskId) => {
  try {
    await updateOutreachTask(agentId, taskId, {
      status: 'cancelled'
    });
    console.log('Outreach task cancelled:', taskId);
  } catch (error) {
    console.error('Error cancelling outreach task:', error);
    throw error;
  }
};

/**
 * Pause outreach task
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export const pauseOutreachTask = async (agentId, taskId) => {
  try {
    await updateOutreachTask(agentId, taskId, {
      status: 'paused'
    });
    console.log('Outreach task paused:', taskId);
  } catch (error) {
    console.error('Error pausing outreach task:', error);
    throw error;
  }
};

/**
 * Resume outreach task
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export const resumeOutreachTask = async (agentId, taskId) => {
  try {
    await updateOutreachTask(agentId, taskId, {
      status: 'pending'
    });
    console.log('Outreach task resumed:', taskId);
  } catch (error) {
    console.error('Error resuming outreach task:', error);
    throw error;
  }
};

/**
 * Delete outreach task
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export const deleteOutreachTask = async (agentId, taskId) => {
  try {
    // Use backend API to delete outreach task
    await agentBuilderApi.delete(`/api/whatsapp/outreach/${taskId}`);

    console.log('Outreach task deleted via backend API:', taskId);
  } catch (error) {
    console.error('Error deleting outreach task:', error);
    throw error;
  }
};

/**
 * Get outreach messages for a task
 * @param {string} agentId - Agent ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Array>} - Array of messages
 */
export const getOutreachMessages = async (agentId, taskId) => {
  try {
    const messagesRef = collection(db, 'outreach', agentId, 'messages');
    const q = query(
      messagesRef,
      where('task_id', '==', taskId),
      orderBy('sent_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const messages = [];

    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return messages;
  } catch (error) {
    console.error('Error getting outreach messages:', error);
    throw error;
  }
};

/**
 * Get outreach summary for an agent
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object|null>} - Summary data or null
 */
export const getOutreachSummary = async (agentId) => {
  try {
    const summaryRef = doc(db, 'outreach', agentId, 'metadata', 'summary');
    const summaryDoc = await getDoc(summaryRef);

    if (!summaryDoc.exists()) {
      return {
        targeted_contacts: [],
        reached_contacts: [],
        totals: {
          total_messages_sent: 0,
          total_messages_delivered: 0,
          total_messages_read: 0,
          total_messages_failed: 0
        }
      };
    }

    return summaryDoc.data();
  } catch (error) {
    console.error('Error getting outreach summary:', error);
    throw error;
  }
};
