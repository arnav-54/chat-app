const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch(q, currentUserId) {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } }
            ],
            NOT: { id: currentUserId }
        },
        select: { id: true, username: true, email: true, phone: true }
    });
    console.log(`Search for "${q}" returned ${users.length} users:`, JSON.stringify(users, null, 2));
}

async function main() {
    const allUsers = await prisma.user.findMany();
    const user1 = allUsers[0];
    console.log(`Logged in as: ${user1.username} (${user1.id})`);

    await testSearch('saurav', user1.id);
    await testSearch('arnav', user1.id);
    await testSearch('8895', user1.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
