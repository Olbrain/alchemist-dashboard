/**
 * WhatsApp Template Service
 * 
 * Service for managing WhatsApp message templates via Twilio
 * Handles template creation, approval, and management for order placement
 */

import { getServiceApiUrl, agentBuilderApi } from '../config/apiConfig';
import { logActivity } from '../activity/activityService';
import { AGENT_ACTIVITIES, RESOURCE_TYPES } from '../../constants/activityTypes';
import { db } from '../../utils/firebase';
// import { doc, getDoc } from 'firebase/firestore'; // REMOVED: Firebase/Firestore

// FIRESTORE STUBS - These functions are stubbed because Firestore is disabled
const doc = (...args) => { console.warn('Firestore disabled: doc() called'); return null; };
const getDoc = async (...args) => { console.warn('Firestore disabled: getDoc() called'); return { exists: () => false, data: () => ({}) }; };


class WhatsAppTemplateService {
  constructor() {
    this.baseURL = getServiceApiUrl('agent-bridge');
    this.WHATSAPP_TEMPLATES_COLLECTION = 'whatsapp_templates';
  }

  /**
   * Get all templates for an agent
   */
  async getTemplates(agentId, organizationId = null, userId = null) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add organization context headers if provided
      if (organizationId) headers['X-Organization-ID'] = organizationId;
      if (userId) headers['X-User-ID'] = userId;
      
      const response = await fetch(`${this.baseURL}/api/whatsapp/templates/${agentId}`, {
        headers
      });
      
      if (response.status === 404) {
        return []; // No templates found
      }
      
      if (!response.ok) {
        throw new Error(`Failed to get templates: ${response.status}`);
      }

      const result = await response.json();
      const templates = result.templates || [];
      
