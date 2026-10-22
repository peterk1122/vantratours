const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://desertsmarttourism.com";

export default async function sitemap() {
  // ─── Static Pages ───────────────────────────────────────────────────────────
  const staticPages = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/about`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/blog`, priority: 0.7, changeFrequency: "weekly" },
    {
      url: `${BASE_URL}/travel-with-us`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/b2b-corporate`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/terms-and-conditions`,
      priority: 0.3,
      changeFrequency: "yearly",
    },
    { url: `${BASE_URL}/cart`, priority: 0.4, changeFrequency: "weekly" },
  ].map((page) => ({
    ...page,
    lastModified: new Date().toISOString(),
  }));

  // ─── Dynamic: Packages (tour-details/[slug]) ────────────────────────────────
  let packagePages = [];
  try {
    const res = await fetch(`${BASE_URL}/api/packages`, {
      next: { revalidate: 3600 }, // revalidate every hour
    });
    if (res.ok) {
      const data = await res.json();
      const packages = Array.isArray(data) ? data : data.packages ?? [];
      packagePages = packages
        .filter((pkg) => pkg?.slug)
        .map((pkg) => ({
          url: `${BASE_URL}/tour-details/${pkg.slug}`,
          lastModified: pkg.updatedAt
            ? new Date(pkg.updatedAt).toISOString()
            : new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.9,
        }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch packages:", err);
  }

  // ─── Dynamic: Categories ([slug]) ───────────────────────────────────────────
  let categoryPages = [];
  try {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const categories = Array.isArray(data) ? data : data.categories ?? [];
      categoryPages = categories
        .filter((cat) => cat?.slug)
        .map((cat) => ({
          url: `${BASE_URL}/${cat.slug}`,
          lastModified: cat.updatedAt
            ? new Date(cat.updatedAt).toISOString()
            : new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch categories:", err);
  }

  return [...staticPages, ...packagePages, ...categoryPages];
}
