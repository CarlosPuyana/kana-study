import {ConjugationCategory} from '../core/models/conjugations.model';

export const CONJUGATION_CATEGORIES:readonly ConjugationCategory[] = [
  {
    "id": "verb-negative",
    "titleKey": "conjugations.category.verb-negative.title",
    "japanese": "〜ない",
    "group": "verb",
    "difficulty": "basic",
    "order": 1,
    "descriptionKey": "conjugations.category.verb-negative.description",
    "availability": "planned",
    "ruleFamily": "verb-plain",
    "example": {
      "base": "書く",
      "result": "書かない"
    }
  },
  {
    "id": "verb-past",
    "titleKey": "conjugations.category.verb-past.title",
    "japanese": "〜た",
    "group": "verb",
    "difficulty": "basic",
    "order": 2,
    "descriptionKey": "conjugations.category.verb-past.description",
    "availability": "planned",
    "ruleFamily": "verb-plain",
    "example": {
      "base": "書く",
      "result": "書いた"
    }
  },
  {
    "id": "verb-negative-past",
    "titleKey": "conjugations.category.verb-negative-past.title",
    "japanese": "〜なかった",
    "group": "verb",
    "difficulty": "basic",
    "order": 3,
    "descriptionKey": "conjugations.category.verb-negative-past.description",
    "availability": "planned",
    "ruleFamily": "verb-plain",
    "example": {
      "base": "書く",
      "result": "書かなかった"
    }
  },
  {
    "id": "verb-te",
    "titleKey": "conjugations.category.verb-te.title",
    "japanese": "て形",
    "group": "verb",
    "difficulty": "basic",
    "order": 4,
    "descriptionKey": "conjugations.category.verb-te.description",
    "availability": "planned",
    "ruleFamily": "verb-te",
    "example": {
      "base": "書く",
      "result": "書いて"
    }
  },
  {
    "id": "verb-continuous",
    "titleKey": "conjugations.category.verb-continuous.title",
    "japanese": "〜ている",
    "group": "verb",
    "difficulty": "basic",
    "order": 5,
    "descriptionKey": "conjugations.category.verb-continuous.description",
    "availability": "planned",
    "ruleFamily": "verb-te",
    "example": {
      "base": "書く",
      "result": "書いている"
    }
  },
  {
    "id": "verb-potential",
    "titleKey": "conjugations.category.verb-potential.title",
    "japanese": "可能形",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 6,
    "descriptionKey": "conjugations.category.verb-potential.description",
    "availability": "planned",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書ける"
    }
  },
  {
    "id": "verb-passive",
    "titleKey": "conjugations.category.verb-passive.title",
    "japanese": "受身形",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 7,
    "descriptionKey": "conjugations.category.verb-passive.description",
    "availability": "planned",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書かれる"
    }
  },
  {
    "id": "verb-causative",
    "titleKey": "conjugations.category.verb-causative.title",
    "japanese": "使役形",
    "group": "verb",
    "difficulty": "advanced",
    "order": 8,
    "descriptionKey": "conjugations.category.verb-causative.description",
    "availability": "planned",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書かせる"
    }
  },
  {
    "id": "verb-causative-passive",
    "titleKey": "conjugations.category.verb-causative-passive.title",
    "japanese": "使役受身形",
    "group": "verb",
    "difficulty": "advanced",
    "order": 9,
    "descriptionKey": "conjugations.category.verb-causative-passive.description",
    "availability": "planned",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書かされる"
    }
  },
  {
    "id": "verb-volitional",
    "titleKey": "conjugations.category.verb-volitional.title",
    "japanese": "意向形",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 10,
    "descriptionKey": "conjugations.category.verb-volitional.description",
    "availability": "planned",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書こう"
    }
  },
  {
    "id": "verb-imperative",
    "titleKey": "conjugations.category.verb-imperative.title",
    "japanese": "命令形",
    "group": "verb",
    "difficulty": "advanced",
    "order": 11,
    "descriptionKey": "conjugations.category.verb-imperative.description",
    "availability": "planned",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書け"
    }
  },
  {
    "id": "verb-desire",
    "titleKey": "conjugations.category.verb-desire.title",
    "japanese": "〜たい",
    "group": "verb",
    "difficulty": "basic",
    "order": 12,
    "descriptionKey": "conjugations.category.verb-desire.description",
    "availability": "planned",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書きたい"
    }
  },
  {
    "id": "verb-conditional-ba",
    "titleKey": "conjugations.category.verb-conditional-ba.title",
    "japanese": "〜ば",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 13,
    "descriptionKey": "conjugations.category.verb-conditional-ba.description",
    "availability": "planned",
    "ruleFamily": "verb-conditional",
    "example": {
      "base": "書く",
      "result": "書けば"
    }
  },
  {
    "id": "verb-conditional-tara",
    "titleKey": "conjugations.category.verb-conditional-tara.title",
    "japanese": "〜たら",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 14,
    "descriptionKey": "conjugations.category.verb-conditional-tara.description",
    "availability": "planned",
    "ruleFamily": "verb-conditional",
    "example": {
      "base": "書く",
      "result": "書いたら"
    }
  },
  {
    "id": "verb-polite",
    "titleKey": "conjugations.category.verb-polite.title",
    "japanese": "丁寧形",
    "group": "verb",
    "difficulty": "basic",
    "order": 15,
    "descriptionKey": "conjugations.category.verb-polite.description",
    "availability": "planned",
    "ruleFamily": "verb-polite"
  },
  {
    "id": "adjective-i",
    "titleKey": "conjugations.category.adjective-i.title",
    "japanese": "い形容詞",
    "group": "adjective",
    "difficulty": "basic",
    "order": 16,
    "descriptionKey": "conjugations.category.adjective-i.description",
    "availability": "available",
    "wordCount": 15,
    "ruleFamily": "adjective-i",
    "example": {
      "base": "高い"
    }
  },
  {
    "id": "copula-plain",
    "titleKey": "conjugations.category.copula-plain.title",
    "japanese": "だ",
    "group": "copula",
    "difficulty": "basic",
    "order": 17,
    "descriptionKey": "conjugations.category.copula-plain.description",
    "availability": "planned",
    "ruleFamily": "copula-plain"
  },
  {
    "id": "copula-polite",
    "titleKey": "conjugations.category.copula-polite.title",
    "japanese": "です",
    "group": "copula",
    "difficulty": "basic",
    "order": 18,
    "descriptionKey": "conjugations.category.copula-polite.description",
    "availability": "planned",
    "ruleFamily": "copula-polite"
  },
  {
    "id": "adjective-na",
    "titleKey": "conjugations.category.adjective-na.title",
    "japanese": "な形容詞",
    "group": "adjective",
    "difficulty": "basic",
    "order": 19,
    "descriptionKey": "conjugations.category.adjective-na.description",
    "availability": "available",
    "wordCount": 10,
    "ruleFamily": "adjective-na",
    "example": {
      "base": "静か"
    }
  },
  {
    "id": "verb-prohibitive",
    "titleKey": "conjugations.category.verb-prohibitive.title",
    "japanese": "〜な",
    "group": "verb",
    "difficulty": "advanced",
    "order": 20,
    "descriptionKey": "conjugations.category.verb-prohibitive.description",
    "availability": "planned",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書くな"
    }
  }
];
