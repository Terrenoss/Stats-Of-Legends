import { NextResponse } from 'next/server';
import { CURRENT_PATCH } from '@/constants';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr_FR';
    const patch = searchParams.get('patch') || CURRENT_PATCH;

    try {
        const url = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/runesReforged.json`;
        const res = await fetch(url);

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch runes' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ data, patch });
    } catch (error) {
        console.error('Error fetching runes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
