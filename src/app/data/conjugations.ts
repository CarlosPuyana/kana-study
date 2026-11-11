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
    "availability": "available",
    "wordCount": 50,
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
    "availability": "available",
    "wordCount": 50,
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
    "availability": "available",
    "wordCount": 50,
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
    "availability": "available",
    "wordCount": 50,
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
    "availability": "available",
    "ruleFamily": "verb-te",
    "example": {
      "base": "書く",
      "result": "書いている"
    },
    "wordCount": 48
  },
  {
    "id": "verb-potential",
    "titleKey": "conjugations.category.verb-potential.title",
    "japanese": "可能形",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 6,
    "descriptionKey": "conjugations.category.verb-potential.description",
    "availability": "available",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書ける"
    },
    "wordCount": 47
  },
  {
    "id": "verb-passive",
    "titleKey": "conjugations.category.verb-passive.title",
    "japanese": "受身形",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 7,
    "descriptionKey": "conjugations.category.verb-passive.description",
    "availability": "available",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書かれる"
    },
    "wordCount": 45
  },
  {
    "id": "verb-causative",
    "titleKey": "conjugations.category.verb-causative.title",
    "japanese": "使役形",
    "group": "verb",
    "difficulty": "advanced",
    "order": 8,
    "descriptionKey": "conjugations.category.verb-causative.description",
    "availability": "available",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書かせる"
    },
    "wordCount": 48
  },
  {
    "id": "verb-causative-passive",
    "titleKey": "conjugations.category.verb-causative-passive.title",
    "japanese": "使役受身形",
    "group": "verb",
    "difficulty": "advanced",
    "order": 9,
    "descriptionKey": "conjugations.category.verb-causative-passive.description",
    "availability": "available",
    "ruleFamily": "verb-voice",
    "example": {
      "base": "書く",
      "result": "書かされる"
    },
    "wordCount": 48
  },
  {
    "id": "verb-volitional",
    "titleKey": "conjugations.category.verb-volitional.title",
    "japanese": "意向形",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 10,
    "descriptionKey": "conjugations.category.verb-volitional.description",
    "availability": "available",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書こう"
    },
    "wordCount": 48
  },
  {
    "id": "verb-imperative",
    "titleKey": "conjugations.category.verb-imperative.title",
    "japanese": "命令形",
    "group": "verb",
    "difficulty": "advanced",
    "order": 11,
    "descriptionKey": "conjugations.category.verb-imperative.description",
    "availability": "available",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書け"
    },
    "wordCount": 47
  },
  {
    "id": "verb-desire",
    "titleKey": "conjugations.category.verb-desire.title",
    "japanese": "〜たい",
    "group": "verb",
    "difficulty": "basic",
    "order": 12,
    "descriptionKey": "conjugations.category.verb-desire.description",
    "availability": "available",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書きたい"
    },
    "wordCount": 48
  },
  {
    "id": "verb-conditional-ba",
    "titleKey": "conjugations.category.verb-conditional-ba.title",
    "japanese": "〜ば",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 13,
    "descriptionKey": "conjugations.category.verb-conditional-ba.description",
    "availability": "available",
    "ruleFamily": "verb-conditional",
    "example": {
      "base": "書く",
      "result": "書けば"
    },
    "wordCount": 50
  },
  {
    "id": "verb-conditional-tara",
    "titleKey": "conjugations.category.verb-conditional-tara.title",
    "japanese": "〜たら",
    "group": "verb",
    "difficulty": "intermediate",
    "order": 14,
    "descriptionKey": "conjugations.category.verb-conditional-tara.description",
    "availability": "available",
    "ruleFamily": "verb-conditional",
    "example": {
      "base": "書く",
      "result": "書いたら"
    },
    "wordCount": 50
  },
  {
    "id": "verb-polite",
    "titleKey": "conjugations.category.verb-polite.title",
    "japanese": "丁寧形",
    "group": "verb",
    "difficulty": "basic",
    "order": 15,
    "descriptionKey": "conjugations.category.verb-polite.description",
    "availability": "available",
    "ruleFamily": "verb-polite",
    "wordCount": 50
  },
  {
    "id": "adjective-negative",
    "titleKey": "conjugations.category.adjective-negative.title",
    "japanese": "〜ない",
    "group": "adjective",
    "difficulty": "basic",
    "order": 16,
    "descriptionKey": "conjugations.category.adjective-negative.description",
    "availability": "available",
    "wordCount": 25,
    "ruleFamily": "adjective-i"
  },
  {
    "id": "adjective-past",
    "titleKey": "conjugations.category.adjective-past.title",
    "japanese": "〜た",
    "group": "adjective",
    "difficulty": "basic",
    "order": 17,
    "descriptionKey": "conjugations.category.adjective-past.description",
    "availability": "available",
    "wordCount": 25,
    "ruleFamily": "adjective-i"
  },
  {
    "id": "adjective-negative-past",
    "titleKey": "conjugations.category.adjective-negative-past.title",
    "japanese": "〜なかった",
    "group": "adjective",
    "difficulty": "basic",
    "order": 18,
    "descriptionKey": "conjugations.category.adjective-negative-past.description",
    "availability": "available",
    "wordCount": 25,
    "ruleFamily": "adjective-i"
  },
  {
    "id": "adjective-te",
    "titleKey": "conjugations.category.adjective-te.title",
    "japanese": "て形",
    "group": "adjective",
    "difficulty": "basic",
    "order": 19,
    "descriptionKey": "conjugations.category.adjective-te.description",
    "availability": "available",
    "wordCount": 25,
    "ruleFamily": "adjective-i"
  },
  {
    "id": "adjective-adverbial",
    "titleKey": "conjugations.category.adjective-adverbial.title",
    "japanese": "副詞形",
    "group": "adjective",
    "difficulty": "basic",
    "order": 20,
    "descriptionKey": "conjugations.category.adjective-adverbial.description",
    "availability": "available",
    "wordCount": 25,
    "ruleFamily": "adjective-i"
  },
  {
    "id": "copula-plain",
    "titleKey": "conjugations.category.copula-plain.title",
    "japanese": "だ",
    "group": "copula",
    "difficulty": "basic",
    "order": 21,
    "descriptionKey": "conjugations.category.copula-plain.description",
    "availability": "available",
    "ruleFamily": "copula-plain",
    "wordCount": 13,
    "example": {
      "base": "学生だ",
      "result": "学生だった"
    }
  },
  {
    "id": "copula-polite",
    "titleKey": "conjugations.category.copula-polite.title",
    "japanese": "です",
    "group": "copula",
    "difficulty": "basic",
    "order": 22,
    "descriptionKey": "conjugations.category.copula-polite.description",
    "availability": "available",
    "ruleFamily": "copula-polite",
    "wordCount": 13,
    "example": {
      "base": "学生です",
      "result": "学生でした"
    }
  },
  {
    "id": "verb-prohibitive",
    "titleKey": "conjugations.category.verb-prohibitive.title",
    "japanese": "〜な",
    "group": "verb",
    "difficulty": "advanced",
    "order": 23,
    "descriptionKey": "conjugations.category.verb-prohibitive.description",
    "availability": "available",
    "ruleFamily": "verb-mood",
    "example": {
      "base": "書く",
      "result": "書くな"
    },
    "wordCount": 47
  }
];
