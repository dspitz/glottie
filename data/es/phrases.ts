export interface Phrase {
  spanish: string
  english: string
  pronunciation?: string
  usage?: string
}

export interface PhraseCategory {
  id: string
  name: string
  nameSpanish: string
  description: string
  icon: string
  phrases: Phrase[]
}

export const phraseCategories: PhraseCategory[] = [
  {
    id: 'greetings',
    name: 'Greetings',
    nameSpanish: 'Saludos',
    description: 'Essential greetings and farewells',
    icon: '👋',
    phrases: [
      { spanish: 'Hola', english: 'Hello', pronunciation: 'OH-lah', usage: 'Universal greeting for any time of day' },
      { spanish: 'Buenos días', english: 'Good morning', pronunciation: 'BWEH-nohs DEE-ahs', usage: 'Used until noon' },
      { spanish: 'Buenas tardes', english: 'Good afternoon', pronunciation: 'BWEH-nahs TAR-dehs', usage: 'Used from noon until evening' },
      { spanish: 'Buenas noches', english: 'Good evening/night', pronunciation: 'BWEH-nahs NOH-chehs', usage: 'Used after dark or as goodbye at night' },
      { spanish: '¿Qué tal?', english: 'How are you?', pronunciation: 'keh TAHL', usage: 'Informal greeting among friends' },
      { spanish: '¿Cómo estás?', english: 'How are you?', pronunciation: 'KOH-moh ehs-TAHS', usage: 'Informal way to ask how someone is' },
      { spanish: '¿Cómo está?', english: 'How are you?', pronunciation: 'KOH-moh ehs-TAH', usage: 'Formal way to ask how someone is' },
      { spanish: 'Muy bien, gracias', english: 'Very well, thank you', pronunciation: 'mwee bee-EHN, GRAH-see-ahs', usage: 'Standard positive response' },
      { spanish: 'Adiós', english: 'Goodbye', pronunciation: 'ah-dee-OHS', usage: 'Formal farewell' },
      { spanish: 'Hasta luego', english: 'See you later', pronunciation: 'AHS-tah LWEH-goh', usage: 'Casual farewell' },
      { spanish: 'Hasta pronto', english: 'See you soon', pronunciation: 'AHS-tah PROHN-toh', usage: 'When you expect to see them again soon' },
      { spanish: 'Nos vemos', english: 'See you', pronunciation: 'nohs VEH-mohs', usage: 'Very casual farewell among friends' },
      { spanish: 'Chao', english: 'Bye', pronunciation: 'chow', usage: 'Informal goodbye, borrowed from Italian' }
    ]
  },
  {
    id: 'courtesy',
    name: 'Courtesy',
    nameSpanish: 'Cortesía',
    description: 'Polite expressions and manners',
    icon: '🙏',
    phrases: [
      { spanish: 'Por favor', english: 'Please', pronunciation: 'pohr fah-VOHR', usage: 'Essential for polite requests' },
      { spanish: 'Gracias', english: 'Thank you', pronunciation: 'GRAH-see-ahs', usage: 'Universal expression of gratitude' },
      { spanish: 'Muchas gracias', english: 'Thank you very much', pronunciation: 'MOO-chahs GRAH-see-ahs', usage: 'Stronger expression of gratitude' },
      { spanish: 'De nada', english: 'You\'re welcome', pronunciation: 'deh NAH-dah', usage: 'Standard response to "gracias"' },
      { spanish: 'Perdón', english: 'Excuse me/Sorry', pronunciation: 'pehr-DOHN', usage: 'To apologize or get attention' },
      { spanish: 'Disculpe', english: 'Excuse me', pronunciation: 'dees-KOOL-peh', usage: 'Formal way to get someone\'s attention' },
      { spanish: 'Lo siento', english: 'I\'m sorry', pronunciation: 'loh see-EHN-toh', usage: 'To express regret or sympathy' },
      { spanish: 'Con permiso', english: 'Excuse me', pronunciation: 'kohn pehr-MEE-soh', usage: 'When passing through or leaving' },
      { spanish: 'Salud', english: 'Bless you/Cheers', pronunciation: 'sah-LOOD', usage: 'After sneezing or when toasting' },
      { spanish: 'Buen provecho', english: 'Enjoy your meal', pronunciation: 'bwehn proh-VEH-choh', usage: 'Said before or during a meal' },
      { spanish: 'Felicidades', english: 'Congratulations', pronunciation: 'feh-lee-see-DAH-dehs', usage: 'To congratulate someone' }
    ]
  },
  {
    id: 'questions',
    name: 'Questions',
    nameSpanish: 'Preguntas',
    description: 'Common question words and phrases',
    icon: '❓',
    phrases: [
      { spanish: '¿Qué?', english: 'What?', pronunciation: 'keh', usage: 'To ask about things or clarify' },
      { spanish: '¿Quién?', english: 'Who?', pronunciation: 'kee-EHN', usage: 'To ask about people' },
      { spanish: '¿Dónde?', english: 'Where?', pronunciation: 'DOHN-deh', usage: 'To ask about location' },
      { spanish: '¿Cuándo?', english: 'When?', pronunciation: 'KWAHN-doh', usage: 'To ask about time' },
      { spanish: '¿Por qué?', english: 'Why?', pronunciation: 'pohr KEH', usage: 'To ask for reasons' },
      { spanish: '¿Cómo?', english: 'How?', pronunciation: 'KOH-moh', usage: 'To ask about manner or method' },
      { spanish: '¿Cuánto?', english: 'How much?', pronunciation: 'KWAHN-toh', usage: 'To ask about quantity or price' },
      { spanish: '¿Cuál?', english: 'Which?', pronunciation: 'kwahl', usage: 'To ask about choice or selection' },
      { spanish: '¿Hablas inglés?', english: 'Do you speak English?', pronunciation: 'AH-blahs een-GLEHS', usage: 'Useful when traveling' },
      { spanish: '¿Cuánto cuesta?', english: 'How much does it cost?', pronunciation: 'KWAHN-toh KWEHS-tah', usage: 'Essential for shopping' },
      { spanish: '¿Dónde está el baño?', english: 'Where is the bathroom?', pronunciation: 'DOHN-deh ehs-TAH ehl BAH-nyoh', usage: 'Important practical question' },
      { spanish: '¿Cómo te llamas?', english: 'What\'s your name?', pronunciation: 'KOH-moh teh YAH-mahs', usage: 'Informal introduction' },
      { spanish: '¿De dónde eres?', english: 'Where are you from?', pronunciation: 'deh DOHN-deh EH-rehs', usage: 'To ask about origin' }
    ]
  },
  {
    id: 'time',
    name: 'Time',
    nameSpanish: 'Tiempo',
    description: 'Expressions related to time',
    icon: '⏰',
    phrases: [
      { spanish: '¿Qué hora es?', english: 'What time is it?', pronunciation: 'keh OH-rah ehs', usage: 'To ask the time' },
      { spanish: 'Ahora', english: 'Now', pronunciation: 'ah-OH-rah', usage: 'Refers to current moment' },
      { spanish: 'Hoy', english: 'Today', pronunciation: 'oy', usage: 'Refers to current day' },
      { spanish: 'Mañana', english: 'Tomorrow', pronunciation: 'mah-NYAH-nah', usage: 'Refers to next day' },
      { spanish: 'Ayer', english: 'Yesterday', pronunciation: 'ah-YEHR', usage: 'Refers to previous day' },
      { spanish: 'Esta mañana', english: 'This morning', pronunciation: 'EHS-tah mah-NYAH-nah', usage: 'Earlier today before noon' },
      { spanish: 'Esta tarde', english: 'This afternoon', pronunciation: 'EHS-tah TAR-deh', usage: 'Later today after noon' },
      { spanish: 'Esta noche', english: 'Tonight', pronunciation: 'EHS-tah NOH-cheh', usage: 'Later today after dark' },
      { spanish: 'La semana que viene', english: 'Next week', pronunciation: 'lah seh-MAH-nah keh vee-EH-neh', usage: 'Refers to upcoming week' },
      { spanish: 'El año pasado', english: 'Last year', pronunciation: 'ehl AH-nyoh pah-SAH-doh', usage: 'Refers to previous year' },
      { spanish: 'Siempre', english: 'Always', pronunciation: 'see-EHM-preh', usage: 'Refers to all the time' },
      { spanish: 'Nunca', english: 'Never', pronunciation: 'NOON-kah', usage: 'Refers to no time' },
      { spanish: 'A veces', english: 'Sometimes', pronunciation: 'ah VEH-sehs', usage: 'Refers to occasional times' }
    ]
  },
  {
    id: 'emotions',
    name: 'Emotions',
    nameSpanish: 'Emociones',
    description: 'Expressing feelings and states',
    icon: '😊',
    phrases: [
      { spanish: 'Estoy feliz', english: 'I\'m happy', pronunciation: 'ehs-TOY feh-LEES', usage: 'To express happiness' },
      { spanish: 'Estoy triste', english: 'I\'m sad', pronunciation: 'ehs-TOY TREES-teh', usage: 'To express sadness' },
      { spanish: 'Estoy cansado/a', english: 'I\'m tired', pronunciation: 'ehs-TOY kahn-SAH-doh/dah', usage: 'To express fatigue' },
      { spanish: 'Tengo hambre', english: 'I\'m hungry', pronunciation: 'TEHN-goh AHM-breh', usage: 'To express hunger' },
      { spanish: 'Tengo sed', english: 'I\'m thirsty', pronunciation: 'TEHN-goh sehd', usage: 'To express thirst' },
      { spanish: 'Tengo frío', english: 'I\'m cold', pronunciation: 'TEHN-goh FREE-oh', usage: 'To express being cold' },
      { spanish: 'Tengo calor', english: 'I\'m hot', pronunciation: 'TEHN-goh kah-LOHR', usage: 'To express being hot' },
      { spanish: 'Tengo sueño', english: 'I\'m sleepy', pronunciation: 'TEHN-goh SWEH-nyoh', usage: 'To express sleepiness' },
      { spanish: 'Estoy emocionado/a', english: 'I\'m excited', pronunciation: 'ehs-TOY eh-moh-see-oh-NAH-doh/dah', usage: 'To express excitement' },
      { spanish: 'Estoy nervioso/a', english: 'I\'m nervous', pronunciation: 'ehs-TOY nehr-vee-OH-soh/sah', usage: 'To express nervousness' },
      { spanish: 'Me siento bien', english: 'I feel good', pronunciation: 'meh see-EHN-toh bee-EHN', usage: 'To express wellness' },
      { spanish: 'Me siento mal', english: 'I feel bad', pronunciation: 'meh see-EHN-toh mahl', usage: 'To express unwellness' }
    ]
  },
  {
    id: 'activities',
    name: 'Activities',
    nameSpanish: 'Actividades',
    description: 'Common actions and activities',
    icon: '🏃',
    phrases: [
      { spanish: 'Voy a...', english: 'I\'m going to...', pronunciation: 'voy ah', usage: 'To express immediate future plans' },
      { spanish: 'Me gusta...', english: 'I like...', pronunciation: 'meh GOOS-tah', usage: 'To express preference' },
      { spanish: 'Quiero...', english: 'I want...', pronunciation: 'kee-EH-roh', usage: 'To express desire' },
      { spanish: 'Necesito...', english: 'I need...', pronunciation: 'neh-seh-SEE-toh', usage: 'To express necessity' },
      { spanish: 'Puedo...', english: 'I can...', pronunciation: 'PWEH-doh', usage: 'To express ability' },
      { spanish: '¿Puedes ayudarme?', english: 'Can you help me?', pronunciation: 'PWEH-dehs ah-yoo-DAHR-meh', usage: 'To request assistance' },
      { spanish: 'Vamos', english: 'Let\'s go', pronunciation: 'VAH-mohs', usage: 'To suggest leaving or starting' },
      { spanish: 'Espera', english: 'Wait', pronunciation: 'ehs-PEH-rah', usage: 'To ask someone to wait' },
      { spanish: 'No entiendo', english: 'I don\'t understand', pronunciation: 'noh ehn-tee-EHN-doh', usage: 'When you need clarification' },
      { spanish: '¿Entiendes?', english: 'Do you understand?', pronunciation: 'ehn-tee-EHN-dehs', usage: 'To check comprehension' },
      { spanish: 'No sé', english: 'I don\'t know', pronunciation: 'noh SEH', usage: 'To express lack of knowledge' },
      { spanish: 'Claro', english: 'Of course', pronunciation: 'KLAH-roh', usage: 'To express agreement' },
      { spanish: 'Está bien', english: 'It\'s okay/fine', pronunciation: 'ehs-TAH bee-EHN', usage: 'To express acceptance' },
      { spanish: 'No importa', english: 'It doesn\'t matter', pronunciation: 'noh eem-POHR-tah', usage: 'To dismiss importance' }
    ]
  },
  {
    id: 'introductions',
    name: 'Introductions',
    nameSpanish: 'Presentaciones',
    description: 'Introducing yourself and others',
    icon: '🤝',
    phrases: [
      { spanish: 'Me llamo...', english: 'My name is...', pronunciation: 'meh YAH-moh', usage: 'To introduce yourself' },
      { spanish: 'Soy...', english: 'I am...', pronunciation: 'soy', usage: 'To state identity or profession' },
      { spanish: 'Mucho gusto', english: 'Nice to meet you', pronunciation: 'MOO-choh GOOS-toh', usage: 'After being introduced' },
      { spanish: 'Encantado/a', english: 'Pleased to meet you', pronunciation: 'ehn-kahn-TAH-doh/dah', usage: 'Formal way to say nice to meet you' },
      { spanish: 'Igualmente', english: 'Likewise', pronunciation: 'ee-gwahl-MEHN-teh', usage: 'Response to "mucho gusto"' },
      { spanish: 'Te presento a...', english: 'I introduce you to...', pronunciation: 'teh preh-SEHN-toh ah', usage: 'To introduce someone informally' },
      { spanish: 'Le presento a...', english: 'I introduce you to...', pronunciation: 'leh preh-SEHN-toh ah', usage: 'To introduce someone formally' },
      { spanish: 'Soy de...', english: 'I\'m from...', pronunciation: 'soy deh', usage: 'To state place of origin' },
      { spanish: 'Vivo en...', english: 'I live in...', pronunciation: 'VEE-voh ehn', usage: 'To state current residence' },
      { spanish: 'Tengo ... años', english: 'I am ... years old', pronunciation: 'TEHN-goh ... AH-nyohs', usage: 'To state age' }
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    nameSpanish: 'Viajes',
    description: 'Useful phrases for travelers',
    icon: '✈️',
    phrases: [
      { spanish: '¿Dónde está...?', english: 'Where is...?', pronunciation: 'DOHN-deh ehs-TAH', usage: 'To ask for location' },
      { spanish: 'Estoy perdido/a', english: 'I\'m lost', pronunciation: 'ehs-TOY pehr-DEE-doh/dah', usage: 'When you need directions' },
      { spanish: '¿Cuánto cuesta?', english: 'How much does it cost?', pronunciation: 'KWAHN-toh KWEHS-tah', usage: 'To ask price' },
      { spanish: 'La cuenta, por favor', english: 'The check, please', pronunciation: 'lah KWEHN-tah, pohr fah-VOHR', usage: 'At restaurant' },
      { spanish: 'Una mesa para dos', english: 'A table for two', pronunciation: 'OO-nah MEH-sah PAH-rah dohs', usage: 'At restaurant' },
      { spanish: '¿Tiene wifi?', english: 'Do you have wifi?', pronunciation: 'tee-EH-neh WEE-fee', usage: 'At hotel or café' },
      { spanish: 'No hablo español muy bien', english: 'I don\'t speak Spanish very well', pronunciation: 'noh AH-bloh ehs-pah-NYOHL mwee bee-EHN', usage: 'To express language limitation' },
      { spanish: '¿Puede repetir?', english: 'Can you repeat?', pronunciation: 'PWEH-deh reh-peh-TEER', usage: 'When you didn\'t understand' },
      { spanish: 'Más despacio, por favor', english: 'More slowly, please', pronunciation: 'mahs dehs-PAH-see-oh, pohr fah-VOHR', usage: 'When someone speaks too fast' }
    ]
  }
]
