import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })

const prisma = new PrismaClient()

// New curated song list with 5 difficulty levels
const curatedSongs = [
  // Level 1 – Beginner (20 songs)
  { title: "La Bamba", artist: "Ritchie Valens", level: 1, levelName: "Beginner", description: "repetitive, simple vocab" },
  { title: "Vivir Mi Vida", artist: "Marc Anthony", level: 1, levelName: "Beginner", description: "uplifting, repetitive chorus" },
  { title: "La Camisa Negra", artist: "Juanes", level: 1, levelName: "Beginner", description: "clear vocals, everyday words" },
  { title: "Colgando en tus manos", artist: "Carlos Baute", level: 1, levelName: "Beginner", description: "slow duet" },
  { title: "Bailando", artist: "Enrique Iglesias", level: 1, levelName: "Beginner", description: "catchy, repetitive chorus" },
  { title: "Eres Tú", artist: "Mocedades", level: 1, levelName: "Beginner", description: "simple romantic lyrics" },
  { title: "Bésame Mucho", artist: "Consuelo Velázquez", level: 1, levelName: "Beginner", description: "classic, formal love vocab" },
  { title: "Mi Gente", artist: "J Balvin", level: 1, levelName: "Beginner", description: "repetitive, easy phrases" },
  { title: "Burbujas de Amor", artist: "Juan Luis Guerra", level: 1, levelName: "Beginner", description: "clear diction, love imagery" },
  { title: "La Gozadera", artist: "Gente de Zona", level: 1, levelName: "Beginner", description: "festive, easy-to-follow" },
  { title: "Corazón Partío", artist: "Alejandro Sanz", level: 1, levelName: "Beginner", description: "slow, clear articulation" },
  { title: "Vente Pa' Ca", artist: "Ricky Martin", level: 1, levelName: "Beginner", description: "modern, simple structures" },
  { title: "Sofia", artist: "Álvaro Soler", level: 1, levelName: "Beginner", description: "repetitive structure, beginner-friendly" },
  { title: "Color Esperanza", artist: "Diego Torres", level: 1, levelName: "Beginner", description: "motivational, simple tenses" },
  { title: "Limón y Sal", artist: "Julieta Venegas", level: 1, levelName: "Beginner", description: "everyday vocab, casual tone" },
  { title: "Me Enamora", artist: "Juanes", level: 1, levelName: "Beginner", description: "clear diction, easy grammar" },
  { title: "Burbujas de Amor", artist: "Juan Luis Guerra", level: 1, levelName: "Beginner", description: "slow and poetic, still simple" },
  { title: "Oye", artist: "Gloria Estefan", level: 1, levelName: "Beginner", description: "repetitive, clear chorus" },
  { title: "Cuando Me Enamoro", artist: "Enrique Iglesias", level: 1, levelName: "Beginner", description: "ballad, simple structures" },
  { title: "La Vida es un Carnaval", artist: "Celia Cruz", level: 1, levelName: "Beginner", description: "celebratory, clear lyrics" },

  // Level 2 – Upper Beginner (20 songs)
  { title: "Rayando el Sol", artist: "Maná", level: 2, levelName: "Upper Beginner", description: "iconic rock ballad, simple storytelling" },
  { title: "Robarte un Beso", artist: "Carlos Vives", level: 2, levelName: "Upper Beginner", description: "fun, modern, conversational" },
  { title: "Me Gustas Tú", artist: "Manu Chao", level: 2, levelName: "Upper Beginner", description: "playful, repetitive, vocabulary variety" },
  { title: "No Me Doy por Vencido", artist: "Luis Fonsi", level: 2, levelName: "Upper Beginner", description: "motivational, slightly more verbs" },
  { title: "Tabaco y Chanel", artist: "Bacilos", level: 2, levelName: "Upper Beginner", description: "everyday themes, moderate pace" },
  { title: "Llorar", artist: "Jesse & Joy", level: 2, levelName: "Upper Beginner", description: "clear ballad, emotions vocabulary" },
  { title: "Canción del Mariachi", artist: "Antonio Banderas", level: 2, levelName: "Upper Beginner", description: "fun, Mexican cultural vocab" },
  { title: "Te Quiero", artist: "Hombres G", level: 2, levelName: "Upper Beginner", description: "simple romantic expressions" },
  { title: "Se Preparó", artist: "Ozuna", level: 2, levelName: "Upper Beginner", description: "modern reggaetón, clear chorus" },
  { title: "A Dios le Pido", artist: "Juanes", level: 2, levelName: "Upper Beginner", description: "subjunctive intro but repetitive and clear" },
  { title: "La Bicicleta", artist: "Shakira", level: 2, levelName: "Upper Beginner", description: "storytelling, everyday imagery" },
  { title: "Nada Valgo Sin Tu Amor", artist: "Juanes", level: 2, levelName: "Upper Beginner", description: "straightforward vocabulary" },
  { title: "Bonito", artist: "Jarabe de Palo", level: 2, levelName: "Upper Beginner", description: "uplifting, easy idioms" },
  { title: "Bésala", artist: "Alejandro Fernández", level: 2, levelName: "Upper Beginner", description: "slow ballad" },
  { title: "Fruta Fresca", artist: "Carlos Vives", level: 2, levelName: "Upper Beginner", description: "clear, playful imagery" },
  { title: "Te Mando Flores", artist: "Fonseca", level: 2, levelName: "Upper Beginner", description: "romantic, beginner-friendly" },
  { title: "El Sol No Regresa", artist: "La Quinta Estación", level: 2, levelName: "Upper Beginner", description: "upbeat, conversational" },
  { title: "Lamento Boliviano", artist: "Enanitos Verdes", level: 2, levelName: "Upper Beginner", description: "iconic, moderate complexity" },
  { title: "Vuelves", artist: "Sweet California", level: 2, levelName: "Upper Beginner", description: "modern, simple grammar" },
  { title: "El Talismán", artist: "Rosana", level: 2, levelName: "Upper Beginner", description: "everyday vocabulary, smooth flow" },

  // Level 3 – Intermediate (20 songs)
  { title: "Eres", artist: "Café Tacvba", level: 3, levelName: "Intermediate", description: "poetic metaphors, moderate pace" },
  { title: "Corazón Espinado", artist: "Santana", level: 3, levelName: "Intermediate", description: "storytelling, metaphors" },
  { title: "Clavado en un Bar", artist: "Maná", level: 3, levelName: "Intermediate", description: "humor, narrative song" },
  { title: "Y Hubo Alguien", artist: "Marc Anthony", level: 3, levelName: "Intermediate", description: "fast salsa, past tense" },
  { title: "En el Muelle de San Blas", artist: "Maná", level: 3, levelName: "Intermediate", description: "narrative, past tense" },
  { title: "Guitarra", artist: "Los Auténticos Decadentes", level: 3, levelName: "Intermediate", description: "humor, slang" },
  { title: "De Música Ligera", artist: "Soda Stereo", level: 3, levelName: "Intermediate", description: "idiomatic expressions" },
  { title: "Como Mirarte", artist: "Sebastián Yatra", level: 3, levelName: "Intermediate", description: "subjunctive use, romantic" },
  { title: "La Lola", artist: "Café Quijano", level: 3, levelName: "Intermediate", description: "storytelling with humor" },
  { title: "Andar Conmigo", artist: "Julieta Venegas", level: 3, levelName: "Intermediate", description: "subjunctive, conversational" },
  { title: "Caminar de Tu Mano", artist: "Río Roma", level: 3, levelName: "Intermediate", description: "everyday idioms, modern" },
  { title: "Persiana Americana", artist: "Soda Stereo", level: 3, levelName: "Intermediate", description: "metaphor-rich" },
  { title: "Vivir Sin Aire", artist: "Maná", level: 3, levelName: "Intermediate", description: "poetic vocabulary, love metaphors" },
  { title: "Tu Amor Me Hace Bien", artist: "Marc Anthony", level: 3, levelName: "Intermediate", description: "subjunctive/conditional use" },
  { title: "Deja Que Te Bese", artist: "Alejandro Sanz", level: 3, levelName: "Intermediate", description: "conversational flow" },
  { title: "Mariposa Traicionera", artist: "Maná", level: 3, levelName: "Intermediate", description: "colloquial expressions" },
  { title: "Girasoles", artist: "Rozalén", level: 3, levelName: "Intermediate", description: "poetic, symbolic imagery" },
  { title: "Cielito Lindo", artist: "Traditional", level: 3, levelName: "Intermediate", description: "folk vocabulary, easy chorus but cultural depth" },
  { title: "Ella y Yo", artist: "Don Omar", level: 3, levelName: "Intermediate", description: "dialogue, narrative" },
  { title: "Quiero Dormir Cansado", artist: "Emmanuel", level: 3, levelName: "Intermediate", description: "emotional vocabulary" },

  // Level 4 – Advanced (20 songs)
  { title: "Clandestino", artist: "Manu Chao", level: 4, levelName: "Advanced", description: "social themes, advanced vocabulary" },
  { title: "Amor Eterno", artist: "Rocío Dúrcal", level: 4, levelName: "Advanced", description: "poetic, emotional, formal diction" },
  { title: "Héroe de Leyenda", artist: "Héroes del Silencio", level: 4, levelName: "Advanced", description: "metaphorical, rock diction" },
  { title: "Latinoamérica", artist: "Calle 13", level: 4, levelName: "Advanced", description: "deep socio-political themes" },
  { title: "La Flaca", artist: "Jarabe de Palo", level: 4, levelName: "Advanced", description: "metaphors, idiomatic" },
  { title: "Me Olvidé de Vivir", artist: "Julio Iglesias", level: 4, levelName: "Advanced", description: "past tense, reflective tone" },
  { title: "Historia de un Amor", artist: "Los Panchos", level: 4, levelName: "Advanced", description: "poetic ballad" },
  { title: "Mediterráneo", artist: "Joan Manuel Serrat", level: 4, levelName: "Advanced", description: "regional imagery, advanced vocabulary" },
  { title: "El Problema", artist: "Ricardo Arjona", level: 4, levelName: "Advanced", description: "fast storytelling" },
  { title: "La Incondicional", artist: "Luis Miguel", level: 4, levelName: "Advanced", description: "poetic ballad" },
  { title: "Por Amarte Así", artist: "Cristian Castro", level: 4, levelName: "Advanced", description: "subjunctive use, complex phrasing" },
  { title: "Es Por Ti", artist: "Juanes", level: 4, levelName: "Advanced", description: "metaphorical and subjunctive elements" },
  { title: "Quién Será", artist: "Pablo Beltrán Ruiz", level: 4, levelName: "Advanced", description: "cultural classic, metaphorical" },
  { title: "A Quien Quiera Escuchar", artist: "Ricky Martin", level: 4, levelName: "Advanced", description: "reflective, emotional" },
  { title: "Te Conozco", artist: "Ricardo Arjona", level: 4, levelName: "Advanced", description: "poetic, subjunctive" },
  { title: "La Negra Tomasa", artist: "Caifanes", level: 4, levelName: "Advanced", description: "colloquial Mexican expressions" },
  { title: "Y, ¿Si Fuera Ella?", artist: "Alejandro Sanz", level: 4, levelName: "Advanced", description: "subjunctive, metaphorical" },
  { title: "Se Me Olvidó Otra Vez", artist: "Vicente Fernández", level: 4, levelName: "Advanced", description: "ranchera, rural idioms" },
  { title: "Guitarra y Voz", artist: "Vicente Amigo", level: 4, levelName: "Advanced", description: "flamenco fusion, poetic" },
  { title: "Nada de Esto Fue un Error", artist: "Coti", level: 4, levelName: "Advanced", description: "reflective and idiomatic" },

  // Level 5 – Expert (20 songs)
  { title: "La Canción", artist: "J Balvin", level: 5, levelName: "Expert", description: "reggaetón slang, fast" },
  { title: "Safáera", artist: "Bad Bunny", level: 5, levelName: "Expert", description: "extremely dense, Puerto Rican slang" },
  { title: "Malamente", artist: "Rosalía", level: 5, levelName: "Expert", description: "flamenco slang, metaphorical" },
  { title: "Aute Cuture", artist: "Rosalía", level: 5, levelName: "Expert", description: "rapid delivery, wordplay" },
  { title: "Yo Voy", artist: "Zion & Lennox", level: 5, levelName: "Expert", description: "reggaetón idioms" },
  { title: "Atrévete-te-te", artist: "Calle 13", level: 5, levelName: "Expert", description: "slang-heavy, fast" },
  { title: "Gasolina", artist: "Daddy Yankee", level: 5, levelName: "Expert", description: "iconic reggaetón slang" },
  { title: "Ginza", artist: "J Balvin", level: 5, levelName: "Expert", description: "urban slang, dense phrases" },
  { title: "Ella y Yo", artist: "Don Omar", level: 5, levelName: "Expert", description: "dialogue-heavy narrative" },
  { title: "Dákiti", artist: "Bad Bunny", level: 5, levelName: "Expert", description: "slang + fast pace" },
  { title: "Qué Pretendes", artist: "J Balvin", level: 5, levelName: "Expert", description: "idioms, rapid phrasing" },
  { title: "TKN", artist: "Rosalía", level: 5, levelName: "Expert", description: "mixed slang (Spanish + English)" },
  { title: "Lo Siento BB:/", artist: "Tainy", level: 5, levelName: "Expert", description: "slang + subjunctive" },
  { title: "Farsante", artist: "Ozuna", level: 5, levelName: "Expert", description: "metaphorical reggaetón" },
  { title: "Te Boté", artist: "Nio García", level: 5, levelName: "Expert", description: "complex reggaetón flow" },
  { title: "Me Acostumbré", artist: "Arcángel", level: 5, levelName: "Expert", description: "idiomatic slang" },
  { title: "Pa' Ti", artist: "Jennifer Lopez", level: 5, levelName: "Expert", description: "urban expressions, fast" },
  { title: "Despacito", artist: "Luis Fonsi", level: 5, levelName: "Expert", description: "iconic, fast transitions" },
  { title: "Ella y Yo (Remix)", artist: "Multiple Artists", level: 5, levelName: "Expert", description: "slang overload" },
  { title: "Bichiyal", artist: "Bad Bunny", level: 5, levelName: "Expert", description: "slang, cultural references, rapid flow" }
]

