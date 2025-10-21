import { PrismaClient } from '../lib/generated/prisma/index'

const prisma = new PrismaClient()

const units = [
    // Weight
    { shortName: 'g', displayName: 'Grams' },
    { shortName: 'kg', displayName: 'Kilograms' },
    { shortName: 'oz', displayName: 'Ounces' },
    { shortName: 'lb', displayName: 'Pounds' },
    { shortName: 'mg', displayName: 'Milligrams' },

    // Volume
    { shortName: 'ml', displayName: 'Milliliters' },
    { shortName: 'l', displayName: 'Liters' },
    { shortName: 'fl oz', displayName: 'Fluid Ounces' },
    { shortName: 'cup', displayName: 'Cups' },
    { shortName: 'pt', displayName: 'Pints' },
    { shortName: 'qt', displayName: 'Quarts' },
    { shortName: 'gal', displayName: 'Gallons' },
    { shortName: 'tbsp', displayName: 'Tablespoons' },
    { shortName: 'tsp', displayName: 'Teaspoons' },

    // Count
    { shortName: 'count', displayName: 'Count' },
    { shortName: 'piece', displayName: 'Piece' },
    { shortName: 'package', displayName: 'Package' },
    { shortName: 'bag', displayName: 'Bag' },
    { shortName: 'box', displayName: 'Box' },
    { shortName: 'can', displayName: 'Can' },
    { shortName: 'jar', displayName: 'Jar' },
    { shortName: 'bottle', displayName: 'Bottle' },
]

async function main() {
    console.log('Starting seed...')

    // Seed units
    for (const unit of units) {
        await prisma.unit.upsert({
            where: { shortName: unit.shortName },
            update: {},
            create: unit,
        })
    }

    console.log(`✅ Seeded ${units.length} units`)
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
