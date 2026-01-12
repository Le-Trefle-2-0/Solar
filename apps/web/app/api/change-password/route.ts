import {NextResponse} from 'next/server';
import {auth} from '@/lib/auth';
import {headers} from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {currentPassword, newPassword} = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({error: 'Missing fields'}, {status: 400});
        }

        // Ensure user is authenticated
        const session = await auth.api.getSession({headers: await headers()});
        if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

        const changeFn = (auth.api as any).changePassword;
        if (typeof changeFn !== 'function') {
            console.error('changePassword endpoint not available on auth.api', Object.keys(auth.api));
            return NextResponse.json({error: 'Auth configuration error'}, {status: 500});
        }

        await changeFn({
            body: {
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            },
            headers: await headers(),
        });

        return NextResponse.json({success: true});
    } catch (err: any) {
        console.error('[change-password] Error', err);
        return NextResponse.json({error: err?.message || String(err)}, {status: 400});
    }
}
