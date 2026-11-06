'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { API_BASE, imgUrl } from '@/lib/api';

interface Item {
  _id?: string;
  image?: string;
  title: string;
  description: string;
}

const GAP = 20;

const WhyBookSection: React.FC = () => {
  const [heading, setHeading] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/why-book`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setHeading(d.data.heading || '');
          setItems(Array.isArray(d.data.items) ? d.data.items : []);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  if (items.length === 0) return null;

  const needsArrows = items.length > 3;

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el || !el.firstElementChild) return;
    const step = (el.firstElementChild as HTMLElement).offsetWidth + GAP;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 pb-14">
      {heading && <h2 className="text-xl font-bold text-[#1B2A41] mb-4">{heading}</h2>}
      <div className="relative">
        <div
          ref={ref}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] items-stretch"
        >
          {items.map((item, i) => (
            <div
              key={item._id || i}
              className="snap-start shrink-0 w-full md:w-[calc((100%-40px)/3)] border border-[#E3E8EC] rounded-lg p-6 text-center bg-white"
            >
              {item.image && (
                <div className="relative w-20 h-20 mx-auto">
                  <Image src={imgUrl(item.image)} alt={item.title} fill unoptimized className="object-contain" />
                </div>
              )}
              <h3 className="mt-4 font-semibold text-[#1B2A41]">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>

        {needsArrows && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scroll(-1)}
              className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-green-500 text-green-600 flex items-center justify-center shadow"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => scroll(1)}
              className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-green-500 text-green-600 flex items-center justify-center shadow"
            >
              ›
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default WhyBookSection;
