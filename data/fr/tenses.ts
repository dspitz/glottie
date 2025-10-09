export interface VerbConjugation {
  je: string
  tu: string
  il: string
  nous: string
  vous: string
  ils: string
}

export interface VerbExample {
  infinitive: string
  english: string
  conjugations: VerbConjugation
}

export interface Tense {
  id: string
  name: string
  nameFrench: string
  description: string
  briefUsage: string
  examplePhrase: {
    french: string
    english: string
  }
  whenToUse: Array<string | { rule: string; example: string }>
  regularPatterns: {
    er: VerbConjugation
    ir: VerbConjugation
    re: VerbConjugation
  }
  regularExamples: VerbExample[]
  irregularExamples: VerbExample[]
  exampleSentences: Array<{
    french: string
    english: string
  }>
}

export const tenses: Tense[] = [
  {
    id: 'present',
    name: 'Present',
    nameFrench: 'Présent',
    description: 'Describes actions happening now or habitual actions',
    briefUsage: 'For current or habitual actions',
    examplePhrase: {
      french: 'Je parle français',
      english: 'I speak French'
    },
    whenToUse: [
      { rule: 'Actions happening right now', example: 'Je parle français maintenant' },
      { rule: 'Habitual or repeated actions', example: 'Je vais au café tous les jours' },
      { rule: 'General truths or facts', example: 'Le soleil se lève à l\'est' },
      { rule: 'Planned future actions (near future)', example: 'Le train part à 15h' }
    ],
    regularPatterns: {
      er: {
        je: 'parle',
        tu: 'parles',
        il: 'parle',
        nous: 'parlons',
        vous: 'parlez',
        ils: 'parlent'
      },
      ir: {
        je: 'finis',
        tu: 'finis',
        il: 'finit',
        nous: 'finissons',
        vous: 'finissez',
        ils: 'finissent'
      },
      re: {
        je: 'vends',
        tu: 'vends',
        il: 'vend',
        nous: 'vendons',
        vous: 'vendez',
        ils: 'vendent'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'parle',
          tu: 'parles',
          il: 'parle',
          nous: 'parlons',
          vous: 'parlez',
          ils: 'parlent'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'finis',
          tu: 'finis',
          il: 'finit',
          nous: 'finissons',
          vous: 'finissez',
          ils: 'finissent'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'suis',
          tu: 'es',
          il: 'est',
          nous: 'sommes',
          vous: 'êtes',
          ils: 'sont'
        }
      },
      {
        infinitive: 'avoir (to have)',
        english: 'to have',
        conjugations: {
          je: 'ai',
          tu: 'as',
          il: 'a',
          nous: 'avons',
          vous: 'avez',
          ils: 'ont'
        }
      }
    ],
    exampleSentences: [
      { french: 'Je parle français', english: 'I speak French' },
      { french: 'Tu manges une pomme', english: 'You eat an apple' },
      { french: 'Il finit ses devoirs', english: 'He finishes his homework' }
    ]
  },
  {
    id: 'passe-compose',
    name: 'Passé Composé',
    nameFrench: 'Passé Composé',
    description: 'Describes completed actions in the past',
    briefUsage: 'For completed past actions',
    examplePhrase: {
      french: "J'ai parlé français",
      english: 'I spoke French'
    },
    whenToUse: [
      { rule: 'Completed actions in the past', example: 'J\'ai fini mes devoirs hier' },
      { rule: 'Actions with a clear beginning and end', example: 'Elle a mangé à midi' },
      { rule: 'Series of completed actions', example: 'J\'ai ouvert la porte et j\'ai dit bonjour' }
    ],
    regularPatterns: {
      er: {
        je: 'ai parlé',
        tu: 'as parlé',
        il: 'a parlé',
        nous: 'avons parlé',
        vous: 'avez parlé',
        ils: 'ont parlé'
      },
      ir: {
        je: 'ai fini',
        tu: 'as fini',
        il: 'a fini',
        nous: 'avons fini',
        vous: 'avez fini',
        ils: 'ont fini'
      },
      re: {
        je: 'ai vendu',
        tu: 'as vendu',
        il: 'a vendu',
        nous: 'avons vendu',
        vous: 'avez vendu',
        ils: 'ont vendu'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'ai parlé',
          tu: 'as parlé',
          il: 'a parlé',
          nous: 'avons parlé',
          vous: 'avez parlé',
          ils: 'ont parlé'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'ai été',
          tu: 'as été',
          il: 'a été',
          nous: 'avons été',
          vous: 'avez été',
          ils: 'ont été'
        }
      }
    ],
    exampleSentences: [
      { french: "J'ai mangé une pomme", english: 'I ate an apple' },
      { french: 'Elle a fini son travail', english: 'She finished her work' }
    ]
  },
  {
    id: 'imparfait',
    name: 'Imperfect',
    nameFrench: 'Imparfait',
    description: 'Describes ongoing or habitual actions in the past',
    briefUsage: 'For ongoing past actions or habits',
    examplePhrase: {
      french: 'Je parlais français',
      english: 'I was speaking French / I used to speak French'
    },
    whenToUse: [
      { rule: 'Ongoing actions in the past', example: 'Je regardais la télé quand il est arrivé' },
      { rule: 'Habitual actions in the past', example: 'Quand j\'étais jeune, je jouais au football' },
      { rule: 'Descriptions in the past', example: 'Il faisait beau ce jour-là' },
      { rule: 'Background information', example: 'La maison était grande et belle' }
    ],
    regularPatterns: {
      er: {
        je: 'parlais',
        tu: 'parlais',
        il: 'parlait',
        nous: 'parlions',
        vous: 'parliez',
        ils: 'parlaient'
      },
      ir: {
        je: 'finissais',
        tu: 'finissais',
        il: 'finissait',
        nous: 'finissions',
        vous: 'finissiez',
        ils: 'finissaient'
      },
      re: {
        je: 'vendais',
        tu: 'vendais',
        il: 'vendait',
        nous: 'vendions',
        vous: 'vendiez',
        ils: 'vendaient'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'parlais',
          tu: 'parlais',
          il: 'parlait',
          nous: 'parlions',
          vous: 'parliez',
          ils: 'parlaient'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'étais',
          tu: 'étais',
          il: 'était',
          nous: 'étions',
          vous: 'étiez',
          ils: 'étaient'
        }
      }
    ],
    exampleSentences: [
      { french: 'Quand j\'étais jeune, je jouais au football', english: 'When I was young, I used to play soccer' },
      { french: 'Il faisait beau', english: 'The weather was nice' }
    ]
  },
  {
    id: 'futur-simple',
    name: 'Simple Future',
    nameFrench: 'Futur Simple',
    description: 'Describes actions that will happen in the future',
    briefUsage: 'For future actions and predictions',
    examplePhrase: {
      french: 'Je parlerai demain',
      english: 'I will speak tomorrow'
    },
    whenToUse: [
      { rule: 'Actions that will occur in the future', example: 'Je parlerai avec lui demain' },
      { rule: 'Predictions and suppositions', example: 'Il fera beau demain' },
      { rule: 'Formal promises', example: 'Je vous appellerai sans faute' },
      { rule: 'Commands or instructions for the future', example: 'Vous ferez vos devoirs ce soir' }
    ],
    regularPatterns: {
      er: {
        je: 'parlerai',
        tu: 'parleras',
        il: 'parlera',
        nous: 'parlerons',
        vous: 'parlerez',
        ils: 'parleront'
      },
      ir: {
        je: 'finirai',
        tu: 'finiras',
        il: 'finira',
        nous: 'finirons',
        vous: 'finirez',
        ils: 'finiront'
      },
      re: {
        je: 'vendrai',
        tu: 'vendras',
        il: 'vendra',
        nous: 'vendrons',
        vous: 'vendrez',
        ils: 'vendront'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'parlerai',
          tu: 'parleras',
          il: 'parlera',
          nous: 'parlerons',
          vous: 'parlerez',
          ils: 'parleront'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'finirai',
          tu: 'finiras',
          il: 'finira',
          nous: 'finirons',
          vous: 'finirez',
          ils: 'finiront'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'serai',
          tu: 'seras',
          il: 'sera',
          nous: 'serons',
          vous: 'serez',
          ils: 'seront'
        }
      },
      {
        infinitive: 'avoir (to have)',
        english: 'to have',
        conjugations: {
          je: 'aurai',
          tu: 'auras',
          il: 'aura',
          nous: 'aurons',
          vous: 'aurez',
          ils: 'auront'
        }
      },
      {
        infinitive: 'aller (to go)',
        english: 'to go',
        conjugations: {
          je: 'irai',
          tu: 'iras',
          il: 'ira',
          nous: 'irons',
          vous: 'irez',
          ils: 'iront'
        }
      }
    ],
    exampleSentences: [
      { french: 'Demain, je parlerai avec mon professeur', english: 'Tomorrow, I will speak with my teacher' },
      { french: 'Nous finirons le projet la semaine prochaine', english: 'We will finish the project next week' },
      { french: 'Elle sera heureuse de te voir', english: 'She will be happy to see you' }
    ]
  },
  {
    id: 'conditionnel',
    name: 'Conditional',
    nameFrench: 'Conditionnel Présent',
    description: 'Describes what would happen under certain conditions',
    briefUsage: 'For hypothetical situations and polite requests',
    examplePhrase: {
      french: 'Je parlerais avec lui',
      english: 'I would speak with him'
    },
    whenToUse: [
      { rule: 'Hypothetical situations', example: 'Si j\'avais de l\'argent, je voyagerais' },
      { rule: 'Polite requests or suggestions', example: 'Pourriez-vous m\'aider?' },
      { rule: 'Expressing desires politely', example: 'Je voudrais un café' },
      { rule: 'Softening statements', example: 'Je dirais que c\'est une bonne idée' },
      { rule: 'Future from a past perspective', example: 'Il a dit qu\'il viendrait' }
    ],
    regularPatterns: {
      er: {
        je: 'parlerais',
        tu: 'parlerais',
        il: 'parlerait',
        nous: 'parlerions',
        vous: 'parleriez',
        ils: 'parleraient'
      },
      ir: {
        je: 'finirais',
        tu: 'finirais',
        il: 'finirait',
        nous: 'finirions',
        vous: 'finiriez',
        ils: 'finiraient'
      },
      re: {
        je: 'vendrais',
        tu: 'vendrais',
        il: 'vendrait',
        nous: 'vendrions',
        vous: 'vendriez',
        ils: 'vendraient'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'parlerais',
          tu: 'parlerais',
          il: 'parlerait',
          nous: 'parlerions',
          vous: 'parleriez',
          ils: 'parleraient'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'finirais',
          tu: 'finirais',
          il: 'finirait',
          nous: 'finirions',
          vous: 'finiriez',
          ils: 'finiraient'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'serais',
          tu: 'serais',
          il: 'serait',
          nous: 'serions',
          vous: 'seriez',
          ils: 'seraient'
        }
      },
      {
        infinitive: 'avoir (to have)',
        english: 'to have',
        conjugations: {
          je: 'aurais',
          tu: 'aurais',
          il: 'aurait',
          nous: 'aurions',
          vous: 'auriez',
          ils: 'auraient'
        }
      },
      {
        infinitive: 'faire (to do/make)',
        english: 'to do/make',
        conjugations: {
          je: 'ferais',
          tu: 'ferais',
          il: 'ferait',
          nous: 'ferions',
          vous: 'feriez',
          ils: 'feraient'
        }
      }
    ],
    exampleSentences: [
      { french: 'Je voudrais un café, s\'il vous plaît', english: 'I would like a coffee, please' },
      { french: 'Tu pourrais m\'aider?', english: 'Could you help me?' },
      { french: 'Nous aimerions visiter Paris', english: 'We would like to visit Paris' }
    ]
  },
  {
    id: 'subjonctif-present',
    name: 'Present Subjunctive',
    nameFrench: 'Subjonctif Présent',
    description: 'Expresses doubt, desire, emotion, or necessity in the present',
    briefUsage: 'For doubt, desire, or emotion',
    examplePhrase: {
      french: 'Il faut que je parle',
      english: 'I must speak / It\'s necessary that I speak'
    },
    whenToUse: [
      { rule: 'After expressions of necessity (il faut que)', example: 'Il faut que tu viennes' },
      { rule: 'After expressions of doubt or uncertainty', example: 'Je doute qu\'il soit là' },
      { rule: 'After expressions of emotion', example: 'Je suis content que tu sois là' },
      { rule: 'After expressions of desire or will', example: 'Je veux que tu réussisses' },
      { rule: 'After certain conjunctions (bien que, pour que, etc.)', example: 'Bien qu\'il pleuve, je sors' }
    ],
    regularPatterns: {
      er: {
        je: 'parle',
        tu: 'parles',
        il: 'parle',
        nous: 'parlions',
        vous: 'parliez',
        ils: 'parlent'
      },
      ir: {
        je: 'finisse',
        tu: 'finisses',
        il: 'finisse',
        nous: 'finissions',
        vous: 'finissiez',
        ils: 'finissent'
      },
      re: {
        je: 'vende',
        tu: 'vendes',
        il: 'vende',
        nous: 'vendions',
        vous: 'vendiez',
        ils: 'vendent'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'parle',
          tu: 'parles',
          il: 'parle',
          nous: 'parlions',
          vous: 'parliez',
          ils: 'parlent'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'finisse',
          tu: 'finisses',
          il: 'finisse',
          nous: 'finissions',
          vous: 'finissiez',
          ils: 'finissent'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'sois',
          tu: 'sois',
          il: 'soit',
          nous: 'soyons',
          vous: 'soyez',
          ils: 'soient'
        }
      },
      {
        infinitive: 'avoir (to have)',
        english: 'to have',
        conjugations: {
          je: 'aie',
          tu: 'aies',
          il: 'ait',
          nous: 'ayons',
          vous: 'ayez',
          ils: 'aient'
        }
      },
      {
        infinitive: 'aller (to go)',
        english: 'to go',
        conjugations: {
          je: 'aille',
          tu: 'ailles',
          il: 'aille',
          nous: 'allions',
          vous: 'alliez',
          ils: 'aillent'
        }
      }
    ],
    exampleSentences: [
      { french: 'Il faut que tu parles avec elle', english: 'You must speak with her' },
      { french: 'Je veux que vous finissiez vos devoirs', english: 'I want you to finish your homework' },
      { french: 'Bien qu\'il soit tard, je vais continuer', english: 'Although it\'s late, I\'m going to continue' }
    ]
  },
  {
    id: 'plus-que-parfait',
    name: 'Pluperfect',
    nameFrench: 'Plus-que-Parfait',
    description: 'Describes actions that had happened before another past action',
    briefUsage: 'For actions completed before another past action',
    examplePhrase: {
      french: 'J\'avais déjà parlé',
      english: 'I had already spoken'
    },
    whenToUse: [
      { rule: 'Actions completed before another past action', example: 'J\'avais déjà mangé quand il est arrivé' },
      { rule: 'Background information in past narratives', example: 'Elle avait vécu à Paris avant' },
      { rule: 'Expressing regret about the past', example: 'Si j\'avais su, je serais venu' },
      { rule: 'In reported speech for past perfect', example: 'Il a dit qu\'il avait fini' }
    ],
    regularPatterns: {
      er: {
        je: 'avais parlé',
        tu: 'avais parlé',
        il: 'avait parlé',
        nous: 'avions parlé',
        vous: 'aviez parlé',
        ils: 'avaient parlé'
      },
      ir: {
        je: 'avais fini',
        tu: 'avais fini',
        il: 'avait fini',
        nous: 'avions fini',
        vous: 'aviez fini',
        ils: 'avaient fini'
      },
      re: {
        je: 'avais vendu',
        tu: 'avais vendu',
        il: 'avait vendu',
        nous: 'avions vendu',
        vous: 'aviez vendu',
        ils: 'avaient vendu'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'avais parlé',
          tu: 'avais parlé',
          il: 'avait parlé',
          nous: 'avions parlé',
          vous: 'aviez parlé',
          ils: 'avaient parlé'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'avais fini',
          tu: 'avais fini',
          il: 'avait fini',
          nous: 'avions fini',
          vous: 'aviez fini',
          ils: 'avaient fini'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'avais été',
          tu: 'avais été',
          il: 'avait été',
          nous: 'avions été',
          vous: 'aviez été',
          ils: 'avaient été'
        }
      },
      {
        infinitive: 'faire (to do/make)',
        english: 'to do/make',
        conjugations: {
          je: 'avais fait',
          tu: 'avais fait',
          il: 'avait fait',
          nous: 'avions fait',
          vous: 'aviez fait',
          ils: 'avaient fait'
        }
      }
    ],
    exampleSentences: [
      { french: 'J\'avais déjà mangé quand il est arrivé', english: 'I had already eaten when he arrived' },
      { french: 'Elle avait fini ses devoirs avant de sortir', english: 'She had finished her homework before going out' },
      { french: 'Nous avions vécu à Paris pendant deux ans', english: 'We had lived in Paris for two years' }
    ]
  },
  {
    id: 'futur-anterieur',
    name: 'Future Perfect',
    nameFrench: 'Futur Antérieur',
    description: 'Describes actions that will have been completed by a certain time in the future',
    briefUsage: 'For actions that will be completed by a future time',
    examplePhrase: {
      french: 'J\'aurai fini demain',
      english: 'I will have finished tomorrow'
    },
    whenToUse: [
      { rule: 'Actions that will be completed before a future time', example: 'J\'aurai fini avant midi' },
      { rule: 'Expressing supposition about the past', example: 'Il aura oublié ses clés' },
      { rule: 'After conjunctions of time (quand, lorsque, dès que)', example: 'Quand tu arriveras, j\'aurai déjà mangé' },
      { rule: 'Probability or assumption', example: 'Elle aura manqué le train' }
    ],
    regularPatterns: {
      er: {
        je: 'aurai parlé',
        tu: 'auras parlé',
        il: 'aura parlé',
        nous: 'aurons parlé',
        vous: 'aurez parlé',
        ils: 'auront parlé'
      },
      ir: {
        je: 'aurai fini',
        tu: 'auras fini',
        il: 'aura fini',
        nous: 'aurons fini',
        vous: 'aurez fini',
        ils: 'auront fini'
      },
      re: {
        je: 'aurai vendu',
        tu: 'auras vendu',
        il: 'aura vendu',
        nous: 'aurons vendu',
        vous: 'aurez vendu',
        ils: 'auront vendu'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'aurai parlé',
          tu: 'auras parlé',
          il: 'aura parlé',
          nous: 'aurons parlé',
          vous: 'aurez parlé',
          ils: 'auront parlé'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'aurai fini',
          tu: 'auras fini',
          il: 'aura fini',
          nous: 'aurons fini',
          vous: 'aurez fini',
          ils: 'auront fini'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'aurai été',
          tu: 'auras été',
          il: 'aura été',
          nous: 'aurons été',
          vous: 'aurez été',
          ils: 'auront été'
        }
      },
      {
        infinitive: 'faire (to do/make)',
        english: 'to do/make',
        conjugations: {
          je: 'aurai fait',
          tu: 'auras fait',
          il: 'aura fait',
          nous: 'aurons fait',
          vous: 'aurez fait',
          ils: 'auront fait'
        }
      }
    ],
    exampleSentences: [
      { french: 'J\'aurai fini mon travail avant midi', english: 'I will have finished my work before noon' },
      { french: 'Quand tu arriveras, j\'aurai déjà mangé', english: 'When you arrive, I will have already eaten' },
      { french: 'Elle aura parlé avec lui d\'ici demain', english: 'She will have spoken with him by tomorrow' }
    ]
  },
  {
    id: 'passe-simple',
    name: 'Simple Past',
    nameFrench: 'Passé Simple',
    description: 'Literary past tense used primarily in formal writing and literature',
    briefUsage: 'For completed past actions in literature',
    examplePhrase: {
      french: 'Il parla longuement',
      english: 'He spoke at length'
    },
    whenToUse: [
      { rule: 'Formal writing and literature', example: 'Le roi parla à son peuple' },
      { rule: 'Historical narratives', example: 'Napoléon conquit l\'Europe' },
      { rule: 'Fairy tales and stories', example: 'Il était une fois un prince qui vécut longtemps' },
      { rule: 'Completed actions in formal contexts', example: 'Elle finit son discours et sortit' }
    ],
    regularPatterns: {
      er: {
        je: 'parlai',
        tu: 'parlas',
        il: 'parla',
        nous: 'parlâmes',
        vous: 'parlâtes',
        ils: 'parlèrent'
      },
      ir: {
        je: 'finis',
        tu: 'finis',
        il: 'finit',
        nous: 'finîmes',
        vous: 'finîtes',
        ils: 'finirent'
      },
      re: {
        je: 'vendis',
        tu: 'vendis',
        il: 'vendit',
        nous: 'vendîmes',
        vous: 'vendîtes',
        ils: 'vendirent'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'parlai',
          tu: 'parlas',
          il: 'parla',
          nous: 'parlâmes',
          vous: 'parlâtes',
          ils: 'parlèrent'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'finis',
          tu: 'finis',
          il: 'finit',
          nous: 'finîmes',
          vous: 'finîtes',
          ils: 'finirent'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'fus',
          tu: 'fus',
          il: 'fut',
          nous: 'fûmes',
          vous: 'fûtes',
          ils: 'furent'
        }
      },
      {
        infinitive: 'avoir (to have)',
        english: 'to have',
        conjugations: {
          je: 'eus',
          tu: 'eus',
          il: 'eut',
          nous: 'eûmes',
          vous: 'eûtes',
          ils: 'eurent'
        }
      },
      {
        infinitive: 'faire (to do/make)',
        english: 'to do/make',
        conjugations: {
          je: 'fis',
          tu: 'fis',
          il: 'fit',
          nous: 'fîmes',
          vous: 'fîtes',
          ils: 'firent'
        }
      }
    ],
    exampleSentences: [
      { french: 'Le roi parla à son peuple', english: 'The king spoke to his people' },
      { french: 'Elle finit son repas et sortit', english: 'She finished her meal and left' },
      { french: 'Ils furent très heureux', english: 'They were very happy' }
    ]
  },
  {
    id: 'subjonctif-imparfait',
    name: 'Imperfect Subjunctive',
    nameFrench: 'Subjonctif Imparfait',
    description: 'Literary subjunctive used primarily in formal writing to express past doubt or desire',
    briefUsage: 'For literary past subjunctive mood',
    examplePhrase: {
      french: 'Il fallait que je parlasse',
      english: 'It was necessary that I speak'
    },
    whenToUse: [
      { rule: 'Formal or literary writing', example: 'Il fallait que je parlasse avec lui' },
      { rule: 'After past expressions requiring subjunctive', example: 'Je doutais qu\'elle vînt' },
      { rule: 'Historical or classical texts', example: 'Bien qu\'il fût tard, ils continuèrent' },
      { rule: 'Formal correspondence (rare)', example: 'Je souhaitais qu\'il réussît' }
    ],
    regularPatterns: {
      er: {
        je: 'parlasse',
        tu: 'parlasses',
        il: 'parlât',
        nous: 'parlassions',
        vous: 'parlassiez',
        ils: 'parlassent'
      },
      ir: {
        je: 'finisse',
        tu: 'finisses',
        il: 'finît',
        nous: 'finissions',
        vous: 'finissiez',
        ils: 'finissent'
      },
      re: {
        je: 'vendisse',
        tu: 'vendisses',
        il: 'vendît',
        nous: 'vendissions',
        vous: 'vendissiez',
        ils: 'vendissent'
      }
    },
    regularExamples: [
      {
        infinitive: 'parler (to speak)',
        english: 'to speak',
        conjugations: {
          je: 'parlasse',
          tu: 'parlasses',
          il: 'parlât',
          nous: 'parlassions',
          vous: 'parlassiez',
          ils: 'parlassent'
        }
      },
      {
        infinitive: 'finir (to finish)',
        english: 'to finish',
        conjugations: {
          je: 'finisse',
          tu: 'finisses',
          il: 'finît',
          nous: 'finissions',
          vous: 'finissiez',
          ils: 'finissent'
        }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'être (to be)',
        english: 'to be',
        conjugations: {
          je: 'fusse',
          tu: 'fusses',
          il: 'fût',
          nous: 'fussions',
          vous: 'fussiez',
          ils: 'fussent'
        }
      },
      {
        infinitive: 'avoir (to have)',
        english: 'to have',
        conjugations: {
          je: 'eusse',
          tu: 'eusses',
          il: 'eût',
          nous: 'eussions',
          vous: 'eussiez',
          ils: 'eussent'
        }
      }
    ],
    exampleSentences: [
      { french: 'Il fallait que je parlasse avec lui', english: 'It was necessary that I speak with him' },
      { french: 'Bien qu\'il fût tard, nous continuâmes', english: 'Although it was late, we continued' },
      { french: 'Je doutais qu\'elle vînt', english: 'I doubted that she would come' }
    ]
  }
]
