'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

interface SubItem {
  label: string;
  link: string;
}

interface MenuItem {
  label: string;
  link: string;
  submenu: SubItem[];
}

interface HeaderData {
  topBar: {
    enabled: boolean;
    bgColor: string;
    textColor: string;
    autoSlide: boolean;
    intervalSeconds: number;
    messages: { text: string; link: string }[];
  };
  logo: { url: string; alt: string; height: number };
  menuItems: MenuItem[];
  contact: { enabled: boolean; label: string; phone: string; link: string };
  search: { enabled: boolean };
  showCart: boolean;
  button: { enabled: boolean; label: string; link: string; bgColor: string; textColor: string };
  accentColor: string;
  spaceBelow: number;
}

interface SearchResult {
  _id: string;
  slug?: string;
  title: string;
  image?: string;
  location?: string;
  price?: number;
}

// Shown for a moment while the real settings load, or if they cannot be loaded.
const FALLBACK: HeaderData = {
  topBar: {
    enabled: false,
    bgColor: '#3B82F6',
    textColor: '#FFFFFF',
    autoSlide: true,
    intervalSeconds: 5,
    messages: [],
  },
  logo: { url: '/images/logo.webp', alt: 'Logo', height: 48 },
  menuItems: [
    { label: 'Home', link: '/', submenu: [] },
    { label: 'About', link: '/about', submenu: [] },
    { label: 'Corporate Inquiries', link: '/b2b-corporate', submenu: [] },
  ],
  contact: { enabled: false, label: 'Need Help?', phone: '', link: '' },
  search: { enabled: false },
  showCart: true,
  button: { enabled: false, label: 'Login', link: '/login', bgColor: '#111111', textColor: '#FFFFFF' },
  accentColor: '#DF6951',
  spaceBelow: 40,
};

const isExternal = (href: string) => /^(https?:|mailto:|tel:|\/\/)/i.test(href);

// Package pictures stored under /api/ are loaded from the main site, exactly like the homepage search box does.
const IMAGE_HOST = 'https://vantratours-swart.vercel.app';
const imageSrc = (img?: string) => (img && img.startsWith('/api/') ? `${IMAGE_HOST}${img}` : img || '');

