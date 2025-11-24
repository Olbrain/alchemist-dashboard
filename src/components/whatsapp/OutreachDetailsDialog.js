import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { db } from '../../utils/firebase';
// import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'; // REMOVED: Firebase/Firestore

// FIRESTORE STUBS - These functions are stubbed because Firestore is disabled
const collection = (...args) => { console.warn('Firestore disabled: collection() called'); return null; };
const query = (...args) => { console.warn('Firestore disabled: query() called'); return null; };
const where = (...args) => { console.warn('Firestore disabled: where() called'); return null; };
const orderBy = (...args) => { console.warn('Firestore disabled: orderBy() called'); return null; };
const onSnapshot = (...args) => { console.warn('Firestore disabled: onSnapshot() called'); const callback = args.find(a => typeof a === 'function'); if (callback) setTimeout(() => callback({ docs: [], size: 0, forEach: () => {} }), 0); return () => {}; };


export default function OutreachDetailsDialog({ open, onClose, agentId, task, createNotification }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe = null;

    if (open && task?.id && agentId) {
      try {
        setLoading(true);

        // Reference to the messages subcollection in new outreach collection
        const messagesRef = collection(db, 'outreach', agentId, 'messages');

        // Query messages for this specific task, ordered by sent_at descending
        const messagesQuery = query(
          messagesRef,
          where('task_id', '==', task.id),
          orderBy('sent_at', 'desc')
        );

        // Set up real-time listener
        unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              // Convert Firestore timestamps to JavaScript Date objects
              sent_at: doc.data().sent_at?.toDate(),
              delivered_at: doc.data().delivered_at?.toDate(),
              read_at: doc.data().read_at?.toDate(),
              created_at: doc.data().created_at?.toDate(),
              updated_at: doc.data().updated_at?.toDate()
            }));
            setLogs(logsData);
            setLoading(false);
          },
          (error) => {
            console.error('Error loading outreach messages:', error);
            createNotification('error', 'Failed to load outreach details');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up messages listener:', error);
        createNotification('error', 'Failed to load outreach details');
        setLoading(false);
      }
    } else {
      // Reset state when dialog closes
      setLogs([]);
      setLoading(false);
    }

    // Cleanup listener when dialog closes or component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, agentId]);

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <DoneIcon fontSize="small" sx={{ color: '#666' }} />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" sx={{ color: '#666' }} />;
      case 'read':
        return <DoneAllIcon fontSize="small" sx={{ color: '#0088cc' }} />;
      case 'failed':
      case 'undelivered':
        return <ErrorIcon fontSize="small" sx={{ color: '#f44336' }} />;
      case 'pending':
        return <ScheduleIcon fontSize="small" sx={{ color: '#ff9800' }} />;
      default:
        return <CheckCircleIcon fontSize="small" sx={{ color: '#666' }} />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'default',
      delivered: 'info',
      read: 'success',
      failed: 'error',
      undelivered: 'error',
      pending: 'warning'
    };
    return colors[status] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Outreach Details
            </Typography>
            {task && (
              <Typography variant="caption" color="text.secondary">
                Task: {task.agent_instructions?.substring(0, 100)}
                {task.agent_instructions?.length > 100 ? '...' : ''}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Summary Stats - Enhanced */}
        {!loading && logs.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Summary
            </Typography>
            <Grid container spacing={1.5}>
              {/* Total Messages */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={1} sx={{ height: '100%', borderTop: '2px solid #2196f3' }}>
                  <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                      <MessageIcon sx={{ fontSize: 24, color: '#2196f3' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196f3' }}>
                      {logs.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                      Total Messages
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sent */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={1} sx={{ height: '100%', borderTop: '2px solid #9e9e9e' }}>
                  <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                      <SendIcon sx={{ fontSize: 24, color: '#9e9e9e' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#9e9e9e' }}>
                      {logs.filter(l => ['sent', 'delivered', 'read'].includes(l.status)).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                      Sent
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#9e9e9e', fontSize: '0.65rem', mt: 0.25 }}>
                      {logs.length > 0 ? Math.round((logs.filter(l => ['sent', 'delivered', 'read'].includes(l.status)).length / logs.length) * 100) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Delivered */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={1} sx={{ height: '100%', borderTop: '2px solid #03a9f4' }}>
                  <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                      <DoneAllIcon sx={{ fontSize: 24, color: '#03a9f4' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#03a9f4' }}>
                      {logs.filter(l => ['delivered', 'read'].includes(l.status)).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                      Delivered
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#03a9f4', fontSize: '0.65rem', mt: 0.25 }}>
                      {logs.length > 0 ? Math.round((logs.filter(l => ['delivered', 'read'].includes(l.status)).length / logs.length) * 100) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Read */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={1} sx={{ height: '100%', borderTop: '2px solid #4caf50' }}>
                  <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                      <VisibilityIcon sx={{ fontSize: 24, color: '#4caf50' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      {logs.filter(l => l.status === 'read').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                      Read
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#4caf50', fontSize: '0.65rem', mt: 0.25 }}>
                      {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'read').length / logs.length) * 100) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Failed/Undelivered */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={1} sx={{ height: '100%', borderTop: '2px solid #f44336' }}>
                  <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                      <ErrorIcon sx={{ fontSize: 24, color: '#f44336' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#f44336' }}>
                      {logs.filter(l => ['failed', 'undelivered'].includes(l.status)).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                      Failed/Undelivered
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#f44336', fontSize: '0.65rem', mt: 0.25 }}>
                      {logs.length > 0 ? Math.round((logs.filter(l => ['failed', 'undelivered'].includes(l.status)).length / logs.length) * 100) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Alert severity="info">
            No messages have been sent yet for this outreach task.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contact</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Message Preview</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow key={log.id || index} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {log.contact_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {log.contact_phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.template_name ? (
                        <Chip
                          label={log.template_name}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Freeform message
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {log.message_preview || log.message_content?.substring(0, 50) || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.sent_at ? (
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {log.sent_at instanceof Date ? log.sent_at.toLocaleString() : new Date(log.sent_at).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not sent yet
                        </Typography>
                      )}
                    </TableCell>                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getMessageStatusIcon(log.status)}
                        <Chip
                          label={log.status || 'pending'}
                          size="small"
                          color={getStatusColor(log.status)}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
