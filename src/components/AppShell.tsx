import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Compass,
  Home,
  Lock,
  MessageCircle,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { CurrencyCode, WorkspaceMode } from '../types/timu';
import { TimuLogo } from './TimuLogo';
import { DualModeSwitcher } from './DualModeSwitcher';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    locale,
    setLocale,
    currency,
    setCurrency,
    theme,
    toggleTheme,
    employerProfile,
    blindTalents,
    isDemoWorkspace,
    demoBannerDismissed,
    dismissDemoBanner,
    switchMode,
  } = useWorkspace();

  const [railCollapsed, setRailCollapsed] = useState(false);
  const isEmployerRoute = pathname.startsWith('/employer');
  const isId = locale === 'id';

  const unlockedEmployerCount = useMemo(
    () => blindTalents.filter((c) => c.isUnlocked).length,
    [blindTalents]
  );

  const handleModeChange = async (nextMode: WorkspaceMode) => {
    await switchMode(nextMode);
    if (nextMode === 'employer') {
      navigate('/employer/discover');
    } else {
      navigate('/talent/dashboard');
    }
  };

  const navItems = isEmployerRoute
    ? [
        {
          to: '/employer/discover',
          label: isId ? 'Cari Talenta' : 'Discover',
          mobileLabel: isId ? 'Beranda' : 'Discover',
          icon: Compass,
          lockedBadge: false,
        },
        {
          to: '/employer/projects',
          label: isId ? 'Proyek Saya' : 'My Projects',
          mobileLabel: isId ? 'Proyek' : 'Projects',
          icon: Briefcase,
          lockedBadge: false,
        },
        {
          to: '/employer/chat',
          label: 'Chat',
          mobileLabel: 'Chat',
          icon: MessageCircle,
          lockedBadge: unlockedEmployerCount === 0,
        },
        {
          to: '/employer/profile',
          label: isId ? 'Profil & Token' : 'Profile',
          mobileLabel: isId ? 'Profil' : 'Profile',
          icon: User,
          lockedBadge: false,
        },
      ]
    : [
        {
          to: '/talent/dashboard',
          label: isId ? 'Beranda' : 'Dashboard',
          mobileLabel: isId ? 'Beranda' : 'Home',
          icon: Home,
          lockedBadge: false,
        },
        {
          to: '/talent/projects',
          label: isId ? 'Cari Proyek' : 'Find Projects',
          mobileLabel: isId ? 'Proyek' : 'Projects',
          icon: Search,
          lockedBadge: false,
        },
        {
          to: '/talent/chat',
          label: 'Chat',
          mobileLabel: 'Chat',
          icon: MessageCircle,
          lockedBadge: false,
        },
        {
          to: '/talent/profile',
          label: isId ? 'Profil' : 'Profile',
          mobileLabel: isId ? 'Profil' : 'Profile',
          icon: User,
          lockedBadge: false,
        },
      ];

  const isNavActive = (to: string) => {
    if (pathname === to) return true;
    if (to === '/talent/projects' && pathname === '/talent/opportunities') return true;
    if (to === '/employer/profile' && pathname === '/employer/billing') return true;
    return false;
  };

  const currentSectionTitle = useMemo(() => {
    if (pathname === '/talent/first-quest') return 'First Quest';
    const match = navItems.find((n) => isNavActive(n.to));
    return match?.label || 'TIMU';
  }, [pathname, navItems]);

  return (
    <div className="min-h-screen w-full bg-canvas text-ink flex">
      {/* Desktop Collapsible Left Navigation Rail (>= 1024px) */}
      <aside
        aria-label={isId ? 'Navigasi Utama' : 'Primary Navigation'}
        className={`hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen shrink-0 border-r border-line bg-surface transition-[width] duration-200 ${
          railCollapsed ? 'w-[80px]' : 'w-[264px]'
        }`}
      >
        {/* Rail Header */}
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Link
            to="/"
            aria-label="TIMU Titik Temu"
            className="flex items-center overflow-hidden focus-visible:rounded-lg"
          >
            {railCollapsed ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display text-base font-extrabold text-brand-fg">
                T
              </span>
            ) : (
              <TimuLogo size="sm" showTagline />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setRailCollapsed((v) => !v)}
            aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink transition-colors"
          >
            {railCollapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Dual-Mode Switcher */}
        {!railCollapsed && (
          <div className="px-4 pt-4">
            <DualModeSwitcher
              mode={isEmployerRoute ? 'employer' : 'talent'}
              onChange={handleModeChange}
              compact
            />
          </div>
        )}

        {/* Primary Links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = isNavActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                title={railCollapsed ? item.label : undefined}
                className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-gold-soft text-gold-soft-fg font-bold'
                    : 'text-muted hover:bg-subtle hover:text-ink'
                } ${railCollapsed ? 'justify-center px-0' : ''}`}
              >
                <span className="relative flex items-center justify-center shrink-0">
                  <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.1 : 1.75} aria-hidden="true" />
                  {item.lockedBadge && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-surface"
                    >
                      <Lock className="h-2 w-2" strokeWidth={2.5} />
                    </span>
                  )}
                </span>
                {!railCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {!isEmployerRoute && !railCollapsed && (
            <Link
              to="/talent/first-quest"
              aria-current={pathname === '/talent/first-quest' ? 'page' : undefined}
              className={`mt-2 flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                pathname === '/talent/first-quest'
                  ? 'bg-gold-soft text-gold-soft-fg font-bold'
                  : 'text-muted hover:bg-subtle hover:text-ink'
              }`}
            >
              <Sparkles className="h-[19px] w-[19px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate">First Quest</span>
            </Link>
          )}
        </nav>

        {/* Bottom Token Summary (Employer) or Quick Theme/Locale Footer */}
        <div className="border-t border-line p-3 space-y-2.5">
          {isEmployerRoute && !railCollapsed && (
            <Link
              to="/employer/profile"
              className="flex items-center justify-between rounded-xl border border-line bg-gold-soft px-3.5 py-2.5 text-xs font-bold text-gold-soft-fg transition-colors hover:opacity-90"
            >
              <span className="inline-flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[11px] font-extrabold text-gold-fg">
                  T
                </span>
                <span>{isId ? 'Saldo Token' : 'Token Balance'}</span>
              </span>
              <span className="text-sm font-extrabold tabular-nums">
                {employerProfile?.tokenBalance ?? 0}
              </span>
            </Link>
          )}

          {!railCollapsed && (
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted">
              <button
                type="button"
                onClick={() => setLocale(isId ? 'en' : 'id')}
                aria-label={isId ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
                className="min-h-[36px] rounded-lg border border-line bg-canvas px-2.5 font-semibold text-ink hover:bg-subtle"
              >
                {isId ? 'ID' : 'EN'}
              </button>
              <select
                aria-label={isId ? 'Mata uang' : 'Currency'}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="min-h-[36px] rounded-lg border border-line bg-canvas px-2 font-semibold text-ink"
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-ink hover:bg-subtle"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Right Main Column (Full-width responsive canvas) */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top Utility Header: Mobile/Tablet Compact Bar + Desktop Contextual Strip */}
        <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          {/* Left: Brand on Mobile/Tablet, Section Title on Desktop */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" aria-label="TIMU Home" className="lg:hidden shrink-0">
              <TimuLogo size="sm" showTagline={false} />
            </Link>
            <span className="hidden lg:inline-block truncate font-display text-base font-bold text-ink">
              {currentSectionTitle}
            </span>
            {isDemoWorkspace && !demoBannerDismissed && (
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted">
                <span>Demo Workspace</span>
                <button
                  type="button"
                  onClick={dismissDemoBanner}
                  aria-label="Dismiss demo workspace notice"
                  className="rounded-full p-0.5 hover:bg-line text-muted hover:text-ink"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Center Tablet Nav Links (640px - 1023px only) */}
          <nav
            aria-label={isId ? 'Navigasi Tablet' : 'Tablet Navigation'}
            className="hidden sm:flex lg:hidden items-center gap-1"
          >
            {navItems.map((item) => {
              const active = isNavActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    active ? 'bg-gold-soft text-gold-soft-fg font-bold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Employer Token Chip + Quick Utility Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {isEmployerRoute && (
              <Link
                to="/employer/profile"
                className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-gold-soft-fg transition-opacity hover:opacity-90 whitespace-nowrap"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-extrabold text-gold-fg">
                  T
                </span>
                <span className="tabular-nums">
                  {employerProfile?.tokenBalance ?? 0} {isId ? 'Token' : 'Tokens'}
                </span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setLocale(isId ? 'en' : 'id')}
              aria-label={isId ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
              className="lg:hidden min-h-[38px] min-w-[38px] rounded-xl border border-line bg-canvas px-2.5 text-xs font-bold text-ink hover:bg-subtle"
            >
              {isId ? 'ID' : 'EN'}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-line bg-canvas text-ink hover:bg-subtle transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Main Scrollable Content Area */}
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-5 pb-24 sm:px-6 sm:pb-10 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 640px / PWA only, clean 64px height) */}
      <nav
        aria-label={isId ? 'Navigasi Mobile' : 'Mobile Navigation'}
        className="sm:hidden fixed right-0 bottom-0 left-0 z-40 border-t border-line bg-surface/95 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md shadow-nav"
      >
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const active = isNavActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl focus-visible:rounded-xl"
              >
                <span
                  className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                    active ? 'bg-gold-soft text-gold-soft-fg' : 'text-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.15 : 1.75} aria-hidden="true" />
                  {item.lockedBadge && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-surface"
                    >
                      <Lock className="h-2 w-2" strokeWidth={2.5} />
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] leading-tight whitespace-nowrap ${
                    active ? 'font-bold text-ink' : 'font-medium text-muted'
                  }`}
                >
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
