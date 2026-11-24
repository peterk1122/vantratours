'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

export default function ManageSections() {
  const [sections, setSections] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [heading, setHeading] = useState('');
  const [position, setPosition] = useState(''); // khali = sabse aakhir mein
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
    setPosition('');
    setSelected([]);
    setEditingId(null);
  };

  // ids ki list ke hisaab se order = 0,1,2... save karta hai
  const saveOrder = async (ids: string[]) => {
    await Promise.all(
      ids.map((id, i) =>
        fetch(`${API_BASE}/api/sections/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i }),
        })
      )
    );
  };

  const save = async () => {
    if (!heading.trim()) return alert('Enter Heading');
    if (selected.length === 0) return alert('Select Minimum 1 Tour');
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/api/sections/${editingId}` : `${API_BASE}/api/sections`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, packages: selected }),
      });
      const json = await res.json();
      const savedId: string | undefined = editingId || json?.data?._id;

      if (savedId) {
        // baaki sections (already order ke hisaab se sorted aate hain)
        const others = sections.filter((s) => s._id !== savedId).map((s) => s._id);
        const wanted = parseInt(position, 10);
        const pos = Number.isNaN(wanted)
          ? others.length + 1
          : Math.min(Math.max(wanted, 1), others.length + 1);
        others.splice(pos - 1, 0, savedId);
        await saveOrder(others);
      }
    } catch (e) {
      console.error(e);
      alert('Save failed');
    }
    setSaving(false);
    reset();
    load();
  };

  const edit = (s: any, index: number) => {
    setEditingId(s._id);
    setHeading(s.heading);
    setPosition(String(index + 1));
    setSelected(s.packages.map((p: any) => p._id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete This Section?')) return;
    await fetch(`${API_BASE}/api/sections/${id}`, { method: 'DELETE' });
    const rest = sections.filter((s) => s._id !== id).map((s) => s._id);
    await saveOrder(rest);
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

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const ids = sections.map((s) => s._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    // turant UI update, phir server par save
    setSections((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
    await saveOrder(ids);
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

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Section heading e.g. Attractions you can't miss"
              className="flex-1 border rounded-md px-3 py-2"
            />
            <div className="sm:w-48">
              <input
                type="number"
                min={1}
                max={sections.length + 1}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder={`Position (1-${editingId ? sections.length : sections.length + 1})`}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Position: 1 = sabse pehle dikhega, 2 = doosra, 3 = teesra... Khali chhodein to sabse aakhir mein jayega.
          </p>

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
              {sections.map((s, i) => (
                <div key={s._id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[#181E4B] text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[#181E4B]">{s.heading}</p>
                      <p className="text-sm text-gray-500">
                        {s.packages.length} tours: {s.packages.map((p: any) => p.title).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 items-center">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="text-xs px-2 py-1 rounded border disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === sections.length - 1}
                      className="text-xs px-2 py-1 rounded border disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      className={`text-xs px-3 py-1 rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {s.isActive ? 'Visible' : 'Hidden'}
                    </button>
                    <button onClick={() => edit(s, i)} className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-800">Edit</button>
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