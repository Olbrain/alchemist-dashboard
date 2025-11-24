import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
// import { billingServiceV2 } from '../services/billing/billingServiceV2'; // REMOVED: Billing service deleted
import { db } from '../utils/firebase';
// import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'; // REMOVED: Firebase/Firestore

export const useBillingHistory = () => {
  const { currentUser } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [allTransactions, setAllTransactions] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [subscriptionTransactions, setSubscriptionTransactions] = useState([]);

  // Fetch all transactions from Firebase
  const fetchAllTransactions = useCallback(async () => {
    if (!currentUser?.uid) return [];

    try {
      const userOrdersRef = collection(db, 'user_orders');
      const q = query(
        userOrdersRef,
        where('user_id', '==', currentUser.uid),
        orderBy('created_at', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data
        });
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  }, [currentUser?.uid]);

  // Fetch credit transactions only
  const fetchCreditTransactions = useCallback(async () => {
    if (!currentUser?.uid) return [];

    try {
      const result = await billingServiceV2.getTransactions(50);
      if (result.success) {
        return result.data.transactions || [];
      } else {
        console.error('Failed to fetch credit transactions:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
      return [];
    }
  }, [currentUser?.uid]);

  // Fetch subscription transactions from Firebase
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

  // Load all billing history data
  const loadBillingHistory = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError('');

      const [allResult, creditResult, subscriptionResult] = await Promise.allSettled([
        fetchAllTransactions(),
        fetchCreditTransactions(),
        fetchSubscriptionTransactions()
      ]);

      // Process all transactions
      if (allResult.status === 'fulfilled') {
        setAllTransactions(allResult.value || []);
      } else {
        console.error('Failed to load all transactions:', allResult.reason);
      }

      // Process credit transactions
      if (creditResult.status === 'fulfilled') {
        setCreditTransactions(creditResult.value || []);
      } else {
        console.error('Failed to load credit transactions:', creditResult.reason);
      }

      // Process subscription transactions
      if (subscriptionResult.status === 'fulfilled') {
        setSubscriptionTransactions(subscriptionResult.value || []);
      } else {
        console.error('Failed to load subscription transactions:', subscriptionResult.reason);
      }

    } catch (err) {
      console.error('Error loading billing history:', err);
      setError(err.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, fetchAllTransactions, fetchCreditTransactions, fetchSubscriptionTransactions]);

  // Refresh billing history data
  const refreshData = useCallback(async () => {
    await loadBillingHistory();
  }, [loadBillingHistory]);

  // Helper functions
  const formatAmount = useCallback((amount, currency = 'INR') => {
    if (!amount) return 'Free';
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatCredits = useCallback((credits) => {
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return Math.round(credits).toString();
  }, []);

  // Calculate monthly summary
  const getMonthlyBillingSummary = useCallback(() => {
    const thisMonth = new Date();
    const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    
    const thisMonthTransactions = allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp || transaction.created_at);
      return transactionDate >= firstDayOfMonth;
    });

    const thisMonthSpent = thisMonthTransactions.reduce((total, transaction) => {
      return total + (parseFloat(transaction.amount_paid) || 0);
    }, 0);

    const thisMonthCredits = thisMonthTransactions.reduce((total, transaction) => {
      if (transaction.amount && transaction.amount > 0) {
        return total + transaction.amount;
      }
      return total;
    }, 0);

    return {
      monthlySpent: thisMonthSpent,
      creditsReceived: thisMonthCredits,
      transactionCount: thisMonthTransactions.length
    };
  }, [allTransactions]);

  // Get transactions by type
  const getTransactionsByType = useCallback((type) => {
    return allTransactions.filter(transaction => transaction.type === type);
  }, [allTransactions]);

  // Get transactions by period
  const getTransactionsByPeriod = useCallback((days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp || transaction.created_at);
      return transactionDate >= cutoffDate;
    });
  }, [allTransactions]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (currentUser?.uid) {
      loadBillingHistory();
    }
  }, [currentUser?.uid, loadBillingHistory]);

  return {
    // Data
    allTransactions,
    creditTransactions,
    subscriptionTransactions,
    
    // States
    loading,
    error,
    
    // Actions
    refreshData,
    fetchAllTransactions,
    fetchCreditTransactions,
    fetchSubscriptionTransactions,
    
    // Helpers
    formatAmount,
    formatDate,
    formatCredits,
    getMonthlyBillingSummary,
    getTransactionsByType,
    getTransactionsByPeriod,
    
    // Setters for external updates
    setAllTransactions,
    setCreditTransactions,
    setSubscriptionTransactions,
    setError
  };
};

export default useBillingHistory;