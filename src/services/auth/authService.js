/**
 * Authentication Service
 *
 * Handles authentication tokens and activity logging
 * Note: Request/response interceptors are now centralized in apiConfig.js
 */
import { getCurrentUser } from '../context';
import { logActivity } from '../activity/activityService';
import { USER_ACTIVITIES, SYSTEM_ACTIVITIES, RESOURCE_TYPES, ACTIVITY_SEVERITY } from '../../constants/activityTypes';

/**
 * Get cached authentication token (does not force refresh)
 * This should be used for normal API requests to avoid excessive token refreshes
 */
export const getAuthToken = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.warn('No user is logged in when trying to get auth token');
      return null;
    }

    // Use cached token (false = don't force refresh)
    // Firebase SDK will automatically refresh if the token is expired
    const token = await currentUser.getIdToken(false);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// ============================================================================
// AUTHENTICATION ACTIVITY LOGGING
// ============================================================================

/**
 * Log user login activity
 */
export const logUserLogin = async (loginMethod = 'email', additionalDetails = {}) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.warn('No user available for login activity logging');
      return;
    }

    await logActivity({
      activity_type: USER_ACTIVITIES.LOGIN,
      resource_type: RESOURCE_TYPES.USER,
      resource_id: user.uid,
      activity_details: {
        login_method: loginMethod,
        user_email: user.email,
        email_verified: user.emailVerified,
        provider_data: user.providerData?.map(p => p.providerId) || [],
        last_sign_in: user.metadata?.lastSignInTime,
        ...additionalDetails
      }
    });

    console.log(`✅ Logged user login activity for: ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to log user login activity:', error);
  }
};

/**
 * Log user logout activity
 */
export const logUserLogout = async (reason = 'user_initiated') => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.warn('No user available for logout activity logging');
      return;
    }

    await logActivity({
      activity_type: USER_ACTIVITIES.LOGOUT,
      resource_type: RESOURCE_TYPES.USER,
      resource_id: user.uid,
      activity_details: {
        user_email: user.email,
        logout_reason: reason,
        session_duration: user.metadata?.lastSignInTime ? 
          new Date().getTime() - new Date(user.metadata.lastSignInTime).getTime() : null
      }
    });

    console.log(`✅ Logged user logout activity for: ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to log user logout activity:', error);
  }
};

/**
 * Log user signup activity
 */
export const logUserSignup = async (signupMethod = 'email', userData = {}) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.warn('No user available for signup activity logging');
      return;
    }

    await logActivity({
      activity_type: USER_ACTIVITIES.SIGNUP,
      resource_type: RESOURCE_TYPES.USER,
      resource_id: user.uid,
      activity_details: {
        signup_method: signupMethod,
        user_email: user.email,
        email_verified: user.emailVerified,
        provider_data: user.providerData?.map(p => p.providerId) || [],
        creation_time: user.metadata?.creationTime,
        ...userData
      }
    });

    console.log(`✅ Logged user signup activity for: ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to log user signup activity:', error);
  }
};

/**
 * Log organization switching activity
 */
export const logOrganizationSwitch = async (fromOrgId, toOrgId, organizationName) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.warn('No user available for organization switch activity logging');
      return;
    }

    await logActivity({
      activity_type: USER_ACTIVITIES.ORGANIZATION_SWITCHED,
      resource_type: RESOURCE_TYPES.USER,
      resource_id: user.uid,
      activity_details: {
        user_email: user.email,
        from_organization_id: fromOrgId,
        to_organization_id: toOrgId,
        organization_name: organizationName,
        switch_timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Logged organization switch activity: ${fromOrgId} → ${toOrgId}`);
  } catch (error) {
    console.error('❌ Failed to log organization switch activity:', error);
  }
};

/**
 * Log password reset activity
 */
export const logPasswordReset = async (email) => {
  try {
    await logActivity({
      activity_type: USER_ACTIVITIES.PASSWORD_RESET,
      resource_type: RESOURCE_TYPES.USER,
      activity_details: {
        user_email: email,
        reset_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      }
    });

    console.log(`✅ Logged password reset activity for: ${email}`);
  } catch (error) {
    console.error('❌ Failed to log password reset activity:', error);
  }
};

/**
 * Log authentication error activity
 */
export const logAuthError = async (errorType, errorMessage, attemptedEmail = null) => {
  try {
    await logActivity({
      activity_type: SYSTEM_ACTIVITIES.AUTH_ERROR_OCCURRED,
      resource_type: RESOURCE_TYPES.SYSTEM,
      severity: ACTIVITY_SEVERITY.ERROR,
      activity_details: {
        error_type: errorType,
        error_message: errorMessage,
        attempted_email: attemptedEmail,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    });

    console.log(`✅ Logged authentication error: ${errorType}`);
  } catch (error) {
    console.error('❌ Failed to log authentication error:', error);
  }
};