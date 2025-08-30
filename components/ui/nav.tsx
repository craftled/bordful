'use client';

import {
  Briefcase,
  BriefcaseBusiness,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

// Brand icon component that uses the configured icon name or falls back to BriefcaseBusiness
function BrandIcon() {
  // We're intentionally using a simple approach for the brand icon
  // Most users will use a custom logo, so this is just a fallback
  return <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />;
}

// Reusable component interfaces
type NavLinkProps = {
  href: string;
  isActive: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

type SocialLinkProps = {
  href: string;
  label: string;
  children: ReactNode;
};

type SocialIconProps = {
  src: string;
  alt: string;
};

type DropdownItemProps = {
  href: string;
  isActive: boolean;
  onClick?: () => void;
  children: ReactNode;
};

// Reusable navigation link component
function NavLink({
  href,
  isActive,
  onClick,
  children,
  className = '',
}: NavLinkProps) {
  const baseClasses = 'text-sm px-2.5 py-1 rounded-lg transition-colors';
  const activeClasses = 'text-zinc-900 bg-zinc-100';
  const inactiveClasses = 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50';

  const linkClasses = `${baseClasses} ${
    isActive ? activeClasses : inactiveClasses
  } ${className}`;

  return (
    <Link className={linkClasses} href={href} onClick={onClick}>
      {children}
    </Link>
  );
}

// Reusable social icon link component
function SocialLink({ href, label, children }: SocialLinkProps) {
  return (
    <Link
      aria-label={label}
      className="text-zinc-600 transition-colors hover:text-zinc-900"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </Link>
  );
}

// Reusable social icon component with hover effect
function SocialIcon({ src, alt }: SocialIconProps) {
  return (
    <div className="group relative">
      {/* Default state (zinc-600) */}
      <Image
        alt={alt}
        className="transition-opacity group-hover:opacity-0"
        height={16}
        src={src}
        style={{
          width: '16px',
          height: '16px',
          filter:
            'invert(41%) sepia(9%) saturate(380%) hue-rotate(202deg) brightness(94%) contrast(91%)', // zinc-600
        }}
        width={16}
      />

      {/* Hover state (zinc-900) - positioned absolutely on top */}
      <Image
        alt=""
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        height={16}
        src={src}
        style={{
          width: '16px',
          height: '16px',
          filter:
            'invert(14%) sepia(8%) saturate(427%) hue-rotate(202deg) brightness(93%) contrast(90%)', // zinc-900
        }}
        width={16}
      />
    </div>
  );
}

// Dropdown menu item component
function DropdownItem({
  href,
  isActive,
  onClick,
  children,
}: DropdownItemProps) {
  const baseClasses = 'block px-4 py-2 text-sm';
  const activeClasses = 'bg-zinc-100 text-zinc-900';
  const inactiveClasses = 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900';

  const itemClasses = `${baseClasses} ${
    isActive ? activeClasses : inactiveClasses
  }`;

  return (
    <Link className={itemClasses} href={href} onClick={onClick} role="menuitem">
      {children}
    </Link>
  );
}

// Use a consistent type for social platform configuration
type SocialPlatformConfig = {
  id: string;
  configProp: string;
  src: string;
  alt: string;
  labelPrefix: string;
  enabled: (config: typeof import('@/config').default) => boolean;
  getUrl: (config?: typeof import('@/config').default) => string;
};

// Define social platforms with their properties outside of component for reuse
const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'rss',
    configProp: 'rssFeed',
    src: '/assets/social/rss.svg',
    alt: 'RSS Feed',
    labelPrefix: 'Subscribe to',
    enabled: (config) => config.rssFeed?.enabled,
    getUrl: () => '/feed.xml',
  },
  {
    id: 'github',
    configProp: 'github',
    src: '/assets/social/github.svg',
    alt: 'GitHub',
    labelPrefix: 'View on',
    enabled: (config) => config.nav.github?.show,
    getUrl: (config) => config?.nav.github?.url || '',
  },
  {
    id: 'linkedin',
    configProp: 'linkedin',
    src: '/assets/social/linkedin.svg',
    alt: 'LinkedIn',
    labelPrefix: 'Follow us on',
    enabled: (config) => config.nav.linkedin?.show,
    getUrl: (config) => config?.nav.linkedin?.url || '',
  },
  {
    id: 'twitter',
    configProp: 'twitter',
    src: '/assets/social/twitter.svg',
    alt: 'Twitter',
    labelPrefix: 'Follow us on X (',
    enabled: (config) => config.nav.twitter?.show,
    getUrl: (config) => config?.nav.twitter?.url || '',
  },
  {
    id: 'bluesky',
    configProp: 'bluesky',
    src: '/assets/social/bluesky.svg',
    alt: 'Bluesky',
    labelPrefix: 'Follow us on',
    enabled: (config) => config.nav.bluesky?.show,
    getUrl: (config) => config?.nav.bluesky?.url || '',
  },
  {
    id: 'reddit',
    configProp: 'reddit',
    src: '/assets/social/reddit.svg',
    alt: 'Reddit',
    labelPrefix: 'Follow us on',
    enabled: (config) => config.nav.reddit?.show,
    getUrl: (config) => config?.nav.reddit?.url || '',
  },
];

