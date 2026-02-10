import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { bio, image, phoneNumber } = await req.json();

        const user = await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: {
                bio,
                image,
                phoneNumber,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('[PROFILE_UPDATE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
