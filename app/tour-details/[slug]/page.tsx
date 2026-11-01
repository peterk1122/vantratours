'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
// import { useCart } from '@/context/CartContext';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface TourOption {
  id: string;
  title: string;
  description?: string;
  guide?: string;
  freeCancellation?: boolean;
  reservePayLater?: boolean;
  times: string[];
  adultPrice: number;
  childPrice?: number;
  oldPrice?: number; // per-person price before discount
  discountPercent?: number;
  isPrivate?: boolean; // private tours are priced per group
  groupPrice?: number;
  groupSize?: number;
}

interface Review {
  name: string;
  country: string;
  rating: number;
  date: string;
  text: string;
}

interface ItineraryStop {
  label: string;
  note?: string;
}

interface Tour {
  _id: string;
  slug: string;
  title: string;
  rating: number;
  reviewCount: number;
  provider: string;
  images: string[];
  fromPrice: number;
  oldPrice?: number;
  options: TourOption[];
  intro: string;
  duration: string;
  guideLanguage: string;
  facts: { icon: string; title: string; text?: string }[];
  highlights: string[];
  description: string;
  itinerary: ItineraryStop[];
  includes: string[];
  excludes: string[];
  meetingPoint: { name: string; address: string };
  important: string[];
  reviews: Review[];
  ratingBreakdown: { label: string; value: number }[];
}

interface Related {
  _id: string;
  slug?: string;
  title: string;
  image?: string;
  price?: number;
  location?: string;
  rating?: number;
  reviewCount?: number;
  duration?: string;
}

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const ACCENT = '#DF6951'; // brand colour (same as header accent)
const CURRENCY = 'AED';
const IMAGE_HOST = 'https://desertsmarttourism.com';
const imageSrc = (img?: string) => (img && img.startsWith('/api/') ? `${IMAGE_HOST}${img}` : img || '');

/**
 * Shown when the API cannot be reached so you can see the design.
 * Remove this once your /api/packages/[slug] returns the real data.
 */
