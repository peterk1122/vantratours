'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { API_BASE, imgUrl } from '@/lib/api';

const HeroSection: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const t = setTimeout(async () => {
      setIsLoading(true);
      setShowDropdown(true);
      try {
        const res = await fetch(`${API_BASE}/api/packages?search=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) setResults(json.data.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const go = (pkg: any) => {
    if (!pkg?.slug) return;
    router.push(`/tour-details/${pkg.slug}`);
    setShowDropdown(false);
  };

  return (
    <section className="relative bg-gradient-to-b from-[#BBD9F7] to-white pt-32 md:pt-40 pb-24 md:pb-36">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1B2A41]">Experiences worth traveling for</h1>

        <div className="relative max-w-3xl mx-auto mt-8 md:mt-10">
          <div className="bg-white rounded-full p-2 flex items-center shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
            <input
              type="text"
              placeholder="Find places and things to do"
              className="flex-1 min-w-0 px-4 md:px-6 py-2 md:py-3 bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0])}
            />
            <button
              type="button"
              onClick={() => results[0] && go(results[0])}
              className="bg-[#BF9B30] hover:bg-[#a98625] text-white font-semibold text-lg px-6 md:px-9 py-2.5 md:py-3 rounded-full transition-colors"
            >
              Search
            </button>
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden z-40 max-h-[400px] overflow-y-auto text-left">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : results.length > 0 ? (
                results.map((pkg) => (
                  <div
                    key={pkg._id}
                    onMouseDown={(e) => { e.preventDefault(); go(pkg); }}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0 bg-gray-200">
                      {pkg.image && <Image src={imgUrl(pkg.image)} alt={pkg.title} fill unoptimized className="object-cover" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1B2A41] line-clamp-1">{pkg.title}</h4>
                      <p className="text-xs text-gray-500">
                        {pkg.location}{pkg.price ? ` • ${pkg.price} AED` : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
