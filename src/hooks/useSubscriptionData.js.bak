import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
// import { billingServiceV2 } from '../services/billing/billingServiceV2'; // REMOVED: Billing service deleted
import { db } from '../utils/firebase';
// import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'; // REMOVED: Firebase/Firestore

export const useSubscriptionData = () => {
  const { currentUser } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [subscriptionData, setSubscriptionData] = useState({
    status: null,
    plans: [],
    transactions: []
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState({
    data: [],
    loading: false,
    error: null
  });

  // Fetch subscription status
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!currentUser) return null;

    try {
      const result = await billingServiceV2.getSubscriptionStatus();
      console.log('🔍 Subscription Status API Response (useSubscriptionData):', JSON.stringify(result, null, 2));
      if (result.success) {
        console.log('🔍 Subscription Status Data:', JSON.stringify(result.data, null, 2));
        return result.data;
      } else {
        throw new Error(result.message || result.error || 'Failed to fetch subscription status');
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  }, [currentUser]);

  // Fetch subscription plans
  const fetchSubscriptionPlans = useCallback(async () => {
    setSubscriptionPlans(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await billingServiceV2.getSubscriptionPlans();
      
      if (result.success) {
        setSubscriptionPlans({
          data: result.data.plans || [],
          loading: false,
          error: null
        });
      } else {
        throw new Error(result.message || result.error || 'Failed to fetch subscription plans');
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setSubscriptionPlans({
        data: [],
        loading: false,
        error: error.message || 'Failed to load subscription plans'
      });
    }
  }, []);

  // Fetch subscription transactions
  const fetchSubscriptionTransactions = useCallback(async () => {
    if (!currentUser?.uid) return [];

    try {
      const userOrdersRef = collection(db, 'user_orders');
      const q = query(
        userOrdersRef,
        where('user_id', '==', currentUser.uid),
        where('type', '==', 'subscription'),
        orderBy('created_at', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          type: 'subscription'
        });
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching subscription transactions:', error);
      return [];
    }
  }, [currentUser?.uid]);

  // Load all subscription data
  const loadSubscriptionData = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError('');

      const [statusResult, plansResult, transactionsResult] = await Promise.allSettled([
        fetchSubscriptionStatus(),
        fetchSubscriptionPlans(),
        fetchSubscriptionTransactions()
      ]);

      // Process subscription status
      if (statusResult.status === 'fulfilled') {
        setSubscriptionData(prev => ({
          ...prev,
          status: statusResult.value
        }));
      } else if (statusResult.status === 'rejected') {
        console.error('Failed to load subscription status:', statusResult.reason);
      }

      // Process subscription transactions
      if (transactionsResult.status === 'fulfilled') {
        setSubscriptionData(prev => ({
          ...prev,
          transactions: transactionsResult.value || []
        }));
      }

    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, fetchSubscriptionStatus, fetchSubscriptionPlans, fetchSubscriptionTransactions]);

  // Purchase subscription
  const purchaseSubscription = useCallback(async (subscriptionData) => {
    try {
      setError('');
      
      // Use correct method signature: createSubscription(planId, billingCycle)
      const result = await billingServiceV2.createSubscription(
        subscriptionData.plan_id,
        subscriptionData.billing_cycle || 'monthly'
      );

      if (result.success) {
        // Refresh data after successful purchase
        await loadSubscriptionData();
        return result;
      } else {
        throw new Error(result.message || result.error || 'Subscription creation failed');
      }
    } catch (error) {
      console.error('Subscription purchase error:', error);
      setError(error.message || 'Failed to create subscription');
      throw error;
    }
  }, [loadSubscriptionData]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (cancelData) => {
    try {
      setError('');
      
      // Use correct method signature: cancelSubscription(cancelImmediately, reason)
      const result = await billingServiceV2.cancelSubscription(
        cancelData.cancel_immediately || false,
        cancelData.reason || null
      );

      if (result.success) {
        // Refresh data after successful cancellation
        await loadSubscriptionData();
        return result;
      } else {
        throw new Error(result.message || result.error || 'Subscription cancellation failed');
      }
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      setError(error.message || 'Failed to cancel subscription');
      throw error;
    }
  }, [loadSubscriptionData]);

  // Refresh subscription data
  const refreshData = useCallback(async () => {
    await loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (currentUser?.uid) {
      loadSubscriptionData();
    }
  }, [currentUser?.uid, loadSubscriptionData]);

  return {
    // Data
    subscriptionData,
    subscriptionPlans,
    
    // States
    loading,
    error,
    
    // Actions
    refreshData,
    purchaseSubscription,
    cancelSubscription,
    fetchSubscriptionStatus,
    fetchSubscriptionPlans,
    fetchSubscriptionTransactions,
    
    // Setters for external updates
    setSubscriptionData,
    setSubscriptionPlans,
    setError
  };
};

export default useSubscriptionData;