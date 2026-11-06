import { redirect } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<Record<string, string | string[]>>;
}) {
  const p = await params;
  const values = Object.values(p);
  const last = values[values.length - 1];
  const slug = Array.isArray(last) ? last[last.length - 1] : last;
  redirect(`/tour-details/${slug}`);
}
