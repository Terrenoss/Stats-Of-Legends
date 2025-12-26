import { NextResponse } from 'next/server';
import { ChampionDetailService } from '@/services/ChampionDetailService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: any) {
    try {
        const params = await props.params;
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'MID';
        const rank = searchParams.get('rank') || 'CHALLENGER';
        const championName = params.name;

        const data = await ChampionDetailService.getChampionDetails(championName, role, rank);

        if (!data) {
            return NextResponse.json({ error: 'No data found' }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