const DEMO: Tour = {
  _id: 'demo',
  slug: 'demo',
  title: 'Dubai: Desert Safari with BBQ Dinner and Live Shows',
  rating: 4.8,
  reviewCount: 770,
  provider: 'Desert Smart Tourism',
  images: [],
  fromPrice: 120,
  oldPrice: 150,
  intro:
    'Ride the dunes at sunset, enjoy a camp dinner under the stars and watch live performances on a shared or private tour.',
  duration: '6 hours',
  guideLanguage: 'English',
  options: [
    {
      id: 'shared',
      title: 'Desert Safari (Shared Tour)',
      guide: 'English',
      freeCancellation: true,
      reservePayLater: true,
      times: ['3:00 PM', '3:30 PM'],
      adultPrice: 120,
      childPrice: 100,
      oldPrice: 150,
      discountPercent: 20,
    },
    {
      id: 'private',
      title: 'Private Desert Safari',
      description: 'A private vehicle and driver for your own group, flexible on pick-up time.',
      guide: 'English',
      freeCancellation: true,
      reservePayLater: true,
      times: ['3:00 PM', '3:30 PM'],
      adultPrice: 0,
      isPrivate: true,
      groupPrice: 650,
      groupSize: 6,
    },
  ],
  facts: [
    { icon: 'cancel', title: 'Free cancellation', text: 'Cancel up to 24 hours in advance for a full refund' },
    { icon: 'pay', title: 'Reserve now & pay later', text: 'Keep your travel plans flexible. Book your spot and pay nothing today' },
    { icon: 'clock', title: 'Duration 6 hours', text: 'Check availability to see starting times' },
    { icon: 'pickup', title: 'Hotel pick-up and drop-off' },
    { icon: 'guide', title: 'Live tour guide', text: 'English' },
    { icon: 'group', title: 'Private or small groups available' },
  ],
  highlights: [
    'Dune bashing in a 4x4 with an experienced driver',
    'Sunset photo stop in the open desert',
    'BBQ dinner with vegetarian options',
    'Live belly dance and Tanoura show',
    'Camel ride, sandboarding and henna painting',
  ],
  description:
    'Leave the city behind and head into the Dubai desert for an evening you will remember. Your driver takes you over the dunes, stops for sunset photos, then brings you to a traditional camp for dinner, music and live shows.\n\nPick-up and drop-off from your hotel are included. Soft drinks, tea, coffee and water are available all evening.',
  itinerary: [
    { label: 'Starting location', note: 'Your hotel in Dubai' },
    { label: 'Desert camp', note: 'Dune bashing, sunset, BBQ dinner, live shows' },
    { label: 'Arrive back at', note: 'Your hotel in Dubai' },
  ],
  includes: [
    'Hotel pick-up and drop-off',
    'Dune bashing in a 4x4',
    'BBQ dinner and unlimited soft drinks',
    'Live entertainment',
    'Camel ride and sandboarding',
  ],
  excludes: ['Tips', 'Quad bike (available at the camp for an extra fee)'],
  meetingPoint: { name: 'Hotel lobby', address: 'Dubai, United Arab Emirates' },
  important: [
    'Pick-up time is confirmed on WhatsApp the evening before your tour.',
    'Pregnant travellers and guests with back problems are not recommended to join dune bashing.',
  ],
  reviews: [
    {
      name: 'Will',
      country: 'United States',
      rating: 5,
      date: 'October 5, 2026',
      text: 'Our driver was very clear, told good stories, and made the evening fun. Great experience.',
    },
    {
      name: 'Mehmet',
      country: 'Turkey',
      rating: 5,
      date: 'September 26, 2026',
      text: 'Everything was on time and the camp was lovely. We gained very valuable insights about the desert.',
    },
  ],
  ratingBreakdown: [
    { label: 'Guide', value: 4.6 },
    { label: 'Value for money', value: 4.3 },
  ],
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

const Stars = ({ value, size = 16 }: { value: number; size?: number }) => (
  <span className="inline-flex" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => {
      const fill = Math.max(0, Math.min(1, value - (i - 1)));
      return (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
          <defs>
            <linearGradient id={`g-${size}-${i}-${value}`}>
              <stop offset={`${fill * 100}%`} stopColor="#1f2a44" />
              <stop offset={`${fill * 100}%`} stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#g-${size}-${i}-${value})`}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      );
    })}
  </span>
);

const Icon = ({ name }: { name: string }) => {
  const paths: Record<string, string> = {
    cancel: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    pay: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    pickup: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zM3 13l2-6h10l4 6M3 13v4h1m15 0h1v-4h-5',
    guide: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0z',
    group: 'M17 20h5v-2a3 3 0 00-5.36-1.86M17 20H7m10 0v-2c0-.66-.13-1.28-.36-1.86M7 20H2v-2a3 3 0 015.36-1.86M7 20v-2c0-.66.13-1.28.36-1.86m0 0a5 5 0 019.28 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    check: 'M5 13l4 4L19 7',
    tick: 'M5 13l4 4L19 7',
  };
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name] || paths.check} />
    </svg>
  );
};

const SectionRow = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="grid md:grid-cols-[160px_1fr] gap-3 md:gap-8 py-8 border-t border-gray-200">
    <h2 className="text-base font-bold text-gray-900">{title}</h2>
    <div>{children}</div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Normalise whatever the API returns into the Tour shape              */
/* ------------------------------------------------------------------ */

function toTour(raw: any): Tour {
  const d = DEMO;
  if (!raw) return d;
  const images: string[] = (raw.images || raw.gallery || (raw.image ? [raw.image] : [])).map(imageSrc);
  const price = Number(raw.price ?? raw.fromPrice ?? d.fromPrice);
  return {
    ...d,
    ...raw,
    _id: raw._id || d._id,
    slug: raw.slug || d.slug,
    title: raw.title || d.title,
    images,
    fromPrice: price,
    oldPrice: raw.oldPrice,
    rating: Number(raw.rating ?? d.rating),
    reviewCount: Number(raw.reviewCount ?? raw.reviews?.length ?? d.reviewCount),
    options:
      Array.isArray(raw.options) && raw.options.length
        ? raw.options
        : [
            {
              id: 'standard',
              title: raw.title || d.title,
              guide: raw.language || 'English',
              freeCancellation: true,
              reservePayLater: true,
              times: raw.times || ['10:00 AM'],
              adultPrice: price,
              childPrice: raw.childPrice ?? Math.round(price * 0.8),
            },
          ],
    intro: raw.shortDescription || raw.intro || d.intro,
    description: raw.description || d.description,
    highlights: raw.highlights || d.highlights,
    includes: raw.includes || d.includes,
    excludes: raw.excludes || d.excludes,
    itinerary: raw.itinerary || d.itinerary,
    reviews: Array.isArray(raw.reviews) && raw.reviews.length ? raw.reviews : d.reviews,
    meetingPoint: raw.meetingPoint || d.meetingPoint,
    important: raw.important || d.important,
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TourDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  // const { addItem } = useCart();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Related[]>([]);

  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const [selectedTime, setSelectedTime] = useState<Record<number, string>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const optionsRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/packages/${slug}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) setTour(json.success && json.data ? toTour(json.data) : DEMO);
      } catch (e) {
        console.error('Failed to load tour', e);
        if (!cancelled) setTour(DEMO);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/packages');
        const json = await res.json();
        if (json.success) {
          setRelated((json.data || []).filter((p: Related) => p.slug !== slug).slice(0, 8));
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [slug]);

  // default date = 7 days from today
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDate(d.toISOString().slice(0, 10));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const totalFor = (opt: TourOption) => {
    if (opt.isPrivate) {
      const groups = Math.max(1, Math.ceil((adults + children) / (opt.groupSize || 1)));
      return (opt.groupPrice || 0) * groups;
    }
    return adults * opt.adultPrice + children * (opt.childPrice ?? opt.adultPrice);
  };

  const travelersLabel = useMemo(() => {
    const parts = [`Adult x ${adults}`];
    if (children) parts.push(`Child x ${children}`);
    if (infants) parts.push(`Infant x ${infants}`);
    return parts.join(', ');
  }, [adults, children, infants]);

  const prettyDate = (iso: string, long = false) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', long
      ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const scrollToOptions = () => optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleContinue = (index: number) => {
    if (!tour) return;
    const opt = tour.options[index];
    const time = selectedTime[index] || opt.times[0];
    const payload = {
      packageId: tour._id,
      slug: tour.slug,
      title: tour.title,
      image: tour.images[0],
      option: opt.title,
      date,
      time,
      adults,
      children,
      infants,
      total: totalFor(opt),
    };
    // TODO: hook into your cart, e.g. addItem(payload);
    console.log('Add to cart', payload);
    setShowToast(true);
    router.push('/cart');
  };

  if (loading || !tour) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-pulse">
        <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-8" />
        <div className="h-[360px] bg-gray-200 rounded-2xl" />
      </main>
    );
  }

  const gallery = tour.images.length ? tour.images : [];
  const mapQuery = encodeURIComponent(tour.meetingPoint.address || tour.meetingPoint.name);
  const activeOpt = tour.options[selectedOption] || tour.options[0];
  const visibleReviews = showAllReviews ? tour.reviews : tour.reviews.slice(0, 2);

  return (
    <main className="bg-white text-gray-900" style={{ ['--accent' as string]: ACCENT } as React.CSSProperties}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 py-4 flex gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/tours" className="hover:underline">Tours</Link>
          <span>/</span>
          <span className="text-gray-700 line-clamp-1">{tour.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{tour.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Stars value={tour.rating} size={14} />
            <b>{tour.rating}</b>
            <a href="#reviews" className="underline text-gray-700">{tour.reviewCount} reviews</a>
          </span>
          <span className="text-gray-500 text-xs">Activity provider: {tour.provider}</span>
          <span className="ml-auto flex items-center gap-5 text-sm font-semibold">
            <button type="button" className="flex items-center gap-1.5 hover:underline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.3 6.3a5 5 0 017.1 0L12 7l.6-.7a5 5 0 117.1 7.1L12 21l-7.7-7.6a5 5 0 010-7.1z" /></svg>
              Add to wishlist
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 hover:underline"
              onClick={() => navigator.share?.({ title: tour.title, url: window.location.href }).catch(() => {})}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.7 10.7l6.6-3.4m0 9.4l-6.6-3.4M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Share
            </button>
          </span>
        </div>

        <div className="mt-5 grid lg:grid-cols-[1fr_300px] gap-8">
          {/* ================= LEFT ================= */}
          <div className="min-w-0">
            {/* Gallery */}
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
                    <img src={src} alt={`${tour.title} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    {i === 4 && gallery.length > 5 && (
                      <span className="absolute bottom-3 right-3 bg-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow">
                        View all {gallery.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-[260px] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Photos coming soon
              </div>
            )}

            {/* Options */}
            <div ref={optionsRef} className="mt-8 scroll-mt-28">
              <h2 className="text-lg font-bold mb-4">
                Choose from {tour.options.length} available option{tour.options.length > 1 ? 's' : ''}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {tour.options.map((opt, i) => {
                  const active = i === selectedOption;
                  const time = selectedTime[i] || opt.times[0];
                  const total = totalFor(opt);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOption(i)}
                      className={`rounded-xl border p-4 flex flex-col cursor-pointer transition-colors ${
                        active ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-sm leading-snug">{opt.title}</h3>
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            active ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-gray-300'
                          }`}
                        >
                          {active && <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </span>
                      </div>
                      {opt.description && <p className="text-xs text-gray-600 mt-3 leading-relaxed">{opt.description}</p>}
                      <ul className="mt-4 space-y-2 text-xs text-gray-700">
                        {opt.guide && <li className="flex items-center gap-2"><Icon name="guide" /> Guide: {opt.guide}</li>}
                        {opt.reservePayLater && <li className="flex items-center gap-2"><Icon name="pay" /> Reserve now &amp; pay later</li>}
                        {opt.freeCancellation && <li className="flex items-center gap-2"><Icon name="cancel" /> Cancel for free until {prettyDate(date)}</li>}
                      </ul>

                      <div className="mt-5">
                        <p className="text-xs font-semibold">Select a starting time</p>
                        <p className="text-xs text-gray-500 mt-1">{prettyDate(date, true)}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {opt.times.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOption(i);
                                setSelectedTime((s) => ({ ...s, [i]: t }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                time === t ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-gray-300 text-gray-800 hover:border-gray-500'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto pt-5">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xl font-bold">{CURRENCY} {money(total)}</span>
                          {opt.oldPrice && !opt.isPrivate && (
                            <>
                              <span className="text-xs text-gray-400 line-through">{CURRENCY} {money(adults * opt.oldPrice + children * (opt.childPrice ?? opt.oldPrice))}</span>
                              {opt.discountPercent ? <span className="text-xs font-bold text-red-600">-{opt.discountPercent}%</span> : null}
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          {opt.isPrivate
                            ? `Up to ${opt.groupSize} people · ${CURRENCY} ${money(opt.groupPrice || 0)} per group`
                            : `${adults} Adult × ${money(opt.adultPrice)}${children ? ` · ${children} Child × ${money(opt.childPrice ?? opt.adultPrice)}` : ''}${infants ? ` · ${infants} Infant × 0` : ''}`}
                        </p>
                        <p className="text-[11px] text-gray-400">All taxes and fees included</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOption(i);
                            handleContinue(i);
                          }}
                          className={`mt-3 w-full py-2.5 rounded-full text-sm font-bold transition ${
                            active
                              ? 'bg-[var(--accent)] text-white hover:opacity-90'
                              : 'border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
                          }`}
                        >
                          {active ? 'Continue' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intro */}
            <p className="mt-8 text-sm text-gray-700 leading-relaxed">{tour.intro}</p>

            {/* Quick facts */}
            <div className="mt-6 pt-6 border-t border-gray-200 grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {tour.facts.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-700">
                    <Icon name={f.icon} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    {f.text && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.text}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Ask a question */}
            <div className="mt-8 rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 sm:w-52 shrink-0">
                <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">?</span>
                <p className="text-sm font-semibold leading-tight">Got a question about this activity?</p>
              </div>
              <a
                href="https://wa.me/971508778139"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-between border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-500 hover:border-gray-500"
              >
                Ask our team on WhatsApp
                <span className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">↑</span>
              </a>
            </div>

            {/* What travelers loved */}
            <h2 className="mt-10 text-lg font-bold">What travelers loved</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {tour.reviews.slice(0, 2).map((r) => (
                <article key={r.name + r.date} className="rounded-xl border border-gray-200 p-4">
                  <Stars value={r.rating} size={13} />
                  <div className="flex items-center gap-3 mt-3">
                    <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">{r.name[0]}</span>
                    <div>
                      <p className="text-xs font-semibold">{r.name} – {r.country}</p>
                      <p className="text-[11px] text-gray-500">{r.date} · Verified booking</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 line-clamp-3">{r.text}</p>
                </article>
              ))}
            </div>
            <div className="text-right mt-3">
              <a href="#reviews" className="text-sm font-semibold underline">See more reviews</a>
            </div>

            <SectionRow title="Highlights">
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                {tour.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </SectionRow>

            <SectionRow title="Full description">
              <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-line ${showFullDesc ? '' : 'line-clamp-4'}`}>
                {tour.description}
              </div>
              <button type="button" onClick={() => setShowFullDesc((v) => !v)} className="mt-3 text-sm font-semibold underline">
                {showFullDesc ? 'See less' : 'See more'}
              </button>
            </SectionRow>

            <SectionRow title="Itinerary">
              <div className="grid md:grid-cols-2 gap-6">
                <ol className="relative pl-8 space-y-8">
                  <span className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-[var(--accent)]" aria-hidden="true" />
                  {tour.itinerary.map((s, i) => (
                    <li key={s.label + i} className="relative">
                      <span className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full border-4 border-white shadow ${i === 1 ? 'bg-[#1f2a44]' : 'bg-[var(--accent)]'}`} />
                      <p className="text-sm font-semibold">{s.label}</p>
                      {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
                    </li>
                  ))}
                </ol>
                <iframe
                  title="Itinerary map"
                  className="w-full h-60 rounded-xl border-0"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${mapQuery}&z=12&output=embed`}
                />
              </div>
              <p className="mt-6 text-xs text-gray-500">For reference only. Itineraries are subject to change.</p>
            </SectionRow>

            <SectionRow title="Includes">
              <ul className="space-y-2.5 text-sm text-gray-700">
                {tour.includes.map((t) => (
                  <li key={t} className="flex gap-3"><span className="text-green-600 mt-0.5"><Icon name="check" /></span>{t}</li>
                ))}
                {tour.excludes.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="text-red-500 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </SectionRow>

            <SectionRow title="Meeting point">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-sm">
                  <p className="font-semibold">{tour.meetingPoint.name}</p>
                  <p className="text-gray-600 mt-1">{tour.meetingPoint.address}</p>
                  <a
                    className="inline-block mt-4 font-semibold underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  >
                    View details
                  </a>
                </div>
                <iframe
                  title="Meeting point"
                  className="w-full h-48 rounded-xl border-0"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`}
                />
              </div>
            </SectionRow>

            <SectionRow title="Important information">
              <p className="text-sm font-semibold mb-2">Know before you go</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                {tour.important.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </SectionRow>
          </div>

          {/* ================= RIGHT (sticky booking) ================= */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs text-gray-500">
                  From {tour.oldPrice ? <span className="line-through ml-1">{CURRENCY} {money(tour.oldPrice)}</span> : null}
                </p>
                <p className="text-xl font-bold text-red-600">
                  {CURRENCY} {money(tour.fromPrice)} <span className="text-xs font-normal text-gray-600">per person</span>
                </p>

                <div className="relative mt-4">
                  <button
                    type="button"
                    onClick={() => setTravelersOpen((v) => !v)}
                    className="w-full flex items-center justify-between rounded-full bg-gray-100 px-4 py-2.5 text-xs font-semibold"
                    aria-expanded={travelersOpen}
                  >
                    {travelersLabel}
                    <svg className={`w-3 h-3 transition-transform ${travelersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {travelersOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 space-y-4">
                      {[
                        { label: 'Adult', sub: 'Age 13-99', v: adults, set: setAdults, min: 1 },
                        { label: 'Child', sub: 'Age 4-12', v: children, set: setChildren, min: 0 },
                        { label: 'Infant', sub: 'Age 3 and younger', v: infants, set: setInfants, min: 0 },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{r.label}</p>
                            <p className="text-[11px] text-gray-500">{r.sub}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" aria-label={`Remove ${r.label}`} onClick={() => r.set(Math.max(r.min, r.v - 1))} className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 disabled:opacity-30" disabled={r.v <= r.min}>−</button>
                            <span className="w-4 text-center text-sm">{r.v}</span>
                            <button type="button" aria-label={`Add ${r.label}`} onClick={() => r.set(Math.min(20, r.v + 1))} className="w-7 h-7 rounded-full border border-gray-300 text-gray-600">+</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setTravelersOpen(false)} className="w-full py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-bold">
                        Continue
                      </button>
                    </div>
                  )}
                </div>

                <label className="mt-3 flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-xs font-semibold">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" /></svg>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-xs font-semibold"
                  />
                </label>

                <button type="button" onClick={scrollToOptions} className="mt-4 w-full py-3 rounded-full bg-[var(--accent)] text-white text-sm font-bold hover:opacity-90 transition">
                  Check availability
                </button>

                <ul className="mt-5 space-y-3 text-xs text-gray-700">
                  <li className="flex gap-2.5">
                    <span className="text-green-600 shrink-0"><Icon name="cancel" /></span>
                    <span><b className="block text-gray-900">Free cancellation</b>Cancel up to 24 hours in advance for a full refund</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="text-green-600 shrink-0"><Icon name="cancel" /></span>
                    <span><b className="block text-gray-900">Reserve now &amp; pay later</b>Keep your travel plans flexible — book your spot and pay nothing today</span>
                  </li>
                </ul>
              </div>

              {activeOpt && (
                <div className="rounded-2xl border border-gray-200 p-4 text-sm flex items-center justify-between">
                  <span className="text-gray-600">Total for selected option</span>
                  <b>{CURRENCY} {money(totalFor(activeOpt))}</b>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* You might also like */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold mb-5">You might also like…</h2>
            <div className="relative">
              <div ref={carouselRef} className="flex gap-4 overflow-x-auto snap-x pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {related.map((p) => (
                  <Link
                    key={p._id}
                    href={p.slug ? `/tour-details/${p.slug}` : '#'}
                    className="snap-start shrink-0 w-[250px] group"
                  >
                    <div className="relative h-44 rounded-xl overflow-hidden bg-gray-200">
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageSrc(p.image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    {p.location && <p className="mt-3 text-[10px] text-gray-500">{p.location}</p>}
                    <h3 className="text-sm font-bold leading-snug line-clamp-2 mt-0.5">{p.title}</h3>
                    {p.duration && <p className="text-xs text-gray-500 mt-1">{p.duration}</p>}
                    <div className="flex items-center justify-between mt-2 text-xs">
                      {p.rating ? <span className="flex items-center gap-1"><b>{p.rating}</b> ★ {p.reviewCount ? `(${p.reviewCount})` : ''}</span> : <span />}
                      {p.price ? <span className="text-gray-500">From <b className="text-gray-900 text-sm">{CURRENCY} {p.price}</b></span> : null}
                    </div>
                  </Link>
                ))}
              </div>
              <button
                type="button"
                aria-label="Next"
                onClick={() => carouselRef.current?.scrollBy({ left: 270, behavior: 'smooth' })}
                className="hidden md:flex absolute right-0 top-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow items-center justify-center"
              >
                ›
              </button>
            </div>
          </section>
        )}

        {/* Customer reviews */}
        <section id="reviews" className="mt-14 scroll-mt-28">
          <h2 className="text-xl font-bold mb-6">Customer reviews</h2>
          <div className="grid md:grid-cols-[240px_1fr] gap-8">
            <div>
              <p className="text-sm font-semibold">Overall rating</p>
              <p className="mt-2 text-4xl font-bold">{tour.rating}<span className="text-lg text-gray-500">/5</span></p>
              <div className="mt-2"><Stars value={tour.rating} size={26} /></div>
              <p className="text-xs text-gray-500 mt-2">Based on {tour.reviewCount} reviews</p>

              <p className="text-sm font-semibold mt-6 mb-3">Review summary</p>
              <div className="space-y-3">
                {tour.ratingBreakdown.map((r) => (
                  <div key={r.label} className="flex items-center gap-3 text-xs">
                    <span className="w-24 shrink-0">{r.label}</span>
                    <span className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <span className="block h-full bg-[#1f2a44]" style={{ width: `${(r.value / 5) * 100}%` }} />
                    </span>
                    <b>{r.value}/5</b>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {visibleReviews.map((r) => (
                <article key={r.name + r.date} className="border-b border-gray-200 py-5 first:pt-0">
                  <Stars value={r.rating} size={14} />
                  <div className="flex items-center gap-3 mt-3">
                    <span className="w-9 h-9 rounded-full bg-[var(--accent)] text-white font-bold flex items-center justify-center">{r.name[0]}</span>
                    <div>
                      <p className="text-sm font-semibold">{r.name} – {r.country}</p>
                      <p className="text-xs text-gray-500">{r.date} · Verified booking</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed">{r.text}</p>
                </article>
              ))}
              {tour.reviews.length > 2 && (
                <div className="text-center mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((v) => !v)}
                    className="px-8 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-bold hover:opacity-90"
                  >
                    {showAllReviews ? 'Show fewer reviews' : 'See more reviews'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-500">From</p>
          <p className="font-bold text-red-600">{CURRENCY} {money(tour.fromPrice)}</p>
        </div>
        <button type="button" onClick={scrollToOptions} className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-bold">
          Check availability
        </button>
      </div>

      {/* Lightbox */}
      {lightbox !== null && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button type="button" aria-label="Close" className="absolute top-4 right-5 text-white text-3xl" onClick={() => setLightbox(null)}>×</button>
          <button
            type="button"
            aria-label="Previous photo"
            className="absolute left-4 text-white text-4xl"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}
          >‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[lightbox]} alt="" className="max-h-[85vh] max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            aria-label="Next photo"
            className="absolute right-4 text-white text-4xl"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}
          >›</button>
        </div>
      )}

      {showToast && <span className="sr-only" role="status">Added to cart</span>}
    </main>
  );
}