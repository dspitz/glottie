export interface Phrase {
  french: string
  english: string
  pronunciation?: string
  usage?: string
}

export interface PhraseCategory {
  id: string
  name: string
  icon: string
  description: string
  phrases: Phrase[]
}

export const phraseCategories: PhraseCategory[] = [
  {
    id: 'greetings',
    name: 'Greetings & Goodbyes',
    icon: '👋',
    description: 'Essential phrases for hello and goodbye',
    phrases: [
      { french: 'Bonjour', english: 'Hello / Good morning', pronunciation: 'bohn-ZHOOR' },
      { french: 'Bonsoir', english: 'Good evening', pronunciation: 'bohn-SWAHR' },
      { french: 'Salut', english: 'Hi / Bye (informal)', pronunciation: 'sah-LU' },
      { french: 'Au revoir', english: 'Goodbye', pronunciation: 'oh ruh-VWAHR' },
      { french: 'À bientôt', english: 'See you soon', pronunciation: 'ah bee-ehn-TOH' },
      { french: 'À plus tard', english: 'See you later', pronunciation: 'ah plu TAHR' },
      { french: 'Bonne nuit', english: 'Good night', pronunciation: 'bohn NWEE' },
      { french: 'Enchanté(e)', english: 'Nice to meet you', pronunciation: 'ahn-shahn-TAY' }
    ]
  },
  {
    id: 'pleasantries',
    name: 'Pleasantries',
    icon: '😊',
    description: 'Polite expressions and courtesy phrases',
    phrases: [
      { french: 'S\'il vous plaît', english: 'Please (formal)', pronunciation: 'seel voo PLEH' },
      { french: 'S\'il te plaît', english: 'Please (informal)', pronunciation: 'seel tuh PLEH' },
      { french: 'Merci', english: 'Thank you', pronunciation: 'mehr-SEE' },
      { french: 'Merci beaucoup', english: 'Thank you very much', pronunciation: 'mehr-SEE boh-KOO' },
      { french: 'De rien', english: 'You\'re welcome', pronunciation: 'duh ree-EHN' },
      { french: 'Excusez-moi', english: 'Excuse me (formal)', pronunciation: 'ehk-skew-zay-MWAH' },
      { french: 'Pardon', english: 'Sorry / Excuse me', pronunciation: 'pahr-DOHN' },
      { french: 'Je suis désolé(e)', english: 'I\'m sorry', pronunciation: 'zhuh swee day-zoh-LAY' }
    ]
  },
  {
    id: 'questions',
    name: 'Common Questions',
    icon: '❓',
    description: 'Frequently used question phrases',
    phrases: [
      { french: 'Comment allez-vous?', english: 'How are you? (formal)', pronunciation: 'koh-mahn tah-lay-VOO' },
      { french: 'Comment ça va?', english: 'How are you? (informal)', pronunciation: 'koh-mahn sah VAH' },
      { french: 'Ça va bien', english: 'I\'m fine', pronunciation: 'sah vah bee-EHN' },
      { french: 'Comment vous appelez-vous?', english: 'What is your name? (formal)', pronunciation: 'koh-mahn voo zah-play-VOO' },
      { french: 'Comment tu t\'appelles?', english: 'What is your name? (informal)', pronunciation: 'koh-mahn tu tah-PEHL' },
      { french: 'Parlez-vous anglais?', english: 'Do you speak English?', pronunciation: 'pahr-lay-voo ahn-GLEH' },
      { french: 'Où est...?', english: 'Where is...?', pronunciation: 'oo eh' },
      { french: 'Combien ça coûte?', english: 'How much does it cost?', pronunciation: 'kohm-bee-ehn sah KOOT' }
    ]
  },
  {
    id: 'time',
    name: 'Time Expressions',
    icon: '⏰',
    description: 'Words and phrases related to time',
    phrases: [
      { french: 'Aujourd\'hui', english: 'Today', pronunciation: 'oh-zhoor-DWEE' },
      { french: 'Hier', english: 'Yesterday', pronunciation: 'ee-EHR' },
      { french: 'Demain', english: 'Tomorrow', pronunciation: 'duh-MEHN' },
      { french: 'Maintenant', english: 'Now', pronunciation: 'mehn-tuh-NAHN' },
      { french: 'Plus tard', english: 'Later', pronunciation: 'plu TAHR' },
      { french: 'Bientôt', english: 'Soon', pronunciation: 'bee-ehn-TOH' },
      { french: 'Quelle heure est-il?', english: 'What time is it?', pronunciation: 'kehl uhr eh-TEEL' },
      { french: 'Il est...heures', english: 'It is...o\'clock', pronunciation: 'eel eh...uhr' }
    ]
  },
  {
    id: 'food',
    name: 'Food & Dining',
    icon: '🍽️',
    description: 'Essential dining and food phrases',
    phrases: [
      { french: 'J\'ai faim', english: 'I\'m hungry', pronunciation: 'zhay FEHN' },
      { french: 'J\'ai soif', english: 'I\'m thirsty', pronunciation: 'zhay SWAHF' },
      { french: 'L\'addition, s\'il vous plaît', english: 'The check, please', pronunciation: 'lah-dee-see-OHN seel voo PLEH' },
      { french: 'C\'est délicieux', english: 'It\'s delicious', pronunciation: 'seh day-lee-see-UH' },
      { french: 'Bon appétit', english: 'Enjoy your meal', pronunciation: 'bohn ah-pay-TEE' },
      { french: 'Je voudrais...', english: 'I would like...', pronunciation: 'zhuh voo-DREH' },
      { french: 'Un café, s\'il vous plaît', english: 'A coffee, please', pronunciation: 'uhn kah-FAY seel voo PLEH' },
      { french: 'De l\'eau', english: 'Some water', pronunciation: 'duh LOH' }
    ]
  },
  {
    id: 'directions',
    name: 'Directions',
    icon: '🗺️',
    description: 'Getting around and asking for directions',
    phrases: [
      { french: 'Où est...?', english: 'Where is...?', pronunciation: 'oo eh' },
      { french: 'À gauche', english: 'To the left', pronunciation: 'ah GOHSH' },
      { french: 'À droite', english: 'To the right', pronunciation: 'ah DRWAHT' },
      { french: 'Tout droit', english: 'Straight ahead', pronunciation: 'too DRWAH' },
      { french: 'Près de', english: 'Near', pronunciation: 'preh duh' },
      { french: 'Loin de', english: 'Far from', pronunciation: 'lwehn duh' },
      { french: 'Je suis perdu(e)', english: 'I\'m lost', pronunciation: 'zhuh swee pehr-DU' },
      { french: 'Comment aller à...?', english: 'How to get to...?', pronunciation: 'koh-mahn tah-lay ah' }
    ]
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    description: 'Phrases for shopping and purchases',
    phrases: [
      { french: 'Combien ça coûte?', english: 'How much does it cost?', pronunciation: 'kohm-bee-ehn sah KOOT' },
      { french: 'C\'est trop cher', english: 'It\'s too expensive', pronunciation: 'seh troh SHEHR' },
      { french: 'Je cherche...', english: 'I\'m looking for...', pronunciation: 'zhuh SHEHRSH' },
      { french: 'Quelle taille?', english: 'What size?', pronunciation: 'kehl TIE' },
      { french: 'Je peux essayer?', english: 'Can I try it on?', pronunciation: 'zhuh puh eh-say-YAY' },
      { french: 'Je prends ça', english: 'I\'ll take it', pronunciation: 'zhuh prahn SAH' },
      { french: 'Vous acceptez les cartes?', english: 'Do you accept cards?', pronunciation: 'voo zahk-sep-tay lay KAHRT' }
    ]
  },
  {
    id: 'emergencies',
    name: 'Emergencies',
    icon: '🚨',
    description: 'Important phrases for emergencies',
    phrases: [
      { french: 'Au secours!', english: 'Help!', pronunciation: 'oh suh-KOOR' },
      { french: 'Appelez la police', english: 'Call the police', pronunciation: 'ah-play lah poh-LEES' },
      { french: 'J\'ai besoin d\'un médecin', english: 'I need a doctor', pronunciation: 'zhay buh-ZWEHN duhn mayd-SEHN' },
      { french: 'Où est l\'hôpital?', english: 'Where is the hospital?', pronunciation: 'oo eh loh-pee-TAHL' },
      { french: 'Je ne comprends pas', english: 'I don\'t understand', pronunciation: 'zhuh nuh kohm-prahn PAH' },
      { french: 'Parlez plus lentement', english: 'Speak more slowly', pronunciation: 'pahr-lay plu lahnt-MAHN' }
    ]
  }
]
