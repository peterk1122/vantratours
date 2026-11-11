
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Kaushan_Script } from 'next/font/google';
import Header from '@/components/layout/Header';

const script = Kaushan_Script({ subsets: ['latin'], weight: '400' });

type SortOption = 'date' | 'price-low' | 'price-high' | 'name';

interface CategoryPageClientProps {
  slug: string;
  initialCategory: any;
}

const PAGE_SIZE = 12;
const GOLD = '#B8952F';
const NAVY = '#1b2a52';
const CHIP_BG = '#eef1f5';
const CARD_BORDER = '#b9bec7';
const HIGHLIGHT_BG = '#dfebfb';
const PANEL_BLUE = '#80bbff';
const FOOTER_BLUE = '#9bbde3';
const LINE_BLUE = '#dbe7f5';
const PRICE_RED = '#d92d20';
const CURRENCY = 'AED';

const NEWSLETTER_IMAGE = '/images/newsletter-banner.jpg';
const LOGO = '/images/Desert_2-removebg-preview1.png';

const imageSrc = (img?: string | null) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return img.startsWith('/') ? img : `/${img}`;
};

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const SORT_LABELS: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'name', label: 'Name (A–Z)' },
];

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/dsmarttourism?igsh=MXZ5bWFqdHhhdHhreQ==',
    d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1HV6qNpStS',
    d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@desertsmarttourismllc?si=2vCq5MaRtXnVGi90',
    d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@desertsmarttourism?_r=1&_t=ZS-93Kt1kKUTcT',
    d: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z',
  },
];

function useOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  const handler = useRef(onOutside);
  handler.current = onOutside;

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler.current();
    };

    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref]);
}

const Chevron = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
  </svg>
);

interface MenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

