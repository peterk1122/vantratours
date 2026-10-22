'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface OfferItem {
  _id?: string;
  image: string;
  link: string;
  alt: string;
  order: number;
}

interface OffersData {
  heading: string;
  subheading: string;
  offers: OfferItem[];
}

// 3 offers on desktop, 2 on tablets, 1 on phones
const getPerView = () => {
  if (typeof window === 'undefined') return 3;
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
};

const OffersSlider: React.FC = () => {
  const [data, setData] = useState<OffersData | null>(null);
  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch('/api/offers', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch offers', error);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    const update = () => setPerView(getPerView());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const offers = (data?.offers || [])
    .filter((o) => o.image)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const pageCount = Math.max(1, Math.ceil(offers.length / perView));
  const currentPage = Math.min(page, pageCount - 1);
  // The last page is pulled back so it never shows empty space
  const offset = Math.min(currentPage * perView, Math.max(0, offers.length - perView));

  // Slides on its own every 5 seconds; stops while the mouse is over it
  useEffect(() => {
    if (pageCount <= 1 || paused) return;
    const timer = setInterval(() => {
      setPage((p) => (Math.min(p, pageCount - 1) + 1) % pageCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [pageCount, paused]);

  if (!data || offers.length === 0) return null;

  const renderOffer = (offer: OfferItem) => {
    const card = (
      <div className="relative aspect-[19/10] rounded-2xl overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={offer.image}
          alt={offer.alt || 'Offer'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
    );

    if (!offer.link) return card;

    if (/^https?:\/\//i.test(offer.link)) {
      return (
        <a
          href={offer.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-95 transition-opacity"
        >
          {card}
        </a>
      );
    }

    if (offer.link.startsWith('/')) {
      return (
        <Link href={offer.link} className="block hover:opacity-95 transition-opacity">
          {card}
        </Link>
      );
    }

    return (
      <a href={offer.link} className="block hover:opacity-95 transition-opacity">
        {card}
      </a>
    );
  };

  return (
    <section className="w-full py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {data.heading && (
          <h2 className="text-3xl md:text-[40px] font-bold text-center text-[#181E4B]">
            {data.heading}
          </h2>
        )}
        {data.subheading && (
          <p className="text-center text-gray-600 max-w-xl mx-auto mt-3">{data.subheading}</p>
        )}

        <div
          className="mt-8 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${offset * (100 / perView)}%)` }}
          >
            {offers.map((offer, i) => (
              <div
                key={offer._id || i}
                className="flex-none px-2"
                style={{ width: `${100 / perView}%` }}
              >
                {renderOffer(offer)}
              </div>
            ))}
          </div>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to offers page ${i + 1}`}
                onClick={() => setPage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentPage ? 'w-6 bg-[#F85E46]' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OffersSlider;
