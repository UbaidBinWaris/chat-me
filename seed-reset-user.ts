
import { prisma } from './lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
    const email = `reset-test-${Date.now()}@example.com`;
    const password = await bcrypt.hash('password123', 10);

    const user = await prisma.user.create({
        data: {
            email,
            username: `User${Date.now()}`,
            password,
            emailVerified: new Date(),
        },
    });

    console.log(JSON.stringify({ email: user.email }));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