function NavDropdown({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  if (!items.length) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[13px] text-gray-800 hover:text-black"
      >
        {label}
        <Chevron />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-3 z-40 min-w-[210px] max-h-72 overflow-auto bg-white rounded-xl shadow-xl border border-gray-100 py-2">
          {items.map((it) =>
            it.href ? (
              <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className="block px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                {it.label}
              </Link>
            ) : (
              <button
                key={it.label}
                type="button"
                onClick={() => {
                  it.onClick?.();
                  setOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function TourCard({
  pkg,
  highlighted,
  liked,
  onToggleLike,
  dateQuery,
}: {
  pkg: any;
  highlighted: boolean;
  liked: boolean;
  onToggleLike: (id: string) => void;
  dateQuery: string;
}) {
  const rating = Number(pkg.rating || 0);
  const reviews = Number(pkg.reviews || 0);
  const price = Number(pkg.price || 0);
  const oldPrice = Number(pkg.oldPrice || 0);
  const hasDiscount = oldPrice > price && price > 0;
  const href = pkg.slug ? `/tour-details/${pkg.slug}${dateQuery}` : '#';
  const badge = highlighted ? 'Top pick' : rating >= 4.7 ? 'Top rated' : !rating && !reviews ? 'New activity' : '';

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
      style={{ backgroundColor: highlighted ? HIGHLIGHT_BG : '#fff', borderColor: CARD_BORDER }}
    >
      <div className="relative aspect-[3/2] bg-gray-200 overflow-hidden">
        {pkg.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc(pkg.image)}
            alt={pkg.imageAlt || pkg.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {badge && (
          <span className="absolute top-3 left-3 text-white text-[11px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: NAVY }}>
            {badge}
          </span>
        )}

        <button
          type="button"
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleLike(pkg.id);
          }}
          className="absolute top-3 right-3 w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={liked ? '#e11d48' : 'none'} stroke={liked ? '#e11d48' : NAVY} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.3 6.3a5 5 0 017.1 0L12 7l.6-.7a5 5 0 117.1 7.1L12 21l-7.7-7.6a5 5 0 010-7.1z" />
          </svg>
        </button>
      </div>

      <div className="px-3.5 pt-3.5 pb-3.5 flex flex-col flex-1">
        <h3 className="text-[16px] font-bold leading-snug line-clamp-3" style={{ color: NAVY }}>
          {pkg.title}
        </h3>

        {pkg.date && <p className="mt-1.5 text-[12.5px] text-gray-700 leading-snug line-clamp-2">{pkg.date}</p>}

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <p className="text-[12px] text-gray-700 flex items-center gap-1 pb-0.5">
            {rating > 0 && (
              <>
                <b className="text-[13px] text-gray-900">{rating}</b>
                <span className="text-gray-900 text-[11px]">★</span>
                {reviews > 0 && <span className="text-gray-500">({reviews})</span>}
              </>
            )}
          </p>

          <div className="flex flex-col items-end gap-1.5">
            <span className="px-4 py-1.5 rounded-full text-white text-[13px] font-bold leading-none" style={{ backgroundColor: GOLD }}>
              Book Now
            </span>

            {price > 0 && (
              <p className="text-[12px] text-gray-600 whitespace-nowrap flex items-baseline gap-1">
                From
                {hasDiscount && <span className="line-through text-gray-500">{oldPrice}</span>}
                <b className="text-[17px] leading-none" style={{ color: hasDiscount ? PRICE_RED : '#111827' }}>
                  {CURRENCY} {price}
                </b>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const SkeletonCard = () => (
  <div className="rounded-lg border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-[3/2] bg-gray-200" />
    <div className="p-3.5 space-y-2.5">
      <div className="h-4 w-full bg-gray-200 rounded" />
      <div className="h-4 w-5/6 bg-gray-200 rounded" />
      <div className="h-3 w-1/2 bg-gray-200 rounded" />
    </div>
  </div>
);

export default function CategoryPageClient({ slug, initialCategory }: CategoryPageClientProps) {
  const [packages, setPackages] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [tripDate, setTripDate] = useState('');
  const [activeSub, setActiveSub] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const [headerTitle, setHeaderTitle] = useState(initialCategory?.name || 'Explore Tours');
  const [headerImage, setHeaderImage] = useState(initialCategory?.image || '/images/travel-with-us.svg');

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const filtersRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);

  useOutside(filtersRef, () => setFiltersOpen(false));
  useOutside(datesRef, () => setDatesOpen(false));

  // Keep header in sync with the server-provided category.
  useEffect(() => {
    setHeaderTitle(initialCategory?.name || 'Explore Tours');
    setHeaderImage(initialCategory?.image || '/images/travel-with-us.svg');
  }, [initialCategory]);

  // Load packages for this category.
  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      setLoading(true);
      setPackages([]);
      setVisibleCount(PAGE_SIZE);

      try {
        if (!slug) return;

        let categoryId = initialCategory?._id;

        if (!categoryId) {
          const categoryResponse = await fetch(
            `/api/categories?slug=${encodeURIComponent(slug)}`,
            { cache: 'no-store' }
          );

          if (!categoryResponse.ok) {
            throw new Error(`Category API returned ${categoryResponse.status}`);
          }

          const categoryJson = await categoryResponse.json();

          if (categoryJson?.success && categoryJson?.data) {
            categoryId = categoryJson.data._id;

            if (!cancelled) {
              setHeaderTitle(categoryJson.data.name || 'Explore Tours');
              setHeaderImage(categoryJson.data.image || '/images/travel-with-us.svg');
            }
          }
        }

        if (!categoryId) {
          console.error('Category ID missing for slug:', slug);
          return;
        }

        const response = await fetch(
          `/api/packages?category=${encodeURIComponent(String(categoryId))}`,
          { cache: 'no-store' }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || `Packages API returned ${response.status}`);
        }

        if (!json?.success || !Array.isArray(json.data)) {
          console.error('Unexpected packages API response:', json);
          return;
        }

        const formatted = json.data.map((pkg: any) => ({
          id: String(pkg._id),
          image: pkg.image || '',
          imageAlt: pkg.imageAlt || pkg.title || 'Tour image',
          date: pkg.duration || '',
          reviews: pkg.peopleGoing || 0,
          city: pkg.title || '',
          description: pkg.description || '',
          price: Number(pkg.price || 0),
          oldPrice: Number(pkg.oldPrice || 0),
          rating: Number(pkg.rating || 0),
          slug: pkg.slug || '',
          title: pkg.title || 'Untitled tour',
          categorySlug: slug,
          subcategorySlug: pkg.subcategory?.slug || '',
        }));

        if (!cancelled) {
          setPackages(formatted);
        }

        console.log(`Loaded ${formatted.length} packages for category:`, slug);
      } catch (error) {
        console.error('Failed to load category packages:', error);
        if (!cancelled) setPackages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, [slug, initialCategory]);

  // Load subcategories independently.
  useEffect(() => {
    let cancelled = false;

    async function loadSubcategories() {
      try {
        if (!slug) return;

        const response = await fetch(
          `/api/subcategories?category=${encodeURIComponent(slug)}&parent=null`,
          { cache: 'no-store' }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || `Subcategories API returned ${response.status}`);
        }

        if (!cancelled) {
          setSubcategories(json?.success && Array.isArray(json.data) ? json.data : []);
        }
      } catch (error) {
        console.error('Failed to load subcategories:', error);
        if (!cancelled) setSubcategories([]);
      }
    }

    loadSubcategories();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Load categories for navigation dropdown.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch('/api/categories', { cache: 'no-store' });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || `Categories API returned ${response.status}`);
        }

        if (!cancelled) {
          setCategories(json?.success && Array.isArray(json.data) ? json.data : []);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        if (!cancelled) setCategories([]);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortOption, activeSub, topRatedOnly]);

  const list = useMemo(() => {
    let filtered = packages;

    if (activeSub) {
      filtered = filtered.filter((p) => p.subcategorySlug === activeSub);
    }

    if (topRatedOnly) {
      filtered = filtered.filter((p) => Number(p.rating || 0) >= 4.5);
    }

    return [...filtered].sort((a, b) => {
      if (sortOption === 'price-low') return a.price - b.price;
      if (sortOption === 'price-high') return b.price - a.price;
      if (sortOption === 'name') return String(a.city).localeCompare(String(b.city));
      return 0;
    });
  }, [packages, sortOption, activeSub, topRatedOnly]);

  const shown = list.slice(0, visibleCount);
  const hasMore = list.length > visibleCount;
  const filtersActive = sortOption !== 'date' || topRatedOnly;
  const dateQuery = tripDate ? `?date=${tripDate}` : '';

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] transition-colors ${
      active ? 'text-white' : 'text-gray-800 hover:bg-gray-200'
    }`;

  const todayISO = toISO(new Date());

  const placesMenu: MenuItem[] = categories
    .filter((c) => c.slug && c.slug !== slug)
    .map((c) => ({ label: c.name, href: `/${c.slug}` }));

  const thingsMenu: MenuItem[] = subcategories.map((s) => ({
    label: s.name,
    onClick: () => setActiveSub(s.slug),
  }));

  const inspirationMenu: MenuItem[] = [
    { label: 'Blog', href: '/blog' },
    { label: 'About Us', href: '/about' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <div className="h-[60px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <section
          className="relative w-full min-h-[190px] aspect-[2/1] sm:aspect-[3/1] md:aspect-[18/5] bg-cover bg-center overflow-hidden flex items-end justify-center md:pl-[14%] pb-6 md:pb-[6%]"
          style={{ backgroundImage: `url('${imageSrc(headerImage)}')` }}
        >
          <h1 className={`${script.className} relative z-10 text-white text-center leading-none drop-shadow-md px-4 text-6xl sm:text-7xl md:text-8xl lg:text-[104px]`}>
            {headerTitle}
          </h1>
        </section>

        <div className="mt-10 border-b border-gray-200">
          <div className="max-w-[1010px] mx-auto pb-3.5 flex items-center gap-x-4 gap-y-2 flex-wrap">
            <span className="text-[13px] text-gray-500">Explore {headerTitle}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden="true" />
            <NavDropdown label="Places to see" items={placesMenu} />
            <NavDropdown label="Things to do" items={thingsMenu} />
            <NavDropdown label="Trip inspiration" items={inspirationMenu} />
          </div>
        </div>

        <div className="border-b border-gray-100 shadow-[0_8px_8px_-8px_rgba(0,0,0,0.2)]">
          <div className="max-w-[1010px] mx-auto py-4 flex flex-wrap gap-2.5 items-center">
            <div ref={filtersRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen((v) => !v);
                  setDatesOpen(false);
                }}
                aria-expanded={filtersOpen}
                className={chip(false)}
                style={{ backgroundColor: CHIP_BG }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M4 7h16M7 12h10M10 17h4" />
                </svg>
                Filters
                {filtersActive && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />}
              </button>

              {filtersOpen && (
                <div className="absolute z-40 left-0 top-full mt-2 w-[270px] bg-white rounded-xl shadow-xl border border-gray-100 p-4">
                  <p className="text-xs font-bold mb-2" style={{ color: NAVY }}>Sort by</p>
                  <div className="space-y-1.5">
                    {SORT_LABELS.map((o) => (
                      <label key={o.value} className="flex items-center gap-2 text-[13px] cursor-pointer">
                        <input type="radio" name="sort" checked={sortOption === o.value} onChange={() => setSortOption(o.value)} style={{ accentColor: GOLD }} />
                        {o.label}
                      </label>
                    ))}
                  </div>

                  <label className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[13px] cursor-pointer">
                    <input type="checkbox" checked={topRatedOnly} onChange={(e) => setTopRatedOnly(e.target.checked)} style={{ accentColor: GOLD }} />
                    Rated 4.5 ★ and above
                  </label>

                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => { setSortOption('date'); setTopRatedOnly(false); }} className="flex-1 py-2 rounded-full border border-gray-300 text-xs font-semibold">
                      Reset
                    </button>
                    <button type="button" onClick={() => setFiltersOpen(false)} className="flex-1 py-2 rounded-full text-white text-xs font-bold" style={{ backgroundColor: GOLD }}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div ref={datesRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setDatesOpen((v) => !v);
                  setFiltersOpen(false);
                }}
                aria-expanded={datesOpen}
                className={chip(!!tripDate)}
                style={{ backgroundColor: tripDate ? NAVY : CHIP_BG }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
                {tripDate ? new Date(tripDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Dates'}
              </button>

              {datesOpen && (
                <div className="absolute z-40 left-0 top-full mt-2 w-[260px] bg-white rounded-xl shadow-xl border border-gray-100 p-4">
                  <p className="text-xs font-bold mb-2" style={{ color: NAVY }}>When are you travelling?</p>
                  <input type="date" min={todayISO} value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-500" />
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setTripDate('')} className="flex-1 py-2 rounded-full border border-gray-300 text-xs font-semibold">Clear</button>
                    <button type="button" onClick={() => setDatesOpen(false)} className="flex-1 py-2 rounded-full text-white text-xs font-bold" style={{ backgroundColor: GOLD }}>Done</button>
                  </div>
                </div>
              )}
            </div>

            {subcategories.map((s) => {
              const active = activeSub === s.slug;
              return (
                <button key={s._id || s.slug} type="button" onClick={() => setActiveSub(active ? '' : s.slug)} aria-pressed={active} className={chip(active)} style={{ backgroundColor: active ? NAVY : CHIP_BG }}>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-[1010px] mx-auto">
          {!loading && (
            <p className="mt-3 text-[13px] text-gray-600 flex items-center gap-2">
              <span>{list.length} {list.length === 1 ? 'result' : 'results'}: <b className="font-semibold text-gray-700">{headerTitle}</b></span>
              <svg className="w-[18px] h-[18px] text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
              </svg>
            </p>
          )}

          <section className="mt-4">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : shown.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
                {shown.map((pkg, index) => (
                  <TourCard key={pkg.id} pkg={pkg} highlighted={index === 0 && !activeSub && !topRatedOnly} liked={liked.has(pkg.id)} onToggleLike={toggleLike} dateQuery={dateQuery} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">No packages found for {headerTitle}.</div>
            )}
          </section>
        </div>

        {!loading && hasMore && (
          <div className="mt-10 flex items-center gap-5">
            <span className="h-[2px] flex-1" style={{ backgroundColor: LINE_BLUE }} />
            <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="px-9 py-2.5 rounded-full text-white text-[15px] font-bold hover:opacity-90 transition" style={{ backgroundColor: GOLD }}>
              Show more
            </button>
            <span className="h-[2px] flex-1" style={{ backgroundColor: LINE_BLUE }} />
          </div>
        )}

        <section className="mt-20 max-w-[1010px] mx-auto">
          <div className="grid md:grid-cols-2 overflow-hidden rounded-xl min-h-[265px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={NEWSLETTER_IMAGE}
              alt=""
              className="w-full h-52 md:h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = imageSrc(headerImage);
              }}
            />

            <div className="px-6 md:px-8 py-8 flex flex-col justify-center" style={{ backgroundColor: PANEL_BLUE }}>
              <h2 className="text-2xl md:text-[30px] font-bold leading-tight" style={{ color: NAVY }}>
                Discover the wonder of travel every week
              </h2>
              <p className="text-[15px] mt-4 leading-relaxed font-medium" style={{ color: NAVY }}>
                Get personalized travel inspiration, the latest travel hacks, and exclusive deals straight to your inbox.
              </p>

              {subscribed ? (
                <p className="mt-6 text-sm font-semibold" style={{ color: NAVY }}>Thank you! You are on the list.</p>
              ) : (
                <form onSubmit={onSubscribe} className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <label className="relative flex-1 min-w-0 block">
                    <span className="absolute top-2 left-3 text-[10px] font-semibold tracking-wide text-gray-600">EMAIL</span>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-[56px] pt-5 pl-3 pr-10 rounded-md bg-white text-sm text-gray-900 outline-none border border-gray-300 focus:border-gray-500" />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
                    </svg>
                  </label>
                  <button type="submit" className="px-8 py-3.5 rounded-full text-white text-base font-bold hover:opacity-90 transition" style={{ backgroundColor: GOLD }}>Sign up</button>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-10 mb-6 px-6 md:px-16 pt-8 pb-6" style={{ backgroundColor: FOOTER_BLUE, color: NAVY }}>
          <div className="grid md:grid-cols-3 items-center gap-8">
            <Link href="/" className="justify-self-center md:justify-self-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="Desert Smart Tourism" className="h-20 w-auto" />
            </Link>

            <div className="text-center md:text-left">
              <p className="text-xs font-bold mb-3">Follow Us:</p>
              <div className="flex gap-2.5 justify-center md:justify-start">
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-9 h-9 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d={s.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-4" aria-label="Accepted payments">
              <span className="text-[22px] font-black italic tracking-tight" style={{ color: '#1a1f71' }}>VISA</span>
              <svg width="44" height="28" viewBox="0 0 44 28" aria-label="Mastercard">
                <circle cx="16" cy="14" r="11" fill="#eb001b" />
                <circle cx="28" cy="14" r="11" fill="#f79e1b" fillOpacity="0.95" />
              </svg>
            </div>
          </div>

          <p className="mt-8 text-center text-xs">© {new Date().getFullYear()} Desert Smart Tourism. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
