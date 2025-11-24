/**
 * Webpack Module Federation Host App
 *
 * Lazy loads the dashboard as a remote module
 */

import React, { Suspense, lazy } from 'react';

// Lazy load the remote dashboard module
const DashboardCore = lazy(() => import('projectDashboard/DashboardCore'));
const DashboardProvider = lazy(() => import('projectDashboard/DashboardProvider'));

const Loading = () => <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard...</div>;

function App() {
  const user = {
    uid: 'sinch-user-123',
    email: 'user@sinch.com',
    displayName: 'John Doe',
  };

  const token = 'sinch-auth-token-xyz';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '1rem', backgroundColor: '#1976d2', color: 'white' }}>
        <h1>Sinch Platform (Module Federation)</h1>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: '200px', padding: '1rem', backgroundColor: '#f5f5f5' }}>
          <h3>Navigation</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>Dashboard</li>
            <li>Messages</li>
            <li>AI Agents</li>
          </ul>
        </aside>

        <main style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <Suspense fallback={<Loading />}>
            <DashboardProvider user={user} token={token}>
              <DashboardCore
                apiUrl="https://api.sinch.io"
                authToken={user}
                onNavigate={(loc) => console.log('Navigate:', loc)}
                theme="light"
              />
            </DashboardProvider>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
