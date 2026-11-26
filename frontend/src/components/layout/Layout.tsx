import { Outlet } from 'react-router';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Extra room at the bottom on phones so the tab bar never covers the end of a page */}
      <div className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
