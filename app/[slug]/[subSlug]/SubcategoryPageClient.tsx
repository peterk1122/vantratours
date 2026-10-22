'use client';

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TourPackageCard from "../../travel-with-us/components/TourPackageCard";
import SortBar, { SortOption } from "../../travel-with-us/components/SortBar";
import Pagination from "../../travel-with-us/components/Pagination";
import SubcategoryCapsules from "@/components/sections/SubcategoryCapsules";

interface SubcategoryPageClientProps {
  categorySlug: string;
  subSlug: string;
  initialCategory: any;
  initialSubcategory: any;
}

export default function SubcategoryPageClient({
  categorySlug,
  subSlug,
  initialCategory,
  initialSubcategory,
}: SubcategoryPageClientProps) {
  const [packages, setPackages] = useState<any[]>([]);
  const [childSubcategories, setChildSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('date');

  const headerTitle = initialSubcategory?.name || 'Explore Tours';
  const headerImage = initialSubcategory?.image || initialCategory?.image || '/images/travel-with-us.svg';
  const subcategoryId = initialSubcategory?._id;

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        if (!subcategoryId) return;
        const packagesData = await fetch(`https://desertsmarttourism.com/api/packages?subcategory=${subcategoryId}`).then(res => res.json());
        if (packagesData.success) {
          setPackages(packagesData.data.map((pkg: any) => ({
            id: pkg._id,
            image: pkg.image,
            imageAlt: pkg.imageAlt,
            date: pkg.duration,
            reviews: pkg.peopleGoing,
            city: pkg.title,
            description: pkg.description,
            price: pkg.price,
            rating: pkg.rating,
            slug: pkg.slug,
            title: pkg.title,
            categorySlug: categorySlug,
            subcategorySlug: subSlug,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch subcategory packages', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [subcategoryId, categorySlug, subSlug]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        if (!subcategoryId) return;
        const res = await fetch(`https://desertsmarttourism.com/api/subcategories?category=${categorySlug}&parent=${subcategoryId}`);
        const json = await res.json();
        if (json.success) setChildSubcategories(json.data);
      } catch (error) {
        console.error('Failed to fetch nested subcategories', error);
      }
    };
    fetchChildren();
  }, [subcategoryId, categorySlug]);

  const filteredPackages = packages;

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Header />

      <section
        className="relative h-[35vh] min-h-[400px] w-full bg-cover bg-center flex flex-col justify-center items-center"
        style={{
          backgroundImage: `url('${headerImage}')`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative z-10 text-center text-white px-4 w-full">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3 opacity-90">
            Search Tour
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif italic font-normal">
            {headerTitle}
          </h1>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 -mt-5 relative z-20">
        {childSubcategories.length > 0 && (
          <div className="bg-white px-6 lg:px-8 pt-5 pb-3 shadow-[0px_4px_48px_12px_#00000017]">
            <SubcategoryCapsules subcategories={childSubcategories} basePath={`/${categorySlug}/${subSlug}`} />
          </div>
        )}
        <SortBar activeSort={sortOption} onSortChange={setSortOption} />
      </div>

      <main className="max-w-6xl mx-auto px-4 mb-16">
        <div className="bg-[#FFFFFF] shadow-[0px_4px_48px_12px_#00000017] p-6 lg:p-8">
          <section className="w-full">
            {loading ? (
              <div className="text-center py-10">Loading packages...</div>
            ) : filteredPackages.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...filteredPackages].sort((a, b) => {
                    if (sortOption === 'price-low') {
                      return a.price - b.price;
                    } else if (sortOption === 'price-high') {
                      return b.price - a.price;
                    } else if (sortOption === 'name') {
                      return a.city.localeCompare(b.city);
                    } else {
                      return 0;
                    }
                  }).map((pkg, index) => (
                    <TourPackageCard
                      key={pkg.id}
                      data={pkg}
                      isHighlighted={index === 0}
                    />
                  ))}
                </div>
                <Pagination totalPages={1} />
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">No packages found for {headerTitle}.</div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
