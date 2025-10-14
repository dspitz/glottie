import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const words = ['tengo', 'negra', 'camisa', 'cama', 'amor', 'hoy', 'alma', 'solo', 'disimulo', 'pura']

  const results = await prisma.vocabulary.findMany({
    where: { word: { in: words } },
    select: {
      word: true,
      translation: true,
      usefulnessScore: true,
      frequency: true
    }
  })

  console.log('Words in database:\n')
  results.forEach(r => {
    console.log(`${r.word.padEnd(15)} useful=${r.usefulnessScore.toFixed(2)}  freq=${r.frequency}`)
  })

  const notFound = words.filter(w => !results.find(r => r.word === w))
  console.log('\nWords NOT in database:', notFound.join(', '))

  await prisma.$disconnect()
}

main()
