import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl } from '@/lib/api';

interface TourCardProps {
  slug?: string;
  image: string;
  imageAlt?: string;
  title: string;
  location?: string;
  duration?: string;
  rating?: number;
  price: number | string;
}

const TourCard: React.FC<TourCardProps> = ({ slug, image, imageAlt, title, location, duration, rating, price }) => {
  const src = imgUrl(image);
  const card = (
    <article className="h-full flex flex-col bg-white border border-[#E3E8EC] rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-gray-200 shrink-0">
        {src && <Image src={src} alt={imageAlt || title} fill unoptimized className="object-cover" />}
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-[#1B2A41]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.3 6.3a5 5 0 017.1 0L12 7l.6-.7a5 5 0 117.1 7.1L12 21l-7.7-7.6a5 5 0 010-7.1z" />
          </svg>
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        {location && <p className="text-[11px] font-medium text-gray-500 line-clamp-1">{location}</p>}
        <h3 className="mt-1 text-[17px] font-semibold leading-snug text-[#1B2A41] line-clamp-3">{title}</h3>
        {duration && <p className="mt-1 text-sm text-gray-500">{duration}</p>}
        <div className="mt-auto pt-4 flex items-end justify-between text-sm">
          <span className="font-semibold text-[#1B2A41]">
            {(rating ?? 0) > 0 ? <>{Number(rating).toFixed(1)} <span className="text-[#BF9B30]">★</span></> : null}
          </span>
          <span className="text-gray-500">
            From <span className="font-semibold text-[#1B2A41] text-base">{price} AED</span>
          </span>
        </div>
      </div>
    </article>
  );

  return slug ? (
    <Link href={`/tour-details/${slug}`} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
};

export default TourCard;
