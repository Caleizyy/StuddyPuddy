import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import {
  CalendarDays,
  Clock,
  Home,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Avatar } from '@/components/profile/Avatar';
import { buttonVariants, Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: LucideIcon };

// The four places you use every day. Profile and settings sit one step away.
const mainLinks: NavItem[] = [
  { to: '/dashboard', label: 'Today', icon: Home },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/availability', label: 'Study hours', icon: Clock },
];

const moreLinks: NavItem[] = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const adminLink: NavItem = { to: '/admin', label: 'Usage', icon: ShieldCheck };

function topLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2 rounded-lg px-3 min-h-11 text-sm font-medium transition-colors',
    isActive
      ? 'bg-secondary text-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );
}

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex flex-1 flex-col items-center gap-0.5 min-h-12 justify-center text-[0.7rem] font-medium transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground',
  );
}

export function Navbar() {
  const { user, status, logout, retry } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const isLoggedIn = status === 'authenticated';
  const isAdmin = user?.role === 'admin';
  const extra = isAdmin ? [...moreLinks, adminLink] : moreLinks;

  async function handleLogout() {
    setMoreOpen(false);
    await logout();
    void navigate('/login', { replace: true });
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={isLoggedIn ? '/dashboard' : '/'} aria-label="StuddyPuddy home">
            <Logo />
          </Link>

          {isLoggedIn && (
            <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
              {mainLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={topLinkClass}>
                  <Icon className="size-4" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-1.5">
            {isLoggedIn && user && (
              <>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground md:block"
                  >
                    Usage
                  </NavLink>
                )}
                <Link
                  to="/settings"
                  aria-label="Settings"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'hidden md:flex',
                  )}
                >
                  <Settings />
                </Link>
                <Link to="/profile" aria-label="Your profile">
                  <Avatar name={user.name} src={user.avatar} />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex"
                  onClick={() => void handleLogout()}
                >
                  Log out
                </Button>
              </>
            )}
            {status === 'anonymous' && (
              <>
                <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Log in
                </Link>
                <Link to="/register" className={buttonVariants({ size: 'sm' })}>
                  Get started
                </Link>
              </>
            )}
            {status === 'unavailable' && (
              <Button variant="outline" size="sm" onClick={retry}>
                <span className="hidden sm:inline">Cannot reach the server.</span>
                Try again
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Phones: the four main places are a tab bar at the thumb. The rest is under "More". */}
      {isLoggedIn && (
        <>
          {moreOpen && (
            <div
              id="more-menu"
              className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-border bg-popover p-2 shadow-xl md:hidden"
            >
              {extra.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-muted"
                >
                  <Icon className="size-5 text-primary" aria-hidden />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold hover:bg-muted"
              >
                <LogOut className="size-5 text-primary" aria-hidden />
                Log out
              </button>
            </div>
          )}
          <nav
            aria-label="Mobile"
            className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-border bg-background/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
          >
            {mainLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={tabClass} onClick={() => setMoreOpen(false)}>
                <Icon className="size-5" aria-hidden />
                {label === 'Study hours' ? 'Hours' : label}
              </NavLink>
            ))}
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                'flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium',
                moreOpen ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
          </nav>
        </>
      )}
    </>
  );
}
