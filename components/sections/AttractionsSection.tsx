'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { API_BASE, imgUrl } from '@/lib/api';

interface Group {
  key: string;
  name: string;
  image: string;
  count: number;
  href: string;
}

// Built from the dashboard's packages: one tile per subcategory (or category if none),
// with the activity count and the first package's image.
const AttractionsSection: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/packages`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const map = new Map<string, Group>();
        for (const p of d.data) {
          const g = p.subcategory?._id ? p.subcategory : p.category;
          if (!g?._id) continue;
          const found = map.get(g._id);
          if (found) found.count += 1;
          else
            map.set(g._id, {
              key: g._id,
              name: g.name,
              image: p.image,
              count: 1,
              href: `/${p.category?.slug || p.category?._id || ''}`,
            });
        }
        setGroups(Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8));
      })
      .catch((e) => console.error(e));
  }, []);

  if (groups.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[#1B2A41] mb-4">Attractions you can&apos;t miss</h2>
      <div className="relative">
        <div ref={ref} className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none]">
          {groups.map((g) => (
            <Link key={g.key} href={g.href} className="shrink-0 w-[240px] md:w-[calc((100%-60px)/4)]">
              <div className="relative h-40 rounded-lg overflow-hidden bg-gray-200">
                {g.image && <Image src={imgUrl(g.image)} alt={g.name} fill unoptimized className="object-cover" />}
                <span className="absolute top-0 left-0 bg-[#BF9B30] text-white text-xs font-medium px-2 py-1">Featured</span>
              </div>
              <p className="mt-2 font-semibold text-[#1B2A41] line-clamp-1">{g.name}</p>
              <p className="text-sm text-gray-500">{g.count} {g.count === 1 ? 'activity' : 'activities'}</p>
            </Link>
          ))}
        </div>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => ref.current?.scrollBy({ left: 300, behavior: 'smooth' })}
          className="hidden md:flex absolute right-[-14px] top-16 w-9 h-9 rounded-full bg-white border border-green-500 text-green-600 items-center justify-center shadow"
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default AttractionsSection;
