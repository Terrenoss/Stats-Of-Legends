import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { key } = await request.json();

        if (key === process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ status: 'ok' });
        } else {
            return NextResponse.json({ error: 'Invalid Key' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
