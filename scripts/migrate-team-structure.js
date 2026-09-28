
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration...');

  const members = await prisma.teamMember.findMany();
  
  for (const member of members) {
    // @ts-ignore - name was in TeamMember
    const name = member.name;
    // @ts-ignore - image was in TeamMember
    const image = member.image;
    // @ts-ignore - bio was in TeamMember
    const bio = member.bio;

    // Check if person already exists
    let person = await prisma.teamPerson.findUnique({
      where: { name }
    });

    if (!person) {
      person = await prisma.teamPerson.create({
        data: { name, image, bio }
      });
      console.log(`Created person: ${name}`);
    }

    // Update member to link to person
    await prisma.teamMember.update({
      where: { id: member.id },
      data: { personId: person.id }
    });
  }

  console.log('Migration finished successfully.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
