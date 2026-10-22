'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface TourGalleryProps {
  images?: string[];
  alts?: string[];
}

const defaultImages = [
  'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=900&q=80',
  'https://images.unsplash.com/photo-1544551763-46a42a457118?w=600&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
];

const TourGallery: React.FC<TourGalleryProps> = ({ images, alts = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayImages = images && images.length > 0 ? images : defaultImages;

  // Repeats images if the package has fewer than 5, same as the old gallery
  const getImg = (index: number) => displayImages[index % displayImages.length];
  const getAlt = (index: number) => alts[index % displayImages.length] || `Gallery image ${index + 1}`;

  // Close on Escape and stop the page behind from scrolling while the popup is open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const open = () => setIsOpen(true);

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[260px] sm:h-[340px] lg:h-[420px]">
        {/* Large image */}
        <div
          className="relative col-span-4 row-span-2 sm:col-span-2 rounded-xl overflow-hidden cursor-pointer"
          onClick={open}
        >
          <Image
            src={getImg(0)}
            alt={getAlt(0)}
            fill
            priority
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
          {/* Mobile only: the small images are hidden, so the button sits here */}
          <button
            type="button"
            onClick={open}
            className="sm:hidden absolute top-3 right-3 bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow"
          >
            View all images
          </button>
        </div>

        {/* Four small images */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative hidden sm:block rounded-xl overflow-hidden cursor-pointer"
            onClick={open}
          >
            <Image
              src={getImg(i)}
              alt={getAlt(i)}
              fill
              sizes="25vw"
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
            {i === 2 && (
              <button
                type="button"
                onClick={open}
                className="absolute top-3 right-3 bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow hover:bg-gray-100"
              >
                View all images
              </button>
            )}
          </div>
        ))}
      </div>

      {/* All images popup */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={() => setIsOpen(false)}
            className="fixed top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white text-gray-800 text-xl leading-none flex items-center justify-center shadow"
          >
            ✕
          </button>
          <div
            className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {displayImages.map((img, idx) => (
              <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src={img}
                  alt={getAlt(idx)}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default TourGallery;
