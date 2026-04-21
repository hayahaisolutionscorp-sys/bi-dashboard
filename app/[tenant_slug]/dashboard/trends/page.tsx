import { redirect } from 'next/navigation';

export default function Page({ params }: { params: { tenant_slug: string } }) {
  redirect(`/${params.tenant_slug}/dashboard/analytics/trends`);
}
