import { createBrowserRouter } from 'react-router';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/tasks', element: <ComingSoonPage title="Tasks" /> },
          { path: '/plan', element: <ComingSoonPage title="Plan" /> },
          { path: '/availability', element: <ComingSoonPage title="Availability" /> },
          { path: '/profile', element: <ComingSoonPage title="Profile" /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