      // Filter out archived templates
      return templates.filter(template => template.status !== 'archived');
    } catch (error) {
      console.error('Error getting WhatsApp templates:', error);
      throw error;
    }
  }

  /**
   * Create a new WhatsApp template
   */
  async createTemplate(agentId, templateData, organizationId = null, userId = null) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add organization context headers if provided
      if (organizationId) headers['X-Organization-ID'] = organizationId;
      if (userId) headers['X-User-ID'] = userId;
      
      const response = await fetch(`${this.baseURL}/api/whatsapp/templates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id: agentId,
          ...templateData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Template creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Log template creation activity
      try {
        await logActivity({
          activity_type: AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_CREATED,
          resource_type: RESOURCE_TYPES.INTEGRATION,
          resource_id: agentId,
          related_resource_type: RESOURCE_TYPES.AGENT,
          related_resource_id: agentId,
          activity_details: {
            template_name: templateData.name,
            template_category: templateData.category,
            template_language: templateData.language,
            platform: 'twilio'
          }
        });
      } catch (logError) {
        console.error('Error logging template creation activity:', logError);
      }
      
      return result;
    } catch (error) {
      console.error('Error creating WhatsApp template:', error);
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(agentId, templateId, templateData, organizationId = null, userId = null) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add organization context headers if provided
      if (organizationId) headers['X-Organization-ID'] = organizationId;
      if (userId) headers['X-User-ID'] = userId;
      
      const response = await fetch(`${this.baseURL}/api/whatsapp/templates/${templateId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          agent_id: agentId,
          ...templateData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Template update failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Log template update activity
      try {
        await logActivity({
          activity_type: AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_UPDATED,
          resource_type: RESOURCE_TYPES.INTEGRATION,
          resource_id: agentId,
          related_resource_type: RESOURCE_TYPES.AGENT,
          related_resource_id: agentId,
          activity_details: {
            template_id: templateId,
            template_name: templateData.name,
            platform: 'twilio'
          }
        });
      } catch (logError) {
        console.error('Error logging template update activity:', logError);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating WhatsApp template:', error);
      throw error;
    }
  }

  /**
   * Archive a template (mark as deleted without removing from Firestore)
   */
  async deleteTemplate(agentId, templateId, organizationId = null, userId = null) {
    try {
      if (!organizationId) {
        throw new Error('Organization ID is required for template operations');
      }

      // Get template to verify ownership before archiving
      const templateRef = doc(db, this.WHATSAPP_TEMPLATES_COLLECTION, templateId);
      const templateDoc = await getDoc(templateRef);

      if (!templateDoc.exists()) {
        throw new Error('Template not found');
      }

      const templateData = templateDoc.data();

      // Verify template belongs to current organization (using owner_id field)
      if (templateData.owner_id !== organizationId) {
        throw new Error('Template not found in current organization');
      }

      // Archive template via backend API
      await agentBuilderApi.delete(`/api/whatsapp/templates/${templateId}?agent_id=${agentId}`);

      // Log template archival activity
      try {
        await logActivity({
          activity_type: AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_DELETED,
          resource_type: RESOURCE_TYPES.INTEGRATION,
          resource_id: agentId,
          related_resource_type: RESOURCE_TYPES.AGENT,
          related_resource_id: agentId,
          activity_details: {
            template_id: templateId,
            action: 'archived',
            platform: 'twilio'
          }
        });
      } catch (logError) {
        console.error('Error logging template archival activity:', logError);
      }

      return { success: true, message: 'Template archived successfully' };
    } catch (error) {
      console.error('Error archiving WhatsApp template:', error);
      throw error;
    }
  }

  /**
   * Get template approval status from Twilio
   */
  async getTemplateStatus(agentId, templateId, organizationId = null, userId = null) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add organization context headers if provided
      if (organizationId) headers['X-Organization-ID'] = organizationId;
      if (userId) headers['X-User-ID'] = userId;
      
      const response = await fetch(`${this.baseURL}/api/whatsapp/templates/${templateId}/status`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get template status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting template status:', error);
      throw error;
    }
  }

  /**
   * Submit template for approval
   */
  async submitTemplateForApproval(agentId, templateId, organizationId = null, userId = null) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add organization context headers if provided
      if (organizationId) headers['X-Organization-ID'] = organizationId;
      if (userId) headers['X-User-ID'] = userId;
      
      const response = await fetch(`${this.baseURL}/api/whatsapp/templates/${templateId}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id: agentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Template submission failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Log template submission activity
      try {
        await logActivity({
          activity_type: AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_SUBMITTED,
          resource_type: RESOURCE_TYPES.INTEGRATION,
          resource_id: agentId,
          related_resource_type: RESOURCE_TYPES.AGENT,
          related_resource_id: agentId,
          activity_details: {
            template_id: templateId,
            platform: 'twilio'
          }
        });
      } catch (logError) {
        console.error('Error logging template submission activity:', logError);
      }
      
      return result;
    } catch (error) {
      console.error('Error submitting template for approval:', error);
      throw error;
    }
  }

  /**
   * Get available template categories
   */
  getTemplateCategories() {
    return [
      { id: 'marketing', name: 'Marketing', description: 'Promotional messages and offers' },
      { id: 'utility', name: 'Utility', description: 'Account updates, receipts, and notifications' }
    ];
  }


  /**
   * Validate template data before submission
   */
  validateTemplate(templateData) {
    const errors = [];

    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!templateData.category) {
      errors.push('Template category is required');
    }

    if (!templateData.language) {
      errors.push('Template language is required');
    }

    // Header validation (optional but if provided, must have image)
    if (templateData.header && !templateData.header.image_url) {
      errors.push('Header image URL is required when header is provided');
    }

    // Body validation
    if (!templateData.body || templateData.body.trim().length === 0) {
      errors.push('Template body text is required');
    }

    // Footer validation (optional)
    if (templateData.footer && templateData.footer.length > 60) {
      errors.push('Footer text must be 60 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const whatsappTemplateService = new WhatsAppTemplateService();
export default whatsappTemplateService;