function SmartLink({
  href,
  className,
  style,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }
  if (isExternal(href)) {
    const newTab = /^https?:/i.test(href);
    return (
      <a
        href={href}
        className={className}
        style={style}
        onClick={onClick}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}

const Chevron = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const Header: React.FC<{ color?: string }> = () => {
  const router = useRouter();
  const { items } = useCart();
  const [data, setData] = useState<HeaderData>(FALLBACK);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSub, setMobileSub] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/header-config', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setData({ ...FALLBACK, ...json.data });
        }
      } catch (error) {
        console.error('Failed to load header settings', error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const messages = data.topBar.messages || [];
  const messageCount = messages.length;

  // Auto-slide the top bar messages
  useEffect(() => {
    if (!data.topBar.enabled || !data.topBar.autoSlide || messageCount < 2) return;
    const seconds = data.topBar.intervalSeconds > 0 ? data.topBar.intervalSeconds : 5;
    const timer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messageCount);
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [data.topBar.enabled, data.topBar.autoSlide, data.topBar.intervalSeconds, messageCount]);

  useEffect(() => {
    if (msgIndex >= messageCount) setMsgIndex(0);
  }, [messageCount, msgIndex]);

  const prevMessage = () => setMsgIndex((i) => (i - 1 + messageCount) % messageCount);
  const nextMessage = () => setMsgIndex((i) => (i + 1) % messageCount);

  // Live package search: same behaviour as the search box in the homepage banner
  useEffect(() => {
    if (!searchOpen) return;
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    setShowResults(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/packages?search=${encodeURIComponent(term)}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setResults((json.data || []).slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchOpen]);

  const goToPackage = (pkg: SearchResult) => {
    if (!pkg.slug) return;
    setShowResults(false);
    setSearchOpen(false);
    setMobileOpen(false);
    setQuery('');
    router.push(`/tour-details/${pkg.slug}`);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) goToPackage(results[0]);
  };

  const phoneDigits = (data.contact.phone || '').replace(/[^+\d]/g, '');
  const contactHref = data.contact.link || (phoneDigits ? `tel:${phoneDigits}` : '');
  const showTopBar = data.topBar.enabled && messageCount > 0;
  const currentMessage = messages[msgIndex] || messages[0];
  const accentStyle = { ['--accent' as string]: data.accentColor } as React.CSSProperties;

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileSub(null);
  };

  return (
    <>
    <header className="absolute top-0 left-0 right-0 z-50" style={accentStyle}>
      {/* Top bar */}
      {showTopBar && currentMessage && (
        <div
          className="w-full text-xs sm:text-sm font-medium"
          style={{ backgroundColor: data.topBar.bgColor, color: data.topBar.textColor }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-2 flex items-center justify-center gap-3">
            {messageCount > 1 && (
              <button
                type="button"
                onClick={prevMessage}
                aria-label="Previous message"
                className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 hover:opacity-70 transition"
                style={{ borderColor: data.topBar.textColor }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <SmartLink
              href={currentMessage.link}
              className={`text-center ${currentMessage.link ? 'hover:underline' : ''}`}
            >
              {currentMessage.text}
            </SmartLink>
            {messageCount > 1 && (
              <button
                type="button"
                onClick={nextMessage}
                aria-label="Next message"
                className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 hover:opacity-70 transition"
                style={{ borderColor: data.topBar.textColor }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <nav className="flex items-center justify-between gap-4 py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logo.url}
                alt={data.logo.alt}
                style={{ height: data.logo.height, width: 'auto' }}
              />
            </Link>

            {/* Desktop menu */}
            <ul className="hidden md:flex items-center gap-7">
              {data.menuItems.map((item, index) => {
                const hasSub = item.submenu && item.submenu.length > 0;
                return (
                  <li key={`${item.label}-${index}`} className="relative group">
                    <SmartLink
                      href={item.link}
                      className="flex items-center gap-1 py-4 text-sm font-semibold text-gray-900 hover:text-[var(--accent)] transition-colors"
                    >
                      {item.label}
                      {hasSub && <Chevron />}
                    </SmartLink>
                    {hasSub && (
                      <div className="absolute left-0 top-full pt-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 z-50">
                        <div className="min-w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                          {item.submenu.map((sub, subIndex) => (
                            <SmartLink
                              key={`${sub.label}-${subIndex}`}
                              href={sub.link}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--accent)] transition-colors"
                            >
                              {sub.label}
                            </SmartLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Right side */}
            <div className="flex items-center gap-3 sm:gap-4">
              {data.contact.enabled && data.contact.phone && (
                <SmartLink href={contactHref} className="hidden lg:flex items-center gap-2 text-gray-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="leading-tight">
                    {data.contact.label && <span className="block text-[10px] text-gray-500">{data.contact.label}</span>}
                    <span className="block text-sm font-bold">{data.contact.phone}</span>
                  </span>
                </SmartLink>
              )}

              {data.search.enabled && (
                <button
                  type="button"
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Search"
                  className="p-2 text-gray-900 hover:text-[var(--accent)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                </button>
              )}

              {data.showCart && (
                <Link href="/cart" aria-label="Cart" className="relative p-2 text-gray-900 hover:text-[var(--accent)] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {items.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </Link>
              )}

              {data.button.enabled && data.button.label && (
                <SmartLink
                  href={data.button.link}
                  className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                  style={{ backgroundColor: data.button.bgColor, color: data.button.textColor }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
                  </svg>
                  {data.button.label}
                </SmartLink>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 text-gray-900"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </nav>

          {/* Search box */}
          {data.search.enabled && searchOpen && (
            <form onSubmit={submitSearch} className="pb-3 relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (query.trim().length >= 2) setShowResults(true);
                  }}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowResults(false);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search for cities and activities"
                  className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none focus:border-gray-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--accent)] hover:opacity-90 transition"
                >
                  Search
                </button>
              </div>

              {showResults && (
                <div className="absolute left-0 right-0 top-full -mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                  ) : results.length > 0 ? (
                    results.map((pkg) => (
                      <div
                        key={pkg._id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          goToPackage(pkg);
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          {pkg.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageSrc(pkg.image)} alt={pkg.title} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{pkg.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {pkg.location && <span>📍 {pkg.location}</span>}
                            {pkg.price ? (
                              <span className="text-[var(--accent)] font-semibold">• {pkg.price} AED</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-400">No results found</div>
                  )}
                </div>
              )}
            </form>
          )}

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100">
              <ul className="pt-2">
                {data.menuItems.map((item, index) => {
                  const hasSub = item.submenu && item.submenu.length > 0;
                  return (
                    <li key={`${item.label}-${index}`}>
                      {hasSub ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setMobileSub(mobileSub === index ? null : index)}
                            className="flex items-center justify-between w-full px-2 py-3 text-sm font-semibold text-gray-900"
                          >
                            {item.label}
                            <Chevron className={`w-4 h-4 transition-transform ${mobileSub === index ? 'rotate-180' : ''}`} />
                          </button>
                          {mobileSub === index && (
                            <div className="pl-4 pb-2">
                              {item.submenu.map((sub, subIndex) => (
                                <SmartLink
                                  key={`${sub.label}-${subIndex}`}
                                  href={sub.link}
                                  onClick={closeMobile}
                                  className="block px-2 py-2 text-sm text-gray-600 hover:text-[var(--accent)]"
                                >
                                  {sub.label}
                                </SmartLink>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <SmartLink
                          href={item.link}
                          onClick={closeMobile}
                          className="block px-2 py-3 text-sm font-semibold text-gray-900 hover:text-[var(--accent)]"
                        >
                          {item.label}
                        </SmartLink>
                      )}
                    </li>
                  );
                })}
              </ul>

              {data.contact.enabled && data.contact.phone && (
                <SmartLink href={contactHref} className="block px-2 py-3 text-sm font-bold text-gray-900">
                  {data.contact.label ? `${data.contact.label} ` : ''}
                  {data.contact.phone}
                </SmartLink>
              )}

              {data.button.enabled && data.button.label && (
                <SmartLink
                  href={data.button.link}
                  onClick={closeMobile}
                  className="mt-2 flex items-center justify-center w-full px-5 py-3 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: data.button.bgColor, color: data.button.textColor }}
                >
                  {data.button.label}
                </SmartLink>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
    {/* Pushes the page content down so the banner is not hidden behind the header */}
    <div aria-hidden="true" style={{ height: data.spaceBelow }} />
    </>
  );
};

export default Header;
