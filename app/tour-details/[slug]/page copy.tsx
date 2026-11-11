'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ReviewsSection from '@/components/sections/ReviewsSection';
import { useCart } from '@/context/CartContext';

/* ------------------------------------------------------------------ */
/* Theme (from the reference screenshot)                               */
/* ------------------------------------------------------------------ */

const GOLD = '#B8952F';
const GOLD_DARK = '#9c7c22';
const NAVY = '#1f2a44';
const BLUE = '#2f6bd6';
const ROUTE = '#f4553a';
const GREEN = '#1a9b55';
const PRICE_RED = '#d92d20';

const API_HOST = 'https://vantratours-swart.vercel.app';
const DEFAULT_CURRENCY = 'AED';
const WHATSAPP = 'https://wa.me/971508778139';

const imageSrc = (img?: string) => (img && img.startsWith('/api/') ? `${API_HOST}${img}` : img || '');

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface OptionView {
  key: string;
  title: string;
  duration?: string;
  description?: string;
  features: { icon?: string; label: string }[];
  penalty?: string;
  times: string[];
  pricingType: 'person' | 'group';
  adult: number;
  child: number;
  infant: number;
  unit: number; // flat price used when pricingType is not "person"
  minPax: number;
  maxPax: number;
  currency: string;
  raw: any;
}

interface Related {
  _id: string;
  slug?: string;
  title: string;
  image?: string;
  price?: number;
  location?: string;
  duration?: string;
}

type Availability = 'idle' | 'loading' | 'available' | 'unavailable';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso: string, n: number) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const shortDate = (iso: string) =>
  iso ? fromISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const longDate = (iso: string) =>
  iso
    ? fromISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

const slotLabel = (s: any): string => (typeof s === 'string' ? s : s?.time || s?.label || s?.name || s?.slot || '');

/** Accepts an HTML string, a plain string or an array of strings and returns HTML. */
const toHtml = (c: any): string => {
  if (!c) return '';
  if (Array.isArray(c)) {
    return `<ul>${c.map((i) => `<li>${typeof i === 'string' ? i : i?.text || i?.title || ''}</li>`).join('')}</ul>`;
  }
  if (typeof c === 'string') {
    if (/<\/?[a-z][\s\S]*>/i.test(c)) return c;
    return c
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }
  return '';
};
const stripHtml = (s: string) => s.replace(/<[^>]*>?/gm, '');
const num = (...vals: any[]): number => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
};
function normaliseOption(o: any, i: number, fallbackPrice: number): OptionView {
  const isGroup = o.pricingType === 'group';
  const adult = num(o.adultPrice, o.pricePerPerson, o.price, fallbackPrice);
  const group = num(o.groupPrice, o.price, o.pricePerPerson, o.adultPrice, fallbackPrice);
  return {
    key: String(o._id || o.id || i),
    title: o.title || `Option ${i + 1}`,
    duration: o.duration,
    description: o.description,
    features: Array.isArray(o.features)
      ? o.features
          .map((f: any) =>
            typeof f === 'string' ? { icon: 'check', label: f } : { icon: f?.icon, label: f?.label || f?.title || f?.name || '' }
          )
          .filter((f: any) => f.label)
      : [],
    penalty: o.penalty,
    times: Array.isArray(o.timeSlots) ? o.timeSlots.map(slotLabel).filter(Boolean) : [],
    pricingType: isGroup ? 'group' : 'person',
    adult,
    child: num(o.childPrice, adult),
    infant: Number(o.infantPrice) || 0,
    unit: group,
    minPax: Number(o.minPax) || 1,
    maxPax: Number(o.maxPax) || 0,
    currency: o.currency || DEFAULT_CURRENCY,
    raw: o,
  };
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
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

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

const ICON_PATHS: Record<string, string> = {
  cancel: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  pay: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  pickup: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zM3 13l2-6h10l4 6M3 13v4h1m15 0h1v-4h-5',
  car: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zM3 13l2-6h10l4 6M3 13v4h1m15 0h1v-4h-5',
  bus: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zM3 13l2-6h10l4 6M3 13v4h1m15 0h1v-4h-5',
  guide: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0z',
  check: 'M5 13l4 4L19 7',
  calendar: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
};

const Icon = ({ name, className = 'w-5 h-5' }: { name?: string; className?: string }) => {
  // emoji (or any short non-key text) is rendered as-is, e.g. the icons coming from the API features
  if (name && !ICON_PATHS[name] && name.length <= 4) return <span className="text-base leading-none">{name}</span>;
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name || 'check'] || ICON_PATHS.check} />
    </svg>
  );
};