// Custom hook for dropdown management
function useDropdownMenu() {
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {}
  );
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Register dropdown refs for click outside detection
  const registerDropdownRef = useCallback(
    (label: string, ref: HTMLDivElement | null) => {
      dropdownRefs.current[label] = ref;
    },
    []
  );

  // Toggle dropdown open/closed
  const toggleDropdown = useCallback((label: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }, []);

  // Handle mouse enter on dropdown
  const handleDropdownMouseEnter = useCallback((label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }

    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: true,
    }));
  }, []);

  // Handle mouse leave on dropdown
  const handleDropdownMouseLeave = useCallback((label: string) => {
    // Add delay before closing to prevent accidental closures
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdowns((prev) => ({
        ...prev,
        [label]: false,
      }));
    }, 300); // 300ms delay
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      Object.entries(dropdownRefs.current).forEach(([label, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns((prev) => ({
            ...prev,
            [label]: false,
          }));
        }
      });
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clear any pending timeout when unmounting
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  return {
    openDropdowns,
    registerDropdownRef,
    toggleDropdown,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
  };
}

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Use our custom hook for dropdown functionality
  const {
    openDropdowns,
    registerDropdownRef,
    toggleDropdown,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
  } = useDropdownMenu();

  // Use menu items directly from config
  const menuItems = config.nav.menu || [];

  // Check if a path is active (exact match or starts with for /jobs)
  const isActivePath = (path: string): boolean => {
    if (path === '/jobs') {
      return pathname.startsWith(path);
    }
    return pathname === path;
  };

  // Render social media links
  const renderSocialLinks = () => {
    return (
      <div className="flex items-center space-x-3">
        {/* Social Media Links */}
        {SOCIAL_PLATFORMS.map((platform) => {
          // Check if this platform is enabled in the configuration
          if (!platform.enabled(config)) {
            return null;
          }

          const label =
            platform.labelPrefix +
            (platform.id === 'twitter' ? 'Twitter)' : ` ${platform.alt}`);

          return (
            <SocialLink
              href={platform.getUrl(config)}
              key={platform.id}
              label={label}
            >
              <SocialIcon alt={platform.alt} src={platform.src} />
            </SocialLink>
          );
        })}
      </div>
    );
  };

  // Unified function to render navigation items for both mobile and desktop
  const renderNavItems = (isMobile: boolean) => {
    return menuItems.map((item) => {
      // Handle dropdown menu items
      if (item.dropdown && item.items) {
        const isDropdownOpen = openDropdowns[item.label];

        if (isMobile) {
          return (
            <div className="mb-1" key={item.link}>
              <NavLink
                className="mb-1 block"
                href={item.link}
                isActive={pathname === item.link}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
              <div className="mt-1 border-zinc-200 border-l pl-4">
                {item.items.map((subItem) => (
                  <NavLink
                    className="mb-1 block"
                    href={subItem.link}
                    isActive={pathname === subItem.link}
                    key={subItem.link}
                    onClick={() => setIsOpen(false)}
                  >
                    {subItem.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        }

        // Desktop dropdown
        return (
          <div
            className="relative"
            key={item.link}
            onMouseEnter={() => handleDropdownMouseEnter(item.label)}
            onMouseLeave={() => handleDropdownMouseLeave(item.label)}
            ref={(ref) => registerDropdownRef(item.label, ref)}
          >
            <button
              aria-expanded={isDropdownOpen}
              className={`flex items-center rounded-lg px-2.5 py-1 text-sm ${
                pathname.startsWith(item.link)
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              } transition-colors`}
              onClick={() => toggleDropdown(item.label)}
            >
              {item.label}
              <ChevronDown aria-hidden="true" className="ml-1 h-3 w-3" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute left-0 z-50 mt-1 w-40 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                onMouseEnter={() => handleDropdownMouseEnter(item.label)}
                onMouseLeave={() => handleDropdownMouseLeave(item.label)}
              >
                <div aria-orientation="vertical" className="py-1" role="menu">
                  {item.items.map((subItem) => (
                    <DropdownItem
                      href={subItem.link}
                      isActive={pathname === subItem.link}
                      key={subItem.link}
                      onClick={() => toggleDropdown(item.label)}
                    >
                      {subItem.label}
                    </DropdownItem>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Regular menu items
      return (
        <NavLink
          className={isMobile ? 'mb-1' : ''}
          href={item.link}
          isActive={isActivePath(item.link)}
          key={item.link}
          onClick={() => isMobile && setIsOpen(false)}
        >
          {item.label}
        </NavLink>
      );
    });
  };

  // Create specialized renderers for desktop and mobile
  const renderDesktopNavItems = () => renderNavItems(false);
  const renderMobileNavItems = () => renderNavItems(true);

  return (
    <header className="relative z-40 border-zinc-200 border-b bg-white">
      <div className="container mx-auto px-4">
        <nav
          aria-label="Main navigation"
          className="flex h-14 items-center justify-between"
        >
          {/* Brand */}
          <Link
            aria-label="Home"
            className="flex items-center space-x-1.5 text-zinc-900 transition-colors hover:text-zinc-800"
            href="/"
          >
            {config.nav.logo.enabled ? (
              <Image
                alt={config.nav.logo.alt}
                className="object-contain"
                height={config.nav.logo.height}
                priority
                src={config.nav.logo.src}
                style={{
                  width: `${config.nav.logo.width}px`,
                  height: `${config.nav.logo.height}px`,
                }}
                width={config.nav.logo.width}
              />
            ) : (
              <>
                <BrandIcon />
                <span className="font-medium text-sm">{config.nav.title}</span>
              </>
            )}
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2 lg:hidden">
            {/* Mobile Post Job Button - Smaller version */}
            {config.nav.postJob.show && (
              <Button
                asChild
                className="gap-1 px-2 py-1 text-xs"
                size="xs"
                style={
                  config.nav.postJob.variant === 'primary'
                    ? {
                        backgroundColor: resolveColor(config.ui.primaryColor),
                      }
                    : undefined
                }
                variant={config.nav.postJob.variant || 'default'}
              >
                <Link
                  href={config.nav.postJob.link}
                  {...(config.nav.postJob.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {config.nav.postJob.label}
                  <Briefcase aria-hidden="true" className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              aria-expanded={isOpen}
              aria-label="Toggle menu"
              className="p-2 text-zinc-600 transition-colors hover:text-zinc-900"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Menu aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden items-center lg:flex">
            {/* Primary Navigation */}
            <nav
              aria-label="Primary"
              className="mr-4 flex items-center space-x-2 whitespace-nowrap"
            >
              {renderDesktopNavItems()}
            </nav>

            {/* Social links and post job */}
            <div className="flex items-center whitespace-nowrap">
              {renderSocialLinks()}

              {config.nav.postJob.show && (
                <Button
                  asChild
                  className="ml-5 gap-1.5 whitespace-nowrap text-xs"
                  size="xs"
                  style={
                    config.nav.postJob.variant === 'primary'
                      ? {
                          backgroundColor: resolveColor(config.ui.primaryColor),
                        }
                      : undefined
                  }
                  variant={config.nav.postJob.variant || 'default'}
                >
                  <Link
                    href={config.nav.postJob.link}
                    {...(config.nav.postJob.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {config.nav.postJob.label}
                    <Briefcase
                      aria-hidden="true"
                      className="ml-1 h-3.5 w-3.5"
                    />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </nav>

        {isOpen && (
          <div className="border-zinc-200 border-t lg:hidden">
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col px-4 py-4"
            >
              {/* Primary Navigation */}
              {renderMobileNavItems()}

              {/* Social Links */}
              <div className="mt-2 flex items-center space-x-3 border-zinc-200 border-t px-4 py-4">
                {renderSocialLinks()}
              </div>

              {/* Post Job Action */}
              {config.nav.postJob.show && (
                <div className="px-4 pt-2 lg:hidden">
                  <Button
                    asChild
                    className={'w-full gap-1.5 text-xs'}
                    size="xs"
                    style={
                      config.nav.postJob.variant === 'primary'
                        ? {
                            backgroundColor: resolveColor(
                              config.ui.primaryColor
                            ),
                          }
                        : undefined
                    }
                    variant={config.nav.postJob.variant || 'default'}
                  >
                    <Link
                      href={config.nav.postJob.link}
                      {...(config.nav.postJob.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="flex items-center justify-center"
                      onClick={() => setIsOpen(false)}
                    >
                      {config.nav.postJob.label}
                      <Briefcase
                        aria-hidden="true"
                        className="ml-1 h-3.5 w-3.5"
                      />
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
