import OpportunityDetail from '@/app/pages-sections/opportunity/OpportunityDetail';
import { fetchOpportunityBySlug } from '@/lib/strapi-api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const opportunity = await fetchOpportunityBySlug(id);

    if (!opportunity) {
        return notFound();
    }

    return <OpportunityDetail opportunity={opportunity} />;
}
