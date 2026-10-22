import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import HeaderConfig from '@/models/HeaderConfig';

export const dynamic = 'force-dynamic';

const DEFAULT_MENU = [
  { label: 'Home', link: '/', order: 0, submenu: [] },
  { label: 'About', link: '/about', order: 1, submenu: [] },
  { label: 'Corporate Inquiries', link: '/b2b-corporate', order: 2, submenu: [] },
];

// Turns whatever is stored (old or new shape) into a complete, clean object.
function normalize(doc: any) {
  const raw = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc || {};

  const topBarRaw = raw.topBar || {};
  let messages: { text: string; link: string }[] = Array.isArray(topBarRaw.messages)
    ? topBarRaw.messages.map((m: any) => ({ text: m.text || '', link: m.link || '' }))
    : [];
  // Old versions stored a single "text" line: keep it as the first message.
  if (messages.length === 0 && topBarRaw.text) {
    messages = [{ text: topBarRaw.text, link: '' }];
  }

  const contactRaw = raw.contact || {};
  const logoRaw = raw.logo || {};
  const searchRaw = raw.search || {};
  const buttonRaw = raw.button || {};

  return {
    _id: raw._id,
    topBar: {
      enabled: topBarRaw.enabled ?? true,
      bgColor: topBarRaw.bgColor || '#3B82F6',
      textColor: topBarRaw.textColor || '#FFFFFF',
      autoSlide: topBarRaw.autoSlide ?? true,
      intervalSeconds: Number(topBarRaw.intervalSeconds) > 0 ? Number(topBarRaw.intervalSeconds) : 5,
      messages,
    },
    logo: {
      url: logoRaw.url || '/images/logo.webp',
      alt: logoRaw.alt || 'Logo',
      height: Number(logoRaw.height) > 0 ? Number(logoRaw.height) : 48,
    },
    menuItems: Array.isArray(raw.menuItems)
      ? raw.menuItems
          .map((item: any, index: number) => ({
            _id: item._id,
            label: item.label || '',
            link: item.link || '',
            order: item.order ?? index,
            submenu: Array.isArray(item.submenu)
              ? item.submenu
                  .map((sub: any, subIndex: number) => ({
                    _id: sub._id,
                    label: sub.label || '',
                    link: sub.link || '',
                    order: sub.order ?? subIndex,
                  }))
                  .sort((a: any, b: any) => a.order - b.order)
              : [],
          }))
          .sort((a: any, b: any) => a.order - b.order)
      : [],
    contact: {
      enabled: contactRaw.enabled ?? true,
      label: contactRaw.label ?? 'Need Help?',
      phone: contactRaw.phone || topBarRaw.phone || '',
      link: contactRaw.link || '',
    },
    search: {
      enabled: searchRaw.enabled ?? true,
    },
    showCart: raw.showCart ?? true,
    button: {
      enabled: buttonRaw.enabled ?? true,
      label: buttonRaw.label || 'Login',
      link: buttonRaw.link || '/login',
      bgColor: buttonRaw.bgColor || '#111111',
      textColor: buttonRaw.textColor || '#FFFFFF',
    },
    accentColor: raw.accentColor || '#DF6951',
    spaceBelow: typeof raw.spaceBelow === 'number' && raw.spaceBelow >= 0 ? raw.spaceBelow : 40,
  };
}

async function getOrCreateConfig() {
  let config = await HeaderConfig.findOne();
  if (!config) {
    config = await HeaderConfig.create({
      topBar: {
        enabled: true,
        messages: [{ text: 'Enjoy Family Holiday Packages with Flexible Payment Options', link: '' }],
      },
      contact: { phone: '+971 50 877 8139' },
      menuItems: DEFAULT_MENU,
    });
  }
  return config;
}

export async function GET() {
  try {
    await connectToDatabase();
    const config = await getOrCreateConfig();
    return NextResponse.json({ success: true, data: normalize(config) });
  } catch (error: any) {
    console.error('Error fetching header config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch header config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const config = await getOrCreateConfig();

    const t = body.topBar || {};
    config.set('topBar', {
      enabled: t.enabled ?? true,
      bgColor: t.bgColor || '#3B82F6',
      textColor: t.textColor || '#FFFFFF',
      autoSlide: t.autoSlide ?? true,
      intervalSeconds: Number(t.intervalSeconds) > 0 ? Number(t.intervalSeconds) : 5,
      messages: Array.isArray(t.messages)
        ? t.messages
            .filter((m: any) => m && (m.text || '').trim() !== '')
            .map((m: any) => ({ text: (m.text || '').trim(), link: (m.link || '').trim() }))
        : [],
    });

    const l = body.logo || {};
    config.set('logo', {
      url: l.url || '/images/logo.webp',
      alt: l.alt || 'Logo',
      height: Number(l.height) > 0 ? Number(l.height) : 48,
    });

    if (Array.isArray(body.menuItems)) {
      config.set(
        'menuItems',
        body.menuItems
          .filter((item: any) => item && (item.label || '').trim() !== '')
          .map((item: any, index: number) => ({
            label: item.label.trim(),
            link: (item.link || '').trim(),
            order: index,
            submenu: Array.isArray(item.submenu)
              ? item.submenu
                  .filter((sub: any) => sub && (sub.label || '').trim() !== '')
                  .map((sub: any, subIndex: number) => ({
                    label: sub.label.trim(),
                    link: (sub.link || '').trim(),
                    order: subIndex,
                  }))
              : [],
          }))
      );
    }

    const c = body.contact || {};
    config.set('contact', {
      enabled: c.enabled ?? true,
      label: c.label ?? 'Need Help?',
      phone: c.phone || '',
      link: c.link || '',
    });

    const s = body.search || {};
    config.set('search', {
      enabled: s.enabled ?? true,
    });

    config.set('showCart', body.showCart ?? true);

    const b = body.button || {};
    config.set('button', {
      enabled: b.enabled ?? true,
      label: b.label || 'Login',
      link: b.link || '/login',
      bgColor: b.bgColor || '#111111',
      textColor: b.textColor || '#FFFFFF',
    });

    config.set('accentColor', body.accentColor || '#DF6951');

    const space = Number(body.spaceBelow);
    config.set('spaceBelow', Number.isFinite(space) && space >= 0 ? Math.min(space, 300) : 40);

    await config.save();

    return NextResponse.json({ success: true, data: normalize(config) });
  } catch (error: any) {
    console.error('Error updating header config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update header config' },
      { status: 500 }
    );
  }
}
