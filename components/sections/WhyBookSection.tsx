import React from 'react';

const items = [
  {
    title: 'Experiences worth traveling for',
    text: 'Discover iconic sights and experience places the way locals do.',
    path: 'M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z',
  },
  {
    title: 'Book with confidence',
    text: 'Trusted reviews, quality tours, and all the details you need to decide.',
    path: 'M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9L12 3z',
  },
  {
    title: 'Plans change and that’s ok',
    text: 'Breathe easy with free cancellations on most activities, the option to pay later, and 24/7 support.',
    path: 'M4 12a8 8 0 0113.7-5.7L20 8M20 4v4h-4M20 12a8 8 0 01-13.7 5.7L4 16M4 20v-4h4',
  },
];

const WhyBookSection: React.FC = () => (
  <section className="max-w-6xl mx-auto px-4 py-8 pb-14">
    <h2 className="text-xl font-bold text-[#1B2A41] mb-4">Why book with us?</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {items.map((i) => (
        <div key={i.title} className="border border-[#E3E8EC] rounded-lg p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#EEF4FB] text-[#1B2A41] flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={i.path} />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-[#1B2A41]">{i.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{i.text}</p>
        </div>
      ))}
    </div>
  </section>
);

export default WhyBookSection;
