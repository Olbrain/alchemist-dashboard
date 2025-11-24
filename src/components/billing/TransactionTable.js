import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  History as HistoryIcon
} from '@mui/icons-material';

const TransactionTable = ({
  title = "Recent Transactions",
  transactions = [],
  subscriptionTransactions = [],
  showViewAllButton = true,
  onViewAll,
  maxRows = 5,
  expanded = false,
  agentNames = {}
}) => {
  const formatCredits = (credits) => {
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return Math.round(credits).toString();
  };

  const formatDate = (date) => {
    try {
      // Handle Date objects, timestamp objects, and strings
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      if (date && typeof date === 'object' && date.toDate) {
        // Firestore Timestamp object
        return date.toDate().toLocaleDateString();
      }
      if (date && typeof date === 'object' && date.seconds) {
        // Firestore Timestamp-like object
        return new Date(date.seconds * 1000).toLocaleDateString();
      }
      if (date) {
        // String or number
        return new Date(date).toLocaleDateString();
      }
      return 'Unknown';
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', date);
      return 'Invalid Date';
    }
  };

  const formatAmount = (amount, currency = 'INR') => {
    if (!amount) return 'Free';
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };

  // Combine and sort transactions
  const allTransactions = [
    ...(transactions || []), // Remove bonus filter to show all credit transactions
    ...(subscriptionTransactions || [])
  ].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));

  // Apply row limit only if not expanded
  const displayTransactions = expanded ? allTransactions : allTransactions.slice(0, maxRows);

  const hasTransactions = allTransactions.length > 0;
  const hasMoreTransactions = allTransactions.length > maxRows;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          {showViewAllButton && onViewAll && hasMoreTransactions && (
            <Button
              startIcon={<HistoryIcon />}
              variant="outlined"
              size="small"
              onClick={onViewAll}
            >
              {expanded ? 'Show Less' : 'View All'}
            </Button>
          )}
        </Box>
        
        {!hasTransactions ? (
          <Alert severity="info">
            <Typography variant="body2">
              No transactions found. Transactions will appear here once you make purchases or receive credits.
            </Typography>
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Credits</TableCell>
                  <TableCell align="right">Amount Paid</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayTransactions.map((transaction, index) => {
                  const isSubscription = transaction.type === 'subscription' || transaction.plan_name;
                  const isPurchase = transaction.type === 'purchase';
                  const isUsage = transaction.type === 'usage';
                  const isCredit = isPurchase || isUsage || transaction.type === 'bonus';
                  
                  // Determine transaction type label
                  let typeLabel = 'Transaction';
                  let typeColor = 'default';
                  if (isSubscription) {
                    typeLabel = 'Subscription';
                    typeColor = 'secondary';
                  } else if (isPurchase) {
                    typeLabel = 'Purchase';
                    typeColor = 'success';
                  } else if (isUsage) {
                    typeLabel = 'Usage';
                    typeColor = 'warning';
                  } else if (transaction.type === 'bonus') {
                    typeLabel = 'Bonus';
                    typeColor = 'primary';
                  }
                  
                  return (
                    <TableRow key={`${transaction.type}-${transaction.id}-${index}`}>
                      <TableCell>
                        {formatDate(transaction.timestamp || transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeLabel}
                          size="small"
                          color={typeColor}
                        />
                      </TableCell>
                      <TableCell>
                        {isSubscription ? 
                          `${transaction.plan_name} Plan - ${transaction.billing_cycle}` :
                          transaction.description
                        }
                      </TableCell>
                      <TableCell align="right">
                        {isCredit ? (
                          <Typography 
                            variant="body2" 
                            color={isPurchase ? "success.main" : isUsage ? "warning.main" : "primary.main"}
                            fontWeight="bold"
                          >
                            {isPurchase ? '+' : isUsage ? '-' : '+'}{formatCredits(transaction.credits_amount || transaction.amount)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={transaction.amount_paid > 0 ? "text.primary" : "text.secondary"}
                          fontWeight={transaction.amount_paid > 0 ? "bold" : "normal"}
                        >
                          {formatAmount(transaction.amount_paid, transaction.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={transaction.status || "Completed"}
                          size="small"
                          color={
                            (transaction.status || "Completed").toLowerCase() === 'completed' || 
                            (transaction.status || "Completed").toLowerCase() === 'active' ? 
                            "success" : "default"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionTable;