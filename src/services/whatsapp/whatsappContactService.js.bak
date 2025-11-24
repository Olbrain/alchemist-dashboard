/**
 * WhatsApp Contact Service
 *
 * Service for managing WhatsApp contacts via direct Firestore writes.
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

class WhatsAppContactService {
  // ============================================================================
  // CONTACT OPERATIONS
  // ============================================================================

  /**
   * Create a new contact
   * @param {string} agentId - Agent ID
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Created contact
   */
  async createContact(agentId, contactData) {
    try {
      // Use backend API to create contact
      const response = await agentBuilderApi.post('/api/whatsapp/contacts', {
        agent_id: agentId,
        phone_number: contactData.phone_number,
        name: contactData.name || null,
        email: contactData.email || null,
        tags: contactData.tags || [],
        custom_fields: contactData.custom_fields || {},
        metadata: {
          status: contactData.status || 'active',
          notes: contactData.notes || null
        }
      });

      console.log('Contact created via backend API:', response.data.id);

      return {
        success: true,
        contact: response.data.data
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * List contacts for an agent
   * @param {string} agentId - Agent ID
   * @param {Object} filters - Optional filters (status, tags)
   * @returns {Promise<Array>} - Array of contacts
   */
  async listContacts(agentId, filters = {}) {
    try {
      const contactsRef = collection(db, 'outreach', agentId, 'contacts');
      let q = query(contactsRef, orderBy('created_at', 'desc'));

      // Apply status filter
      if (filters.status) {
        q = query(contactsRef, where('status', '==', filters.status), orderBy('created_at', 'desc'));
      }

      // Note: For tags filter, we can only use array-contains for single tag
      // For multiple tags, we need to filter client-side
      if (filters.tags && filters.tags.length === 1) {
        q = query(contactsRef, where('tags', 'array-contains', filters.tags[0]), orderBy('created_at', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      let contacts = [];

      querySnapshot.forEach((doc) => {
        contacts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Client-side filtering for multiple tags
      if (filters.tags && filters.tags.length > 1) {
        contacts = contacts.filter(contact =>
          contact.tags && contact.tags.some(tag => filters.tags.includes(tag))
        );
      }

      return {
        success: true,
        contacts,
        count: contacts.length
      };
    } catch (error) {
      console.error('Error listing contacts:', error);
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   * @param {string} agentId - Agent ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object>} - Contact data
   */
  async getContact(agentId, contactId) {
    try {
      const contactRef = doc(db, 'outreach', agentId, 'contacts', contactId);
      const contactDoc = await getDoc(contactRef);

      if (!contactDoc.exists()) {
        throw new Error('Contact not found');
      }

      return {
        success: true,
        contact: {
          id: contactDoc.id,
          ...contactDoc.data()
        }
      };
    } catch (error) {
      console.error('Error getting contact:', error);
      throw error;
    }
  }

  /**
   * Update a contact
   * @param {string} agentId - Agent ID
   * @param {string} contactId - Contact ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated contact
   */
  async updateContact(agentId, contactId, updateData) {
    try {
      // Use backend API to update contact
      await agentBuilderApi.put(`/api/whatsapp/contacts/${contactId}`, updateData);

      console.log('Contact updated via backend API:', contactId);

      return {
        success: true,
        contact: {
          id: contactId,
          ...updateData
        }
      };
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   * @param {string} agentId - Agent ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object>} - Success response
   */
  async deleteContact(agentId, contactId) {
    try {
      // Use backend API to delete contact
      await agentBuilderApi.delete(`/api/whatsapp/contacts/${contactId}`);

      console.log('Contact deleted via backend API:', contactId);

      return {
        success: true,
        message: 'Contact deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * Bulk import contacts
   * @param {string} agentId - Agent ID
   * @param {Array} contacts - Array of contact data
   * @returns {Promise<Object>} - Import results
   */
  async bulkImportContacts(agentId, contacts) {
    try {
      // Use backend API to bulk import contacts
      const response = await agentBuilderApi.post('/api/whatsapp/contacts/bulk', {
        agent_id: agentId,
        contacts: contacts
      });

      console.log(`Bulk import completed via backend API: ${response.data.imported}/${response.data.total} successful`);

      // Map response to expected format
      const results = {
        successful: Array(response.data.imported).fill(null).map((_, i) => ({
          id: `imported_${i}`,
          contact: contacts[i]
        })),
        failed: response.data.errors.map(err => ({
          contact: err.contact,
          error: err.error
        }))
      };

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error bulk importing contacts:', error);
      throw error;
    }
  }

  /**
   * Import contacts from CSV content
   * @param {string} agentId - Agent ID
   * @param {string} csvContent - CSV file content
   * @returns {Promise<Object>} - Import results
   */
  async importContactsFromCSV(agentId, csvContent) {
    try {
      // Simple CSV parsing (assumes: phone_number,name,email,tags,notes)
      const lines = csvContent.trim().split('\n');

      const contacts = [];
      // Skip header row (line 0)
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());

        if (values.length >= 1 && values[0]) {
          const contact = {
            phone_number: values[0],
            name: values[1] || null,
            email: values[2] || null,
            tags: values[3] ? values[3].split('|').map(t => t.trim()) : [],
            notes: values[4] || null
          };
          contacts.push(contact);
        }
      }

      // Use bulk import
      return await this.bulkImportContacts(agentId, contacts);
    } catch (error) {
      console.error('Error importing contacts from CSV:', error);
      throw error;
    }
  }
}

// Create singleton instance
const whatsappContactService = new WhatsAppContactService();

export default whatsappContactService;
