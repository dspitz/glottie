/**
 * Pre-load Common Verbs
 *
 * Batch-enriches the top 250 most common verbs in Spanish and French
 * with conjugations and translations, storing them in VocabularyEnriched table.
 * This prevents slow initial page loads when users first encounter these verbs.
 */

import { PrismaClient } from '@prisma/client'
import { enrichVocabularyBatch } from '../lib/vocabularyEnrichment'

const prisma = new PrismaClient()

// Top 100 most common Spanish verbs
const COMMON_SPANISH_VERBS = [
  'ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar',
  'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar',
  'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar',
  'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir',
  'entrar', 'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir', 'recordar',
  'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar',
  'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír', 'acabar', 'poner',
  'amar', 'gustar', 'comer', 'beber', 'aprender', 'vender', 'correr', 'partir', 'subir', 'vivir',
  'recibir', 'sufrir', 'añadir', 'decidir', 'descubrir', 'permitir', 'asistir', 'discutir', 'existir', 'insistir',
  'preferir', 'referir', 'repetir', 'sentir', 'sugerir', 'advertir', 'convertir', 'divertir', 'herir', 'mentir'
]

// Top 100 most common French verbs
const COMMON_FRENCH_VERBS = [
  'être', 'avoir', 'faire', 'dire', 'pouvoir', 'aller', 'voir', 'savoir', 'vouloir', 'venir',
  'falloir', 'devoir', 'croire', 'trouver', 'donner', 'prendre', 'parler', 'aimer', 'passer', 'mettre',
  'demander', 'tenir', 'sembler', 'laisser', 'rester', 'penser', 'entendre', 'regarder', 'répondre', 'rendre',
  'connaître', 'paraître', 'arriver', 'sentir', 'attendre', 'vivre', 'chercher', 'comprendre', 'porter', 'croire',
  'apprendre', 'monter', 'descendre', 'tomber', 'devenir', 'tenir', 'reprendre', 'appeler', 'continuer', 'penser',
  'suivre', 'intéresser', 'amener', 'exister', 'entrer', 'ajouter', 'agir', 'servir', 'produire', 'écrire',
  'partir', 'offrir', 'ouvrir', 'finir', 'choisir', 'réfléchir', 'réussir', 'grandir', 'remplir', 'obéir',
  'bâtir', 'définir', 'établir', 'fournir', 'garantir', 'investir', 'punir', 'ralentir', 'réunir', 'saisir',
  'manger', 'commencer', 'acheter', 'appeler', 'jeter', 'préférer', 'répéter', 'espérer', 'protéger', 'nettoyer',
  'payer', 'essayer', 'envoyer', 'employer', 'ennuyer', 'essuyer', 'balayer', 'effrayer', 'égayer', 'renvoyer'
]

async function preloadCommonVerbs() {
  try {
    console.log('🚀 Pre-loading common verbs with conjugations...\n')

    // Process Spanish verbs in batches of 20
    console.log('📚 Processing Spanish verbs...')
    for (let i = 0; i < COMMON_SPANISH_VERBS.length; i += 20) {
      const batch = COMMON_SPANISH_VERBS.slice(i, i + 20)
      console.log(`  Batch ${Math.floor(i / 20) + 1}: ${batch.slice(0, 5).join(', ')}...`)

      try {
        await enrichVocabularyBatch(batch, 'es')
        console.log(`  ✅ Enriched ${batch.length} Spanish verbs`)
      } catch (error) {
        console.error(`  ❌ Error enriching Spanish batch:`, error)
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('\n📚 Processing French verbs...')
    for (let i = 0; i < COMMON_FRENCH_VERBS.length; i += 20) {
      const batch = COMMON_FRENCH_VERBS.slice(i, i + 20)
      console.log(`  Batch ${Math.floor(i / 20) + 1}: ${batch.slice(0, 5).join(', ')}...`)

      try {
        await enrichVocabularyBatch(batch, 'fr')
        console.log(`  ✅ Enriched ${batch.length} French verbs`)
      } catch (error) {
        console.error(`  ❌ Error enriching French batch:`, error)
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('\n✨ Pre-loading complete!')
    console.log('📊 Summary:')
    console.log(`  - Spanish verbs: ${COMMON_SPANISH_VERBS.length}`)
    console.log(`  - French verbs: ${COMMON_FRENCH_VERBS.length}`)
    console.log(`  - Total: ${COMMON_SPANISH_VERBS.length + COMMON_FRENCH_VERBS.length} verbs`)
    console.log('\nThese verbs are now cached and will load instantly for users!')

  } catch (error) {
    console.error('Error pre-loading verbs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

preloadCommonVerbs()
