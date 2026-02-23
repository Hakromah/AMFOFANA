import { opportunities } from '@/data/opportunities';
import OpportunityDetail from '@/app/pages-sections/opportunity/OpportunityDetail';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
    return opportunities.map((opp) => ({
        id: opp.id,
    }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const opportunity = opportunities.find((o) => o.id === id);

    if (!opportunity) {
        return notFound();
    }

    return <OpportunityDetail opportunity={opportunity} />;
}
