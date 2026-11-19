'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

export default function ManageSections() {
  const [sections, setSections] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [heading, setHeading] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, p] = await Promise.all([
      fetch(`${API_BASE}/api/sections`).then((r) => r.json()),
      fetch(`${API_BASE}/api/packages`).then((r) => r.json()),
    ]);
    if (s.success) setSections(s.data);
    if (p.success) setPackages(p.data);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => packages.filter((p) => p.title?.toLowerCase().includes(search.toLowerCase())),
    [packages, search]
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const reset = () => {
    setHeading('');
    setSelected([]);
    setEditingId(null);
  };

  const save = async () => {
    if (!heading.trim()) return alert('Enter Heading');
    if (selected.length === 0) return alert('Select Minimum 1 Tour');
    setSaving(true);
    const url = editingId ? `${API_BASE}/api/sections/${editingId}` : `${API_BASE}/api/sections`;
    await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heading, packages: selected }),
    });
    setSaving(false);
    reset();
    load();
  };

  const edit = (s: any) => {
    setEditingId(s._id);
    setHeading(s.heading);
    setSelected(s.packages.map((p: any) => p._id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete This Section?')) return;
    await fetch(`${API_BASE}/api/sections/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (s: any) => {
    await fetch(`${API_BASE}/api/sections/${s._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#181E4B]">Home Page Sections</h1>
          <Link href="/dashboard" className="text-sm text-[#F85E46] hover:underline">← Back</Link>
        </div>

        {/* Create / Edit */}
        <div className="bg-white p-8 rounded-xl shadow-md space-y-4">
          <h2 className="text-xl font-bold">{editingId ? 'Edit Section' : 'Create Section'}</h2>

          <input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Section heading e.g. Attractions you can't miss"
            className="w-full border rounded-md px-3 py-2"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Tour..."
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
            {filtered.map((p) => (
              <label key={p._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggle(p._id)} />
                <span className="text-sm">{p.title}</span>
              </label>
            ))}
            {filtered.length === 0 && <p className="p-4 text-sm text-gray-500">No tours found.</p>}
          </div>

          <p className="text-sm text-gray-500">{selected.length} tour(s) selected</p>

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#F85E46] text-white px-5 py-2 rounded-lg hover:bg-[#e54d36] disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Section' : 'Create Section'}
            </button>
            {editingId && (
              <button onClick={reset} className="px-5 py-2 rounded-lg border">Cancel</button>
            )}
          </div>
        </div>

        {/* Existing sections */}
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-3">Existing Sections</h2>
          {sections.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No Section Yet.</p>
          ) : (
            <div className="space-y-4">
              {sections.map((s) => (
                <div key={s._id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#181E4B]">{s.heading}</p>
                    <p className="text-sm text-gray-500">
                      {s.packages.length} tours: {s.packages.map((p: any) => p.title).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(s)}
                      className={`text-xs px-3 py-1 rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {s.isActive ? 'Visible' : 'Hidden'}
                    </button>
                    <button onClick={() => edit(s)} className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-800">Edit</button>
                    <button onClick={() => remove(s._id)} className="text-xs px-3 py-1 rounded bg-red-100 text-red-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}