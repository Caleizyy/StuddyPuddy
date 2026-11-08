import { createBrowserRouter } from 'react-router';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { TasksPage } from './pages/TasksPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { PlanPage } from './pages/PlanPage';

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
          { path: '/tasks', element: <TasksPage /> },
          { path: '/plan', element: <PlanPage /> },
          { path: '/profile', element: <ComingSoonPage title="Profile" /> },
          { path: '/availability', element: <AvailabilityPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
