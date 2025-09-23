#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function fixLevel1Summaries() {
  console.log('🔄 Fixing Level 1 songs with placeholder summaries...\n');

  try {
    // Manual summaries for Level 1 songs (36 words or less each)
    const manualSummaries = [
      {
        title: 'Vivir Mi Vida',
        artist: 'Marc Anthony',
        summary: 'Uplifting salsa anthem about embracing life despite hardships. Celebrates resilience, joy, and living in the moment. The infectious rhythm and positive message encourage dancing away sorrows and choosing happiness over regret.'
      },
      {
        title: 'Colgando en tus manos',
        artist: 'Carlos Baute',
        summary: 'Romantic ballad exploring dependency and vulnerability in love. The narrator feels suspended, hanging on their partner\'s decisions. Expresses the fear of losing oneself while desperately clinging to a relationship.'
      },
      {
        title: 'Bailando',
        artist: 'Enrique Iglesias',
        summary: 'Sensual reggaeton-flamenco fusion celebrating passionate dance and desire. The rhythm captures the heat of attraction, with lyrics painting vivid images of movement, connection, and romantic chemistry on the dance floor.'
      },
      {
        title: 'Eres Tú',
        artist: 'Mocedades',
        summary: 'Tender love song using nature metaphors to express deep affection. Compares the beloved to essential elements like water, sun, and air. This 1973 classic remains a timeless declaration of romantic devotion.'
      },
      {
        title: 'Bésame Mucho',
        artist: 'Consuelo Velázquez',
        summary: 'Iconic bolero about urgent, passionate kisses before potential separation. Written in 1940, it captures wartime anxiety and desire. The plea for kisses "as if tonight were the last time" resonates universally.'
      },
      {
        title: 'Burbujas de Amor',
        artist: 'Juan Luis Guerra',
        summary: 'Whimsical merengue comparing love to soap bubbles—beautiful, delicate, floating. Playful wordplay and Caribbean rhythms create a joyful celebration of romance. The metaphor captures love\'s ethereal, fragile nature perfectly.'
      },
      {
        title: 'Corazón Partío',
        artist: 'Alejandro Sanz',
        summary: 'Flamenco-pop exploration of heartbreak and emotional devastation. The "broken heart" searches for healing while processing betrayal. Sanz\'s passionate delivery and poetic lyrics made this an instant Spanish classic.'
      },
      {
        title: 'Vente Pa\' Ca',
        artist: 'Ricky Martin',
        summary: 'Tropical party anthem inviting someone to come closer and dance. Blends reggaeton with Caribbean flavors, creating an irresistible call to the dance floor. Pure celebration of music, movement, and attraction.'
      },
      {
        title: 'Color Esperanza',
        artist: 'Diego Torres',
        summary: 'Inspirational anthem about hope and perseverance through difficult times. Encourages painting life with the "color of hope" and believing in better days. Became Latin America\'s unofficial song of resilience.'
      },
      {
        title: 'Limón y Sal',
        artist: 'Julieta Venegas',
        summary: 'Quirky love song accepting a partner\'s imperfections like "lemon and salt." Celebrates authentic love beyond idealization. The accordion-driven melody and honest lyrics capture real relationship dynamics beautifully.'
      },
      {
        title: 'Me Enamora',
        artist: 'Juanes',
        summary: 'Joyful declaration listing everything that makes someone fall in love. From smiles to gestures, celebrates the small details that create deep affection. Upbeat rock-pop expressing pure romantic happiness.'
      },
      {
        title: 'La Vida es un Carnaval',
        artist: 'Celia Cruz',
        summary: 'Salsa anthem proclaiming life is a carnival meant for singing and dancing. Encourages joy despite problems, with Cruz\'s powerful voice inspiring resilience. The ultimate feel-good Latin song about choosing happiness.'
      },
      {
        title: 'Rayando el Sol',
        artist: 'Maná',
        summary: 'Rock ballad about desperate unrequited love that "scratches the sun." The pain of loving someone unreachable burns intensely. Maná\'s signature sound captures the agony and passion of impossible love.'
      },
      {
        title: 'Robarte un Beso',
        artist: 'Carlos Vives',
        summary: 'Vallenato-pop about the desire to "steal a kiss" from someone special. Playful and romantic, mixing traditional Colombian sounds with modern production. The infectious rhythm makes love feel like an adventure.'
      },
      {
        title: 'No Me Doy por Vencido',
        artist: 'Luis Fonsi',
        summary: 'Determined ballad about not giving up on love despite obstacles. Expresses commitment to fight for a relationship worth saving. The soaring melody reinforces the message of perseverance in romance.'
      },
      {
        title: 'Tabaco y Chanel',
        artist: 'Bacilos',
        summary: 'Nostalgic pop-rock remembering a lost love through sensory memories. The scent of tobacco and Chanel perfume triggers bittersweet recollections. Captures how certain smells can transport us to past relationships.'
      },
      {
        title: 'Llorar',
        artist: 'Jesse & Joy',
        summary: 'Emotional ballad about the cathartic power of tears after heartbreak. Acknowledges that crying is part of healing from lost love. The Mexican duo\'s harmonies convey vulnerability and eventual strength.'
      }
    ];

    for (const { title, artist, summary } of manualSummaries) {
      const song = await prisma.song.findFirst({
        where: {
          title: { contains: title },
          artist: { contains: artist }
        }
      });

      if (song) {
        // Only update if it has the old format
        if (song.songSummary?.includes('From album:')) {
          await prisma.song.update({
            where: { id: song.id },
            data: { songSummary: summary }
          });
          console.log(`✅ Updated: ${title} by ${artist}`);
          console.log(`   New summary: ${summary.split(/\s+/).length} words`);
        } else if (song.songSummary) {
          console.log(`⏭️ Skipped: ${title} by ${artist} (already has summary)`);
        }
      } else {
        console.log(`❌ Not found: ${title} by ${artist}`);
      }
    }

    console.log('\n✅ Level 1 summaries fixed!');

  } catch (error) {
    console.error('❌ Error fixing summaries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLevel1Summaries();