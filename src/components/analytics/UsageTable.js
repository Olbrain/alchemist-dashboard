/**
 * Usage Table Component
 *
 * Displays usage data in a tabular format with sorting and filtering
 */
import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Assignment as ProjectIcon,
  Business as OrganizationIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';

const UsageTable = ({
  title,
  data = [],
  type = 'agents', // 'agents', 'projects', 'organizations'
  columns = ['name', 'tokens', 'messages', 'sessions'],
  onRowClick,
  showProgress = false,
  maxRows = 10,
  sortable = true
}) => {
  const theme = useTheme();
  const [orderBy, setOrderBy] = useState('tokens');
  const [order, setOrder] = useState('desc');

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = useMemo(() => {
    if (!sortable) return data.slice(0, maxRows);

    const sorted = [...data].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Handle name field
      if (orderBy === 'name') {
        aValue = getItemName(a, type);
        bValue = getItemName(b, type);
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numeric fields
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted.slice(0, maxRows);
  }, [data, orderBy, order, maxRows, sortable, type]);

  function getItemName(item, type) {
    switch (type) {
      case 'agents':
        return item.agent_name || item.name || 'Untitled Agent';
      case 'projects':
        return item.project_name || item.name || 'Untitled Project';
      case 'organizations':
        return item.organization_name || item.name || 'Untitled Organization';
      case 'sessions':
        return item.session_name || item.name || 'Untitled Session';
      default:
        return item.name || 'Untitled';
    }
  }

  function getItemIcon(type) {
    switch (type) {
      case 'agents':
        return <AgentIcon fontSize="small" />;
      case 'projects':
        return <ProjectIcon fontSize="small" />;
      case 'organizations':
        return <OrganizationIcon fontSize="small" />;
      default:
        return <AgentIcon fontSize="small" />;
    }
  }

  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }

  function getColumnLabel(column) {
    switch (column) {
      case 'name':
        return 'Name';
      case 'tokens':
        return 'Tokens';
      case 'messages':
        return 'Messages';
      case 'sessions':
        return 'Sessions';
      case 'cost':
        return 'Cost';
      case 'usage_percentage':
        return 'Usage %';
      default:
        return column.charAt(0).toUpperCase() + column.slice(1);
    }
  }

  function getColumnValue(item, column) {
    switch (column) {
      case 'name':
        return getItemName(item, type);
      case 'tokens':
        return item.total_tokens || 0;
      case 'messages':
        return item.total_messages || item.message_count || 0;
      case 'sessions':
        return item.total_sessions || 0;
      case 'cost':
        return item.total_cost || item.cost || 0;
      case 'usage_percentage':
        return item.usage_percentage || 0;
      default:
        return item[column] || 0;
    }
  }

  function renderCellContent(item, column) {
    const value = getColumnValue(item, column);

    switch (column) {
      case 'name':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              }}
            >
              {getItemIcon(type)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="500">
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {type === 'agents' && item.agent_id && `ID: ${item.agent_id.substring(0, 8)}`}
                {type === 'projects' && item.project_id && `ID: ${item.project_id.substring(0, 8)}`}
              </Typography>
            </Box>
          </Box>
        );

      case 'tokens':
      case 'messages':
      case 'sessions':
        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight="500">
              {formatNumber(value)}
            </Typography>
          </Box>
        );

      case 'cost':
        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight="500">
              ${value.toFixed(2)}
            </Typography>
          </Box>
        );

      case 'usage_percentage':
        return (
          <Box sx={{ minWidth: 100 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight="500">
                {value.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(value, 100)}
              color={value < 50 ? 'success' : value < 80 ? 'warning' : 'error'}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        );

      default:
        return (
          <Typography variant="body2">
            {typeof value === 'number' ? formatNumber(value) : value}
          </Typography>
        );
    }
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" fontWeight="600" gutterBottom>
            {title}
          </Typography>
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2">
              No {type} data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="body1" fontWeight="600">
            {title}
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    align={column === 'name' ? 'left' : 'right'}
                    sortDirection={orderBy === column ? order : false}
                  >
                    {sortable ? (
                      <TableSortLabel
                        active={orderBy === column}
                        direction={orderBy === column ? order : 'asc'}
                        onClick={() => handleSort(column)}
                        sx={{ fontWeight: 600 }}
                      >
                        {getColumnLabel(column)}
                      </TableSortLabel>
                    ) : (
                      <Typography variant="body2" fontWeight="600">
                        {getColumnLabel(column)}
                      </Typography>
                    )}
                  </TableCell>
                ))}
                {onRowClick && (
                  <TableCell align="center" width={50}>
                    <Typography variant="body2" fontWeight="600">
                      Action
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow
                  key={item.agent_id || item.project_id || item.organization_id || index}
                  hover={!!onRowClick}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': {
                      bgcolor: onRowClick ? 'action.hover' : 'inherit'
                    }
                  }}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      align={column === 'name' ? 'left' : 'right'}
                      sx={{ py: 2 }}
                    >
                      {renderCellContent(item, column)}
                    </TableCell>
                  ))}
                  {onRowClick && (
                    <TableCell align="center">
                      <Tooltip title={`View ${type.slice(0, -1)} details`}>
                        <IconButton size="small" color="primary">
                          <OpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default UsageTable;