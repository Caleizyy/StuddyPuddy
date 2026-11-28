import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './index.css';
import { router } from './router';
import { AuthProvider } from './components/AuthProvider';
import { applyPreferences, readStoredPreferences } from './lib/preferences';

// Before the first paint, so a light-theme user does not see a dark flash
applyPreferences(readStoredPreferences());

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  </AuthProvider>,
);