const Chevron = ({ open }: { open?: boolean }) => (
  <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 10l5 6 5-6z" />
  </svg>
);

const Rich = ({ content, className = '' }: { content: any; className?: string }) => {
  const html = toHtml(content);
  if (!html) return null;
  return (
    <div
      className={`text-sm text-gray-700 leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2 [&_p]:mb-3 [&_a]:underline [&_strong]:font-semibold ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const SectionRow = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="grid md:grid-cols-[150px_1fr] gap-3 md:gap-8 py-8 border-t border-gray-200">
    <h2 className="text-base font-bold text-gray-900">{title}</h2>
    <div className="min-w-0">{children}</div>
  </section>
);

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <span className="inline-flex" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => {
      const fill = Math.max(0, Math.min(1, value - (i - 1)));
      const id = `star-${size}-${i}-${String(value).replace('.', '_')}`;
      return (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
          <defs>
            <linearGradient id={id}>
              <stop offset={`${fill * 100}%`} stopColor={NAVY} />
              <stop offset={`${fill * 100}%`} stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path fill={`url(#${id})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    })}
  </span>
);

/* Round − / + icons exactly like the reference */
const CircleIcon = ({ plus }: { plus?: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round">
    <circle cx="13" cy="13" r="10" />
    <path d="M8.5 13h9" />
    {plus && <path d="M13 8.5v9" />}
  </svg>
);

/* Calendar ----------------------------------------------------------- */

function Calendar({
  value,
  min,
  disabledDates,
  onSelect,
}: {
  value: string;
  min: string;
  disabledDates: Set<string>;
  onSelect: (iso: string) => void;
}) {
  const base = fromISO(value || min);
  const [view, setView] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const minDate = fromISO(min);
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(view.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const go = (delta: number) => setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));

  return (
    <div className="w-[300px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" aria-label="Previous month" disabled={view <= minMonth} onClick={() => go(-1)} className="w-8 h-8 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">‹</button>
        <p className="text-sm font-bold">{view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        <button type="button" aria-label="Next month" onClick={() => go(1)} className="w-8 h-8 rounded-full hover:bg-gray-100">›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-gray-500 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const iso = toISO(new Date(view.getFullYear(), view.getMonth(), day));
          const disabled = iso < min || disabledDates.has(iso);
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={`mx-auto w-9 h-9 rounded-full text-sm transition-colors ${
                selected ? 'text-white font-bold' : disabled ? 'text-gray-300 cursor-not-allowed line-through' : 'text-gray-900 hover:bg-gray-100'
              } ${iso === toISO(new Date()) && !selected ? 'ring-1 ring-gray-300' : ''}`}
              style={selected ? { backgroundColor: GOLD } : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
function OptionsCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    el?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update, children]);

  const scrollPage = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const arrow =
    'absolute top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50';

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {React.Children.map(children, (child) => (
          <div className="flex shrink-0 snap-start basis-full md:basis-[calc((100%-1rem)/2)]">{child}</div>
        ))}
      </div>
      {canPrev && (
        <button type="button" aria-label="Previous options" onClick={() => scrollPage(-1)} className={`${arrow} -left-3`}>‹</button>
      )}
      {canNext && (
        <button type="button" aria-label="Next options" onClick={() => scrollPage(1)} className={`${arrow} -right-3`}>›</button>
      )}
    </div>
  );
}
export default function TourDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { addToCart } = useCart();

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Related[]>([]);

  const todayISO = toISO(new Date());
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability>('idle');
  const [selectedOption, setSelectedOption] = useState(0);
  const [selectedTime, setSelectedTime] = useState<Record<number, string>>({});
  const [pickup, setPickup] = useState<Record<number, string>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const bookingRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const travelersWrap = useRef<HTMLDivElement>(null);
  const calendarWrap = useRef<HTMLDivElement>(null);

  useClickOutside(travelersWrap, useCallback(() => setTravelersOpen(false), []));
  useClickOutside(calendarWrap, useCallback(() => setCalendarOpen(false), []));

  /* Tour data (same endpoint the old page used) */
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/packages?slug=${slug}`);
        const json = await res.json();
        if (!cancelled && json.success && json.data && json.data.length > 0) setPkg(json.data[0]);
      } catch (err) {
        console.error('Failed to fetch package', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* Related tours */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/packages`);
        const json = await res.json();
        if (json.success) setRelated((json.data || []).filter((p: Related) => p.slug !== slug).slice(0, 8));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [slug]);

  /* Default date: tomorrow */
  useEffect(() => {
    setDate(addDays(todayISO, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Optional: pkg.blockedDates = ['2026-12-25', ...] disables those days */
  const blocked = useMemo(() => {
    const list: any[] = Array.isArray(pkg?.blockedDates) ? pkg.blockedDates : [];
    return new Set(list.map((d) => toISO(new Date(d))).filter((s) => !s.includes('NaN')));
  }, [pkg]);

  const options: OptionView[] = useMemo(() => {
    if (!pkg) return [];
    const fallback = Number(pkg.price || 0);
    const list = Array.isArray(pkg.tourOptions) ? pkg.tourOptions : [];
    return list.length > 0
      ? list.map((o: any, i: number) => normaliseOption(o, i, fallback))
      : [normaliseOption({ title: pkg.title, duration: pkg.duration, price: fallback }, 0, fallback)];
  }, [pkg]);

  const currency = options[0]?.currency || DEFAULT_CURRENCY;
  const fromPrice = useMemo(() => {
    if (pkg?.price) return Number(pkg.price);
    const prices = options.map((o) => (o.pricingType === 'person' ? o.adult : o.unit)).filter((n) => n > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, [pkg, options]);

  useEffect(() => {
    if (availability === 'available') {
      setSelectedOption(0);
      setTimeout(() => optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }, [availability]);

  const checkAvailability = async () => {
    if (!date) {
      setCalendarOpen(true);
      return;
    }
    setAvailability('loading');
    setTravelersOpen(false);
    setCalendarOpen(false);
    // Hook for a real date-based check later: replace this block with an API call.
    await new Promise((r) => setTimeout(r, 450));
    setAvailability(blocked.has(date) ? 'unavailable' : 'available');
  };

  const pickDate = (iso: string) => {
    setDate(iso);
    setCalendarOpen(false);
    setAvailability('idle');
  };

    // Group option: har maxPax guests par 1 gaadi/group
  const vehiclesFor = (o: OptionView) =>
    o.pricingType === 'group'
      ? Math.max(1, o.maxPax > 0 ? Math.ceil((adults + children) / o.maxPax) : 1)
      : 0;

  const totalFor = (o: OptionView) =>
    o.pricingType === 'person'
      ? adults * o.adult + children * o.child + infants * o.infant
      : o.unit * vehiclesFor(o);

  const travelersLabel = useMemo(() => {
    const parts = [`Adult x ${adults}`];
    if (children) parts.push(`Child x ${children}`);
    if (infants) parts.push(`Infant x ${infants}`);
    return parts.join(', ');
  }, [adults, children, infants]);

  const handleContinue = (index: number) => {
    const o = options[index];
    if (!o || !pkg) return;
    const isPerson = o.pricingType === 'person';
    addToCart({
      title: pkg.title,
      packageId: pkg._id || '000000000000000000000000',
      slug: slug || 'custom-package',
      image: pkg.image,
      optionTitle: o.title,
      date: fromISO(date),
      pricingType: o.pricingType as "person" | "group",
      guests: isPerson ? 0 : adults + children,
      items: isPerson ? 0 : vehiclesFor(o),
      adults,
      children,
      infants,
      timeSlot: selectedTime[index] || o.times[0],
      pickupLocation: pickup[index] || '',
      transferType: o.raw?.transferType,
      extraServices: [],
      totalPrice: Number(totalFor(o)),
    });
    router.push('/cart');
  };

  const scrollToBooking = () => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  /* ---------------- loading / not found ---------------- */
  const shell = (body: React.ReactNode) => (
    <div className="min-h-screen bg-white">
      <Header color="bg-[#181E4B]" />
      <div className="h-[100px]" />
      {body}
      <Footer />
    </div>
  );

  if (loading) {
    return shell(
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-8" />
        <div className="h-[360px] bg-gray-200 rounded-2xl" />
      </main>
    );
  }

  if (!pkg) {
    return shell(
      <main className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">We couldn’t find this tour</h1>
        <p className="text-gray-600 mt-2">The link may be old or the tour is no longer available.</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2.5 rounded-full text-white text-sm font-bold" style={{ backgroundColor: GOLD }}>
          Back to home
        </Link>
      </main>
    );
  }

  /* ---------------- derived page data ---------------- */
  const galleryRaw: any[] = Array.isArray(pkg.gallery) && pkg.gallery.length ? pkg.gallery : pkg.image ? [pkg.image] : [];
  const gallery = galleryRaw.map((g) => imageSrc(typeof g === 'string' ? g : g?.url || g?.src)).filter(Boolean);
  const alts: string[] = Array.isArray(pkg.galleryAlts) ? pkg.galleryAlts : [];

  const features: { icon?: string; title: string; description?: string }[] =
    Array.isArray(pkg.features) && pkg.features.length > 0
      ? pkg.features
      : [
          pkg.duration ? { icon: '⏰', title: 'Experience Duration:', description: pkg.duration } : null,
          { icon: '🚗', title: 'Transportation:', description: 'With Pickup and Drop-off' },
        ].filter(Boolean) as any;

  const itineraryIsList = Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0;
  const hasItinerary = itineraryIsList || (typeof pkg.itinerary === 'string' && pkg.itinerary.trim());

  const mp = pkg.meetingPoint || pkg.location;
  const meeting = typeof mp === 'string' ? { name: mp, address: mp } : mp ? { name: mp.name || mp.address, address: mp.address || mp.name } : null;
  const mapQuery = meeting ? encodeURIComponent(meeting.address || '') : '';

  const descHtml = toHtml(pkg.description);
  const descLong = stripHtml(descHtml).length > 280;
  const intro = pkg.shortDescription || pkg.intro;

  const rating = Number(pkg.rating || 0);
  const reviewCount = Number(pkg.reviewCount || 0);

  const travelerRows = [
    { label: 'Adult', sub: 'Age 13-99', v: adults, set: setAdults, min: 1 },
    { label: 'Child', sub: 'Age 4-12', v: children, set: setChildren, min: 0 },
    { label: 'Infant', sub: 'Age 3 and younger', v: infants, set: setInfants, min: 0 },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header color="bg-[#181E4B]" />
      {/* Header is absolutely positioned: this keeps content below it */}
      <div className="h-[100px]" />

      <main>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 lg:pb-20">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-500 py-4 flex gap-2 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-gray-700 line-clamp-1">{pkg.title}</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{pkg.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {rating > 0 && (
              <span className="flex items-center gap-1.5">
                <Stars value={rating} />
                <b>{rating}</b>
                {reviewCount > 0 && <a href="#reviews" className="underline text-gray-700">{reviewCount} reviews</a>}
              </span>
            )}
            <span className="text-gray-500 text-xs">Activity provider: Desert Smart Tourism</span>
            <button
              type="button"
              className="sm:ml-auto flex items-center gap-1.5 text-sm font-semibold hover:underline"
              onClick={() => navigator.share?.({ title: pkg.title, url: window.location.href }).catch(() => {})}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.7 10.7l6.6-3.4m0 9.4l-6.6-3.4M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Share
            </button>
          </div>

          {/* gallery → booking card → rest (card sits right of everything on desktop) */}
          <div className="mt-5 grid lg:grid-cols-[1fr_300px] gap-x-8 gap-y-6 items-start">
            {/* Gallery */}
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-[220px] sm:h-[320px] md:h-[360px] rounded-2xl overflow-hidden">
                  {gallery.slice(0, 5).map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setLightbox(i)}
                      className={`relative overflow-hidden bg-gray-200 ${i === 0 ? 'col-span-2 row-span-2' : 'hidden md:block'}`}
                      aria-label={`Open photo ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={alts[i] || pkg.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      {i === 4 && gallery.length > 5 && (
                        <span className="absolute bottom-3 right-3 bg-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow">View all</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-[260px] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Photos coming soon</div>
              )}
            </div>

            {/* Booking card */}
            <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-stretch">
              <div ref={bookingRef} className="lg:sticky lg:top-28">
                <div className="rounded-2xl border border-gray-200 shadow-sm p-5 bg-white">
                  <p className="text-xs text-gray-500">
                    From
                    {pkg.oldPrice && Number(pkg.oldPrice) > fromPrice ? (
                      <span className="line-through ml-1">{currency} {money(Number(pkg.oldPrice))}</span>
                    ) : null}
                  </p>
                  <p className="text-xl font-bold" style={{ color: PRICE_RED }}>
                    {currency} {money(fromPrice)} <span className="text-xs font-normal text-gray-600">per person</span>
                  </p>

                  {/* Travelers */}
                  <div ref={travelersWrap} className="relative mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTravelersOpen((v) => !v);
                        setCalendarOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-xs font-semibold"
                      aria-expanded={travelersOpen}
                    >
                      <Icon name="user" className="w-4 h-4 text-gray-600" />
                      <span className="flex-1 text-left">{travelersLabel}</span>
                      <Chevron open={travelersOpen} />
                    </button>

                    {travelersOpen && (
                      <div className="absolute z-30 left-0 right-0 min-w-[270px] mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.18)] border border-gray-100 px-5 pt-3 pb-5">
                        {travelerRows.map((r, idx) => (
                          <div key={r.label} className={`flex items-center justify-between py-3 ${idx < travelerRows.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div>
                              <p className="text-sm font-bold" style={{ color: NAVY }}>{r.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">({r.sub})</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <button type="button" aria-label={`Remove ${r.label}`} disabled={r.v <= r.min} onClick={() => r.set(Math.max(r.min, r.v - 1))} className="disabled:opacity-30">
                                <CircleIcon />
                              </button>
                              <span className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center text-sm font-medium">{r.v}</span>
                              <button type="button" aria-label={`Add ${r.label}`} onClick={() => r.set(Math.min(20, r.v + 1))}>
                                <CircleIcon plus />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setTravelersOpen(false)} className="mt-4 w-full py-3 rounded-full text-white text-sm font-bold hover:opacity-90" style={{ backgroundColor: GOLD }}>
                          Continue
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div ref={calendarWrap} className="relative mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarOpen((v) => !v);
                        setTravelersOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-xs font-semibold"
                      aria-expanded={calendarOpen}
                    >
                      <Icon name="calendar" className="w-4 h-4 text-gray-600" />
                      <span className="flex-1 text-left">{date ? shortDate(date) : 'Select date'}</span>
                      <Chevron open={calendarOpen} />
                    </button>
                    {calendarOpen && (
                      <div className="absolute z-30 left-0 lg:right-0 lg:left-auto mt-2">
                        <Calendar value={date} min={todayISO} disabledDates={blocked} onSelect={pickDate} />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={checkAvailability}
                    disabled={availability === 'loading'}
                    className="mt-4 w-full py-3 rounded-full text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-70"
                    style={{ backgroundColor: GOLD }}
                  >
                    {availability === 'loading' ? 'Checking…' : 'Check availability'}
                  </button>

                  {availability === 'available' && (
                    <p className="mt-3 text-xs font-semibold flex items-center gap-1.5" style={{ color: GREEN }}>
                      <Icon name="check" className="w-4 h-4" /> Available on {shortDate(date)}
                    </p>
                  )}
                  {availability === 'unavailable' && (
                    <p className="mt-3 text-xs font-semibold" style={{ color: PRICE_RED }}>
                      Not available on {shortDate(date)}. Please pick another date.
                    </p>
                  )}

                  <ul className="mt-5 space-y-3 text-xs text-gray-700">
                    <li className="flex gap-2.5">
                      <span className="shrink-0" style={{ color: GREEN }}><Icon name="cancel" /></span>
                      <span><b className="block text-gray-900">Reserve now &amp; pay later</b>Keep your travel plans flexible — book your spot and pay nothing today</span>
                    </li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* Everything under the gallery */}
            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              {availability === 'unavailable' && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  This tour is not available on {longDate(date)}. Choose a different date from the calendar and check again.
                </div>
              )}

              {availability === 'available' && (
  <div ref={optionsRef} className="scroll-mt-28">
    <h2 className="text-lg font-bold mb-4">
      Choose from {options.length} available option{options.length > 1 ? 's' : ''}
    </h2>
    <OptionsCarousel>
      {options.map((o, i) => {
        const active = i === selectedOption;
        const time = selectedTime[i] || o.times[0];
        const total = totalFor(o);
        const isPerson = o.pricingType === 'person';
        return (
          <div
            key={o.key}
            onClick={() => setSelectedOption(i)}
            className="w-full rounded-xl border-2 p-4 flex flex-col cursor-pointer transition-colors bg-white"
            style={{ borderColor: active ? BLUE : '#e5e7eb' }}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-sm leading-snug">{o.title}</h3>
              <span
                className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-white"
                style={active ? { backgroundColor: GOLD, borderColor: GOLD } : { borderColor: '#d1d5db' }}
              >
                {active && <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </span>
            </div>

            {o.description && <p className="text-xs text-gray-600 mt-3 leading-relaxed">{o.description}</p>}

            <ul className="mt-4 space-y-2 text-xs text-gray-700">
              {o.duration && (
                <li className="flex items-center gap-2"><Icon name="clock" className="w-4 h-4" /> Duration: {o.duration}</li>
              )}
              {o.features.map((f) => (
                <li key={f.label} className="flex items-center gap-2"><Icon name={f.icon} className="w-4 h-4" /> {f.label}</li>
              ))}
              {o.penalty && (
                <li className="flex items-start gap-2"><Icon name="cancel" className="w-4 h-4 shrink-0 mt-0.5" /> {o.penalty}</li>
              )}
            </ul>

            {o.times.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold">Select a starting time</p>
                <p className="text-xs text-gray-500 mt-1">{longDate(date)}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {o.times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOption(i);
                        setSelectedTime((s) => ({ ...s, [i]: t }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${time === t ? 'text-white' : 'border-gray-300 text-gray-800 hover:border-gray-500'}`}
                      style={time === t ? { backgroundColor: GOLD, borderColor: GOLD } : undefined}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active && (
              <input
                type="text"
                value={pickup[i] || ''}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setPickup((s) => ({ ...s, [i]: e.target.value }))}
                placeholder="Pickup location (hotel name, optional)"
                className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-gray-500"
              />
            )}

            <div className="mt-auto pt-5">
              <span className="text-xl font-bold">{o.currency} {money(total)}</span>
              <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                {isPerson ? (
                  <>
                    <p>{adults} Adult × {money(o.adult)}</p>
                    {children > 0 && <p>{children} Child × {money(o.child)}</p>}
                    {infants > 0 && <p>{infants} Infant × {money(o.infant)}</p>}
                  </>
                ) : (
                                <>
                                  <p>{vehiclesFor(o)} × {money(o.unit)} (per group)</p>
                                  <p>{adults + children} guest{adults + children > 1 ? 's' : ''}{o.maxPax > 0 ? `, max ${o.maxPax} per group` : ''}</p>
                                </>
                              )}
              </div>
              <p className="text-[11px] text-gray-400">All taxes and fees included</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOption(i);
                  handleContinue(i);
                }}
                className={`mt-3 w-full py-2.5 rounded-full text-sm font-bold transition ${active ? 'text-white hover:opacity-90' : 'border bg-white'}`}
                style={active ? { backgroundColor: GOLD } : { borderColor: GOLD, color: GOLD_DARK }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = GOLD;
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = GOLD_DARK;
                  }
                }}
              >
                {active ? 'Continue' : 'Select'}
              </button>
            </div>
          </div>
        );
      })}
    </OptionsCarousel>
  </div>
)}

              {intro && <p className="mt-8 text-sm text-gray-700 leading-relaxed">{intro}</p>}

              {/* Quick facts (from pkg.features) */}
              {features.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 grid sm:grid-cols-2 gap-x-8 gap-y-5">
                  {features.map((f, i) => (
                    <div key={f.title + i} className="flex gap-3">
                      <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-700">
                        <Icon name={f.icon} className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{f.title}</p>
                        {f.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ask a question */}
              <div className="mt-8 rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 sm:w-52 shrink-0">
                  <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold">?</span>
                  <p className="text-sm font-semibold leading-tight">Got a question about this activity?</p>
                </div>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-between border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-500 hover:border-gray-500">
                  Ask our team on WhatsApp
                  <span className="w-7 h-7 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: GOLD }}>↑</span>
                </a>
              </div>

              {toHtml(pkg.highlights) && (
                <SectionRow title="Highlights">
                  <Rich content={pkg.highlights} />
                </SectionRow>
              )}

              {descHtml && (
                <SectionRow title="Full description">
                  <Rich content={pkg.description} className={showFullDesc || !descLong ? '' : 'line-clamp-4'} />
                  {descLong && (
                    <button type="button" onClick={() => setShowFullDesc((v) => !v)} className="mt-3 text-sm font-semibold underline">
                      {showFullDesc ? 'See less' : 'See more'}
                    </button>
                  )}
                </SectionRow>
              )}

              {hasItinerary && (
                <SectionRow title="Itinerary">
                  {itineraryIsList ? (
                    <ol className="relative pl-10 space-y-8">
                      <span className="absolute left-[15px] top-4 bottom-4 w-1 rounded" style={{ backgroundColor: ROUTE }} aria-hidden="true" />
                      {pkg.itinerary.map((item: any, idx: number) => (
                        <li key={idx} className="relative">
                          <span
                            className="absolute -left-10 top-0 w-8 h-8 rounded-full border-4 border-white shadow text-white text-xs font-bold flex items-center justify-center"
                            style={{ backgroundColor: ROUTE }}
                          >
                            {item?.day || idx + 1}
                          </span>
                          <p className="text-sm font-semibold break-words">{typeof item === 'string' ? item : item.title}</p>
                          {item?.description && (
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-line break-words">{item.description}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Rich content={pkg.itinerary} />
                  )}
                  <p className="mt-6 text-xs text-gray-500">For reference only. Itineraries are subject to change.</p>
                </SectionRow>
              )}

              {toHtml(pkg.includes) && (
                <SectionRow title="Includes">
                  <Rich content={pkg.includes} />
                </SectionRow>
              )}

              {meeting && meeting.address && (
                <SectionRow title="Meeting point">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-sm">
                      <p className="font-semibold">{meeting.name}</p>
                      <a className="inline-block mt-4 font-semibold underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}>
                        View details
                      </a>
                    </div>
                    <iframe title="Meeting point" className="w-full h-48 rounded-xl border-0" loading="lazy" src={`https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`} />
                  </div>
                </SectionRow>
              )}

              {toHtml(pkg.important) && (
                <SectionRow title="Important information">
                  <Rich content={pkg.important} />
                </SectionRow>
              )}
            </div>
          </div>

          {/* You might also like */}
          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xl font-bold mb-5">You might also like…</h2>
              <div className="relative">
                <div ref={carouselRef} className="flex gap-4 overflow-x-auto snap-x pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {related.map((p) => (
                    <Link key={p._id} href={p.slug ? `/tour-details/${p.slug}` : '#'} className="snap-start shrink-0 w-[250px] group">
                      <div className="relative h-44 rounded-xl overflow-hidden bg-gray-200">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageSrc(p.image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )}
                      </div>
                      {p.location && <p className="mt-3 text-[10px] text-gray-500">{p.location}</p>}
                      <h3 className="text-sm font-bold leading-snug line-clamp-2 mt-0.5">{p.title}</h3>
                      {p.duration && <p className="text-xs text-gray-500 mt-1">{p.duration}</p>}
                      {p.price ? (
                        <p className="text-xs text-gray-500 mt-2 text-right">From <b className="text-gray-900 text-sm">{currency} {p.price}</b></p>
                      ) : null}
                    </Link>
                  ))}
                </div>
                <button type="button" aria-label="Next" onClick={() => carouselRef.current?.scrollBy({ left: 270, behavior: 'smooth' })} className="hidden md:flex absolute right-0 top-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow items-center justify-center">
                  ›
                </button>
              </div>
            </section>
          )}

          {/* Reviews (your existing component) */}
          {pkg._id && (
            <section id="reviews" className="mt-14 scroll-mt-28 border-t border-gray-200 pt-8">
              <ReviewsSection packageId={pkg._id} />
            </section>
          )}
        </div>
      </main>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-500">From</p>
          <p className="font-bold" style={{ color: PRICE_RED }}>{currency} {money(fromPrice)}</p>
        </div>
        <button type="button" onClick={scrollToBooking} className="px-6 py-2.5 rounded-full text-white text-sm font-bold" style={{ backgroundColor: GOLD }}>
          Select date &amp; travelers
        </button>
      </div>

      <Footer />

      {/* Lightbox */}
      {lightbox !== null && gallery.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <button type="button" aria-label="Close" className="absolute top-4 right-5 text-white text-3xl" onClick={() => setLightbox(null)}>×</button>
          <button type="button" aria-label="Previous photo" className="absolute left-4 text-white text-4xl" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}>‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[lightbox]} alt={alts[lightbox] || ''} className="max-h-[85vh] max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
          <button type="button" aria-label="Next photo" className="absolute right-4 text-white text-4xl" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}>›</button>
        </div>
      )}
    </div>
  );
}