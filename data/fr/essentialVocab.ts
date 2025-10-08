export interface VocabWord {
  french: string
  english: string
  pronunciation?: string
  gender?: 'masculine' | 'feminine' | 'neutral'
  article?: string
}

export interface VocabList {
  id: string
  name: string
  icon: string
  description: string
  words: VocabWord[]
}

export const vocabLists: VocabList[] = [
  {
    id: 'numbers',
    name: 'Numbers',
    icon: '🔢',
    description: 'Essential numbers 0-100',
    words: [
      { french: 'zéro', english: 'zero', pronunciation: 'zay-ROH' },
      { french: 'un', english: 'one', pronunciation: 'uhn' },
      { french: 'deux', english: 'two', pronunciation: 'duh' },
      { french: 'trois', english: 'three', pronunciation: 'trwah' },
      { french: 'quatre', english: 'four', pronunciation: 'KAH-truh' },
      { french: 'cinq', english: 'five', pronunciation: 'sank' },
      { french: 'six', english: 'six', pronunciation: 'seess' },
      { french: 'sept', english: 'seven', pronunciation: 'set' },
      { french: 'huit', english: 'eight', pronunciation: 'weet' },
      { french: 'neuf', english: 'nine', pronunciation: 'nuhf' },
      { french: 'dix', english: 'ten', pronunciation: 'deess' },
      { french: 'vingt', english: 'twenty', pronunciation: 'vehn' },
      { french: 'cent', english: 'one hundred', pronunciation: 'sahn' }
    ]
  },
  {
    id: 'colors',
    name: 'Colors',
    icon: '🎨',
    description: 'Common colors in French',
    words: [
      { french: 'rouge', english: 'red', pronunciation: 'roozh' },
      { french: 'bleu', english: 'blue', pronunciation: 'bluh' },
      { french: 'vert', english: 'green', pronunciation: 'vehr' },
      { french: 'jaune', english: 'yellow', pronunciation: 'zhohn' },
      { french: 'orange', english: 'orange', pronunciation: 'oh-rahnzh' },
      { french: 'violet', english: 'purple', pronunciation: 'vee-oh-leh' },
      { french: 'rose', english: 'pink', pronunciation: 'rohz' },
      { french: 'noir', english: 'black', pronunciation: 'nwahr' },
      { french: 'blanc', english: 'white', pronunciation: 'blahn' },
      { french: 'gris', english: 'gray', pronunciation: 'gree' },
      { french: 'marron', english: 'brown', pronunciation: 'mah-rohn' }
    ]
  },
  {
    id: 'family',
    name: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Family member vocabulary',
    words: [
      { french: 'la famille', english: 'family', pronunciation: 'lah fah-MEE', gender: 'feminine', article: 'la' },
      { french: 'le père', english: 'father', pronunciation: 'luh pehr', gender: 'masculine', article: 'le' },
      { french: 'la mère', english: 'mother', pronunciation: 'lah mehr', gender: 'feminine', article: 'la' },
      { french: 'le frère', english: 'brother', pronunciation: 'luh frehr', gender: 'masculine', article: 'le' },
      { french: 'la sœur', english: 'sister', pronunciation: 'lah suhr', gender: 'feminine', article: 'la' },
      { french: 'le fils', english: 'son', pronunciation: 'luh feess', gender: 'masculine', article: 'le' },
      { french: 'la fille', english: 'daughter', pronunciation: 'lah fee', gender: 'feminine', article: 'la' },
      { french: 'les parents', english: 'parents', pronunciation: 'lay pah-rahn' },
      { french: 'les enfants', english: 'children', pronunciation: 'lay zahn-fahn' },
      { french: 'le grand-père', english: 'grandfather', pronunciation: 'luh grahn-pehr', gender: 'masculine', article: 'le' },
      { french: 'la grand-mère', english: 'grandmother', pronunciation: 'lah grahn-mehr', gender: 'feminine', article: 'la' }
    ]
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍞',
    description: 'Common food and beverage items',
    words: [
      { french: 'le pain', english: 'bread', pronunciation: 'luh pehn', gender: 'masculine', article: 'le' },
      { french: 'l\'eau', english: 'water', pronunciation: 'loh', gender: 'feminine', article: 'l\'' },
      { french: 'le vin', english: 'wine', pronunciation: 'luh vehn', gender: 'masculine', article: 'le' },
      { french: 'le café', english: 'coffee', pronunciation: 'luh kah-fay', gender: 'masculine', article: 'le' },
      { french: 'le thé', english: 'tea', pronunciation: 'luh tay', gender: 'masculine', article: 'le' },
      { french: 'le lait', english: 'milk', pronunciation: 'luh leh', gender: 'masculine', article: 'le' },
      { french: 'le fromage', english: 'cheese', pronunciation: 'luh froh-mahzh', gender: 'masculine', article: 'le' },
      { french: 'la viande', english: 'meat', pronunciation: 'lah vee-ahnd', gender: 'feminine', article: 'la' },
      { french: 'le poisson', english: 'fish', pronunciation: 'luh pwah-sohn', gender: 'masculine', article: 'le' },
      { french: 'les légumes', english: 'vegetables', pronunciation: 'lay lay-goom' },
      { french: 'les fruits', english: 'fruits', pronunciation: 'lay frwee' }
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    icon: '🐕',
    description: 'Common animal vocabulary',
    words: [
      { french: 'le chien', english: 'dog', pronunciation: 'luh shee-ehn', gender: 'masculine', article: 'le' },
      { french: 'le chat', english: 'cat', pronunciation: 'luh shah', gender: 'masculine', article: 'le' },
      { french: 'l\'oiseau', english: 'bird', pronunciation: 'lwah-zoh', gender: 'masculine', article: 'l\'' },
      { french: 'le poisson', english: 'fish', pronunciation: 'luh pwah-sohn', gender: 'masculine', article: 'le' },
      { french: 'le cheval', english: 'horse', pronunciation: 'luh shuh-vahl', gender: 'masculine', article: 'le' },
      { french: 'la vache', english: 'cow', pronunciation: 'lah vahsh', gender: 'feminine', article: 'la' },
      { french: 'le cochon', english: 'pig', pronunciation: 'luh koh-shohn', gender: 'masculine', article: 'le' },
      { french: 'le mouton', english: 'sheep', pronunciation: 'luh moo-tohn', gender: 'masculine', article: 'le' }
    ]
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: '☀️',
    description: 'Weather-related vocabulary',
    words: [
      { french: 'le temps', english: 'weather', pronunciation: 'luh tahn', gender: 'masculine', article: 'le' },
      { french: 'le soleil', english: 'sun', pronunciation: 'luh soh-lay', gender: 'masculine', article: 'le' },
      { french: 'la pluie', english: 'rain', pronunciation: 'lah plwee', gender: 'feminine', article: 'la' },
      { french: 'la neige', english: 'snow', pronunciation: 'lah nehzh', gender: 'feminine', article: 'la' },
      { french: 'le vent', english: 'wind', pronunciation: 'luh vahn', gender: 'masculine', article: 'le' },
      { french: 'le nuage', english: 'cloud', pronunciation: 'luh noo-ahzh', gender: 'masculine', article: 'le' },
      { french: 'Il fait beau', english: 'It\'s nice weather', pronunciation: 'eel feh boh' },
      { french: 'Il fait chaud', english: 'It\'s hot', pronunciation: 'eel feh shoh' },
      { french: 'Il fait froid', english: 'It\'s cold', pronunciation: 'eel feh frwah' },
      { french: 'Il pleut', english: 'It\'s raining', pronunciation: 'eel pluh' }
    ]
  },
  {
    id: 'body',
    name: 'Body Parts',
    icon: '👤',
    description: 'Parts of the body',
    words: [
      { french: 'la tête', english: 'head', pronunciation: 'lah teht', gender: 'feminine', article: 'la' },
      { french: 'les yeux', english: 'eyes', pronunciation: 'lay zyuh' },
      { french: 'le nez', english: 'nose', pronunciation: 'luh nay', gender: 'masculine', article: 'le' },
      { french: 'la bouche', english: 'mouth', pronunciation: 'lah boosh', gender: 'feminine', article: 'la' },
      { french: 'l\'oreille', english: 'ear', pronunciation: 'loh-ray', gender: 'feminine', article: 'l\'' },
      { french: 'le bras', english: 'arm', pronunciation: 'luh brah', gender: 'masculine', article: 'le' },
      { french: 'la main', english: 'hand', pronunciation: 'lah mehn', gender: 'feminine', article: 'la' },
      { french: 'la jambe', english: 'leg', pronunciation: 'lah zhahmb', gender: 'feminine', article: 'la' },
      { french: 'le pied', english: 'foot', pronunciation: 'luh pee-ay', gender: 'masculine', article: 'le' }
    ]
  },
  {
    id: 'days',
    name: 'Days of the Week',
    icon: '📅',
    description: 'Days of the week in French',
    words: [
      { french: 'lundi', english: 'Monday', pronunciation: 'luhn-dee' },
      { french: 'mardi', english: 'Tuesday', pronunciation: 'mahr-dee' },
      { french: 'mercredi', english: 'Wednesday', pronunciation: 'mehr-kruh-dee' },
      { french: 'jeudi', english: 'Thursday', pronunciation: 'zhuh-dee' },
      { french: 'vendredi', english: 'Friday', pronunciation: 'vahn-druh-dee' },
      { french: 'samedi', english: 'Saturday', pronunciation: 'sahm-dee' },
      { french: 'dimanche', english: 'Sunday', pronunciation: 'dee-mahnsh' }
    ]
  }
]
