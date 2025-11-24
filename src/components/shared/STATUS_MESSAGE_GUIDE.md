# Status Message Components Guide

Reusable components for displaying alerts, errors, warnings, and information messages with consistent styling across the application.

## Components

### 1. StatusMessage
Base component for all status messages.

### 2. ErrorDisplay
Specialized component for error handling with smart error extraction.

---

## StatusMessage Component

### Basic Usage

```jsx
import StatusMessage from '../components/shared/StatusMessage';

<StatusMessage
  type="error"
  title="Something went wrong"
  message="Please try again later"
  variant="content"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `'info'` | Message type: `'error'`, `'warning'`, `'info'`, `'success'`, `'auth'` |
| `title` | string | - | Main heading |
| `message` | string | - | Detailed message |
| `variant` | string | `'content'` | Layout variant: `'fullPage'`, `'content'`, `'inline'`, `'compact'` |
| `icon` | Component | auto | Custom icon component (auto-selected based on type if not provided) |
| `code` | string | - | Error/status code to display |
| `actions` | array | `[]` | Array of action button configurations |
| `sx` | object | `{}` | Additional MUI sx styling |

### Message Types

**error** - Red, ErrorIcon
```jsx
<StatusMessage type="error" title="Error" message="Something failed" />
```

**warning** - Orange, WarningIcon
```jsx
<StatusMessage type="warning" title="Warning" message="Be careful" />
```

**info** - Blue, InfoIcon
```jsx
<StatusMessage type="info" title="Information" message="Here's something to know" />
```

**success** - Green, CheckCircleIcon
```jsx
<StatusMessage type="success" title="Success" message="Operation completed" />
```

**auth** - Red, LockIcon (for authentication errors)
```jsx
<StatusMessage type="auth" title="Authentication Failed" message="Invalid credentials" />
```

### Layout Variants

**fullPage** - Full viewport height, centered (100vh)
```jsx
<StatusMessage variant="fullPage" type="error" title="Critical Error" />
```

**content** - Flex container, centered in content area
```jsx
<StatusMessage variant="content" type="info" title="No Data" />
```

**inline** - Minimal spacing for forms/dialogs
```jsx
<StatusMessage variant="inline" type="warning" message="Check your input" />
```

**compact** - Minimal padding for small spaces
```jsx
<StatusMessage variant="compact" type="info" message="Quick note" />
```

### Actions

Add action buttons to your message:

```jsx
<StatusMessage
  type="error"
  title="Connection Failed"
  message="Unable to connect to server"
  actions={[
    {
      label: 'Retry',
      onClick: handleRetry,
      variant: 'contained',
      icon: <RefreshIcon />
    },
    {
      label: 'Cancel',
      onClick: handleCancel,
      variant: 'outlined'
    }
  ]}
/>
```

Action object properties:
- `label` (string, required): Button text
- `onClick` (function, required): Click handler
- `variant` (string): `'contained'` or `'outlined'`
- `color` (string): Button color
- `size` (string): Button size
- `icon` (Component): Start icon
- `disabled` (boolean): Disabled state

### Code Display

Show error codes or technical details:

```jsx
<StatusMessage
  type="error"
  title="Request Failed"
  message="The server returned an error"
  code="Error code: 500"
/>
```

---

## ErrorDisplay Component

Specialized component that automatically extracts error messages from various error formats.

### Basic Usage

```jsx
import ErrorDisplay from '../components/shared/ErrorDisplay';

<ErrorDisplay
  error={axiosError}
  variant="content"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | object/string | - | Error object (Axios error, Error, or string) |
| `variant` | string | `'content'` | Layout variant: `'fullPage'`, `'content'`, `'inline'` |
| `title` | string | auto | Custom title (auto-generated if not provided) |
| `message` | string | auto | Custom message (auto-generated if not provided) |
| `onRetry` | function | - | Retry handler (adds "Try Again" button) |
| `onReload` | function | - | Reload handler (adds "Reload Page" button) |
| `actions` | array | `[]` | Additional action buttons |
| `sx` | object | `{}` | Additional MUI sx styling |

### Automatic Error Extraction

ErrorDisplay automatically handles:

**Axios Errors with Response:**
- 401: "Authentication failed. Your API key may be invalid or expired."
- 403: "You don't have permission to access this resource."
- 404: "The requested resource was not found."
- 500: "A server error occurred. Please try again later."
- 503: "Service temporarily unavailable. Please try again later."

**Network Errors:**
- "Network error. Please check your connection and try again."

