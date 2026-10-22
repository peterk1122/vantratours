'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import RecentGallery from '@/components/sections/RecentGallery';
import ReviewsSection from '@/components/sections/ReviewsSection';

import { useParams, useRouter } from 'next/navigation';
import BookingModal from '../../../tour-details/components/BookingModal';
import CalendarWidget from '../../../tour-details/components/CalendarWidget';
import FeatureCard from '../../../tour-details/components/FeatureCard';
import TourOptionCard from '../../../tour-details/components/TourOptionCard';
import { useCart } from '@/context/CartContext';

export default function CityTourPage() {
  const params = useParams();
  const productSlug = params?.productSlug as string;
  
  
  const [showOptions, setShowOptions] = useState(false);
  const [packageData, setPackageData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  const defaultData = {
    title: 'City Tour',
    gallery: [],
    description: "Discover Moscow Onboard The Mercedes Van Or Our Classic Soviet Van...",
    highlights: `<ul>
        <li>Water, beers and champagne onboard</li>
        <li>7 stops at Moscow's key sights</li>
        <li>A peaceful morning or a dazzling evening tour</li>
        <li>The best tour to explore Moscow in a fun way!</li>
    </ul>`,
    includes: `<ul>
        <li>Transfer onboard our classic Soviet Van</li>
        <li>Knowledgeable and fun English or Arabic speaking guide</li>
        <li>Teleferic (Cable car) across the Moscow river</li>
    </ul>`,
    features: [
        { icon: '🎭', title: 'Experience Duration:', description: '1 to 4 hours' },
        { icon: '🚗', title: 'Transportation:', description: 'With Pickup and Drop-off' },
        { icon: '💰', title: 'Price Range:', description: 'Moderate Pricing' }
    ],
    tourOptions: [
        { 
          title: 'City Tour (Group)', 
          duration: '4 Hours', 
          active: true,
          adultPrice: 253.50,
          childPrice: 177.45,
          infantPrice: 0,
          features: []
        }
    ]
  };

  useEffect(() => {
    if (productSlug) {
        const fetchPackage = async () => {
            try {
                const res = await fetch(`https://desertsmarttourism.com/api/packages?slug=${productSlug}`);
                const json = await res.json();
                if (json.success && json.data && json.data.length > 0) {
                     setPackageData(json.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch package", err);
            }
        };
        fetchPackage();
    }
  }, [productSlug]);

  const activeData = packageData || defaultData;
  const isDynamic = !!packageData;

  const optionsRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (showOptions && optionsRef.current) {
      optionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showOptions, selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowOptions(true);
  };

  const { addToCart } = useCart();
  const router = useRouter();

  const handleBookNow = (option: any, guestDetails: any) => {
    const itemToAdd = {
      title: activeData.title,
      packageId: activeData._id || '000000000000000000000000',
      slug: productSlug || 'custom-package',
      image: activeData.image,
      optionTitle: option.title,
      date: selectedDate || new Date(),
      pricingType: option.pricingType || 'person',
      
      guests: guestDetails.guests || 0,
      items: guestDetails.items || 0,
      adults: guestDetails.adults || 0,
      children: guestDetails.children || 0,
      infants: guestDetails.infants || 0,
      
      timeSlot: guestDetails.timeSlot,
      pickupLocation: guestDetails.pickupLocation,
      transferType: guestDetails.transferType,
      extraServices: guestDetails.extraServices || [],
      
      totalPrice: Number(guestDetails.totalPrice)
    };

    addToCart(itemToAdd);

    if (guestDetails.action === 'book_now') {
      router.push('/cart');
    } else {
      alert('Added to cart successfully!');
    }
  };

  const tourOptions = isDynamic && activeData.tourOptions.length > 0 ? activeData.tourOptions : [
    {
      title: 'City Tour (Group)',
      duration: activeData.duration || '4 Hours',
      features: [
        { icon: 'car', label: 'Pickup Included' },
        { icon: 'bus', label: 'Drop Off Included' },
        { icon: 'guide', label: 'Tour Guide' },
      ],
      penalty: 'Less Than 1 Days Before Start Of The Experience: 100% Penalty',
      timeSlots: [],
      pricePerPerson: activeData.price || 253.50,
      adultPrice: activeData.price || 253.50,
      childPrice: (activeData.price ? activeData.price * 0.7 : 177.45),
      infantPrice: 0,
      currency: 'AED',
    },
    {
      title: 'Extended City Tour',
      duration: '6 Hours',
      features: [
        { icon: 'car', label: 'Private Transport' },
        { icon: 'guide', label: 'Best Tour Guide' },
      ],
      penalty: 'Less Than 2 Days Before Start Of The Experience: 50% Penalty',
      timeSlots: [],
      pricePerPerson: (activeData.price ? activeData.price * 1.5 : 450.00),
      adultPrice: (activeData.price ? activeData.price * 1.5 : 450.00),
      childPrice: 350.00,
      infantPrice: 0,
      currency: 'AED',
    },
    {
      title: 'City Tour Premium',
      duration: '8 Hours',
      features: [
        { icon: 'car', label: 'Luxury Transport' },
        { icon: 'bus', label: 'Drop Off Included' },
        { icon: 'guide', label: 'Private Guide' },
      ],
      penalty: 'Less Than 3 Days Before Start Of The Experience: 25% Penalty',
      timeSlots: [],
      pricePerPerson: (activeData.price ? activeData.price * 2 : 600.00),
      adultPrice: (activeData.price ? activeData.price * 2 : 600.00),
      childPrice: 450.00,
      infantPrice: 0,
      currency: 'AED',
    },
  ];

  const features = activeData.features && activeData.features.length > 0 ? activeData.features : [
    { icon: '🎭', title: 'Experience Duration:', description: activeData.duration || '1 to 4 hours' },
    { icon: '🚗', title: 'Transportation:', description: 'With Pickup and Drop-off' },
    { icon: '💬', title: 'Available Languages:', description: 'English, Spanish, French, German, Chinese, Arabic' },
    { icon: '💰', title: 'Price Range:', description: 'Moderate Pricing, Premium Experiences' },
    { icon: '🎉', title: 'Great For:', description: 'Birthdays, Anniversaries, Family Outings, Corporate Events, Retirement' },
    { icon: '⏰', title: 'Best Time to Visit:', description: 'Morning, Afternoon, Evening and night' },
    { icon: '👫', title: 'Perfect For:', description: 'Couples, Families, Friends, Seniors, Employee Teams, Him, Her' },
  ];

  const getHtmlContent = (content: any) => {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) return content.map(item => `<li>${item}</li>`).join('');
      return '';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section
        className="relative h-[30vh] min-h-[340px] w-full bg-cover bg-center flex flex-col justify-center items-center"
        style={{
          backgroundImage: `url('${activeData.image || '/images/travel-with-us.svg'}')`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3 opacity-90">
            Tour Details
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-serif italic font-normal">
            {activeData.title}
          </h1>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10">
        
           <RecentGallery images={activeData.gallery} alts={activeData.galleryAlts} />

          <div className="flex flex-col lg:flex-row gap-8 md:mt-8">
            <div className="w-full lg:w-[70%]">
              
              {showOptions && (
                 <h2 ref={optionsRef} className="text-3xl md:text-[40px] font-bold text-center text-[#183B56] mb-8 md:mb-12 font-serif">
                    Choose your option
                 </h2>
              )}

              <div className="lg:hidden mb-8">
                 <CalendarWidget 
                    pricePerPerson={activeData.price} 
                    onDateSelect={handleDateSelect} 
                 />
              </div>

              {showOptions && (
                <>
                  {tourOptions.map((option: any, index: number) => (
                    <TourOptionCard
                      key={index}
                      {...option}
                      isExpanded={index === 0}
                      selectedDate={selectedDate || undefined}
                      onBookNow={(details) => handleBookNow(option, details)}
                    />
                  ))}
                </>
              )}

              <section className="mt-16">
                <h2 className="text-xl md:text-2xl font-bold text-[#1E3A5F] mb-4">
                  About This Activity
                </h2>
                <p className="text-base md:text-[20px] text-[#000000] leading-relaxed mb-8">
                  {activeData.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature: any, index: number) => (
                    <FeatureCard
                      key={index}
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                    />
                  ))}
                </div>
              </section>

              <hr className="mt-14 border-t border-[#000000]" />

            {activeData.itinerary && (
              <section className="mt-8">
                <h3 className="text-xl md:text-2xl font-bold text-[#1E3A5F] mb-4">Itinerary</h3>
                {Array.isArray(activeData.itinerary) && activeData.itinerary.length > 0 ? (
                  <div className="space-y-6">
                    {activeData.itinerary.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                           <div className="w-10 h-10 rounded-full bg-[#F85E46] text-white flex items-center justify-center font-bold text-sm shrink-0">
                             {item.day || idx + 1}
                           </div>
                           {idx < activeData.itinerary.length - 1 && (
                             <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                           )}
                        </div>
                        
                        <div className="pb-6 w-full">
                           <h4 className="text-[18px] md:text-[20px] font-bold text-[#181E4B] mb-2 break-words">{item.title}</h4>
                           <p className="text-[16px] md:text-[18px] text-[#000000] leading-relaxed whitespace-pre-line break-words">
                             {item.description}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="text-[16px] md:text-[20px] text-[#000000] space-y-2 [&>ul]:list-disc [&>ul]:list-inside break-words"
                    dangerouslySetInnerHTML={{ __html: getHtmlContent(activeData.itinerary) }}
                  />
                )}
                <hr className="mt-8 border-t border-[#000000]" />
              </section>
            )}

            <section className="mt-8">
              <h3 className="text-xl md:text-2xl font-bold text-[#1E3A5F] mb-4">Highlights</h3>
              <div 
                className="text-base md:text-[20px] text-[#000000] space-y-2 [&>ul]:list-disc [&>ul]:list-inside break-words"
                dangerouslySetInnerHTML={{ __html: getHtmlContent(activeData.highlights) }}
              />
            </section>

            <hr className="mt-10 border-t border-[#000000]" />

            <section className="mt-8">
              <h3 className="text-xl md:text-2xl font-bold text-[#1E3A5F] mb-4">Includes</h3>
              <div 
                className="text-base md:text-[20px] text-[#000000] space-y-2 [&>ul]:list-disc [&>ul]:list-inside break-words"
                dangerouslySetInnerHTML={{ __html: getHtmlContent(activeData.includes) }}
              />
            </section>

              <hr className="mt-10 border-t border-[#000000]" />

              <section className="mt-8 mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-[#1E3A5F] mb-4">Details</h3>
                <p className="text-base md:text-[20px] text-[#000000] leading-relaxed break-words">
                   {activeData.description}
                </p>
              </section>

              {isDynamic && activeData._id && (
                  <>
                    <hr className="mt-10 border-t border-[#000000]" />
                    <ReviewsSection packageId={activeData._id} />
                  </>
              )}
            </div>

            <div className="w-full lg:w-[30%] hidden lg:block">
              <CalendarWidget 
                pricePerPerson={activeData.price} 
                onDateSelect={handleDateSelect} 
              />
              
              <div className="relative hidden md:block h-72 mt-4">
                <Image
                  src={activeData.image?.startsWith('/api/') ? `https://desertsmarttourism.com${activeData.image}` : (activeData.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800")}
                  alt={activeData.imageAlt || activeData.title || 'Travel decoration'}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
      </main>

      <Footer />
      
      {bookingDetails && (
        <BookingModal 
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          bookingDetails={bookingDetails}
        />
      )}
    </div>
  );
}
