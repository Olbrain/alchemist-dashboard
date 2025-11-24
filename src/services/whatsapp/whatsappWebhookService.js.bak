/**
 * WhatsApp Twilio Service
 * 
 * Simplified service for Twilio WhatsApp integration.
 * Handles phone number verification and account management via agent-bridge.
 */

import { db, Collections } from '../../utils/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { getServiceApiUrl, agentBuilderApi } from '../config/apiConfig';

class TwilioWhatsAppService {
  constructor() {
    this.collectionName = 'whatsapp_twilio_accounts';
    //this.baseURL = getServiceApiUrl('agent-bridge');
  }

  /**
   * Create Twilio WhatsApp account
   */
  async createTwilioAccount(agentId, phoneNumber, businessDisplayName = null) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: agentId,
          phone_number: phoneNumber,
          agent_name: businessDisplayName || 'Business Solutions', // Pass agent name for backend processing
          business_profile: {
            name: businessDisplayName || 'Business Solutions',
            industry: 'technology',
            description: 'AI-powered assistant'
          },
          webhook_config: {
            url: `${this.baseURL}/api/whatsapp/webhook`,
            events: ['message.received', 'message.delivered', 'message.read']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create Twilio account: ${response.status}`);
      }

      const result = await response.json();
      
      // Save account info via backend API
      await agentBuilderApi.post('/api/whatsapp/accounts', {
        agent_id: agentId,
        account_sid: result.account_id,
        auth_token: '', // Will be set by backend
        phone_number: result.phone_number,
        whatsapp_enabled: true,
        configuration: {
          sender_id: result.sender_id,
          verification_required: result.verification_required,
          verification_methods: result.verification_methods
        },
        metadata: {
          status: result.status
        }
      });

      const documentId = this.sanitizePhoneForDocumentId(result.phone_number);
      const accountData = {
        agentId,
        account_id: result.account_id,
        phone_number: result.phone_number,
        sender_id: result.sender_id,
        status: result.status,
        verification_required: result.verification_required,
        verification_methods: result.verification_methods
      };
      
      return {
        id: documentId,
        ...accountData
      };
    } catch (error) {
      console.error('Error creating Twilio account:', error);
      throw new Error('Failed to create Twilio WhatsApp account');
    }
  }

  /**
   * Request verification code for phone number
   */
  async requestVerificationCode(agentId, method = 'sms') {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_method: method
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to request verification code: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting verification code:', error);
      throw new Error('Failed to request verification code');
    }
  }

  /**
   * Verify phone number with code
   */
  async verifyPhoneNumber(agentId, verificationCode) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_code: verificationCode
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to verify phone number: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local account status
      if (result.verified) {
        await this.updateAccountStatus(agentId, 'verified');
      }
      
      return result;
    } catch (error) {
      console.error('Error verifying phone number:', error);
      throw new Error('Failed to verify phone number');
    }
  }

  /**
   * Update agent configuration with WhatsApp Twilio settings
   */
  async updateAgentWhatsAppConfig(agentId, whatsappConfig) {
    try {
      // Update agent configuration via backend API
      await agentBuilderApi.patch(`/api/whatsapp/accounts/${agentId}/webhook`, {
        webhook_url: '',  // Placeholder
        webhook_events: ['message.received', 'message.delivered'],
        ...whatsappConfig
      });

      console.log('Agent WhatsApp Twilio configuration updated via backend API');
    } catch (error) {
      console.error('Error updating agent WhatsApp config:', error);
      // Don't throw here - account is still saved
    }
  }

  /**
   * Get Twilio account for an agent
   */
  async getTwilioAccount(agentId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('agentId', '==', agentId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting Twilio account:', error);
      throw new Error('Failed to get Twilio account');
    }
  }

  /**
   * Get Twilio account by phone number
   */
  async getTwilioAccountByPhone(phoneNumber) {
    try {
      // Try direct document lookup first (new format)
      const documentId = this.sanitizePhoneForDocumentId(phoneNumber);
      const docRef = doc(db, this.collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      
      // Fallback to querying by phone_number field (old format)
      const q = query(
        collection(db, this.collectionName),
        where('phone_number', '==', phoneNumber),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Twilio account by phone:', error);
      throw new Error('Failed to get Twilio account by phone');
    }
  }

  /**
   * Update account status
   */
  async updateAccountStatus(agentId, status) {
    try {
      // Update account status via backend API
      await agentBuilderApi.patch(`/api/whatsapp/accounts/${agentId}/status`, {
        status: status,
        reason: 'Status updated from frontend'
      });

      return true;
    } catch (error) {
      console.error('Error updating account status:', error);
      throw new Error('Failed to update account status');
    }
  }

  /**
   * Send test message
   */
  async sendTestMessage(agentId, to, message) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: to,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send test message: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending test message:', error);
      throw new Error('Failed to send test message');
    }
  }

  /**
   * Delete Twilio account
   */
  async deleteTwilioAccount(agentId) {
    try {
      const account = await this.getTwilioAccount(agentId);
      if (!account) {
        throw new Error('No Twilio account found');
      }

      // Delete from agent-bridge
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete Twilio account: ${response.status}`);
      }

      // Delete via backend API
      await agentBuilderApi.delete(`/api/whatsapp/accounts/${agentId}`);

      return true;
    } catch (error) {
      console.error('Error deleting Twilio account:', error);
      throw new Error('Failed to delete Twilio account');
    }
  }

  /**
   * Get account health
   */
  async getAccountHealth(agentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/health`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to get account health: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting account health:', error);
      throw new Error('Failed to get account health');
    }
  }

  /**
   * Refresh Twilio status and sync with Firebase
   */
  async refreshTwilioStatus(agentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/twilio-status`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh Twilio status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local Firebase account with new status
      if (result.status_updated) {
        await this.updateAccountStatus(agentId, result.current_status.status);
        
        // Update additional status fields
        await this.updateAccountTwilioStatus(agentId, {
          twilio_sender_status: result.current_status.twilio_status,
          webhook_configured: result.current_status.webhook_configured,
          webhook_url: result.current_status.webhook_url,
          sender_sid: result.current_status.sender_sid,
          last_status_sync: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error refreshing Twilio status:', error);
      throw new Error('Failed to refresh Twilio status');
    }
  }

  /**
   * Update account with Twilio-specific status information
   */
  async updateAccountTwilioStatus(agentId, statusInfo) {
    try {
      // Update Twilio status via backend API
      await agentBuilderApi.patch(`/api/whatsapp/accounts/${agentId}/twilio-status`, {
        twilio_status: statusInfo.status || statusInfo.twilio_status,
        message_sid: statusInfo.message_sid,
        error_code: statusInfo.error_code,
        error_message: statusInfo.error_message,
        status_details: statusInfo
      });

      return true;
    } catch (error) {
      console.error('Error updating account Twilio status:', error);
      throw new Error('Failed to update account Twilio status');
    }
  }

  /**
   * Get comprehensive verification status from both Twilio and Meta
   */
  async getComprehensiveStatus(agentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/comprehensive-status`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to get comprehensive status: ${response.status}`);
      }

      const result = await response.json();
      
      // Prepare update data, filtering out undefined values
      const updateData = {
        comprehensive_status: result.comprehensive_status.overall_status,
        next_steps: result.comprehensive_status.next_steps,
        last_comprehensive_check: new Date().toISOString()
      };

      // Only add twilio_sender_status if it exists
      if (result.comprehensive_status.twilio_status?.twilio_status) {
        updateData.twilio_sender_status = result.comprehensive_status.twilio_status.twilio_status;
      }

      // Only add meta_verification_status if it exists
      if (result.comprehensive_status.meta_status?.whatsapp_status) {
        updateData.meta_verification_status = result.comprehensive_status.meta_status.whatsapp_status;
      }

      // Update local Firebase account with comprehensive status
      await this.updateAccountTwilioStatus(agentId, updateData);
      
      return result;
    } catch (error) {
      console.error('Error getting comprehensive status:', error);
      throw new Error('Failed to get comprehensive status');
    }
  }

  /**
   * Complete verification by registering with Meta after Twilio
   */
  async completeVerification(agentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/complete-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to complete verification: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Update local account with Meta registration info
      await this.updateAccountTwilioStatus(agentId, {
        meta_registration_attempted: true,
        meta_registration_attempted_at: new Date().toISOString(),
        meta_phone_number_id: result.meta_registration_result?.phone_number_id,
        verification_step: 'meta_code_required'
      });
      
      return result;
    } catch (error) {
      console.error('Error completing verification:', error);
      throw new Error('Failed to complete verification');
    }
  }

  /**
   * Submit verification code for Meta WhatsApp Business API
   */
  async submitVerificationCode(agentId, verificationCode) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/submit-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_code: verificationCode
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit verification code: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Update local account with verification result
      await this.updateAccountTwilioStatus(agentId, {
        meta_verification_submitted: true,
        meta_verification_submitted_at: new Date().toISOString(),
        verification_step: result.verification_result?.verified ? 'completed' : 'failed',
        comprehensive_status: result.comprehensive_status?.overall_status
      });
      
      return result;
    } catch (error) {
      console.error('Error submitting verification code:', error);
      throw new Error('Failed to submit verification code');
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber) {
    // Basic formatting - remove non-digits and add +
    const digits = phoneNumber.replace(/\D/g, '');
    return `+${digits}`;
  }

  /**
   * Sanitize phone number for use as Firestore document ID
   * Converts E.164 format (+1234567890) to valid document ID (_1234567890)
   */
  sanitizePhoneForDocumentId(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number cannot be empty');
    }
    
    // Remove any non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\+\d]/g, '');
    
    // Ensure it starts with +
    const withPlus = cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    
    // Validate E.164 format (+ followed by 7-15 digits)
    if (!/^\+\d{7,15}$/.test(withPlus)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }
    
    // Convert to document ID format (replace + with _)
    return withPlus.replace('+', '_');
  }

  /**
   * Convert document ID back to phone number format
   * Converts _1234567890 to +1234567890
   */
  documentIdToPhoneNumber(documentId) {
    if (!documentId) {
      throw new Error('Document ID cannot be empty');
    }
    
    // Convert document ID back to phone number
    if (documentId.startsWith('_')) {
      return documentId.replace('_', '+');
    } else {
      // Handle old format document IDs (return as-is)
      return documentId;
    }
  }

  /**
   * Register webhook URL for direct agent-to-Twilio communication
   */
  async registerWebhook(agentId, webhookUrl) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/register-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployment_id: agentId,
          agent_webhook_url: webhookUrl
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register webhook: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Update local account with webhook information
      await this.updateAccountWebhookInfo(agentId, {
        webhook_url: webhookUrl,
        webhook_status: 'registered',
        webhook_registered_at: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw new Error('Failed to register webhook');
    }
  }

  /**
   * Update webhook URL for existing registration
   */
  async updateWebhook(agentId, webhookUrl) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/update-webhook`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployment_id: agentId,
          agent_webhook_url: webhookUrl
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update webhook: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Update local account with new webhook information
      await this.updateAccountWebhookInfo(agentId, {
        webhook_url: webhookUrl,
        webhook_status: 'registered',
        webhook_registered_at: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw new Error('Failed to update webhook');
    }
  }

  /**
   * Get webhook status for an agent
   */
  async getWebhookStatus(agentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/webhook-status/${agentId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get webhook status: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting webhook status:', error);
      throw new Error('Failed to get webhook status');
    }
  }

  /**
   * Update account webhook information in Firebase
   */
  async updateAccountWebhookInfo(agentId, webhookInfo) {
    try {
      const account = await this.getTwilioAccount(agentId);
      if (!account) {
        throw new Error('No Twilio account found');
      }

      const docRef = doc(db, this.collectionName, account.id);
      await updateDoc(docRef, {
        ...webhookInfo,
        updated_at: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating account webhook info:', error);
      throw new Error('Failed to update account webhook info');
    }
  }

  /**
   * Generate webhook URL from agent deployment URL
   */
  generateWebhookUrl(deploymentUrl) {
    if (!deploymentUrl) {
      throw new Error('Deployment URL is required');
    }
    
    // Ensure URL ends with /api/whatsapp/webhook
    const baseUrl = deploymentUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${baseUrl}/api/whatsapp/webhook`;
  }

  /**
   * Get webhook URL for deployed agent
   */
  async getAgentWebhookUrl(agentId) {
    try {
      // Get deployment info from Firestore - find the latest completed deployment for this agent
      const deploymentsRef = collection(db, Collections.AGENT_DEPLOYMENTS);
      
      // Query for completed deployments
      const qCompleted = query(
        deploymentsRef, 
        where('agent_id', '==', agentId),
        where('status', '==', 'completed'),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      
      // Query for deployed deployments
      const qDeployed = query(
        deploymentsRef, 
        where('agent_id', '==', agentId),
        where('status', '==', 'deployed'),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      
      const [completedSnapshot, deployedSnapshot] = await Promise.all([
        getDocs(qCompleted),
        getDocs(qDeployed)
      ]);
      
      // Get the most recent deployment from either completed or deployed
      const allDeployments = [];
      if (!completedSnapshot.empty) {
        allDeployments.push({
          ...completedSnapshot.docs[0].data(),
          id: completedSnapshot.docs[0].id
        });
      }
      if (!deployedSnapshot.empty) {
        allDeployments.push({
          ...deployedSnapshot.docs[0].data(),
          id: deployedSnapshot.docs[0].id
        });
      }
      
      if (allDeployments.length === 0) {
        throw new Error('No completed deployment found for agent');
      }
      
      // Sort by created_at and get the most recent
      allDeployments.sort((a, b) => {
        const aTime = a.created_at?.toDate?.() || new Date(a.created_at);
        const bTime = b.created_at?.toDate?.() || new Date(b.created_at);
        return bTime - aTime;
      });
      
      const deployment = allDeployments[0];
      if (!deployment.service_url) {
        throw new Error('Agent deployment does not have a service URL');
      }
      
      return this.generateWebhookUrl(deployment.service_url);
    } catch (error) {
      console.error('Error getting agent webhook URL:', error);
      // Return fallback URL in expected format
      return `https://agent-${agentId}-851487020021.us-central1.run.app/api/whatsapp/webhook`;
    }
  }

  /**
   * Check if webhook is registered and active
   */
  async isWebhookRegistered(agentId) {
    try {
      const webhookStatus = await this.getWebhookStatus(agentId);
      return webhookStatus.webhook_status === 'registered';
    } catch (error) {
      console.error('Error checking webhook registration:', error);
      return false;
    }
  }

  /**
   * Get sub-account information for a client
   */
  async getSubAccountInfo(clientId) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/sub-accounts/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Sub-account not found
        }
        throw new Error(`Failed to get sub-account info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting sub-account info:', error);
      throw new Error('Failed to get sub-account information');
    }
  }

  /**
   * Get all sub-accounts with capacity information
   */
  async getAllSubAccounts() {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/sub-accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get sub-accounts: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting sub-accounts:', error);
      throw new Error('Failed to get sub-accounts');
    }
  }

  /**
   * Check sub-account capacity for a client
   */
  async checkSubAccountCapacity(clientId) {
    try {
      const subAccountInfo = await this.getSubAccountInfo(clientId);
      
      if (!subAccountInfo) {
        return {
          available: true,
          capacity: { current: 0, max: 100, available: 100 },
          message: 'New sub-account will be created'
        };
      }

      const { capacity } = subAccountInfo;
      const hasCapacity = capacity.available > 0;

      return {
        available: hasCapacity,
        capacity: capacity,
        message: hasCapacity 
          ? `${capacity.available} phone numbers available in existing sub-account`
          : `Sub-account at capacity (${capacity.current}/${capacity.max})`
      };
    } catch (error) {
      console.error('Error checking sub-account capacity:', error);
      return {
        available: false,
        capacity: { current: 0, max: 0, available: 0 },
        message: 'Unable to check capacity'
      };
    }
  }

  /**
   * Get sub-account status display information
   */
  async getSubAccountStatus(agentId) {
    try {
      // Get account info to find client_id
      const account = await this.getTwilioAccount(agentId);
      if (!account) {
        return null;
      }

      const clientId = account.sub_account_client_id || agentId;
      const subAccountInfo = await this.getSubAccountInfo(clientId);

      if (!subAccountInfo) {
        return {
          status: 'no_sub_account',
          message: 'No sub-account allocated',
          capacity: null
        };
      }

      return {
        status: 'active',
        sub_account_sid: subAccountInfo.sub_account_sid,
        friendly_name: subAccountInfo.friendly_name,
        capacity: subAccountInfo.capacity,
        phone_numbers: subAccountInfo.phone_numbers || [],
        created_at: subAccountInfo.created_at,
        message: `Sub-account active with ${subAccountInfo.capacity.available} available capacity`
      };
    } catch (error) {
      console.error('Error getting sub-account status:', error);
      return {
        status: 'error',
        message: 'Failed to get sub-account status',
        capacity: null
      };
    }
  }

  /**
   * Retry Meta verification code request
   */
  async retryVerificationCode(agentId, method = 'sms') {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/retry-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: method
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to retry verification code: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrying verification code:', error);
      throw new Error('Failed to retry verification code');
    }
  }

  /**
   * Get verification status and retry information
   */
  async getVerificationStatus(agentId) {
    try {
      const response = await fetch(`${this.baseURL}/api/whatsapp/accounts/${agentId}/verification-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get verification status: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting verification status:', error);
      throw new Error('Failed to get verification status');
    }
  }

  /**
   * Get setup instructions for Twilio WhatsApp integration with sub-account support
   */
  getSetupInstructions() {
    return {
      title: "WhatsApp Integration with Sub-Account Scaling",
      steps: [
        {
          step: 1,
          title: "Sub-Account Allocation",
          description: "System automatically allocates or creates a sub-account for your business",
          details: [
            "Each business gets its own dedicated sub-account",
            "100+ phone numbers supported per sub-account",
            "Proper business isolation and compliance",
            "Automatic capacity management"
          ]
        },
        {
          step: 2,
          title: "Enter Your Phone Number",
          description: "Enter the phone number you want to use for WhatsApp messaging",
          details: [
            "Use international format (e.g., +1234567890)",
            "This will be your WhatsApp Business number",
            "Must be a valid phone number you have access to",
            "Phone number will be registered under your sub-account"
          ]
        },
        {
          step: 3,
          title: "Bundle SID Verification",
          description: "Phone number is verified using your Bundle SID for seamless registration",
          details: [
            "Bundle SID enables high-volume phone number registration",
            "Faster verification process",
            "Support for multiple phone numbers per business",
            "Compliance with Twilio's business verification requirements"
          ]
        },
        {
          step: 4,
          title: "Verify Your Number",
          description: "Receive and enter the verification code",
          details: [
            "Choose SMS or Voice call for verification",
            "Enter the 6-digit code you receive",
            "You have 5 minutes to complete verification",
            "Verification is handled by your dedicated sub-account"
          ]
        },
        {
          step: 5,
          title: "Connect to AI Agent",
          description: "Your phone number is now connected to your AI agent",
          details: [
            "People can now message your WhatsApp number",
            "Your AI agent will automatically receive and respond to messages",
            "Send test messages to verify the integration works",
            "All conversations are handled by your deployed agent"
          ]
        },
        {
          step: 6,
          title: "Register Direct Webhook",
          description: "Connect your deployed agent directly to WhatsApp messages",
          details: [
            "Webhook URL is generated automatically from your agent deployment",
            "Registration connects Twilio directly to your agent",
            "Messages flow directly: WhatsApp → Twilio → Your Agent",
            "Responses flow directly: Your Agent → Twilio → WhatsApp"
          ]
        }
      ],
      notes: [
        "Sub-account architecture supports 100+ phone numbers per business",
        "Bundle SID enables seamless phone number verification",
        "Proper business isolation and compliance",
        "Direct webhook integration for optimal performance",
        "Scalable to hundreds of WhatsApp business numbers",
        "All messages are handled by your deployed agent without middleware"
      ]
    };
  }
}

export default new TwilioWhatsAppService();