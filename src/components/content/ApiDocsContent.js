import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Snackbar,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';

const ApiDocsContent = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [copiedText, setCopiedText] = useState('');
  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  // Helper function to copy code to clipboard
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setShowCopyMessage(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };

  // Python Code examples
  const pythonInstallationCode = `pip install alchemist-python-sdk`;

  const pythonQuickStartCode = `from alchemist import AgentClient

# Initialize the client
client = AgentClient(
    agent_id="your_agent_id_here",
    api_key="ak_your_api_key_here"
)

# Create a session - returns session_id string
session_id = client.create_session(user_id="${currentUser?.uid || 'your_user_id'}")

# Send a message using the session_id
response = client.send_message(session_id, "Hello! How can you help me?")
print(response.text)`;

  // JavaScript Code examples
  const jsInstallationCode = `npm install alchemist-js-sdk`;

  const jsQuickStartCode = `const { AgentClient } = require('alchemist-js-sdk');

// Initialize the client
const client = new AgentClient(
  "your_agent_id_here",
  "ak_your_api_key_here"
);

// Create a session - returns session_id string
const sessionId = await client.createSession("${currentUser?.uid || 'your_user_id'}");

// Send a message using the session_id
const response = await client.sendMessage(sessionId, "Hello! How can you help me?");
console.log(response.text);`;

  const jsQuickStartTypeScriptCode = `import { AgentClient, ChatResponse } from 'alchemist-js-sdk';

// Initialize the client
const client = new AgentClient(
  "your_agent_id_here",
  "ak_your_api_key_here"
);

// Create a session - returns session_id string
const sessionId: string = await client.createSession("${currentUser?.uid || 'your_user_id'}");

// Send a message using the session_id
const response: ChatResponse = await client.sendMessage(sessionId, "Hello! How can you help me?");
console.log(response.text);`;

  // Dynamic code selection based on language
  const installationCode = selectedLanguage === 'python' ? pythonInstallationCode : jsInstallationCode;
  const quickStartCode = selectedLanguage === 'python' ? pythonQuickStartCode : jsQuickStartCode;

  // Python advanced examples
  const pythonSessionManagementCode = `from alchemist import AgentClient

client = AgentClient(
    agent_id="your_agent_id_here",
    api_key="ak_your_api_key_here"
)

# Create a new session - returns session_id string
session_id = client.create_session(
    user_id="${currentUser?.uid || 'user123'}",
    metadata={"context": "customer_support"}
)

# Send multiple messages using the session_id
response1 = client.send_message(session_id, "What services do you offer?")
response2 = client.send_message(session_id, "Tell me more about pricing")

# Get conversation history using session_id
history = client.get_session_history(session_id, include_metadata=False)
for message in history:
    print(f"{message['role']}: {message['content']}")

# Save session_id for later use
print(f"Session ID: {session_id}")`;

  const pythonStreamingCode = `from alchemist import AgentClient

client = AgentClient(
    agent_id="your_agent_id_here",
    api_key="ak_your_api_key_here"
)

# Create session
session_id = client.create_session(user_id="${currentUser?.uid || 'user123'}")

# Stream response using session_id
for chunk in client.stream_message(session_id, "Tell me a story"):
    print(chunk, end='', flush=True)`;

  const pythonErrorHandlingCode = `from alchemist import AgentClient, AuthenticationError, SessionError

try:
    client = AgentClient(
        agent_id="your_agent_id_here",
        api_key="ak_your_api_key_here"
    )

    # Create session and send message
    session_id = client.create_session(user_id="${currentUser?.uid || 'user123'}")
    response = client.send_message(session_id, "Hello")
    print(response.text)

except AuthenticationError:
    print("Invalid API key")
except SessionError as e:
    print(f"Session error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")`;

  // JavaScript advanced examples
  const jsSessionManagementCode = `const { AgentClient } = require('alchemist-js-sdk');

const client = new AgentClient(
  "your_agent_id_here",
  "ak_your_api_key_here"
);

// Create a new session - returns session_id string
const sessionId = await client.createSession(
  "${currentUser?.uid || 'user123'}",
  { context: "customer_support" }
);

// Send multiple messages using the session_id
const response1 = await client.sendMessage(sessionId, "What services do you offer?");
const response2 = await client.sendMessage(sessionId, "Tell me more about pricing");

// Get conversation history using session_id
const history = await client.getSessionHistory(sessionId, 50, false);
history.forEach(message => {
  console.log(\`\${message.role}: \${message.content}\`);
});

// Save session_id for later use
console.log(\`Session ID: \${sessionId}\`);`;

  const jsStreamingCode = `const { AgentClient } = require('alchemist-js-sdk');

const client = new AgentClient(
  "your_agent_id_here",
  "ak_your_api_key_here"
);

// Create session
const sessionId = await client.createSession("${currentUser?.uid || 'user123'}");

// Stream response using session_id
for await (const chunk of client.streamMessage(sessionId, "Tell me a story")) {
  process.stdout.write(chunk);
}`;

  const jsErrorHandlingCode = `import {
  AgentClient,
  AuthenticationError,
  SessionError,
  NetworkError
} from 'alchemist-js-sdk';

try {
  const client = new AgentClient(
    "your_agent_id_here",
    "ak_your_api_key_here"
  );

  // Create session and send message
  const sessionId = await client.createSession("${currentUser?.uid || 'user123'}");
  const response = await client.sendMessage(sessionId, "Hello");
  console.log(response.text);

} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof SessionError) {
    console.error(\`Session error: \${error.message}\`);
  } else if (error instanceof NetworkError) {
    console.error(\`Network error: \${error.message}\`);
  } else {
    console.error(\`Unexpected error: \${error.message}\`);
  }
}`;

  // Dynamic code selection based on language
  const sessionManagementCode = selectedLanguage === 'python' ? pythonSessionManagementCode : jsSessionManagementCode;
  const streamingCode = selectedLanguage === 'python' ? pythonStreamingCode : jsStreamingCode;
  const errorHandlingCode = selectedLanguage === 'python' ? pythonErrorHandlingCode : jsErrorHandlingCode;

  const CodeBlock = ({ code, language, label }) => {
    const displayLanguage = language || (selectedLanguage === 'python' ? 'python' : 'javascript');

    return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: 'grey.50',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.100' }}>
        <Chip
          icon={<CodeIcon />}
          label={displayLanguage.toUpperCase()}
          size="small"
          variant="outlined"
        />
        <Tooltip title={`Copy ${label || 'code'}`}>
          <IconButton
            size="small"
            onClick={() => copyToClipboard(code, label || 'code')}
          >
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          p: 2,
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          backgroundColor: '#fafafa',
          overflowX: 'auto',
          whiteSpace: 'pre',
          color: '#333'
        }}
      >
        {code}
      </Box>
    </Paper>
    );
  };

  const TabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            {/* Installation */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TerminalIcon sx={{ mr: 1 }} />
                  Installation
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Install the Alchemist {selectedLanguage === 'python' ? 'Python SDK using pip' : 'JavaScript SDK using npm'}:
                </Typography>
                <CodeBlock code={installationCode} language="bash" label="installation command" />
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PlayIcon sx={{ mr: 1 }} />
                  Quick Start
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Get started with the Alchemist API in just a few lines of code:
                </Typography>
                <CodeBlock code={quickStartCode} label="quick start example" />

                {selectedLanguage === 'javascript' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      TypeScript example:
                    </Typography>
                    <CodeBlock code={jsQuickStartTypeScriptCode} language="typescript" label="TypeScript quick start" />
                  </Box>
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Replace <code>your_agent_id_here</code> with your actual agent ID and <code>ak_your_api_key_here</code> with your API key.
                    You can find both in your agent's profile page.
                    {selectedLanguage === 'javascript' && (
                      <> The SDK works in both Node.js and browsers with full TypeScript support.</>
                    )}
                  </Typography>
                </Alert>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardContent>
                <Typography variant="body1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1 }} />
                  Your Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Your User ID</Typography>
                      <Typography variant="body1" fontFamily="monospace" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, wordBreak: 'break-all' }}>
                        {currentUser?.uid || 'Not logged in'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary">
                  Use this User ID when creating sessions to track conversations per user.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      case 1:
        return (
          <Box>
            {/* Session Management */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body1" fontWeight="600" gutterBottom>Session Management</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  All interactions with agents must use sessions. Here's how to create and manage sessions:
                </Typography>
                <CodeBlock code={sessionManagementCode} label="session management example" />
              </CardContent>
            </Card>

            {/* Streaming */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon sx={{ mr: 1 }} />
                  Streaming Responses
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Get real-time streaming responses from agents:
                </Typography>
                <CodeBlock code={streamingCode} label="streaming example" />
              </CardContent>
            </Card>

            {/* Error Handling */}
            <Card>
              <CardContent>
                <Typography variant="body1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1 }} />
                  Error Handling
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Properly handle errors and exceptions:
                </Typography>
                <CodeBlock code={errorHandlingCode} label="error handling example" />
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box>
            {/* API Reference */}
            <Typography variant="body1" fontWeight="600" sx={{ mb: 3 }}>API Reference</Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body1" fontWeight="600">AgentClient</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Main client class for interacting with agents.
                </Typography>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Constructor</Typography>
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLanguage === 'python' ?
                      'AgentClient(agent_id, api_key, timeout=120)' :
                      'new AgentClient(agentId, apiKey, options?)'
                    }
                  </Typography>
                </Box>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Parameters:</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" fontFamily="monospace">
                        {selectedLanguage === 'python' ? 'agent_id (str)' : 'agentId (string)'}
                      </Typography>}
                      secondary="The unique identifier for the agent"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" fontFamily="monospace">
                        {selectedLanguage === 'python' ? 'api_key (str)' : 'apiKey (string)'}
                      </Typography>}
                      secondary="Your API key for authentication"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" fontFamily="monospace">
                        {selectedLanguage === 'python' ? 'timeout (int, optional)' : 'options (object, optional)'}
                      </Typography>}
                      secondary={selectedLanguage === 'python' ?
                        'Request timeout in seconds (default: 120)' :
                        'Configuration options (timeout, maxRetries, headers)'
                      }
                    />
                  </ListItem>
                </List>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Methods</Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {selectedLanguage === 'python' ?
                      'create_session(user_id=None, metadata=None)' :
                      'createSession(userId?, metadata?)'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Creates a new session and returns a session_id string.
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    {selectedLanguage === 'python' ?
                      'send_message(session_id, message, user_id=None, metadata=None)' :
                      'sendMessage(sessionId, message, userId?, metadata?)'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Sends a message to the specified session and returns the agent's response.
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    {selectedLanguage === 'python' ?
                      'stream_message(session_id, message, user_id=None, metadata=None)' :
                      'streamMessage(sessionId, message, userId?, metadata?)'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedLanguage === 'python' ?
                      'Sends a message and returns an iterator for streaming response chunks.' :
                      'Sends a message and returns an AsyncIterableIterator for streaming response chunks.'
                    }
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    {selectedLanguage === 'python' ?
                      'get_session_history(session_id, limit=50, include_metadata=True)' :
                      'getSessionHistory(sessionId, limit?, includeMetadata?)'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Retrieves the conversation history for the specified session.
                  </Typography>

                  {selectedLanguage === 'javascript' && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        getSessionInfo(sessionId)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Gets session information including user ID, creation time, and metadata.
                      </Typography>

                      <Typography variant="subtitle2" gutterBottom>
                        deleteSession(sessionId)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Deletes a session and its conversation history.
                      </Typography>
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body1" fontWeight="600">Response Objects</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Objects returned by the SDK methods.
                </Typography>

                <Typography variant="subtitle1" gutterBottom>ChatResponse</Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Properties:</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="body2" fontFamily="monospace">text</Typography>}
                        secondary="The agent's response text"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="body2" fontFamily="monospace">
                          {selectedLanguage === 'python' ? 'session_id' : 'sessionId'}
                        </Typography>}
                        secondary="The session ID for this conversation"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="body2" fontFamily="monospace">success</Typography>}
                        secondary="Boolean indicating if the request was successful"
                      />
                    </ListItem>
                  </List>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body1" fontWeight="600">Exceptions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" fontFamily="monospace">AlchemistError</Typography>}
                      secondary="Base exception for all SDK errors"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" fontFamily="monospace">AuthenticationError</Typography>}
                      secondary="Invalid API key or authentication failure"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" fontFamily="monospace">SessionError</Typography>}
                      secondary="Session creation or management error"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" fontFamily="monospace">NetworkError</Typography>}
                      secondary="Network connection or timeout error"
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body1" fontWeight="600" sx={{ mb: 0.5 }}>
            API Documentation
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={selectedLanguage}
              label="Language"
              onChange={handleLanguageChange}
            >
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="javascript">JavaScript</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Complete guide to integrating with the Alchemist platform using the {selectedLanguage === 'python' ? 'Python' : 'JavaScript'} SDK
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Getting Started" />
          <Tab label="Advanced Usage" />
          <Tab label="API Reference" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <TabContent />
      </Box>

      {/* Copy Success Message */}
      <Snackbar
        open={showCopyMessage}
        autoHideDuration={2000}
        onClose={() => setShowCopyMessage(false)}
        message={`${copiedText} copied to clipboard`}
        action={
          <IconButton size="small" color="inherit" onClick={() => setShowCopyMessage(false)}>
            <CheckIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default ApiDocsContent;