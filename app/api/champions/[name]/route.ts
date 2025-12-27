import { NextResponse } from 'next/server';
import { ChampionDetailService } from '@/services/ChampionDetailService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ name: string }> }) {
    try {
        const params = await props.params;
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'ALL';
        const rank = searchParams.get('rank') || 'ALL';

        const championDetail = await ChampionDetailService.getChampionDetails(params.name, role, rank);

        if (!championDetail) {
            return NextResponse.json({ error: 'Champion not found' }, { status: 404 });
        }

        return NextResponse.json(championDetail);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
