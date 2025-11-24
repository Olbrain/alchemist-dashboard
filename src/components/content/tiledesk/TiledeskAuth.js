/**
 * Tiledesk Authentication Component
 *
 * Handles user authentication for Tiledesk integration
 * Two methods: Sign in with credentials OR Use JWT token
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon
} from '@mui/icons-material';

import tiledeskService from '../../../services/tiledesk/tiledeskService';
import TiledeskAuthStorage from './components/TiledeskAuthStorage';
import { CardTitle } from '../../../utils/typography';

const TiledeskAuth = ({ onAuthSuccess }) => {
  const [authMethod, setAuthMethod] = useState('credentials'); // 'credentials' or 'token'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Credentials method state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [projectId, setProjectId] = useState('');

  // Token method state
  const [jwtToken, setJwtToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenProjectId, setTokenProjectId] = useState('');

  const handleCredentialsSignIn = async () => {
    try {
      setError(null);

      // Validate inputs
      if (!projectId.trim()) {
        setError('Please enter Tiledesk Project ID');
        return;
      }

      if (!tiledeskService.validateProjectId(projectId)) {
        setError('Invalid Project ID format. It should be a 24-character hexadecimal string.');
        return;
      }

      if (!email.trim()) {
        setError('Please enter your Tiledesk email');
        return;
      }

      if (!password.trim()) {
        setError('Please enter your Tiledesk password');
        return;
      }

      setLoading(true);

      // Sign in to get JWT token
      const result = await tiledeskService.signIn(
        email.trim(),
        password.trim(),
        projectId.trim()
      );

      // Store authentication data
      TiledeskAuthStorage.setAuth({
        token: result.token,
        projectId: projectId.trim(),
        email: email.trim()
      });

      // Clear password from memory
      setPassword('');

      // Notify parent of successful authentication
      if (onAuthSuccess) {
        onAuthSuccess({
          token: result.token,
          projectId: projectId.trim(),
          email: email.trim(),
          user: result.user
        });
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSignIn = async () => {
    try {
      setError(null);

      // Validate inputs
      if (!tokenProjectId.trim()) {
        setError('Please enter Tiledesk Project ID');
        return;
      }

      if (!tiledeskService.validateProjectId(tokenProjectId)) {
        setError('Invalid Project ID format. It should be a 24-character hexadecimal string.');
        return;
      }

      if (!jwtToken.trim()) {
        setError('Please enter JWT Token');
        return;
      }

      if (!tiledeskService.validateApiToken(jwtToken)) {
        setError('Invalid token format. Token is too short.');
        return;
      }

      setLoading(true);

      // Validate token by trying to fetch bots (or any authenticated endpoint)
      try {
        await tiledeskService.listBots(tokenProjectId.trim(), jwtToken.trim());
      } catch (validateError) {
        throw new Error('Invalid token or insufficient permissions');
      }

      // Store authentication data
      TiledeskAuthStorage.setAuth({
        token: jwtToken.trim(),
        projectId: tokenProjectId.trim()
      });

      // Notify parent of successful authentication
      if (onAuthSuccess) {
        onAuthSuccess({
          token: jwtToken.trim(),
          projectId: tokenProjectId.trim()
        });
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError(err.message || 'Invalid token. Please check your JWT token and project ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <CardTitle sx={{ mb: 2 }}>
            Sign in to Tiledesk
          </CardTitle>

          <Typography variant="body2" color="text.secondary" paragraph>
            Authenticate with your Tiledesk account to manage bots for your agent
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={authMethod}
              onChange={(e, newValue) => {
                setAuthMethod(newValue);
                setError(null);
              }}
            >
              <Tab label="Sign in with Credentials" value="credentials" />
              <Tab label="Use JWT Token" value="token" />
            </Tabs>
          </Box>

          {authMethod === 'credentials' ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Tiledesk Project ID"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  fullWidth
                  required
                  placeholder="5f1234567890abcdef123456"
                  helperText="24-character hexadecimal ID from your Tiledesk project"
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  placeholder="your@email.com"
                  helperText="Your Tiledesk account email"
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  placeholder="Enter your password"
                  helperText="Your Tiledesk account password"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  We'll securely sign you in to Tiledesk and obtain a JWT token for bot management.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCredentialsSignIn}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Tiledesk Project ID"
                  value={tokenProjectId}
                  onChange={(e) => setTokenProjectId(e.target.value)}
                  fullWidth
                  required
                  placeholder="5f1234567890abcdef123456"
                  helperText="24-character hexadecimal ID from your Tiledesk project"
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="JWT Token"
                  type={showToken ? 'text' : 'password'}
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  fullWidth
                  required
                  placeholder="Enter your JWT token"
                  helperText="User JWT token with bot management permissions"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowToken(!showToken)}
                          edge="end"
                          disabled={loading}
                        >
                          {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                  <strong>Note:</strong> You need a <em>user</em> JWT token (not a bot token). Obtain it by calling:
                  <code style={{ display: 'block', marginTop: '8px', padding: '4px', background: '#f5f5f5' }}>
                    POST https://api.tiledesk.com/v3/auth/signin
                  </code>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleTokenSignIn}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                >
                  {loading ? 'Validating...' : 'Continue with Token'}
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TiledeskAuth;
