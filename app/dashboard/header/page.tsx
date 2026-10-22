'use client';

import React, { useEffect, useState } from 'react';

interface SubmenuItem {
  label: string;
  link: string;
}

interface MenuItem {
  label: string;
  link: string;
  submenu: SubmenuItem[];
}

interface TopBarMessage {
  text: string;
  link: string;
}

interface Config {
  topBar: {
    enabled: boolean;
    bgColor: string;
    textColor: string;
    autoSlide: boolean;
    intervalSeconds: number;
    messages: TopBarMessage[];
  };
  logo: { url: string; alt: string; height: number };
  menuItems: MenuItem[];
  contact: { enabled: boolean; label: string; phone: string; link: string };
  search: { enabled: boolean };
  showCart: boolean;
  button: { enabled: boolean; label: string; link: string; bgColor: string; textColor: string };
  accentColor: string;
  spaceBelow: number;
}

const EMPTY: Config = {
  topBar: { enabled: true, bgColor: '#3B82F6', textColor: '#FFFFFF', autoSlide: true, intervalSeconds: 5, messages: [] },
  logo: { url: '/images/logo.webp', alt: 'Logo', height: 48 },
  menuItems: [],
  contact: { enabled: true, label: 'Need Help?', phone: '', link: '' },
  search: { enabled: true },
  showCart: true,
  button: { enabled: true, label: 'Login', link: '/login', bgColor: '#111111', textColor: '#FFFFFF' },
  accentColor: '#DF6951',
  spaceBelow: 40,
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none';
const smallBtn = 'px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4" />
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 p-0.5 border border-gray-300 rounded cursor-pointer bg-white"
        />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
    </Field>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {hint && <p className="text-sm text-gray-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function HeaderConfigPage() {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/header-config', { cache: 'no-store' });
        const json = await res.json();
        if (json.success) {
          setConfig({ ...EMPTY, ...json.data });
        } else {
          setMessage({ type: 'error', text: json.error || 'Failed to load header settings' });
        }
      } catch (error) {
        console.error('Failed to load header config', error);
        setMessage({ type: 'error', text: 'Failed to load header settings' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('/api/header-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.success) {
        setConfig({ ...EMPTY, ...json.data });
        setMessage({ type: 'success', text: 'Header saved. Refresh your website to see the changes.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save' });
      }
    } catch (error) {
      console.error('Failed to save header config', error);
      setMessage({ type: 'error', text: 'Failed to save header settings' });
    } finally {
      setSaving(false);
    }
  };

  // ---- generic helpers ----
  const setTopBar = (patch: Partial<Config['topBar']>) =>
    setConfig((c) => ({ ...c, topBar: { ...c.topBar, ...patch } }));
  const setLogo = (patch: Partial<Config['logo']>) => setConfig((c) => ({ ...c, logo: { ...c.logo, ...patch } }));
  const setContact = (patch: Partial<Config['contact']>) =>
    setConfig((c) => ({ ...c, contact: { ...c.contact, ...patch } }));
  const setSearch = (patch: Partial<Config['search']>) =>
    setConfig((c) => ({ ...c, search: { ...c.search, ...patch } }));
  const setButton = (patch: Partial<Config['button']>) =>
    setConfig((c) => ({ ...c, button: { ...c.button, ...patch } }));

  const swap = <T,>(list: T[], index: number, direction: 'up' | 'down'): T[] => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  };

  // ---- top bar messages ----
  const addMessage = () => setTopBar({ messages: [...config.topBar.messages, { text: '', link: '' }] });
  const updateMessage = (i: number, field: 'text' | 'link', value: string) => {
    const list = [...config.topBar.messages];
    list[i] = { ...list[i], [field]: value };
    setTopBar({ messages: list });
  };
  const deleteMessage = (i: number) => setTopBar({ messages: config.topBar.messages.filter((_, idx) => idx !== i) });
  const moveMessage = (i: number, d: 'up' | 'down') => setTopBar({ messages: swap(config.topBar.messages, i, d) });

  // ---- menu items ----
  const setMenu = (menuItems: MenuItem[]) => setConfig((c) => ({ ...c, menuItems }));
  const addMenuItem = () => setMenu([...config.menuItems, { label: 'New Item', link: '/', submenu: [] }]);
  const updateMenuItem = (i: number, field: 'label' | 'link', value: string) => {
    const list = [...config.menuItems];
    list[i] = { ...list[i], [field]: value };
    setMenu(list);
  };
  const deleteMenuItem = (i: number) => {
    if (!confirm('Delete this menu item and all its submenu items?')) return;
    setMenu(config.menuItems.filter((_, idx) => idx !== i));
  };
  const moveMenuItem = (i: number, d: 'up' | 'down') => setMenu(swap(config.menuItems, i, d));

  // ---- submenu items ----
  const addSub = (mi: number) => {
    const list = [...config.menuItems];
    list[mi] = { ...list[mi], submenu: [...list[mi].submenu, { label: 'New Sub Item', link: '/' }] };
    setMenu(list);
  };
  const updateSub = (mi: number, si: number, field: 'label' | 'link', value: string) => {
    const list = [...config.menuItems];
    const sub = [...list[mi].submenu];
    sub[si] = { ...sub[si], [field]: value };
    list[mi] = { ...list[mi], submenu: sub };
    setMenu(list);
  };
  const deleteSub = (mi: number, si: number) => {
    const list = [...config.menuItems];
    list[mi] = { ...list[mi], submenu: list[mi].submenu.filter((_, idx) => idx !== si) };
    setMenu(list);
  };
  const moveSub = (mi: number, si: number, d: 'up' | 'down') => {
    const list = [...config.menuItems];
    list[mi] = { ...list[mi], submenu: swap(list[mi].submenu, si, d) };
    setMenu(list);
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading header settings...</div>;
  }

  const firstMessage = config.topBar.messages.find((m) => m.text.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Header & Menu Settings</h1>
        <p className="text-gray-500 mt-1">
          Everything in your website header is controlled here. Make your changes, then click Save Changes at the bottom.
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

      {/* Live preview */}
      <Section title="Preview" hint="A quick look at how the header will appear.">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {config.topBar.enabled && firstMessage && (
            <div
              className="text-center text-xs py-2 px-3"
              style={{ backgroundColor: config.topBar.bgColor, color: config.topBar.textColor }}
            >
              {firstMessage.text}
            </div>
          )}
          <div className="bg-white px-4 py-3 flex items-center justify-between gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.logo.url} alt={config.logo.alt} style={{ height: config.logo.height, width: 'auto' }} />
            <div className="hidden sm:flex gap-5 text-sm font-semibold text-gray-900">
              {config.menuItems.map((item, i) => (
                <span key={i}>
                  {item.label}
                  {item.submenu.length > 0 ? ' ▾' : ''}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
              {config.contact.enabled && config.contact.phone && (
                <span className="font-bold text-gray-900">{config.contact.phone}</span>
              )}
              {config.button.enabled && config.button.label && (
                <span
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: config.button.bgColor, color: config.button.textColor }}
                >
                  {config.button.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Top bar */}
      <Section title="Top Bar" hint="The coloured strip above the menu. Add one or more messages; with several, they slide automatically.">
        <Toggle checked={config.topBar.enabled} onChange={(v) => setTopBar({ enabled: v })} label="Show top bar" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorField label="Background colour" value={config.topBar.bgColor} onChange={(v) => setTopBar({ bgColor: v })} />
          <ColorField label="Text colour" value={config.topBar.textColor} onChange={(v) => setTopBar({ textColor: v })} />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Toggle
            checked={config.topBar.autoSlide}
            onChange={(v) => setTopBar({ autoSlide: v })}
            label="Slide messages automatically"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Change every</span>
            <input
              type="number"
              min={2}
              value={config.topBar.intervalSeconds}
              onChange={(e) => setTopBar({ intervalSeconds: Number(e.target.value) })}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">seconds</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Messages</span>
            <button type="button" onClick={addMessage} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              + Add Message
            </button>
          </div>
          {config.topBar.messages.length === 0 && <p className="text-xs text-gray-400">No messages yet.</p>}
          {config.topBar.messages.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={m.text}
                onChange={(e) => updateMessage(i, 'text', e.target.value)}
                placeholder="Message text"
                className={`${inputClass} flex-[2]`}
              />
              <input
                type="text"
                value={m.link}
                onChange={(e) => updateMessage(i, 'link', e.target.value)}
                placeholder="Link (optional)"
                className={`${inputClass} flex-1`}
              />
              <button type="button" onClick={() => moveMessage(i, 'up')} disabled={i === 0} className={smallBtn}>
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveMessage(i, 'down')}
                disabled={i === config.topBar.messages.length - 1}
                className={smallBtn}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => deleteMessage(i)}
                className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Logo */}
      <Section title="Logo" hint="Use a path from your site (for example /images/logo.webp) or a full image address.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Field label="Logo image address">
              <input type="text" value={config.logo.url} onChange={(e) => setLogo({ url: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Logo height (pixels)">
            <input
              type="number"
              min={20}
              max={150}
              value={config.logo.height}
              onChange={(e) => setLogo({ height: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <div className="md:col-span-3">
            <Field label="Logo description (alt text)">
              <input type="text" value={config.logo.alt} onChange={(e) => setLogo({ alt: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </div>
      </Section>

      {/* Menu */}
      <Section title="Menu" hint="Each menu item has a text and a link. Add submenu items under an item to make it a dropdown.">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addMenuItem}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Add Menu Item
          </button>
        </div>

        <div className="space-y-4">
          {config.menuItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Text">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Link (leave empty if it only opens a dropdown)">
                    <input
                      type="text"
                      value={item.link}
                      onChange={(e) => updateMenuItem(index, 'link', e.target.value)}
                      placeholder="/about"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="flex flex-col gap-1 pt-5">
                  <button type="button" onClick={() => moveMenuItem(index, 'up')} disabled={index === 0} className={smallBtn}>
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMenuItem(index, 'down')}
                    disabled={index === config.menuItems.length - 1}
                    className={smallBtn}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMenuItem(index)}
                  className="mt-5 px-3 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <div className="pl-4 border-l-2 border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Submenu items</span>
                  <button
                    type="button"
                    onClick={() => addSub(index)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Submenu Item
                  </button>
                </div>
                {item.submenu.length === 0 && <p className="text-xs text-gray-400">No submenu items.</p>}
                {item.submenu.map((sub, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sub.label}
                      onChange={(e) => updateSub(index, si, 'label', e.target.value)}
                      placeholder="Text"
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="text"
                      value={sub.link}
                      onChange={(e) => updateSub(index, si, 'link', e.target.value)}
                      placeholder="/link"
                      className={`${inputClass} flex-1`}
                    />
                    <button type="button" onClick={() => moveSub(index, si, 'up')} disabled={si === 0} className={smallBtn}>
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSub(index, si, 'down')}
                      disabled={si === item.submenu.length - 1}
                      className={smallBtn}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSub(index, si)}
                      className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {config.menuItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No menu items yet. Click "Add Menu Item".</p>
          )}
        </div>
      </Section>

      {/* Right side */}
      <Section title="Right Side of the Header" hint="Phone number, search, cart and the dark button (Login).">
        <div className="space-y-3">
          <Toggle checked={config.contact.enabled} onChange={(v) => setContact({ enabled: v })} label="Show phone number" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Small text above number">
              <input
                type="text"
                value={config.contact.label}
                onChange={(e) => setContact({ label: e.target.value })}
                placeholder="Need Help?"
                className={inputClass}
              />
            </Field>
            <Field label="Phone number">
              <input
                type="text"
                value={config.contact.phone}
                onChange={(e) => setContact({ phone: e.target.value })}
                placeholder="+971 50 877 8139"
                className={inputClass}
              />
            </Field>
            <Field label="Link when clicked (optional)">
              <input
                type="text"
                value={config.contact.link}
                onChange={(e) => setContact({ link: e.target.value })}
                placeholder="https://wa.me/971508778139"
                className={inputClass}
              />
            </Field>
          </div>
          <p className="text-xs text-gray-400">If the link is empty, clicking the number starts a phone call.</p>
        </div>

        <hr className="border-gray-100" />

        <div className="space-y-3">
          <Toggle checked={config.search.enabled} onChange={(v) => setSearch({ enabled: v })} label="Show search icon" />
          <p className="text-xs text-gray-400">
            The search shows matching packages as people type, the same as the search box on the homepage banner.
          </p>
        </div>

        <hr className="border-gray-100" />

        <Toggle checked={config.showCart} onChange={(v) => setConfig((c) => ({ ...c, showCart: v }))} label="Show cart icon" />

        <hr className="border-gray-100" />

        <div className="space-y-3">
          <Toggle checked={config.button.enabled} onChange={(v) => setButton({ enabled: v })} label="Show button" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Button text">
              <input type="text" value={config.button.label} onChange={(e) => setButton({ label: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Button link">
              <input type="text" value={config.button.link} onChange={(e) => setButton({ link: e.target.value })} className={inputClass} />
            </Field>
            <ColorField label="Button colour" value={config.button.bgColor} onChange={(v) => setButton({ bgColor: v })} />
            <ColorField label="Button text colour" value={config.button.textColor} onChange={(v) => setButton({ textColor: v })} />
          </div>
        </div>
      </Section>

      {/* Accent */}
      <Section title="Colour & Spacing" hint="Accent colour is used for menu hover, dropdown hover and the cart counter.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorField label="Accent colour" value={config.accentColor} onChange={(v) => setConfig((c) => ({ ...c, accentColor: v }))} />
          <Field label="Space below header (pixels) - increase this if the page banner is hidden behind the header">
            <input
              type="number"
              min={0}
              max={300}
              value={config.spaceBelow}
              onChange={(e) => setConfig((c) => ({ ...c, spaceBelow: Number(e.target.value) }))}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end pb-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
