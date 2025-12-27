import { NextResponse } from 'next/server';
import { TierListGenerationService } from '@/services/TierListGenerationService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const rank = searchParams.get('rank') || 'CHALLENGER';

        const tierList = await TierListGenerationService.getTierList(role, rank);

        return NextResponse.json(tierList);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
