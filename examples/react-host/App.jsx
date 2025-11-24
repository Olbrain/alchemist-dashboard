/**
 * React Host Application Example
 *
 * This example shows how to embed the dashboard in a React application (like Sinch's platform).
 * The dashboard appears within the host app's layout with custom header and sidebar.
 */

import React, { useState } from 'react';
import { DashboardCore, DashboardProvider } from 'project-dashboard-embed';

// Sinch's layout components (example)
const SinchHeader = () => (
  <header style={{ padding: '1rem', backgroundColor: '#1976d2', color: 'white' }}>
    <h1>Sinch Platform</h1>
  </header>
);

const SinchSidebar = () => (
  <aside style={{ width: '200px', padding: '1rem', backgroundColor: '#f5f5f5' }}>
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><a href="#dashboard">Dashboard</a></li>
        <li><a href="#messages">Messages</a></li>
        <li><a href="#agents">AI Agents</a></li>
        <li><a href="#settings">Settings</a></li>
      </ul>
    </nav>
  </aside>
);

function SinchApp() {
  // Sinch's authentication state (example)
  const [sinchUser] = useState({
    uid: 'sinch-user-123',
    email: 'user@sinch.com',
    displayName: 'John Doe',
  });

  const [sinchToken] = useState('sinch-auth-token-xyz-789');

  // Handle navigation events from embedded dashboard
  const handleDashboardNavigate = (location) => {
    console.log('Dashboard navigated to:', location.pathname);
    // Sinch can update their own URL or track analytics here
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Sinch's header */}
      <SinchHeader />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sinch's sidebar */}
        <SinchSidebar />

        {/* Embedded Dashboard */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <DashboardProvider
            user={sinchUser}
            token={sinchToken}
            onAuthError={(error) => console.error('Dashboard auth error:', error)}
          >
            <DashboardCore
              apiUrl="https://api.sinch.io"
              authToken={sinchUser}
              onNavigate={handleDashboardNavigate}
              theme="light"
              config={{
                deploymentType: 'docker',
                firebase: {
                  // Sinch's Firebase config or leave empty if using external auth
                  apiKey: 'your-firebase-api-key',
                  authDomain: 'your-project.firebaseapp.com',
                  projectId: 'your-project-id',
                },
              }}
              initialPath="/"
            />
          </DashboardProvider>
        </main>
      </div>
    </div>
  );
}

export default SinchApp;
