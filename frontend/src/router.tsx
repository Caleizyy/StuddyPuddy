import { createBrowserRouter } from 'react-router';
import { Layout } from '@/components/layout/Layout';
import { AdminRoute } from '@/components/AdminRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminPage } from '@/pages/AdminPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { TasksPage } from './pages/TasksPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { PlanPage } from './pages/PlanPage';
import { RouteError } from '@/components/RouteError';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
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
          { path: '/profile', element: <ProfilePage /> },
          { path: '/availability', element: <AvailabilityPage /> },
          {
            element: <AdminRoute />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
