import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string };

const loggedOutLinks: NavItem[] = [
  { to: '/login', label: 'Log in' },
  { to: '/register', label: 'Register' },
];

const loggedInLinks: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/plan', label: 'Plan' },
  { to: '/availability', label: 'Availability' },
  { to: '/profile', label: 'Profile' },
];

// NavLink tells us whether its page is the current one, so the current link gets a highlight
function linkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
  );
}

function NavItems({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} onClick={onNavigate} className={linkClass}>
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function Navbar() {
  const { status, logout, retry } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = status === 'authenticated';

  // While the session is still being checked we show only the logo,
  // so the wrong set of links never flashes on screen
  let items: NavItem[] = [];
  if (isLoggedIn) items = loggedInLinks;
  if (status === 'anonymous') items = loggedOutLinks;

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    closeMenu();
    await logout();
    void navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          to={isLoggedIn ? '/dashboard' : '/'}
          onClick={closeMenu}
          className="text-lg font-semibold tracking-tight text-primary"
        >
          StuddyPuddy
        </Link>

        {/* Wide screens: the links sit in the bar */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <NavItems items={items} />
          {isLoggedIn && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => void handleLogout()}
            >
              Log out
            </Button>
          )}
        </nav>

        {/* Phones: one button opens and closes the menu */}
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        )}

        {status === 'unavailable' && (
          <Button variant="outline" size="sm" onClick={retry}>
            <span className="hidden sm:inline">Cannot reach the server.</span>
            Try again
          </Button>
        )}
      </div>

      {menuOpen && items.length > 0 && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden"
        >
          <NavItems items={items} onNavigate={closeMenu} />
          {isLoggedIn && (
            <Button variant="outline" className="mt-2" onClick={() => void handleLogout()}>
              Log out
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