async function updateSongList() {
  console.log('🎵 Starting curated song list update...')

  try {
    // First, clear existing songs
    console.log('📝 Clearing existing songs and translations...')
    await prisma.translation.deleteMany({})
    await prisma.song.deleteMany({})

    console.log('✅ Cleared existing data')

    // Add new curated songs
    console.log('🎯 Adding curated songs...')

    for (let i = 0; i < curatedSongs.length; i++) {
      const song = curatedSongs[i]

      await prisma.song.create({
        data: {
          title: song.title,
          artist: song.artist,
          level: song.level,
          levelName: song.levelName,
          description: song.description,
          order: i + 1, // Sequential ordering from 1-100
          // These will be populated later by Musixmatch/Spotify scripts
          spotifyId: null,
          lyricsRaw: null,
          previewUrl: null,
          albumArt: null,
          spotifyUrl: null
        }
      })

      if ((i + 1) % 20 === 0) {
        console.log(`✅ Added ${i + 1} songs`)
      }
    }

    // Summary
    const totalSongs = await prisma.song.count()
    const songsByLevel = await prisma.song.groupBy({
      by: ['level', 'levelName'],
      _count: {
        _all: true
      }
    })

    console.log(`\n🎉 Song list update complete!`)
    console.log(`📊 Total songs: ${totalSongs}`)
    console.log('\n📈 Songs by difficulty level:')

    songsByLevel.forEach(level => {
      console.log(`  Level ${level.level} (${level.levelName}): ${level._count._all} songs`)
    })

    console.log('\n📋 Sample songs from each level:')
    for (let level = 1; level <= 5; level++) {
      const sampleSongs = await prisma.song.findMany({
        where: { level: level },
        take: 3,
        orderBy: { order: 'asc' }
      })

      console.log(`\n  Level ${level}:`)
      sampleSongs.forEach(song => {
        console.log(`    • ${song.artist} - ${song.title}`)
      })
    }

  } catch (error) {
    console.error('❌ Error updating song list:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

if (require.main === module) {
  updateSongList()
}

export { updateSongList }