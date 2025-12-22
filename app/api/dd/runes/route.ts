import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr_FR';
    const patch = searchParams.get('patch') || '14.3.1'; // Fallback patch if needed, but usually we want latest

    // Fetch latest version first if patch is 'latest'
    let version = patch;
    if (patch === 'latest') {
        try {
            const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
            if (versionRes.ok) {
                const versions = await versionRes.json();
                version = versions[0];
            }
        } catch (e) {
            console.error("Failed to fetch version", e);
        }
    }

    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/runesReforged.json`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch runes' }, { status: res.status });
        }
        const data = await res.json();
        return NextResponse.json({ data, patch: version });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
