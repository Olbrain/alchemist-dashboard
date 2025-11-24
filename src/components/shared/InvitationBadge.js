import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Mail as MailIcon,
  Business as BusinessIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
// import invitationService from '../../services/invitations/invitationService'; // REMOVED: Invitation service deleted
import { createSuccessNotification, createErrorNotification } from '../shared/NotificationSystem';

const InvitationBadge = () => {
  const { pendingInvitations, pendingInvitationsCount, refreshPendingInvitations } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [processingInvitations, setProcessingInvitations] = useState(new Set());
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAccept = async (invitation) => {
    try {
      setProcessingInvitations((prev) => new Set(prev).add(invitation.id));

      // await invitationService.acceptInvitation(invitation.id); // REMOVED: invitationService deleted
      console.warn('Invitation service removed - acceptance not implemented');

      const invitationType = invitation.isProjectInvitation ? 'project' : 'organization';
      const displayName = invitation.projectName || invitation.organizationName || invitationType;

      createSuccessNotification(
        'Invitation Accepted',
        `You've joined ${displayName}`
      );

      // Refresh invitations and user memberships
      await refreshPendingInvitations();

      setProcessingInvitations((prev) => {
        const next = new Set(prev);
        next.delete(invitation.id);
        return next;
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      createErrorNotification(
        'Failed to Accept',
        error.message || 'Could not accept the invitation'
      );

      setProcessingInvitations((prev) => {
        const next = new Set(prev);
        next.delete(invitation.id);
        return next;
      });
    }
  };

  const handleDecline = async (invitation) => {
    try {
      setProcessingInvitations((prev) => new Set(prev).add(invitation.id));

      // await invitationService.declineInvitation(invitation.id, 'Declined from notification'); // REMOVED: invitationService deleted
      console.warn('Invitation service removed - decline not implemented');

      const invitationType = invitation.isProjectInvitation ? 'project' : 'organization';
      const displayName = invitation.projectName || invitation.organizationName || invitationType;

      createSuccessNotification(
        'Invitation Declined',
        `You've declined the invitation to ${displayName}`
      );

      // Refresh invitations
      await refreshPendingInvitations();

      setProcessingInvitations((prev) => {
        const next = new Set(prev);
        next.delete(invitation.id);
        return next;
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      createErrorNotification(
        'Failed to Decline',
        error.message || 'Could not decline the invitation'
      );

      setProcessingInvitations((prev) => {
        const next = new Set(prev);
        next.delete(invitation.id);
        return next;
      });
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role) => {
    const roleColors = {
      owner: 'error',
      admin: 'warning',
      editor: 'primary',
      viewer: 'default',
      member: 'info',
    };
    return roleColors[role?.toLowerCase()] || 'default';
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="invitations"
        aria-controls={open ? 'invitation-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={pendingInvitationsCount} color="error">
          <MailIcon />
        </Badge>
      </IconButton>

      <Menu
        id="invitation-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Invitations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pendingInvitationsCount} pending
          </Typography>
        </Box>

        {pendingInvitations.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <MailIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No pending invitations
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {pendingInvitations.map((invitation, index) => {
              const isProcessing = processingInvitations.has(invitation.id);
              const displayName = invitation.isProjectInvitation
                ? invitation.projectName
                : invitation.organizationName;
              const invitationType = invitation.isProjectInvitation ? 'Project' : 'Organization';
              const IconComponent = invitation.isProjectInvitation ? FolderIcon : BusinessIcon;

              return (
                <React.Fragment key={invitation.id}>
                  {index > 0 && <Divider />}
                  <Box sx={{ px: 2, py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: 'primary.main' }}>
                        <IconComponent />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>
                          {invitationType} Invitation
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {displayName || 'Unknown'}
                        </Typography>
                        {invitation.isProjectInvitation && invitation.organizationName && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            in {invitation.organizationName}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {invitation.inviterName || invitation.invitedBy} invited you
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={invitation.role || 'Member'}
                            size="small"
                            color={getRoleColor(invitation.role)}
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                          <Typography variant="caption" color="text.disabled">
                            {formatTimeAgo(invitation.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={isProcessing ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                        onClick={() => handleAccept(invitation)}
                        disabled={isProcessing}
                        fullWidth
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={isProcessing ? <CircularProgress size={14} color="inherit" /> : <CancelIcon />}
                        onClick={() => handleDecline(invitation)}
                        disabled={isProcessing}
                        fullWidth
                      >
                        Decline
                      </Button>
                    </Box>
                  </Box>
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </Menu>
    </>
  );
};

export default InvitationBadge;
