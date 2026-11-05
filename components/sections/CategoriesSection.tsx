'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { API_BASE, imgUrl } from '@/lib/api';

interface Category {
  _id?: string;
  slug?: string;
  name: string;
  image: string;
}

const CategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setCategories(d.data);
      })
      .catch((e) => console.error('Error fetching categories:', e));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 pt-6 pb-10">
      <h2 className="text-xl font-bold text-[#1B2A41] mb-4">Things to do wherever you&apos;re going</h2>
      <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none]">
        {categories.map((c) => (
          <Link
            key={c._id || c.slug}
            href={`/${c.slug || c._id}`}
            className="shrink-0 w-[150px] md:w-[calc((100%-100px)/6)]"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
              {c.image && <Image src={imgUrl(c.image)} alt={c.name} fill unoptimized className="object-cover" />}
            </div>
            <p className="mt-2 text-[15px] font-medium text-[#1B2A41] line-clamp-1">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
