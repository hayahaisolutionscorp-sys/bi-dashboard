import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ tenant_slug: string }> }) {
  const { tenant_slug } = await params;
  redirect(`/${tenant_slug}/dashboard/analytics/cargo`);
}