**Generic Errors:**
- Extracts `error.message` or `error.response.data.message`

### Examples

**Authentication Error:**
```jsx
<ErrorDisplay
  error={authError}
  variant="fullPage"
/>
```

**With Retry:**
```jsx
<ErrorDisplay
  error={loadError}
  variant="content"
  onRetry={() => loadData()}
/>
```

**With Reload:**
```jsx
<ErrorDisplay
  error={criticalError}
  variant="fullPage"
  onReload={() => window.location.reload()}
/>
```

**Custom Message:**
```jsx
<ErrorDisplay
  error={error}
  title="Custom Error Title"
  message="This overrides the auto-generated message"
  variant="inline"
/>
```

---

## Common Patterns

### Full-Page Authentication Error

```jsx
// In DashboardProvider.js
{authState.error && (
  <ErrorDisplay
    error={authState.error}
    variant="fullPage"
  />
)}
```

### Content Area Error

```jsx
// In DashboardContent.js
{authError ? (
  <ErrorDisplay
    error={authError}
    variant="content"
  />
) : loading ? (
  <CircularProgress />
) : (
  <Content />
)}
```

### Form Error

```jsx
// In a form component
{formError && (
  <ErrorDisplay
    error={formError}
    variant="inline"
    onRetry={handleSubmit}
  />
)}
```

### Success Message

```jsx
<StatusMessage
  type="success"
  title="Saved Successfully"
  message="Your changes have been saved"
  variant="inline"
/>
```

### Warning Message

```jsx
<StatusMessage
  type="warning"
  title="Unsaved Changes"
  message="You have unsaved changes that will be lost"
  variant="inline"
  actions={[
    { label: 'Save', onClick: handleSave, variant: 'contained' },
    { label: 'Discard', onClick: handleDiscard, variant: 'outlined' }
  ]}
/>
```

---

## Styling Customization

Both components accept `sx` prop for additional styling:

```jsx
<StatusMessage
  type="info"
  title="Custom Styling"
  sx={{
    backgroundColor: 'background.paper',
    border: 1,
    borderColor: 'divider',
    borderRadius: 2,
    p: 3
  }}
/>
```

---

## Design System

### Colors (from theme)

- **Error**: `#ef4444` (light) / `#f87171` (dark)
- **Warning**: `#f59e0b` (light) / `#fbbf24` (dark)
- **Info**: `#3b82f6` (light) / `#60a5fa` (dark)
- **Success**: `#10b981` (light) / `#34d399` (dark)

### Spacing

- Icon margin bottom: `16px` (2)
- Title margin bottom: `8px` (1)
- Message margin bottom: `16px` (2) when actions present
- Action button gap: `8px` (1)

### Typography

- **Title (fullPage/content)**: `h6`, fontWeight: 600
- **Title (inline/compact)**: `subtitle1`, fontWeight: 600
- **Message**: `body2`, color: text.secondary
- **Code**: `caption`, fontFamily: monospace

---

## Migration Guide

### From Alert to StatusMessage

**Before:**
```jsx
<Alert severity="error" sx={{ maxWidth: 500 }}>
  <AlertTitle>Error</AlertTitle>
  <Typography variant="body2">
    Something went wrong
  </Typography>
</Alert>
```

**After:**
```jsx
<StatusMessage
  type="error"
  title="Error"
  message="Something went wrong"
  variant="inline"
/>
```

### From Custom Error Display to ErrorDisplay

**Before:**
```jsx
{error && (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <Alert severity="error">
      <AlertTitle>
        {error.response?.status === 401 ? 'Auth Failed' : 'Error'}
      </AlertTitle>
      <Typography variant="body2">
        {error.response?.data?.message || error.message || 'Unknown error'}
      </Typography>
    </Alert>
  </Box>
)}
```

**After:**
```jsx
{error && <ErrorDisplay error={error} variant="content" />}
```

---

## Best Practices

1. **Use ErrorDisplay for error objects** - It handles error extraction automatically
2. **Use StatusMessage for custom messages** - When you have specific text to show
3. **Choose the right variant**:
   - `fullPage` for critical errors that block the entire app
   - `content` for errors in main content area
   - `inline` for form/dialog errors
   - `compact` for small UI elements
4. **Provide actions when possible** - Help users recover from errors
5. **Use appropriate type** - Match the severity to the type (error, warning, info, success)
6. **Keep messages concise** - Title should be short, message should be actionable

---

## Browser Compatibility

Works with all modern browsers that support:
- ES6+
- React 18+
- Material-UI 5+
