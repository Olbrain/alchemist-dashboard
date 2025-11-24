/**
 * Project Member Management Dialog
 *
 * Dialog for managing project members - view, add, remove, and change roles
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  PersonRemove as PersonRemoveIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import { getProjectMembers, removeProjectMember, getProject } from '../../services/projects/projectService';
import InviteMemberToProjectDialog from './InviteMemberToProjectDialog';

const ProjectMemberManagementDialog = ({ open, onClose, project, onMembersUpdated }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [projectData, setProjectData] = useState(null);

  const projectId = project?.id || project?.project_id;
  const projectName = project?.project_info?.name || 'Project';

  // Check if current user is project owner
  const isProjectOwner = currentUser?.uid === project?.team_access?.owner_id;

  // Fetch project members
  const fetchMembers = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const memberData = await getProjectMembers(projectId);
      setMembers(memberData);
    } catch (err) {
      console.error('Error fetching project members:', err);
      setError('Failed to load project members');
    } finally {
      setLoading(false);
    }
  };

  // Fetch project data to get owner info
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;
      try {
        const data = await getProject(projectId);
        setProjectData(data);
      } catch (err) {
        console.error('Error fetching project data:', err);
      }
    };

    if (open) {
      fetchProjectData();
      fetchMembers();
    }
  }, [open, projectId]);

  // Handle member menu
  const handleMemberMenuClick = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMemberMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  // Handle remove member
  const handleRemoveMember = async () => {
    if (!selectedMember || !projectId) return;

    try {
      await removeProjectMember(projectId, selectedMember.id);
      setSuccessMessage(`${selectedMember.user_info?.basic_info?.display_name || 'Member'} removed from project`);
      handleMemberMenuClose();
      await fetchMembers();
      if (onMembersUpdated) onMembersUpdated();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle member added
  const handleMemberAdded = async () => {
    await fetchMembers();
    if (onMembersUpdated) onMembersUpdated();
  };

  // Get role info
  const getRoleInfo = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return { label: 'Owner', color: 'error' };
      case 'member':
      default:
        return { label: 'Member', color: 'primary' };
    }
  };

  // Get user display name
  const getUserDisplayName = (member) => {
    return member.user_info?.basic_info?.display_name ||
           member.user_info?.basic_info?.email?.split('@')[0] ||
           'Unknown User';
  };

  // Get user initials
  const getUserInitials = (member) => {
    const name = getUserDisplayName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GroupIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight="600">
                Project Members
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {projectName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {/* Invite Member Button */}
          {isProjectOwner && (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setInviteMemberDialogOpen(true)}
                fullWidth
              >
                Invite Member
              </Button>
            </Box>
          )}

          {/* Members List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Active Members Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" color="text.secondary" sx={{ mb: 1.5 }}>
                  Active Members ({members.filter(m => m.status === 'active').length})
                </Typography>

                {members.filter(m => m.status === 'active').length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <GroupIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No active members yet
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ pt: 0, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    {members.filter(m => m.status === 'active').map((member, index) => {
                      const roleInfo = getRoleInfo(member.role);
                      const isOwner = member.user_id === project?.team_access?.owner_id;
                      const displayRole = isOwner ? { label: 'Owner', color: 'error' } : roleInfo;

                      return (
                        <React.Fragment key={member.id || member.user_id}>
                          {index > 0 && <Divider />}
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <Avatar
                              src={member.user_info?.basic_info?.profile_picture_url}
                              sx={{ width: 40, height: 40 }}
                            >
                              {getUserInitials(member)}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body1" fontWeight="500">
                                {getUserDisplayName(member)}
                                {member.user_id === currentUser?.uid && (
                                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    (You)
                                  </Typography>
                                )}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {member.user_info?.basic_info?.email || member.email || ''}
                              </Typography>
                            </Box>
                            <Chip
                              label={displayRole.label}
                              color={displayRole.color}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                            {isProjectOwner && !isOwner && (
                              <IconButton
                                size="small"
                                onClick={(e) => handleMemberMenuClick(e, member)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            )}
                          </ListItem>
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </Box>

              {/* Pending Invitations Section */}
              {members.filter(m => m.status === 'pending').length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" color="text.secondary" sx={{ mb: 1.5 }}>
                    Pending Invitations ({members.filter(m => m.status === 'pending').length})
                  </Typography>

                  <List sx={{ pt: 0, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.light' }}>
                    {members.filter(m => m.status === 'pending').map((member, index) => {
                      const roleInfo = getRoleInfo(member.role);

                      return (
                        <React.Fragment key={member.id || member.email}>
                          {index > 0 && <Divider />}
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <Avatar
                              src={member.user_info?.basic_info?.profile_picture_url}
                              sx={{ width: 40, height: 40, bgcolor: 'warning.light' }}
                            >
                              <EmailIcon />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body1" fontWeight="500">
                                {member.user_info?.basic_info?.email || member.email || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Invitation pending
                              </Typography>
                            </Box>
                            <Chip
                              label={roleInfo.label}
                              color={roleInfo.color}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                            {isProjectOwner && (
                              <IconButton
                                size="small"
                                onClick={(e) => handleMemberMenuClick(e, member)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            )}
                          </ListItem>
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMemberMenuClose}
      >
        {selectedMember?.status === 'pending' ? (
          // Menu for pending invitations
          <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
            <PersonRemoveIcon fontSize="small" sx={{ mr: 1 }} />
            Cancel Invitation
          </MenuItem>
        ) : (
          // Menu for active members
          <>
            <MenuItem onClick={handleMemberMenuClose}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Change Role
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
              <PersonRemoveIcon fontSize="small" sx={{ mr: 1 }} />
              Remove from Project
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Invite Member Dialog */}
      <InviteMemberToProjectDialog
        open={inviteMemberDialogOpen}
        onClose={() => setInviteMemberDialogOpen(false)}
        project={project}
        onMemberInvited={handleMemberAdded}
      />
    </>
  );
};

export default ProjectMemberManagementDialog;
