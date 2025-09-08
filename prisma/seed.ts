import {PrismaClient} from '../generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.channel.create({
        data:
            {
                id: "1",
                name: "Discussion BE libre"
            }
    });

    await prisma.ticketStatus.createMany({
        data: [
            {name: "waiting", label: "Non-Assignée"},
            {name: "started", label: "En cours"},
            {name: "closed", label: "En attente de transmission"},
            {name: "commented", label: "Terminée"},
        ]
    })

    await prisma.theme.createMany({
        data: [
            {name: "Harcèlement"},
            {name: "Trouble du comportement alimentaire"},
            {name: "Orientation de genre/sexe et discrimination liée à l'identité de genre/sexuelle"},
            {name: "Violences sexistes/sexuelles/abus (passées ou présentes"},
            {name: "Relation sociales (famille, amis, camarades, etc.)"},
            {name: "Dépression"},
            {name: "Stress - Anxiété - Angoisse - Phobies"},
            {name: "Trouble psy (Paranoïa, Bipolaire, TDI, ..."},
            {name: "Addictions (sexe, drogues, alcool, argent, jeux, ..."},
            {name: "Solitude / Isolement social / Discrimination"},
            {name: "Deuil"},
            {name: "Idées suicidaires - Crises suicidaires"},
            {name: "Question liées à la sexualité / relations amoureuses"},
            {name: "Maltraitance physique ou psychique (passées ou présentes"},
        ]
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })