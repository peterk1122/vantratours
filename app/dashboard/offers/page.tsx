'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface OfferItem {
  _id?: string;
  image: string;
  link: string;
  alt: string;
  order: number;
}

export default function OffersDashboardPage() {
  const [heading, setHeading] = useState('Discounts & Offers');
  const [subheading, setSubheading] = useState('');
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const sortOffers = (list: OfferItem[]) =>
    list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/offers', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setHeading(json.data.heading ?? '');
        setSubheading(json.data.subheading ?? '');
        setOffers(sortOffers(json.data.offers || []));
      }
    } catch (error) {
      console.error('Failed to load offers', error);
      setMessage({ type: 'error', text: 'Failed to load offers' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('/api/offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, subheading, offers }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Offers saved successfully!' });
        setOffers(sortOffers(json.data.offers || []));
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save' });
      }
    } catch (error) {
      console.error('Failed to save offers', error);
      setMessage({ type: 'error', text: 'Failed to save offers' });
    } finally {
      setSaving(false);
    }
  };

  const addOffer = () => {
    setOffers((prev) => [...prev, { image: '', link: '', alt: '', order: prev.length }]);
  };

  const updateOffer = (index: number, field: 'image' | 'link' | 'alt', value: string) => {
    setOffers((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  };

  const deleteOffer = (index: number) => {
    if (!confirm('Delete this offer?')) return;
    setOffers((prev) => prev.filter((_, i) => i !== index).map((o, i) => ({ ...o, order: i })));
  };

  const moveOffer = (index: number, direction: 'up' | 'down') => {
    setOffers((prev) => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated.map((o, i) => ({ ...o, order: i }));
    });
  };

  const uploadImage = async (index: number, file: File) => {
    try {
      setUploadingIndex(index);
      setMessage(null);
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/offers/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (json.success) {
        updateOffer(index, 'image', json.url);
      } else {
        setMessage({ type: 'error', text: json.error || 'Upload failed' });
      }
    } catch (error) {
      console.error('Upload failed', error);
      setMessage({ type: 'error', text: 'Upload failed' });
    } finally {
      setUploadingIndex(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading offers...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Discounts & Offers Section</h1>
        <p className="text-gray-500 mt-1">
          This section appears on the home page right after the banner. Click Save Changes to
          publish.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Heading */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Heading</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Discounts & Offers"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
          <textarea
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            rows={2}
            placeholder="A curated list of the most popular travel packages..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Offers */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Offer Images</h2>
            <p className="text-xs text-gray-500 mt-1">
              Recommended size 1140 × 600 px (JPG, PNG or WebP, up to 5 MB). The section is hidden
              on the site until you add at least one image.
            </p>
          </div>
          <button
            onClick={addOffer}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shrink-0"
          >
            + Add Offer
          </button>
        </div>

        <div className="space-y-4">
          {offers.map((offer, index) => (
            <div key={offer._id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image preview and upload */}
                <div className="md:w-64 shrink-0">
                  <div className="aspect-[19/10] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    {offer.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={offer.image} alt="Offer preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">No image yet</span>
                    )}
                  </div>
                  <label className="mt-2 block">
                    <span className="sr-only">Upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingIndex === index}
                      onChange={async (e) => {
                        const input = e.target;
                        const file = input.files?.[0];
                        if (file) await uploadImage(index, file);
                        input.value = '';
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </label>
                  {uploadingIndex === index && (
                    <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                  )}
                </div>

                {/* Link and description */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Link (where the image goes when clicked)
                    </label>
                    <input
                      type="text"
                      value={offer.link}
                      onChange={(e) => updateOffer(index, 'link', e.target.value)}
                      placeholder="/tour-details/your-package or https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Image description (for Google and screen readers)
                    </label>
                    <input
                      type="text"
                      value={offer.alt}
                      onChange={(e) => updateOffer(index, 'alt', e.target.value)}
                      placeholder="e.g. 30% off desert safari"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex md:flex-col gap-2 md:items-end">
                  <button
                    onClick={() => moveOffer(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30"
                    title="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveOffer(index, 'down')}
                    disabled={index === offers.length - 1}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30"
                    title="Move later"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deleteOffer(index)}
                    className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {offers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No offers yet. Click &quot;Add Offer&quot; to upload your first image.
            </p>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || uploadingIndex !== null}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
