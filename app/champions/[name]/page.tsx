import { Suspense } from 'react';
import ChampionDetailsClient from './ChampionDetailsClient';

export default async function ChampionDetailsPage(props: { params: Promise<{ name: string }> }) {
    const params = await props.params;
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChampionDetailsClient params={params} />
        </Suspense>
    );
}
