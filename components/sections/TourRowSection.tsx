'use client';

import React, { useEffect, useRef, useState } from 'react';
import TourCard from '@/components/cards/TourCard';
import { API_BASE } from '@/lib/api';

interface Props {
  title: string;
  section: 'guidebook' | 'adventures';
}

// Shows the packages ticked for this row in the dashboard.
const TourRowSection: React.FC<Props> = ({ title, section }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/packages?section=${section}`)
      .then((r) => r.json())
      .then((d) => d.success && setPackages(d.data))
      .catch((e) => console.error(e));
  }, [section]);

  if (packages.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[#1B2A41] mb-4">{title}</h2>
      <div className="relative">
        <div ref={ref} className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] items-stretch">
          {packages.map((p) => (
            <div key={p._id} className="shrink-0 w-[260px] md:w-[calc((100%-60px)/4)]">
              <TourCard
                slug={p.slug}
                image={p.image}
                imageAlt={p.imageAlt}
                title={p.title}
                location={p.location}
                duration={p.duration}
                rating={p.rating}
                price={p.price}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => ref.current?.scrollBy({ left: 300, behavior: 'smooth' })}
          className="hidden md:flex absolute right-[-14px] top-40 w-9 h-9 rounded-full bg-white border border-green-500 text-green-600 items-center justify-center shadow"
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default TourRowSection;
