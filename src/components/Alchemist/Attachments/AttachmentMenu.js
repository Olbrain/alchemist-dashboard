/**
 * Attachment Menu
 * 
 * Simple menu component for attaching images or files
 */
import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const AttachmentMenu = ({ 
  onAttachImage,
  onAttachFile,
  disabled = false,
  color = 'default'
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAttachImage = () => {
    handleClose();
    onAttachImage?.();
  };

  const handleAttachFile = () => {
    handleClose();
    onAttachFile?.();
  };

  return (
    <>
      <Tooltip title="Attach files">
        <IconButton
          onClick={handleClick}
          disabled={disabled}
          size="small"
          color={color}
          sx={{
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <AttachFileIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <MenuItem 
          onClick={handleAttachImage}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ImageIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Attach Image"
            secondary="Upload images for AI analysis"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>

        <MenuItem 
          onClick={handleAttachFile}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FileIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Attach File"
            secondary="Upload documents, code, or configs"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default AttachmentMenu;