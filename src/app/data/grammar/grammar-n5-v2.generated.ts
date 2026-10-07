// Generated from scripts/grammar-n5-v2.mjs. Do not edit manually.
import {GrammarConcept} from '../../core/models/grammar-v2.model';
import {GrammarExercise} from '../../features/grammar/models/grammar.model';
export const GRAMMAR_V2_CONCEPTS: readonly GrammarConcept[] = [
  {
    "id": "sentence-structure-context",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 1,
    "titleKey": "grammar.v2.sentence-structure-context.title",
    "summaryKey": "grammar.v2.sentence-structure-context.summary",
    "goalKey": "grammar.v2.sentence-structure-context.goal",
    "prerequisiteIds": [],
    "relatedIds": [
      "state-being-plain",
      "particle-wa-topic",
      "verb-role-dictionary",
      "sentence-ending-ne-yo"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.sentence-structure-context.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生 + だ → 学生だ。"
        }
      ],
      "examples": [
        {
          "japanese": "学生？ → 学生だ。",
          "reading": "がくせい？ → がくせいだ。",
          "meaningKey": "grammar.v2.sentence-structure-context.example.0"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.sentence-structure-context.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.sentence-structure-context.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "sentence-structure-context-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "sentence-structure-context",
        "conceptId": "sentence-structure-context",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.sentence-structure-context-1.prompt",
        "successKey": "grammar.v2.sentence-structure-context-1.explanation",
        "errorKey": "grammar.v2.sentence-structure-context-1.explanation",
        "options": [
          {
            "id": "sentence-structure-context-1-option-0",
            "textKey": "grammar.v2.sentence-structure-context-1.option.0",
            "feedbackKey": "grammar.v2.sentence-structure-context-1.feedback.0"
          },
          {
            "id": "sentence-structure-context-1-option-1",
            "textKey": "grammar.v2.sentence-structure-context-1.option.1",
            "feedbackKey": "grammar.v2.sentence-structure-context-1.feedback.1"
          },
          {
            "id": "sentence-structure-context-1-option-2",
            "textKey": "grammar.v2.sentence-structure-context-1.option.2",
            "feedbackKey": "grammar.v2.sentence-structure-context-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.sentence-structure-context-1.option.0",
          "grammar.v2.sentence-structure-context-1.option.1",
          "grammar.v2.sentence-structure-context-1.option.2"
        ],
        "answer": 0
      },
      {
        "id": "sentence-structure-context-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "sentence-structure-context",
        "conceptId": "sentence-structure-context",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.sentence-structure-context-2.prompt",
        "successKey": "grammar.v2.sentence-structure-context-2.explanation",
        "errorKey": "grammar.v2.sentence-structure-context-2.explanation",
        "options": [
          {
            "id": "sentence-structure-context-2-option-0",
            "textKey": "grammar.v2.sentence-structure-context-2.option.0",
            "feedbackKey": "grammar.v2.sentence-structure-context-2.feedback.0"
          },
          {
            "id": "sentence-structure-context-2-option-1",
            "textKey": "grammar.v2.sentence-structure-context-2.option.1",
            "feedbackKey": "grammar.v2.sentence-structure-context-2.feedback.1"
          },
          {
            "id": "sentence-structure-context-2-option-2",
            "textKey": "grammar.v2.sentence-structure-context-2.option.2",
            "feedbackKey": "grammar.v2.sentence-structure-context-2.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.sentence-structure-context-2.option.0",
          "grammar.v2.sentence-structure-context-2.option.1",
          "grammar.v2.sentence-structure-context-2.option.2"
        ],
        "answer": 0
      },
      {
        "id": "sentence-structure-context-3",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "sentence-structure-context",
        "conceptId": "sentence-structure-context",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.sentence-structure-context-3.prompt",
        "successKey": "grammar.v2.sentence-structure-context-3.explanation",
        "errorKey": "grammar.v2.sentence-structure-context-3.explanation",
        "tokenKeys": [
          "grammar.v2.sentence-structure-context-3.token.0",
          "grammar.v2.sentence-structure-context-3.token.1"
        ],
        "solution": [
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "sentence-structure-context-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "sentence-structure-context",
        "conceptId": "sentence-structure-context",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.sentence-structure-context-4.prompt",
        "successKey": "grammar.v2.sentence-structure-context-4.explanation",
        "errorKey": "grammar.v2.sentence-structure-context-4.explanation",
        "options": [
          {
            "id": "sentence-structure-context-4-option-0",
            "textKey": "grammar.v2.sentence-structure-context-4.option.0",
            "feedbackKey": "grammar.v2.sentence-structure-context-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "sentence-structure-context-4-option-1",
            "textKey": "grammar.v2.sentence-structure-context-4.option.1",
            "feedbackKey": "grammar.v2.sentence-structure-context-4.feedback.1",
            "grammarStatus": "invalid"
          }
        ],
        "optionKeys": [
          "grammar.v2.sentence-structure-context-4.option.0",
          "grammar.v2.sentence-structure-context-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "state-being-plain",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 2,
    "titleKey": "grammar.v2.state-being-plain.title",
    "summaryKey": "grammar.v2.state-being-plain.summary",
    "goalKey": "grammar.v2.state-being-plain.goal",
    "prerequisiteIds": [
      "sentence-structure-context"
    ],
    "relatedIds": [
      "state-being-negative",
      "state-being-past",
      "particle-wa-topic",
      "particle-no-noun-link",
      "adjective-na",
      "adjective-i",
      "polite-desu-system",
      "da-vs-desu"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.state-being-plain.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "名詞 + だ"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "元気 + だ → 元気だ。"
        }
      ],
      "examples": [
        {
          "japanese": "学生だ。",
          "reading": "がくせいだ。",
          "meaningKey": "grammar.v2.state-being-plain.example.0"
        },
        {
          "japanese": "先生だ。",
          "reading": "せんせいだ。",
          "meaningKey": "grammar.v2.state-being-plain.example.1"
        },
        {
          "japanese": "元気だ。",
          "reading": "げんきだ。",
          "meaningKey": "grammar.v2.state-being-plain.example.2"
        },
        {
          "japanese": "静かだ。",
          "reading": "しずかだ。",
          "meaningKey": "grammar.v2.state-being-plain.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.state-being-plain.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.state-being-plain.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "かわいいだ。",
          "correction": "かわいい。",
          "explanationKey": "grammar.v2.state-being-plain.mistake.0"
        },
        {
          "wrong": "学生だです。",
          "correction": "学生だ。",
          "explanationKey": "grammar.v2.state-being-plain.mistake.1"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "state-being-plain-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "state-being-plain",
        "conceptId": "state-being-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-plain-1.prompt",
        "successKey": "grammar.v2.state-being-plain-1.explanation",
        "errorKey": "grammar.v2.state-being-plain-1.explanation",
        "options": [
          {
            "id": "state-being-plain-1-option-0",
            "textKey": "grammar.v2.state-being-plain-1.option.0",
            "feedbackKey": "grammar.v2.state-being-plain-1.feedback.0"
          },
          {
            "id": "state-being-plain-1-option-1",
            "textKey": "grammar.v2.state-being-plain-1.option.1",
            "feedbackKey": "grammar.v2.state-being-plain-1.feedback.1"
          },
          {
            "id": "state-being-plain-1-option-2",
            "textKey": "grammar.v2.state-being-plain-1.option.2",
            "feedbackKey": "grammar.v2.state-being-plain-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-plain-1.option.0",
          "grammar.v2.state-being-plain-1.option.1",
          "grammar.v2.state-being-plain-1.option.2"
        ],
        "answer": 0
      },
      {
        "id": "state-being-plain-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-plain",
        "conceptId": "state-being-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.state-being-plain-2.prompt",
        "successKey": "grammar.v2.state-being-plain-2.explanation",
        "errorKey": "grammar.v2.state-being-plain-2.explanation",
        "acceptedAnswers": [
          "だ"
        ],
        "solutionKey": "grammar.v2.state-being-plain-2.solution",
        "kanaBank": [
          "い",
          "う",
          "が",
          "く",
          "え",
          "だ"
        ]
      },
      {
        "id": "state-being-plain-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-plain",
        "conceptId": "state-being-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-plain-3.prompt",
        "successKey": "grammar.v2.state-being-plain-3.explanation",
        "errorKey": "grammar.v2.state-being-plain-3.explanation",
        "options": [
          {
            "id": "state-being-plain-3-option-0",
            "textKey": "grammar.v2.state-being-plain-3.option.0",
            "feedbackKey": "grammar.v2.state-being-plain-3.feedback.0"
          },
          {
            "id": "state-being-plain-3-option-1",
            "textKey": "grammar.v2.state-being-plain-3.option.1",
            "feedbackKey": "grammar.v2.state-being-plain-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-plain-3.option.0",
          "grammar.v2.state-being-plain-3.option.1"
        ],
        "answer": 0
      },
      {
        "id": "state-being-plain-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-plain",
        "conceptId": "state-being-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.state-being-plain-4.prompt",
        "successKey": "grammar.v2.state-being-plain-4.explanation",
        "errorKey": "grammar.v2.state-being-plain-4.explanation",
        "options": [
          {
            "id": "state-being-plain-4-option-0",
            "textKey": "grammar.v2.state-being-plain-4.option.0",
            "feedbackKey": "grammar.v2.state-being-plain-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-plain-4-option-1",
            "textKey": "grammar.v2.state-being-plain-4.option.1",
            "feedbackKey": "grammar.v2.state-being-plain-4.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "state-being-plain-4-option-2",
            "textKey": "grammar.v2.state-being-plain-4.option.2",
            "feedbackKey": "grammar.v2.state-being-plain-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-plain-4.option.0",
          "grammar.v2.state-being-plain-4.option.1",
          "grammar.v2.state-being-plain-4.option.2"
        ],
        "answer": 1
      },
      {
        "id": "state-being-plain-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-plain",
        "conceptId": "state-being-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-plain-5.prompt",
        "successKey": "grammar.v2.state-being-plain-5.explanation",
        "errorKey": "grammar.v2.state-being-plain-5.explanation",
        "options": [
          {
            "id": "state-being-plain-5-option-0",
            "textKey": "grammar.v2.state-being-plain-5.option.0",
            "feedbackKey": "grammar.v2.state-being-plain-5.feedback.0"
          },
          {
            "id": "state-being-plain-5-option-1",
            "textKey": "grammar.v2.state-being-plain-5.option.1",
            "feedbackKey": "grammar.v2.state-being-plain-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-plain-5.option.0",
          "grammar.v2.state-being-plain-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "state-being-negative",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 3,
    "titleKey": "grammar.v2.state-being-negative.title",
    "summaryKey": "grammar.v2.state-being-negative.summary",
    "goalKey": "grammar.v2.state-being-negative.goal",
    "prerequisiteIds": [
      "state-being-plain"
    ],
    "relatedIds": [
      "state-being-past-negative",
      "particle-mo-inclusive",
      "adjective-na",
      "adjective-negative",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.state-being-negative.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "名詞 + じゃない"
        }
      ],
      "examples": [
        {
          "japanese": "学生じゃない。",
          "reading": "がくせいじゃない。",
          "meaningKey": "grammar.v2.state-being-negative.example.0"
        },
        {
          "japanese": "先生じゃない。",
          "reading": "せんせいじゃない。",
          "meaningKey": "grammar.v2.state-being-negative.example.1"
        },
        {
          "japanese": "元気じゃない。",
          "reading": "げんきじゃない。",
          "meaningKey": "grammar.v2.state-being-negative.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.state-being-negative.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.state-being-negative.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "学生だじゃない。",
          "correction": "学生じゃない。",
          "explanationKey": "grammar.v2.state-being-negative.mistake.0"
        }
      ],
      "contrasts": [
        {
          "left": "学生だ。",
          "right": "学生じゃない。",
          "explanationKey": "grammar.v2.state-being-negative.contrast.0"
        }
      ]
    },
    "exercises": [
      {
        "id": "state-being-negative-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "state-being-negative",
        "conceptId": "state-being-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-negative-1.prompt",
        "successKey": "grammar.v2.state-being-negative-1.explanation",
        "errorKey": "grammar.v2.state-being-negative-1.explanation",
        "options": [
          {
            "id": "state-being-negative-1-option-0",
            "textKey": "grammar.v2.state-being-negative-1.option.0",
            "feedbackKey": "grammar.v2.state-being-negative-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-negative-1-option-1",
            "textKey": "grammar.v2.state-being-negative-1.option.1",
            "feedbackKey": "grammar.v2.state-being-negative-1.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-negative-1.option.0",
          "grammar.v2.state-being-negative-1.option.1"
        ],
        "answer": 1
      },
      {
        "id": "state-being-negative-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-negative",
        "conceptId": "state-being-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.state-being-negative-2.prompt",
        "successKey": "grammar.v2.state-being-negative-2.explanation",
        "errorKey": "grammar.v2.state-being-negative-2.explanation",
        "acceptedAnswers": [
          "じゃない"
        ],
        "solutionKey": "grammar.v2.state-being-negative-2.solution",
        "kanaBank": [
          "だ",
          "で",
          "な",
          "い",
          "じ",
          "ゃ"
        ]
      },
      {
        "id": "state-being-negative-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-negative",
        "conceptId": "state-being-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-negative-3.prompt",
        "successKey": "grammar.v2.state-being-negative-3.explanation",
        "errorKey": "grammar.v2.state-being-negative-3.explanation",
        "options": [
          {
            "id": "state-being-negative-3-option-0",
            "textKey": "grammar.v2.state-being-negative-3.option.0",
            "feedbackKey": "grammar.v2.state-being-negative-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-negative-3-option-1",
            "textKey": "grammar.v2.state-being-negative-3.option.1",
            "feedbackKey": "grammar.v2.state-being-negative-3.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-negative-3.option.0",
          "grammar.v2.state-being-negative-3.option.1"
        ],
        "answer": 1
      },
      {
        "id": "state-being-negative-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-negative",
        "conceptId": "state-being-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.state-being-negative-4.prompt",
        "successKey": "grammar.v2.state-being-negative-4.explanation",
        "errorKey": "grammar.v2.state-being-negative-4.explanation",
        "options": [
          {
            "id": "state-being-negative-4-option-0",
            "textKey": "grammar.v2.state-being-negative-4.option.0",
            "feedbackKey": "grammar.v2.state-being-negative-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-negative-4-option-1",
            "textKey": "grammar.v2.state-being-negative-4.option.1",
            "feedbackKey": "grammar.v2.state-being-negative-4.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "state-being-negative-4-option-2",
            "textKey": "grammar.v2.state-being-negative-4.option.2",
            "feedbackKey": "grammar.v2.state-being-negative-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-negative-4.option.0",
          "grammar.v2.state-being-negative-4.option.1",
          "grammar.v2.state-being-negative-4.option.2"
        ],
        "answer": 1
      },
      {
        "id": "state-being-negative-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "state-being-negative",
        "conceptId": "state-being-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.state-being-negative-5.prompt",
        "successKey": "grammar.v2.state-being-negative-5.explanation",
        "errorKey": "grammar.v2.state-being-negative-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.state-being-negative-5.left.0",
            "rightKey": "grammar.v2.state-being-negative-5.right.0"
          },
          {
            "leftKey": "grammar.v2.state-being-negative-5.left.1",
            "rightKey": "grammar.v2.state-being-negative-5.right.1"
          }
        ]
      }
    ]
  },
  {
    "id": "state-being-past",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 4,
    "titleKey": "grammar.v2.state-being-past.title",
    "summaryKey": "grammar.v2.state-being-past.summary",
    "goalKey": "grammar.v2.state-being-past.goal",
    "prerequisiteIds": [
      "state-being-plain"
    ],
    "relatedIds": [
      "state-being-past-negative",
      "adjective-na",
      "adjective-past",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.state-being-past.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "名詞 + だった"
        }
      ],
      "examples": [
        {
          "japanese": "学生だった。",
          "reading": "がくせいだった。",
          "meaningKey": "grammar.v2.state-being-past.example.0"
        },
        {
          "japanese": "先生だった。",
          "reading": "せんせいだった。",
          "meaningKey": "grammar.v2.state-being-past.example.1"
        },
        {
          "japanese": "元気だった。",
          "reading": "げんきだった。",
          "meaningKey": "grammar.v2.state-being-past.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.state-being-past.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.state-being-past.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "学生だた。",
          "correction": "学生だった。",
          "explanationKey": "grammar.v2.state-being-past.mistake.0"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "state-being-past-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "state-being-past",
        "conceptId": "state-being-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-past-1.prompt",
        "successKey": "grammar.v2.state-being-past-1.explanation",
        "errorKey": "grammar.v2.state-being-past-1.explanation",
        "options": [
          {
            "id": "state-being-past-1-option-0",
            "textKey": "grammar.v2.state-being-past-1.option.0",
            "feedbackKey": "grammar.v2.state-being-past-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-1-option-1",
            "textKey": "grammar.v2.state-being-past-1.option.1",
            "feedbackKey": "grammar.v2.state-being-past-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-1-option-2",
            "textKey": "grammar.v2.state-being-past-1.option.2",
            "feedbackKey": "grammar.v2.state-being-past-1.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-past-1.option.0",
          "grammar.v2.state-being-past-1.option.1",
          "grammar.v2.state-being-past-1.option.2"
        ],
        "answer": 2
      },
      {
        "id": "state-being-past-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-past",
        "conceptId": "state-being-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.state-being-past-2.prompt",
        "successKey": "grammar.v2.state-being-past-2.explanation",
        "errorKey": "grammar.v2.state-being-past-2.explanation",
        "acceptedAnswers": [
          "だった"
        ],
        "solutionKey": "grammar.v2.state-being-past-2.solution",
        "kanaBank": [
          "を",
          "ん",
          "る",
          "っ",
          "だ",
          "た"
        ]
      },
      {
        "id": "state-being-past-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-past",
        "conceptId": "state-being-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-past-3.prompt",
        "successKey": "grammar.v2.state-being-past-3.explanation",
        "errorKey": "grammar.v2.state-being-past-3.explanation",
        "options": [
          {
            "id": "state-being-past-3-option-0",
            "textKey": "grammar.v2.state-being-past-3.option.0",
            "feedbackKey": "grammar.v2.state-being-past-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-3-option-1",
            "textKey": "grammar.v2.state-being-past-3.option.1",
            "feedbackKey": "grammar.v2.state-being-past-3.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-3-option-2",
            "textKey": "grammar.v2.state-being-past-3.option.2",
            "feedbackKey": "grammar.v2.state-being-past-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-past-3.option.0",
          "grammar.v2.state-being-past-3.option.1",
          "grammar.v2.state-being-past-3.option.2"
        ],
        "answer": 2
      },
      {
        "id": "state-being-past-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-past",
        "conceptId": "state-being-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.state-being-past-4.prompt",
        "successKey": "grammar.v2.state-being-past-4.explanation",
        "errorKey": "grammar.v2.state-being-past-4.explanation",
        "options": [
          {
            "id": "state-being-past-4-option-0",
            "textKey": "grammar.v2.state-being-past-4.option.0",
            "feedbackKey": "grammar.v2.state-being-past-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-4-option-1",
            "textKey": "grammar.v2.state-being-past-4.option.1",
            "feedbackKey": "grammar.v2.state-being-past-4.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "state-being-past-4-option-2",
            "textKey": "grammar.v2.state-being-past-4.option.2",
            "feedbackKey": "grammar.v2.state-being-past-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-past-4.option.0",
          "grammar.v2.state-being-past-4.option.1",
          "grammar.v2.state-being-past-4.option.2"
        ],
        "answer": 1
      }
    ]
  },
  {
    "id": "state-being-past-negative",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 5,
    "titleKey": "grammar.v2.state-being-past-negative.title",
    "summaryKey": "grammar.v2.state-being-past-negative.summary",
    "goalKey": "grammar.v2.state-being-past-negative.goal",
    "prerequisiteIds": [
      "state-being-negative",
      "state-being-past"
    ],
    "relatedIds": [
      "adjective-na",
      "adjective-past-negative",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.state-being-past-negative.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "じゃない → じゃなかった"
        }
      ],
      "examples": [
        {
          "japanese": "学生じゃなかった。",
          "reading": "がくせいじゃなかった。",
          "meaningKey": "grammar.v2.state-being-past-negative.example.0"
        },
        {
          "japanese": "元気じゃなかった。",
          "reading": "げんきじゃなかった。",
          "meaningKey": "grammar.v2.state-being-past-negative.example.1"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.state-being-past-negative.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.state-being-past-negative.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.forms",
          "headerKeys": [
            "grammar.v2.positive",
            "grammar.v2.negative"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.nonpast",
              "cells": [
                "学生だ",
                "学生じゃない"
              ]
            },
            {
              "labelKey": "grammar.v2.past",
              "cells": [
                "学生だった",
                "学生じゃなかった"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "state-being-past-negative-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "state-being-past-negative",
        "conceptId": "state-being-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-past-negative-1.prompt",
        "successKey": "grammar.v2.state-being-past-negative-1.explanation",
        "errorKey": "grammar.v2.state-being-past-negative-1.explanation",
        "options": [
          {
            "id": "state-being-past-negative-1-option-0",
            "textKey": "grammar.v2.state-being-past-negative-1.option.0",
            "feedbackKey": "grammar.v2.state-being-past-negative-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-1-option-1",
            "textKey": "grammar.v2.state-being-past-negative-1.option.1",
            "feedbackKey": "grammar.v2.state-being-past-negative-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-1-option-2",
            "textKey": "grammar.v2.state-being-past-negative-1.option.2",
            "feedbackKey": "grammar.v2.state-being-past-negative-1.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-1-option-3",
            "textKey": "grammar.v2.state-being-past-negative-1.option.3",
            "feedbackKey": "grammar.v2.state-being-past-negative-1.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-past-negative-1.option.0",
          "grammar.v2.state-being-past-negative-1.option.1",
          "grammar.v2.state-being-past-negative-1.option.2",
          "grammar.v2.state-being-past-negative-1.option.3"
        ],
        "answer": 3
      },
      {
        "id": "state-being-past-negative-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-past-negative",
        "conceptId": "state-being-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.state-being-past-negative-2.prompt",
        "successKey": "grammar.v2.state-being-past-negative-2.explanation",
        "errorKey": "grammar.v2.state-being-past-negative-2.explanation",
        "acceptedAnswers": [
          "じゃなかった"
        ],
        "solutionKey": "grammar.v2.state-being-past-negative-2.solution",
        "kanaBank": [
          "ら",
          "る",
          "ゃ",
          "な",
          "っ",
          "か",
          "じ",
          "た"
        ]
      },
      {
        "id": "state-being-past-negative-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-past-negative",
        "conceptId": "state-being-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-past-negative-3.prompt",
        "successKey": "grammar.v2.state-being-past-negative-3.explanation",
        "errorKey": "grammar.v2.state-being-past-negative-3.explanation",
        "options": [
          {
            "id": "state-being-past-negative-3-option-0",
            "textKey": "grammar.v2.state-being-past-negative-3.option.0",
            "feedbackKey": "grammar.v2.state-being-past-negative-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-3-option-1",
            "textKey": "grammar.v2.state-being-past-negative-3.option.1",
            "feedbackKey": "grammar.v2.state-being-past-negative-3.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-3-option-2",
            "textKey": "grammar.v2.state-being-past-negative-3.option.2",
            "feedbackKey": "grammar.v2.state-being-past-negative-3.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-3-option-3",
            "textKey": "grammar.v2.state-being-past-negative-3.option.3",
            "feedbackKey": "grammar.v2.state-being-past-negative-3.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-past-negative-3.option.0",
          "grammar.v2.state-being-past-negative-3.option.1",
          "grammar.v2.state-being-past-negative-3.option.2",
          "grammar.v2.state-being-past-negative-3.option.3"
        ],
        "answer": 1
      },
      {
        "id": "state-being-past-negative-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "state-being-past-negative",
        "conceptId": "state-being-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.state-being-past-negative-4.prompt",
        "successKey": "grammar.v2.state-being-past-negative-4.explanation",
        "errorKey": "grammar.v2.state-being-past-negative-4.explanation",
        "options": [
          {
            "id": "state-being-past-negative-4-option-0",
            "textKey": "grammar.v2.state-being-past-negative-4.option.0",
            "feedbackKey": "grammar.v2.state-being-past-negative-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-4-option-1",
            "textKey": "grammar.v2.state-being-past-negative-4.option.1",
            "feedbackKey": "grammar.v2.state-being-past-negative-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-4-option-2",
            "textKey": "grammar.v2.state-being-past-negative-4.option.2",
            "feedbackKey": "grammar.v2.state-being-past-negative-4.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "state-being-past-negative-4-option-3",
            "textKey": "grammar.v2.state-being-past-negative-4.option.3",
            "feedbackKey": "grammar.v2.state-being-past-negative-4.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.state-being-past-negative-4.option.0",
          "grammar.v2.state-being-past-negative-4.option.1",
          "grammar.v2.state-being-past-negative-4.option.2",
          "grammar.v2.state-being-past-negative-4.option.3"
        ],
        "answer": 3
      },
      {
        "id": "state-being-past-negative-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "state-being-past-negative",
        "conceptId": "state-being-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.state-being-past-negative-5.prompt",
        "successKey": "grammar.v2.state-being-past-negative-5.explanation",
        "errorKey": "grammar.v2.state-being-past-negative-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.state-being-past-negative-5.left.0",
            "rightKey": "grammar.v2.state-being-past-negative-5.right.0"
          },
          {
            "leftKey": "grammar.v2.state-being-past-negative-5.left.1",
            "rightKey": "grammar.v2.state-being-past-negative-5.right.1"
          },
          {
            "leftKey": "grammar.v2.state-being-past-negative-5.left.2",
            "rightKey": "grammar.v2.state-being-past-negative-5.right.2"
          },
          {
            "leftKey": "grammar.v2.state-being-past-negative-5.left.3",
            "rightKey": "grammar.v2.state-being-past-negative-5.right.3"
          }
        ]
      }
    ]
  },
  {
    "id": "particle-wa-topic",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 6,
    "titleKey": "grammar.v2.particle-wa-topic.title",
    "summaryKey": "grammar.v2.particle-wa-topic.summary",
    "goalKey": "grammar.v2.particle-wa-topic.goal",
    "prerequisiteIds": [
      "sentence-structure-context",
      "state-being-plain"
    ],
    "relatedIds": [
      "particle-mo-inclusive",
      "particle-ga-identifier",
      "particle-wa-vs-ga",
      "demonstratives-ko-so-a-do",
      "adjectival-predicates-ga"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-wa-topic.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "田中さん は ｜ 学生だ"
        }
      ],
      "examples": [
        {
          "japanese": "田中さんは学生だ。",
          "reading": "たなかさんはがくせいだ。",
          "meaningKey": "grammar.v2.particle-wa-topic.example.0"
        },
        {
          "japanese": "田中さんは学生？ → 学生だ。",
          "reading": "たなかさんはがくせい？ → がくせいだ。",
          "meaningKey": "grammar.v2.particle-wa-topic.example.1"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-wa-topic.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-wa-topic.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-wa-topic-1",
        "version": 2,
        "kind": "select-segment",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "particle-wa-topic",
        "conceptId": "particle-wa-topic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-topic-1.prompt",
        "successKey": "grammar.v2.particle-wa-topic-1.explanation",
        "errorKey": "grammar.v2.particle-wa-topic-1.explanation",
        "options": [
          {
            "id": "particle-wa-topic-1-option-0",
            "textKey": "grammar.v2.particle-wa-topic-1.option.0",
            "feedbackKey": "grammar.v2.particle-wa-topic-1.feedback.0"
          },
          {
            "id": "particle-wa-topic-1-option-1",
            "textKey": "grammar.v2.particle-wa-topic-1.option.1",
            "feedbackKey": "grammar.v2.particle-wa-topic-1.feedback.1"
          },
          {
            "id": "particle-wa-topic-1-option-2",
            "textKey": "grammar.v2.particle-wa-topic-1.option.2",
            "feedbackKey": "grammar.v2.particle-wa-topic-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-topic-1.option.0",
          "grammar.v2.particle-wa-topic-1.option.1",
          "grammar.v2.particle-wa-topic-1.option.2"
        ],
        "answer": 1
      },
      {
        "id": "particle-wa-topic-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "particle-wa-topic",
        "conceptId": "particle-wa-topic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-topic-2.prompt",
        "successKey": "grammar.v2.particle-wa-topic-2.explanation",
        "errorKey": "grammar.v2.particle-wa-topic-2.explanation",
        "options": [
          {
            "id": "particle-wa-topic-2-option-0",
            "textKey": "grammar.v2.particle-wa-topic-2.option.0",
            "feedbackKey": "grammar.v2.particle-wa-topic-2.feedback.0"
          },
          {
            "id": "particle-wa-topic-2-option-1",
            "textKey": "grammar.v2.particle-wa-topic-2.option.1",
            "feedbackKey": "grammar.v2.particle-wa-topic-2.feedback.1"
          },
          {
            "id": "particle-wa-topic-2-option-2",
            "textKey": "grammar.v2.particle-wa-topic-2.option.2",
            "feedbackKey": "grammar.v2.particle-wa-topic-2.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-topic-2.option.0",
          "grammar.v2.particle-wa-topic-2.option.1",
          "grammar.v2.particle-wa-topic-2.option.2"
        ],
        "answer": 0
      },
      {
        "id": "particle-wa-topic-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-wa-topic",
        "conceptId": "particle-wa-topic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-wa-topic-3.prompt",
        "successKey": "grammar.v2.particle-wa-topic-3.explanation",
        "errorKey": "grammar.v2.particle-wa-topic-3.explanation",
        "acceptedAnswers": [
          "は"
        ],
        "solutionKey": "grammar.v2.particle-wa-topic-3.solution",
        "kanaBank": [
          "し",
          "か",
          "え",
          "く",
          "が",
          "は"
        ]
      },
      {
        "id": "particle-wa-topic-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-wa-topic",
        "conceptId": "particle-wa-topic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-topic-4.prompt",
        "successKey": "grammar.v2.particle-wa-topic-4.explanation",
        "errorKey": "grammar.v2.particle-wa-topic-4.explanation",
        "options": [
          {
            "id": "particle-wa-topic-4-option-0",
            "textKey": "grammar.v2.particle-wa-topic-4.option.0",
            "feedbackKey": "grammar.v2.particle-wa-topic-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wa-topic-4-option-1",
            "textKey": "grammar.v2.particle-wa-topic-4.option.1",
            "feedbackKey": "grammar.v2.particle-wa-topic-4.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-topic-4.option.0",
          "grammar.v2.particle-wa-topic-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "particle-mo-inclusive",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 7,
    "titleKey": "grammar.v2.particle-mo-inclusive.title",
    "summaryKey": "grammar.v2.particle-mo-inclusive.summary",
    "goalKey": "grammar.v2.particle-mo-inclusive.goal",
    "prerequisiteIds": [
      "particle-wa-topic",
      "state-being-negative"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.particle-mo-inclusive.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "私は学生だ。 → 私も学生だ。"
        }
      ],
      "examples": [
        {
          "japanese": "田中さんは学生だ。山田さんも学生だ。",
          "reading": "たなかさんはがくせいだ。やまださんもがくせいだ。",
          "meaningKey": "grammar.v2.particle-mo-inclusive.example.0"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-mo-inclusive.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-mo-inclusive.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "私はも学生だ。",
          "correction": "私も学生だ。",
          "explanationKey": "grammar.v2.particle-mo-inclusive.mistake.0"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-mo-inclusive-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-mo-inclusive",
        "conceptId": "particle-mo-inclusive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-mo-inclusive-1.prompt",
        "successKey": "grammar.v2.particle-mo-inclusive-1.explanation",
        "errorKey": "grammar.v2.particle-mo-inclusive-1.explanation",
        "acceptedAnswers": [
          "も"
        ],
        "solutionKey": "grammar.v2.particle-mo-inclusive-1.solution",
        "kanaBank": [
          "ん",
          "を",
          "れ",
          "る",
          "ら",
          "も"
        ]
      },
      {
        "id": "particle-mo-inclusive-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "particle-mo-inclusive",
        "conceptId": "particle-mo-inclusive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-mo-inclusive-2.prompt",
        "successKey": "grammar.v2.particle-mo-inclusive-2.explanation",
        "errorKey": "grammar.v2.particle-mo-inclusive-2.explanation",
        "options": [
          {
            "id": "particle-mo-inclusive-2-option-0",
            "textKey": "grammar.v2.particle-mo-inclusive-2.option.0",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-2.feedback.0"
          },
          {
            "id": "particle-mo-inclusive-2-option-1",
            "textKey": "grammar.v2.particle-mo-inclusive-2.option.1",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-2.feedback.1"
          },
          {
            "id": "particle-mo-inclusive-2-option-2",
            "textKey": "grammar.v2.particle-mo-inclusive-2.option.2",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-2.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-mo-inclusive-2.option.0",
          "grammar.v2.particle-mo-inclusive-2.option.1",
          "grammar.v2.particle-mo-inclusive-2.option.2"
        ],
        "answer": 0
      },
      {
        "id": "particle-mo-inclusive-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-mo-inclusive",
        "conceptId": "particle-mo-inclusive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-mo-inclusive-3.prompt",
        "successKey": "grammar.v2.particle-mo-inclusive-3.explanation",
        "errorKey": "grammar.v2.particle-mo-inclusive-3.explanation",
        "options": [
          {
            "id": "particle-mo-inclusive-3-option-0",
            "textKey": "grammar.v2.particle-mo-inclusive-3.option.0",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-mo-inclusive-3-option-1",
            "textKey": "grammar.v2.particle-mo-inclusive-3.option.1",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-3.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-mo-inclusive-3-option-2",
            "textKey": "grammar.v2.particle-mo-inclusive-3.option.2",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-mo-inclusive-3.option.0",
          "grammar.v2.particle-mo-inclusive-3.option.1",
          "grammar.v2.particle-mo-inclusive-3.option.2"
        ],
        "answer": 1
      },
      {
        "id": "particle-mo-inclusive-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-mo-inclusive",
        "conceptId": "particle-mo-inclusive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.particle-mo-inclusive-4.prompt",
        "successKey": "grammar.v2.particle-mo-inclusive-4.explanation",
        "errorKey": "grammar.v2.particle-mo-inclusive-4.explanation",
        "options": [
          {
            "id": "particle-mo-inclusive-4-option-0",
            "textKey": "grammar.v2.particle-mo-inclusive-4.option.0",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-4.feedback.0",
            "grammarStatus": "invalid"
          },
          {
            "id": "particle-mo-inclusive-4-option-1",
            "textKey": "grammar.v2.particle-mo-inclusive-4.option.1",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-4.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-mo-inclusive-4.option.0",
          "grammar.v2.particle-mo-inclusive-4.option.1"
        ],
        "answer": 0
      },
      {
        "id": "particle-mo-inclusive-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-mo-inclusive",
        "conceptId": "particle-mo-inclusive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-mo-inclusive-5.prompt",
        "successKey": "grammar.v2.particle-mo-inclusive-5.explanation",
        "errorKey": "grammar.v2.particle-mo-inclusive-5.explanation",
        "options": [
          {
            "id": "particle-mo-inclusive-5-option-0",
            "textKey": "grammar.v2.particle-mo-inclusive-5.option.0",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-mo-inclusive-5-option-1",
            "textKey": "grammar.v2.particle-mo-inclusive-5.option.1",
            "feedbackKey": "grammar.v2.particle-mo-inclusive-5.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-mo-inclusive-5.option.0",
          "grammar.v2.particle-mo-inclusive-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "particle-ga-identifier",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 8,
    "titleKey": "grammar.v2.particle-ga-identifier.title",
    "summaryKey": "grammar.v2.particle-ga-identifier.summary",
    "goalKey": "grammar.v2.particle-ga-identifier.goal",
    "prerequisiteIds": [
      "particle-wa-topic"
    ],
    "relatedIds": [
      "particle-wa-vs-ga",
      "adjectival-predicates-ga",
      "verb-transitivity-basic",
      "existence-aru-iru",
      "relative-clause-noun",
      "nominalizer-no"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-ga-identifier.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "誰 が 学生？ → 田中さん が 学生だ。"
        }
      ],
      "examples": [
        {
          "japanese": "誰が先生？ → 山田さんが先生だ。",
          "reading": "だれがせんせい？ → やまださんがせんせいだ。",
          "meaningKey": "grammar.v2.particle-ga-identifier.example.0"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-ga-identifier.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-ga-identifier.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-ga-identifier-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-ga-identifier",
        "conceptId": "particle-ga-identifier",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-ga-identifier-1.prompt",
        "successKey": "grammar.v2.particle-ga-identifier-1.explanation",
        "errorKey": "grammar.v2.particle-ga-identifier-1.explanation",
        "acceptedAnswers": [
          "が"
        ],
        "solutionKey": "grammar.v2.particle-ga-identifier-1.solution",
        "kanaBank": [
          "も",
          "ゃ",
          "や",
          "る",
          "ら",
          "が"
        ]
      },
      {
        "id": "particle-ga-identifier-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-ga-identifier",
        "conceptId": "particle-ga-identifier",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-ga-identifier-2.prompt",
        "successKey": "grammar.v2.particle-ga-identifier-2.explanation",
        "errorKey": "grammar.v2.particle-ga-identifier-2.explanation",
        "options": [
          {
            "id": "particle-ga-identifier-2-option-0",
            "textKey": "grammar.v2.particle-ga-identifier-2.option.0",
            "feedbackKey": "grammar.v2.particle-ga-identifier-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-ga-identifier-2-option-1",
            "textKey": "grammar.v2.particle-ga-identifier-2.option.1",
            "feedbackKey": "grammar.v2.particle-ga-identifier-2.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-ga-identifier-2-option-2",
            "textKey": "grammar.v2.particle-ga-identifier-2.option.2",
            "feedbackKey": "grammar.v2.particle-ga-identifier-2.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-ga-identifier-2.option.0",
          "grammar.v2.particle-ga-identifier-2.option.1",
          "grammar.v2.particle-ga-identifier-2.option.2"
        ],
        "answer": 2
      },
      {
        "id": "particle-ga-identifier-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "particle-ga-identifier",
        "conceptId": "particle-ga-identifier",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-ga-identifier-3.prompt",
        "successKey": "grammar.v2.particle-ga-identifier-3.explanation",
        "errorKey": "grammar.v2.particle-ga-identifier-3.explanation",
        "options": [
          {
            "id": "particle-ga-identifier-3-option-0",
            "textKey": "grammar.v2.particle-ga-identifier-3.option.0",
            "feedbackKey": "grammar.v2.particle-ga-identifier-3.feedback.0"
          },
          {
            "id": "particle-ga-identifier-3-option-1",
            "textKey": "grammar.v2.particle-ga-identifier-3.option.1",
            "feedbackKey": "grammar.v2.particle-ga-identifier-3.feedback.1"
          },
          {
            "id": "particle-ga-identifier-3-option-2",
            "textKey": "grammar.v2.particle-ga-identifier-3.option.2",
            "feedbackKey": "grammar.v2.particle-ga-identifier-3.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-ga-identifier-3.option.0",
          "grammar.v2.particle-ga-identifier-3.option.1",
          "grammar.v2.particle-ga-identifier-3.option.2"
        ],
        "answer": 0
      },
      {
        "id": "particle-ga-identifier-4",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-ga-identifier",
        "conceptId": "particle-ga-identifier",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.particle-ga-identifier-4.prompt",
        "successKey": "grammar.v2.particle-ga-identifier-4.explanation",
        "errorKey": "grammar.v2.particle-ga-identifier-4.explanation",
        "tokenKeys": [
          "grammar.v2.particle-ga-identifier-4.token.0",
          "grammar.v2.particle-ga-identifier-4.token.1",
          "grammar.v2.particle-ga-identifier-4.token.2"
        ],
        "solution": [
          1,
          2,
          0
        ],
        "orderPolicy": "constrained"
      }
    ]
  },
  {
    "id": "particle-wa-vs-ga",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 9,
    "titleKey": "grammar.v2.particle-wa-vs-ga.title",
    "summaryKey": "grammar.v2.particle-wa-vs-ga.summary",
    "goalKey": "grammar.v2.particle-wa-vs-ga.goal",
    "prerequisiteIds": [
      "particle-wa-topic",
      "particle-ga-identifier"
    ],
    "relatedIds": [
      "adjectival-predicates-ga"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-wa-vs-ga.idea",
      "formation": [],
      "examples": [
        {
          "japanese": "田中さんは学生だ。",
          "reading": "たなかさんはがくせいだ。",
          "meaningKey": "grammar.v2.particle-wa-vs-ga.example.0"
        },
        {
          "japanese": "誰が学生？ → 田中さんが学生だ。",
          "reading": "だれががくせい？ → たなかさんががくせいだ。",
          "meaningKey": "grammar.v2.particle-wa-vs-ga.example.1"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-wa-vs-ga.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-wa-vs-ga.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [
        {
          "left": "田中さんは学生だ。",
          "right": "田中さんが学生だ。",
          "explanationKey": "grammar.v2.particle-wa-vs-ga.contrast.0"
        }
      ]
    },
    "exercises": [
      {
        "id": "particle-wa-vs-ga-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-wa-vs-ga",
        "conceptId": "particle-wa-vs-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-vs-ga-1.prompt",
        "successKey": "grammar.v2.particle-wa-vs-ga-1.explanation",
        "errorKey": "grammar.v2.particle-wa-vs-ga-1.explanation",
        "options": [
          {
            "id": "particle-wa-vs-ga-1-option-0",
            "textKey": "grammar.v2.particle-wa-vs-ga-1.option.0",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wa-vs-ga-1-option-1",
            "textKey": "grammar.v2.particle-wa-vs-ga-1.option.1",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wa-vs-ga-1-option-2",
            "textKey": "grammar.v2.particle-wa-vs-ga-1.option.2",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-1.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-vs-ga-1.option.0",
          "grammar.v2.particle-wa-vs-ga-1.option.1",
          "grammar.v2.particle-wa-vs-ga-1.option.2"
        ],
        "answer": 2
      },
      {
        "id": "particle-wa-vs-ga-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-wa-vs-ga",
        "conceptId": "particle-wa-vs-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-vs-ga-2.prompt",
        "successKey": "grammar.v2.particle-wa-vs-ga-2.explanation",
        "errorKey": "grammar.v2.particle-wa-vs-ga-2.explanation",
        "options": [
          {
            "id": "particle-wa-vs-ga-2-option-0",
            "textKey": "grammar.v2.particle-wa-vs-ga-2.option.0",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wa-vs-ga-2-option-1",
            "textKey": "grammar.v2.particle-wa-vs-ga-2.option.1",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-2.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wa-vs-ga-2-option-2",
            "textKey": "grammar.v2.particle-wa-vs-ga-2.option.2",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-2.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-vs-ga-2.option.0",
          "grammar.v2.particle-wa-vs-ga-2.option.1",
          "grammar.v2.particle-wa-vs-ga-2.option.2"
        ],
        "answer": 0
      },
      {
        "id": "particle-wa-vs-ga-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-wa-vs-ga",
        "conceptId": "particle-wa-vs-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-vs-ga-3.prompt",
        "successKey": "grammar.v2.particle-wa-vs-ga-3.explanation",
        "errorKey": "grammar.v2.particle-wa-vs-ga-3.explanation",
        "options": [
          {
            "id": "particle-wa-vs-ga-3-option-0",
            "textKey": "grammar.v2.particle-wa-vs-ga-3.option.0",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wa-vs-ga-3-option-1",
            "textKey": "grammar.v2.particle-wa-vs-ga-3.option.1",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-3.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wa-vs-ga-3-option-2",
            "textKey": "grammar.v2.particle-wa-vs-ga-3.option.2",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-vs-ga-3.option.0",
          "grammar.v2.particle-wa-vs-ga-3.option.1",
          "grammar.v2.particle-wa-vs-ga-3.option.2"
        ],
        "answer": 2
      },
      {
        "id": "particle-wa-vs-ga-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-wa-vs-ga",
        "conceptId": "particle-wa-vs-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-vs-ga-4.prompt",
        "successKey": "grammar.v2.particle-wa-vs-ga-4.explanation",
        "errorKey": "grammar.v2.particle-wa-vs-ga-4.explanation",
        "options": [
          {
            "id": "particle-wa-vs-ga-4-option-0",
            "textKey": "grammar.v2.particle-wa-vs-ga-4.option.0",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-4.feedback.0"
          },
          {
            "id": "particle-wa-vs-ga-4-option-1",
            "textKey": "grammar.v2.particle-wa-vs-ga-4.option.1",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-4.feedback.1"
          },
          {
            "id": "particle-wa-vs-ga-4-option-2",
            "textKey": "grammar.v2.particle-wa-vs-ga-4.option.2",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-4.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-vs-ga-4.option.0",
          "grammar.v2.particle-wa-vs-ga-4.option.1",
          "grammar.v2.particle-wa-vs-ga-4.option.2"
        ],
        "answer": 0
      },
      {
        "id": "particle-wa-vs-ga-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-wa-vs-ga",
        "conceptId": "particle-wa-vs-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wa-vs-ga-5.prompt",
        "successKey": "grammar.v2.particle-wa-vs-ga-5.explanation",
        "errorKey": "grammar.v2.particle-wa-vs-ga-5.explanation",
        "options": [
          {
            "id": "particle-wa-vs-ga-5-option-0",
            "textKey": "grammar.v2.particle-wa-vs-ga-5.option.0",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-5.feedback.0"
          },
          {
            "id": "particle-wa-vs-ga-5-option-1",
            "textKey": "grammar.v2.particle-wa-vs-ga-5.option.1",
            "feedbackKey": "grammar.v2.particle-wa-vs-ga-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wa-vs-ga-5.option.0",
          "grammar.v2.particle-wa-vs-ga-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "particle-no-noun-link",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 10,
    "titleKey": "grammar.v2.particle-no-noun-link.title",
    "summaryKey": "grammar.v2.particle-no-noun-link.summary",
    "goalKey": "grammar.v2.particle-no-noun-link.goal",
    "prerequisiteIds": [
      "state-being-plain"
    ],
    "relatedIds": [
      "demonstratives-ko-so-a-do",
      "position-words"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-no-noun-link.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "A の B"
        }
      ],
      "examples": [
        {
          "japanese": "ゆきさんの本",
          "reading": "ゆきさんのほん",
          "meaningKey": "grammar.v2.particle-no-noun-link.example.0"
        },
        {
          "japanese": "日本の車",
          "reading": "にほんのくるま",
          "meaningKey": "grammar.v2.particle-no-noun-link.example.1"
        },
        {
          "japanese": "日本語の先生",
          "reading": "にほんごのせんせい",
          "meaningKey": "grammar.v2.particle-no-noun-link.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-no-noun-link.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-no-noun-link.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-no-noun-link-1",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-no-noun-link",
        "conceptId": "particle-no-noun-link",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.particle-no-noun-link-1.prompt",
        "successKey": "grammar.v2.particle-no-noun-link-1.explanation",
        "errorKey": "grammar.v2.particle-no-noun-link-1.explanation",
        "tokenKeys": [
          "grammar.v2.particle-no-noun-link-1.token.0",
          "grammar.v2.particle-no-noun-link-1.token.1",
          "grammar.v2.particle-no-noun-link-1.token.2"
        ],
        "solution": [
          1,
          2,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "particle-no-noun-link-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "particle-no-noun-link",
        "conceptId": "particle-no-noun-link",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-no-noun-link-2.prompt",
        "successKey": "grammar.v2.particle-no-noun-link-2.explanation",
        "errorKey": "grammar.v2.particle-no-noun-link-2.explanation",
        "options": [
          {
            "id": "particle-no-noun-link-2-option-0",
            "textKey": "grammar.v2.particle-no-noun-link-2.option.0",
            "feedbackKey": "grammar.v2.particle-no-noun-link-2.feedback.0"
          },
          {
            "id": "particle-no-noun-link-2-option-1",
            "textKey": "grammar.v2.particle-no-noun-link-2.option.1",
            "feedbackKey": "grammar.v2.particle-no-noun-link-2.feedback.1"
          },
          {
            "id": "particle-no-noun-link-2-option-2",
            "textKey": "grammar.v2.particle-no-noun-link-2.option.2",
            "feedbackKey": "grammar.v2.particle-no-noun-link-2.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-no-noun-link-2.option.0",
          "grammar.v2.particle-no-noun-link-2.option.1",
          "grammar.v2.particle-no-noun-link-2.option.2"
        ],
        "answer": 0
      },
      {
        "id": "particle-no-noun-link-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-no-noun-link",
        "conceptId": "particle-no-noun-link",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-no-noun-link-3.prompt",
        "successKey": "grammar.v2.particle-no-noun-link-3.explanation",
        "errorKey": "grammar.v2.particle-no-noun-link-3.explanation",
        "acceptedAnswers": [
          "の"
        ],
        "solutionKey": "grammar.v2.particle-no-noun-link-3.solution",
        "kanaBank": [
          "い",
          "か",
          "え",
          "く",
          "が",
          "の"
        ]
      },
      {
        "id": "particle-no-noun-link-4",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "particle-no-noun-link",
        "conceptId": "particle-no-noun-link",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.particle-no-noun-link-4.prompt",
        "successKey": "grammar.v2.particle-no-noun-link-4.explanation",
        "errorKey": "grammar.v2.particle-no-noun-link-4.explanation",
        "tokenKeys": [
          "grammar.v2.particle-no-noun-link-4.token.0",
          "grammar.v2.particle-no-noun-link-4.token.1",
          "grammar.v2.particle-no-noun-link-4.token.2"
        ],
        "solution": [
          2,
          0,
          1
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "particle-no-noun-link-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "particle-no-noun-link",
        "conceptId": "particle-no-noun-link",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-no-noun-link-5.prompt",
        "successKey": "grammar.v2.particle-no-noun-link-5.explanation",
        "errorKey": "grammar.v2.particle-no-noun-link-5.explanation",
        "options": [
          {
            "id": "particle-no-noun-link-5-option-0",
            "textKey": "grammar.v2.particle-no-noun-link-5.option.0",
            "feedbackKey": "grammar.v2.particle-no-noun-link-5.feedback.0"
          },
          {
            "id": "particle-no-noun-link-5-option-1",
            "textKey": "grammar.v2.particle-no-noun-link-5.option.1",
            "feedbackKey": "grammar.v2.particle-no-noun-link-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-no-noun-link-5.option.0",
          "grammar.v2.particle-no-noun-link-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "demonstratives-ko-so-a-do",
    "level": "N5",
    "track": "core",
    "topicId": "01",
    "order": 11,
    "titleKey": "grammar.v2.demonstratives-ko-so-a-do.title",
    "summaryKey": "grammar.v2.demonstratives-ko-so-a-do.summary",
    "goalKey": "grammar.v2.demonstratives-ko-so-a-do.goal",
    "prerequisiteIds": [
      "particle-wa-topic",
      "particle-no-noun-link"
    ],
    "relatedIds": [
      "question-words-basic"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.demonstratives-ko-so-a-do.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "これ → これは本だ。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "この + 本 → この本"
        }
      ],
      "examples": [
        {
          "japanese": "これは本だ。",
          "reading": "これはほんだ。",
          "meaningKey": "grammar.v2.demonstratives-ko-so-a-do.example.0"
        },
        {
          "japanese": "この本",
          "reading": "このほん",
          "meaningKey": "grammar.v2.demonstratives-ko-so-a-do.example.1"
        },
        {
          "japanese": "ここ",
          "reading": "ここ",
          "meaningKey": "grammar.v2.demonstratives-ko-so-a-do.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.demonstratives-ko-so-a-do.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.demonstratives-ko-so-a-do.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "これ本",
          "correction": "この本",
          "explanationKey": "grammar.v2.demonstratives-ko-so-a-do.mistake.0"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.system",
          "headerKeys": [
            "grammar.v2.speaker",
            "grammar.v2.listener",
            "grammar.v2.far",
            "grammar.v2.question"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.thing",
              "cells": [
                "これ",
                "それ",
                "あれ",
                "どれ"
              ]
            },
            {
              "labelKey": "grammar.v2.noun",
              "cells": [
                "この",
                "その",
                "あの",
                "どの"
              ]
            },
            {
              "labelKey": "grammar.v2.place",
              "cells": [
                "ここ",
                "そこ",
                "あそこ",
                "どこ"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "demonstratives-ko-so-a-do-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "demonstratives-ko-so-a-do",
        "conceptId": "demonstratives-ko-so-a-do",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.demonstratives-ko-so-a-do-1.prompt",
        "successKey": "grammar.v2.demonstratives-ko-so-a-do-1.explanation",
        "errorKey": "grammar.v2.demonstratives-ko-so-a-do-1.explanation",
        "options": [
          {
            "id": "demonstratives-ko-so-a-do-1-option-0",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-1.option.0",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-1-option-1",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-1.option.1",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-1-option-2",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-1.option.2",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-1.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-1-option-3",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-1.option.3",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-1.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.demonstratives-ko-so-a-do-1.option.0",
          "grammar.v2.demonstratives-ko-so-a-do-1.option.1",
          "grammar.v2.demonstratives-ko-so-a-do-1.option.2",
          "grammar.v2.demonstratives-ko-so-a-do-1.option.3"
        ],
        "answer": 0
      },
      {
        "id": "demonstratives-ko-so-a-do-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "demonstratives-ko-so-a-do",
        "conceptId": "demonstratives-ko-so-a-do",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.demonstratives-ko-so-a-do-2.prompt",
        "successKey": "grammar.v2.demonstratives-ko-so-a-do-2.explanation",
        "errorKey": "grammar.v2.demonstratives-ko-so-a-do-2.explanation",
        "options": [
          {
            "id": "demonstratives-ko-so-a-do-2-option-0",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-2.option.0",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-2-option-1",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-2.option.1",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-2.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-2-option-2",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-2.option.2",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-2.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-2-option-3",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-2.option.3",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-2.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.demonstratives-ko-so-a-do-2.option.0",
          "grammar.v2.demonstratives-ko-so-a-do-2.option.1",
          "grammar.v2.demonstratives-ko-so-a-do-2.option.2",
          "grammar.v2.demonstratives-ko-so-a-do-2.option.3"
        ],
        "answer": 1
      },
      {
        "id": "demonstratives-ko-so-a-do-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "demonstratives-ko-so-a-do",
        "conceptId": "demonstratives-ko-so-a-do",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.demonstratives-ko-so-a-do-3.prompt",
        "successKey": "grammar.v2.demonstratives-ko-so-a-do-3.explanation",
        "errorKey": "grammar.v2.demonstratives-ko-so-a-do-3.explanation",
        "acceptedAnswers": [
          "この"
        ],
        "solutionKey": "grammar.v2.demonstratives-ko-so-a-do-3.solution",
        "kanaBank": [
          "と",
          "に",
          "な",
          "は",
          "の",
          "こ"
        ]
      },
      {
        "id": "demonstratives-ko-so-a-do-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "01",
        "lessonId": "demonstratives-ko-so-a-do",
        "conceptId": "demonstratives-ko-so-a-do",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.demonstratives-ko-so-a-do-4.prompt",
        "successKey": "grammar.v2.demonstratives-ko-so-a-do-4.explanation",
        "errorKey": "grammar.v2.demonstratives-ko-so-a-do-4.explanation",
        "options": [
          {
            "id": "demonstratives-ko-so-a-do-4-option-0",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-4.option.0",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-4-option-1",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-4.option.1",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-4.feedback.1",
            "grammarStatus": "invalid"
          }
        ],
        "optionKeys": [
          "grammar.v2.demonstratives-ko-so-a-do-4.option.0",
          "grammar.v2.demonstratives-ko-so-a-do-4.option.1"
        ],
        "answer": 1
      },
      {
        "id": "demonstratives-ko-so-a-do-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "demonstratives-ko-so-a-do",
        "conceptId": "demonstratives-ko-so-a-do",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.demonstratives-ko-so-a-do-5.prompt",
        "successKey": "grammar.v2.demonstratives-ko-so-a-do-5.explanation",
        "errorKey": "grammar.v2.demonstratives-ko-so-a-do-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-5.left.0",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-5.right.0"
          },
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-5.left.1",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-5.right.1"
          },
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-5.left.2",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-5.right.2"
          },
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-5.left.3",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-5.right.3"
          }
        ]
      },
      {
        "id": "demonstratives-ko-so-a-do-6",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "demonstratives-ko-so-a-do",
        "conceptId": "demonstratives-ko-so-a-do",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.demonstratives-ko-so-a-do-6.prompt",
        "successKey": "grammar.v2.demonstratives-ko-so-a-do-6.explanation",
        "errorKey": "grammar.v2.demonstratives-ko-so-a-do-6.explanation",
        "options": [
          {
            "id": "demonstratives-ko-so-a-do-6-option-0",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-6.option.0",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-6.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-6-option-1",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-6.option.1",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-6.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "demonstratives-ko-so-a-do-6-option-2",
            "textKey": "grammar.v2.demonstratives-ko-so-a-do-6.option.2",
            "feedbackKey": "grammar.v2.demonstratives-ko-so-a-do-6.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.demonstratives-ko-so-a-do-6.option.0",
          "grammar.v2.demonstratives-ko-so-a-do-6.option.1",
          "grammar.v2.demonstratives-ko-so-a-do-6.option.2"
        ],
        "answer": 0
      },
      {
        "id": "demonstratives-ko-so-a-do-7",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "01",
        "lessonId": "demonstratives-ko-so-a-do",
        "conceptId": "demonstratives-ko-so-a-do",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.demonstratives-ko-so-a-do-7.prompt",
        "successKey": "grammar.v2.demonstratives-ko-so-a-do-7.explanation",
        "errorKey": "grammar.v2.demonstratives-ko-so-a-do-7.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-7.left.0",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-7.right.0"
          },
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-7.left.1",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-7.right.1"
          },
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-7.left.2",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-7.right.2"
          },
          {
            "leftKey": "grammar.v2.demonstratives-ko-so-a-do-7.left.3",
            "rightKey": "grammar.v2.demonstratives-ko-so-a-do-7.right.3"
          }
        ]
      }
    ]
  },
  {
    "id": "adjective-na",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 1,
    "titleKey": "grammar.v2.adjective-na.title",
    "summaryKey": "grammar.v2.adjective-na.summary",
    "goalKey": "grammar.v2.adjective-na.goal",
    "prerequisiteIds": [
      "state-being-plain",
      "state-being-negative",
      "state-being-past",
      "state-being-past-negative"
    ],
    "relatedIds": [
      "adjective-i",
      "adjective-noun-modification",
      "adjective-negative",
      "adjective-past",
      "adjectival-predicates-ga",
      "adjective-adverb-ku-ni",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-na.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生だ → 静かだ"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "静か + な + 町 → 静かな町"
        }
      ],
      "examples": [
        {
          "japanese": "静かだ。",
          "reading": "しずかだ。",
          "meaningKey": "grammar.v2.adjective-na.example.0"
        },
        {
          "japanese": "静かじゃない。",
          "reading": "しずかじゃない。",
          "meaningKey": "grammar.v2.adjective-na.example.1"
        },
        {
          "japanese": "静かだった。",
          "reading": "しずかだった。",
          "meaningKey": "grammar.v2.adjective-na.example.2"
        },
        {
          "japanese": "静かじゃなかった。",
          "reading": "しずかじゃなかった。",
          "meaningKey": "grammar.v2.adjective-na.example.3"
        },
        {
          "japanese": "元気だ。",
          "reading": "げんきだ。",
          "meaningKey": "grammar.v2.adjective-na.example.4"
        },
        {
          "japanese": "静かな町",
          "reading": "しずかなまち",
          "meaningKey": "grammar.v2.adjective-na.example.5"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-na.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-na.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [
        {
          "left": "学生じゃなかった。",
          "right": "静かじゃなかった。",
          "explanationKey": "grammar.v2.adjective-na.contrast.0"
        }
      ]
    },
    "exercises": [
      {
        "id": "adjective-na-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-na",
        "conceptId": "adjective-na",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-na-1.prompt",
        "successKey": "grammar.v2.adjective-na-1.explanation",
        "errorKey": "grammar.v2.adjective-na-1.explanation",
        "options": [
          {
            "id": "adjective-na-1-option-0",
            "textKey": "grammar.v2.adjective-na-1.option.0",
            "feedbackKey": "grammar.v2.adjective-na-1.feedback.0"
          },
          {
            "id": "adjective-na-1-option-1",
            "textKey": "grammar.v2.adjective-na-1.option.1",
            "feedbackKey": "grammar.v2.adjective-na-1.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-na-1.option.0",
          "grammar.v2.adjective-na-1.option.1"
        ],
        "answer": 0
      },
      {
        "id": "adjective-na-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-na",
        "conceptId": "adjective-na",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-na-2.prompt",
        "successKey": "grammar.v2.adjective-na-2.explanation",
        "errorKey": "grammar.v2.adjective-na-2.explanation",
        "acceptedAnswers": [
          "だ"
        ],
        "solutionKey": "grammar.v2.adjective-na-2.solution",
        "kanaBank": [
          "ん",
          "を",
          "れ",
          "ら",
          "る",
          "だ"
        ]
      },
      {
        "id": "adjective-na-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-na",
        "conceptId": "adjective-na",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.adjective-na-3.prompt",
        "successKey": "grammar.v2.adjective-na-3.explanation",
        "errorKey": "grammar.v2.adjective-na-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.adjective-na-3.left.0",
            "rightKey": "grammar.v2.adjective-na-3.right.0"
          },
          {
            "leftKey": "grammar.v2.adjective-na-3.left.1",
            "rightKey": "grammar.v2.adjective-na-3.right.1"
          }
        ]
      },
      {
        "id": "adjective-na-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-na",
        "conceptId": "adjective-na",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-na-4.prompt",
        "successKey": "grammar.v2.adjective-na-4.explanation",
        "errorKey": "grammar.v2.adjective-na-4.explanation",
        "options": [
          {
            "id": "adjective-na-4-option-0",
            "textKey": "grammar.v2.adjective-na-4.option.0",
            "feedbackKey": "grammar.v2.adjective-na-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-na-4-option-1",
            "textKey": "grammar.v2.adjective-na-4.option.1",
            "feedbackKey": "grammar.v2.adjective-na-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-na-4-option-2",
            "textKey": "grammar.v2.adjective-na-4.option.2",
            "feedbackKey": "grammar.v2.adjective-na-4.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-na-4-option-3",
            "textKey": "grammar.v2.adjective-na-4.option.3",
            "feedbackKey": "grammar.v2.adjective-na-4.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-na-4.option.0",
          "grammar.v2.adjective-na-4.option.1",
          "grammar.v2.adjective-na-4.option.2",
          "grammar.v2.adjective-na-4.option.3"
        ],
        "answer": 2
      },
      {
        "id": "adjective-na-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-na",
        "conceptId": "adjective-na",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-na-5.prompt",
        "successKey": "grammar.v2.adjective-na-5.explanation",
        "errorKey": "grammar.v2.adjective-na-5.explanation",
        "options": [
          {
            "id": "adjective-na-5-option-0",
            "textKey": "grammar.v2.adjective-na-5.option.0",
            "feedbackKey": "grammar.v2.adjective-na-5.feedback.0"
          },
          {
            "id": "adjective-na-5-option-1",
            "textKey": "grammar.v2.adjective-na-5.option.1",
            "feedbackKey": "grammar.v2.adjective-na-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-na-5.option.0",
          "grammar.v2.adjective-na-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "adjective-i",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 2,
    "titleKey": "grammar.v2.adjective-i.title",
    "summaryKey": "grammar.v2.adjective-i.summary",
    "goalKey": "grammar.v2.adjective-i.goal",
    "prerequisiteIds": [
      "state-being-plain",
      "adjective-na"
    ],
    "relatedIds": [
      "adjective-noun-modification",
      "adjective-negative",
      "adjective-past",
      "adjective-adverb-ku-ni",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-i.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高い。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "かわいい。"
        }
      ],
      "examples": [
        {
          "japanese": "高い。",
          "reading": "たかい。",
          "meaningKey": "grammar.v2.adjective-i.example.0"
        },
        {
          "japanese": "面白い。",
          "reading": "おもしろい。",
          "meaningKey": "grammar.v2.adjective-i.example.1"
        },
        {
          "japanese": "かわいい。",
          "reading": "かわいい。",
          "meaningKey": "grammar.v2.adjective-i.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-i.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-i.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "高いだ。",
          "correction": "高い。",
          "explanationKey": "grammar.v2.adjective-i.mistake.0"
        },
        {
          "wrong": "かわいいだ。",
          "correction": "かわいい。",
          "explanationKey": "grammar.v2.adjective-i.mistake.1"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "adjective-i-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-i",
        "conceptId": "adjective-i",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-i-1.prompt",
        "successKey": "grammar.v2.adjective-i-1.explanation",
        "errorKey": "grammar.v2.adjective-i-1.explanation",
        "options": [
          {
            "id": "adjective-i-1-option-0",
            "textKey": "grammar.v2.adjective-i-1.option.0",
            "feedbackKey": "grammar.v2.adjective-i-1.feedback.0"
          },
          {
            "id": "adjective-i-1-option-1",
            "textKey": "grammar.v2.adjective-i-1.option.1",
            "feedbackKey": "grammar.v2.adjective-i-1.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-i-1.option.0",
          "grammar.v2.adjective-i-1.option.1"
        ],
        "answer": 1
      },
      {
        "id": "adjective-i-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-i",
        "conceptId": "adjective-i",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.adjective-i-2.prompt",
        "successKey": "grammar.v2.adjective-i-2.explanation",
        "errorKey": "grammar.v2.adjective-i-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.adjective-i-2.left.0",
            "rightKey": "grammar.v2.adjective-i-2.right.0"
          },
          {
            "leftKey": "grammar.v2.adjective-i-2.left.1",
            "rightKey": "grammar.v2.adjective-i-2.right.1"
          }
        ]
      },
      {
        "id": "adjective-i-3",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-i",
        "conceptId": "adjective-i",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.adjective-i-3.prompt",
        "successKey": "grammar.v2.adjective-i-3.explanation",
        "errorKey": "grammar.v2.adjective-i-3.explanation",
        "options": [
          {
            "id": "adjective-i-3-option-0",
            "textKey": "grammar.v2.adjective-i-3.option.0",
            "feedbackKey": "grammar.v2.adjective-i-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-i-3-option-1",
            "textKey": "grammar.v2.adjective-i-3.option.1",
            "feedbackKey": "grammar.v2.adjective-i-3.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-i-3-option-2",
            "textKey": "grammar.v2.adjective-i-3.option.2",
            "feedbackKey": "grammar.v2.adjective-i-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-i-3.option.0",
          "grammar.v2.adjective-i-3.option.1",
          "grammar.v2.adjective-i-3.option.2"
        ],
        "answer": 1
      },
      {
        "id": "adjective-i-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-i",
        "conceptId": "adjective-i",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-i-4.prompt",
        "successKey": "grammar.v2.adjective-i-4.explanation",
        "errorKey": "grammar.v2.adjective-i-4.explanation",
        "options": [
          {
            "id": "adjective-i-4-option-0",
            "textKey": "grammar.v2.adjective-i-4.option.0",
            "feedbackKey": "grammar.v2.adjective-i-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-i-4-option-1",
            "textKey": "grammar.v2.adjective-i-4.option.1",
            "feedbackKey": "grammar.v2.adjective-i-4.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-i-4-option-2",
            "textKey": "grammar.v2.adjective-i-4.option.2",
            "feedbackKey": "grammar.v2.adjective-i-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-i-4.option.0",
          "grammar.v2.adjective-i-4.option.1",
          "grammar.v2.adjective-i-4.option.2"
        ],
        "answer": 0
      },
      {
        "id": "adjective-i-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-i",
        "conceptId": "adjective-i",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-i-5.prompt",
        "successKey": "grammar.v2.adjective-i-5.explanation",
        "errorKey": "grammar.v2.adjective-i-5.explanation",
        "options": [
          {
            "id": "adjective-i-5-option-0",
            "textKey": "grammar.v2.adjective-i-5.option.0",
            "feedbackKey": "grammar.v2.adjective-i-5.feedback.0"
          },
          {
            "id": "adjective-i-5-option-1",
            "textKey": "grammar.v2.adjective-i-5.option.1",
            "feedbackKey": "grammar.v2.adjective-i-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-i-5.option.0",
          "grammar.v2.adjective-i-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "adjective-noun-modification",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 3,
    "titleKey": "grammar.v2.adjective-noun-modification.title",
    "summaryKey": "grammar.v2.adjective-noun-modification.summary",
    "goalKey": "grammar.v2.adjective-noun-modification.goal",
    "prerequisiteIds": [
      "adjective-na",
      "adjective-i"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-noun-modification.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高い + 本 → 高い本"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "静かだ → 静か + な + 町"
        }
      ],
      "examples": [
        {
          "japanese": "大きい家",
          "reading": "おおきいいえ",
          "meaningKey": "grammar.v2.adjective-noun-modification.example.0"
        },
        {
          "japanese": "新しい本",
          "reading": "あたらしいほん",
          "meaningKey": "grammar.v2.adjective-noun-modification.example.1"
        },
        {
          "japanese": "おいしい食べ物",
          "reading": "おいしいたべもの",
          "meaningKey": "grammar.v2.adjective-noun-modification.example.2"
        },
        {
          "japanese": "静かな町",
          "reading": "しずかなまち",
          "meaningKey": "grammar.v2.adjective-noun-modification.example.3"
        },
        {
          "japanese": "きれいな部屋",
          "reading": "きれいなへや",
          "meaningKey": "grammar.v2.adjective-noun-modification.example.4"
        },
        {
          "japanese": "元気な人",
          "reading": "げんきなひと",
          "meaningKey": "grammar.v2.adjective-noun-modification.example.5"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-noun-modification.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-noun-modification.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "大きいな家",
          "correction": "大きい家",
          "explanationKey": "grammar.v2.adjective-noun-modification.mistake.0"
        },
        {
          "wrong": "静か町",
          "correction": "静かな町",
          "explanationKey": "grammar.v2.adjective-noun-modification.mistake.1"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.adjectives.link",
          "headerKeys": [
            "grammar.v2.adjectives.pred",
            "grammar.v2.adjectives.noun"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.adjectives.i",
              "cells": [
                "高い",
                "高い本"
              ]
            },
            {
              "labelKey": "grammar.v2.adjectives.na",
              "cells": [
                "静かだ",
                "静かな町"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "adjective-noun-modification-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-noun-modification",
        "conceptId": "adjective-noun-modification",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-noun-modification-1.prompt",
        "successKey": "grammar.v2.adjective-noun-modification-1.explanation",
        "errorKey": "grammar.v2.adjective-noun-modification-1.explanation",
        "acceptedAnswers": [
          "な"
        ],
        "solutionKey": "grammar.v2.adjective-noun-modification-1.solution",
        "kanaBank": [
          "し",
          "か",
          "え",
          "く",
          "が",
          "な"
        ]
      },
      {
        "id": "adjective-noun-modification-2",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-noun-modification",
        "conceptId": "adjective-noun-modification",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.adjective-noun-modification-2.prompt",
        "successKey": "grammar.v2.adjective-noun-modification-2.explanation",
        "errorKey": "grammar.v2.adjective-noun-modification-2.explanation",
        "tokenKeys": [
          "grammar.v2.adjective-noun-modification-2.token.0",
          "grammar.v2.adjective-noun-modification-2.token.1"
        ],
        "solution": [
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "adjective-noun-modification-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-noun-modification",
        "conceptId": "adjective-noun-modification",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-noun-modification-3.prompt",
        "successKey": "grammar.v2.adjective-noun-modification-3.explanation",
        "errorKey": "grammar.v2.adjective-noun-modification-3.explanation",
        "options": [
          {
            "id": "adjective-noun-modification-3-option-0",
            "textKey": "grammar.v2.adjective-noun-modification-3.option.0",
            "feedbackKey": "grammar.v2.adjective-noun-modification-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-noun-modification-3-option-1",
            "textKey": "grammar.v2.adjective-noun-modification-3.option.1",
            "feedbackKey": "grammar.v2.adjective-noun-modification-3.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-noun-modification-3-option-2",
            "textKey": "grammar.v2.adjective-noun-modification-3.option.2",
            "feedbackKey": "grammar.v2.adjective-noun-modification-3.feedback.2",
            "grammarStatus": "invalid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-noun-modification-3.option.0",
          "grammar.v2.adjective-noun-modification-3.option.1",
          "grammar.v2.adjective-noun-modification-3.option.2"
        ],
        "answer": 0
      },
      {
        "id": "adjective-noun-modification-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-noun-modification",
        "conceptId": "adjective-noun-modification",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.adjective-noun-modification-4.prompt",
        "successKey": "grammar.v2.adjective-noun-modification-4.explanation",
        "errorKey": "grammar.v2.adjective-noun-modification-4.explanation",
        "options": [
          {
            "id": "adjective-noun-modification-4-option-0",
            "textKey": "grammar.v2.adjective-noun-modification-4.option.0",
            "feedbackKey": "grammar.v2.adjective-noun-modification-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-noun-modification-4-option-1",
            "textKey": "grammar.v2.adjective-noun-modification-4.option.1",
            "feedbackKey": "grammar.v2.adjective-noun-modification-4.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-noun-modification-4-option-2",
            "textKey": "grammar.v2.adjective-noun-modification-4.option.2",
            "feedbackKey": "grammar.v2.adjective-noun-modification-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-noun-modification-4.option.0",
          "grammar.v2.adjective-noun-modification-4.option.1",
          "grammar.v2.adjective-noun-modification-4.option.2"
        ],
        "answer": 1
      },
      {
        "id": "adjective-noun-modification-5",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-noun-modification",
        "conceptId": "adjective-noun-modification",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.adjective-noun-modification-5.prompt",
        "successKey": "grammar.v2.adjective-noun-modification-5.explanation",
        "errorKey": "grammar.v2.adjective-noun-modification-5.explanation",
        "tokenKeys": [
          "grammar.v2.adjective-noun-modification-5.token.0",
          "grammar.v2.adjective-noun-modification-5.token.1",
          "grammar.v2.adjective-noun-modification-5.token.2"
        ],
        "solution": [
          2,
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "adjective-noun-modification-6",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-noun-modification",
        "conceptId": "adjective-noun-modification",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-noun-modification-6.prompt",
        "successKey": "grammar.v2.adjective-noun-modification-6.explanation",
        "errorKey": "grammar.v2.adjective-noun-modification-6.explanation",
        "options": [
          {
            "id": "adjective-noun-modification-6-option-0",
            "textKey": "grammar.v2.adjective-noun-modification-6.option.0",
            "feedbackKey": "grammar.v2.adjective-noun-modification-6.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-noun-modification-6-option-1",
            "textKey": "grammar.v2.adjective-noun-modification-6.option.1",
            "feedbackKey": "grammar.v2.adjective-noun-modification-6.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-noun-modification-6-option-2",
            "textKey": "grammar.v2.adjective-noun-modification-6.option.2",
            "feedbackKey": "grammar.v2.adjective-noun-modification-6.feedback.2",
            "grammarStatus": "invalid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-noun-modification-6.option.0",
          "grammar.v2.adjective-noun-modification-6.option.1",
          "grammar.v2.adjective-noun-modification-6.option.2"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "adjective-negative",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 4,
    "titleKey": "grammar.v2.adjective-negative.title",
    "summaryKey": "grammar.v2.adjective-negative.summary",
    "goalKey": "grammar.v2.adjective-negative.goal",
    "prerequisiteIds": [
      "adjective-na",
      "adjective-i",
      "state-being-negative"
    ],
    "relatedIds": [
      "adjective-past-negative",
      "adjective-ii-irregular",
      "degree-adverbs",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-negative.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "静かだ → 静かじゃない"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高い → 高くない"
        }
      ],
      "examples": [
        {
          "japanese": "静かじゃない。",
          "reading": "しずかじゃない。",
          "meaningKey": "grammar.v2.adjective-negative.example.0"
        },
        {
          "japanese": "高くない。",
          "reading": "たかくない。",
          "meaningKey": "grammar.v2.adjective-negative.example.1"
        },
        {
          "japanese": "かわいくない。",
          "reading": "かわいくない。",
          "meaningKey": "grammar.v2.adjective-negative.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-negative.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-negative.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "高いくない。",
          "correction": "高くない。",
          "explanationKey": "grammar.v2.adjective-negative.mistake.0"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.adjectives.negative",
          "headerKeys": [
            "grammar.v2.positive",
            "grammar.v2.negative"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.adjectives.na",
              "cells": [
                "静かだ",
                "静かじゃない"
              ]
            },
            {
              "labelKey": "grammar.v2.adjectives.i",
              "cells": [
                "高い",
                "高くない"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "adjective-negative-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-negative",
        "conceptId": "adjective-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-negative-1.prompt",
        "successKey": "grammar.v2.adjective-negative-1.explanation",
        "errorKey": "grammar.v2.adjective-negative-1.explanation",
        "acceptedAnswers": [
          "くない"
        ],
        "solutionKey": "grammar.v2.adjective-negative-1.solution",
        "kanaBank": [
          "の",
          "は",
          "と",
          "な",
          "く",
          "い"
        ]
      },
      {
        "id": "adjective-negative-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-negative",
        "conceptId": "adjective-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-negative-2.prompt",
        "successKey": "grammar.v2.adjective-negative-2.explanation",
        "errorKey": "grammar.v2.adjective-negative-2.explanation",
        "options": [
          {
            "id": "adjective-negative-2-option-0",
            "textKey": "grammar.v2.adjective-negative-2.option.0",
            "feedbackKey": "grammar.v2.adjective-negative-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-negative-2-option-1",
            "textKey": "grammar.v2.adjective-negative-2.option.1",
            "feedbackKey": "grammar.v2.adjective-negative-2.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-negative-2-option-2",
            "textKey": "grammar.v2.adjective-negative-2.option.2",
            "feedbackKey": "grammar.v2.adjective-negative-2.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-negative-2-option-3",
            "textKey": "grammar.v2.adjective-negative-2.option.3",
            "feedbackKey": "grammar.v2.adjective-negative-2.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-negative-2.option.0",
          "grammar.v2.adjective-negative-2.option.1",
          "grammar.v2.adjective-negative-2.option.2",
          "grammar.v2.adjective-negative-2.option.3"
        ],
        "answer": 1
      },
      {
        "id": "adjective-negative-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-negative",
        "conceptId": "adjective-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-negative-3.prompt",
        "successKey": "grammar.v2.adjective-negative-3.explanation",
        "errorKey": "grammar.v2.adjective-negative-3.explanation",
        "options": [
          {
            "id": "adjective-negative-3-option-0",
            "textKey": "grammar.v2.adjective-negative-3.option.0",
            "feedbackKey": "grammar.v2.adjective-negative-3.feedback.0"
          },
          {
            "id": "adjective-negative-3-option-1",
            "textKey": "grammar.v2.adjective-negative-3.option.1",
            "feedbackKey": "grammar.v2.adjective-negative-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-negative-3.option.0",
          "grammar.v2.adjective-negative-3.option.1"
        ],
        "answer": 1
      },
      {
        "id": "adjective-negative-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-negative",
        "conceptId": "adjective-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-negative-4.prompt",
        "successKey": "grammar.v2.adjective-negative-4.explanation",
        "errorKey": "grammar.v2.adjective-negative-4.explanation",
        "options": [
          {
            "id": "adjective-negative-4-option-0",
            "textKey": "grammar.v2.adjective-negative-4.option.0",
            "feedbackKey": "grammar.v2.adjective-negative-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-negative-4-option-1",
            "textKey": "grammar.v2.adjective-negative-4.option.1",
            "feedbackKey": "grammar.v2.adjective-negative-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-negative-4-option-2",
            "textKey": "grammar.v2.adjective-negative-4.option.2",
            "feedbackKey": "grammar.v2.adjective-negative-4.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-negative-4-option-3",
            "textKey": "grammar.v2.adjective-negative-4.option.3",
            "feedbackKey": "grammar.v2.adjective-negative-4.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-negative-4.option.0",
          "grammar.v2.adjective-negative-4.option.1",
          "grammar.v2.adjective-negative-4.option.2",
          "grammar.v2.adjective-negative-4.option.3"
        ],
        "answer": 1
      },
      {
        "id": "adjective-negative-5",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-negative",
        "conceptId": "adjective-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.adjective-negative-5.prompt",
        "successKey": "grammar.v2.adjective-negative-5.explanation",
        "errorKey": "grammar.v2.adjective-negative-5.explanation",
        "options": [
          {
            "id": "adjective-negative-5-option-0",
            "textKey": "grammar.v2.adjective-negative-5.option.0",
            "feedbackKey": "grammar.v2.adjective-negative-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-negative-5-option-1",
            "textKey": "grammar.v2.adjective-negative-5.option.1",
            "feedbackKey": "grammar.v2.adjective-negative-5.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-negative-5-option-2",
            "textKey": "grammar.v2.adjective-negative-5.option.2",
            "feedbackKey": "grammar.v2.adjective-negative-5.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-negative-5.option.0",
          "grammar.v2.adjective-negative-5.option.1",
          "grammar.v2.adjective-negative-5.option.2"
        ],
        "answer": 1
      }
    ]
  },
  {
    "id": "adjective-past",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 5,
    "titleKey": "grammar.v2.adjective-past.title",
    "summaryKey": "grammar.v2.adjective-past.summary",
    "goalKey": "grammar.v2.adjective-past.goal",
    "prerequisiteIds": [
      "adjective-na",
      "adjective-i",
      "state-being-past"
    ],
    "relatedIds": [
      "adjective-past-negative",
      "adjective-ii-irregular",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-past.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "静かだ → 静かだった"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高い → 高かった"
        }
      ],
      "examples": [
        {
          "japanese": "昨日、町は静かだった。",
          "reading": "きのう、まちはしずかだった。",
          "meaningKey": "grammar.v2.adjective-past.example.0"
        },
        {
          "japanese": "本は高かった。",
          "reading": "ほんはたかかった。",
          "meaningKey": "grammar.v2.adjective-past.example.1"
        },
        {
          "japanese": "面白かった。",
          "reading": "おもしろかった。",
          "meaningKey": "grammar.v2.adjective-past.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-past.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-past.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "高いだった。",
          "correction": "高かった。",
          "explanationKey": "grammar.v2.adjective-past.mistake.0"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.adjectives.past",
          "headerKeys": [
            "grammar.v2.nonpast",
            "grammar.v2.past"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.adjectives.na",
              "cells": [
                "静かだ",
                "静かだった"
              ]
            },
            {
              "labelKey": "grammar.v2.adjectives.i",
              "cells": [
                "高い",
                "高かった"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "adjective-past-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-past",
        "conceptId": "adjective-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-past-1.prompt",
        "successKey": "grammar.v2.adjective-past-1.explanation",
        "errorKey": "grammar.v2.adjective-past-1.explanation",
        "acceptedAnswers": [
          "かった"
        ],
        "solutionKey": "grammar.v2.adjective-past-1.solution",
        "kanaBank": [
          "や",
          "ゃ",
          "も",
          "っ",
          "た",
          "か"
        ]
      },
      {
        "id": "adjective-past-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-past",
        "conceptId": "adjective-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-past-2.prompt",
        "successKey": "grammar.v2.adjective-past-2.explanation",
        "errorKey": "grammar.v2.adjective-past-2.explanation",
        "options": [
          {
            "id": "adjective-past-2-option-0",
            "textKey": "grammar.v2.adjective-past-2.option.0",
            "feedbackKey": "grammar.v2.adjective-past-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-2-option-1",
            "textKey": "grammar.v2.adjective-past-2.option.1",
            "feedbackKey": "grammar.v2.adjective-past-2.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-2-option-2",
            "textKey": "grammar.v2.adjective-past-2.option.2",
            "feedbackKey": "grammar.v2.adjective-past-2.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-2-option-3",
            "textKey": "grammar.v2.adjective-past-2.option.3",
            "feedbackKey": "grammar.v2.adjective-past-2.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-past-2.option.0",
          "grammar.v2.adjective-past-2.option.1",
          "grammar.v2.adjective-past-2.option.2",
          "grammar.v2.adjective-past-2.option.3"
        ],
        "answer": 2
      },
      {
        "id": "adjective-past-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-past",
        "conceptId": "adjective-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.adjective-past-3.prompt",
        "successKey": "grammar.v2.adjective-past-3.explanation",
        "errorKey": "grammar.v2.adjective-past-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.adjective-past-3.left.0",
            "rightKey": "grammar.v2.adjective-past-3.right.0"
          },
          {
            "leftKey": "grammar.v2.adjective-past-3.left.1",
            "rightKey": "grammar.v2.adjective-past-3.right.1"
          }
        ]
      },
      {
        "id": "adjective-past-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-past",
        "conceptId": "adjective-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-past-4.prompt",
        "successKey": "grammar.v2.adjective-past-4.explanation",
        "errorKey": "grammar.v2.adjective-past-4.explanation",
        "options": [
          {
            "id": "adjective-past-4-option-0",
            "textKey": "grammar.v2.adjective-past-4.option.0",
            "feedbackKey": "grammar.v2.adjective-past-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-4-option-1",
            "textKey": "grammar.v2.adjective-past-4.option.1",
            "feedbackKey": "grammar.v2.adjective-past-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-4-option-2",
            "textKey": "grammar.v2.adjective-past-4.option.2",
            "feedbackKey": "grammar.v2.adjective-past-4.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-4-option-3",
            "textKey": "grammar.v2.adjective-past-4.option.3",
            "feedbackKey": "grammar.v2.adjective-past-4.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-past-4.option.0",
          "grammar.v2.adjective-past-4.option.1",
          "grammar.v2.adjective-past-4.option.2",
          "grammar.v2.adjective-past-4.option.3"
        ],
        "answer": 2
      },
      {
        "id": "adjective-past-5",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-past",
        "conceptId": "adjective-past",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.adjective-past-5.prompt",
        "successKey": "grammar.v2.adjective-past-5.explanation",
        "errorKey": "grammar.v2.adjective-past-5.explanation",
        "options": [
          {
            "id": "adjective-past-5-option-0",
            "textKey": "grammar.v2.adjective-past-5.option.0",
            "feedbackKey": "grammar.v2.adjective-past-5.feedback.0",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-past-5-option-1",
            "textKey": "grammar.v2.adjective-past-5.option.1",
            "feedbackKey": "grammar.v2.adjective-past-5.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-5-option-2",
            "textKey": "grammar.v2.adjective-past-5.option.2",
            "feedbackKey": "grammar.v2.adjective-past-5.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-past-5.option.0",
          "grammar.v2.adjective-past-5.option.1",
          "grammar.v2.adjective-past-5.option.2"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "adjective-past-negative",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 6,
    "titleKey": "grammar.v2.adjective-past-negative.title",
    "summaryKey": "grammar.v2.adjective-past-negative.summary",
    "goalKey": "grammar.v2.adjective-past-negative.goal",
    "prerequisiteIds": [
      "adjective-negative",
      "adjective-past",
      "state-being-past-negative"
    ],
    "relatedIds": [
      "adjective-ii-irregular",
      "polite-desu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-past-negative.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "静かじゃない → 静かじゃなかった"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高くない → 高くなかった"
        }
      ],
      "examples": [
        {
          "japanese": "昨日、町は静かじゃなかった。",
          "reading": "きのう、まちはしずかじゃなかった。",
          "meaningKey": "grammar.v2.adjective-past-negative.example.0"
        },
        {
          "japanese": "本は高くなかった。",
          "reading": "ほんはたかくなかった。",
          "meaningKey": "grammar.v2.adjective-past-negative.example.1"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-past-negative.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-past-negative.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.adjectives.system",
          "headerKeys": [
            "grammar.v2.positive",
            "grammar.v2.negative"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.adjectives.naNow",
              "cells": [
                "静かだ",
                "静かじゃない"
              ]
            },
            {
              "labelKey": "grammar.v2.adjectives.naPast",
              "cells": [
                "静かだった",
                "静かじゃなかった"
              ]
            },
            {
              "labelKey": "grammar.v2.adjectives.iNow",
              "cells": [
                "高い",
                "高くない"
              ]
            },
            {
              "labelKey": "grammar.v2.adjectives.iPast",
              "cells": [
                "高かった",
                "高くなかった"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "adjective-past-negative-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-past-negative",
        "conceptId": "adjective-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-past-negative-1.prompt",
        "successKey": "grammar.v2.adjective-past-negative-1.explanation",
        "errorKey": "grammar.v2.adjective-past-negative-1.explanation",
        "options": [
          {
            "id": "adjective-past-negative-1-option-0",
            "textKey": "grammar.v2.adjective-past-negative-1.option.0",
            "feedbackKey": "grammar.v2.adjective-past-negative-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-negative-1-option-1",
            "textKey": "grammar.v2.adjective-past-negative-1.option.1",
            "feedbackKey": "grammar.v2.adjective-past-negative-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-negative-1-option-2",
            "textKey": "grammar.v2.adjective-past-negative-1.option.2",
            "feedbackKey": "grammar.v2.adjective-past-negative-1.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-negative-1-option-3",
            "textKey": "grammar.v2.adjective-past-negative-1.option.3",
            "feedbackKey": "grammar.v2.adjective-past-negative-1.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-past-negative-1.option.0",
          "grammar.v2.adjective-past-negative-1.option.1",
          "grammar.v2.adjective-past-negative-1.option.2",
          "grammar.v2.adjective-past-negative-1.option.3"
        ],
        "answer": 3
      },
      {
        "id": "adjective-past-negative-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-past-negative",
        "conceptId": "adjective-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-past-negative-2.prompt",
        "successKey": "grammar.v2.adjective-past-negative-2.explanation",
        "errorKey": "grammar.v2.adjective-past-negative-2.explanation",
        "acceptedAnswers": [
          "なかった"
        ],
        "solutionKey": "grammar.v2.adjective-past-negative-2.solution",
        "kanaBank": [
          "を",
          "ん",
          "た",
          "か",
          "な",
          "っ"
        ]
      },
      {
        "id": "adjective-past-negative-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-past-negative",
        "conceptId": "adjective-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-past-negative-3.prompt",
        "successKey": "grammar.v2.adjective-past-negative-3.explanation",
        "errorKey": "grammar.v2.adjective-past-negative-3.explanation",
        "options": [
          {
            "id": "adjective-past-negative-3-option-0",
            "textKey": "grammar.v2.adjective-past-negative-3.option.0",
            "feedbackKey": "grammar.v2.adjective-past-negative-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-negative-3-option-1",
            "textKey": "grammar.v2.adjective-past-negative-3.option.1",
            "feedbackKey": "grammar.v2.adjective-past-negative-3.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-negative-3-option-2",
            "textKey": "grammar.v2.adjective-past-negative-3.option.2",
            "feedbackKey": "grammar.v2.adjective-past-negative-3.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-past-negative-3-option-3",
            "textKey": "grammar.v2.adjective-past-negative-3.option.3",
            "feedbackKey": "grammar.v2.adjective-past-negative-3.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-past-negative-3.option.0",
          "grammar.v2.adjective-past-negative-3.option.1",
          "grammar.v2.adjective-past-negative-3.option.2",
          "grammar.v2.adjective-past-negative-3.option.3"
        ],
        "answer": 3
      },
      {
        "id": "adjective-past-negative-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-past-negative",
        "conceptId": "adjective-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.adjective-past-negative-4.prompt",
        "successKey": "grammar.v2.adjective-past-negative-4.explanation",
        "errorKey": "grammar.v2.adjective-past-negative-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.adjective-past-negative-4.left.0",
            "rightKey": "grammar.v2.adjective-past-negative-4.right.0"
          },
          {
            "leftKey": "grammar.v2.adjective-past-negative-4.left.1",
            "rightKey": "grammar.v2.adjective-past-negative-4.right.1"
          },
          {
            "leftKey": "grammar.v2.adjective-past-negative-4.left.2",
            "rightKey": "grammar.v2.adjective-past-negative-4.right.2"
          },
          {
            "leftKey": "grammar.v2.adjective-past-negative-4.left.3",
            "rightKey": "grammar.v2.adjective-past-negative-4.right.3"
          }
        ]
      },
      {
        "id": "adjective-past-negative-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-past-negative",
        "conceptId": "adjective-past-negative",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-past-negative-5.prompt",
        "successKey": "grammar.v2.adjective-past-negative-5.explanation",
        "errorKey": "grammar.v2.adjective-past-negative-5.explanation",
        "options": [
          {
            "id": "adjective-past-negative-5-option-0",
            "textKey": "grammar.v2.adjective-past-negative-5.option.0",
            "feedbackKey": "grammar.v2.adjective-past-negative-5.feedback.0"
          },
          {
            "id": "adjective-past-negative-5-option-1",
            "textKey": "grammar.v2.adjective-past-negative-5.option.1",
            "feedbackKey": "grammar.v2.adjective-past-negative-5.feedback.1"
          },
          {
            "id": "adjective-past-negative-5-option-2",
            "textKey": "grammar.v2.adjective-past-negative-5.option.2",
            "feedbackKey": "grammar.v2.adjective-past-negative-5.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-past-negative-5.option.0",
          "grammar.v2.adjective-past-negative-5.option.1",
          "grammar.v2.adjective-past-negative-5.option.2"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "adjective-ii-irregular",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 7,
    "titleKey": "grammar.v2.adjective-ii-irregular.title",
    "summaryKey": "grammar.v2.adjective-ii-irregular.summary",
    "goalKey": "grammar.v2.adjective-ii-irregular.goal",
    "prerequisiteIds": [
      "adjective-negative",
      "adjective-past",
      "adjective-past-negative"
    ],
    "relatedIds": [
      "te-mo-ii"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-ii-irregular.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "いい / よい → よくない → よくなかった"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "よい → よかった"
        }
      ],
      "examples": [
        {
          "japanese": "いい。",
          "reading": "いい。",
          "meaningKey": "grammar.v2.adjective-ii-irregular.example.0"
        },
        {
          "japanese": "よくない。",
          "reading": "よくない。",
          "meaningKey": "grammar.v2.adjective-ii-irregular.example.1"
        },
        {
          "japanese": "よかった。",
          "reading": "よかった。",
          "meaningKey": "grammar.v2.adjective-ii-irregular.example.2"
        },
        {
          "japanese": "よくなかった。",
          "reading": "よくなかった。",
          "meaningKey": "grammar.v2.adjective-ii-irregular.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-ii-irregular.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-ii-irregular.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "いくない。",
          "correction": "よくない。",
          "explanationKey": "grammar.v2.adjective-ii-irregular.mistake.0"
        },
        {
          "wrong": "いかった。",
          "correction": "よかった。",
          "explanationKey": "grammar.v2.adjective-ii-irregular.mistake.1"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.adjectives.ii",
          "headerKeys": [
            "grammar.v2.positive",
            "grammar.v2.negative"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.adjectives.iNow",
              "cells": [
                "いい",
                "よくない"
              ]
            },
            {
              "labelKey": "grammar.v2.adjectives.iPast",
              "cells": [
                "よかった",
                "よくなかった"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "adjective-ii-irregular-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjective-ii-irregular",
        "conceptId": "adjective-ii-irregular",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.adjective-ii-irregular-1.prompt",
        "successKey": "grammar.v2.adjective-ii-irregular-1.explanation",
        "errorKey": "grammar.v2.adjective-ii-irregular-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.adjective-ii-irregular-1.left.0",
            "rightKey": "grammar.v2.adjective-ii-irregular-1.right.0"
          },
          {
            "leftKey": "grammar.v2.adjective-ii-irregular-1.left.1",
            "rightKey": "grammar.v2.adjective-ii-irregular-1.right.1"
          },
          {
            "leftKey": "grammar.v2.adjective-ii-irregular-1.left.2",
            "rightKey": "grammar.v2.adjective-ii-irregular-1.right.2"
          },
          {
            "leftKey": "grammar.v2.adjective-ii-irregular-1.left.3",
            "rightKey": "grammar.v2.adjective-ii-irregular-1.right.3"
          }
        ]
      },
      {
        "id": "adjective-ii-irregular-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-ii-irregular",
        "conceptId": "adjective-ii-irregular",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-ii-irregular-2.prompt",
        "successKey": "grammar.v2.adjective-ii-irregular-2.explanation",
        "errorKey": "grammar.v2.adjective-ii-irregular-2.explanation",
        "acceptedAnswers": [
          "よかった"
        ],
        "solutionKey": "grammar.v2.adjective-ii-irregular-2.solution",
        "kanaBank": [
          "い",
          "う",
          "か",
          "た",
          "っ",
          "よ"
        ]
      },
      {
        "id": "adjective-ii-irregular-3",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-ii-irregular",
        "conceptId": "adjective-ii-irregular",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.adjective-ii-irregular-3.prompt",
        "successKey": "grammar.v2.adjective-ii-irregular-3.explanation",
        "errorKey": "grammar.v2.adjective-ii-irregular-3.explanation",
        "options": [
          {
            "id": "adjective-ii-irregular-3-option-0",
            "textKey": "grammar.v2.adjective-ii-irregular-3.option.0",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-ii-irregular-3-option-1",
            "textKey": "grammar.v2.adjective-ii-irregular-3.option.1",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-3.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-ii-irregular-3-option-2",
            "textKey": "grammar.v2.adjective-ii-irregular-3.option.2",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-ii-irregular-3.option.0",
          "grammar.v2.adjective-ii-irregular-3.option.1",
          "grammar.v2.adjective-ii-irregular-3.option.2"
        ],
        "answer": 1
      },
      {
        "id": "adjective-ii-irregular-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-ii-irregular",
        "conceptId": "adjective-ii-irregular",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.adjective-ii-irregular-4.prompt",
        "successKey": "grammar.v2.adjective-ii-irregular-4.explanation",
        "errorKey": "grammar.v2.adjective-ii-irregular-4.explanation",
        "options": [
          {
            "id": "adjective-ii-irregular-4-option-0",
            "textKey": "grammar.v2.adjective-ii-irregular-4.option.0",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-4.feedback.0",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjective-ii-irregular-4-option-1",
            "textKey": "grammar.v2.adjective-ii-irregular-4.option.1",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-ii-irregular-4-option-2",
            "textKey": "grammar.v2.adjective-ii-irregular-4.option.2",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-ii-irregular-4.option.0",
          "grammar.v2.adjective-ii-irregular-4.option.1",
          "grammar.v2.adjective-ii-irregular-4.option.2"
        ],
        "answer": 0
      },
      {
        "id": "adjective-ii-irregular-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjective-ii-irregular",
        "conceptId": "adjective-ii-irregular",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-ii-irregular-5.prompt",
        "successKey": "grammar.v2.adjective-ii-irregular-5.explanation",
        "errorKey": "grammar.v2.adjective-ii-irregular-5.explanation",
        "options": [
          {
            "id": "adjective-ii-irregular-5-option-0",
            "textKey": "grammar.v2.adjective-ii-irregular-5.option.0",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-ii-irregular-5-option-1",
            "textKey": "grammar.v2.adjective-ii-irregular-5.option.1",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-5.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "adjective-ii-irregular-5-option-2",
            "textKey": "grammar.v2.adjective-ii-irregular-5.option.2",
            "feedbackKey": "grammar.v2.adjective-ii-irregular-5.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-ii-irregular-5.option.0",
          "grammar.v2.adjective-ii-irregular-5.option.1",
          "grammar.v2.adjective-ii-irregular-5.option.2"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "degree-adverbs",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 8,
    "titleKey": "grammar.v2.degree-adverbs.title",
    "summaryKey": "grammar.v2.degree-adverbs.summary",
    "goalKey": "grammar.v2.degree-adverbs.goal",
    "prerequisiteIds": [
      "adjective-negative"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.degree-adverbs.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "とても + 高い"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "あまり + 高くない"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "ぜんぜん + 高くない"
        }
      ],
      "examples": [
        {
          "japanese": "とても高い。",
          "reading": "とてもたかい。",
          "meaningKey": "grammar.v2.degree-adverbs.example.0"
        },
        {
          "japanese": "あまり高くない。",
          "reading": "あまりたかくない。",
          "meaningKey": "grammar.v2.degree-adverbs.example.1"
        },
        {
          "japanese": "ぜんぜん高くない。",
          "reading": "ぜんぜんたかくない。",
          "meaningKey": "grammar.v2.degree-adverbs.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.degree-adverbs.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.degree-adverbs.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "degree-adverbs-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "degree-adverbs",
        "conceptId": "degree-adverbs",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.degree-adverbs-1.prompt",
        "successKey": "grammar.v2.degree-adverbs-1.explanation",
        "errorKey": "grammar.v2.degree-adverbs-1.explanation",
        "options": [
          {
            "id": "degree-adverbs-1-option-0",
            "textKey": "grammar.v2.degree-adverbs-1.option.0",
            "feedbackKey": "grammar.v2.degree-adverbs-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "degree-adverbs-1-option-1",
            "textKey": "grammar.v2.degree-adverbs-1.option.1",
            "feedbackKey": "grammar.v2.degree-adverbs-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "degree-adverbs-1-option-2",
            "textKey": "grammar.v2.degree-adverbs-1.option.2",
            "feedbackKey": "grammar.v2.degree-adverbs-1.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.degree-adverbs-1.option.0",
          "grammar.v2.degree-adverbs-1.option.1",
          "grammar.v2.degree-adverbs-1.option.2"
        ],
        "answer": 0
      },
      {
        "id": "degree-adverbs-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "degree-adverbs",
        "conceptId": "degree-adverbs",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.degree-adverbs-2.prompt",
        "successKey": "grammar.v2.degree-adverbs-2.explanation",
        "errorKey": "grammar.v2.degree-adverbs-2.explanation",
        "options": [
          {
            "id": "degree-adverbs-2-option-0",
            "textKey": "grammar.v2.degree-adverbs-2.option.0",
            "feedbackKey": "grammar.v2.degree-adverbs-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "degree-adverbs-2-option-1",
            "textKey": "grammar.v2.degree-adverbs-2.option.1",
            "feedbackKey": "grammar.v2.degree-adverbs-2.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "degree-adverbs-2-option-2",
            "textKey": "grammar.v2.degree-adverbs-2.option.2",
            "feedbackKey": "grammar.v2.degree-adverbs-2.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.degree-adverbs-2.option.0",
          "grammar.v2.degree-adverbs-2.option.1",
          "grammar.v2.degree-adverbs-2.option.2"
        ],
        "answer": 1
      },
      {
        "id": "degree-adverbs-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "degree-adverbs",
        "conceptId": "degree-adverbs",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.degree-adverbs-3.prompt",
        "successKey": "grammar.v2.degree-adverbs-3.explanation",
        "errorKey": "grammar.v2.degree-adverbs-3.explanation",
        "acceptedAnswers": [
          "ない"
        ],
        "solutionKey": "grammar.v2.degree-adverbs-3.solution",
        "kanaBank": [
          "い",
          "な",
          "も",
          "ゃ",
          "を",
          "ん"
        ]
      },
      {
        "id": "degree-adverbs-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "degree-adverbs",
        "conceptId": "degree-adverbs",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.degree-adverbs-4.prompt",
        "successKey": "grammar.v2.degree-adverbs-4.explanation",
        "errorKey": "grammar.v2.degree-adverbs-4.explanation",
        "options": [
          {
            "id": "degree-adverbs-4-option-0",
            "textKey": "grammar.v2.degree-adverbs-4.option.0",
            "feedbackKey": "grammar.v2.degree-adverbs-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "degree-adverbs-4-option-1",
            "textKey": "grammar.v2.degree-adverbs-4.option.1",
            "feedbackKey": "grammar.v2.degree-adverbs-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "degree-adverbs-4-option-2",
            "textKey": "grammar.v2.degree-adverbs-4.option.2",
            "feedbackKey": "grammar.v2.degree-adverbs-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.degree-adverbs-4.option.0",
          "grammar.v2.degree-adverbs-4.option.1",
          "grammar.v2.degree-adverbs-4.option.2"
        ],
        "answer": 2
      },
      {
        "id": "degree-adverbs-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "degree-adverbs",
        "conceptId": "degree-adverbs",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.degree-adverbs-5.prompt",
        "successKey": "grammar.v2.degree-adverbs-5.explanation",
        "errorKey": "grammar.v2.degree-adverbs-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.degree-adverbs-5.left.0",
            "rightKey": "grammar.v2.degree-adverbs-5.right.0"
          },
          {
            "leftKey": "grammar.v2.degree-adverbs-5.left.1",
            "rightKey": "grammar.v2.degree-adverbs-5.right.1"
          },
          {
            "leftKey": "grammar.v2.degree-adverbs-5.left.2",
            "rightKey": "grammar.v2.degree-adverbs-5.right.2"
          }
        ]
      }
    ]
  },
  {
    "id": "adjectival-predicates-ga",
    "level": "N5",
    "track": "core",
    "topicId": "02",
    "order": 9,
    "titleKey": "grammar.v2.adjectival-predicates-ga.title",
    "summaryKey": "grammar.v2.adjectival-predicates-ga.summary",
    "goalKey": "grammar.v2.adjectival-predicates-ga.goal",
    "prerequisiteIds": [
      "adjective-na",
      "particle-wa-topic",
      "particle-ga-identifier",
      "particle-wa-vs-ga"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.adjectival-predicates-ga.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "私は + 魚が + 好きだ。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "田中さんは + 料理が + 上手だ。"
        }
      ],
      "examples": [
        {
          "japanese": "私は魚が好きだ。",
          "reading": "わたしはさかながすきだ。",
          "meaningKey": "grammar.v2.adjectival-predicates-ga.example.0"
        },
        {
          "japanese": "私は魚が嫌いだ。",
          "reading": "わたしはさかながきらいだ。",
          "meaningKey": "grammar.v2.adjectival-predicates-ga.example.1"
        },
        {
          "japanese": "田中さんは料理が上手だ。",
          "reading": "たなかさんはりょうりがじょうずだ。",
          "meaningKey": "grammar.v2.adjectival-predicates-ga.example.2"
        },
        {
          "japanese": "私は料理が下手だ。",
          "reading": "わたしはりょうりがへただ。",
          "meaningKey": "grammar.v2.adjectival-predicates-ga.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjectival-predicates-ga.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjectival-predicates-ga.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "私は魚を好きだ。",
          "correction": "私は魚が好きだ。",
          "explanationKey": "grammar.v2.adjectival-predicates-ga.mistake.0"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "adjectival-predicates-ga-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjectival-predicates-ga",
        "conceptId": "adjectival-predicates-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjectival-predicates-ga-1.prompt",
        "successKey": "grammar.v2.adjectival-predicates-ga-1.explanation",
        "errorKey": "grammar.v2.adjectival-predicates-ga-1.explanation",
        "acceptedAnswers": [
          "が"
        ],
        "solutionKey": "grammar.v2.adjectival-predicates-ga-1.solution",
        "kanaBank": [
          "の",
          "は",
          "だ",
          "で",
          "じ",
          "が"
        ]
      },
      {
        "id": "adjectival-predicates-ga-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "02",
        "lessonId": "adjectival-predicates-ga",
        "conceptId": "adjectival-predicates-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.adjectival-predicates-ga-2.prompt",
        "successKey": "grammar.v2.adjectival-predicates-ga-2.explanation",
        "errorKey": "grammar.v2.adjectival-predicates-ga-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.adjectival-predicates-ga-2.left.0",
            "rightKey": "grammar.v2.adjectival-predicates-ga-2.right.0"
          },
          {
            "leftKey": "grammar.v2.adjectival-predicates-ga-2.left.1",
            "rightKey": "grammar.v2.adjectival-predicates-ga-2.right.1"
          },
          {
            "leftKey": "grammar.v2.adjectival-predicates-ga-2.left.2",
            "rightKey": "grammar.v2.adjectival-predicates-ga-2.right.2"
          },
          {
            "leftKey": "grammar.v2.adjectival-predicates-ga-2.left.3",
            "rightKey": "grammar.v2.adjectival-predicates-ga-2.right.3"
          }
        ]
      },
      {
        "id": "adjectival-predicates-ga-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjectival-predicates-ga",
        "conceptId": "adjectival-predicates-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjectival-predicates-ga-3.prompt",
        "successKey": "grammar.v2.adjectival-predicates-ga-3.explanation",
        "errorKey": "grammar.v2.adjectival-predicates-ga-3.explanation",
        "options": [
          {
            "id": "adjectival-predicates-ga-3-option-0",
            "textKey": "grammar.v2.adjectival-predicates-ga-3.option.0",
            "feedbackKey": "grammar.v2.adjectival-predicates-ga-3.feedback.0"
          },
          {
            "id": "adjectival-predicates-ga-3-option-1",
            "textKey": "grammar.v2.adjectival-predicates-ga-3.option.1",
            "feedbackKey": "grammar.v2.adjectival-predicates-ga-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjectival-predicates-ga-3.option.0",
          "grammar.v2.adjectival-predicates-ga-3.option.1"
        ],
        "answer": 0
      },
      {
        "id": "adjectival-predicates-ga-4",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjectival-predicates-ga",
        "conceptId": "adjectival-predicates-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.adjectival-predicates-ga-4.prompt",
        "successKey": "grammar.v2.adjectival-predicates-ga-4.explanation",
        "errorKey": "grammar.v2.adjectival-predicates-ga-4.explanation",
        "tokenKeys": [
          "grammar.v2.adjectival-predicates-ga-4.token.0",
          "grammar.v2.adjectival-predicates-ga-4.token.1",
          "grammar.v2.adjectival-predicates-ga-4.token.2",
          "grammar.v2.adjectival-predicates-ga-4.token.3"
        ],
        "solution": [
          2,
          1,
          3,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "adjectival-predicates-ga-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjectival-predicates-ga",
        "conceptId": "adjectival-predicates-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjectival-predicates-ga-5.prompt",
        "successKey": "grammar.v2.adjectival-predicates-ga-5.explanation",
        "errorKey": "grammar.v2.adjectival-predicates-ga-5.explanation",
        "options": [
          {
            "id": "adjectival-predicates-ga-5-option-0",
            "textKey": "grammar.v2.adjectival-predicates-ga-5.option.0",
            "feedbackKey": "grammar.v2.adjectival-predicates-ga-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjectival-predicates-ga-5-option-1",
            "textKey": "grammar.v2.adjectival-predicates-ga-5.option.1",
            "feedbackKey": "grammar.v2.adjectival-predicates-ga-5.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjectival-predicates-ga-5.option.0",
          "grammar.v2.adjectival-predicates-ga-5.option.1"
        ],
        "answer": 0
      },
      {
        "id": "adjectival-predicates-ga-6",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "02",
        "lessonId": "adjectival-predicates-ga",
        "conceptId": "adjectival-predicates-ga",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic02",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.adjectival-predicates-ga-6.prompt",
        "successKey": "grammar.v2.adjectival-predicates-ga-6.explanation",
        "errorKey": "grammar.v2.adjectival-predicates-ga-6.explanation",
        "options": [
          {
            "id": "adjectival-predicates-ga-6-option-0",
            "textKey": "grammar.v2.adjectival-predicates-ga-6.option.0",
            "feedbackKey": "grammar.v2.adjectival-predicates-ga-6.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "adjectival-predicates-ga-6-option-1",
            "textKey": "grammar.v2.adjectival-predicates-ga-6.option.1",
            "feedbackKey": "grammar.v2.adjectival-predicates-ga-6.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "adjectival-predicates-ga-6-option-2",
            "textKey": "grammar.v2.adjectival-predicates-ga-6.option.2",
            "feedbackKey": "grammar.v2.adjectival-predicates-ga-6.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjectival-predicates-ga-6.option.0",
          "grammar.v2.adjectival-predicates-ga-6.option.1",
          "grammar.v2.adjectival-predicates-ga-6.option.2"
        ],
        "answer": 1
      }
    ]
  },
  {
    "id": "verb-role-dictionary",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 1,
    "titleKey": "grammar.v2.verb-role-dictionary.title",
    "summaryKey": "grammar.v2.verb-role-dictionary.summary",
    "goalKey": "grammar.v2.verb-role-dictionary.goal",
    "prerequisiteIds": [
      "sentence-structure-context"
    ],
    "relatedIds": [
      "verb-ichidan",
      "verb-godan",
      "verb-irregular-suru-kuru",
      "adjective-adverb-ku-ni",
      "particle-wo-object",
      "verb-transitivity-basic",
      "particle-ni-destination",
      "particle-de-action-location",
      "particle-ni-time",
      "particle-to-companion",
      "particle-kara-made",
      "existence-aru-iru",
      "question-words-basic"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-role-dictionary.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "私は行く。 / 田中さんは行く。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "毎日読む。 / 明日読む。"
        }
      ],
      "examples": [
        {
          "japanese": "私は行く。",
          "reading": "わたしはいく。",
          "meaningKey": "grammar.v2.verb-role-dictionary.example.0"
        },
        {
          "japanese": "田中さんは行く。",
          "reading": "たなかさんはいく。",
          "meaningKey": "grammar.v2.verb-role-dictionary.example.1"
        },
        {
          "japanese": "毎日読む。",
          "reading": "まいにちよむ。",
          "meaningKey": "grammar.v2.verb-role-dictionary.example.2"
        },
        {
          "japanese": "明日読む。",
          "reading": "あしたよむ。",
          "meaningKey": "grammar.v2.verb-role-dictionary.example.3"
        },
        {
          "japanese": "食べる。",
          "reading": "たべる。",
          "meaningKey": "grammar.v2.verb-role-dictionary.example.4"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-role-dictionary.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-role-dictionary.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "verb-role-dictionary-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-role-dictionary",
        "conceptId": "verb-role-dictionary",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-role-dictionary-1.prompt",
        "successKey": "grammar.v2.verb-role-dictionary-1.explanation",
        "errorKey": "grammar.v2.verb-role-dictionary-1.explanation",
        "options": [
          {
            "id": "verb-role-dictionary-1-option-0",
            "textKey": "grammar.v2.verb-role-dictionary-1.option.0",
            "feedbackKey": "grammar.v2.verb-role-dictionary-1.feedback.0"
          },
          {
            "id": "verb-role-dictionary-1-option-1",
            "textKey": "grammar.v2.verb-role-dictionary-1.option.1",
            "feedbackKey": "grammar.v2.verb-role-dictionary-1.feedback.1"
          },
          {
            "id": "verb-role-dictionary-1-option-2",
            "textKey": "grammar.v2.verb-role-dictionary-1.option.2",
            "feedbackKey": "grammar.v2.verb-role-dictionary-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-role-dictionary-1.option.0",
          "grammar.v2.verb-role-dictionary-1.option.1",
          "grammar.v2.verb-role-dictionary-1.option.2"
        ],
        "answer": 0
      },
      {
        "id": "verb-role-dictionary-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-role-dictionary",
        "conceptId": "verb-role-dictionary",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-role-dictionary-2.prompt",
        "successKey": "grammar.v2.verb-role-dictionary-2.explanation",
        "errorKey": "grammar.v2.verb-role-dictionary-2.explanation",
        "options": [
          {
            "id": "verb-role-dictionary-2-option-0",
            "textKey": "grammar.v2.verb-role-dictionary-2.option.0",
            "feedbackKey": "grammar.v2.verb-role-dictionary-2.feedback.0"
          },
          {
            "id": "verb-role-dictionary-2-option-1",
            "textKey": "grammar.v2.verb-role-dictionary-2.option.1",
            "feedbackKey": "grammar.v2.verb-role-dictionary-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-role-dictionary-2.option.0",
          "grammar.v2.verb-role-dictionary-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "verb-role-dictionary-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-role-dictionary",
        "conceptId": "verb-role-dictionary",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-role-dictionary-3.prompt",
        "successKey": "grammar.v2.verb-role-dictionary-3.explanation",
        "errorKey": "grammar.v2.verb-role-dictionary-3.explanation",
        "options": [
          {
            "id": "verb-role-dictionary-3-option-0",
            "textKey": "grammar.v2.verb-role-dictionary-3.option.0",
            "feedbackKey": "grammar.v2.verb-role-dictionary-3.feedback.0"
          },
          {
            "id": "verb-role-dictionary-3-option-1",
            "textKey": "grammar.v2.verb-role-dictionary-3.option.1",
            "feedbackKey": "grammar.v2.verb-role-dictionary-3.feedback.1"
          },
          {
            "id": "verb-role-dictionary-3-option-2",
            "textKey": "grammar.v2.verb-role-dictionary-3.option.2",
            "feedbackKey": "grammar.v2.verb-role-dictionary-3.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-role-dictionary-3.option.0",
          "grammar.v2.verb-role-dictionary-3.option.1",
          "grammar.v2.verb-role-dictionary-3.option.2"
        ],
        "answer": 0
      },
      {
        "id": "verb-role-dictionary-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-role-dictionary",
        "conceptId": "verb-role-dictionary",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-role-dictionary-4.prompt",
        "successKey": "grammar.v2.verb-role-dictionary-4.explanation",
        "errorKey": "grammar.v2.verb-role-dictionary-4.explanation",
        "options": [
          {
            "id": "verb-role-dictionary-4-option-0",
            "textKey": "grammar.v2.verb-role-dictionary-4.option.0",
            "feedbackKey": "grammar.v2.verb-role-dictionary-4.feedback.0"
          },
          {
            "id": "verb-role-dictionary-4-option-1",
            "textKey": "grammar.v2.verb-role-dictionary-4.option.1",
            "feedbackKey": "grammar.v2.verb-role-dictionary-4.feedback.1"
          },
          {
            "id": "verb-role-dictionary-4-option-2",
            "textKey": "grammar.v2.verb-role-dictionary-4.option.2",
            "feedbackKey": "grammar.v2.verb-role-dictionary-4.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-role-dictionary-4.option.0",
          "grammar.v2.verb-role-dictionary-4.option.1",
          "grammar.v2.verb-role-dictionary-4.option.2"
        ],
        "answer": 0
      },
      {
        "id": "verb-role-dictionary-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-role-dictionary",
        "conceptId": "verb-role-dictionary",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-role-dictionary-5.prompt",
        "successKey": "grammar.v2.verb-role-dictionary-5.explanation",
        "errorKey": "grammar.v2.verb-role-dictionary-5.explanation",
        "options": [
          {
            "id": "verb-role-dictionary-5-option-0",
            "textKey": "grammar.v2.verb-role-dictionary-5.option.0",
            "feedbackKey": "grammar.v2.verb-role-dictionary-5.feedback.0"
          },
          {
            "id": "verb-role-dictionary-5-option-1",
            "textKey": "grammar.v2.verb-role-dictionary-5.option.1",
            "feedbackKey": "grammar.v2.verb-role-dictionary-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-role-dictionary-5.option.0",
          "grammar.v2.verb-role-dictionary-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "verb-ichidan",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 2,
    "titleKey": "grammar.v2.verb-ichidan.title",
    "summaryKey": "grammar.v2.verb-ichidan.summary",
    "goalKey": "grammar.v2.verb-ichidan.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "verb-negative-plain",
      "verb-past-plain",
      "verb-stem",
      "te-form-formation"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-ichidan.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べる → 食べ…"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "見る → 見…"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "起きる → 起き…"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "寝る → 寝…"
        }
      ],
      "examples": [
        {
          "japanese": "食べる。",
          "reading": "たべる。",
          "meaningKey": "grammar.v2.verb-ichidan.example.0"
        },
        {
          "japanese": "見る。",
          "reading": "みる。",
          "meaningKey": "grammar.v2.verb-ichidan.example.1"
        },
        {
          "japanese": "起きる。",
          "reading": "おきる。",
          "meaningKey": "grammar.v2.verb-ichidan.example.2"
        },
        {
          "japanese": "寝る。",
          "reading": "ねる。",
          "meaningKey": "grammar.v2.verb-ichidan.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-ichidan.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-ichidan.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [
        {
          "left": "食べる → 食べ…",
          "right": "帰る",
          "explanationKey": "grammar.v2.verb-ichidan.contrast.0"
        }
      ]
    },
    "exercises": [
      {
        "id": "verb-ichidan-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-ichidan",
        "conceptId": "verb-ichidan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-ichidan-1.prompt",
        "successKey": "grammar.v2.verb-ichidan-1.explanation",
        "errorKey": "grammar.v2.verb-ichidan-1.explanation",
        "options": [
          {
            "id": "verb-ichidan-1-option-0",
            "textKey": "grammar.v2.verb-ichidan-1.option.0",
            "feedbackKey": "grammar.v2.verb-ichidan-1.feedback.0"
          },
          {
            "id": "verb-ichidan-1-option-1",
            "textKey": "grammar.v2.verb-ichidan-1.option.1",
            "feedbackKey": "grammar.v2.verb-ichidan-1.feedback.1"
          },
          {
            "id": "verb-ichidan-1-option-2",
            "textKey": "grammar.v2.verb-ichidan-1.option.2",
            "feedbackKey": "grammar.v2.verb-ichidan-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-ichidan-1.option.0",
          "grammar.v2.verb-ichidan-1.option.1",
          "grammar.v2.verb-ichidan-1.option.2"
        ],
        "answer": 0
      },
      {
        "id": "verb-ichidan-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-ichidan",
        "conceptId": "verb-ichidan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-ichidan-2.prompt",
        "successKey": "grammar.v2.verb-ichidan-2.explanation",
        "errorKey": "grammar.v2.verb-ichidan-2.explanation",
        "acceptedAnswers": [
          "起き"
        ],
        "solutionKey": "grammar.v2.verb-ichidan-2.solution",
        "kanaBank": [
          "き",
          "起",
          "る",
          "れ",
          "ん",
          "を"
        ]
      },
      {
        "id": "verb-ichidan-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-ichidan",
        "conceptId": "verb-ichidan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-ichidan-3.prompt",
        "successKey": "grammar.v2.verb-ichidan-3.explanation",
        "errorKey": "grammar.v2.verb-ichidan-3.explanation",
        "options": [
          {
            "id": "verb-ichidan-3-option-0",
            "textKey": "grammar.v2.verb-ichidan-3.option.0",
            "feedbackKey": "grammar.v2.verb-ichidan-3.feedback.0"
          },
          {
            "id": "verb-ichidan-3-option-1",
            "textKey": "grammar.v2.verb-ichidan-3.option.1",
            "feedbackKey": "grammar.v2.verb-ichidan-3.feedback.1"
          },
          {
            "id": "verb-ichidan-3-option-2",
            "textKey": "grammar.v2.verb-ichidan-3.option.2",
            "feedbackKey": "grammar.v2.verb-ichidan-3.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-ichidan-3.option.0",
          "grammar.v2.verb-ichidan-3.option.1",
          "grammar.v2.verb-ichidan-3.option.2"
        ],
        "answer": 0
      },
      {
        "id": "verb-ichidan-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-ichidan",
        "conceptId": "verb-ichidan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-ichidan-4.prompt",
        "successKey": "grammar.v2.verb-ichidan-4.explanation",
        "errorKey": "grammar.v2.verb-ichidan-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-ichidan-4.left.0",
            "rightKey": "grammar.v2.verb-ichidan-4.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-ichidan-4.left.1",
            "rightKey": "grammar.v2.verb-ichidan-4.right.1"
          }
        ]
      },
      {
        "id": "verb-ichidan-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-ichidan",
        "conceptId": "verb-ichidan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-ichidan-5.prompt",
        "successKey": "grammar.v2.verb-ichidan-5.explanation",
        "errorKey": "grammar.v2.verb-ichidan-5.explanation",
        "options": [
          {
            "id": "verb-ichidan-5-option-0",
            "textKey": "grammar.v2.verb-ichidan-5.option.0",
            "feedbackKey": "grammar.v2.verb-ichidan-5.feedback.0"
          },
          {
            "id": "verb-ichidan-5-option-1",
            "textKey": "grammar.v2.verb-ichidan-5.option.1",
            "feedbackKey": "grammar.v2.verb-ichidan-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-ichidan-5.option.0",
          "grammar.v2.verb-ichidan-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "verb-godan",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 3,
    "titleKey": "grammar.v2.verb-godan.title",
    "summaryKey": "grammar.v2.verb-godan.summary",
    "goalKey": "grammar.v2.verb-godan.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "verb-negative-plain",
      "verb-past-plain",
      "verb-stem",
      "te-form-formation"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-godan.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "う・く・ぐ・す・つ・ぬ・ぶ・む・る"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べる ≠ 帰る"
        }
      ],
      "examples": [
        {
          "japanese": "買う",
          "reading": "かう",
          "meaningKey": "grammar.v2.verb-godan.example.0"
        },
        {
          "japanese": "書く",
          "reading": "かく",
          "meaningKey": "grammar.v2.verb-godan.example.1"
        },
        {
          "japanese": "泳ぐ",
          "reading": "およぐ",
          "meaningKey": "grammar.v2.verb-godan.example.2"
        },
        {
          "japanese": "話す",
          "reading": "はなす",
          "meaningKey": "grammar.v2.verb-godan.example.3"
        },
        {
          "japanese": "待つ",
          "reading": "まつ",
          "meaningKey": "grammar.v2.verb-godan.example.4"
        },
        {
          "japanese": "死ぬ",
          "reading": "しぬ",
          "meaningKey": "grammar.v2.verb-godan.example.5"
        },
        {
          "japanese": "遊ぶ",
          "reading": "あそぶ",
          "meaningKey": "grammar.v2.verb-godan.example.6"
        },
        {
          "japanese": "飲む",
          "reading": "のむ",
          "meaningKey": "grammar.v2.verb-godan.example.7"
        },
        {
          "japanese": "帰る",
          "reading": "かえる",
          "meaningKey": "grammar.v2.verb-godan.example.8"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-godan.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-godan.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [
        {
          "left": "食べる",
          "right": "帰る",
          "explanationKey": "grammar.v2.verb-godan.contrast.0"
        }
      ],
      "tables": [
        {
          "captionKey": "grammar.v2.verbs.group",
          "headerKeys": [
            "grammar.v2.verbs.ending",
            "grammar.v2.verbs.dictionary"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.verbs.ending.う",
              "cells": [
                "う",
                "買う"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.く",
              "cells": [
                "く",
                "書く"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.ぐ",
              "cells": [
                "ぐ",
                "泳ぐ"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.す",
              "cells": [
                "す",
                "話す"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.つ",
              "cells": [
                "つ",
                "待つ"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.ぬ",
              "cells": [
                "ぬ",
                "死ぬ"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.ぶ",
              "cells": [
                "ぶ",
                "遊ぶ"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.む",
              "cells": [
                "む",
                "飲む"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.ending.る",
              "cells": [
                "る",
                "帰る"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "verb-godan-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-godan",
        "conceptId": "verb-godan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-godan-1.prompt",
        "successKey": "grammar.v2.verb-godan-1.explanation",
        "errorKey": "grammar.v2.verb-godan-1.explanation",
        "options": [
          {
            "id": "verb-godan-1-option-0",
            "textKey": "grammar.v2.verb-godan-1.option.0",
            "feedbackKey": "grammar.v2.verb-godan-1.feedback.0"
          },
          {
            "id": "verb-godan-1-option-1",
            "textKey": "grammar.v2.verb-godan-1.option.1",
            "feedbackKey": "grammar.v2.verb-godan-1.feedback.1"
          },
          {
            "id": "verb-godan-1-option-2",
            "textKey": "grammar.v2.verb-godan-1.option.2",
            "feedbackKey": "grammar.v2.verb-godan-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-godan-1.option.0",
          "grammar.v2.verb-godan-1.option.1",
          "grammar.v2.verb-godan-1.option.2"
        ],
        "answer": 1
      },
      {
        "id": "verb-godan-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-godan",
        "conceptId": "verb-godan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-godan-2.prompt",
        "successKey": "grammar.v2.verb-godan-2.explanation",
        "errorKey": "grammar.v2.verb-godan-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-godan-2.left.0",
            "rightKey": "grammar.v2.verb-godan-2.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-godan-2.left.1",
            "rightKey": "grammar.v2.verb-godan-2.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-godan-2.left.2",
            "rightKey": "grammar.v2.verb-godan-2.right.2"
          },
          {
            "leftKey": "grammar.v2.verb-godan-2.left.3",
            "rightKey": "grammar.v2.verb-godan-2.right.3"
          }
        ]
      },
      {
        "id": "verb-godan-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-godan",
        "conceptId": "verb-godan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-godan-3.prompt",
        "successKey": "grammar.v2.verb-godan-3.explanation",
        "errorKey": "grammar.v2.verb-godan-3.explanation",
        "options": [
          {
            "id": "verb-godan-3-option-0",
            "textKey": "grammar.v2.verb-godan-3.option.0",
            "feedbackKey": "grammar.v2.verb-godan-3.feedback.0"
          },
          {
            "id": "verb-godan-3-option-1",
            "textKey": "grammar.v2.verb-godan-3.option.1",
            "feedbackKey": "grammar.v2.verb-godan-3.feedback.1"
          },
          {
            "id": "verb-godan-3-option-2",
            "textKey": "grammar.v2.verb-godan-3.option.2",
            "feedbackKey": "grammar.v2.verb-godan-3.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-godan-3.option.0",
          "grammar.v2.verb-godan-3.option.1",
          "grammar.v2.verb-godan-3.option.2"
        ],
        "answer": 1
      },
      {
        "id": "verb-godan-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-godan",
        "conceptId": "verb-godan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-godan-4.prompt",
        "successKey": "grammar.v2.verb-godan-4.explanation",
        "errorKey": "grammar.v2.verb-godan-4.explanation",
        "options": [
          {
            "id": "verb-godan-4-option-0",
            "textKey": "grammar.v2.verb-godan-4.option.0",
            "feedbackKey": "grammar.v2.verb-godan-4.feedback.0"
          },
          {
            "id": "verb-godan-4-option-1",
            "textKey": "grammar.v2.verb-godan-4.option.1",
            "feedbackKey": "grammar.v2.verb-godan-4.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-godan-4.option.0",
          "grammar.v2.verb-godan-4.option.1"
        ],
        "answer": 0
      },
      {
        "id": "verb-godan-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-godan",
        "conceptId": "verb-godan",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-godan-5.prompt",
        "successKey": "grammar.v2.verb-godan-5.explanation",
        "errorKey": "grammar.v2.verb-godan-5.explanation",
        "options": [
          {
            "id": "verb-godan-5-option-0",
            "textKey": "grammar.v2.verb-godan-5.option.0",
            "feedbackKey": "grammar.v2.verb-godan-5.feedback.0"
          },
          {
            "id": "verb-godan-5-option-1",
            "textKey": "grammar.v2.verb-godan-5.option.1",
            "feedbackKey": "grammar.v2.verb-godan-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-godan-5.option.0",
          "grammar.v2.verb-godan-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "verb-irregular-suru-kuru",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 4,
    "titleKey": "grammar.v2.verb-irregular-suru-kuru.title",
    "summaryKey": "grammar.v2.verb-irregular-suru-kuru.summary",
    "goalKey": "grammar.v2.verb-irregular-suru-kuru.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "verb-negative-plain",
      "verb-past-plain",
      "verb-stem",
      "te-form-formation"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-irregular-suru-kuru.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "勉強 + する → 勉強する"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "運動 + する → 運動する"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "電話 + する → 電話する"
        }
      ],
      "examples": [
        {
          "japanese": "する",
          "reading": "する",
          "meaningKey": "grammar.v2.verb-irregular-suru-kuru.example.0"
        },
        {
          "japanese": "来る",
          "reading": "くる",
          "meaningKey": "grammar.v2.verb-irregular-suru-kuru.example.1"
        },
        {
          "japanese": "勉強する",
          "reading": "べんきょうする",
          "meaningKey": "grammar.v2.verb-irregular-suru-kuru.example.2"
        },
        {
          "japanese": "運動する",
          "reading": "うんどうする",
          "meaningKey": "grammar.v2.verb-irregular-suru-kuru.example.3"
        },
        {
          "japanese": "電話する",
          "reading": "でんわする",
          "meaningKey": "grammar.v2.verb-irregular-suru-kuru.example.4"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-irregular-suru-kuru.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-irregular-suru-kuru.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "verb-irregular-suru-kuru-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-irregular-suru-kuru",
        "conceptId": "verb-irregular-suru-kuru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-irregular-suru-kuru-1.prompt",
        "successKey": "grammar.v2.verb-irregular-suru-kuru-1.explanation",
        "errorKey": "grammar.v2.verb-irregular-suru-kuru-1.explanation",
        "options": [
          {
            "id": "verb-irregular-suru-kuru-1-option-0",
            "textKey": "grammar.v2.verb-irregular-suru-kuru-1.option.0",
            "feedbackKey": "grammar.v2.verb-irregular-suru-kuru-1.feedback.0"
          },
          {
            "id": "verb-irregular-suru-kuru-1-option-1",
            "textKey": "grammar.v2.verb-irregular-suru-kuru-1.option.1",
            "feedbackKey": "grammar.v2.verb-irregular-suru-kuru-1.feedback.1"
          },
          {
            "id": "verb-irregular-suru-kuru-1-option-2",
            "textKey": "grammar.v2.verb-irregular-suru-kuru-1.option.2",
            "feedbackKey": "grammar.v2.verb-irregular-suru-kuru-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-irregular-suru-kuru-1.option.0",
          "grammar.v2.verb-irregular-suru-kuru-1.option.1",
          "grammar.v2.verb-irregular-suru-kuru-1.option.2"
        ],
        "answer": 2
      },
      {
        "id": "verb-irregular-suru-kuru-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-irregular-suru-kuru",
        "conceptId": "verb-irregular-suru-kuru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-irregular-suru-kuru-2.prompt",
        "successKey": "grammar.v2.verb-irregular-suru-kuru-2.explanation",
        "errorKey": "grammar.v2.verb-irregular-suru-kuru-2.explanation",
        "options": [
          {
            "id": "verb-irregular-suru-kuru-2-option-0",
            "textKey": "grammar.v2.verb-irregular-suru-kuru-2.option.0",
            "feedbackKey": "grammar.v2.verb-irregular-suru-kuru-2.feedback.0"
          },
          {
            "id": "verb-irregular-suru-kuru-2-option-1",
            "textKey": "grammar.v2.verb-irregular-suru-kuru-2.option.1",
            "feedbackKey": "grammar.v2.verb-irregular-suru-kuru-2.feedback.1"
          },
          {
            "id": "verb-irregular-suru-kuru-2-option-2",
            "textKey": "grammar.v2.verb-irregular-suru-kuru-2.option.2",
            "feedbackKey": "grammar.v2.verb-irregular-suru-kuru-2.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-irregular-suru-kuru-2.option.0",
          "grammar.v2.verb-irregular-suru-kuru-2.option.1",
          "grammar.v2.verb-irregular-suru-kuru-2.option.2"
        ],
        "answer": 2
      },
      {
        "id": "verb-irregular-suru-kuru-3",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-irregular-suru-kuru",
        "conceptId": "verb-irregular-suru-kuru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.verb-irregular-suru-kuru-3.prompt",
        "successKey": "grammar.v2.verb-irregular-suru-kuru-3.explanation",
        "errorKey": "grammar.v2.verb-irregular-suru-kuru-3.explanation",
        "tokenKeys": [
          "grammar.v2.verb-irregular-suru-kuru-3.token.0",
          "grammar.v2.verb-irregular-suru-kuru-3.token.1"
        ],
        "solution": [
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "verb-irregular-suru-kuru-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-irregular-suru-kuru",
        "conceptId": "verb-irregular-suru-kuru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-irregular-suru-kuru-4.prompt",
        "successKey": "grammar.v2.verb-irregular-suru-kuru-4.explanation",
        "errorKey": "grammar.v2.verb-irregular-suru-kuru-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-irregular-suru-kuru-4.left.0",
            "rightKey": "grammar.v2.verb-irregular-suru-kuru-4.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-irregular-suru-kuru-4.left.1",
            "rightKey": "grammar.v2.verb-irregular-suru-kuru-4.right.1"
          }
        ]
      }
    ]
  },
  {
    "id": "verb-negative-plain",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 5,
    "titleKey": "grammar.v2.verb-negative-plain.title",
    "summaryKey": "grammar.v2.verb-negative-plain.summary",
    "goalKey": "grammar.v2.verb-negative-plain.goal",
    "prerequisiteIds": [
      "verb-ichidan",
      "verb-godan",
      "verb-irregular-suru-kuru"
    ],
    "relatedIds": [
      "verb-past-negative-plain",
      "existence-aru-iru",
      "question-words-ka-mo",
      "polite-verb-masu-system",
      "nai-de-kudasai"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-negative-plain.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べる → 食べない / 見る → 見ない"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "買う → 買わない"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "する → しない / 来る（くる）→ こない"
        }
      ],
      "examples": [
        {
          "japanese": "食べない。",
          "reading": "たべない。",
          "meaningKey": "grammar.v2.verb-negative-plain.example.0"
        },
        {
          "japanese": "飲まない。",
          "reading": "のまない。",
          "meaningKey": "grammar.v2.verb-negative-plain.example.1"
        },
        {
          "japanese": "しない。",
          "reading": "しない。",
          "meaningKey": "grammar.v2.verb-negative-plain.example.2"
        },
        {
          "japanese": "こない。",
          "reading": "こない。",
          "meaningKey": "grammar.v2.verb-negative-plain.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-negative-plain.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-negative-plain.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "買あない",
          "correction": "買わない",
          "explanationKey": "grammar.v2.verb-negative-plain.mistake.0"
        },
        {
          "wrong": "食べらない",
          "correction": "食べない",
          "explanationKey": "grammar.v2.verb-negative-plain.mistake.1"
        },
        {
          "wrong": "飲むない",
          "correction": "飲まない",
          "explanationKey": "grammar.v2.verb-negative-plain.mistake.2"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.verbs.negativeTable",
          "headerKeys": [
            "grammar.v2.verbs.dictionary",
            "grammar.v2.verbs.negative"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.verbs.negative.row.0",
              "cells": [
                "書く",
                "書かない"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.negative.row.1",
              "cells": [
                "泳ぐ",
                "泳がない"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.negative.row.2",
              "cells": [
                "話す",
                "話さない"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.negative.row.3",
              "cells": [
                "待つ",
                "待たない"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.negative.row.4",
              "cells": [
                "死ぬ",
                "死なない"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.negative.row.5",
              "cells": [
                "遊ぶ",
                "遊ばない"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.negative.row.6",
              "cells": [
                "飲む",
                "飲まない"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.negative.row.7",
              "cells": [
                "帰る",
                "帰らない"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "verb-negative-plain-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-negative-plain",
        "conceptId": "verb-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-negative-plain-1.prompt",
        "successKey": "grammar.v2.verb-negative-plain-1.explanation",
        "errorKey": "grammar.v2.verb-negative-plain-1.explanation",
        "acceptedAnswers": [
          "食べない"
        ],
        "solutionKey": "grammar.v2.verb-negative-plain-1.solution",
        "kanaBank": [
          "ま",
          "べ",
          "へ",
          "な",
          "い",
          "食"
        ]
      },
      {
        "id": "verb-negative-plain-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-negative-plain",
        "conceptId": "verb-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-negative-plain-2.prompt",
        "successKey": "grammar.v2.verb-negative-plain-2.explanation",
        "errorKey": "grammar.v2.verb-negative-plain-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.0",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.1",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.2",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.2"
          },
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.3",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.3"
          },
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.4",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.4"
          },
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.5",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.5"
          },
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.6",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.6"
          },
          {
            "leftKey": "grammar.v2.verb-negative-plain-2.left.7",
            "rightKey": "grammar.v2.verb-negative-plain-2.right.7"
          }
        ]
      },
      {
        "id": "verb-negative-plain-3",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-negative-plain",
        "conceptId": "verb-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.verb-negative-plain-3.prompt",
        "successKey": "grammar.v2.verb-negative-plain-3.explanation",
        "errorKey": "grammar.v2.verb-negative-plain-3.explanation",
        "options": [
          {
            "id": "verb-negative-plain-3-option-0",
            "textKey": "grammar.v2.verb-negative-plain-3.option.0",
            "feedbackKey": "grammar.v2.verb-negative-plain-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-negative-plain-3-option-1",
            "textKey": "grammar.v2.verb-negative-plain-3.option.1",
            "feedbackKey": "grammar.v2.verb-negative-plain-3.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "verb-negative-plain-3-option-2",
            "textKey": "grammar.v2.verb-negative-plain-3.option.2",
            "feedbackKey": "grammar.v2.verb-negative-plain-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-negative-plain-3.option.0",
          "grammar.v2.verb-negative-plain-3.option.1",
          "grammar.v2.verb-negative-plain-3.option.2"
        ],
        "answer": 1
      },
      {
        "id": "verb-negative-plain-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-negative-plain",
        "conceptId": "verb-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-negative-plain-4.prompt",
        "successKey": "grammar.v2.verb-negative-plain-4.explanation",
        "errorKey": "grammar.v2.verb-negative-plain-4.explanation",
        "acceptedAnswers": [
          "しない"
        ],
        "solutionKey": "grammar.v2.verb-negative-plain-4.solution",
        "kanaBank": [
          "や",
          "も",
          "ゃ",
          "い",
          "し",
          "な"
        ]
      },
      {
        "id": "verb-negative-plain-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-negative-plain",
        "conceptId": "verb-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-negative-plain-5.prompt",
        "successKey": "grammar.v2.verb-negative-plain-5.explanation",
        "errorKey": "grammar.v2.verb-negative-plain-5.explanation",
        "acceptedAnswers": [
          "こない"
        ],
        "solutionKey": "grammar.v2.verb-negative-plain-5.solution",
        "kanaBank": [
          "か",
          "え",
          "く",
          "い",
          "こ",
          "な"
        ]
      },
      {
        "id": "verb-negative-plain-6",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-negative-plain",
        "conceptId": "verb-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.verb-negative-plain-6.prompt",
        "successKey": "grammar.v2.verb-negative-plain-6.explanation",
        "errorKey": "grammar.v2.verb-negative-plain-6.explanation",
        "options": [
          {
            "id": "verb-negative-plain-6-option-0",
            "textKey": "grammar.v2.verb-negative-plain-6.option.0",
            "feedbackKey": "grammar.v2.verb-negative-plain-6.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-negative-plain-6-option-1",
            "textKey": "grammar.v2.verb-negative-plain-6.option.1",
            "feedbackKey": "grammar.v2.verb-negative-plain-6.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "verb-negative-plain-6-option-2",
            "textKey": "grammar.v2.verb-negative-plain-6.option.2",
            "feedbackKey": "grammar.v2.verb-negative-plain-6.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-negative-plain-6.option.0",
          "grammar.v2.verb-negative-plain-6.option.1",
          "grammar.v2.verb-negative-plain-6.option.2"
        ],
        "answer": 1
      }
    ]
  },
  {
    "id": "verb-past-plain",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 6,
    "titleKey": "grammar.v2.verb-past-plain.title",
    "summaryKey": "grammar.v2.verb-past-plain.summary",
    "goalKey": "grammar.v2.verb-past-plain.goal",
    "prerequisiteIds": [
      "verb-ichidan",
      "verb-godan",
      "verb-irregular-suru-kuru"
    ],
    "relatedIds": [
      "verb-past-negative-plain",
      "polite-verb-masu-system",
      "relative-clause-noun",
      "te-form-formation"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-past-plain.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べる → 食べた / 見る → 見た"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "行く → 行った"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "する → した / 来る（くる）→ きた"
        }
      ],
      "examples": [
        {
          "japanese": "昨日、食べた。",
          "reading": "きのう、たべた。",
          "meaningKey": "grammar.v2.verb-past-plain.example.0"
        },
        {
          "japanese": "飲んだ。",
          "reading": "のんだ。",
          "meaningKey": "grammar.v2.verb-past-plain.example.1"
        },
        {
          "japanese": "行った。",
          "reading": "いった。",
          "meaningKey": "grammar.v2.verb-past-plain.example.2"
        },
        {
          "japanese": "した。",
          "reading": "した。",
          "meaningKey": "grammar.v2.verb-past-plain.example.3"
        },
        {
          "japanese": "きた。",
          "reading": "きた。",
          "meaningKey": "grammar.v2.verb-past-plain.example.4"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-past-plain.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-past-plain.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "行いた",
          "correction": "行った",
          "explanationKey": "grammar.v2.verb-past-plain.mistake.0"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.verbs.pastTable",
          "headerKeys": [
            "grammar.v2.verbs.past",
            "grammar.v2.examples"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.verbs.past.row.0",
              "cells": [
                "った",
                "買った / 待った / 帰った"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.past.row.1",
              "cells": [
                "んだ",
                "飲んだ / 遊んだ / 死んだ"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.past.row.2",
              "cells": [
                "いた",
                "書いた"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.past.row.3",
              "cells": [
                "いだ",
                "泳いだ"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.past.row.4",
              "cells": [
                "した",
                "話した"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "verb-past-plain-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-plain",
        "conceptId": "verb-past-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-past-plain-1.prompt",
        "successKey": "grammar.v2.verb-past-plain-1.explanation",
        "errorKey": "grammar.v2.verb-past-plain-1.explanation",
        "acceptedAnswers": [
          "見た"
        ],
        "solutionKey": "grammar.v2.verb-past-plain-1.solution",
        "kanaBank": [
          "た",
          "見",
          "る",
          "れ",
          "ん",
          "を"
        ]
      },
      {
        "id": "verb-past-plain-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-past-plain",
        "conceptId": "verb-past-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-past-plain-2.prompt",
        "successKey": "grammar.v2.verb-past-plain-2.explanation",
        "errorKey": "grammar.v2.verb-past-plain-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-past-plain-2.left.0",
            "rightKey": "grammar.v2.verb-past-plain-2.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-2.left.1",
            "rightKey": "grammar.v2.verb-past-plain-2.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-2.left.2",
            "rightKey": "grammar.v2.verb-past-plain-2.right.2"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-2.left.3",
            "rightKey": "grammar.v2.verb-past-plain-2.right.3"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-2.left.4",
            "rightKey": "grammar.v2.verb-past-plain-2.right.4"
          }
        ]
      },
      {
        "id": "verb-past-plain-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-past-plain",
        "conceptId": "verb-past-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-past-plain-3.prompt",
        "successKey": "grammar.v2.verb-past-plain-3.explanation",
        "errorKey": "grammar.v2.verb-past-plain-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-past-plain-3.left.0",
            "rightKey": "grammar.v2.verb-past-plain-3.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-3.left.1",
            "rightKey": "grammar.v2.verb-past-plain-3.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-3.left.2",
            "rightKey": "grammar.v2.verb-past-plain-3.right.2"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-3.left.3",
            "rightKey": "grammar.v2.verb-past-plain-3.right.3"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-3.left.4",
            "rightKey": "grammar.v2.verb-past-plain-3.right.4"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-3.left.5",
            "rightKey": "grammar.v2.verb-past-plain-3.right.5"
          }
        ]
      },
      {
        "id": "verb-past-plain-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "error-detection",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-plain",
        "conceptId": "verb-past-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.verb-past-plain-4.prompt",
        "successKey": "grammar.v2.verb-past-plain-4.explanation",
        "errorKey": "grammar.v2.verb-past-plain-4.explanation",
        "options": [
          {
            "id": "verb-past-plain-4-option-0",
            "textKey": "grammar.v2.verb-past-plain-4.option.0",
            "feedbackKey": "grammar.v2.verb-past-plain-4.feedback.0",
            "grammarStatus": "invalid"
          },
          {
            "id": "verb-past-plain-4-option-1",
            "textKey": "grammar.v2.verb-past-plain-4.option.1",
            "feedbackKey": "grammar.v2.verb-past-plain-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-past-plain-4-option-2",
            "textKey": "grammar.v2.verb-past-plain-4.option.2",
            "feedbackKey": "grammar.v2.verb-past-plain-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-past-plain-4.option.0",
          "grammar.v2.verb-past-plain-4.option.1",
          "grammar.v2.verb-past-plain-4.option.2"
        ],
        "answer": 0
      },
      {
        "id": "verb-past-plain-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-plain",
        "conceptId": "verb-past-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-past-plain-5.prompt",
        "successKey": "grammar.v2.verb-past-plain-5.explanation",
        "errorKey": "grammar.v2.verb-past-plain-5.explanation",
        "acceptedAnswers": [
          "した"
        ],
        "solutionKey": "grammar.v2.verb-past-plain-5.solution",
        "kanaBank": [
          "た",
          "し",
          "で",
          "だ",
          "ま",
          "へ"
        ]
      },
      {
        "id": "verb-past-plain-6",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-plain",
        "conceptId": "verb-past-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-past-plain-6.prompt",
        "successKey": "grammar.v2.verb-past-plain-6.explanation",
        "errorKey": "grammar.v2.verb-past-plain-6.explanation",
        "acceptedAnswers": [
          "きた"
        ],
        "solutionKey": "grammar.v2.verb-past-plain-6.solution",
        "kanaBank": [
          "ん",
          "を",
          "れ",
          "ら",
          "た",
          "き"
        ]
      },
      {
        "id": "verb-past-plain-7",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-past-plain",
        "conceptId": "verb-past-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-past-plain-7.prompt",
        "successKey": "grammar.v2.verb-past-plain-7.explanation",
        "errorKey": "grammar.v2.verb-past-plain-7.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-past-plain-7.left.0",
            "rightKey": "grammar.v2.verb-past-plain-7.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-7.left.1",
            "rightKey": "grammar.v2.verb-past-plain-7.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-past-plain-7.left.2",
            "rightKey": "grammar.v2.verb-past-plain-7.right.2"
          }
        ]
      }
    ]
  },
  {
    "id": "verb-past-negative-plain",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 7,
    "titleKey": "grammar.v2.verb-past-negative-plain.title",
    "summaryKey": "grammar.v2.verb-past-negative-plain.summary",
    "goalKey": "grammar.v2.verb-past-negative-plain.goal",
    "prerequisiteIds": [
      "verb-negative-plain",
      "verb-past-plain"
    ],
    "relatedIds": [
      "polite-verb-masu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-past-negative-plain.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "飲まない → 飲まなかった"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べない → 食べなかった"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高くない → 高くなかった"
        }
      ],
      "examples": [
        {
          "japanese": "食べなかった。",
          "reading": "たべなかった。",
          "meaningKey": "grammar.v2.verb-past-negative-plain.example.0"
        },
        {
          "japanese": "行かなかった。",
          "reading": "いかなかった。",
          "meaningKey": "grammar.v2.verb-past-negative-plain.example.1"
        },
        {
          "japanese": "しなかった。",
          "reading": "しなかった。",
          "meaningKey": "grammar.v2.verb-past-negative-plain.example.2"
        },
        {
          "japanese": "こなかった。",
          "reading": "こなかった。",
          "meaningKey": "grammar.v2.verb-past-negative-plain.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-past-negative-plain.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-past-negative-plain.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.verbs.ichidanMatrix",
          "headerKeys": [
            "grammar.v2.nonpast",
            "grammar.v2.past"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.positive",
              "cells": [
                "食べる",
                "食べた"
              ]
            },
            {
              "labelKey": "grammar.v2.negative",
              "cells": [
                "食べない",
                "食べなかった"
              ]
            }
          ]
        },
        {
          "captionKey": "grammar.v2.verbs.godanMatrix",
          "headerKeys": [
            "grammar.v2.nonpast",
            "grammar.v2.past"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.positive",
              "cells": [
                "飲む",
                "飲んだ"
              ]
            },
            {
              "labelKey": "grammar.v2.negative",
              "cells": [
                "飲まない",
                "飲まなかった"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "verb-past-negative-plain-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-negative-plain",
        "conceptId": "verb-past-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-past-negative-plain-1.prompt",
        "successKey": "grammar.v2.verb-past-negative-plain-1.explanation",
        "errorKey": "grammar.v2.verb-past-negative-plain-1.explanation",
        "acceptedAnswers": [
          "食べなかった"
        ],
        "solutionKey": "grammar.v2.verb-past-negative-plain-1.solution",
        "kanaBank": [
          "う",
          "が",
          "か",
          "べ",
          "っ",
          "な",
          "食",
          "た"
        ]
      },
      {
        "id": "verb-past-negative-plain-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-negative-plain",
        "conceptId": "verb-past-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-past-negative-plain-2.prompt",
        "successKey": "grammar.v2.verb-past-negative-plain-2.explanation",
        "errorKey": "grammar.v2.verb-past-negative-plain-2.explanation",
        "acceptedAnswers": [
          "飲まなかった"
        ],
        "solutionKey": "grammar.v2.verb-past-negative-plain-2.solution",
        "kanaBank": [
          "飲",
          "か",
          "え",
          "く",
          "た",
          "な",
          "っ",
          "ま"
        ]
      },
      {
        "id": "verb-past-negative-plain-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "verb-past-negative-plain",
        "conceptId": "verb-past-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-past-negative-plain-3.prompt",
        "successKey": "grammar.v2.verb-past-negative-plain-3.explanation",
        "errorKey": "grammar.v2.verb-past-negative-plain-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-past-negative-plain-3.left.0",
            "rightKey": "grammar.v2.verb-past-negative-plain-3.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-past-negative-plain-3.left.1",
            "rightKey": "grammar.v2.verb-past-negative-plain-3.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-past-negative-plain-3.left.2",
            "rightKey": "grammar.v2.verb-past-negative-plain-3.right.2"
          }
        ]
      },
      {
        "id": "verb-past-negative-plain-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-negative-plain",
        "conceptId": "verb-past-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-past-negative-plain-4.prompt",
        "successKey": "grammar.v2.verb-past-negative-plain-4.explanation",
        "errorKey": "grammar.v2.verb-past-negative-plain-4.explanation",
        "options": [
          {
            "id": "verb-past-negative-plain-4-option-0",
            "textKey": "grammar.v2.verb-past-negative-plain-4.option.0",
            "feedbackKey": "grammar.v2.verb-past-negative-plain-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-past-negative-plain-4-option-1",
            "textKey": "grammar.v2.verb-past-negative-plain-4.option.1",
            "feedbackKey": "grammar.v2.verb-past-negative-plain-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-past-negative-plain-4-option-2",
            "textKey": "grammar.v2.verb-past-negative-plain-4.option.2",
            "feedbackKey": "grammar.v2.verb-past-negative-plain-4.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-past-negative-plain-4-option-3",
            "textKey": "grammar.v2.verb-past-negative-plain-4.option.3",
            "feedbackKey": "grammar.v2.verb-past-negative-plain-4.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-past-negative-plain-4.option.0",
          "grammar.v2.verb-past-negative-plain-4.option.1",
          "grammar.v2.verb-past-negative-plain-4.option.2",
          "grammar.v2.verb-past-negative-plain-4.option.3"
        ],
        "answer": 3
      },
      {
        "id": "verb-past-negative-plain-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "verb-past-negative-plain",
        "conceptId": "verb-past-negative-plain",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-past-negative-plain-5.prompt",
        "successKey": "grammar.v2.verb-past-negative-plain-5.explanation",
        "errorKey": "grammar.v2.verb-past-negative-plain-5.explanation",
        "options": [
          {
            "id": "verb-past-negative-plain-5-option-0",
            "textKey": "grammar.v2.verb-past-negative-plain-5.option.0",
            "feedbackKey": "grammar.v2.verb-past-negative-plain-5.feedback.0"
          },
          {
            "id": "verb-past-negative-plain-5-option-1",
            "textKey": "grammar.v2.verb-past-negative-plain-5.option.1",
            "feedbackKey": "grammar.v2.verb-past-negative-plain-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-past-negative-plain-5.option.0",
          "grammar.v2.verb-past-negative-plain-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "adjective-adverb-ku-ni",
    "level": "N5",
    "track": "core",
    "topicId": "03",
    "order": 8,
    "titleKey": "grammar.v2.adjective-adverb-ku-ni.title",
    "summaryKey": "grammar.v2.adjective-adverb-ku-ni.summary",
    "goalKey": "grammar.v2.adjective-adverb-ku-ni.goal",
    "prerequisiteIds": [
      "adjective-i",
      "adjective-na",
      "verb-role-dictionary"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.adjective-adverb-ku-ni.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "早い → 早く歩く。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "静か → 静かに話す。"
        }
      ],
      "examples": [
        {
          "japanese": "早く歩く。",
          "reading": "はやくあるく。",
          "meaningKey": "grammar.v2.adjective-adverb-ku-ni.example.0"
        },
        {
          "japanese": "静かに話す。",
          "reading": "しずかにはなす。",
          "meaningKey": "grammar.v2.adjective-adverb-ku-ni.example.1"
        },
        {
          "japanese": "静かな人",
          "reading": "しずかなひと",
          "meaningKey": "grammar.v2.adjective-adverb-ku-ni.example.2"
        },
        {
          "japanese": "早い人",
          "reading": "はやいひと",
          "meaningKey": "grammar.v2.adjective-adverb-ku-ni.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.adjective-adverb-ku-ni.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.adjective-adverb-ku-ni.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [
        {
          "left": "静かな人",
          "right": "静かに話す",
          "explanationKey": "grammar.v2.adjective-adverb-ku-ni.contrast.0"
        },
        {
          "left": "早い人",
          "right": "早く歩く",
          "explanationKey": "grammar.v2.adjective-adverb-ku-ni.contrast.1"
        }
      ],
      "tables": [
        {
          "captionKey": "grammar.v2.verbs.adverb",
          "headerKeys": [
            "grammar.v2.verbs.noun",
            "grammar.v2.verbs.action"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.verbs.i",
              "cells": [
                "早い人",
                "早く歩く"
              ]
            },
            {
              "labelKey": "grammar.v2.verbs.na",
              "cells": [
                "静かな人",
                "静かに話す"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "adjective-adverb-ku-ni-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "adjective-adverb-ku-ni",
        "conceptId": "adjective-adverb-ku-ni",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-adverb-ku-ni-1.prompt",
        "successKey": "grammar.v2.adjective-adverb-ku-ni-1.explanation",
        "errorKey": "grammar.v2.adjective-adverb-ku-ni-1.explanation",
        "acceptedAnswers": [
          "く"
        ],
        "solutionKey": "grammar.v2.adjective-adverb-ku-ni-1.solution",
        "kanaBank": [
          "を",
          "ん",
          "れ",
          "ら",
          "る",
          "く"
        ]
      },
      {
        "id": "adjective-adverb-ku-ni-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "adjective-adverb-ku-ni",
        "conceptId": "adjective-adverb-ku-ni",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.adjective-adverb-ku-ni-2.prompt",
        "successKey": "grammar.v2.adjective-adverb-ku-ni-2.explanation",
        "errorKey": "grammar.v2.adjective-adverb-ku-ni-2.explanation",
        "acceptedAnswers": [
          "に"
        ],
        "solutionKey": "grammar.v2.adjective-adverb-ku-ni-2.solution",
        "kanaBank": [
          "を",
          "ゃ",
          "も",
          "や",
          "る",
          "に"
        ]
      },
      {
        "id": "adjective-adverb-ku-ni-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "03",
        "lessonId": "adjective-adverb-ku-ni",
        "conceptId": "adjective-adverb-ku-ni",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.adjective-adverb-ku-ni-3.prompt",
        "successKey": "grammar.v2.adjective-adverb-ku-ni-3.explanation",
        "errorKey": "grammar.v2.adjective-adverb-ku-ni-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.adjective-adverb-ku-ni-3.left.0",
            "rightKey": "grammar.v2.adjective-adverb-ku-ni-3.right.0"
          },
          {
            "leftKey": "grammar.v2.adjective-adverb-ku-ni-3.left.1",
            "rightKey": "grammar.v2.adjective-adverb-ku-ni-3.right.1"
          }
        ]
      },
      {
        "id": "adjective-adverb-ku-ni-4",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "adjective-adverb-ku-ni",
        "conceptId": "adjective-adverb-ku-ni",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.adjective-adverb-ku-ni-4.prompt",
        "successKey": "grammar.v2.adjective-adverb-ku-ni-4.explanation",
        "errorKey": "grammar.v2.adjective-adverb-ku-ni-4.explanation",
        "tokenKeys": [
          "grammar.v2.adjective-adverb-ku-ni-4.token.0",
          "grammar.v2.adjective-adverb-ku-ni-4.token.1"
        ],
        "solution": [
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "adjective-adverb-ku-ni-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "03",
        "lessonId": "adjective-adverb-ku-ni",
        "conceptId": "adjective-adverb-ku-ni",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic03",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.adjective-adverb-ku-ni-5.prompt",
        "successKey": "grammar.v2.adjective-adverb-ku-ni-5.explanation",
        "errorKey": "grammar.v2.adjective-adverb-ku-ni-5.explanation",
        "options": [
          {
            "id": "adjective-adverb-ku-ni-5-option-0",
            "textKey": "grammar.v2.adjective-adverb-ku-ni-5.option.0",
            "feedbackKey": "grammar.v2.adjective-adverb-ku-ni-5.feedback.0"
          },
          {
            "id": "adjective-adverb-ku-ni-5-option-1",
            "textKey": "grammar.v2.adjective-adverb-ku-ni-5.option.1",
            "feedbackKey": "grammar.v2.adjective-adverb-ku-ni-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.adjective-adverb-ku-ni-5.option.0",
          "grammar.v2.adjective-adverb-ku-ni-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "particle-wo-object",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 1,
    "titleKey": "grammar.v2.particle-wo-object.title",
    "summaryKey": "grammar.v2.particle-wo-object.summary",
    "goalKey": "grammar.v2.particle-wo-object.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "verb-transitivity-basic",
      "motion-purpose-ni-iku",
      "relative-clause-noun"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-wo-object.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "パン + を + 食べる"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "本 + を + 読む"
        }
      ],
      "examples": [
        {
          "japanese": "パンを食べる。",
          "reading": "パンをたべる。",
          "meaningKey": "grammar.v2.particle-wo-object.example.0"
        },
        {
          "japanese": "本を読む。",
          "reading": "ほんをよむ。",
          "meaningKey": "grammar.v2.particle-wo-object.example.1"
        },
        {
          "japanese": "映画を見る。",
          "reading": "えいがをみる。",
          "meaningKey": "grammar.v2.particle-wo-object.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-wo-object.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-wo-object.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-wo-object-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "particle-wo-object",
        "conceptId": "particle-wo-object",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wo-object-1.prompt",
        "successKey": "grammar.v2.particle-wo-object-1.explanation",
        "errorKey": "grammar.v2.particle-wo-object-1.explanation",
        "options": [
          {
            "id": "particle-wo-object-1-option-0",
            "textKey": "grammar.v2.particle-wo-object-1.option.0",
            "feedbackKey": "grammar.v2.particle-wo-object-1.feedback.0"
          },
          {
            "id": "particle-wo-object-1-option-1",
            "textKey": "grammar.v2.particle-wo-object-1.option.1",
            "feedbackKey": "grammar.v2.particle-wo-object-1.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wo-object-1.option.0",
          "grammar.v2.particle-wo-object-1.option.1"
        ],
        "answer": 0
      },
      {
        "id": "particle-wo-object-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-wo-object",
        "conceptId": "particle-wo-object",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-wo-object-2.prompt",
        "successKey": "grammar.v2.particle-wo-object-2.explanation",
        "errorKey": "grammar.v2.particle-wo-object-2.explanation",
        "acceptedAnswers": [
          "を"
        ],
        "solutionKey": "grammar.v2.particle-wo-object-2.solution",
        "kanaBank": [
          "た",
          "す",
          "じ",
          "し",
          "は",
          "を"
        ]
      },
      {
        "id": "particle-wo-object-3",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-wo-object",
        "conceptId": "particle-wo-object",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.particle-wo-object-3.prompt",
        "successKey": "grammar.v2.particle-wo-object-3.explanation",
        "errorKey": "grammar.v2.particle-wo-object-3.explanation",
        "tokenKeys": [
          "grammar.v2.particle-wo-object-3.token.0",
          "grammar.v2.particle-wo-object-3.token.1",
          "grammar.v2.particle-wo-object-3.token.2"
        ],
        "solution": [
          2,
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "particle-wo-object-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-wo-object",
        "conceptId": "particle-wo-object",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-wo-object-4.prompt",
        "successKey": "grammar.v2.particle-wo-object-4.explanation",
        "errorKey": "grammar.v2.particle-wo-object-4.explanation",
        "options": [
          {
            "id": "particle-wo-object-4-option-0",
            "textKey": "grammar.v2.particle-wo-object-4.option.0",
            "feedbackKey": "grammar.v2.particle-wo-object-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-wo-object-4-option-1",
            "textKey": "grammar.v2.particle-wo-object-4.option.1",
            "feedbackKey": "grammar.v2.particle-wo-object-4.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-wo-object-4.option.0",
          "grammar.v2.particle-wo-object-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "verb-transitivity-basic",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 2,
    "titleKey": "grammar.v2.verb-transitivity-basic.title",
    "summaryKey": "grammar.v2.verb-transitivity-basic.summary",
    "goalKey": "grammar.v2.verb-transitivity-basic.goal",
    "prerequisiteIds": [
      "particle-wo-object",
      "particle-ga-identifier",
      "verb-role-dictionary"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.verb-transitivity-basic.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "ドアが開く。 / ドアを開ける。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "電気がつく。 / 電気をつける。"
        }
      ],
      "examples": [
        {
          "japanese": "ドアが開く。",
          "reading": "ドアがあく。",
          "meaningKey": "grammar.v2.verb-transitivity-basic.example.0"
        },
        {
          "japanese": "ドアを開ける。",
          "reading": "ドアをあける。",
          "meaningKey": "grammar.v2.verb-transitivity-basic.example.1"
        },
        {
          "japanese": "電気がつく。",
          "reading": "でんきがつく。",
          "meaningKey": "grammar.v2.verb-transitivity-basic.example.2"
        },
        {
          "japanese": "電気をつける。",
          "reading": "でんきをつける。",
          "meaningKey": "grammar.v2.verb-transitivity-basic.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-transitivity-basic.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-transitivity-basic.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.transitivity.caption",
          "headerKeys": [
            "grammar.v2.location.transitivity.header.0",
            "grammar.v2.location.transitivity.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.transitivity.row.0",
              "cells": [
                "ドアが開く",
                "ドアを開ける"
              ]
            },
            {
              "labelKey": "grammar.v2.location.transitivity.row.1",
              "cells": [
                "電気がつく",
                "電気をつける"
              ]
            },
            {
              "labelKey": "grammar.v2.location.transitivity.row.2",
              "cells": [
                "ドアが閉まる",
                "ドアを閉める"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "verb-transitivity-basic-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "verb-transitivity-basic",
        "conceptId": "verb-transitivity-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-transitivity-basic-1.prompt",
        "successKey": "grammar.v2.verb-transitivity-basic-1.explanation",
        "errorKey": "grammar.v2.verb-transitivity-basic-1.explanation",
        "options": [
          {
            "id": "verb-transitivity-basic-1-option-0",
            "textKey": "grammar.v2.verb-transitivity-basic-1.option.0",
            "feedbackKey": "grammar.v2.verb-transitivity-basic-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-transitivity-basic-1-option-1",
            "textKey": "grammar.v2.verb-transitivity-basic-1.option.1",
            "feedbackKey": "grammar.v2.verb-transitivity-basic-1.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-transitivity-basic-1.option.0",
          "grammar.v2.verb-transitivity-basic-1.option.1"
        ],
        "answer": 0
      },
      {
        "id": "verb-transitivity-basic-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "verb-transitivity-basic",
        "conceptId": "verb-transitivity-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-transitivity-basic-2.prompt",
        "successKey": "grammar.v2.verb-transitivity-basic-2.explanation",
        "errorKey": "grammar.v2.verb-transitivity-basic-2.explanation",
        "acceptedAnswers": [
          "を"
        ],
        "solutionKey": "grammar.v2.verb-transitivity-basic-2.solution",
        "kanaBank": [
          "う",
          "い",
          "す",
          "じ",
          "た",
          "を"
        ]
      },
      {
        "id": "verb-transitivity-basic-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "verb-transitivity-basic",
        "conceptId": "verb-transitivity-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-transitivity-basic-3.prompt",
        "successKey": "grammar.v2.verb-transitivity-basic-3.explanation",
        "errorKey": "grammar.v2.verb-transitivity-basic-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-transitivity-basic-3.left.0",
            "rightKey": "grammar.v2.verb-transitivity-basic-3.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-transitivity-basic-3.left.1",
            "rightKey": "grammar.v2.verb-transitivity-basic-3.right.1"
          }
        ]
      },
      {
        "id": "verb-transitivity-basic-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "verb-transitivity-basic",
        "conceptId": "verb-transitivity-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.verb-transitivity-basic-4.prompt",
        "successKey": "grammar.v2.verb-transitivity-basic-4.explanation",
        "errorKey": "grammar.v2.verb-transitivity-basic-4.explanation",
        "options": [
          {
            "id": "verb-transitivity-basic-4-option-0",
            "textKey": "grammar.v2.verb-transitivity-basic-4.option.0",
            "feedbackKey": "grammar.v2.verb-transitivity-basic-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "verb-transitivity-basic-4-option-1",
            "textKey": "grammar.v2.verb-transitivity-basic-4.option.1",
            "feedbackKey": "grammar.v2.verb-transitivity-basic-4.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.verb-transitivity-basic-4.option.0",
          "grammar.v2.verb-transitivity-basic-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "particle-ni-destination",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 3,
    "titleKey": "grammar.v2.particle-ni-destination.title",
    "summaryKey": "grammar.v2.particle-ni-destination.summary",
    "goalKey": "grammar.v2.particle-ni-destination.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "particle-he-direction",
      "motion-purpose-ni-iku"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-ni-destination.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学校に行く。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "家に帰る。"
        }
      ],
      "examples": [
        {
          "japanese": "学校に行く。",
          "reading": "がっこうにいく。",
          "meaningKey": "grammar.v2.particle-ni-destination.example.0"
        },
        {
          "japanese": "家に帰る。",
          "reading": "いえにかえる。",
          "meaningKey": "grammar.v2.particle-ni-destination.example.1"
        },
        {
          "japanese": "日本に来る。",
          "reading": "にほんにくる。",
          "meaningKey": "grammar.v2.particle-ni-destination.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-ni-destination.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-ni-destination.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-ni-destination-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-ni-destination",
        "conceptId": "particle-ni-destination",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-ni-destination-1.prompt",
        "successKey": "grammar.v2.particle-ni-destination-1.explanation",
        "errorKey": "grammar.v2.particle-ni-destination-1.explanation",
        "acceptedAnswers": [
          "に",
          "へ"
        ],
        "solutionKey": "grammar.v2.particle-ni-destination-1.solution",
        "kanaBank": [
          "し",
          "た",
          "じ",
          "す",
          "へ",
          "に"
        ]
      },
      {
        "id": "particle-ni-destination-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "particle-ni-destination",
        "conceptId": "particle-ni-destination",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-ni-destination-2.prompt",
        "successKey": "grammar.v2.particle-ni-destination-2.explanation",
        "errorKey": "grammar.v2.particle-ni-destination-2.explanation",
        "options": [
          {
            "id": "particle-ni-destination-2-option-0",
            "textKey": "grammar.v2.particle-ni-destination-2.option.0",
            "feedbackKey": "grammar.v2.particle-ni-destination-2.feedback.0"
          },
          {
            "id": "particle-ni-destination-2-option-1",
            "textKey": "grammar.v2.particle-ni-destination-2.option.1",
            "feedbackKey": "grammar.v2.particle-ni-destination-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-ni-destination-2.option.0",
          "grammar.v2.particle-ni-destination-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "particle-ni-destination-3",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-ni-destination",
        "conceptId": "particle-ni-destination",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.particle-ni-destination-3.prompt",
        "successKey": "grammar.v2.particle-ni-destination-3.explanation",
        "errorKey": "grammar.v2.particle-ni-destination-3.explanation",
        "tokenKeys": [
          "grammar.v2.particle-ni-destination-3.token.0",
          "grammar.v2.particle-ni-destination-3.token.1",
          "grammar.v2.particle-ni-destination-3.token.2"
        ],
        "solution": [
          1,
          2,
          0
        ],
        "orderPolicy": "constrained"
      }
    ]
  },
  {
    "id": "particle-he-direction",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 4,
    "titleKey": "grammar.v2.particle-he-direction.title",
    "summaryKey": "grammar.v2.particle-he-direction.summary",
    "goalKey": "grammar.v2.particle-he-direction.goal",
    "prerequisiteIds": [
      "particle-ni-destination"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.particle-he-direction.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "日本へ行く。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "家へ帰る。"
        }
      ],
      "examples": [
        {
          "japanese": "日本へ行く。",
          "reading": "にほんえいく。",
          "meaningKey": "grammar.v2.particle-he-direction.example.0"
        },
        {
          "japanese": "家へ帰る。",
          "reading": "いええかえる。",
          "meaningKey": "grammar.v2.particle-he-direction.example.1"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-he-direction.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-he-direction.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-he-direction-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "particle-he-direction",
        "conceptId": "particle-he-direction",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-he-direction-1.prompt",
        "successKey": "grammar.v2.particle-he-direction-1.explanation",
        "errorKey": "grammar.v2.particle-he-direction-1.explanation",
        "options": [
          {
            "id": "particle-he-direction-1-option-0",
            "textKey": "grammar.v2.particle-he-direction-1.option.0",
            "feedbackKey": "grammar.v2.particle-he-direction-1.feedback.0"
          },
          {
            "id": "particle-he-direction-1-option-1",
            "textKey": "grammar.v2.particle-he-direction-1.option.1",
            "feedbackKey": "grammar.v2.particle-he-direction-1.feedback.1"
          },
          {
            "id": "particle-he-direction-1-option-2",
            "textKey": "grammar.v2.particle-he-direction-1.option.2",
            "feedbackKey": "grammar.v2.particle-he-direction-1.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-he-direction-1.option.0",
          "grammar.v2.particle-he-direction-1.option.1",
          "grammar.v2.particle-he-direction-1.option.2"
        ],
        "answer": 0
      },
      {
        "id": "particle-he-direction-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-he-direction",
        "conceptId": "particle-he-direction",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-he-direction-2.prompt",
        "successKey": "grammar.v2.particle-he-direction-2.explanation",
        "errorKey": "grammar.v2.particle-he-direction-2.explanation",
        "options": [
          {
            "id": "particle-he-direction-2-option-0",
            "textKey": "grammar.v2.particle-he-direction-2.option.0",
            "feedbackKey": "grammar.v2.particle-he-direction-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-he-direction-2-option-1",
            "textKey": "grammar.v2.particle-he-direction-2.option.1",
            "feedbackKey": "grammar.v2.particle-he-direction-2.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-he-direction-2.option.0",
          "grammar.v2.particle-he-direction-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "particle-he-direction-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-he-direction",
        "conceptId": "particle-he-direction",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-he-direction-3.prompt",
        "successKey": "grammar.v2.particle-he-direction-3.explanation",
        "errorKey": "grammar.v2.particle-he-direction-3.explanation",
        "acceptedAnswers": [
          "に",
          "へ"
        ],
        "solutionKey": "grammar.v2.particle-he-direction-3.solution",
        "kanaBank": [
          "ん",
          "を",
          "れ",
          "ら",
          "へ",
          "に"
        ]
      }
    ]
  },
  {
    "id": "particle-de-action-location",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 5,
    "titleKey": "grammar.v2.particle-de-action-location.title",
    "summaryKey": "grammar.v2.particle-de-action-location.summary",
    "goalKey": "grammar.v2.particle-de-action-location.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "location-ni-vs-de"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-de-action-location.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "図書館で読む。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "家で勉強する。"
        }
      ],
      "examples": [
        {
          "japanese": "図書館で読む。",
          "reading": "としょかんでよむ。",
          "meaningKey": "grammar.v2.particle-de-action-location.example.0"
        },
        {
          "japanese": "家で勉強する。",
          "reading": "いえでべんきょうする。",
          "meaningKey": "grammar.v2.particle-de-action-location.example.1"
        },
        {
          "japanese": "学校で話す。",
          "reading": "がっこうではなす。",
          "meaningKey": "grammar.v2.particle-de-action-location.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-de-action-location.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-de-action-location.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-de-action-location-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-de-action-location",
        "conceptId": "particle-de-action-location",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-de-action-location-1.prompt",
        "successKey": "grammar.v2.particle-de-action-location-1.explanation",
        "errorKey": "grammar.v2.particle-de-action-location-1.explanation",
        "options": [
          {
            "id": "particle-de-action-location-1-option-0",
            "textKey": "grammar.v2.particle-de-action-location-1.option.0",
            "feedbackKey": "grammar.v2.particle-de-action-location-1.feedback.0"
          },
          {
            "id": "particle-de-action-location-1-option-1",
            "textKey": "grammar.v2.particle-de-action-location-1.option.1",
            "feedbackKey": "grammar.v2.particle-de-action-location-1.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-de-action-location-1.option.0",
          "grammar.v2.particle-de-action-location-1.option.1"
        ],
        "answer": 1
      },
      {
        "id": "particle-de-action-location-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-de-action-location",
        "conceptId": "particle-de-action-location",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-de-action-location-2.prompt",
        "successKey": "grammar.v2.particle-de-action-location-2.explanation",
        "errorKey": "grammar.v2.particle-de-action-location-2.explanation",
        "options": [
          {
            "id": "particle-de-action-location-2-option-0",
            "textKey": "grammar.v2.particle-de-action-location-2.option.0",
            "feedbackKey": "grammar.v2.particle-de-action-location-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "particle-de-action-location-2-option-1",
            "textKey": "grammar.v2.particle-de-action-location-2.option.1",
            "feedbackKey": "grammar.v2.particle-de-action-location-2.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-de-action-location-2.option.0",
          "grammar.v2.particle-de-action-location-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "particle-de-action-location-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-de-action-location",
        "conceptId": "particle-de-action-location",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-de-action-location-3.prompt",
        "successKey": "grammar.v2.particle-de-action-location-3.explanation",
        "errorKey": "grammar.v2.particle-de-action-location-3.explanation",
        "acceptedAnswers": [
          "で"
        ],
        "solutionKey": "grammar.v2.particle-de-action-location-3.solution",
        "kanaBank": [
          "ら",
          "る",
          "れ",
          "を",
          "ん",
          "で"
        ]
      },
      {
        "id": "particle-de-action-location-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-de-action-location",
        "conceptId": "particle-de-action-location",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-de-action-location-4.prompt",
        "successKey": "grammar.v2.particle-de-action-location-4.explanation",
        "errorKey": "grammar.v2.particle-de-action-location-4.explanation",
        "options": [
          {
            "id": "particle-de-action-location-4-option-0",
            "textKey": "grammar.v2.particle-de-action-location-4.option.0",
            "feedbackKey": "grammar.v2.particle-de-action-location-4.feedback.0"
          },
          {
            "id": "particle-de-action-location-4-option-1",
            "textKey": "grammar.v2.particle-de-action-location-4.option.1",
            "feedbackKey": "grammar.v2.particle-de-action-location-4.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-de-action-location-4.option.0",
          "grammar.v2.particle-de-action-location-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "particle-ni-time",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 6,
    "titleKey": "grammar.v2.particle-ni-time.title",
    "summaryKey": "grammar.v2.particle-ni-time.summary",
    "goalKey": "grammar.v2.particle-ni-time.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "clock-time",
      "calendar-dates"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-ni-time.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "七時に起きる。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "明日行く。"
        }
      ],
      "examples": [
        {
          "japanese": "七時に起きる。",
          "reading": "しちじにおきる。",
          "meaningKey": "grammar.v2.particle-ni-time.example.0"
        },
        {
          "japanese": "月曜日に行く。",
          "reading": "げつようびにいく。",
          "meaningKey": "grammar.v2.particle-ni-time.example.1"
        },
        {
          "japanese": "五月三日に帰る。",
          "reading": "ごがつみっかにかえる。",
          "meaningKey": "grammar.v2.particle-ni-time.example.2"
        },
        {
          "japanese": "今日行く。 / 明日行く。 / 毎日読む。",
          "reading": "きょういく。 / あしたいく。 / まいにちよむ。",
          "meaningKey": "grammar.v2.particle-ni-time.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-ni-time.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-ni-time.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-ni-time-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-ni-time",
        "conceptId": "particle-ni-time",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-ni-time-1.prompt",
        "successKey": "grammar.v2.particle-ni-time-1.explanation",
        "errorKey": "grammar.v2.particle-ni-time-1.explanation",
        "acceptedAnswers": [
          "に"
        ],
        "solutionKey": "grammar.v2.particle-ni-time-1.solution",
        "kanaBank": [
          "え",
          "か",
          "が",
          "く",
          "い",
          "に"
        ]
      },
      {
        "id": "particle-ni-time-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "particle-ni-time",
        "conceptId": "particle-ni-time",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-ni-time-2.prompt",
        "successKey": "grammar.v2.particle-ni-time-2.explanation",
        "errorKey": "grammar.v2.particle-ni-time-2.explanation",
        "options": [
          {
            "id": "particle-ni-time-2-option-0",
            "textKey": "grammar.v2.particle-ni-time-2.option.0",
            "feedbackKey": "grammar.v2.particle-ni-time-2.feedback.0"
          },
          {
            "id": "particle-ni-time-2-option-1",
            "textKey": "grammar.v2.particle-ni-time-2.option.1",
            "feedbackKey": "grammar.v2.particle-ni-time-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-ni-time-2.option.0",
          "grammar.v2.particle-ni-time-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "particle-ni-time-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-ni-time",
        "conceptId": "particle-ni-time",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-ni-time-3.prompt",
        "successKey": "grammar.v2.particle-ni-time-3.explanation",
        "errorKey": "grammar.v2.particle-ni-time-3.explanation",
        "options": [
          {
            "id": "particle-ni-time-3-option-0",
            "textKey": "grammar.v2.particle-ni-time-3.option.0",
            "feedbackKey": "grammar.v2.particle-ni-time-3.feedback.0"
          },
          {
            "id": "particle-ni-time-3-option-1",
            "textKey": "grammar.v2.particle-ni-time-3.option.1",
            "feedbackKey": "grammar.v2.particle-ni-time-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-ni-time-3.option.0",
          "grammar.v2.particle-ni-time-3.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "particle-to-companion",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 7,
    "titleKey": "grammar.v2.particle-to-companion.title",
    "summaryKey": "grammar.v2.particle-to-companion.summary",
    "goalKey": "grammar.v2.particle-to-companion.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "quotation-to"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.particle-to-companion.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "友達と行く。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "姉と食べる。"
        }
      ],
      "examples": [
        {
          "japanese": "友達と行く。",
          "reading": "ともだちといく。",
          "meaningKey": "grammar.v2.particle-to-companion.example.0"
        },
        {
          "japanese": "姉と食べる。",
          "reading": "あねとたべる。",
          "meaningKey": "grammar.v2.particle-to-companion.example.1"
        },
        {
          "japanese": "田中さんと話す。",
          "reading": "たなかさんとはなす。",
          "meaningKey": "grammar.v2.particle-to-companion.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-to-companion.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-to-companion.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-to-companion-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-to-companion",
        "conceptId": "particle-to-companion",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-to-companion-1.prompt",
        "successKey": "grammar.v2.particle-to-companion-1.explanation",
        "errorKey": "grammar.v2.particle-to-companion-1.explanation",
        "acceptedAnswers": [
          "と"
        ],
        "solutionKey": "grammar.v2.particle-to-companion-1.solution",
        "kanaBank": [
          "た",
          "じ",
          "す",
          "し",
          "が",
          "と"
        ]
      },
      {
        "id": "particle-to-companion-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "particle-to-companion",
        "conceptId": "particle-to-companion",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-to-companion-2.prompt",
        "successKey": "grammar.v2.particle-to-companion-2.explanation",
        "errorKey": "grammar.v2.particle-to-companion-2.explanation",
        "options": [
          {
            "id": "particle-to-companion-2-option-0",
            "textKey": "grammar.v2.particle-to-companion-2.option.0",
            "feedbackKey": "grammar.v2.particle-to-companion-2.feedback.0"
          },
          {
            "id": "particle-to-companion-2-option-1",
            "textKey": "grammar.v2.particle-to-companion-2.option.1",
            "feedbackKey": "grammar.v2.particle-to-companion-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-to-companion-2.option.0",
          "grammar.v2.particle-to-companion-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "particle-to-companion-3",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-to-companion",
        "conceptId": "particle-to-companion",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.particle-to-companion-3.prompt",
        "successKey": "grammar.v2.particle-to-companion-3.explanation",
        "errorKey": "grammar.v2.particle-to-companion-3.explanation",
        "tokenKeys": [
          "grammar.v2.particle-to-companion-3.token.0",
          "grammar.v2.particle-to-companion-3.token.1",
          "grammar.v2.particle-to-companion-3.token.2"
        ],
        "solution": [
          2,
          0,
          1
        ],
        "orderPolicy": "constrained"
      }
    ]
  },
  {
    "id": "particle-kara-made",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 8,
    "titleKey": "grammar.v2.particle-kara-made.title",
    "summaryKey": "grammar.v2.particle-kara-made.summary",
    "goalKey": "grammar.v2.particle-kara-made.goal",
    "prerequisiteIds": [
      "verb-role-dictionary"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.particle-kara-made.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "家から駅まで行く。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "九時から五時まで。"
        }
      ],
      "examples": [
        {
          "japanese": "家から駅まで行く。",
          "reading": "いえからえきまでいく。",
          "meaningKey": "grammar.v2.particle-kara-made.example.0"
        },
        {
          "japanese": "九時から五時まで。",
          "reading": "くじからごじまで。",
          "meaningKey": "grammar.v2.particle-kara-made.example.1"
        },
        {
          "japanese": "九時から勉強する。",
          "reading": "くじからべんきょうする。",
          "meaningKey": "grammar.v2.particle-kara-made.example.2"
        },
        {
          "japanese": "五時まで働く。",
          "reading": "ごじまではたらく。",
          "meaningKey": "grammar.v2.particle-kara-made.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.particle-kara-made.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.particle-kara-made.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "particle-kara-made-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "particle-kara-made",
        "conceptId": "particle-kara-made",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.particle-kara-made-1.prompt",
        "successKey": "grammar.v2.particle-kara-made-1.explanation",
        "errorKey": "grammar.v2.particle-kara-made-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.particle-kara-made-1.left.0",
            "rightKey": "grammar.v2.particle-kara-made-1.right.0"
          },
          {
            "leftKey": "grammar.v2.particle-kara-made-1.left.1",
            "rightKey": "grammar.v2.particle-kara-made-1.right.1"
          }
        ]
      },
      {
        "id": "particle-kara-made-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-kara-made",
        "conceptId": "particle-kara-made",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.particle-kara-made-2.prompt",
        "successKey": "grammar.v2.particle-kara-made-2.explanation",
        "errorKey": "grammar.v2.particle-kara-made-2.explanation",
        "acceptedAnswers": [
          "から"
        ],
        "solutionKey": "grammar.v2.particle-kara-made-2.solution",
        "kanaBank": [
          "る",
          "ら",
          "れ",
          "も",
          "ゃ",
          "か"
        ]
      },
      {
        "id": "particle-kara-made-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "particle-kara-made",
        "conceptId": "particle-kara-made",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.particle-kara-made-3.prompt",
        "successKey": "grammar.v2.particle-kara-made-3.explanation",
        "errorKey": "grammar.v2.particle-kara-made-3.explanation",
        "options": [
          {
            "id": "particle-kara-made-3-option-0",
            "textKey": "grammar.v2.particle-kara-made-3.option.0",
            "feedbackKey": "grammar.v2.particle-kara-made-3.feedback.0"
          },
          {
            "id": "particle-kara-made-3-option-1",
            "textKey": "grammar.v2.particle-kara-made-3.option.1",
            "feedbackKey": "grammar.v2.particle-kara-made-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.particle-kara-made-3.option.0",
          "grammar.v2.particle-kara-made-3.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "existence-aru-iru",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 9,
    "titleKey": "grammar.v2.existence-aru-iru.title",
    "summaryKey": "grammar.v2.existence-aru-iru.summary",
    "goalKey": "grammar.v2.existence-aru-iru.goal",
    "prerequisiteIds": [
      "particle-ga-identifier",
      "verb-negative-plain",
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "location-ni-vs-de",
      "question-words-ka-mo",
      "basic-counters",
      "te-iru-progressive"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.existence-aru-iru.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "本がある。 / 猫がいる。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "ある → ない / いる → いない"
        }
      ],
      "examples": [
        {
          "japanese": "本がある。",
          "reading": "ほんがある。",
          "meaningKey": "grammar.v2.existence-aru-iru.example.0"
        },
        {
          "japanese": "机がある。",
          "reading": "つくえがある。",
          "meaningKey": "grammar.v2.existence-aru-iru.example.1"
        },
        {
          "japanese": "時間がある。",
          "reading": "じかんがある。",
          "meaningKey": "grammar.v2.existence-aru-iru.example.2"
        },
        {
          "japanese": "猫がいる。",
          "reading": "ねこがいる。",
          "meaningKey": "grammar.v2.existence-aru-iru.example.3"
        },
        {
          "japanese": "人がいる。 / 田中さんがいる。",
          "reading": "ひとがいる。 / たなかさんがいる。",
          "meaningKey": "grammar.v2.existence-aru-iru.example.4"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.existence-aru-iru.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.existence-aru-iru.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.existence.caption",
          "headerKeys": [
            "grammar.v2.location.existence.header.0",
            "grammar.v2.location.existence.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.existence.row.0",
              "cells": [
                "ある",
                "ない"
              ]
            },
            {
              "labelKey": "grammar.v2.location.existence.row.1",
              "cells": [
                "いる",
                "いない"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "existence-aru-iru-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "existence-aru-iru",
        "conceptId": "existence-aru-iru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.existence-aru-iru-1.prompt",
        "successKey": "grammar.v2.existence-aru-iru-1.explanation",
        "errorKey": "grammar.v2.existence-aru-iru-1.explanation",
        "acceptedAnswers": [
          "ある"
        ],
        "solutionKey": "grammar.v2.existence-aru-iru-1.solution",
        "kanaBank": [
          "る",
          "あ",
          "は",
          "な",
          "に",
          "と"
        ]
      },
      {
        "id": "existence-aru-iru-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "existence-aru-iru",
        "conceptId": "existence-aru-iru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.existence-aru-iru-2.prompt",
        "successKey": "grammar.v2.existence-aru-iru-2.explanation",
        "errorKey": "grammar.v2.existence-aru-iru-2.explanation",
        "options": [
          {
            "id": "existence-aru-iru-2-option-0",
            "textKey": "grammar.v2.existence-aru-iru-2.option.0",
            "feedbackKey": "grammar.v2.existence-aru-iru-2.feedback.0"
          },
          {
            "id": "existence-aru-iru-2-option-1",
            "textKey": "grammar.v2.existence-aru-iru-2.option.1",
            "feedbackKey": "grammar.v2.existence-aru-iru-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.existence-aru-iru-2.option.0",
          "grammar.v2.existence-aru-iru-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "existence-aru-iru-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "existence-aru-iru",
        "conceptId": "existence-aru-iru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.existence-aru-iru-3.prompt",
        "successKey": "grammar.v2.existence-aru-iru-3.explanation",
        "errorKey": "grammar.v2.existence-aru-iru-3.explanation",
        "acceptedAnswers": [
          "ない"
        ],
        "solutionKey": "grammar.v2.existence-aru-iru-3.solution",
        "kanaBank": [
          "い",
          "な",
          "ら",
          "る",
          "を",
          "ん"
        ]
      },
      {
        "id": "existence-aru-iru-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "existence-aru-iru",
        "conceptId": "existence-aru-iru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.existence-aru-iru-4.prompt",
        "successKey": "grammar.v2.existence-aru-iru-4.explanation",
        "errorKey": "grammar.v2.existence-aru-iru-4.explanation",
        "acceptedAnswers": [
          "いない"
        ],
        "solutionKey": "grammar.v2.existence-aru-iru-4.solution",
        "kanaBank": [
          "な",
          "い",
          "も",
          "れ",
          "る",
          "ら"
        ]
      },
      {
        "id": "existence-aru-iru-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "existence-aru-iru",
        "conceptId": "existence-aru-iru",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.existence-aru-iru-5.prompt",
        "successKey": "grammar.v2.existence-aru-iru-5.explanation",
        "errorKey": "grammar.v2.existence-aru-iru-5.explanation",
        "options": [
          {
            "id": "existence-aru-iru-5-option-0",
            "textKey": "grammar.v2.existence-aru-iru-5.option.0",
            "feedbackKey": "grammar.v2.existence-aru-iru-5.feedback.0"
          },
          {
            "id": "existence-aru-iru-5-option-1",
            "textKey": "grammar.v2.existence-aru-iru-5.option.1",
            "feedbackKey": "grammar.v2.existence-aru-iru-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.existence-aru-iru-5.option.0",
          "grammar.v2.existence-aru-iru-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "location-ni-vs-de",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 10,
    "titleKey": "grammar.v2.location-ni-vs-de.title",
    "summaryKey": "grammar.v2.location-ni-vs-de.summary",
    "goalKey": "grammar.v2.location-ni-vs-de.goal",
    "prerequisiteIds": [
      "existence-aru-iru",
      "particle-de-action-location"
    ],
    "relatedIds": [
      "position-words"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.location-ni-vs-de.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "図書館に本がある。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "図書館で本を読む。"
        }
      ],
      "examples": [
        {
          "japanese": "図書館に本がある。",
          "reading": "としょかんにほんがある。",
          "meaningKey": "grammar.v2.location-ni-vs-de.example.0"
        },
        {
          "japanese": "図書館で本を読む。",
          "reading": "としょかんでほんをよむ。",
          "meaningKey": "grammar.v2.location-ni-vs-de.example.1"
        },
        {
          "japanese": "田中さんは図書館にいる。",
          "reading": "たなかさんはとしょかんにいる。",
          "meaningKey": "grammar.v2.location-ni-vs-de.example.2"
        },
        {
          "japanese": "田中さんは図書館で勉強する。",
          "reading": "たなかさんはとしょかんでべんきょうする。",
          "meaningKey": "grammar.v2.location-ni-vs-de.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.location-ni-vs-de.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.location-ni-vs-de.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.location.caption",
          "headerKeys": [
            "grammar.v2.location.location.header.0",
            "grammar.v2.location.location.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.location.row.0",
              "cells": [
                "に",
                "図書館に本がある"
              ]
            },
            {
              "labelKey": "grammar.v2.location.location.row.1",
              "cells": [
                "で",
                "図書館で本を読む"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "location-ni-vs-de-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "location-ni-vs-de",
        "conceptId": "location-ni-vs-de",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.location-ni-vs-de-1.prompt",
        "successKey": "grammar.v2.location-ni-vs-de-1.explanation",
        "errorKey": "grammar.v2.location-ni-vs-de-1.explanation",
        "options": [
          {
            "id": "location-ni-vs-de-1-option-0",
            "textKey": "grammar.v2.location-ni-vs-de-1.option.0",
            "feedbackKey": "grammar.v2.location-ni-vs-de-1.feedback.0"
          },
          {
            "id": "location-ni-vs-de-1-option-1",
            "textKey": "grammar.v2.location-ni-vs-de-1.option.1",
            "feedbackKey": "grammar.v2.location-ni-vs-de-1.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.location-ni-vs-de-1.option.0",
          "grammar.v2.location-ni-vs-de-1.option.1"
        ],
        "answer": 0
      },
      {
        "id": "location-ni-vs-de-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "location-ni-vs-de",
        "conceptId": "location-ni-vs-de",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.location-ni-vs-de-2.prompt",
        "successKey": "grammar.v2.location-ni-vs-de-2.explanation",
        "errorKey": "grammar.v2.location-ni-vs-de-2.explanation",
        "options": [
          {
            "id": "location-ni-vs-de-2-option-0",
            "textKey": "grammar.v2.location-ni-vs-de-2.option.0",
            "feedbackKey": "grammar.v2.location-ni-vs-de-2.feedback.0"
          },
          {
            "id": "location-ni-vs-de-2-option-1",
            "textKey": "grammar.v2.location-ni-vs-de-2.option.1",
            "feedbackKey": "grammar.v2.location-ni-vs-de-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.location-ni-vs-de-2.option.0",
          "grammar.v2.location-ni-vs-de-2.option.1"
        ],
        "answer": 1
      },
      {
        "id": "location-ni-vs-de-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "location-ni-vs-de",
        "conceptId": "location-ni-vs-de",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.location-ni-vs-de-3.prompt",
        "successKey": "grammar.v2.location-ni-vs-de-3.explanation",
        "errorKey": "grammar.v2.location-ni-vs-de-3.explanation",
        "options": [
          {
            "id": "location-ni-vs-de-3-option-0",
            "textKey": "grammar.v2.location-ni-vs-de-3.option.0",
            "feedbackKey": "grammar.v2.location-ni-vs-de-3.feedback.0"
          },
          {
            "id": "location-ni-vs-de-3-option-1",
            "textKey": "grammar.v2.location-ni-vs-de-3.option.1",
            "feedbackKey": "grammar.v2.location-ni-vs-de-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.location-ni-vs-de-3.option.0",
          "grammar.v2.location-ni-vs-de-3.option.1"
        ],
        "answer": 0
      },
      {
        "id": "location-ni-vs-de-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "location-ni-vs-de",
        "conceptId": "location-ni-vs-de",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.location-ni-vs-de-4.prompt",
        "successKey": "grammar.v2.location-ni-vs-de-4.explanation",
        "errorKey": "grammar.v2.location-ni-vs-de-4.explanation",
        "options": [
          {
            "id": "location-ni-vs-de-4-option-0",
            "textKey": "grammar.v2.location-ni-vs-de-4.option.0",
            "feedbackKey": "grammar.v2.location-ni-vs-de-4.feedback.0"
          },
          {
            "id": "location-ni-vs-de-4-option-1",
            "textKey": "grammar.v2.location-ni-vs-de-4.option.1",
            "feedbackKey": "grammar.v2.location-ni-vs-de-4.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.location-ni-vs-de-4.option.0",
          "grammar.v2.location-ni-vs-de-4.option.1"
        ],
        "answer": 1
      },
      {
        "id": "location-ni-vs-de-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "location-ni-vs-de",
        "conceptId": "location-ni-vs-de",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.location-ni-vs-de-5.prompt",
        "successKey": "grammar.v2.location-ni-vs-de-5.explanation",
        "errorKey": "grammar.v2.location-ni-vs-de-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.location-ni-vs-de-5.left.0",
            "rightKey": "grammar.v2.location-ni-vs-de-5.right.0"
          },
          {
            "leftKey": "grammar.v2.location-ni-vs-de-5.left.1",
            "rightKey": "grammar.v2.location-ni-vs-de-5.right.1"
          }
        ]
      }
    ]
  },
  {
    "id": "position-words",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 11,
    "titleKey": "grammar.v2.position-words.title",
    "summaryKey": "grammar.v2.position-words.summary",
    "goalKey": "grammar.v2.position-words.goal",
    "prerequisiteIds": [
      "location-ni-vs-de",
      "particle-no-noun-link"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.position-words.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "机の上に本がある。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "家の前に猫がいる。"
        }
      ],
      "examples": [
        {
          "japanese": "机の上",
          "reading": "つくえのうえ",
          "meaningKey": "grammar.v2.position-words.example.0"
        },
        {
          "japanese": "いすの下",
          "reading": "いすのした",
          "meaningKey": "grammar.v2.position-words.example.1"
        },
        {
          "japanese": "箱の中",
          "reading": "はこのなか",
          "meaningKey": "grammar.v2.position-words.example.2"
        },
        {
          "japanese": "家の前",
          "reading": "いえのまえ",
          "meaningKey": "grammar.v2.position-words.example.3"
        },
        {
          "japanese": "学校の隣",
          "reading": "がっこうのとなり",
          "meaningKey": "grammar.v2.position-words.example.4"
        },
        {
          "japanese": "家の後ろ",
          "reading": "いえのうしろ",
          "meaningKey": "grammar.v2.position-words.example.5"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.position-words.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.position-words.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "position-words-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "position-words",
        "conceptId": "position-words",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.position-words-1.prompt",
        "successKey": "grammar.v2.position-words-1.explanation",
        "errorKey": "grammar.v2.position-words-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.position-words-1.left.0",
            "rightKey": "grammar.v2.position-words-1.right.0"
          },
          {
            "leftKey": "grammar.v2.position-words-1.left.1",
            "rightKey": "grammar.v2.position-words-1.right.1"
          },
          {
            "leftKey": "grammar.v2.position-words-1.left.2",
            "rightKey": "grammar.v2.position-words-1.right.2"
          },
          {
            "leftKey": "grammar.v2.position-words-1.left.3",
            "rightKey": "grammar.v2.position-words-1.right.3"
          },
          {
            "leftKey": "grammar.v2.position-words-1.left.4",
            "rightKey": "grammar.v2.position-words-1.right.4"
          },
          {
            "leftKey": "grammar.v2.position-words-1.left.5",
            "rightKey": "grammar.v2.position-words-1.right.5"
          }
        ]
      },
      {
        "id": "position-words-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "position-words",
        "conceptId": "position-words",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.position-words-2.prompt",
        "successKey": "grammar.v2.position-words-2.explanation",
        "errorKey": "grammar.v2.position-words-2.explanation",
        "acceptedAnswers": [
          "の"
        ],
        "solutionKey": "grammar.v2.position-words-2.solution",
        "kanaBank": [
          "ん",
          "を",
          "れ",
          "ら",
          "る",
          "の"
        ]
      },
      {
        "id": "position-words-3",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "position-words",
        "conceptId": "position-words",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.position-words-3.prompt",
        "successKey": "grammar.v2.position-words-3.explanation",
        "errorKey": "grammar.v2.position-words-3.explanation",
        "tokenKeys": [
          "grammar.v2.position-words-3.token.0",
          "grammar.v2.position-words-3.token.1",
          "grammar.v2.position-words-3.token.2",
          "grammar.v2.position-words-3.token.3",
          "grammar.v2.position-words-3.token.4"
        ],
        "solution": [
          2,
          4,
          3,
          1,
          0
        ],
        "orderPolicy": "constrained"
      }
    ]
  },
  {
    "id": "question-words-basic",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 12,
    "titleKey": "grammar.v2.question-words-basic.title",
    "summaryKey": "grammar.v2.question-words-basic.summary",
    "goalKey": "grammar.v2.question-words-basic.goal",
    "prerequisiteIds": [
      "demonstratives-ko-so-a-do",
      "verb-role-dictionary"
    ],
    "relatedIds": [
      "question-words-ka-mo",
      "calendar-dates",
      "question-ka"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.question-words-basic.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "誰が来る？"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "どこに行く？"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "何を食べる？"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "いつ行く？"
        }
      ],
      "examples": [
        {
          "japanese": "誰が来る？",
          "reading": "だれがくる？",
          "meaningKey": "grammar.v2.question-words-basic.example.0"
        },
        {
          "japanese": "どこに行く？",
          "reading": "どこにいく？",
          "meaningKey": "grammar.v2.question-words-basic.example.1"
        },
        {
          "japanese": "何を食べる？",
          "reading": "なにをたべる？",
          "meaningKey": "grammar.v2.question-words-basic.example.2"
        },
        {
          "japanese": "いつ行く？",
          "reading": "いついく？",
          "meaningKey": "grammar.v2.question-words-basic.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.question-words-basic.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.question-words-basic.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.questions.caption",
          "headerKeys": [
            "grammar.v2.location.questions.header.0",
            "grammar.v2.location.questions.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.questions.row.0",
              "cells": [
                "誰",
                "—"
              ]
            },
            {
              "labelKey": "grammar.v2.location.questions.row.1",
              "cells": [
                "何",
                "—"
              ]
            },
            {
              "labelKey": "grammar.v2.location.questions.row.2",
              "cells": [
                "どこ",
                "—"
              ]
            },
            {
              "labelKey": "grammar.v2.location.questions.row.3",
              "cells": [
                "いつ",
                "—"
              ]
            },
            {
              "labelKey": "grammar.v2.location.questions.row.4",
              "cells": [
                "どれ",
                "どの本"
              ]
            },
            {
              "labelKey": "grammar.v2.location.questions.row.5",
              "cells": [
                "—",
                "どんな本"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "question-words-basic-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "question-words-basic",
        "conceptId": "question-words-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.question-words-basic-1.prompt",
        "successKey": "grammar.v2.question-words-basic-1.explanation",
        "errorKey": "grammar.v2.question-words-basic-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.question-words-basic-1.left.0",
            "rightKey": "grammar.v2.question-words-basic-1.right.0"
          },
          {
            "leftKey": "grammar.v2.question-words-basic-1.left.1",
            "rightKey": "grammar.v2.question-words-basic-1.right.1"
          },
          {
            "leftKey": "grammar.v2.question-words-basic-1.left.2",
            "rightKey": "grammar.v2.question-words-basic-1.right.2"
          },
          {
            "leftKey": "grammar.v2.question-words-basic-1.left.3",
            "rightKey": "grammar.v2.question-words-basic-1.right.3"
          }
        ]
      },
      {
        "id": "question-words-basic-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "question-words-basic",
        "conceptId": "question-words-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.question-words-basic-2.prompt",
        "successKey": "grammar.v2.question-words-basic-2.explanation",
        "errorKey": "grammar.v2.question-words-basic-2.explanation",
        "acceptedAnswers": [
          "誰"
        ],
        "solutionKey": "grammar.v2.question-words-basic-2.solution",
        "kanaBank": [
          "た",
          "す",
          "じ",
          "で",
          "だ",
          "誰"
        ]
      },
      {
        "id": "question-words-basic-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "question-words-basic",
        "conceptId": "question-words-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.question-words-basic-3.prompt",
        "successKey": "grammar.v2.question-words-basic-3.explanation",
        "errorKey": "grammar.v2.question-words-basic-3.explanation",
        "options": [
          {
            "id": "question-words-basic-3-option-0",
            "textKey": "grammar.v2.question-words-basic-3.option.0",
            "feedbackKey": "grammar.v2.question-words-basic-3.feedback.0"
          },
          {
            "id": "question-words-basic-3-option-1",
            "textKey": "grammar.v2.question-words-basic-3.option.1",
            "feedbackKey": "grammar.v2.question-words-basic-3.feedback.1"
          },
          {
            "id": "question-words-basic-3-option-2",
            "textKey": "grammar.v2.question-words-basic-3.option.2",
            "feedbackKey": "grammar.v2.question-words-basic-3.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.question-words-basic-3.option.0",
          "grammar.v2.question-words-basic-3.option.1",
          "grammar.v2.question-words-basic-3.option.2"
        ],
        "answer": 0
      },
      {
        "id": "question-words-basic-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "question-words-basic",
        "conceptId": "question-words-basic",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.question-words-basic-4.prompt",
        "successKey": "grammar.v2.question-words-basic-4.explanation",
        "errorKey": "grammar.v2.question-words-basic-4.explanation",
        "options": [
          {
            "id": "question-words-basic-4-option-0",
            "textKey": "grammar.v2.question-words-basic-4.option.0",
            "feedbackKey": "grammar.v2.question-words-basic-4.feedback.0"
          },
          {
            "id": "question-words-basic-4-option-1",
            "textKey": "grammar.v2.question-words-basic-4.option.1",
            "feedbackKey": "grammar.v2.question-words-basic-4.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.question-words-basic-4.option.0",
          "grammar.v2.question-words-basic-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "question-words-ka-mo",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 13,
    "titleKey": "grammar.v2.question-words-ka-mo.title",
    "summaryKey": "grammar.v2.question-words-ka-mo.summary",
    "goalKey": "grammar.v2.question-words-ka-mo.goal",
    "prerequisiteIds": [
      "question-words-basic",
      "existence-aru-iru",
      "verb-negative-plain"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.question-words-ka-mo.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "何かある？ / 何もない。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "誰かいる？ / 誰もいない。"
        }
      ],
      "examples": [
        {
          "japanese": "何かある？",
          "reading": "なにかある？",
          "meaningKey": "grammar.v2.question-words-ka-mo.example.0"
        },
        {
          "japanese": "何もない。",
          "reading": "なにもない。",
          "meaningKey": "grammar.v2.question-words-ka-mo.example.1"
        },
        {
          "japanese": "誰かいる？",
          "reading": "だれかいる？",
          "meaningKey": "grammar.v2.question-words-ka-mo.example.2"
        },
        {
          "japanese": "誰もいない。",
          "reading": "だれもいない。",
          "meaningKey": "grammar.v2.question-words-ka-mo.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.question-words-ka-mo.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.question-words-ka-mo.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.indefinite.caption",
          "headerKeys": [
            "grammar.v2.location.indefinite.header.0",
            "grammar.v2.location.indefinite.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.indefinite.row.0",
              "cells": [
                "何かある",
                "何もない"
              ]
            },
            {
              "labelKey": "grammar.v2.location.indefinite.row.1",
              "cells": [
                "誰かいる",
                "誰もいない"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "question-words-ka-mo-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "question-words-ka-mo",
        "conceptId": "question-words-ka-mo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.question-words-ka-mo-1.prompt",
        "successKey": "grammar.v2.question-words-ka-mo-1.explanation",
        "errorKey": "grammar.v2.question-words-ka-mo-1.explanation",
        "acceptedAnswers": [
          "か"
        ],
        "solutionKey": "grammar.v2.question-words-ka-mo-1.solution",
        "kanaBank": [
          "ゃ",
          "も",
          "れ",
          "ら",
          "る",
          "か"
        ]
      },
      {
        "id": "question-words-ka-mo-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "question-words-ka-mo",
        "conceptId": "question-words-ka-mo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.question-words-ka-mo-2.prompt",
        "successKey": "grammar.v2.question-words-ka-mo-2.explanation",
        "errorKey": "grammar.v2.question-words-ka-mo-2.explanation",
        "options": [
          {
            "id": "question-words-ka-mo-2-option-0",
            "textKey": "grammar.v2.question-words-ka-mo-2.option.0",
            "feedbackKey": "grammar.v2.question-words-ka-mo-2.feedback.0"
          },
          {
            "id": "question-words-ka-mo-2-option-1",
            "textKey": "grammar.v2.question-words-ka-mo-2.option.1",
            "feedbackKey": "grammar.v2.question-words-ka-mo-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.question-words-ka-mo-2.option.0",
          "grammar.v2.question-words-ka-mo-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "question-words-ka-mo-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "question-words-ka-mo",
        "conceptId": "question-words-ka-mo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.question-words-ka-mo-3.prompt",
        "successKey": "grammar.v2.question-words-ka-mo-3.explanation",
        "errorKey": "grammar.v2.question-words-ka-mo-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.question-words-ka-mo-3.left.0",
            "rightKey": "grammar.v2.question-words-ka-mo-3.right.0"
          },
          {
            "leftKey": "grammar.v2.question-words-ka-mo-3.left.1",
            "rightKey": "grammar.v2.question-words-ka-mo-3.right.1"
          },
          {
            "leftKey": "grammar.v2.question-words-ka-mo-3.left.2",
            "rightKey": "grammar.v2.question-words-ka-mo-3.right.2"
          },
          {
            "leftKey": "grammar.v2.question-words-ka-mo-3.left.3",
            "rightKey": "grammar.v2.question-words-ka-mo-3.right.3"
          }
        ]
      },
      {
        "id": "question-words-ka-mo-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "question-words-ka-mo",
        "conceptId": "question-words-ka-mo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.question-words-ka-mo-4.prompt",
        "successKey": "grammar.v2.question-words-ka-mo-4.explanation",
        "errorKey": "grammar.v2.question-words-ka-mo-4.explanation",
        "options": [
          {
            "id": "question-words-ka-mo-4-option-0",
            "textKey": "grammar.v2.question-words-ka-mo-4.option.0",
            "feedbackKey": "grammar.v2.question-words-ka-mo-4.feedback.0"
          },
          {
            "id": "question-words-ka-mo-4-option-1",
            "textKey": "grammar.v2.question-words-ka-mo-4.option.1",
            "feedbackKey": "grammar.v2.question-words-ka-mo-4.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.question-words-ka-mo-4.option.0",
          "grammar.v2.question-words-ka-mo-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "basic-counters",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 14,
    "titleKey": "grammar.v2.basic-counters.title",
    "summaryKey": "grammar.v2.basic-counters.summary",
    "goalKey": "grammar.v2.basic-counters.goal",
    "prerequisiteIds": [
      "existence-aru-iru"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.basic-counters.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "りんごが三つある。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "人が二人いる。"
        }
      ],
      "examples": [
        {
          "japanese": "りんごが三つある。",
          "reading": "りんごがみっつある。",
          "meaningKey": "grammar.v2.basic-counters.example.0"
        },
        {
          "japanese": "紙が二枚ある。",
          "reading": "かみがにまいある。",
          "meaningKey": "grammar.v2.basic-counters.example.1"
        },
        {
          "japanese": "鉛筆が一本ある。",
          "reading": "えんぴつがいっぽんある。",
          "meaningKey": "grammar.v2.basic-counters.example.2"
        },
        {
          "japanese": "人が二人いる。",
          "reading": "ひとがふたりいる。",
          "meaningKey": "grammar.v2.basic-counters.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.basic-counters.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.basic-counters.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.counters.caption",
          "headerKeys": [
            "grammar.v2.location.counters.header.0",
            "grammar.v2.location.counters.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.counters.row.0",
              "cells": [
                "一人",
                "ひとり"
              ]
            },
            {
              "labelKey": "grammar.v2.location.counters.row.1",
              "cells": [
                "二人",
                "ふたり"
              ]
            },
            {
              "labelKey": "grammar.v2.location.counters.row.2",
              "cells": [
                "一本",
                "いっぽん"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "basic-counters-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "basic-counters",
        "conceptId": "basic-counters",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.basic-counters-1.prompt",
        "successKey": "grammar.v2.basic-counters-1.explanation",
        "errorKey": "grammar.v2.basic-counters-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.basic-counters-1.left.0",
            "rightKey": "grammar.v2.basic-counters-1.right.0"
          },
          {
            "leftKey": "grammar.v2.basic-counters-1.left.1",
            "rightKey": "grammar.v2.basic-counters-1.right.1"
          },
          {
            "leftKey": "grammar.v2.basic-counters-1.left.2",
            "rightKey": "grammar.v2.basic-counters-1.right.2"
          },
          {
            "leftKey": "grammar.v2.basic-counters-1.left.3",
            "rightKey": "grammar.v2.basic-counters-1.right.3"
          }
        ]
      },
      {
        "id": "basic-counters-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "basic-counters",
        "conceptId": "basic-counters",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.basic-counters-2.prompt",
        "successKey": "grammar.v2.basic-counters-2.explanation",
        "errorKey": "grammar.v2.basic-counters-2.explanation",
        "acceptedAnswers": [
          "ひとり"
        ],
        "solutionKey": "grammar.v2.basic-counters-2.solution",
        "kanaBank": [
          "が",
          "く",
          "え",
          "と",
          "ひ",
          "り"
        ]
      },
      {
        "id": "basic-counters-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "basic-counters",
        "conceptId": "basic-counters",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.basic-counters-3.prompt",
        "successKey": "grammar.v2.basic-counters-3.explanation",
        "errorKey": "grammar.v2.basic-counters-3.explanation",
        "acceptedAnswers": [
          "ふたり"
        ],
        "solutionKey": "grammar.v2.basic-counters-3.solution",
        "kanaBank": [
          "ん",
          "を",
          "ゃ",
          "り",
          "ふ",
          "た"
        ]
      },
      {
        "id": "basic-counters-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "basic-counters",
        "conceptId": "basic-counters",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.basic-counters-4.prompt",
        "successKey": "grammar.v2.basic-counters-4.explanation",
        "errorKey": "grammar.v2.basic-counters-4.explanation",
        "acceptedAnswers": [
          "いっぽん"
        ],
        "solutionKey": "grammar.v2.basic-counters-4.solution",
        "kanaBank": [
          "を",
          "ん",
          "る",
          "ぽ",
          "っ",
          "い"
        ]
      }
    ]
  },
  {
    "id": "clock-time",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 15,
    "titleKey": "grammar.v2.clock-time.title",
    "summaryKey": "grammar.v2.clock-time.summary",
    "goalKey": "grammar.v2.clock-time.goal",
    "prerequisiteIds": [
      "particle-ni-time"
    ],
    "relatedIds": [
      "duration"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.clock-time.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "今、三時。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "九時半に行く。"
        }
      ],
      "examples": [
        {
          "japanese": "今、三時。",
          "reading": "いま、さんじ。",
          "meaningKey": "grammar.v2.clock-time.example.0"
        },
        {
          "japanese": "七時に起きる。",
          "reading": "しちじにおきる。",
          "meaningKey": "grammar.v2.clock-time.example.1"
        },
        {
          "japanese": "九時半に行く。",
          "reading": "くじはんにいく。",
          "meaningKey": "grammar.v2.clock-time.example.2"
        },
        {
          "japanese": "三十分",
          "reading": "さんじゅっぷん",
          "meaningKey": "grammar.v2.clock-time.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.clock-time.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.clock-time.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.clock.caption",
          "headerKeys": [
            "grammar.v2.location.clock.header.0",
            "grammar.v2.location.clock.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.clock.row.0",
              "cells": [
                "四時",
                "よじ"
              ]
            },
            {
              "labelKey": "grammar.v2.location.clock.row.1",
              "cells": [
                "七時",
                "しちじ"
              ]
            },
            {
              "labelKey": "grammar.v2.location.clock.row.2",
              "cells": [
                "九時",
                "くじ"
              ]
            },
            {
              "labelKey": "grammar.v2.location.clock.row.3",
              "cells": [
                "何時",
                "なんじ"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "clock-time-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "clock-time",
        "conceptId": "clock-time",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.clock-time-1.prompt",
        "successKey": "grammar.v2.clock-time-1.explanation",
        "errorKey": "grammar.v2.clock-time-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.clock-time-1.left.0",
            "rightKey": "grammar.v2.clock-time-1.right.0"
          },
          {
            "leftKey": "grammar.v2.clock-time-1.left.1",
            "rightKey": "grammar.v2.clock-time-1.right.1"
          },
          {
            "leftKey": "grammar.v2.clock-time-1.left.2",
            "rightKey": "grammar.v2.clock-time-1.right.2"
          }
        ]
      },
      {
        "id": "clock-time-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "clock-time",
        "conceptId": "clock-time",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.clock-time-2.prompt",
        "successKey": "grammar.v2.clock-time-2.explanation",
        "errorKey": "grammar.v2.clock-time-2.explanation",
        "options": [
          {
            "id": "clock-time-2-option-0",
            "textKey": "grammar.v2.clock-time-2.option.0",
            "feedbackKey": "grammar.v2.clock-time-2.feedback.0"
          },
          {
            "id": "clock-time-2-option-1",
            "textKey": "grammar.v2.clock-time-2.option.1",
            "feedbackKey": "grammar.v2.clock-time-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.clock-time-2.option.0",
          "grammar.v2.clock-time-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "clock-time-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "clock-time",
        "conceptId": "clock-time",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.clock-time-3.prompt",
        "successKey": "grammar.v2.clock-time-3.explanation",
        "errorKey": "grammar.v2.clock-time-3.explanation",
        "acceptedAnswers": [
          "なんじ"
        ],
        "solutionKey": "grammar.v2.clock-time-3.solution",
        "kanaBank": [
          "ん",
          "を",
          "や",
          "ゃ",
          "な",
          "じ"
        ]
      },
      {
        "id": "clock-time-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "clock-time",
        "conceptId": "clock-time",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.clock-time-4.prompt",
        "successKey": "grammar.v2.clock-time-4.explanation",
        "errorKey": "grammar.v2.clock-time-4.explanation",
        "acceptedAnswers": [
          "に"
        ],
        "solutionKey": "grammar.v2.clock-time-4.solution",
        "kanaBank": [
          "を",
          "ん",
          "や",
          "も",
          "ゃ",
          "に"
        ]
      }
    ]
  },
  {
    "id": "calendar-dates",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 16,
    "titleKey": "grammar.v2.calendar-dates.title",
    "summaryKey": "grammar.v2.calendar-dates.summary",
    "goalKey": "grammar.v2.calendar-dates.goal",
    "prerequisiteIds": [
      "particle-ni-time",
      "question-words-basic"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.calendar-dates.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "五月三日に帰る。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "明日行く。"
        }
      ],
      "examples": [
        {
          "japanese": "五月三日に帰る。",
          "reading": "ごがつみっかにかえる。",
          "meaningKey": "grammar.v2.calendar-dates.example.0"
        },
        {
          "japanese": "月曜日に行く。",
          "reading": "げつようびにいく。",
          "meaningKey": "grammar.v2.calendar-dates.example.1"
        },
        {
          "japanese": "今日 / 明日 / 昨日",
          "reading": "きょう / あした / きのう",
          "meaningKey": "grammar.v2.calendar-dates.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.calendar-dates.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.calendar-dates.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.dates.caption",
          "headerKeys": [
            "grammar.v2.location.dates.header.0",
            "grammar.v2.location.dates.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.dates.row.0",
              "cells": [
                "一日",
                "ついたち"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.1",
              "cells": [
                "二日",
                "ふつか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.2",
              "cells": [
                "三日",
                "みっか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.3",
              "cells": [
                "四日",
                "よっか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.4",
              "cells": [
                "五日",
                "いつか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.5",
              "cells": [
                "六日",
                "むいか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.6",
              "cells": [
                "七日",
                "なのか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.7",
              "cells": [
                "八日",
                "ようか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.8",
              "cells": [
                "九日",
                "ここのか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.9",
              "cells": [
                "十日",
                "とおか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.10",
              "cells": [
                "十四日",
                "じゅうよっか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.11",
              "cells": [
                "二十日",
                "はつか"
              ]
            },
            {
              "labelKey": "grammar.v2.location.dates.row.12",
              "cells": [
                "二十四日",
                "にじゅうよっか"
              ]
            }
          ]
        },
        {
          "captionKey": "grammar.v2.location.weekdays.caption",
          "headerKeys": [
            "grammar.v2.location.weekdays.header.0",
            "grammar.v2.location.weekdays.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.weekdays.row.0",
              "cells": [
                "月曜日",
                "げつようび"
              ]
            },
            {
              "labelKey": "grammar.v2.location.weekdays.row.1",
              "cells": [
                "火曜日",
                "かようび"
              ]
            },
            {
              "labelKey": "grammar.v2.location.weekdays.row.2",
              "cells": [
                "水曜日",
                "すいようび"
              ]
            },
            {
              "labelKey": "grammar.v2.location.weekdays.row.3",
              "cells": [
                "木曜日",
                "もくようび"
              ]
            },
            {
              "labelKey": "grammar.v2.location.weekdays.row.4",
              "cells": [
                "金曜日",
                "きんようび"
              ]
            },
            {
              "labelKey": "grammar.v2.location.weekdays.row.5",
              "cells": [
                "土曜日",
                "どようび"
              ]
            },
            {
              "labelKey": "grammar.v2.location.weekdays.row.6",
              "cells": [
                "日曜日",
                "にちようび"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "calendar-dates-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "calendar-dates",
        "conceptId": "calendar-dates",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.calendar-dates-1.prompt",
        "successKey": "grammar.v2.calendar-dates-1.explanation",
        "errorKey": "grammar.v2.calendar-dates-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.calendar-dates-1.left.0",
            "rightKey": "grammar.v2.calendar-dates-1.right.0"
          },
          {
            "leftKey": "grammar.v2.calendar-dates-1.left.1",
            "rightKey": "grammar.v2.calendar-dates-1.right.1"
          },
          {
            "leftKey": "grammar.v2.calendar-dates-1.left.2",
            "rightKey": "grammar.v2.calendar-dates-1.right.2"
          }
        ]
      },
      {
        "id": "calendar-dates-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "calendar-dates",
        "conceptId": "calendar-dates",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.calendar-dates-2.prompt",
        "successKey": "grammar.v2.calendar-dates-2.explanation",
        "errorKey": "grammar.v2.calendar-dates-2.explanation",
        "options": [
          {
            "id": "calendar-dates-2-option-0",
            "textKey": "grammar.v2.calendar-dates-2.option.0",
            "feedbackKey": "grammar.v2.calendar-dates-2.feedback.0"
          },
          {
            "id": "calendar-dates-2-option-1",
            "textKey": "grammar.v2.calendar-dates-2.option.1",
            "feedbackKey": "grammar.v2.calendar-dates-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.calendar-dates-2.option.0",
          "grammar.v2.calendar-dates-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "calendar-dates-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "calendar-dates",
        "conceptId": "calendar-dates",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.calendar-dates-3.prompt",
        "successKey": "grammar.v2.calendar-dates-3.explanation",
        "errorKey": "grammar.v2.calendar-dates-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.calendar-dates-3.left.0",
            "rightKey": "grammar.v2.calendar-dates-3.right.0"
          },
          {
            "leftKey": "grammar.v2.calendar-dates-3.left.1",
            "rightKey": "grammar.v2.calendar-dates-3.right.1"
          },
          {
            "leftKey": "grammar.v2.calendar-dates-3.left.2",
            "rightKey": "grammar.v2.calendar-dates-3.right.2"
          },
          {
            "leftKey": "grammar.v2.calendar-dates-3.left.3",
            "rightKey": "grammar.v2.calendar-dates-3.right.3"
          }
        ]
      },
      {
        "id": "calendar-dates-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "calendar-dates",
        "conceptId": "calendar-dates",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.calendar-dates-4.prompt",
        "successKey": "grammar.v2.calendar-dates-4.explanation",
        "errorKey": "grammar.v2.calendar-dates-4.explanation",
        "options": [
          {
            "id": "calendar-dates-4-option-0",
            "textKey": "grammar.v2.calendar-dates-4.option.0",
            "feedbackKey": "grammar.v2.calendar-dates-4.feedback.0"
          },
          {
            "id": "calendar-dates-4-option-1",
            "textKey": "grammar.v2.calendar-dates-4.option.1",
            "feedbackKey": "grammar.v2.calendar-dates-4.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.calendar-dates-4.option.0",
          "grammar.v2.calendar-dates-4.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "duration",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 17,
    "titleKey": "grammar.v2.duration.title",
    "summaryKey": "grammar.v2.duration.summary",
    "goalKey": "grammar.v2.duration.goal",
    "prerequisiteIds": [
      "clock-time"
    ],
    "relatedIds": [
      "duration-gurai"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.duration.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "二時に勉強する。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "二時間勉強する。"
        }
      ],
      "examples": [
        {
          "japanese": "二時に勉強する。",
          "reading": "にじにべんきょうする。",
          "meaningKey": "grammar.v2.duration.example.0"
        },
        {
          "japanese": "二時間勉強する。",
          "reading": "にじかんべんきょうする。",
          "meaningKey": "grammar.v2.duration.example.1"
        },
        {
          "japanese": "三十分読む。",
          "reading": "さんじゅっぷんよむ。",
          "meaningKey": "grammar.v2.duration.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.duration.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.duration.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.location.duration.caption",
          "headerKeys": [
            "grammar.v2.location.duration.header.0",
            "grammar.v2.location.duration.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.location.duration.row.0",
              "cells": [
                "二時",
                "二時に勉強する"
              ]
            },
            {
              "labelKey": "grammar.v2.location.duration.row.1",
              "cells": [
                "二時間",
                "二時間勉強する"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "duration-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "duration",
        "conceptId": "duration",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.duration-1.prompt",
        "successKey": "grammar.v2.duration-1.explanation",
        "errorKey": "grammar.v2.duration-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.duration-1.left.0",
            "rightKey": "grammar.v2.duration-1.right.0"
          },
          {
            "leftKey": "grammar.v2.duration-1.left.1",
            "rightKey": "grammar.v2.duration-1.right.1"
          }
        ]
      },
      {
        "id": "duration-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "duration",
        "conceptId": "duration",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.duration-2.prompt",
        "successKey": "grammar.v2.duration-2.explanation",
        "errorKey": "grammar.v2.duration-2.explanation",
        "options": [
          {
            "id": "duration-2-option-0",
            "textKey": "grammar.v2.duration-2.option.0",
            "feedbackKey": "grammar.v2.duration-2.feedback.0"
          },
          {
            "id": "duration-2-option-1",
            "textKey": "grammar.v2.duration-2.option.1",
            "feedbackKey": "grammar.v2.duration-2.feedback.1"
          },
          {
            "id": "duration-2-option-2",
            "textKey": "grammar.v2.duration-2.option.2",
            "feedbackKey": "grammar.v2.duration-2.feedback.2"
          }
        ],
        "optionKeys": [
          "grammar.v2.duration-2.option.0",
          "grammar.v2.duration-2.option.1",
          "grammar.v2.duration-2.option.2"
        ],
        "answer": 0
      },
      {
        "id": "duration-3",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "duration",
        "conceptId": "duration",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.duration-3.prompt",
        "successKey": "grammar.v2.duration-3.explanation",
        "errorKey": "grammar.v2.duration-3.explanation",
        "tokenKeys": [
          "grammar.v2.duration-3.token.0",
          "grammar.v2.duration-3.token.1"
        ],
        "solution": [
          1,
          0
        ],
        "orderPolicy": "constrained"
      }
    ]
  },
  {
    "id": "duration-gurai",
    "level": "N5",
    "track": "core",
    "topicId": "04",
    "order": 18,
    "titleKey": "grammar.v2.duration-gurai.title",
    "summaryKey": "grammar.v2.duration-gurai.summary",
    "goalKey": "grammar.v2.duration-gurai.goal",
    "prerequisiteIds": [
      "duration"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.duration-gurai.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "二時間ぐらい勉強する。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "三十分くらい読む。"
        }
      ],
      "examples": [
        {
          "japanese": "二時間ぐらい勉強する。",
          "reading": "にじかんぐらいべんきょうする。",
          "meaningKey": "grammar.v2.duration-gurai.example.0"
        },
        {
          "japanese": "三十分くらい読む。",
          "reading": "さんじゅっぷんくらいよむ。",
          "meaningKey": "grammar.v2.duration-gurai.example.1"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.duration-gurai.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.duration-gurai.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "duration-gurai-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "duration-gurai",
        "conceptId": "duration-gurai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.duration-gurai-1.prompt",
        "successKey": "grammar.v2.duration-gurai-1.explanation",
        "errorKey": "grammar.v2.duration-gurai-1.explanation",
        "acceptedAnswers": [
          "くらい",
          "ぐらい"
        ],
        "solutionKey": "grammar.v2.duration-gurai-1.solution",
        "kanaBank": [
          "ま",
          "へ",
          "ぐ",
          "く",
          "い",
          "ら"
        ]
      },
      {
        "id": "duration-gurai-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "04",
        "lessonId": "duration-gurai",
        "conceptId": "duration-gurai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.duration-gurai-2.prompt",
        "successKey": "grammar.v2.duration-gurai-2.explanation",
        "errorKey": "grammar.v2.duration-gurai-2.explanation",
        "options": [
          {
            "id": "duration-gurai-2-option-0",
            "textKey": "grammar.v2.duration-gurai-2.option.0",
            "feedbackKey": "grammar.v2.duration-gurai-2.feedback.0"
          },
          {
            "id": "duration-gurai-2-option-1",
            "textKey": "grammar.v2.duration-gurai-2.option.1",
            "feedbackKey": "grammar.v2.duration-gurai-2.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.duration-gurai-2.option.0",
          "grammar.v2.duration-gurai-2.option.1"
        ],
        "answer": 0
      },
      {
        "id": "duration-gurai-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "04",
        "lessonId": "duration-gurai",
        "conceptId": "duration-gurai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic04",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.duration-gurai-3.prompt",
        "successKey": "grammar.v2.duration-gurai-3.explanation",
        "errorKey": "grammar.v2.duration-gurai-3.explanation",
        "options": [
          {
            "id": "duration-gurai-3-option-0",
            "textKey": "grammar.v2.duration-gurai-3.option.0",
            "feedbackKey": "grammar.v2.duration-gurai-3.feedback.0"
          },
          {
            "id": "duration-gurai-3-option-1",
            "textKey": "grammar.v2.duration-gurai-3.option.1",
            "feedbackKey": "grammar.v2.duration-gurai-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.duration-gurai-3.option.0",
          "grammar.v2.duration-gurai-3.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "verb-stem",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 1,
    "titleKey": "grammar.v2.verb-stem.title",
    "summaryKey": "grammar.v2.verb-stem.summary",
    "goalKey": "grammar.v2.verb-stem.goal",
    "prerequisiteIds": [
      "verb-ichidan",
      "verb-godan",
      "verb-irregular-suru-kuru"
    ],
    "relatedIds": [
      "motion-purpose-ni-iku",
      "polite-verb-masu-system"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.verb-stem.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べる → 食べ"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "飲む → 飲み"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "する → し"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "来る → き"
        }
      ],
      "examples": [
        {
          "japanese": "食べる → 食べ",
          "reading": "たべる → たべ",
          "meaningKey": "grammar.v2.verb-stem.example.0"
        },
        {
          "japanese": "飲む → 飲み",
          "reading": "のむ → のみ",
          "meaningKey": "grammar.v2.verb-stem.example.1"
        },
        {
          "japanese": "する → し",
          "reading": "する → し",
          "meaningKey": "grammar.v2.verb-stem.example.2"
        },
        {
          "japanese": "来る → き",
          "reading": "くる → き",
          "meaningKey": "grammar.v2.verb-stem.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.verb-stem.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.verb-stem.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.polite.stems.caption",
          "headerKeys": [
            "grammar.v2.polite.stems.header.0",
            "grammar.v2.polite.stems.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.stems.row.0",
              "cells": [
                "食べる",
                "食べ"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.1",
              "cells": [
                "見る",
                "見"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.2",
              "cells": [
                "起きる",
                "起き"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.3",
              "cells": [
                "買う",
                "買い"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.4",
              "cells": [
                "書く",
                "書き"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.5",
              "cells": [
                "泳ぐ",
                "泳ぎ"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.6",
              "cells": [
                "話す",
                "話し"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.7",
              "cells": [
                "待つ",
                "待ち"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.8",
              "cells": [
                "死ぬ",
                "死に"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.9",
              "cells": [
                "遊ぶ",
                "遊び"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.10",
              "cells": [
                "飲む",
                "飲み"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.11",
              "cells": [
                "帰る",
                "帰り"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.12",
              "cells": [
                "する",
                "し"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.stems.row.13",
              "cells": [
                "来る",
                "き"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "verb-stem-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "verb-stem",
        "conceptId": "verb-stem",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-stem-1.prompt",
        "successKey": "grammar.v2.verb-stem-1.explanation",
        "errorKey": "grammar.v2.verb-stem-1.explanation",
        "acceptedAnswers": [
          "食べ"
        ],
        "solutionKey": "grammar.v2.verb-stem-1.solution",
        "kanaBank": [
          "べ",
          "食",
          "ら",
          "る",
          "れ",
          "ゃ"
        ]
      },
      {
        "id": "verb-stem-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "verb-stem",
        "conceptId": "verb-stem",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-stem-2.prompt",
        "successKey": "grammar.v2.verb-stem-2.explanation",
        "errorKey": "grammar.v2.verb-stem-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-stem-2.left.0",
            "rightKey": "grammar.v2.verb-stem-2.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-stem-2.left.1",
            "rightKey": "grammar.v2.verb-stem-2.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-stem-2.left.2",
            "rightKey": "grammar.v2.verb-stem-2.right.2"
          }
        ]
      },
      {
        "id": "verb-stem-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "verb-stem",
        "conceptId": "verb-stem",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-stem-3.prompt",
        "successKey": "grammar.v2.verb-stem-3.explanation",
        "errorKey": "grammar.v2.verb-stem-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-stem-3.left.0",
            "rightKey": "grammar.v2.verb-stem-3.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-stem-3.left.1",
            "rightKey": "grammar.v2.verb-stem-3.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-stem-3.left.2",
            "rightKey": "grammar.v2.verb-stem-3.right.2"
          },
          {
            "leftKey": "grammar.v2.verb-stem-3.left.3",
            "rightKey": "grammar.v2.verb-stem-3.right.3"
          },
          {
            "leftKey": "grammar.v2.verb-stem-3.left.4",
            "rightKey": "grammar.v2.verb-stem-3.right.4"
          }
        ]
      },
      {
        "id": "verb-stem-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "verb-stem",
        "conceptId": "verb-stem",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-stem-4.prompt",
        "successKey": "grammar.v2.verb-stem-4.explanation",
        "errorKey": "grammar.v2.verb-stem-4.explanation",
        "acceptedAnswers": [
          "し"
        ],
        "solutionKey": "grammar.v2.verb-stem-4.solution",
        "kanaBank": [
          "ま",
          "へ",
          "で",
          "だ",
          "は",
          "し"
        ]
      },
      {
        "id": "verb-stem-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "verb-stem",
        "conceptId": "verb-stem",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.verb-stem-5.prompt",
        "successKey": "grammar.v2.verb-stem-5.explanation",
        "errorKey": "grammar.v2.verb-stem-5.explanation",
        "acceptedAnswers": [
          "き"
        ],
        "solutionKey": "grammar.v2.verb-stem-5.solution",
        "kanaBank": [
          "を",
          "ん",
          "る",
          "ら",
          "れ",
          "き"
        ]
      },
      {
        "id": "verb-stem-6",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "verb-stem",
        "conceptId": "verb-stem",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.verb-stem-6.prompt",
        "successKey": "grammar.v2.verb-stem-6.explanation",
        "errorKey": "grammar.v2.verb-stem-6.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.verb-stem-6.left.0",
            "rightKey": "grammar.v2.verb-stem-6.right.0"
          },
          {
            "leftKey": "grammar.v2.verb-stem-6.left.1",
            "rightKey": "grammar.v2.verb-stem-6.right.1"
          },
          {
            "leftKey": "grammar.v2.verb-stem-6.left.2",
            "rightKey": "grammar.v2.verb-stem-6.right.2"
          }
        ]
      }
    ]
  },
  {
    "id": "motion-purpose-ni-iku",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 2,
    "titleKey": "grammar.v2.motion-purpose-ni-iku.title",
    "summaryKey": "grammar.v2.motion-purpose-ni-iku.summary",
    "goalKey": "grammar.v2.motion-purpose-ni-iku.goal",
    "prerequisiteIds": [
      "verb-stem",
      "particle-ni-destination",
      "particle-wo-object"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.motion-purpose-ni-iku.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "見る → 見 + に + 行く"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "買う → 買い + に + 行く"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "遊ぶ → 遊び + に + 来る"
        }
      ],
      "examples": [
        {
          "japanese": "映画を見に行く。",
          "reading": "えいがをみにいく。",
          "meaningKey": "grammar.v2.motion-purpose-ni-iku.example.0"
        },
        {
          "japanese": "パンを買いに行く。",
          "reading": "パンをかいにいく。",
          "meaningKey": "grammar.v2.motion-purpose-ni-iku.example.1"
        },
        {
          "japanese": "友達が遊びに来る。",
          "reading": "ともだちがあそびにくる。",
          "meaningKey": "grammar.v2.motion-purpose-ni-iku.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.motion-purpose-ni-iku.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.motion-purpose-ni-iku.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "motion-purpose-ni-iku-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "motion-purpose-ni-iku",
        "conceptId": "motion-purpose-ni-iku",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.motion-purpose-ni-iku-1.prompt",
        "successKey": "grammar.v2.motion-purpose-ni-iku-1.explanation",
        "errorKey": "grammar.v2.motion-purpose-ni-iku-1.explanation",
        "acceptedAnswers": [
          "見"
        ],
        "solutionKey": "grammar.v2.motion-purpose-ni-iku-1.solution",
        "kanaBank": [
          "し",
          "じ",
          "す",
          "た",
          "い",
          "見"
        ]
      },
      {
        "id": "motion-purpose-ni-iku-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "motion-purpose-ni-iku",
        "conceptId": "motion-purpose-ni-iku",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.motion-purpose-ni-iku-2.prompt",
        "successKey": "grammar.v2.motion-purpose-ni-iku-2.explanation",
        "errorKey": "grammar.v2.motion-purpose-ni-iku-2.explanation",
        "acceptedAnswers": [
          "買い"
        ],
        "solutionKey": "grammar.v2.motion-purpose-ni-iku-2.solution",
        "kanaBank": [
          "た",
          "す",
          "じ",
          "う",
          "い",
          "買"
        ]
      },
      {
        "id": "motion-purpose-ni-iku-3",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "motion-purpose-ni-iku",
        "conceptId": "motion-purpose-ni-iku",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.motion-purpose-ni-iku-3.prompt",
        "successKey": "grammar.v2.motion-purpose-ni-iku-3.explanation",
        "errorKey": "grammar.v2.motion-purpose-ni-iku-3.explanation",
        "tokenKeys": [
          "grammar.v2.motion-purpose-ni-iku-3.token.0",
          "grammar.v2.motion-purpose-ni-iku-3.token.1",
          "grammar.v2.motion-purpose-ni-iku-3.token.2",
          "grammar.v2.motion-purpose-ni-iku-3.token.3"
        ],
        "solution": [
          1,
          3,
          2,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "motion-purpose-ni-iku-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "motion-purpose-ni-iku",
        "conceptId": "motion-purpose-ni-iku",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.motion-purpose-ni-iku-4.prompt",
        "successKey": "grammar.v2.motion-purpose-ni-iku-4.explanation",
        "errorKey": "grammar.v2.motion-purpose-ni-iku-4.explanation",
        "options": [
          {
            "id": "motion-purpose-ni-iku-4-option-0",
            "textKey": "grammar.v2.motion-purpose-ni-iku-4.option.0",
            "feedbackKey": "grammar.v2.motion-purpose-ni-iku-4.feedback.0"
          },
          {
            "id": "motion-purpose-ni-iku-4-option-1",
            "textKey": "grammar.v2.motion-purpose-ni-iku-4.option.1",
            "feedbackKey": "grammar.v2.motion-purpose-ni-iku-4.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.motion-purpose-ni-iku-4.option.0",
          "grammar.v2.motion-purpose-ni-iku-4.option.1"
        ],
        "answer": 0
      },
      {
        "id": "motion-purpose-ni-iku-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "motion-purpose-ni-iku",
        "conceptId": "motion-purpose-ni-iku",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.motion-purpose-ni-iku-5.prompt",
        "successKey": "grammar.v2.motion-purpose-ni-iku-5.explanation",
        "errorKey": "grammar.v2.motion-purpose-ni-iku-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.motion-purpose-ni-iku-5.left.0",
            "rightKey": "grammar.v2.motion-purpose-ni-iku-5.right.0"
          },
          {
            "leftKey": "grammar.v2.motion-purpose-ni-iku-5.left.1",
            "rightKey": "grammar.v2.motion-purpose-ni-iku-5.right.1"
          }
        ]
      }
    ]
  },
  {
    "id": "polite-verb-masu-system",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 3,
    "titleKey": "grammar.v2.polite-verb-masu-system.title",
    "summaryKey": "grammar.v2.polite-verb-masu-system.summary",
    "goalKey": "grammar.v2.polite-verb-masu-system.goal",
    "prerequisiteIds": [
      "verb-stem",
      "verb-negative-plain",
      "verb-past-plain",
      "verb-past-negative-plain"
    ],
    "relatedIds": [
      "question-ka",
      "plain-vs-polite",
      "te-kudasai"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.polite-verb-masu-system.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べ + ます / ません / ました / ませんでした"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "飲み + ます / ません / ました / ませんでした"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "し + ます / ません / ました / ませんでした"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "き + ます / ません / ました / ませんでした"
        }
      ],
      "examples": [
        {
          "japanese": "食べます。",
          "reading": "たべます。",
          "meaningKey": "grammar.v2.polite-verb-masu-system.example.0"
        },
        {
          "japanese": "飲みませんでした。",
          "reading": "のみませんでした。",
          "meaningKey": "grammar.v2.polite-verb-masu-system.example.1"
        },
        {
          "japanese": "します。",
          "reading": "します。",
          "meaningKey": "grammar.v2.polite-verb-masu-system.example.2"
        },
        {
          "japanese": "きます。",
          "reading": "きます。",
          "meaningKey": "grammar.v2.polite-verb-masu-system.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.polite-verb-masu-system.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.polite-verb-masu-system.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.polite.matrix.caption",
          "headerKeys": [
            "grammar.v2.polite.matrix.header.0",
            "grammar.v2.polite.matrix.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.matrix.row.0",
              "cells": [
                "ます",
                "ました"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.matrix.row.1",
              "cells": [
                "ません",
                "ませんでした"
              ]
            }
          ]
        },
        {
          "captionKey": "grammar.v2.polite.families.caption",
          "headerKeys": [
            "grammar.v2.polite.families.header.0",
            "grammar.v2.polite.families.header.1",
            "grammar.v2.polite.families.header.2",
            "grammar.v2.polite.families.header.3"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.families.row.0",
              "cells": [
                "食べます",
                "飲みます",
                "します",
                "きます"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.families.row.1",
              "cells": [
                "食べません",
                "飲みません",
                "しません",
                "きません"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.families.row.2",
              "cells": [
                "食べました",
                "飲みました",
                "しました",
                "きました"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.families.row.3",
              "cells": [
                "食べませんでした",
                "飲みませんでした",
                "しませんでした",
                "きませんでした"
              ]
            }
          ]
        },
        {
          "captionKey": "grammar.v2.polite.plainDrink.caption",
          "headerKeys": [
            "grammar.v2.polite.plainDrink.header.0",
            "grammar.v2.polite.plainDrink.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.plainDrink.row.0",
              "cells": [
                "飲む",
                "飲みます"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.plainDrink.row.1",
              "cells": [
                "飲まない",
                "飲みません"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.plainDrink.row.2",
              "cells": [
                "飲んだ",
                "飲みました"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.plainDrink.row.3",
              "cells": [
                "飲まなかった",
                "飲みませんでした"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "polite-verb-masu-system-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.polite-verb-masu-system-1.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-1.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.polite-verb-masu-system-1.left.0",
            "rightKey": "grammar.v2.polite-verb-masu-system-1.right.0"
          },
          {
            "leftKey": "grammar.v2.polite-verb-masu-system-1.left.1",
            "rightKey": "grammar.v2.polite-verb-masu-system-1.right.1"
          },
          {
            "leftKey": "grammar.v2.polite-verb-masu-system-1.left.2",
            "rightKey": "grammar.v2.polite-verb-masu-system-1.right.2"
          },
          {
            "leftKey": "grammar.v2.polite-verb-masu-system-1.left.3",
            "rightKey": "grammar.v2.polite-verb-masu-system-1.right.3"
          }
        ]
      },
      {
        "id": "polite-verb-masu-system-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-verb-masu-system-2.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-2.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-2.explanation",
        "acceptedAnswers": [
          "食べます"
        ],
        "solutionKey": "grammar.v2.polite-verb-masu-system-2.solution",
        "kanaBank": [
          "し",
          "じ",
          "す",
          "べ",
          "ま",
          "食"
        ]
      },
      {
        "id": "polite-verb-masu-system-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-verb-masu-system-3.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-3.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-3.explanation",
        "acceptedAnswers": [
          "食べません"
        ],
        "solutionKey": "grammar.v2.polite-verb-masu-system-3.solution",
        "kanaBank": [
          "食",
          "れ",
          "る",
          "ん",
          "せ",
          "ま",
          "べ"
        ]
      },
      {
        "id": "polite-verb-masu-system-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-verb-masu-system-4.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-4.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-4.explanation",
        "acceptedAnswers": [
          "食べました"
        ],
        "solutionKey": "grammar.v2.polite-verb-masu-system-4.solution",
        "kanaBank": [
          "食",
          "や",
          "も",
          "ま",
          "べ",
          "し",
          "た"
        ]
      },
      {
        "id": "polite-verb-masu-system-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-verb-masu-system-5.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-5.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-5.explanation",
        "acceptedAnswers": [
          "食べませんでした"
        ],
        "solutionKey": "grammar.v2.polite-verb-masu-system-5.solution",
        "kanaBank": [
          "と",
          "に",
          "で",
          "べ",
          "ま",
          "ん",
          "食",
          "せ",
          "た",
          "し"
        ]
      },
      {
        "id": "polite-verb-masu-system-6",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.polite-verb-masu-system-6.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-6.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-6.explanation",
        "options": [
          {
            "id": "polite-verb-masu-system-6-option-0",
            "textKey": "grammar.v2.polite-verb-masu-system-6.option.0",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-6.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "polite-verb-masu-system-6-option-1",
            "textKey": "grammar.v2.polite-verb-masu-system-6.option.1",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-6.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "polite-verb-masu-system-6-option-2",
            "textKey": "grammar.v2.polite-verb-masu-system-6.option.2",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-6.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "polite-verb-masu-system-6-option-3",
            "textKey": "grammar.v2.polite-verb-masu-system-6.option.3",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-6.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.polite-verb-masu-system-6.option.0",
          "grammar.v2.polite-verb-masu-system-6.option.1",
          "grammar.v2.polite-verb-masu-system-6.option.2",
          "grammar.v2.polite-verb-masu-system-6.option.3"
        ],
        "answer": 3
      },
      {
        "id": "polite-verb-masu-system-7",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.polite-verb-masu-system-7.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-7.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-7.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.polite-verb-masu-system-7.left.0",
            "rightKey": "grammar.v2.polite-verb-masu-system-7.right.0"
          },
          {
            "leftKey": "grammar.v2.polite-verb-masu-system-7.left.1",
            "rightKey": "grammar.v2.polite-verb-masu-system-7.right.1"
          }
        ]
      },
      {
        "id": "polite-verb-masu-system-8",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-verb-masu-system",
        "conceptId": "polite-verb-masu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.polite-verb-masu-system-8.prompt",
        "successKey": "grammar.v2.polite-verb-masu-system-8.explanation",
        "errorKey": "grammar.v2.polite-verb-masu-system-8.explanation",
        "options": [
          {
            "id": "polite-verb-masu-system-8-option-0",
            "textKey": "grammar.v2.polite-verb-masu-system-8.option.0",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-8.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "polite-verb-masu-system-8-option-1",
            "textKey": "grammar.v2.polite-verb-masu-system-8.option.1",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-8.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "polite-verb-masu-system-8-option-2",
            "textKey": "grammar.v2.polite-verb-masu-system-8.option.2",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-8.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "polite-verb-masu-system-8-option-3",
            "textKey": "grammar.v2.polite-verb-masu-system-8.option.3",
            "feedbackKey": "grammar.v2.polite-verb-masu-system-8.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.polite-verb-masu-system-8.option.0",
          "grammar.v2.polite-verb-masu-system-8.option.1",
          "grammar.v2.polite-verb-masu-system-8.option.2",
          "grammar.v2.polite-verb-masu-system-8.option.3"
        ],
        "answer": 3
      }
    ]
  },
  {
    "id": "polite-desu-system",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 4,
    "titleKey": "grammar.v2.polite-desu-system.title",
    "summaryKey": "grammar.v2.polite-desu-system.summary",
    "goalKey": "grammar.v2.polite-desu-system.goal",
    "prerequisiteIds": [
      "state-being-plain",
      "state-being-negative",
      "state-being-past",
      "state-being-past-negative",
      "adjective-na",
      "adjective-i",
      "adjective-negative",
      "adjective-past",
      "adjective-past-negative"
    ],
    "relatedIds": [
      "da-vs-desu",
      "question-ka",
      "plain-vs-polite",
      "explanatory-no-ndesu"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.polite-desu-system.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生です / 学生じゃないです / 学生でした / 学生じゃなかったです"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "静かです / 静かじゃないです / 静かでした / 静かじゃなかったです"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高いです / 高くないです / 高かったです / 高くなかったです"
        }
      ],
      "examples": [
        {
          "japanese": "学生じゃないです。",
          "reading": "がくせいじゃないです。",
          "meaningKey": "grammar.v2.polite-desu-system.example.0"
        },
        {
          "japanese": "静かでした。",
          "reading": "しずかでした。",
          "meaningKey": "grammar.v2.polite-desu-system.example.1"
        },
        {
          "japanese": "高くなかったです。",
          "reading": "たかくなかったです。",
          "meaningKey": "grammar.v2.polite-desu-system.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.polite-desu-system.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.polite-desu-system.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "高いでした。",
          "correction": "高かったです。",
          "explanationKey": "grammar.v2.polite-desu-system.mistake.0"
        },
        {
          "wrong": "高かっただ。",
          "correction": "高かったです。",
          "explanationKey": "grammar.v2.polite-desu-system.mistake.1"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.polite.desuMatrix.caption",
          "headerKeys": [
            "grammar.v2.polite.desuMatrix.header.0",
            "grammar.v2.polite.desuMatrix.header.1",
            "grammar.v2.polite.desuMatrix.header.2"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.desuMatrix.row.0",
              "cells": [
                "学生です",
                "静かです",
                "高いです"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.desuMatrix.row.1",
              "cells": [
                "学生じゃないです",
                "静かじゃないです",
                "高くないです"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.desuMatrix.row.2",
              "cells": [
                "学生でした",
                "静かでした",
                "高かったです"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.desuMatrix.row.3",
              "cells": [
                "学生じゃなかったです",
                "静かじゃなかったです",
                "高くなかったです"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "polite-desu-system-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.polite-desu-system-1.prompt",
        "successKey": "grammar.v2.polite-desu-system-1.explanation",
        "errorKey": "grammar.v2.polite-desu-system-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.polite-desu-system-1.left.0",
            "rightKey": "grammar.v2.polite-desu-system-1.right.0"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-1.left.1",
            "rightKey": "grammar.v2.polite-desu-system-1.right.1"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-1.left.2",
            "rightKey": "grammar.v2.polite-desu-system-1.right.2"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-1.left.3",
            "rightKey": "grammar.v2.polite-desu-system-1.right.3"
          }
        ]
      },
      {
        "id": "polite-desu-system-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-desu-system-2.prompt",
        "successKey": "grammar.v2.polite-desu-system-2.explanation",
        "errorKey": "grammar.v2.polite-desu-system-2.explanation",
        "acceptedAnswers": [
          "学生です"
        ],
        "solutionKey": "grammar.v2.polite-desu-system-2.solution",
        "kanaBank": [
          "は",
          "の",
          "で",
          "学",
          "す",
          "生"
        ]
      },
      {
        "id": "polite-desu-system-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-desu-system-3.prompt",
        "successKey": "grammar.v2.polite-desu-system-3.explanation",
        "errorKey": "grammar.v2.polite-desu-system-3.explanation",
        "acceptedAnswers": [
          "学生じゃないです"
        ],
        "solutionKey": "grammar.v2.polite-desu-system-3.solution",
        "kanaBank": [
          "を",
          "ん",
          "ゃ",
          "じ",
          "す",
          "い",
          "な",
          "学",
          "で",
          "生"
        ]
      },
      {
        "id": "polite-desu-system-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-desu-system-4.prompt",
        "successKey": "grammar.v2.polite-desu-system-4.explanation",
        "errorKey": "grammar.v2.polite-desu-system-4.explanation",
        "acceptedAnswers": [
          "学生でした"
        ],
        "solutionKey": "grammar.v2.polite-desu-system-4.solution",
        "kanaBank": [
          "生",
          "か",
          "え",
          "た",
          "し",
          "で",
          "学"
        ]
      },
      {
        "id": "polite-desu-system-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.polite-desu-system-5.prompt",
        "successKey": "grammar.v2.polite-desu-system-5.explanation",
        "errorKey": "grammar.v2.polite-desu-system-5.explanation",
        "acceptedAnswers": [
          "学生じゃなかったです"
        ],
        "solutionKey": "grammar.v2.polite-desu-system-5.solution",
        "kanaBank": [
          "た",
          "じ",
          "す",
          "し",
          "の",
          "な",
          "学",
          "で",
          "っ",
          "生",
          "ゃ",
          "か"
        ]
      },
      {
        "id": "polite-desu-system-6",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.polite-desu-system-6.prompt",
        "successKey": "grammar.v2.polite-desu-system-6.explanation",
        "errorKey": "grammar.v2.polite-desu-system-6.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.polite-desu-system-6.left.0",
            "rightKey": "grammar.v2.polite-desu-system-6.right.0"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-6.left.1",
            "rightKey": "grammar.v2.polite-desu-system-6.right.1"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-6.left.2",
            "rightKey": "grammar.v2.polite-desu-system-6.right.2"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-6.left.3",
            "rightKey": "grammar.v2.polite-desu-system-6.right.3"
          }
        ]
      },
      {
        "id": "polite-desu-system-7",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.polite-desu-system-7.prompt",
        "successKey": "grammar.v2.polite-desu-system-7.explanation",
        "errorKey": "grammar.v2.polite-desu-system-7.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.polite-desu-system-7.left.0",
            "rightKey": "grammar.v2.polite-desu-system-7.right.0"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-7.left.1",
            "rightKey": "grammar.v2.polite-desu-system-7.right.1"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-7.left.2",
            "rightKey": "grammar.v2.polite-desu-system-7.right.2"
          },
          {
            "leftKey": "grammar.v2.polite-desu-system-7.left.3",
            "rightKey": "grammar.v2.polite-desu-system-7.right.3"
          }
        ]
      },
      {
        "id": "polite-desu-system-8",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "polite-desu-system",
        "conceptId": "polite-desu-system",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.polite-desu-system-8.prompt",
        "successKey": "grammar.v2.polite-desu-system-8.explanation",
        "errorKey": "grammar.v2.polite-desu-system-8.explanation",
        "options": [
          {
            "id": "polite-desu-system-8-option-0",
            "textKey": "grammar.v2.polite-desu-system-8.option.0",
            "feedbackKey": "grammar.v2.polite-desu-system-8.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "polite-desu-system-8-option-1",
            "textKey": "grammar.v2.polite-desu-system-8.option.1",
            "feedbackKey": "grammar.v2.polite-desu-system-8.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "polite-desu-system-8-option-2",
            "textKey": "grammar.v2.polite-desu-system-8.option.2",
            "feedbackKey": "grammar.v2.polite-desu-system-8.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.polite-desu-system-8.option.0",
          "grammar.v2.polite-desu-system-8.option.1",
          "grammar.v2.polite-desu-system-8.option.2"
        ],
        "answer": 1
      }
    ]
  },
  {
    "id": "da-vs-desu",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 5,
    "titleKey": "grammar.v2.da-vs-desu.title",
    "summaryKey": "grammar.v2.da-vs-desu.summary",
    "goalKey": "grammar.v2.da-vs-desu.goal",
    "prerequisiteIds": [
      "polite-desu-system",
      "state-being-plain"
    ],
    "relatedIds": [
      "quotation-to"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.da-vs-desu.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生だ。 ↔ 学生です。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生だった。 ↔ 学生でした。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高い。 ↔ 高いです。"
        }
      ],
      "examples": [
        {
          "japanese": "学生だ。",
          "reading": "がくせいだ。",
          "meaningKey": "grammar.v2.da-vs-desu.example.0"
        },
        {
          "japanese": "学生です。",
          "reading": "がくせいです。",
          "meaningKey": "grammar.v2.da-vs-desu.example.1"
        },
        {
          "japanese": "学生でした。",
          "reading": "がくせいでした。",
          "meaningKey": "grammar.v2.da-vs-desu.example.2"
        },
        {
          "japanese": "高いです。",
          "reading": "たかいです。",
          "meaningKey": "grammar.v2.da-vs-desu.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.da-vs-desu.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.da-vs-desu.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "学生だです。",
          "correction": "学生です。",
          "explanationKey": "grammar.v2.da-vs-desu.mistake.0"
        },
        {
          "wrong": "高いだ。",
          "correction": "高い。",
          "explanationKey": "grammar.v2.da-vs-desu.mistake.1"
        },
        {
          "wrong": "学生でしたった。",
          "correction": "学生でした。",
          "explanationKey": "grammar.v2.da-vs-desu.mistake.2"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "da-vs-desu-1",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "da-vs-desu",
        "conceptId": "da-vs-desu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.da-vs-desu-1.prompt",
        "successKey": "grammar.v2.da-vs-desu-1.explanation",
        "errorKey": "grammar.v2.da-vs-desu-1.explanation",
        "options": [
          {
            "id": "da-vs-desu-1-option-0",
            "textKey": "grammar.v2.da-vs-desu-1.option.0",
            "feedbackKey": "grammar.v2.da-vs-desu-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "da-vs-desu-1-option-1",
            "textKey": "grammar.v2.da-vs-desu-1.option.1",
            "feedbackKey": "grammar.v2.da-vs-desu-1.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "da-vs-desu-1-option-2",
            "textKey": "grammar.v2.da-vs-desu-1.option.2",
            "feedbackKey": "grammar.v2.da-vs-desu-1.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.da-vs-desu-1.option.0",
          "grammar.v2.da-vs-desu-1.option.1",
          "grammar.v2.da-vs-desu-1.option.2"
        ],
        "answer": 1
      },
      {
        "id": "da-vs-desu-2",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "da-vs-desu",
        "conceptId": "da-vs-desu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.da-vs-desu-2.prompt",
        "successKey": "grammar.v2.da-vs-desu-2.explanation",
        "errorKey": "grammar.v2.da-vs-desu-2.explanation",
        "options": [
          {
            "id": "da-vs-desu-2-option-0",
            "textKey": "grammar.v2.da-vs-desu-2.option.0",
            "feedbackKey": "grammar.v2.da-vs-desu-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "da-vs-desu-2-option-1",
            "textKey": "grammar.v2.da-vs-desu-2.option.1",
            "feedbackKey": "grammar.v2.da-vs-desu-2.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "da-vs-desu-2-option-2",
            "textKey": "grammar.v2.da-vs-desu-2.option.2",
            "feedbackKey": "grammar.v2.da-vs-desu-2.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.da-vs-desu-2.option.0",
          "grammar.v2.da-vs-desu-2.option.1",
          "grammar.v2.da-vs-desu-2.option.2"
        ],
        "answer": 1
      },
      {
        "id": "da-vs-desu-3",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "da-vs-desu",
        "conceptId": "da-vs-desu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.da-vs-desu-3.prompt",
        "successKey": "grammar.v2.da-vs-desu-3.explanation",
        "errorKey": "grammar.v2.da-vs-desu-3.explanation",
        "options": [
          {
            "id": "da-vs-desu-3-option-0",
            "textKey": "grammar.v2.da-vs-desu-3.option.0",
            "feedbackKey": "grammar.v2.da-vs-desu-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "da-vs-desu-3-option-1",
            "textKey": "grammar.v2.da-vs-desu-3.option.1",
            "feedbackKey": "grammar.v2.da-vs-desu-3.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "da-vs-desu-3-option-2",
            "textKey": "grammar.v2.da-vs-desu-3.option.2",
            "feedbackKey": "grammar.v2.da-vs-desu-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.da-vs-desu-3.option.0",
          "grammar.v2.da-vs-desu-3.option.1",
          "grammar.v2.da-vs-desu-3.option.2"
        ],
        "answer": 1
      },
      {
        "id": "da-vs-desu-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "da-vs-desu",
        "conceptId": "da-vs-desu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.da-vs-desu-4.prompt",
        "successKey": "grammar.v2.da-vs-desu-4.explanation",
        "errorKey": "grammar.v2.da-vs-desu-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.da-vs-desu-4.left.0",
            "rightKey": "grammar.v2.da-vs-desu-4.right.0"
          },
          {
            "leftKey": "grammar.v2.da-vs-desu-4.left.1",
            "rightKey": "grammar.v2.da-vs-desu-4.right.1"
          },
          {
            "leftKey": "grammar.v2.da-vs-desu-4.left.2",
            "rightKey": "grammar.v2.da-vs-desu-4.right.2"
          }
        ]
      },
      {
        "id": "da-vs-desu-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "da-vs-desu",
        "conceptId": "da-vs-desu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.da-vs-desu-5.prompt",
        "successKey": "grammar.v2.da-vs-desu-5.explanation",
        "errorKey": "grammar.v2.da-vs-desu-5.explanation",
        "options": [
          {
            "id": "da-vs-desu-5-option-0",
            "textKey": "grammar.v2.da-vs-desu-5.option.0",
            "feedbackKey": "grammar.v2.da-vs-desu-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "da-vs-desu-5-option-1",
            "textKey": "grammar.v2.da-vs-desu-5.option.1",
            "feedbackKey": "grammar.v2.da-vs-desu-5.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.da-vs-desu-5.option.0",
          "grammar.v2.da-vs-desu-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "question-ka",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 6,
    "titleKey": "grammar.v2.question-ka.title",
    "summaryKey": "grammar.v2.question-ka.summary",
    "goalKey": "grammar.v2.question-ka.goal",
    "prerequisiteIds": [
      "polite-verb-masu-system",
      "polite-desu-system",
      "question-words-basic"
    ],
    "relatedIds": [
      "casual-question-no",
      "te-mo-ii"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.question-ka.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生です → 学生ですか。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "行きます → 行きますか。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べました → 食べましたか。"
        }
      ],
      "examples": [
        {
          "japanese": "何を食べますか。",
          "reading": "なにをたべますか。",
          "meaningKey": "grammar.v2.question-ka.example.0"
        },
        {
          "japanese": "どこに行きますか。",
          "reading": "どこにいきますか。",
          "meaningKey": "grammar.v2.question-ka.example.1"
        },
        {
          "japanese": "いつ来ますか。",
          "reading": "いつきますか。",
          "meaningKey": "grammar.v2.question-ka.example.2"
        },
        {
          "japanese": "誰と行きますか。",
          "reading": "だれといきますか。",
          "meaningKey": "grammar.v2.question-ka.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.question-ka.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.question-ka.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "question-ka-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "question-ka",
        "conceptId": "question-ka",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.question-ka-1.prompt",
        "successKey": "grammar.v2.question-ka-1.explanation",
        "errorKey": "grammar.v2.question-ka-1.explanation",
        "acceptedAnswers": [
          "か"
        ],
        "solutionKey": "grammar.v2.question-ka-1.solution",
        "kanaBank": [
          "い",
          "う",
          "え",
          "か",
          "が",
          "く"
        ]
      },
      {
        "id": "question-ka-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "question-ka",
        "conceptId": "question-ka",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.question-ka-2.prompt",
        "successKey": "grammar.v2.question-ka-2.explanation",
        "errorKey": "grammar.v2.question-ka-2.explanation",
        "acceptedAnswers": [
          "か"
        ],
        "solutionKey": "grammar.v2.question-ka-2.solution",
        "kanaBank": [
          "の",
          "に",
          "な",
          "と",
          "ま",
          "か"
        ]
      },
      {
        "id": "question-ka-3",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "question-ka",
        "conceptId": "question-ka",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.question-ka-3.prompt",
        "successKey": "grammar.v2.question-ka-3.explanation",
        "errorKey": "grammar.v2.question-ka-3.explanation",
        "tokenKeys": [
          "grammar.v2.question-ka-3.token.0",
          "grammar.v2.question-ka-3.token.1"
        ],
        "solution": [
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "question-ka-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "question-ka",
        "conceptId": "question-ka",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.question-ka-4.prompt",
        "successKey": "grammar.v2.question-ka-4.explanation",
        "errorKey": "grammar.v2.question-ka-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.question-ka-4.left.0",
            "rightKey": "grammar.v2.question-ka-4.right.0"
          },
          {
            "leftKey": "grammar.v2.question-ka-4.left.1",
            "rightKey": "grammar.v2.question-ka-4.right.1"
          },
          {
            "leftKey": "grammar.v2.question-ka-4.left.2",
            "rightKey": "grammar.v2.question-ka-4.right.2"
          },
          {
            "leftKey": "grammar.v2.question-ka-4.left.3",
            "rightKey": "grammar.v2.question-ka-4.right.3"
          }
        ]
      },
      {
        "id": "question-ka-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "question-ka",
        "conceptId": "question-ka",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.question-ka-5.prompt",
        "successKey": "grammar.v2.question-ka-5.explanation",
        "errorKey": "grammar.v2.question-ka-5.explanation",
        "options": [
          {
            "id": "question-ka-5-option-0",
            "textKey": "grammar.v2.question-ka-5.option.0",
            "feedbackKey": "grammar.v2.question-ka-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "question-ka-5-option-1",
            "textKey": "grammar.v2.question-ka-5.option.1",
            "feedbackKey": "grammar.v2.question-ka-5.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.question-ka-5.option.0",
          "grammar.v2.question-ka-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "plain-vs-polite",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 7,
    "titleKey": "grammar.v2.plain-vs-polite.title",
    "summaryKey": "grammar.v2.plain-vs-polite.summary",
    "goalKey": "grammar.v2.plain-vs-polite.goal",
    "prerequisiteIds": [
      "polite-verb-masu-system",
      "polite-desu-system"
    ],
    "relatedIds": [
      "sentence-ending-ne-yo",
      "relative-clause-noun",
      "explanatory-no-ndesu",
      "quotation-to",
      "te-iru-progressive"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.plain-vs-polite.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べなかった ↔ 食べませんでした"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生だった ↔ 学生でした"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高くなかった ↔ 高くなかったです"
        }
      ],
      "examples": [
        {
          "japanese": "食べなかった。",
          "reading": "たべなかった。",
          "meaningKey": "grammar.v2.plain-vs-polite.example.0"
        },
        {
          "japanese": "食べませんでした。",
          "reading": "たべませんでした。",
          "meaningKey": "grammar.v2.plain-vs-polite.example.1"
        },
        {
          "japanese": "この映画は面白くなかったです。",
          "reading": "このえいがはおもしろくなかったです。",
          "meaningKey": "grammar.v2.plain-vs-polite.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.plain-vs-polite.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.plain-vs-polite.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.polite.registerverb.caption",
          "headerKeys": [
            "grammar.v2.polite.registerverb.header.0",
            "grammar.v2.polite.registerverb.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.registerverb.row.0",
              "cells": [
                "食べる",
                "食べます"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registerverb.row.1",
              "cells": [
                "食べない",
                "食べません"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registerverb.row.2",
              "cells": [
                "食べた",
                "食べました"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registerverb.row.3",
              "cells": [
                "食べなかった",
                "食べませんでした"
              ]
            }
          ]
        },
        {
          "captionKey": "grammar.v2.polite.registernoun.caption",
          "headerKeys": [
            "grammar.v2.polite.registernoun.header.0",
            "grammar.v2.polite.registernoun.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.registernoun.row.0",
              "cells": [
                "学生だ",
                "学生です"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registernoun.row.1",
              "cells": [
                "学生じゃない",
                "学生じゃないです"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registernoun.row.2",
              "cells": [
                "学生だった",
                "学生でした"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registernoun.row.3",
              "cells": [
                "学生じゃなかった",
                "学生じゃなかったです"
              ]
            }
          ]
        },
        {
          "captionKey": "grammar.v2.polite.registeradjective.caption",
          "headerKeys": [
            "grammar.v2.polite.registeradjective.header.0",
            "grammar.v2.polite.registeradjective.header.1"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.polite.registeradjective.row.0",
              "cells": [
                "高い",
                "高いです"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registeradjective.row.1",
              "cells": [
                "高くない",
                "高くないです"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registeradjective.row.2",
              "cells": [
                "高かった",
                "高かったです"
              ]
            },
            {
              "labelKey": "grammar.v2.polite.registeradjective.row.3",
              "cells": [
                "高くなかった",
                "高くなかったです"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "plain-vs-polite-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "plain-vs-polite",
        "conceptId": "plain-vs-polite",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.plain-vs-polite-1.prompt",
        "successKey": "grammar.v2.plain-vs-polite-1.explanation",
        "errorKey": "grammar.v2.plain-vs-polite-1.explanation",
        "options": [
          {
            "id": "plain-vs-polite-1-option-0",
            "textKey": "grammar.v2.plain-vs-polite-1.option.0",
            "feedbackKey": "grammar.v2.plain-vs-polite-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "plain-vs-polite-1-option-1",
            "textKey": "grammar.v2.plain-vs-polite-1.option.1",
            "feedbackKey": "grammar.v2.plain-vs-polite-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "plain-vs-polite-1-option-2",
            "textKey": "grammar.v2.plain-vs-polite-1.option.2",
            "feedbackKey": "grammar.v2.plain-vs-polite-1.feedback.2",
            "grammarStatus": "valid"
          },
          {
            "id": "plain-vs-polite-1-option-3",
            "textKey": "grammar.v2.plain-vs-polite-1.option.3",
            "feedbackKey": "grammar.v2.plain-vs-polite-1.feedback.3",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.plain-vs-polite-1.option.0",
          "grammar.v2.plain-vs-polite-1.option.1",
          "grammar.v2.plain-vs-polite-1.option.2",
          "grammar.v2.plain-vs-polite-1.option.3"
        ],
        "answer": 3
      },
      {
        "id": "plain-vs-polite-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "plain-vs-polite",
        "conceptId": "plain-vs-polite",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.plain-vs-polite-2.prompt",
        "successKey": "grammar.v2.plain-vs-polite-2.explanation",
        "errorKey": "grammar.v2.plain-vs-polite-2.explanation",
        "acceptedAnswers": [
          "食べなかった"
        ],
        "solutionKey": "grammar.v2.plain-vs-polite-2.solution",
        "kanaBank": [
          "を",
          "ん",
          "べ",
          "な",
          "っ",
          "た",
          "か",
          "食"
        ]
      },
      {
        "id": "plain-vs-polite-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "plain-vs-polite",
        "conceptId": "plain-vs-polite",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.plain-vs-polite-3.prompt",
        "successKey": "grammar.v2.plain-vs-polite-3.explanation",
        "errorKey": "grammar.v2.plain-vs-polite-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.plain-vs-polite-3.left.0",
            "rightKey": "grammar.v2.plain-vs-polite-3.right.0"
          },
          {
            "leftKey": "grammar.v2.plain-vs-polite-3.left.1",
            "rightKey": "grammar.v2.plain-vs-polite-3.right.1"
          },
          {
            "leftKey": "grammar.v2.plain-vs-polite-3.left.2",
            "rightKey": "grammar.v2.plain-vs-polite-3.right.2"
          },
          {
            "leftKey": "grammar.v2.plain-vs-polite-3.left.3",
            "rightKey": "grammar.v2.plain-vs-polite-3.right.3"
          }
        ]
      },
      {
        "id": "plain-vs-polite-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "plain-vs-polite",
        "conceptId": "plain-vs-polite",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.plain-vs-polite-4.prompt",
        "successKey": "grammar.v2.plain-vs-polite-4.explanation",
        "errorKey": "grammar.v2.plain-vs-polite-4.explanation",
        "acceptedAnswers": [
          "高くなかったです"
        ],
        "solutionKey": "grammar.v2.plain-vs-polite-4.solution",
        "kanaBank": [
          "な",
          "に",
          "と",
          "っ",
          "で",
          "か",
          "く",
          "す",
          "た",
          "高"
        ]
      },
      {
        "id": "plain-vs-polite-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "plain-vs-polite",
        "conceptId": "plain-vs-polite",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.plain-vs-polite-5.prompt",
        "successKey": "grammar.v2.plain-vs-polite-5.explanation",
        "errorKey": "grammar.v2.plain-vs-polite-5.explanation",
        "options": [
          {
            "id": "plain-vs-polite-5-option-0",
            "textKey": "grammar.v2.plain-vs-polite-5.option.0",
            "feedbackKey": "grammar.v2.plain-vs-polite-5.feedback.0"
          },
          {
            "id": "plain-vs-polite-5-option-1",
            "textKey": "grammar.v2.plain-vs-polite-5.option.1",
            "feedbackKey": "grammar.v2.plain-vs-polite-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.plain-vs-polite-5.option.0",
          "grammar.v2.plain-vs-polite-5.option.1"
        ],
        "answer": 0
      },
      {
        "id": "plain-vs-polite-6",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "plain-vs-polite",
        "conceptId": "plain-vs-polite",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.plain-vs-polite-6.prompt",
        "successKey": "grammar.v2.plain-vs-polite-6.explanation",
        "errorKey": "grammar.v2.plain-vs-polite-6.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.plain-vs-polite-6.left.0",
            "rightKey": "grammar.v2.plain-vs-polite-6.right.0"
          },
          {
            "leftKey": "grammar.v2.plain-vs-polite-6.left.1",
            "rightKey": "grammar.v2.plain-vs-polite-6.right.1"
          },
          {
            "leftKey": "grammar.v2.plain-vs-polite-6.left.2",
            "rightKey": "grammar.v2.plain-vs-polite-6.right.2"
          },
          {
            "leftKey": "grammar.v2.plain-vs-polite-6.left.3",
            "rightKey": "grammar.v2.plain-vs-polite-6.right.3"
          }
        ]
      }
    ]
  },
  {
    "id": "sentence-ending-ne-yo",
    "level": "N5",
    "track": "core",
    "topicId": "05",
    "order": 8,
    "titleKey": "grammar.v2.sentence-ending-ne-yo.title",
    "summaryKey": "grammar.v2.sentence-ending-ne-yo.summary",
    "goalKey": "grammar.v2.sentence-ending-ne-yo.goal",
    "prerequisiteIds": [
      "plain-vs-polite",
      "sentence-structure-context"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.sentence-ending-ne-yo.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "そうだね。 / そうですね。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "明日は休みですよ。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "これ、おいしいよね。"
        }
      ],
      "examples": [
        {
          "japanese": "いい天気ですね。",
          "reading": "いいてんきですね。",
          "meaningKey": "grammar.v2.sentence-ending-ne-yo.example.0"
        },
        {
          "japanese": "面白かったね。",
          "reading": "おもしろかったね。",
          "meaningKey": "grammar.v2.sentence-ending-ne-yo.example.1"
        },
        {
          "japanese": "明日は休みですよ。",
          "reading": "あしたはやすみですよ。",
          "meaningKey": "grammar.v2.sentence-ending-ne-yo.example.2"
        },
        {
          "japanese": "時間がないよ。",
          "reading": "じかんがないよ。",
          "meaningKey": "grammar.v2.sentence-ending-ne-yo.example.3"
        },
        {
          "japanese": "これ、おいしいよね。",
          "reading": "これ、おいしいよね。",
          "meaningKey": "grammar.v2.sentence-ending-ne-yo.example.4"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.sentence-ending-ne-yo.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.sentence-ending-ne-yo.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "sentence-ending-ne-yo-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "sentence-ending-ne-yo",
        "conceptId": "sentence-ending-ne-yo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.sentence-ending-ne-yo-1.prompt",
        "successKey": "grammar.v2.sentence-ending-ne-yo-1.explanation",
        "errorKey": "grammar.v2.sentence-ending-ne-yo-1.explanation",
        "options": [
          {
            "id": "sentence-ending-ne-yo-1-option-0",
            "textKey": "grammar.v2.sentence-ending-ne-yo-1.option.0",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "sentence-ending-ne-yo-1-option-1",
            "textKey": "grammar.v2.sentence-ending-ne-yo-1.option.1",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-1.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "sentence-ending-ne-yo-1-option-2",
            "textKey": "grammar.v2.sentence-ending-ne-yo-1.option.2",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-1.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.sentence-ending-ne-yo-1.option.0",
          "grammar.v2.sentence-ending-ne-yo-1.option.1",
          "grammar.v2.sentence-ending-ne-yo-1.option.2"
        ],
        "answer": 0
      },
      {
        "id": "sentence-ending-ne-yo-2",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "sentence-ending-ne-yo",
        "conceptId": "sentence-ending-ne-yo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.sentence-ending-ne-yo-2.prompt",
        "successKey": "grammar.v2.sentence-ending-ne-yo-2.explanation",
        "errorKey": "grammar.v2.sentence-ending-ne-yo-2.explanation",
        "options": [
          {
            "id": "sentence-ending-ne-yo-2-option-0",
            "textKey": "grammar.v2.sentence-ending-ne-yo-2.option.0",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-2.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "sentence-ending-ne-yo-2-option-1",
            "textKey": "grammar.v2.sentence-ending-ne-yo-2.option.1",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-2.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "sentence-ending-ne-yo-2-option-2",
            "textKey": "grammar.v2.sentence-ending-ne-yo-2.option.2",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-2.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.sentence-ending-ne-yo-2.option.0",
          "grammar.v2.sentence-ending-ne-yo-2.option.1",
          "grammar.v2.sentence-ending-ne-yo-2.option.2"
        ],
        "answer": 1
      },
      {
        "id": "sentence-ending-ne-yo-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "sentence-ending-ne-yo",
        "conceptId": "sentence-ending-ne-yo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.sentence-ending-ne-yo-3.prompt",
        "successKey": "grammar.v2.sentence-ending-ne-yo-3.explanation",
        "errorKey": "grammar.v2.sentence-ending-ne-yo-3.explanation",
        "options": [
          {
            "id": "sentence-ending-ne-yo-3-option-0",
            "textKey": "grammar.v2.sentence-ending-ne-yo-3.option.0",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "sentence-ending-ne-yo-3-option-1",
            "textKey": "grammar.v2.sentence-ending-ne-yo-3.option.1",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-3.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "sentence-ending-ne-yo-3-option-2",
            "textKey": "grammar.v2.sentence-ending-ne-yo-3.option.2",
            "feedbackKey": "grammar.v2.sentence-ending-ne-yo-3.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.sentence-ending-ne-yo-3.option.0",
          "grammar.v2.sentence-ending-ne-yo-3.option.1",
          "grammar.v2.sentence-ending-ne-yo-3.option.2"
        ],
        "answer": 2
      },
      {
        "id": "sentence-ending-ne-yo-4",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "05",
        "lessonId": "sentence-ending-ne-yo",
        "conceptId": "sentence-ending-ne-yo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.sentence-ending-ne-yo-4.prompt",
        "successKey": "grammar.v2.sentence-ending-ne-yo-4.explanation",
        "errorKey": "grammar.v2.sentence-ending-ne-yo-4.explanation",
        "tokenKeys": [
          "grammar.v2.sentence-ending-ne-yo-4.token.0",
          "grammar.v2.sentence-ending-ne-yo-4.token.1"
        ],
        "solution": [
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "sentence-ending-ne-yo-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "05",
        "lessonId": "sentence-ending-ne-yo",
        "conceptId": "sentence-ending-ne-yo",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic05",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.sentence-ending-ne-yo-5.prompt",
        "successKey": "grammar.v2.sentence-ending-ne-yo-5.explanation",
        "errorKey": "grammar.v2.sentence-ending-ne-yo-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.sentence-ending-ne-yo-5.left.0",
            "rightKey": "grammar.v2.sentence-ending-ne-yo-5.right.0"
          },
          {
            "leftKey": "grammar.v2.sentence-ending-ne-yo-5.left.1",
            "rightKey": "grammar.v2.sentence-ending-ne-yo-5.right.1"
          }
        ]
      }
    ]
  },
  {
    "id": "relative-clause-noun",
    "level": "N5",
    "track": "core",
    "topicId": "06",
    "order": 1,
    "titleKey": "grammar.v2.relative-clause-noun.title",
    "summaryKey": "grammar.v2.relative-clause-noun.summary",
    "goalKey": "grammar.v2.relative-clause-noun.goal",
    "prerequisiteIds": [
      "plain-vs-polite",
      "verb-past-plain",
      "particle-ga-identifier",
      "particle-wo-object"
    ],
    "relatedIds": [
      "nominalizer-no"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.relative-clause-noun.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "昨日買った + 本"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "田中さんが読んだ + 本"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "毎日読む + 本"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "買わなかった + 本"
        }
      ],
      "examples": [
        {
          "japanese": "昨日買った本",
          "reading": "きのうかったほん",
          "meaningKey": "grammar.v2.relative-clause-noun.example.0"
        },
        {
          "japanese": "田中さんが読んだ本",
          "reading": "たなかさんがよんだほん",
          "meaningKey": "grammar.v2.relative-clause-noun.example.1"
        },
        {
          "japanese": "毎日読む本",
          "reading": "まいにちよむほん",
          "meaningKey": "grammar.v2.relative-clause-noun.example.2"
        },
        {
          "japanese": "買わなかった本",
          "reading": "かわなかったほん",
          "meaningKey": "grammar.v2.relative-clause-noun.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.relative-clause-noun.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.relative-clause-noun.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "昨日買いました本",
          "correction": "昨日買った本",
          "explanationKey": "grammar.v2.relative-clause-noun.mistake.0"
        },
        {
          "wrong": "静かだ町",
          "correction": "静かな町",
          "explanationKey": "grammar.v2.relative-clause-noun.mistake.1"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "relative-clause-noun-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "relative-clause-noun",
        "conceptId": "relative-clause-noun",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.relative-clause-noun-1.prompt",
        "successKey": "grammar.v2.relative-clause-noun-1.explanation",
        "errorKey": "grammar.v2.relative-clause-noun-1.explanation",
        "options": [
          {
            "id": "relative-clause-noun-1-option-0",
            "textKey": "grammar.v2.relative-clause-noun-1.option.0",
            "feedbackKey": "grammar.v2.relative-clause-noun-1.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "relative-clause-noun-1-option-1",
            "textKey": "grammar.v2.relative-clause-noun-1.option.1",
            "feedbackKey": "grammar.v2.relative-clause-noun-1.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.relative-clause-noun-1.option.0",
          "grammar.v2.relative-clause-noun-1.option.1"
        ],
        "answer": 0
      },
      {
        "id": "relative-clause-noun-2",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "relative-clause-noun",
        "conceptId": "relative-clause-noun",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.relative-clause-noun-2.prompt",
        "successKey": "grammar.v2.relative-clause-noun-2.explanation",
        "errorKey": "grammar.v2.relative-clause-noun-2.explanation",
        "tokenKeys": [
          "grammar.v2.relative-clause-noun-2.token.0",
          "grammar.v2.relative-clause-noun-2.token.1",
          "grammar.v2.relative-clause-noun-2.token.2"
        ],
        "solution": [
          2,
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "relative-clause-noun-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "relative-clause-noun",
        "conceptId": "relative-clause-noun",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.relative-clause-noun-3.prompt",
        "successKey": "grammar.v2.relative-clause-noun-3.explanation",
        "errorKey": "grammar.v2.relative-clause-noun-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.relative-clause-noun-3.left.0",
            "rightKey": "grammar.v2.relative-clause-noun-3.right.0"
          },
          {
            "leftKey": "grammar.v2.relative-clause-noun-3.left.1",
            "rightKey": "grammar.v2.relative-clause-noun-3.right.1"
          },
          {
            "leftKey": "grammar.v2.relative-clause-noun-3.left.2",
            "rightKey": "grammar.v2.relative-clause-noun-3.right.2"
          }
        ]
      },
      {
        "id": "relative-clause-noun-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "relative-clause-noun",
        "conceptId": "relative-clause-noun",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.relative-clause-noun-4.prompt",
        "successKey": "grammar.v2.relative-clause-noun-4.explanation",
        "errorKey": "grammar.v2.relative-clause-noun-4.explanation",
        "acceptedAnswers": [
          "が"
        ],
        "solutionKey": "grammar.v2.relative-clause-noun-4.solution",
        "kanaBank": [
          "ん",
          "を",
          "ら",
          "る",
          "れ",
          "が"
        ]
      },
      {
        "id": "relative-clause-noun-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "relative-clause-noun",
        "conceptId": "relative-clause-noun",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.relative-clause-noun-5.prompt",
        "successKey": "grammar.v2.relative-clause-noun-5.explanation",
        "errorKey": "grammar.v2.relative-clause-noun-5.explanation",
        "options": [
          {
            "id": "relative-clause-noun-5-option-0",
            "textKey": "grammar.v2.relative-clause-noun-5.option.0",
            "feedbackKey": "grammar.v2.relative-clause-noun-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "relative-clause-noun-5-option-1",
            "textKey": "grammar.v2.relative-clause-noun-5.option.1",
            "feedbackKey": "grammar.v2.relative-clause-noun-5.feedback.1",
            "grammarStatus": "invalid"
          }
        ],
        "optionKeys": [
          "grammar.v2.relative-clause-noun-5.option.0",
          "grammar.v2.relative-clause-noun-5.option.1"
        ],
        "answer": 0
      },
      {
        "id": "relative-clause-noun-6",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "relative-clause-noun",
        "conceptId": "relative-clause-noun",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.relative-clause-noun-6.prompt",
        "successKey": "grammar.v2.relative-clause-noun-6.explanation",
        "errorKey": "grammar.v2.relative-clause-noun-6.explanation",
        "options": [
          {
            "id": "relative-clause-noun-6-option-0",
            "textKey": "grammar.v2.relative-clause-noun-6.option.0",
            "feedbackKey": "grammar.v2.relative-clause-noun-6.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "relative-clause-noun-6-option-1",
            "textKey": "grammar.v2.relative-clause-noun-6.option.1",
            "feedbackKey": "grammar.v2.relative-clause-noun-6.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "relative-clause-noun-6-option-2",
            "textKey": "grammar.v2.relative-clause-noun-6.option.2",
            "feedbackKey": "grammar.v2.relative-clause-noun-6.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.relative-clause-noun-6.option.0",
          "grammar.v2.relative-clause-noun-6.option.1",
          "grammar.v2.relative-clause-noun-6.option.2"
        ],
        "answer": 1
      }
    ]
  },
  {
    "id": "nominalizer-no",
    "level": "N5",
    "track": "core",
    "topicId": "06",
    "order": 2,
    "titleKey": "grammar.v2.nominalizer-no.title",
    "summaryKey": "grammar.v2.nominalizer-no.summary",
    "goalKey": "grammar.v2.nominalizer-no.goal",
    "prerequisiteIds": [
      "relative-clause-noun",
      "particle-ga-identifier"
    ],
    "relatedIds": [
      "explanatory-no-ndesu"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.nominalizer-no.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "本を読む + の + が好きだ"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "歩く + の + が好きだ"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "毎日勉強する + の + は大変だ"
        }
      ],
      "examples": [
        {
          "japanese": "本を読むのが好きだ。",
          "reading": "ほんをよむのがすきだ。",
          "meaningKey": "grammar.v2.nominalizer-no.example.0"
        },
        {
          "japanese": "歩くのが好きだ。",
          "reading": "あるくのがすきだ。",
          "meaningKey": "grammar.v2.nominalizer-no.example.1"
        },
        {
          "japanese": "毎日勉強するのは大変だ。",
          "reading": "まいにちべんきょうするのはたいへんだ。",
          "meaningKey": "grammar.v2.nominalizer-no.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.nominalizer-no.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.nominalizer-no.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "nominalizer-no-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "nominalizer-no",
        "conceptId": "nominalizer-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.nominalizer-no-1.prompt",
        "successKey": "grammar.v2.nominalizer-no-1.explanation",
        "errorKey": "grammar.v2.nominalizer-no-1.explanation",
        "acceptedAnswers": [
          "の"
        ],
        "solutionKey": "grammar.v2.nominalizer-no-1.solution",
        "kanaBank": [
          "は",
          "の",
          "に",
          "な",
          "と",
          "で"
        ]
      },
      {
        "id": "nominalizer-no-2",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "nominalizer-no",
        "conceptId": "nominalizer-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.nominalizer-no-2.prompt",
        "successKey": "grammar.v2.nominalizer-no-2.explanation",
        "errorKey": "grammar.v2.nominalizer-no-2.explanation",
        "tokenKeys": [
          "grammar.v2.nominalizer-no-2.token.0",
          "grammar.v2.nominalizer-no-2.token.1",
          "grammar.v2.nominalizer-no-2.token.2",
          "grammar.v2.nominalizer-no-2.token.3"
        ],
        "solution": [
          2,
          1,
          3,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "nominalizer-no-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "nominalizer-no",
        "conceptId": "nominalizer-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.nominalizer-no-3.prompt",
        "successKey": "grammar.v2.nominalizer-no-3.explanation",
        "errorKey": "grammar.v2.nominalizer-no-3.explanation",
        "acceptedAnswers": [
          "は"
        ],
        "solutionKey": "grammar.v2.nominalizer-no-3.solution",
        "kanaBank": [
          "れ",
          "ら",
          "る",
          "や",
          "ゃ",
          "は"
        ]
      },
      {
        "id": "nominalizer-no-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "nominalizer-no",
        "conceptId": "nominalizer-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.nominalizer-no-4.prompt",
        "successKey": "grammar.v2.nominalizer-no-4.explanation",
        "errorKey": "grammar.v2.nominalizer-no-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.nominalizer-no-4.left.0",
            "rightKey": "grammar.v2.nominalizer-no-4.right.0"
          },
          {
            "leftKey": "grammar.v2.nominalizer-no-4.left.1",
            "rightKey": "grammar.v2.nominalizer-no-4.right.1"
          }
        ]
      },
      {
        "id": "nominalizer-no-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "nominalizer-no",
        "conceptId": "nominalizer-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.nominalizer-no-5.prompt",
        "successKey": "grammar.v2.nominalizer-no-5.explanation",
        "errorKey": "grammar.v2.nominalizer-no-5.explanation",
        "options": [
          {
            "id": "nominalizer-no-5-option-0",
            "textKey": "grammar.v2.nominalizer-no-5.option.0",
            "feedbackKey": "grammar.v2.nominalizer-no-5.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "nominalizer-no-5-option-1",
            "textKey": "grammar.v2.nominalizer-no-5.option.1",
            "feedbackKey": "grammar.v2.nominalizer-no-5.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.nominalizer-no-5.option.0",
          "grammar.v2.nominalizer-no-5.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "explanatory-no-ndesu",
    "level": "N5",
    "track": "core",
    "topicId": "06",
    "order": 3,
    "titleKey": "grammar.v2.explanatory-no-ndesu.title",
    "summaryKey": "grammar.v2.explanatory-no-ndesu.summary",
    "goalKey": "grammar.v2.explanatory-no-ndesu.goal",
    "prerequisiteIds": [
      "nominalizer-no",
      "polite-desu-system",
      "plain-vs-polite"
    ],
    "relatedIds": [
      "casual-question-no"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.explanatory-no-ndesu.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "のだ → んだ / のです → んです"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "行く + んです"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "高い + んです"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生 / 静か + な + んです"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生じゃない / 学生だった / 学生じゃなかった + んです"
        }
      ],
      "examples": [
        {
          "japanese": "電車が遅かった。",
          "reading": "でんしゃがおそかった。",
          "meaningKey": "grammar.v2.explanatory-no-ndesu.example.0"
        },
        {
          "japanese": "電車が遅かったんです。",
          "reading": "でんしゃがおそかったんです。",
          "meaningKey": "grammar.v2.explanatory-no-ndesu.example.1"
        },
        {
          "japanese": "明日行くんです。",
          "reading": "あしたいくんです。",
          "meaningKey": "grammar.v2.explanatory-no-ndesu.example.2"
        },
        {
          "japanese": "高いんです。",
          "reading": "たかいんです。",
          "meaningKey": "grammar.v2.explanatory-no-ndesu.example.3"
        },
        {
          "japanese": "学生なんです。",
          "reading": "がくせいなんです。",
          "meaningKey": "grammar.v2.explanatory-no-ndesu.example.4"
        },
        {
          "japanese": "静かなんです。",
          "reading": "しずかなんです。",
          "meaningKey": "grammar.v2.explanatory-no-ndesu.example.5"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.explanatory-no-ndesu.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.explanatory-no-ndesu.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "学生んです。",
          "correction": "学生なんです。",
          "explanationKey": "grammar.v2.explanatory-no-ndesu.mistake.0"
        },
        {
          "wrong": "学生じゃないなんです。",
          "correction": "学生じゃないんです。",
          "explanationKey": "grammar.v2.explanatory-no-ndesu.mistake.1"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.clauses.explanationForms.caption",
          "headerKeys": [
            "grammar.v2.clauses.explanationForms.header.0"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.0",
              "cells": [
                "明日行くんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.1",
              "cells": [
                "高いんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.2",
              "cells": [
                "学生なんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.3",
              "cells": [
                "静かなんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.4",
              "cells": [
                "学生じゃないんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.5",
              "cells": [
                "学生だったんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.6",
              "cells": [
                "学生じゃなかったんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.7",
              "cells": [
                "静かじゃないんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.8",
              "cells": [
                "静かだったんです"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.explanationForms.row.9",
              "cells": [
                "静かじゃなかったんです"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "explanatory-no-ndesu-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "explanatory-no-ndesu",
        "conceptId": "explanatory-no-ndesu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.explanatory-no-ndesu-1.prompt",
        "successKey": "grammar.v2.explanatory-no-ndesu-1.explanation",
        "errorKey": "grammar.v2.explanatory-no-ndesu-1.explanation",
        "acceptedAnswers": [
          "んです"
        ],
        "solutionKey": "grammar.v2.explanatory-no-ndesu-1.solution",
        "kanaBank": [
          "じ",
          "す",
          "た",
          "し",
          "で",
          "ん"
        ]
      },
      {
        "id": "explanatory-no-ndesu-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "explanatory-no-ndesu",
        "conceptId": "explanatory-no-ndesu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.explanatory-no-ndesu-2.prompt",
        "successKey": "grammar.v2.explanatory-no-ndesu-2.explanation",
        "errorKey": "grammar.v2.explanatory-no-ndesu-2.explanation",
        "acceptedAnswers": [
          "んです"
        ],
        "solutionKey": "grammar.v2.explanatory-no-ndesu-2.solution",
        "kanaBank": [
          "る",
          "ん",
          "を",
          "い",
          "す",
          "で"
        ]
      },
      {
        "id": "explanatory-no-ndesu-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "explanatory-no-ndesu",
        "conceptId": "explanatory-no-ndesu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.explanatory-no-ndesu-3.prompt",
        "successKey": "grammar.v2.explanatory-no-ndesu-3.explanation",
        "errorKey": "grammar.v2.explanatory-no-ndesu-3.explanation",
        "acceptedAnswers": [
          "なん"
        ],
        "solutionKey": "grammar.v2.explanatory-no-ndesu-3.solution",
        "kanaBank": [
          "ん",
          "な",
          "で",
          "だ",
          "ま",
          "へ"
        ]
      },
      {
        "id": "explanatory-no-ndesu-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "explanatory-no-ndesu",
        "conceptId": "explanatory-no-ndesu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.explanatory-no-ndesu-4.prompt",
        "successKey": "grammar.v2.explanatory-no-ndesu-4.explanation",
        "errorKey": "grammar.v2.explanatory-no-ndesu-4.explanation",
        "acceptedAnswers": [
          "なんです"
        ],
        "solutionKey": "grammar.v2.explanatory-no-ndesu-4.solution",
        "kanaBank": [
          "ゃ",
          "も",
          "ん",
          "で",
          "な",
          "す"
        ]
      },
      {
        "id": "explanatory-no-ndesu-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "explanatory-no-ndesu",
        "conceptId": "explanatory-no-ndesu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.explanatory-no-ndesu-5.prompt",
        "successKey": "grammar.v2.explanatory-no-ndesu-5.explanation",
        "errorKey": "grammar.v2.explanatory-no-ndesu-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.explanatory-no-ndesu-5.left.0",
            "rightKey": "grammar.v2.explanatory-no-ndesu-5.right.0"
          },
          {
            "leftKey": "grammar.v2.explanatory-no-ndesu-5.left.1",
            "rightKey": "grammar.v2.explanatory-no-ndesu-5.right.1"
          },
          {
            "leftKey": "grammar.v2.explanatory-no-ndesu-5.left.2",
            "rightKey": "grammar.v2.explanatory-no-ndesu-5.right.2"
          }
        ]
      },
      {
        "id": "explanatory-no-ndesu-6",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "explanatory-no-ndesu",
        "conceptId": "explanatory-no-ndesu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.explanatory-no-ndesu-6.prompt",
        "successKey": "grammar.v2.explanatory-no-ndesu-6.explanation",
        "errorKey": "grammar.v2.explanatory-no-ndesu-6.explanation",
        "options": [
          {
            "id": "explanatory-no-ndesu-6-option-0",
            "textKey": "grammar.v2.explanatory-no-ndesu-6.option.0",
            "feedbackKey": "grammar.v2.explanatory-no-ndesu-6.feedback.0",
            "grammarStatus": "invalid"
          },
          {
            "id": "explanatory-no-ndesu-6-option-1",
            "textKey": "grammar.v2.explanatory-no-ndesu-6.option.1",
            "feedbackKey": "grammar.v2.explanatory-no-ndesu-6.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "explanatory-no-ndesu-6-option-2",
            "textKey": "grammar.v2.explanatory-no-ndesu-6.option.2",
            "feedbackKey": "grammar.v2.explanatory-no-ndesu-6.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.explanatory-no-ndesu-6.option.0",
          "grammar.v2.explanatory-no-ndesu-6.option.1",
          "grammar.v2.explanatory-no-ndesu-6.option.2"
        ],
        "answer": 0
      },
      {
        "id": "explanatory-no-ndesu-7",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "explanatory-no-ndesu",
        "conceptId": "explanatory-no-ndesu",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.explanatory-no-ndesu-7.prompt",
        "successKey": "grammar.v2.explanatory-no-ndesu-7.explanation",
        "errorKey": "grammar.v2.explanatory-no-ndesu-7.explanation",
        "options": [
          {
            "id": "explanatory-no-ndesu-7-option-0",
            "textKey": "grammar.v2.explanatory-no-ndesu-7.option.0",
            "feedbackKey": "grammar.v2.explanatory-no-ndesu-7.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "explanatory-no-ndesu-7-option-1",
            "textKey": "grammar.v2.explanatory-no-ndesu-7.option.1",
            "feedbackKey": "grammar.v2.explanatory-no-ndesu-7.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.explanatory-no-ndesu-7.option.0",
          "grammar.v2.explanatory-no-ndesu-7.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "casual-question-no",
    "level": "N5",
    "track": "core",
    "topicId": "06",
    "order": 4,
    "titleKey": "grammar.v2.casual-question-no.title",
    "summaryKey": "grammar.v2.casual-question-no.summary",
    "goalKey": "grammar.v2.casual-question-no.goal",
    "prerequisiteIds": [
      "explanatory-no-ndesu",
      "question-ka"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.casual-question-no.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "行く / 高い + の？"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生 / 静か + な + の？"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "行かなかった / 学生じゃない / 学生だった + の？"
        }
      ],
      "examples": [
        {
          "japanese": "明日行くの？",
          "reading": "あしたいくの？",
          "meaningKey": "grammar.v2.casual-question-no.example.0"
        },
        {
          "japanese": "高いの？",
          "reading": "たかいの？",
          "meaningKey": "grammar.v2.casual-question-no.example.1"
        },
        {
          "japanese": "学生なの？",
          "reading": "がくせいなの？",
          "meaningKey": "grammar.v2.casual-question-no.example.2"
        },
        {
          "japanese": "静かなの？",
          "reading": "しずかなの？",
          "meaningKey": "grammar.v2.casual-question-no.example.3"
        },
        {
          "japanese": "学生じゃないの？",
          "reading": "がくせいじゃないの？",
          "meaningKey": "grammar.v2.casual-question-no.example.4"
        },
        {
          "japanese": "行かなかったの？",
          "reading": "いかなかったの？",
          "meaningKey": "grammar.v2.casual-question-no.example.5"
        },
        {
          "japanese": "学生だったの？",
          "reading": "がくせいだったの？",
          "meaningKey": "grammar.v2.casual-question-no.example.6"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.casual-question-no.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.casual-question-no.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "学生じゃないなの？",
          "correction": "学生じゃないの？",
          "explanationKey": "grammar.v2.casual-question-no.mistake.0"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.clauses.noContrast.caption",
          "headerKeys": [
            "grammar.v2.clauses.noContrast.header.0"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.clauses.noContrast.row.0",
              "cells": [
                "本を読むのが好きだ。"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.noContrast.row.1",
              "cells": [
                "本を読むんです。"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.noContrast.row.2",
              "cells": [
                "本を読むの？"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "casual-question-no-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "casual-question-no",
        "conceptId": "casual-question-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.casual-question-no-1.prompt",
        "successKey": "grammar.v2.casual-question-no-1.explanation",
        "errorKey": "grammar.v2.casual-question-no-1.explanation",
        "acceptedAnswers": [
          "の"
        ],
        "solutionKey": "grammar.v2.casual-question-no-1.solution",
        "kanaBank": [
          "へ",
          "ま",
          "だ",
          "で",
          "に",
          "の"
        ]
      },
      {
        "id": "casual-question-no-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "casual-question-no",
        "conceptId": "casual-question-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.casual-question-no-2.prompt",
        "successKey": "grammar.v2.casual-question-no-2.explanation",
        "errorKey": "grammar.v2.casual-question-no-2.explanation",
        "acceptedAnswers": [
          "の"
        ],
        "solutionKey": "grammar.v2.casual-question-no-2.solution",
        "kanaBank": [
          "が",
          "く",
          "え",
          "か",
          "い",
          "の"
        ]
      },
      {
        "id": "casual-question-no-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "casual-question-no",
        "conceptId": "casual-question-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.casual-question-no-3.prompt",
        "successKey": "grammar.v2.casual-question-no-3.explanation",
        "errorKey": "grammar.v2.casual-question-no-3.explanation",
        "acceptedAnswers": [
          "なの"
        ],
        "solutionKey": "grammar.v2.casual-question-no-3.solution",
        "kanaBank": [
          "の",
          "な",
          "ら",
          "や",
          "も",
          "ゃ"
        ]
      },
      {
        "id": "casual-question-no-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "casual-question-no",
        "conceptId": "casual-question-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.casual-question-no-4.prompt",
        "successKey": "grammar.v2.casual-question-no-4.explanation",
        "errorKey": "grammar.v2.casual-question-no-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.casual-question-no-4.left.0",
            "rightKey": "grammar.v2.casual-question-no-4.right.0"
          },
          {
            "leftKey": "grammar.v2.casual-question-no-4.left.1",
            "rightKey": "grammar.v2.casual-question-no-4.right.1"
          },
          {
            "leftKey": "grammar.v2.casual-question-no-4.left.2",
            "rightKey": "grammar.v2.casual-question-no-4.right.2"
          },
          {
            "leftKey": "grammar.v2.casual-question-no-4.left.3",
            "rightKey": "grammar.v2.casual-question-no-4.right.3"
          }
        ]
      },
      {
        "id": "casual-question-no-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "casual-question-no",
        "conceptId": "casual-question-no",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.casual-question-no-5.prompt",
        "successKey": "grammar.v2.casual-question-no-5.explanation",
        "errorKey": "grammar.v2.casual-question-no-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.casual-question-no-5.left.0",
            "rightKey": "grammar.v2.casual-question-no-5.right.0"
          },
          {
            "leftKey": "grammar.v2.casual-question-no-5.left.1",
            "rightKey": "grammar.v2.casual-question-no-5.right.1"
          },
          {
            "leftKey": "grammar.v2.casual-question-no-5.left.2",
            "rightKey": "grammar.v2.casual-question-no-5.right.2"
          }
        ]
      }
    ]
  },
  {
    "id": "quotation-to",
    "level": "N5",
    "track": "core",
    "topicId": "06",
    "order": 5,
    "titleKey": "grammar.v2.quotation-to.title",
    "summaryKey": "grammar.v2.quotation-to.summary",
    "goalKey": "grammar.v2.quotation-to.goal",
    "prerequisiteIds": [
      "plain-vs-polite",
      "da-vs-desu",
      "particle-to-companion"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.quotation-to.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "「明日行く」 + と + 言う"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "明日行く + と + 思う"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "学生だ / 静かだ + と + 思う"
        }
      ],
      "examples": [
        {
          "japanese": "「ありがとう」と言った。",
          "reading": "「ありがとう」といった。",
          "meaningKey": "grammar.v2.quotation-to.example.0"
        },
        {
          "japanese": "「明日行きます」と言った。",
          "reading": "「あしたいきます」といった。",
          "meaningKey": "grammar.v2.quotation-to.example.1"
        },
        {
          "japanese": "「学生です」と言った。",
          "reading": "「がくせいです」といった。",
          "meaningKey": "grammar.v2.quotation-to.example.2"
        },
        {
          "japanese": "明日行くと思う。",
          "reading": "あしたいくとおもう。",
          "meaningKey": "grammar.v2.quotation-to.example.3"
        },
        {
          "japanese": "この本は高いと思う。",
          "reading": "このほんはたかいとおもう。",
          "meaningKey": "grammar.v2.quotation-to.example.4"
        },
        {
          "japanese": "学生だと思う。",
          "reading": "がくせいだとおもう。",
          "meaningKey": "grammar.v2.quotation-to.example.5"
        },
        {
          "japanese": "静かだと思う。",
          "reading": "しずかだとおもう。",
          "meaningKey": "grammar.v2.quotation-to.example.6"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.quotation-to.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.quotation-to.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.clauses.quotation.caption",
          "headerKeys": [
            "grammar.v2.clauses.quotation.header.0"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.clauses.quotation.row.0",
              "cells": [
                "友達と行く。"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.quotation.row.1",
              "cells": [
                "「学生です」と言った。"
              ]
            },
            {
              "labelKey": "grammar.v2.clauses.quotation.row.2",
              "cells": [
                "学生だと思う。"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "quotation-to-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "06",
        "lessonId": "quotation-to",
        "conceptId": "quotation-to",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.quotation-to-1.prompt",
        "successKey": "grammar.v2.quotation-to-1.explanation",
        "errorKey": "grammar.v2.quotation-to-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.quotation-to-1.left.0",
            "rightKey": "grammar.v2.quotation-to-1.right.0"
          },
          {
            "leftKey": "grammar.v2.quotation-to-1.left.1",
            "rightKey": "grammar.v2.quotation-to-1.right.1"
          }
        ]
      },
      {
        "id": "quotation-to-2",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "quotation-to",
        "conceptId": "quotation-to",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.quotation-to-2.prompt",
        "successKey": "grammar.v2.quotation-to-2.explanation",
        "errorKey": "grammar.v2.quotation-to-2.explanation",
        "tokenKeys": [
          "grammar.v2.quotation-to-2.token.0",
          "grammar.v2.quotation-to-2.token.1",
          "grammar.v2.quotation-to-2.token.2"
        ],
        "solution": [
          2,
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "quotation-to-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "quotation-to",
        "conceptId": "quotation-to",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.quotation-to-3.prompt",
        "successKey": "grammar.v2.quotation-to-3.explanation",
        "errorKey": "grammar.v2.quotation-to-3.explanation",
        "options": [
          {
            "id": "quotation-to-3-option-0",
            "textKey": "grammar.v2.quotation-to-3.option.0",
            "feedbackKey": "grammar.v2.quotation-to-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "quotation-to-3-option-1",
            "textKey": "grammar.v2.quotation-to-3.option.1",
            "feedbackKey": "grammar.v2.quotation-to-3.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.quotation-to-3.option.0",
          "grammar.v2.quotation-to-3.option.1"
        ],
        "answer": 0
      },
      {
        "id": "quotation-to-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "quotation-to",
        "conceptId": "quotation-to",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.quotation-to-4.prompt",
        "successKey": "grammar.v2.quotation-to-4.explanation",
        "errorKey": "grammar.v2.quotation-to-4.explanation",
        "acceptedAnswers": [
          "だ"
        ],
        "solutionKey": "grammar.v2.quotation-to-4.solution",
        "kanaBank": [
          "の",
          "は",
          "な",
          "に",
          "と",
          "だ"
        ]
      },
      {
        "id": "quotation-to-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "quotation-to",
        "conceptId": "quotation-to",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.quotation-to-5.prompt",
        "successKey": "grammar.v2.quotation-to-5.explanation",
        "errorKey": "grammar.v2.quotation-to-5.explanation",
        "acceptedAnswers": [
          "だ"
        ],
        "solutionKey": "grammar.v2.quotation-to-5.solution",
        "kanaBank": [
          "へ",
          "ま",
          "に",
          "な",
          "と",
          "だ"
        ]
      },
      {
        "id": "quotation-to-6",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "quotation-to",
        "conceptId": "quotation-to",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.quotation-to-6.prompt",
        "successKey": "grammar.v2.quotation-to-6.explanation",
        "errorKey": "grammar.v2.quotation-to-6.explanation",
        "tokenKeys": [
          "grammar.v2.quotation-to-6.token.0",
          "grammar.v2.quotation-to-6.token.1",
          "grammar.v2.quotation-to-6.token.2",
          "grammar.v2.quotation-to-6.token.3"
        ],
        "solution": [
          1,
          3,
          2,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "quotation-to-7",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "06",
        "lessonId": "quotation-to",
        "conceptId": "quotation-to",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic06",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.quotation-to-7.prompt",
        "successKey": "grammar.v2.quotation-to-7.explanation",
        "errorKey": "grammar.v2.quotation-to-7.explanation",
        "options": [
          {
            "id": "quotation-to-7-option-0",
            "textKey": "grammar.v2.quotation-to-7.option.0",
            "feedbackKey": "grammar.v2.quotation-to-7.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "quotation-to-7-option-1",
            "textKey": "grammar.v2.quotation-to-7.option.1",
            "feedbackKey": "grammar.v2.quotation-to-7.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.quotation-to-7.option.0",
          "grammar.v2.quotation-to-7.option.1"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "te-form-formation",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 1,
    "titleKey": "grammar.v2.te-form-formation.title",
    "summaryKey": "grammar.v2.te-form-formation.summary",
    "goalKey": "grammar.v2.te-form-formation.goal",
    "prerequisiteIds": [
      "verb-past-plain",
      "verb-ichidan",
      "verb-godan",
      "verb-irregular-suru-kuru"
    ],
    "relatedIds": [
      "te-action-sequence",
      "te-iru-progressive",
      "te-kudasai",
      "te-mo-ii"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.te-form-formation.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "た ↔ て / だ ↔ で"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べた → 食べて / 読んだ → 読んで"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "う・つ・る → って / む・ぶ・ぬ → んで"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "く → いて / ぐ → いで / す → して"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "行く → 行って / する → して / 来る → 来て"
        }
      ],
      "examples": [
        {
          "japanese": "食べる → 食べて",
          "reading": "たべる → たべて",
          "meaningKey": "grammar.v2.te-form-formation.example.0"
        },
        {
          "japanese": "帰る → 帰って",
          "reading": "かえる → かえって",
          "meaningKey": "grammar.v2.te-form-formation.example.1"
        },
        {
          "japanese": "読む → 読んだ → 読んで",
          "reading": "よむ → よんだ → よんで",
          "meaningKey": "grammar.v2.te-form-formation.example.2"
        },
        {
          "japanese": "来る → 来て",
          "reading": "くる → きて",
          "meaningKey": "grammar.v2.te-form-formation.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-form-formation.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-form-formation.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "食べって",
          "correction": "食べて",
          "explanationKey": "grammar.v2.te-form-formation.mistake.0"
        },
        {
          "wrong": "飲みて",
          "correction": "飲んで",
          "explanationKey": "grammar.v2.te-form-formation.mistake.1"
        },
        {
          "wrong": "行いて",
          "correction": "行って",
          "explanationKey": "grammar.v2.te-form-formation.mistake.2"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.te.formation.caption",
          "headerKeys": [
            "grammar.v2.te.formation.header.0",
            "grammar.v2.te.formation.header.1",
            "grammar.v2.te.formation.header.2"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.te.formation.row.0",
              "cells": [
                "食べる",
                "食べた",
                "食べて"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.1",
              "cells": [
                "見る",
                "見た",
                "見て"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.2",
              "cells": [
                "起きる",
                "起きた",
                "起きて"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.3",
              "cells": [
                "買う",
                "買った",
                "買って"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.4",
              "cells": [
                "待つ",
                "待った",
                "待って"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.5",
              "cells": [
                "帰る",
                "帰った",
                "帰って"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.6",
              "cells": [
                "飲む",
                "飲んだ",
                "飲んで"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.7",
              "cells": [
                "遊ぶ",
                "遊んだ",
                "遊んで"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.8",
              "cells": [
                "死ぬ",
                "死んだ",
                "死んで"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.9",
              "cells": [
                "書く",
                "書いた",
                "書いて"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.10",
              "cells": [
                "聞く",
                "聞いた",
                "聞いて"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.11",
              "cells": [
                "泳ぐ",
                "泳いだ",
                "泳いで"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.12",
              "cells": [
                "急ぐ",
                "急いだ",
                "急いで"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.13",
              "cells": [
                "話す",
                "話した",
                "話して"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.14",
              "cells": [
                "消す",
                "消した",
                "消して"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.15",
              "cells": [
                "行く",
                "行った",
                "行って"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.16",
              "cells": [
                "する",
                "した",
                "して"
              ]
            },
            {
              "labelKey": "grammar.v2.te.formation.row.17",
              "cells": [
                "来る",
                "来た",
                "来て"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "te-form-formation-1",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-1.prompt",
        "successKey": "grammar.v2.te-form-formation-1.explanation",
        "errorKey": "grammar.v2.te-form-formation-1.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-1.left.0",
            "rightKey": "grammar.v2.te-form-formation-1.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-1.left.1",
            "rightKey": "grammar.v2.te-form-formation-1.right.1"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-1.left.2",
            "rightKey": "grammar.v2.te-form-formation-1.right.2"
          }
        ]
      },
      {
        "id": "te-form-formation-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-2.prompt",
        "successKey": "grammar.v2.te-form-formation-2.explanation",
        "errorKey": "grammar.v2.te-form-formation-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-2.left.0",
            "rightKey": "grammar.v2.te-form-formation-2.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-2.left.1",
            "rightKey": "grammar.v2.te-form-formation-2.right.1"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-2.left.2",
            "rightKey": "grammar.v2.te-form-formation-2.right.2"
          }
        ]
      },
      {
        "id": "te-form-formation-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-3.prompt",
        "successKey": "grammar.v2.te-form-formation-3.explanation",
        "errorKey": "grammar.v2.te-form-formation-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-3.left.0",
            "rightKey": "grammar.v2.te-form-formation-3.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-3.left.1",
            "rightKey": "grammar.v2.te-form-formation-3.right.1"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-3.left.2",
            "rightKey": "grammar.v2.te-form-formation-3.right.2"
          }
        ]
      },
      {
        "id": "te-form-formation-4",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-4.prompt",
        "successKey": "grammar.v2.te-form-formation-4.explanation",
        "errorKey": "grammar.v2.te-form-formation-4.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-4.left.0",
            "rightKey": "grammar.v2.te-form-formation-4.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-4.left.1",
            "rightKey": "grammar.v2.te-form-formation-4.right.1"
          }
        ]
      },
      {
        "id": "te-form-formation-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-5.prompt",
        "successKey": "grammar.v2.te-form-formation-5.explanation",
        "errorKey": "grammar.v2.te-form-formation-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-5.left.0",
            "rightKey": "grammar.v2.te-form-formation-5.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-5.left.1",
            "rightKey": "grammar.v2.te-form-formation-5.right.1"
          }
        ]
      },
      {
        "id": "te-form-formation-6",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-6.prompt",
        "successKey": "grammar.v2.te-form-formation-6.explanation",
        "errorKey": "grammar.v2.te-form-formation-6.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-6.left.0",
            "rightKey": "grammar.v2.te-form-formation-6.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-6.left.1",
            "rightKey": "grammar.v2.te-form-formation-6.right.1"
          }
        ]
      },
      {
        "id": "te-form-formation-7",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-form-formation-7.prompt",
        "successKey": "grammar.v2.te-form-formation-7.explanation",
        "errorKey": "grammar.v2.te-form-formation-7.explanation",
        "acceptedAnswers": [
          "行って"
        ],
        "solutionKey": "grammar.v2.te-form-formation-7.solution",
        "kanaBank": [
          "れ",
          "ら",
          "る",
          "行",
          "て",
          "っ"
        ]
      },
      {
        "id": "te-form-formation-8",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-8.prompt",
        "successKey": "grammar.v2.te-form-formation-8.explanation",
        "errorKey": "grammar.v2.te-form-formation-8.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-8.left.0",
            "rightKey": "grammar.v2.te-form-formation-8.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-8.left.1",
            "rightKey": "grammar.v2.te-form-formation-8.right.1"
          }
        ]
      },
      {
        "id": "te-form-formation-9",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-form-formation-9.prompt",
        "successKey": "grammar.v2.te-form-formation-9.explanation",
        "errorKey": "grammar.v2.te-form-formation-9.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.0",
            "rightKey": "grammar.v2.te-form-formation-9.right.0"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.1",
            "rightKey": "grammar.v2.te-form-formation-9.right.1"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.2",
            "rightKey": "grammar.v2.te-form-formation-9.right.2"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.3",
            "rightKey": "grammar.v2.te-form-formation-9.right.3"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.4",
            "rightKey": "grammar.v2.te-form-formation-9.right.4"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.5",
            "rightKey": "grammar.v2.te-form-formation-9.right.5"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.6",
            "rightKey": "grammar.v2.te-form-formation-9.right.6"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.7",
            "rightKey": "grammar.v2.te-form-formation-9.right.7"
          },
          {
            "leftKey": "grammar.v2.te-form-formation-9.left.8",
            "rightKey": "grammar.v2.te-form-formation-9.right.8"
          }
        ]
      },
      {
        "id": "te-form-formation-10",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-form-formation",
        "conceptId": "te-form-formation",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.te-form-formation-10.prompt",
        "successKey": "grammar.v2.te-form-formation-10.explanation",
        "errorKey": "grammar.v2.te-form-formation-10.explanation",
        "options": [
          {
            "id": "te-form-formation-10-option-0",
            "textKey": "grammar.v2.te-form-formation-10.option.0",
            "feedbackKey": "grammar.v2.te-form-formation-10.feedback.0",
            "grammarStatus": "invalid"
          },
          {
            "id": "te-form-formation-10-option-1",
            "textKey": "grammar.v2.te-form-formation-10.option.1",
            "feedbackKey": "grammar.v2.te-form-formation-10.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "te-form-formation-10-option-2",
            "textKey": "grammar.v2.te-form-formation-10.option.2",
            "feedbackKey": "grammar.v2.te-form-formation-10.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-form-formation-10.option.0",
          "grammar.v2.te-form-formation-10.option.1",
          "grammar.v2.te-form-formation-10.option.2"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "te-action-sequence",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 2,
    "titleKey": "grammar.v2.te-action-sequence.title",
    "summaryKey": "grammar.v2.te-action-sequence.summary",
    "goalKey": "grammar.v2.te-action-sequence.goal",
    "prerequisiteIds": [
      "te-form-formation"
    ],
    "relatedIds": [
      "te-kara"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.te-action-sequence.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "朝ご飯を食べて、学校に行く。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "本を読んで、寝る。 / 寝た。 / 寝ました。"
        }
      ],
      "examples": [
        {
          "japanese": "朝ご飯を食べて、学校に行く。",
          "reading": "あさごはんをたべて、がっこうにいく。",
          "meaningKey": "grammar.v2.te-action-sequence.example.0"
        },
        {
          "japanese": "本を読んで、寝た。",
          "reading": "ほんをよんで、ねた。",
          "meaningKey": "grammar.v2.te-action-sequence.example.1"
        },
        {
          "japanese": "お茶を飲んで、家に帰りました。",
          "reading": "おちゃをのんで、いえにかえりました。",
          "meaningKey": "grammar.v2.te-action-sequence.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-action-sequence.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-action-sequence.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.te.sequence.caption",
          "headerKeys": [
            "grammar.v2.te.sequence.header.0"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.te.sequence.row.0",
              "cells": [
                "本を読んで、寝る。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.sequence.row.1",
              "cells": [
                "本を読んで、寝た。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.sequence.row.2",
              "cells": [
                "本を読んで、寝ました。"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "te-action-sequence-1",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-action-sequence",
        "conceptId": "te-action-sequence",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.te-action-sequence-1.prompt",
        "successKey": "grammar.v2.te-action-sequence-1.explanation",
        "errorKey": "grammar.v2.te-action-sequence-1.explanation",
        "tokenKeys": [
          "grammar.v2.te-action-sequence-1.token.0",
          "grammar.v2.te-action-sequence-1.token.1",
          "grammar.v2.te-action-sequence-1.token.2"
        ],
        "solution": [
          1,
          2,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "te-action-sequence-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-action-sequence",
        "conceptId": "te-action-sequence",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-action-sequence-2.prompt",
        "successKey": "grammar.v2.te-action-sequence-2.explanation",
        "errorKey": "grammar.v2.te-action-sequence-2.explanation",
        "acceptedAnswers": [
          "読んで"
        ],
        "solutionKey": "grammar.v2.te-action-sequence-2.solution",
        "kanaBank": [
          "う",
          "い",
          "か",
          "で",
          "ん",
          "読"
        ]
      },
      {
        "id": "te-action-sequence-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-action-sequence",
        "conceptId": "te-action-sequence",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-action-sequence-3.prompt",
        "successKey": "grammar.v2.te-action-sequence-3.explanation",
        "errorKey": "grammar.v2.te-action-sequence-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-action-sequence-3.left.0",
            "rightKey": "grammar.v2.te-action-sequence-3.right.0"
          },
          {
            "leftKey": "grammar.v2.te-action-sequence-3.left.1",
            "rightKey": "grammar.v2.te-action-sequence-3.right.1"
          },
          {
            "leftKey": "grammar.v2.te-action-sequence-3.left.2",
            "rightKey": "grammar.v2.te-action-sequence-3.right.2"
          }
        ]
      },
      {
        "id": "te-action-sequence-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-action-sequence",
        "conceptId": "te-action-sequence",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-action-sequence-4.prompt",
        "successKey": "grammar.v2.te-action-sequence-4.explanation",
        "errorKey": "grammar.v2.te-action-sequence-4.explanation",
        "options": [
          {
            "id": "te-action-sequence-4-option-0",
            "textKey": "grammar.v2.te-action-sequence-4.option.0",
            "feedbackKey": "grammar.v2.te-action-sequence-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "te-action-sequence-4-option-1",
            "textKey": "grammar.v2.te-action-sequence-4.option.1",
            "feedbackKey": "grammar.v2.te-action-sequence-4.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-action-sequence-4.option.0",
          "grammar.v2.te-action-sequence-4.option.1"
        ],
        "answer": 0
      },
      {
        "id": "te-action-sequence-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-action-sequence",
        "conceptId": "te-action-sequence",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-action-sequence-5.prompt",
        "successKey": "grammar.v2.te-action-sequence-5.explanation",
        "errorKey": "grammar.v2.te-action-sequence-5.explanation",
        "acceptedAnswers": [
          "飲んで"
        ],
        "solutionKey": "grammar.v2.te-action-sequence-5.solution",
        "kanaBank": [
          "ん",
          "を",
          "ら",
          "る",
          "で",
          "飲"
        ]
      }
    ]
  },
  {
    "id": "te-iru-progressive",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 3,
    "titleKey": "grammar.v2.te-iru-progressive.title",
    "summaryKey": "grammar.v2.te-iru-progressive.summary",
    "goalKey": "grammar.v2.te-iru-progressive.goal",
    "prerequisiteIds": [
      "te-form-formation",
      "existence-aru-iru",
      "plain-vs-polite"
    ],
    "relatedIds": [
      "te-iru-result-state"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.te-iru-progressive.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "読む → 読んで → 読んでいる"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "読んでいる ↔ 読んでいます"
        }
      ],
      "examples": [
        {
          "japanese": "今、本を読んでいる。",
          "reading": "いま、ほんをよんでいる。",
          "meaningKey": "grammar.v2.te-iru-progressive.example.0"
        },
        {
          "japanese": "音楽を聞いている。",
          "reading": "おんがくをきいている。",
          "meaningKey": "grammar.v2.te-iru-progressive.example.1"
        },
        {
          "japanese": "映画を見ています。",
          "reading": "えいがをみています。",
          "meaningKey": "grammar.v2.te-iru-progressive.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-iru-progressive.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-iru-progressive.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "te-iru-progressive-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-progressive",
        "conceptId": "te-iru-progressive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-iru-progressive-1.prompt",
        "successKey": "grammar.v2.te-iru-progressive-1.explanation",
        "errorKey": "grammar.v2.te-iru-progressive-1.explanation",
        "acceptedAnswers": [
          "読んでいる"
        ],
        "solutionKey": "grammar.v2.te-iru-progressive-1.solution",
        "kanaBank": [
          "く",
          "え",
          "読",
          "ん",
          "る",
          "で",
          "い"
        ]
      },
      {
        "id": "te-iru-progressive-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-progressive",
        "conceptId": "te-iru-progressive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-iru-progressive-2.prompt",
        "successKey": "grammar.v2.te-iru-progressive-2.explanation",
        "errorKey": "grammar.v2.te-iru-progressive-2.explanation",
        "acceptedAnswers": [
          "読んでいます"
        ],
        "solutionKey": "grammar.v2.te-iru-progressive-2.solution",
        "kanaBank": [
          "る",
          "ら",
          "ん",
          "読",
          "い",
          "す",
          "で",
          "ま"
        ]
      },
      {
        "id": "te-iru-progressive-3",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-progressive",
        "conceptId": "te-iru-progressive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.te-iru-progressive-3.prompt",
        "successKey": "grammar.v2.te-iru-progressive-3.explanation",
        "errorKey": "grammar.v2.te-iru-progressive-3.explanation",
        "tokenKeys": [
          "grammar.v2.te-iru-progressive-3.token.0",
          "grammar.v2.te-iru-progressive-3.token.1",
          "grammar.v2.te-iru-progressive-3.token.2"
        ],
        "solution": [
          1,
          2,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "te-iru-progressive-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-progressive",
        "conceptId": "te-iru-progressive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-iru-progressive-4.prompt",
        "successKey": "grammar.v2.te-iru-progressive-4.explanation",
        "errorKey": "grammar.v2.te-iru-progressive-4.explanation",
        "options": [
          {
            "id": "te-iru-progressive-4-option-0",
            "textKey": "grammar.v2.te-iru-progressive-4.option.0",
            "feedbackKey": "grammar.v2.te-iru-progressive-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "te-iru-progressive-4-option-1",
            "textKey": "grammar.v2.te-iru-progressive-4.option.1",
            "feedbackKey": "grammar.v2.te-iru-progressive-4.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-iru-progressive-4.option.0",
          "grammar.v2.te-iru-progressive-4.option.1"
        ],
        "answer": 0
      },
      {
        "id": "te-iru-progressive-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-iru-progressive",
        "conceptId": "te-iru-progressive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-iru-progressive-5.prompt",
        "successKey": "grammar.v2.te-iru-progressive-5.explanation",
        "errorKey": "grammar.v2.te-iru-progressive-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-iru-progressive-5.left.0",
            "rightKey": "grammar.v2.te-iru-progressive-5.right.0"
          },
          {
            "leftKey": "grammar.v2.te-iru-progressive-5.left.1",
            "rightKey": "grammar.v2.te-iru-progressive-5.right.1"
          }
        ]
      },
      {
        "id": "te-iru-progressive-6",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-progressive",
        "conceptId": "te-iru-progressive",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-iru-progressive-6.prompt",
        "successKey": "grammar.v2.te-iru-progressive-6.explanation",
        "errorKey": "grammar.v2.te-iru-progressive-6.explanation",
        "acceptedAnswers": [
          "見ています"
        ],
        "solutionKey": "grammar.v2.te-iru-progressive-6.solution",
        "kanaBank": [
          "を",
          "ん",
          "見",
          "す",
          "い",
          "ま",
          "て"
        ]
      }
    ]
  },
  {
    "id": "te-iru-result-state",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 4,
    "titleKey": "grammar.v2.te-iru-result-state.title",
    "summaryKey": "grammar.v2.te-iru-result-state.summary",
    "goalKey": "grammar.v2.te-iru-result-state.goal",
    "prerequisiteIds": [
      "te-iru-progressive"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.te-iru-result-state.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "住む → 住んでいる"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "結婚する → 結婚している"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "知る → 知っている"
        }
      ],
      "examples": [
        {
          "japanese": "田中さんは結婚している。",
          "reading": "たなかさんはけっこんしている。",
          "meaningKey": "grammar.v2.te-iru-result-state.example.0"
        },
        {
          "japanese": "日本に住んでいる。",
          "reading": "にほんにすんでいる。",
          "meaningKey": "grammar.v2.te-iru-result-state.example.1"
        },
        {
          "japanese": "知っている。",
          "reading": "しっている。",
          "meaningKey": "grammar.v2.te-iru-result-state.example.2"
        },
        {
          "japanese": "大阪に住んでいる。",
          "reading": "おおさかにすんでいる。",
          "meaningKey": "grammar.v2.te-iru-result-state.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-iru-result-state.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-iru-result-state.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.te.iruContrast.caption",
          "headerKeys": [
            "grammar.v2.te.iruContrast.header.0"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.te.iruContrast.row.0",
              "cells": [
                "今、本を読んでいる。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.iruContrast.row.1",
              "cells": [
                "大阪に住んでいる。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.iruContrast.row.2",
              "cells": [
                "田中さんは結婚している。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.iruContrast.row.3",
              "cells": [
                "知っている。"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "te-iru-result-state-1",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-iru-result-state",
        "conceptId": "te-iru-result-state",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-iru-result-state-1.prompt",
        "successKey": "grammar.v2.te-iru-result-state-1.explanation",
        "errorKey": "grammar.v2.te-iru-result-state-1.explanation",
        "options": [
          {
            "id": "te-iru-result-state-1-option-0",
            "textKey": "grammar.v2.te-iru-result-state-1.option.0",
            "feedbackKey": "grammar.v2.te-iru-result-state-1.feedback.0"
          },
          {
            "id": "te-iru-result-state-1-option-1",
            "textKey": "grammar.v2.te-iru-result-state-1.option.1",
            "feedbackKey": "grammar.v2.te-iru-result-state-1.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-iru-result-state-1.option.0",
          "grammar.v2.te-iru-result-state-1.option.1"
        ],
        "answer": 0
      },
      {
        "id": "te-iru-result-state-2",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-iru-result-state",
        "conceptId": "te-iru-result-state",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-iru-result-state-2.prompt",
        "successKey": "grammar.v2.te-iru-result-state-2.explanation",
        "errorKey": "grammar.v2.te-iru-result-state-2.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-iru-result-state-2.left.0",
            "rightKey": "grammar.v2.te-iru-result-state-2.right.0"
          },
          {
            "leftKey": "grammar.v2.te-iru-result-state-2.left.1",
            "rightKey": "grammar.v2.te-iru-result-state-2.right.1"
          }
        ]
      },
      {
        "id": "te-iru-result-state-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-result-state",
        "conceptId": "te-iru-result-state",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-iru-result-state-3.prompt",
        "successKey": "grammar.v2.te-iru-result-state-3.explanation",
        "errorKey": "grammar.v2.te-iru-result-state-3.explanation",
        "acceptedAnswers": [
          "結婚している"
        ],
        "solutionKey": "grammar.v2.te-iru-result-state-3.solution",
        "kanaBank": [
          "が",
          "く",
          "い",
          "婚",
          "し",
          "結",
          "て",
          "る"
        ]
      },
      {
        "id": "te-iru-result-state-4",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-result-state",
        "conceptId": "te-iru-result-state",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-iru-result-state-4.prompt",
        "successKey": "grammar.v2.te-iru-result-state-4.explanation",
        "errorKey": "grammar.v2.te-iru-result-state-4.explanation",
        "acceptedAnswers": [
          "知っている"
        ],
        "solutionKey": "grammar.v2.te-iru-result-state-4.solution",
        "kanaBank": [
          "れ",
          "る",
          "ら",
          "知",
          "て",
          "っ",
          "い"
        ]
      },
      {
        "id": "te-iru-result-state-5",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-iru-result-state",
        "conceptId": "te-iru-result-state",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-iru-result-state-5.prompt",
        "successKey": "grammar.v2.te-iru-result-state-5.explanation",
        "errorKey": "grammar.v2.te-iru-result-state-5.explanation",
        "options": [
          {
            "id": "te-iru-result-state-5-option-0",
            "textKey": "grammar.v2.te-iru-result-state-5.option.0",
            "feedbackKey": "grammar.v2.te-iru-result-state-5.feedback.0"
          },
          {
            "id": "te-iru-result-state-5-option-1",
            "textKey": "grammar.v2.te-iru-result-state-5.option.1",
            "feedbackKey": "grammar.v2.te-iru-result-state-5.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-iru-result-state-5.option.0",
          "grammar.v2.te-iru-result-state-5.option.1"
        ],
        "answer": 0
      },
      {
        "id": "te-iru-result-state-6",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-iru-result-state",
        "conceptId": "te-iru-result-state",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-iru-result-state-6.prompt",
        "successKey": "grammar.v2.te-iru-result-state-6.explanation",
        "errorKey": "grammar.v2.te-iru-result-state-6.explanation",
        "acceptedAnswers": [
          "住んでいる"
        ],
        "solutionKey": "grammar.v2.te-iru-result-state-6.solution",
        "kanaBank": [
          "を",
          "ん",
          "や",
          "る",
          "で",
          "い",
          "住"
        ]
      }
    ]
  },
  {
    "id": "te-kara",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 5,
    "titleKey": "grammar.v2.te-kara.title",
    "summaryKey": "grammar.v2.te-kara.summary",
    "goalKey": "grammar.v2.te-kara.goal",
    "prerequisiteIds": [
      "te-action-sequence"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.te-kara.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "ご飯を食べてから、勉強する。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "家に帰ってから、寝る。"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べてから、勉強しました。"
        }
      ],
      "examples": [
        {
          "japanese": "ご飯を食べてから、勉強する。",
          "reading": "ごはんをたべてから、べんきょうする。",
          "meaningKey": "grammar.v2.te-kara.example.0"
        },
        {
          "japanese": "家に帰ってから、寝る。",
          "reading": "いえにかえってから、ねる。",
          "meaningKey": "grammar.v2.te-kara.example.1"
        },
        {
          "japanese": "シャワーを浴びてから、勉強する。",
          "reading": "シャワーをあびてから、べんきょうする。",
          "meaningKey": "grammar.v2.te-kara.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-kara.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-kara.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "te-kara-1",
        "version": 2,
        "kind": "sentence-order",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-kara",
        "conceptId": "te-kara",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.te-kara-1.prompt",
        "successKey": "grammar.v2.te-kara-1.explanation",
        "errorKey": "grammar.v2.te-kara-1.explanation",
        "tokenKeys": [
          "grammar.v2.te-kara-1.token.0",
          "grammar.v2.te-kara-1.token.1",
          "grammar.v2.te-kara-1.token.2"
        ],
        "solution": [
          2,
          1,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "te-kara-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-kara",
        "conceptId": "te-kara",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-kara-2.prompt",
        "successKey": "grammar.v2.te-kara-2.explanation",
        "errorKey": "grammar.v2.te-kara-2.explanation",
        "acceptedAnswers": [
          "から"
        ],
        "solutionKey": "grammar.v2.te-kara-2.solution",
        "kanaBank": [
          "ら",
          "か",
          "し",
          "じ",
          "す",
          "た"
        ]
      },
      {
        "id": "te-kara-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-kara",
        "conceptId": "te-kara",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-kara-3.prompt",
        "successKey": "grammar.v2.te-kara-3.explanation",
        "errorKey": "grammar.v2.te-kara-3.explanation",
        "options": [
          {
            "id": "te-kara-3-option-0",
            "textKey": "grammar.v2.te-kara-3.option.0",
            "feedbackKey": "grammar.v2.te-kara-3.feedback.0"
          },
          {
            "id": "te-kara-3-option-1",
            "textKey": "grammar.v2.te-kara-3.option.1",
            "feedbackKey": "grammar.v2.te-kara-3.feedback.1"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-kara-3.option.0",
          "grammar.v2.te-kara-3.option.1"
        ],
        "answer": 0
      },
      {
        "id": "te-kara-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-kara",
        "conceptId": "te-kara",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-kara-4.prompt",
        "successKey": "grammar.v2.te-kara-4.explanation",
        "errorKey": "grammar.v2.te-kara-4.explanation",
        "options": [
          {
            "id": "te-kara-4-option-0",
            "textKey": "grammar.v2.te-kara-4.option.0",
            "feedbackKey": "grammar.v2.te-kara-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "te-kara-4-option-1",
            "textKey": "grammar.v2.te-kara-4.option.1",
            "feedbackKey": "grammar.v2.te-kara-4.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-kara-4.option.0",
          "grammar.v2.te-kara-4.option.1"
        ],
        "answer": 0
      },
      {
        "id": "te-kara-5",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-kara",
        "conceptId": "te-kara",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-kara-5.prompt",
        "successKey": "grammar.v2.te-kara-5.explanation",
        "errorKey": "grammar.v2.te-kara-5.explanation",
        "acceptedAnswers": [
          "から"
        ],
        "solutionKey": "grammar.v2.te-kara-5.solution",
        "kanaBank": [
          "ら",
          "か",
          "だ",
          "で",
          "へ",
          "ま"
        ]
      }
    ]
  },
  {
    "id": "te-kudasai",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 6,
    "titleKey": "grammar.v2.te-kudasai.title",
    "summaryKey": "grammar.v2.te-kudasai.summary",
    "goalKey": "grammar.v2.te-kudasai.goal",
    "prerequisiteIds": [
      "te-form-formation",
      "polite-verb-masu-system"
    ],
    "relatedIds": [
      "nai-de-kudasai"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.te-kudasai.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "見る → 見て + ください"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "書く → 書いて + ください"
        }
      ],
      "examples": [
        {
          "japanese": "見てください。",
          "reading": "みてください。",
          "meaningKey": "grammar.v2.te-kudasai.example.0"
        },
        {
          "japanese": "名前を書いてください。",
          "reading": "なまえをかいてください。",
          "meaningKey": "grammar.v2.te-kudasai.example.1"
        },
        {
          "japanese": "座ってください。",
          "reading": "すわってください。",
          "meaningKey": "grammar.v2.te-kudasai.example.2"
        },
        {
          "japanese": "水を飲んでください。",
          "reading": "みずをのんでください。",
          "meaningKey": "grammar.v2.te-kudasai.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-kudasai.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-kudasai.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "見るください。",
          "correction": "見てください。",
          "explanationKey": "grammar.v2.te-kudasai.mistake.0"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "te-kudasai-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-kudasai",
        "conceptId": "te-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-kudasai-1.prompt",
        "successKey": "grammar.v2.te-kudasai-1.explanation",
        "errorKey": "grammar.v2.te-kudasai-1.explanation",
        "acceptedAnswers": [
          "ください"
        ],
        "solutionKey": "grammar.v2.te-kudasai-1.solution",
        "kanaBank": [
          "で",
          "だ",
          "は",
          "い",
          "く",
          "さ"
        ]
      },
      {
        "id": "te-kudasai-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-kudasai",
        "conceptId": "te-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-kudasai-2.prompt",
        "successKey": "grammar.v2.te-kudasai-2.explanation",
        "errorKey": "grammar.v2.te-kudasai-2.explanation",
        "acceptedAnswers": [
          "書いてください"
        ],
        "solutionKey": "grammar.v2.te-kudasai-2.solution",
        "kanaBank": [
          "書",
          "い",
          "う",
          "え",
          "く",
          "さ",
          "だ",
          "て"
        ]
      },
      {
        "id": "te-kudasai-3",
        "version": 2,
        "kind": "sentence-builder",
        "skill": "ordering",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-kudasai",
        "conceptId": "te-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.order",
        "promptKey": "grammar.v2.te-kudasai-3.prompt",
        "successKey": "grammar.v2.te-kudasai-3.explanation",
        "errorKey": "grammar.v2.te-kudasai-3.explanation",
        "tokenKeys": [
          "grammar.v2.te-kudasai-3.token.0",
          "grammar.v2.te-kudasai-3.token.1",
          "grammar.v2.te-kudasai-3.token.2"
        ],
        "solution": [
          1,
          2,
          0
        ],
        "orderPolicy": "constrained"
      },
      {
        "id": "te-kudasai-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-kudasai",
        "conceptId": "te-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.te-kudasai-4.prompt",
        "successKey": "grammar.v2.te-kudasai-4.explanation",
        "errorKey": "grammar.v2.te-kudasai-4.explanation",
        "options": [
          {
            "id": "te-kudasai-4-option-0",
            "textKey": "grammar.v2.te-kudasai-4.option.0",
            "feedbackKey": "grammar.v2.te-kudasai-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "te-kudasai-4-option-1",
            "textKey": "grammar.v2.te-kudasai-4.option.1",
            "feedbackKey": "grammar.v2.te-kudasai-4.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "te-kudasai-4-option-2",
            "textKey": "grammar.v2.te-kudasai-4.option.2",
            "feedbackKey": "grammar.v2.te-kudasai-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-kudasai-4.option.0",
          "grammar.v2.te-kudasai-4.option.1",
          "grammar.v2.te-kudasai-4.option.2"
        ],
        "answer": 1
      }
    ]
  },
  {
    "id": "te-mo-ii",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 7,
    "titleKey": "grammar.v2.te-mo-ii.title",
    "summaryKey": "grammar.v2.te-mo-ii.summary",
    "goalKey": "grammar.v2.te-mo-ii.goal",
    "prerequisiteIds": [
      "te-form-formation",
      "adjective-ii-irregular",
      "question-ka"
    ],
    "relatedIds": [
      "te-wa-ikenai"
    ],
    "lesson": {
      "ideaKey": "grammar.v2.te-mo-ii.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "座る → 座って + もいい"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "撮る → 撮って + もいいですか"
        }
      ],
      "examples": [
        {
          "japanese": "ここに座ってもいい。",
          "reading": "ここにすわってもいい。",
          "meaningKey": "grammar.v2.te-mo-ii.example.0"
        },
        {
          "japanese": "写真を撮ってもいいです。",
          "reading": "しゃしんをとってもいいです。",
          "meaningKey": "grammar.v2.te-mo-ii.example.1"
        },
        {
          "japanese": "ここに座ってもいいですか。",
          "reading": "ここにすわってもいいですか。",
          "meaningKey": "grammar.v2.te-mo-ii.example.2"
        },
        {
          "japanese": "写真を撮ってもいいですか。",
          "reading": "しゃしんをとってもいいですか。",
          "meaningKey": "grammar.v2.te-mo-ii.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-mo-ii.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-mo-ii.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "食べるもいい。",
          "correction": "食べてもいい。",
          "explanationKey": "grammar.v2.te-mo-ii.mistake.0"
        }
      ],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "te-mo-ii-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-mo-ii",
        "conceptId": "te-mo-ii",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-mo-ii-1.prompt",
        "successKey": "grammar.v2.te-mo-ii-1.explanation",
        "errorKey": "grammar.v2.te-mo-ii-1.explanation",
        "acceptedAnswers": [
          "もいい"
        ],
        "solutionKey": "grammar.v2.te-mo-ii-1.solution",
        "kanaBank": [
          "ま",
          "へ",
          "の",
          "は",
          "い",
          "も"
        ]
      },
      {
        "id": "te-mo-ii-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-mo-ii",
        "conceptId": "te-mo-ii",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-mo-ii-2.prompt",
        "successKey": "grammar.v2.te-mo-ii-2.explanation",
        "errorKey": "grammar.v2.te-mo-ii-2.explanation",
        "acceptedAnswers": [
          "もいいですか"
        ],
        "solutionKey": "grammar.v2.te-mo-ii-2.solution",
        "kanaBank": [
          "と",
          "に",
          "で",
          "か",
          "い",
          "す",
          "も"
        ]
      },
      {
        "id": "te-mo-ii-3",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-mo-ii",
        "conceptId": "te-mo-ii",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-mo-ii-3.prompt",
        "successKey": "grammar.v2.te-mo-ii-3.explanation",
        "errorKey": "grammar.v2.te-mo-ii-3.explanation",
        "options": [
          {
            "id": "te-mo-ii-3-option-0",
            "textKey": "grammar.v2.te-mo-ii-3.option.0",
            "feedbackKey": "grammar.v2.te-mo-ii-3.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "te-mo-ii-3-option-1",
            "textKey": "grammar.v2.te-mo-ii-3.option.1",
            "feedbackKey": "grammar.v2.te-mo-ii-3.feedback.1",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-mo-ii-3.option.0",
          "grammar.v2.te-mo-ii-3.option.1"
        ],
        "answer": 0
      },
      {
        "id": "te-mo-ii-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-mo-ii",
        "conceptId": "te-mo-ii",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.te-mo-ii-4.prompt",
        "successKey": "grammar.v2.te-mo-ii-4.explanation",
        "errorKey": "grammar.v2.te-mo-ii-4.explanation",
        "options": [
          {
            "id": "te-mo-ii-4-option-0",
            "textKey": "grammar.v2.te-mo-ii-4.option.0",
            "feedbackKey": "grammar.v2.te-mo-ii-4.feedback.0",
            "grammarStatus": "invalid"
          },
          {
            "id": "te-mo-ii-4-option-1",
            "textKey": "grammar.v2.te-mo-ii-4.option.1",
            "feedbackKey": "grammar.v2.te-mo-ii-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "te-mo-ii-4-option-2",
            "textKey": "grammar.v2.te-mo-ii-4.option.2",
            "feedbackKey": "grammar.v2.te-mo-ii-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-mo-ii-4.option.0",
          "grammar.v2.te-mo-ii-4.option.1",
          "grammar.v2.te-mo-ii-4.option.2"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "te-wa-ikenai",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 8,
    "titleKey": "grammar.v2.te-wa-ikenai.title",
    "summaryKey": "grammar.v2.te-wa-ikenai.summary",
    "goalKey": "grammar.v2.te-wa-ikenai.goal",
    "prerequisiteIds": [
      "te-mo-ii"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.te-wa-ikenai.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べて + は + いけない"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "撮って + は + いけません"
        }
      ],
      "examples": [
        {
          "japanese": "食べてはいけない。",
          "reading": "たべてはいけない。",
          "meaningKey": "grammar.v2.te-wa-ikenai.example.0"
        },
        {
          "japanese": "ここで写真を撮ってはいけません。",
          "reading": "ここでしゃしんをとってはいけません。",
          "meaningKey": "grammar.v2.te-wa-ikenai.example.1"
        },
        {
          "japanese": "入ってはいけません。",
          "reading": "はいってはいけません。",
          "meaningKey": "grammar.v2.te-wa-ikenai.example.2"
        },
        {
          "japanese": "入ってはいけない。",
          "reading": "はいってはいけない。",
          "meaningKey": "grammar.v2.te-wa-ikenai.example.3"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.te-wa-ikenai.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.te-wa-ikenai.detail.1"
        }
      ],
      "mistakes": [],
      "contrasts": []
    },
    "exercises": [
      {
        "id": "te-wa-ikenai-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-wa-ikenai",
        "conceptId": "te-wa-ikenai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-wa-ikenai-1.prompt",
        "successKey": "grammar.v2.te-wa-ikenai-1.explanation",
        "errorKey": "grammar.v2.te-wa-ikenai-1.explanation",
        "acceptedAnswers": [
          "はいけません"
        ],
        "solutionKey": "grammar.v2.te-wa-ikenai-1.solution",
        "kanaBank": [
          "へ",
          "ま",
          "に",
          "は",
          "せ",
          "け",
          "い",
          "ん"
        ]
      },
      {
        "id": "te-wa-ikenai-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-wa-ikenai",
        "conceptId": "te-wa-ikenai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.te-wa-ikenai-2.prompt",
        "successKey": "grammar.v2.te-wa-ikenai-2.explanation",
        "errorKey": "grammar.v2.te-wa-ikenai-2.explanation",
        "acceptedAnswers": [
          "はいけない"
        ],
        "solutionKey": "grammar.v2.te-wa-ikenai-2.solution",
        "kanaBank": [
          "や",
          "も",
          "い",
          "け",
          "は",
          "な"
        ]
      },
      {
        "id": "te-wa-ikenai-3",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "te-wa-ikenai",
        "conceptId": "te-wa-ikenai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.te-wa-ikenai-3.prompt",
        "successKey": "grammar.v2.te-wa-ikenai-3.explanation",
        "errorKey": "grammar.v2.te-wa-ikenai-3.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.te-wa-ikenai-3.left.0",
            "rightKey": "grammar.v2.te-wa-ikenai-3.right.0"
          },
          {
            "leftKey": "grammar.v2.te-wa-ikenai-3.left.1",
            "rightKey": "grammar.v2.te-wa-ikenai-3.right.1"
          }
        ]
      },
      {
        "id": "te-wa-ikenai-4",
        "version": 2,
        "kind": "multiple-choice",
        "skill": "usage",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "te-wa-ikenai",
        "conceptId": "te-wa-ikenai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.choose",
        "promptKey": "grammar.v2.te-wa-ikenai-4.prompt",
        "successKey": "grammar.v2.te-wa-ikenai-4.explanation",
        "errorKey": "grammar.v2.te-wa-ikenai-4.explanation",
        "options": [
          {
            "id": "te-wa-ikenai-4-option-0",
            "textKey": "grammar.v2.te-wa-ikenai-4.option.0",
            "feedbackKey": "grammar.v2.te-wa-ikenai-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "te-wa-ikenai-4-option-1",
            "textKey": "grammar.v2.te-wa-ikenai-4.option.1",
            "feedbackKey": "grammar.v2.te-wa-ikenai-4.feedback.1",
            "grammarStatus": "valid"
          },
          {
            "id": "te-wa-ikenai-4-option-2",
            "textKey": "grammar.v2.te-wa-ikenai-4.option.2",
            "feedbackKey": "grammar.v2.te-wa-ikenai-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.te-wa-ikenai-4.option.0",
          "grammar.v2.te-wa-ikenai-4.option.1",
          "grammar.v2.te-wa-ikenai-4.option.2"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "nai-de-kudasai",
    "level": "N5",
    "track": "core",
    "topicId": "07",
    "order": 9,
    "titleKey": "grammar.v2.nai-de-kudasai.title",
    "summaryKey": "grammar.v2.nai-de-kudasai.summary",
    "goalKey": "grammar.v2.nai-de-kudasai.goal",
    "prerequisiteIds": [
      "te-kudasai",
      "verb-negative-plain"
    ],
    "relatedIds": [],
    "lesson": {
      "ideaKey": "grammar.v2.nai-de-kudasai.idea",
      "formation": [
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "食べる → 食べない → 食べないでください"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "撮る → 撮らない → 撮らないでください"
        },
        {
          "labelKey": "grammar.v2.pattern",
          "pattern": "来る → 来ない → 来ないでください"
        }
      ],
      "examples": [
        {
          "japanese": "食べないでください。",
          "reading": "たべないでください。",
          "meaningKey": "grammar.v2.nai-de-kudasai.example.0"
        },
        {
          "japanese": "ここに来ないでください。",
          "reading": "ここにこないでください。",
          "meaningKey": "grammar.v2.nai-de-kudasai.example.1"
        },
        {
          "japanese": "写真を撮らないでください。",
          "reading": "しゃしんをとらないでください。",
          "meaningKey": "grammar.v2.nai-de-kudasai.example.2"
        }
      ],
      "detailedExplanation": [
        {
          "id": "why",
          "titleKey": "grammar.v2.detailWhy",
          "bodyKey": "grammar.v2.nai-de-kudasai.detail.0"
        },
        {
          "id": "nuance",
          "titleKey": "grammar.v2.detailNuance",
          "bodyKey": "grammar.v2.nai-de-kudasai.detail.1"
        }
      ],
      "mistakes": [
        {
          "wrong": "撮らないてください。",
          "correction": "撮らないでください。",
          "explanationKey": "grammar.v2.nai-de-kudasai.mistake.0"
        }
      ],
      "contrasts": [],
      "tables": [
        {
          "captionKey": "grammar.v2.te.functions.caption",
          "headerKeys": [
            "grammar.v2.te.functions.header.0"
          ],
          "rows": [
            {
              "labelKey": "grammar.v2.te.functions.row.0",
              "cells": [
                "写真を撮ってください。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.functions.row.1",
              "cells": [
                "写真を撮らないでください。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.functions.row.2",
              "cells": [
                "写真を撮ってもいいです。"
              ]
            },
            {
              "labelKey": "grammar.v2.te.functions.row.3",
              "cells": [
                "写真を撮ってはいけません。"
              ]
            }
          ]
        }
      ]
    },
    "exercises": [
      {
        "id": "nai-de-kudasai-1",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "nai-de-kudasai",
        "conceptId": "nai-de-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.nai-de-kudasai-1.prompt",
        "successKey": "grammar.v2.nai-de-kudasai-1.explanation",
        "errorKey": "grammar.v2.nai-de-kudasai-1.explanation",
        "acceptedAnswers": [
          "でください"
        ],
        "solutionKey": "grammar.v2.nai-de-kudasai-1.solution",
        "kanaBank": [
          "や",
          "も",
          "い",
          "く",
          "さ",
          "で",
          "だ"
        ]
      },
      {
        "id": "nai-de-kudasai-2",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "nai-de-kudasai",
        "conceptId": "nai-de-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.nai-de-kudasai-2.prompt",
        "successKey": "grammar.v2.nai-de-kudasai-2.explanation",
        "errorKey": "grammar.v2.nai-de-kudasai-2.explanation",
        "acceptedAnswers": [
          "撮らないでください"
        ],
        "solutionKey": "grammar.v2.nai-de-kudasai-2.solution",
        "kanaBank": [
          "撮",
          "ん",
          "を",
          "ら",
          "だ",
          "で",
          "な",
          "さ",
          "い",
          "く"
        ]
      },
      {
        "id": "nai-de-kudasai-3",
        "version": 2,
        "kind": "fill-gap",
        "skill": "formation",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "nai-de-kudasai",
        "conceptId": "nai-de-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.fill",
        "promptKey": "grammar.v2.nai-de-kudasai-3.prompt",
        "successKey": "grammar.v2.nai-de-kudasai-3.explanation",
        "errorKey": "grammar.v2.nai-de-kudasai-3.explanation",
        "acceptedAnswers": [
          "来ないでください"
        ],
        "solutionKey": "grammar.v2.nai-de-kudasai-3.solution",
        "kanaBank": [
          "が",
          "く",
          "え",
          "い",
          "さ",
          "な",
          "来",
          "で",
          "だ"
        ]
      },
      {
        "id": "nai-de-kudasai-4",
        "version": 2,
        "kind": "detect-error",
        "skill": "contrast",
        "difficulty": 2,
        "topicId": "07",
        "lessonId": "nai-de-kudasai",
        "conceptId": "nai-de-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.detect",
        "promptKey": "grammar.v2.nai-de-kudasai-4.prompt",
        "successKey": "grammar.v2.nai-de-kudasai-4.explanation",
        "errorKey": "grammar.v2.nai-de-kudasai-4.explanation",
        "options": [
          {
            "id": "nai-de-kudasai-4-option-0",
            "textKey": "grammar.v2.nai-de-kudasai-4.option.0",
            "feedbackKey": "grammar.v2.nai-de-kudasai-4.feedback.0",
            "grammarStatus": "valid"
          },
          {
            "id": "nai-de-kudasai-4-option-1",
            "textKey": "grammar.v2.nai-de-kudasai-4.option.1",
            "feedbackKey": "grammar.v2.nai-de-kudasai-4.feedback.1",
            "grammarStatus": "invalid"
          },
          {
            "id": "nai-de-kudasai-4-option-2",
            "textKey": "grammar.v2.nai-de-kudasai-4.option.2",
            "feedbackKey": "grammar.v2.nai-de-kudasai-4.feedback.2",
            "grammarStatus": "valid"
          }
        ],
        "optionKeys": [
          "grammar.v2.nai-de-kudasai-4.option.0",
          "grammar.v2.nai-de-kudasai-4.option.1",
          "grammar.v2.nai-de-kudasai-4.option.2"
        ],
        "answer": 1
      },
      {
        "id": "nai-de-kudasai-5",
        "version": 2,
        "kind": "matching",
        "skill": "recognition",
        "difficulty": 1,
        "topicId": "07",
        "lessonId": "nai-de-kudasai",
        "conceptId": "nai-de-kudasai",
        "labelKey": "grammar.v2.practice",
        "topicKey": "grammar.v2.topic07",
        "questionKey": "grammar.v2.match",
        "promptKey": "grammar.v2.nai-de-kudasai-5.prompt",
        "successKey": "grammar.v2.nai-de-kudasai-5.explanation",
        "errorKey": "grammar.v2.nai-de-kudasai-5.explanation",
        "pairs": [
          {
            "leftKey": "grammar.v2.nai-de-kudasai-5.left.0",
            "rightKey": "grammar.v2.nai-de-kudasai-5.right.0"
          },
          {
            "leftKey": "grammar.v2.nai-de-kudasai-5.left.1",
            "rightKey": "grammar.v2.nai-de-kudasai-5.right.1"
          },
          {
            "leftKey": "grammar.v2.nai-de-kudasai-5.left.2",
            "rightKey": "grammar.v2.nai-de-kudasai-5.right.2"
          },
          {
            "leftKey": "grammar.v2.nai-de-kudasai-5.left.3",
            "rightKey": "grammar.v2.nai-de-kudasai-5.right.3"
          }
        ]
      }
    ]
  }
];
export const GRAMMAR_V2_REVIEW: readonly GrammarExercise[] = [
  {
    "id": "topic01-review-01",
    "version": 2,
    "kind": "sentence-builder",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "state-being-plain",
    "conceptId": "state-being-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic01-review-01.prompt",
    "successKey": "grammar.v2.topic01-review-01.explanation",
    "errorKey": "grammar.v2.topic01-review-01.explanation",
    "tokenKeys": [
      "grammar.v2.topic01-review-01.token.0",
      "grammar.v2.topic01-review-01.token.1"
    ],
    "solution": [
      1,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic01-review-02",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "state-being-negative",
    "conceptId": "state-being-negative",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic01-review-02.prompt",
    "successKey": "grammar.v2.topic01-review-02.explanation",
    "errorKey": "grammar.v2.topic01-review-02.explanation",
    "acceptedAnswers": [
      "じゃない"
    ],
    "solutionKey": "grammar.v2.topic01-review-02.solution",
    "kanaBank": [
      "や",
      "ん",
      "い",
      "じ",
      "な",
      "ゃ"
    ]
  },
  {
    "id": "topic01-review-03",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "state-being-past",
    "conceptId": "state-being-past",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-03.prompt",
    "successKey": "grammar.v2.topic01-review-03.explanation",
    "errorKey": "grammar.v2.topic01-review-03.explanation",
    "options": [
      {
        "id": "topic01-review-03-option-0",
        "textKey": "grammar.v2.topic01-review-03.option.0",
        "feedbackKey": "grammar.v2.topic01-review-03.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-03-option-1",
        "textKey": "grammar.v2.topic01-review-03.option.1",
        "feedbackKey": "grammar.v2.topic01-review-03.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-03-option-2",
        "textKey": "grammar.v2.topic01-review-03.option.2",
        "feedbackKey": "grammar.v2.topic01-review-03.feedback.2",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-03-option-3",
        "textKey": "grammar.v2.topic01-review-03.option.3",
        "feedbackKey": "grammar.v2.topic01-review-03.feedback.3",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-03.option.0",
      "grammar.v2.topic01-review-03.option.1",
      "grammar.v2.topic01-review-03.option.2",
      "grammar.v2.topic01-review-03.option.3"
    ],
    "answer": 2
  },
  {
    "id": "topic01-review-04",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "state-being-past-negative",
    "conceptId": "state-being-past-negative",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-04.prompt",
    "successKey": "grammar.v2.topic01-review-04.explanation",
    "errorKey": "grammar.v2.topic01-review-04.explanation",
    "options": [
      {
        "id": "topic01-review-04-option-0",
        "textKey": "grammar.v2.topic01-review-04.option.0",
        "feedbackKey": "grammar.v2.topic01-review-04.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-04-option-1",
        "textKey": "grammar.v2.topic01-review-04.option.1",
        "feedbackKey": "grammar.v2.topic01-review-04.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-04-option-2",
        "textKey": "grammar.v2.topic01-review-04.option.2",
        "feedbackKey": "grammar.v2.topic01-review-04.feedback.2",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-04-option-3",
        "textKey": "grammar.v2.topic01-review-04.option.3",
        "feedbackKey": "grammar.v2.topic01-review-04.feedback.3",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-04.option.0",
      "grammar.v2.topic01-review-04.option.1",
      "grammar.v2.topic01-review-04.option.2",
      "grammar.v2.topic01-review-04.option.3"
    ],
    "answer": 3
  },
  {
    "id": "topic01-review-05",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-wa-topic",
    "conceptId": "particle-wa-topic",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-05.prompt",
    "successKey": "grammar.v2.topic01-review-05.explanation",
    "errorKey": "grammar.v2.topic01-review-05.explanation",
    "options": [
      {
        "id": "topic01-review-05-option-0",
        "textKey": "grammar.v2.topic01-review-05.option.0",
        "feedbackKey": "grammar.v2.topic01-review-05.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-05-option-1",
        "textKey": "grammar.v2.topic01-review-05.option.1",
        "feedbackKey": "grammar.v2.topic01-review-05.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-05-option-2",
        "textKey": "grammar.v2.topic01-review-05.option.2",
        "feedbackKey": "grammar.v2.topic01-review-05.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-05.option.0",
      "grammar.v2.topic01-review-05.option.1",
      "grammar.v2.topic01-review-05.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic01-review-06",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-mo-inclusive",
    "conceptId": "particle-mo-inclusive",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic01-review-06.prompt",
    "successKey": "grammar.v2.topic01-review-06.explanation",
    "errorKey": "grammar.v2.topic01-review-06.explanation",
    "acceptedAnswers": [
      "も"
    ],
    "solutionKey": "grammar.v2.topic01-review-06.solution",
    "kanaBank": [
      "ん",
      "を",
      "れ",
      "る",
      "ら",
      "も"
    ]
  },
  {
    "id": "topic01-review-07",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-ga-identifier",
    "conceptId": "particle-ga-identifier",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic01-review-07.prompt",
    "successKey": "grammar.v2.topic01-review-07.explanation",
    "errorKey": "grammar.v2.topic01-review-07.explanation",
    "acceptedAnswers": [
      "が"
    ],
    "solutionKey": "grammar.v2.topic01-review-07.solution",
    "kanaBank": [
      "く",
      "が",
      "し",
      "じ",
      "す",
      "た"
    ]
  },
  {
    "id": "topic01-review-08",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-mo-inclusive",
    "conceptId": "particle-mo-inclusive",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-08.prompt",
    "successKey": "grammar.v2.topic01-review-08.explanation",
    "errorKey": "grammar.v2.topic01-review-08.explanation",
    "options": [
      {
        "id": "topic01-review-08-option-0",
        "textKey": "grammar.v2.topic01-review-08.option.0",
        "feedbackKey": "grammar.v2.topic01-review-08.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-08-option-1",
        "textKey": "grammar.v2.topic01-review-08.option.1",
        "feedbackKey": "grammar.v2.topic01-review-08.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-08-option-2",
        "textKey": "grammar.v2.topic01-review-08.option.2",
        "feedbackKey": "grammar.v2.topic01-review-08.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-08.option.0",
      "grammar.v2.topic01-review-08.option.1",
      "grammar.v2.topic01-review-08.option.2"
    ],
    "answer": 1
  },
  {
    "id": "topic01-review-09",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-wa-vs-ga",
    "conceptId": "particle-wa-vs-ga",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-09.prompt",
    "successKey": "grammar.v2.topic01-review-09.explanation",
    "errorKey": "grammar.v2.topic01-review-09.explanation",
    "options": [
      {
        "id": "topic01-review-09-option-0",
        "textKey": "grammar.v2.topic01-review-09.option.0",
        "feedbackKey": "grammar.v2.topic01-review-09.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-09-option-1",
        "textKey": "grammar.v2.topic01-review-09.option.1",
        "feedbackKey": "grammar.v2.topic01-review-09.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-09-option-2",
        "textKey": "grammar.v2.topic01-review-09.option.2",
        "feedbackKey": "grammar.v2.topic01-review-09.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-09.option.0",
      "grammar.v2.topic01-review-09.option.1",
      "grammar.v2.topic01-review-09.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic01-review-10",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-wa-vs-ga",
    "conceptId": "particle-wa-vs-ga",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-10.prompt",
    "successKey": "grammar.v2.topic01-review-10.explanation",
    "errorKey": "grammar.v2.topic01-review-10.explanation",
    "options": [
      {
        "id": "topic01-review-10-option-0",
        "textKey": "grammar.v2.topic01-review-10.option.0",
        "feedbackKey": "grammar.v2.topic01-review-10.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-10-option-1",
        "textKey": "grammar.v2.topic01-review-10.option.1",
        "feedbackKey": "grammar.v2.topic01-review-10.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-10-option-2",
        "textKey": "grammar.v2.topic01-review-10.option.2",
        "feedbackKey": "grammar.v2.topic01-review-10.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-10.option.0",
      "grammar.v2.topic01-review-10.option.1",
      "grammar.v2.topic01-review-10.option.2"
    ],
    "answer": 2
  },
  {
    "id": "topic01-review-11",
    "version": 2,
    "kind": "sentence-order",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-no-noun-link",
    "conceptId": "particle-no-noun-link",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic01-review-11.prompt",
    "successKey": "grammar.v2.topic01-review-11.explanation",
    "errorKey": "grammar.v2.topic01-review-11.explanation",
    "tokenKeys": [
      "grammar.v2.topic01-review-11.token.0",
      "grammar.v2.topic01-review-11.token.1",
      "grammar.v2.topic01-review-11.token.2"
    ],
    "solution": [
      2,
      1,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic01-review-12",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "particle-no-noun-link",
    "conceptId": "particle-no-noun-link",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-12.prompt",
    "successKey": "grammar.v2.topic01-review-12.explanation",
    "errorKey": "grammar.v2.topic01-review-12.explanation",
    "options": [
      {
        "id": "topic01-review-12-option-0",
        "textKey": "grammar.v2.topic01-review-12.option.0",
        "feedbackKey": "grammar.v2.topic01-review-12.feedback.0"
      },
      {
        "id": "topic01-review-12-option-1",
        "textKey": "grammar.v2.topic01-review-12.option.1",
        "feedbackKey": "grammar.v2.topic01-review-12.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-12.option.0",
      "grammar.v2.topic01-review-12.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic01-review-13",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "demonstratives-ko-so-a-do",
    "conceptId": "demonstratives-ko-so-a-do",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-13.prompt",
    "successKey": "grammar.v2.topic01-review-13.explanation",
    "errorKey": "grammar.v2.topic01-review-13.explanation",
    "options": [
      {
        "id": "topic01-review-13-option-0",
        "textKey": "grammar.v2.topic01-review-13.option.0",
        "feedbackKey": "grammar.v2.topic01-review-13.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-13-option-1",
        "textKey": "grammar.v2.topic01-review-13.option.1",
        "feedbackKey": "grammar.v2.topic01-review-13.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-13-option-2",
        "textKey": "grammar.v2.topic01-review-13.option.2",
        "feedbackKey": "grammar.v2.topic01-review-13.feedback.2",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-13-option-3",
        "textKey": "grammar.v2.topic01-review-13.option.3",
        "feedbackKey": "grammar.v2.topic01-review-13.feedback.3",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-13.option.0",
      "grammar.v2.topic01-review-13.option.1",
      "grammar.v2.topic01-review-13.option.2",
      "grammar.v2.topic01-review-13.option.3"
    ],
    "answer": 2
  },
  {
    "id": "topic01-review-14",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "demonstratives-ko-so-a-do",
    "conceptId": "demonstratives-ko-so-a-do",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic01-review-14.prompt",
    "successKey": "grammar.v2.topic01-review-14.explanation",
    "errorKey": "grammar.v2.topic01-review-14.explanation",
    "acceptedAnswers": [
      "その"
    ],
    "solutionKey": "grammar.v2.topic01-review-14.solution",
    "kanaBank": [
      "へ",
      "ま",
      "だ",
      "で",
      "の",
      "そ"
    ]
  },
  {
    "id": "topic01-review-15",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "01",
    "lessonId": "demonstratives-ko-so-a-do",
    "conceptId": "demonstratives-ko-so-a-do",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic01-review-15.prompt",
    "successKey": "grammar.v2.topic01-review-15.explanation",
    "errorKey": "grammar.v2.topic01-review-15.explanation",
    "options": [
      {
        "id": "topic01-review-15-option-0",
        "textKey": "grammar.v2.topic01-review-15.option.0",
        "feedbackKey": "grammar.v2.topic01-review-15.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-15-option-1",
        "textKey": "grammar.v2.topic01-review-15.option.1",
        "feedbackKey": "grammar.v2.topic01-review-15.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic01-review-15-option-2",
        "textKey": "grammar.v2.topic01-review-15.option.2",
        "feedbackKey": "grammar.v2.topic01-review-15.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic01-review-15.option.0",
      "grammar.v2.topic01-review-15.option.1",
      "grammar.v2.topic01-review-15.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic02-review-01",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-na",
    "conceptId": "adjective-na",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic02-review-01.prompt",
    "successKey": "grammar.v2.topic02-review-01.explanation",
    "errorKey": "grammar.v2.topic02-review-01.explanation",
    "options": [
      {
        "id": "topic02-review-01-option-0",
        "textKey": "grammar.v2.topic02-review-01.option.0",
        "feedbackKey": "grammar.v2.topic02-review-01.feedback.0"
      },
      {
        "id": "topic02-review-01-option-1",
        "textKey": "grammar.v2.topic02-review-01.option.1",
        "feedbackKey": "grammar.v2.topic02-review-01.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic02-review-01.option.0",
      "grammar.v2.topic02-review-01.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic02-review-02",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-i",
    "conceptId": "adjective-i",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic02-review-02.prompt",
    "successKey": "grammar.v2.topic02-review-02.explanation",
    "errorKey": "grammar.v2.topic02-review-02.explanation",
    "options": [
      {
        "id": "topic02-review-02-option-0",
        "textKey": "grammar.v2.topic02-review-02.option.0",
        "feedbackKey": "grammar.v2.topic02-review-02.feedback.0"
      },
      {
        "id": "topic02-review-02-option-1",
        "textKey": "grammar.v2.topic02-review-02.option.1",
        "feedbackKey": "grammar.v2.topic02-review-02.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic02-review-02.option.0",
      "grammar.v2.topic02-review-02.option.1"
    ],
    "answer": 1
  },
  {
    "id": "topic02-review-03",
    "version": 2,
    "kind": "sentence-builder",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-noun-modification",
    "conceptId": "adjective-noun-modification",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic02-review-03.prompt",
    "successKey": "grammar.v2.topic02-review-03.explanation",
    "errorKey": "grammar.v2.topic02-review-03.explanation",
    "tokenKeys": [
      "grammar.v2.topic02-review-03.token.0",
      "grammar.v2.topic02-review-03.token.1"
    ],
    "solution": [
      1,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic02-review-04",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-noun-modification",
    "conceptId": "adjective-noun-modification",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-04.prompt",
    "successKey": "grammar.v2.topic02-review-04.explanation",
    "errorKey": "grammar.v2.topic02-review-04.explanation",
    "acceptedAnswers": [
      "な"
    ],
    "solutionKey": "grammar.v2.topic02-review-04.solution",
    "kanaBank": [
      "や",
      "も",
      "ゃ",
      "れ",
      "る",
      "な"
    ]
  },
  {
    "id": "topic02-review-05",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-negative",
    "conceptId": "adjective-negative",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-05.prompt",
    "successKey": "grammar.v2.topic02-review-05.explanation",
    "errorKey": "grammar.v2.topic02-review-05.explanation",
    "acceptedAnswers": [
      "くない"
    ],
    "solutionKey": "grammar.v2.topic02-review-05.solution",
    "kanaBank": [
      "う",
      "い",
      "か",
      "え",
      "く",
      "な"
    ]
  },
  {
    "id": "topic02-review-06",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-negative",
    "conceptId": "adjective-negative",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-06.prompt",
    "successKey": "grammar.v2.topic02-review-06.explanation",
    "errorKey": "grammar.v2.topic02-review-06.explanation",
    "acceptedAnswers": [
      "じゃない"
    ],
    "solutionKey": "grammar.v2.topic02-review-06.solution",
    "kanaBank": [
      "が",
      "く",
      "い",
      "じ",
      "な",
      "ゃ"
    ]
  },
  {
    "id": "topic02-review-07",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-past",
    "conceptId": "adjective-past",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-07.prompt",
    "successKey": "grammar.v2.topic02-review-07.explanation",
    "errorKey": "grammar.v2.topic02-review-07.explanation",
    "acceptedAnswers": [
      "かった"
    ],
    "solutionKey": "grammar.v2.topic02-review-07.solution",
    "kanaBank": [
      "へ",
      "ま",
      "だ",
      "っ",
      "た",
      "か"
    ]
  },
  {
    "id": "topic02-review-08",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-past",
    "conceptId": "adjective-past",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-08.prompt",
    "successKey": "grammar.v2.topic02-review-08.explanation",
    "errorKey": "grammar.v2.topic02-review-08.explanation",
    "acceptedAnswers": [
      "だった"
    ],
    "solutionKey": "grammar.v2.topic02-review-08.solution",
    "kanaBank": [
      "じ",
      "す",
      "た",
      "っ",
      "だ",
      "で"
    ]
  },
  {
    "id": "topic02-review-09",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-past-negative",
    "conceptId": "adjective-past-negative",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic02-review-09.prompt",
    "successKey": "grammar.v2.topic02-review-09.explanation",
    "errorKey": "grammar.v2.topic02-review-09.explanation",
    "options": [
      {
        "id": "topic02-review-09-option-0",
        "textKey": "grammar.v2.topic02-review-09.option.0",
        "feedbackKey": "grammar.v2.topic02-review-09.feedback.0"
      },
      {
        "id": "topic02-review-09-option-1",
        "textKey": "grammar.v2.topic02-review-09.option.1",
        "feedbackKey": "grammar.v2.topic02-review-09.feedback.1"
      },
      {
        "id": "topic02-review-09-option-2",
        "textKey": "grammar.v2.topic02-review-09.option.2",
        "feedbackKey": "grammar.v2.topic02-review-09.feedback.2"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic02-review-09.option.0",
      "grammar.v2.topic02-review-09.option.1",
      "grammar.v2.topic02-review-09.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic02-review-10",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-past-negative",
    "conceptId": "adjective-past-negative",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-10.prompt",
    "successKey": "grammar.v2.topic02-review-10.explanation",
    "errorKey": "grammar.v2.topic02-review-10.explanation",
    "acceptedAnswers": [
      "なかった"
    ],
    "solutionKey": "grammar.v2.topic02-review-10.solution",
    "kanaBank": [
      "ま",
      "へ",
      "っ",
      "な",
      "た",
      "か"
    ]
  },
  {
    "id": "topic02-review-11",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjective-ii-irregular",
    "conceptId": "adjective-ii-irregular",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-11.prompt",
    "successKey": "grammar.v2.topic02-review-11.explanation",
    "errorKey": "grammar.v2.topic02-review-11.explanation",
    "acceptedAnswers": [
      "よくなかった"
    ],
    "solutionKey": "grammar.v2.topic02-review-11.solution",
    "kanaBank": [
      "も",
      "ゃ",
      "よ",
      "っ",
      "な",
      "か",
      "く",
      "た"
    ]
  },
  {
    "id": "topic02-review-12",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "degree-adverbs",
    "conceptId": "degree-adverbs",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic02-review-12.prompt",
    "successKey": "grammar.v2.topic02-review-12.explanation",
    "errorKey": "grammar.v2.topic02-review-12.explanation",
    "options": [
      {
        "id": "topic02-review-12-option-0",
        "textKey": "grammar.v2.topic02-review-12.option.0",
        "feedbackKey": "grammar.v2.topic02-review-12.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic02-review-12-option-1",
        "textKey": "grammar.v2.topic02-review-12.option.1",
        "feedbackKey": "grammar.v2.topic02-review-12.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic02-review-12-option-2",
        "textKey": "grammar.v2.topic02-review-12.option.2",
        "feedbackKey": "grammar.v2.topic02-review-12.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic02-review-12.option.0",
      "grammar.v2.topic02-review-12.option.1",
      "grammar.v2.topic02-review-12.option.2"
    ],
    "answer": 1
  },
  {
    "id": "topic02-review-13",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjectival-predicates-ga",
    "conceptId": "adjectival-predicates-ga",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic02-review-13.prompt",
    "successKey": "grammar.v2.topic02-review-13.explanation",
    "errorKey": "grammar.v2.topic02-review-13.explanation",
    "acceptedAnswers": [
      "が"
    ],
    "solutionKey": "grammar.v2.topic02-review-13.solution",
    "kanaBank": [
      "る",
      "ら",
      "れ",
      "も",
      "ゃ",
      "が"
    ]
  },
  {
    "id": "topic02-review-14",
    "version": 2,
    "kind": "sentence-builder",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjectival-predicates-ga",
    "conceptId": "adjectival-predicates-ga",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic02-review-14.prompt",
    "successKey": "grammar.v2.topic02-review-14.explanation",
    "errorKey": "grammar.v2.topic02-review-14.explanation",
    "tokenKeys": [
      "grammar.v2.topic02-review-14.token.0",
      "grammar.v2.topic02-review-14.token.1",
      "grammar.v2.topic02-review-14.token.2",
      "grammar.v2.topic02-review-14.token.3"
    ],
    "solution": [
      2,
      3,
      1,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic02-review-15",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "02",
    "lessonId": "adjectival-predicates-ga",
    "conceptId": "adjectival-predicates-ga",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic02",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic02-review-15.prompt",
    "successKey": "grammar.v2.topic02-review-15.explanation",
    "errorKey": "grammar.v2.topic02-review-15.explanation",
    "options": [
      {
        "id": "topic02-review-15-option-0",
        "textKey": "grammar.v2.topic02-review-15.option.0",
        "feedbackKey": "grammar.v2.topic02-review-15.feedback.0"
      },
      {
        "id": "topic02-review-15-option-1",
        "textKey": "grammar.v2.topic02-review-15.option.1",
        "feedbackKey": "grammar.v2.topic02-review-15.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic02-review-15.option.0",
      "grammar.v2.topic02-review-15.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic03-review-01",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-role-dictionary",
    "conceptId": "verb-role-dictionary",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic03-review-01.prompt",
    "successKey": "grammar.v2.topic03-review-01.explanation",
    "errorKey": "grammar.v2.topic03-review-01.explanation",
    "options": [
      {
        "id": "topic03-review-01-option-0",
        "textKey": "grammar.v2.topic03-review-01.option.0",
        "feedbackKey": "grammar.v2.topic03-review-01.feedback.0"
      },
      {
        "id": "topic03-review-01-option-1",
        "textKey": "grammar.v2.topic03-review-01.option.1",
        "feedbackKey": "grammar.v2.topic03-review-01.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic03-review-01.option.0",
      "grammar.v2.topic03-review-01.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic03-review-02",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-role-dictionary",
    "conceptId": "verb-role-dictionary",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic03-review-02.prompt",
    "successKey": "grammar.v2.topic03-review-02.explanation",
    "errorKey": "grammar.v2.topic03-review-02.explanation",
    "options": [
      {
        "id": "topic03-review-02-option-0",
        "textKey": "grammar.v2.topic03-review-02.option.0",
        "feedbackKey": "grammar.v2.topic03-review-02.feedback.0"
      },
      {
        "id": "topic03-review-02-option-1",
        "textKey": "grammar.v2.topic03-review-02.option.1",
        "feedbackKey": "grammar.v2.topic03-review-02.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic03-review-02.option.0",
      "grammar.v2.topic03-review-02.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic03-review-03",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-ichidan",
    "conceptId": "verb-ichidan",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic03-review-03.prompt",
    "successKey": "grammar.v2.topic03-review-03.explanation",
    "errorKey": "grammar.v2.topic03-review-03.explanation",
    "options": [
      {
        "id": "topic03-review-03-option-0",
        "textKey": "grammar.v2.topic03-review-03.option.0",
        "feedbackKey": "grammar.v2.topic03-review-03.feedback.0"
      },
      {
        "id": "topic03-review-03-option-1",
        "textKey": "grammar.v2.topic03-review-03.option.1",
        "feedbackKey": "grammar.v2.topic03-review-03.feedback.1"
      },
      {
        "id": "topic03-review-03-option-2",
        "textKey": "grammar.v2.topic03-review-03.option.2",
        "feedbackKey": "grammar.v2.topic03-review-03.feedback.2"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic03-review-03.option.0",
      "grammar.v2.topic03-review-03.option.1",
      "grammar.v2.topic03-review-03.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic03-review-04",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-godan",
    "conceptId": "verb-godan",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic03-review-04.prompt",
    "successKey": "grammar.v2.topic03-review-04.explanation",
    "errorKey": "grammar.v2.topic03-review-04.explanation",
    "options": [
      {
        "id": "topic03-review-04-option-0",
        "textKey": "grammar.v2.topic03-review-04.option.0",
        "feedbackKey": "grammar.v2.topic03-review-04.feedback.0"
      },
      {
        "id": "topic03-review-04-option-1",
        "textKey": "grammar.v2.topic03-review-04.option.1",
        "feedbackKey": "grammar.v2.topic03-review-04.feedback.1"
      },
      {
        "id": "topic03-review-04-option-2",
        "textKey": "grammar.v2.topic03-review-04.option.2",
        "feedbackKey": "grammar.v2.topic03-review-04.feedback.2"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic03-review-04.option.0",
      "grammar.v2.topic03-review-04.option.1",
      "grammar.v2.topic03-review-04.option.2"
    ],
    "answer": 1
  },
  {
    "id": "topic03-review-05",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-irregular-suru-kuru",
    "conceptId": "verb-irregular-suru-kuru",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic03-review-05.prompt",
    "successKey": "grammar.v2.topic03-review-05.explanation",
    "errorKey": "grammar.v2.topic03-review-05.explanation",
    "options": [
      {
        "id": "topic03-review-05-option-0",
        "textKey": "grammar.v2.topic03-review-05.option.0",
        "feedbackKey": "grammar.v2.topic03-review-05.feedback.0"
      },
      {
        "id": "topic03-review-05-option-1",
        "textKey": "grammar.v2.topic03-review-05.option.1",
        "feedbackKey": "grammar.v2.topic03-review-05.feedback.1"
      },
      {
        "id": "topic03-review-05-option-2",
        "textKey": "grammar.v2.topic03-review-05.option.2",
        "feedbackKey": "grammar.v2.topic03-review-05.feedback.2"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic03-review-05.option.0",
      "grammar.v2.topic03-review-05.option.1",
      "grammar.v2.topic03-review-05.option.2"
    ],
    "answer": 2
  },
  {
    "id": "topic03-review-06",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-negative-plain",
    "conceptId": "verb-negative-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic03-review-06.prompt",
    "successKey": "grammar.v2.topic03-review-06.explanation",
    "errorKey": "grammar.v2.topic03-review-06.explanation",
    "acceptedAnswers": [
      "買わない"
    ],
    "solutionKey": "grammar.v2.topic03-review-06.solution",
    "kanaBank": [
      "し",
      "が",
      "い",
      "買",
      "わ",
      "な"
    ]
  },
  {
    "id": "topic03-review-07",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-negative-plain",
    "conceptId": "verb-negative-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic03-review-07.prompt",
    "successKey": "grammar.v2.topic03-review-07.explanation",
    "errorKey": "grammar.v2.topic03-review-07.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic03-review-07.left.0",
        "rightKey": "grammar.v2.topic03-review-07.right.0"
      },
      {
        "leftKey": "grammar.v2.topic03-review-07.left.1",
        "rightKey": "grammar.v2.topic03-review-07.right.1"
      },
      {
        "leftKey": "grammar.v2.topic03-review-07.left.2",
        "rightKey": "grammar.v2.topic03-review-07.right.2"
      },
      {
        "leftKey": "grammar.v2.topic03-review-07.left.3",
        "rightKey": "grammar.v2.topic03-review-07.right.3"
      }
    ]
  },
  {
    "id": "topic03-review-08",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-past-plain",
    "conceptId": "verb-past-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic03-review-08.prompt",
    "successKey": "grammar.v2.topic03-review-08.explanation",
    "errorKey": "grammar.v2.topic03-review-08.explanation",
    "acceptedAnswers": [
      "行った"
    ],
    "solutionKey": "grammar.v2.topic03-review-08.solution",
    "kanaBank": [
      "ん",
      "を",
      "ゃ",
      "た",
      "行",
      "っ"
    ]
  },
  {
    "id": "topic03-review-09",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-past-plain",
    "conceptId": "verb-past-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic03-review-09.prompt",
    "successKey": "grammar.v2.topic03-review-09.explanation",
    "errorKey": "grammar.v2.topic03-review-09.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic03-review-09.left.0",
        "rightKey": "grammar.v2.topic03-review-09.right.0"
      },
      {
        "leftKey": "grammar.v2.topic03-review-09.left.1",
        "rightKey": "grammar.v2.topic03-review-09.right.1"
      }
    ]
  },
  {
    "id": "topic03-review-10",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-past-plain",
    "conceptId": "verb-past-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic03-review-10.prompt",
    "successKey": "grammar.v2.topic03-review-10.explanation",
    "errorKey": "grammar.v2.topic03-review-10.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic03-review-10.left.0",
        "rightKey": "grammar.v2.topic03-review-10.right.0"
      },
      {
        "leftKey": "grammar.v2.topic03-review-10.left.1",
        "rightKey": "grammar.v2.topic03-review-10.right.1"
      }
    ]
  },
  {
    "id": "topic03-review-11",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-past-negative-plain",
    "conceptId": "verb-past-negative-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic03-review-11.prompt",
    "successKey": "grammar.v2.topic03-review-11.explanation",
    "errorKey": "grammar.v2.topic03-review-11.explanation",
    "acceptedAnswers": [
      "飲まなかった"
    ],
    "solutionKey": "grammar.v2.topic03-review-11.solution",
    "kanaBank": [
      "飲",
      "ん",
      "を",
      "た",
      "か",
      "ま",
      "っ",
      "な"
    ]
  },
  {
    "id": "topic03-review-12",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-past-negative-plain",
    "conceptId": "verb-past-negative-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic03-review-12.prompt",
    "successKey": "grammar.v2.topic03-review-12.explanation",
    "errorKey": "grammar.v2.topic03-review-12.explanation",
    "acceptedAnswers": [
      "勉強しなかった"
    ],
    "solutionKey": "grammar.v2.topic03-review-12.solution",
    "kanaBank": [
      "勉",
      "る",
      "ら",
      "な",
      "っ",
      "か",
      "た",
      "し",
      "強"
    ]
  },
  {
    "id": "topic03-review-13",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-past-negative-plain",
    "conceptId": "verb-past-negative-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic03-review-13.prompt",
    "successKey": "grammar.v2.topic03-review-13.explanation",
    "errorKey": "grammar.v2.topic03-review-13.explanation",
    "options": [
      {
        "id": "topic03-review-13-option-0",
        "textKey": "grammar.v2.topic03-review-13.option.0",
        "feedbackKey": "grammar.v2.topic03-review-13.feedback.0"
      },
      {
        "id": "topic03-review-13-option-1",
        "textKey": "grammar.v2.topic03-review-13.option.1",
        "feedbackKey": "grammar.v2.topic03-review-13.feedback.1"
      },
      {
        "id": "topic03-review-13-option-2",
        "textKey": "grammar.v2.topic03-review-13.option.2",
        "feedbackKey": "grammar.v2.topic03-review-13.feedback.2"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic03-review-13.option.0",
      "grammar.v2.topic03-review-13.option.1",
      "grammar.v2.topic03-review-13.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic03-review-14",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "verb-past-negative-plain",
    "conceptId": "verb-past-negative-plain",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic03-review-14.prompt",
    "successKey": "grammar.v2.topic03-review-14.explanation",
    "errorKey": "grammar.v2.topic03-review-14.explanation",
    "options": [
      {
        "id": "topic03-review-14-option-0",
        "textKey": "grammar.v2.topic03-review-14.option.0",
        "feedbackKey": "grammar.v2.topic03-review-14.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic03-review-14-option-1",
        "textKey": "grammar.v2.topic03-review-14.option.1",
        "feedbackKey": "grammar.v2.topic03-review-14.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic03-review-14-option-2",
        "textKey": "grammar.v2.topic03-review-14.option.2",
        "feedbackKey": "grammar.v2.topic03-review-14.feedback.2",
        "grammarStatus": "valid"
      },
      {
        "id": "topic03-review-14-option-3",
        "textKey": "grammar.v2.topic03-review-14.option.3",
        "feedbackKey": "grammar.v2.topic03-review-14.feedback.3",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic03-review-14.option.0",
      "grammar.v2.topic03-review-14.option.1",
      "grammar.v2.topic03-review-14.option.2",
      "grammar.v2.topic03-review-14.option.3"
    ],
    "answer": 1
  },
  {
    "id": "topic03-review-15",
    "version": 2,
    "kind": "sentence-builder",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "03",
    "lessonId": "adjective-adverb-ku-ni",
    "conceptId": "adjective-adverb-ku-ni",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic03",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic03-review-15.prompt",
    "successKey": "grammar.v2.topic03-review-15.explanation",
    "errorKey": "grammar.v2.topic03-review-15.explanation",
    "tokenKeys": [
      "grammar.v2.topic03-review-15.token.0",
      "grammar.v2.topic03-review-15.token.1",
      "grammar.v2.topic03-review-15.token.2"
    ],
    "solution": [
      2,
      1,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic04-review-01",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "particle-wo-object",
    "conceptId": "particle-wo-object",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-01.prompt",
    "successKey": "grammar.v2.topic04-review-01.explanation",
    "errorKey": "grammar.v2.topic04-review-01.explanation",
    "acceptedAnswers": [
      "を"
    ],
    "solutionKey": "grammar.v2.topic04-review-01.solution",
    "kanaBank": [
      "へ",
      "ま",
      "だ",
      "で",
      "と",
      "を"
    ]
  },
  {
    "id": "topic04-review-02",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "verb-transitivity-basic",
    "conceptId": "verb-transitivity-basic",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-02.prompt",
    "successKey": "grammar.v2.topic04-review-02.explanation",
    "errorKey": "grammar.v2.topic04-review-02.explanation",
    "acceptedAnswers": [
      "が"
    ],
    "solutionKey": "grammar.v2.topic04-review-02.solution",
    "kanaBank": [
      "ま",
      "へ",
      "や",
      "も",
      "ゃ",
      "が"
    ]
  },
  {
    "id": "topic04-review-03",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "verb-transitivity-basic",
    "conceptId": "verb-transitivity-basic",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-03.prompt",
    "successKey": "grammar.v2.topic04-review-03.explanation",
    "errorKey": "grammar.v2.topic04-review-03.explanation",
    "acceptedAnswers": [
      "を"
    ],
    "solutionKey": "grammar.v2.topic04-review-03.solution",
    "kanaBank": [
      "う",
      "い",
      "か",
      "え",
      "く",
      "を"
    ]
  },
  {
    "id": "topic04-review-04",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "particle-ni-destination",
    "conceptId": "particle-ni-destination",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-04.prompt",
    "successKey": "grammar.v2.topic04-review-04.explanation",
    "errorKey": "grammar.v2.topic04-review-04.explanation",
    "acceptedAnswers": [
      "に",
      "へ"
    ],
    "solutionKey": "grammar.v2.topic04-review-04.solution",
    "kanaBank": [
      "を",
      "ん",
      "も",
      "ゃ",
      "へ",
      "に"
    ]
  },
  {
    "id": "topic04-review-05",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "particle-he-direction",
    "conceptId": "particle-he-direction",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-05.prompt",
    "successKey": "grammar.v2.topic04-review-05.explanation",
    "errorKey": "grammar.v2.topic04-review-05.explanation",
    "acceptedAnswers": [
      "へ"
    ],
    "solutionKey": "grammar.v2.topic04-review-05.solution",
    "kanaBank": [
      "い",
      "う",
      "が",
      "く",
      "え",
      "へ"
    ]
  },
  {
    "id": "topic04-review-06",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "particle-de-action-location",
    "conceptId": "particle-de-action-location",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-06.prompt",
    "successKey": "grammar.v2.topic04-review-06.explanation",
    "errorKey": "grammar.v2.topic04-review-06.explanation",
    "acceptedAnswers": [
      "で"
    ],
    "solutionKey": "grammar.v2.topic04-review-06.solution",
    "kanaBank": [
      "を",
      "ん",
      "る",
      "ら",
      "れ",
      "で"
    ]
  },
  {
    "id": "topic04-review-07",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "particle-ni-time",
    "conceptId": "particle-ni-time",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-07.prompt",
    "successKey": "grammar.v2.topic04-review-07.explanation",
    "errorKey": "grammar.v2.topic04-review-07.explanation",
    "acceptedAnswers": [
      "に"
    ],
    "solutionKey": "grammar.v2.topic04-review-07.solution",
    "kanaBank": [
      "や",
      "ゃ",
      "も",
      "れ",
      "る",
      "に"
    ]
  },
  {
    "id": "topic04-review-08",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "particle-to-companion",
    "conceptId": "particle-to-companion",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-08.prompt",
    "successKey": "grammar.v2.topic04-review-08.explanation",
    "errorKey": "grammar.v2.topic04-review-08.explanation",
    "acceptedAnswers": [
      "と"
    ],
    "solutionKey": "grammar.v2.topic04-review-08.solution",
    "kanaBank": [
      "を",
      "ん",
      "や",
      "も",
      "ゃ",
      "と"
    ]
  },
  {
    "id": "topic04-review-09",
    "version": 2,
    "kind": "sentence-builder",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "particle-kara-made",
    "conceptId": "particle-kara-made",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic04-review-09.prompt",
    "successKey": "grammar.v2.topic04-review-09.explanation",
    "errorKey": "grammar.v2.topic04-review-09.explanation",
    "tokenKeys": [
      "grammar.v2.topic04-review-09.token.0",
      "grammar.v2.topic04-review-09.token.1",
      "grammar.v2.topic04-review-09.token.2",
      "grammar.v2.topic04-review-09.token.3",
      "grammar.v2.topic04-review-09.token.4"
    ],
    "solution": [
      2,
      4,
      0,
      1,
      3
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic04-review-10",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "existence-aru-iru",
    "conceptId": "existence-aru-iru",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic04-review-10.prompt",
    "successKey": "grammar.v2.topic04-review-10.explanation",
    "errorKey": "grammar.v2.topic04-review-10.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic04-review-10.left.0",
        "rightKey": "grammar.v2.topic04-review-10.right.0"
      },
      {
        "leftKey": "grammar.v2.topic04-review-10.left.1",
        "rightKey": "grammar.v2.topic04-review-10.right.1"
      }
    ]
  },
  {
    "id": "topic04-review-11",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "location-ni-vs-de",
    "conceptId": "location-ni-vs-de",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-11.prompt",
    "successKey": "grammar.v2.topic04-review-11.explanation",
    "errorKey": "grammar.v2.topic04-review-11.explanation",
    "acceptedAnswers": [
      "に"
    ],
    "solutionKey": "grammar.v2.topic04-review-11.solution",
    "kanaBank": [
      "る",
      "ら",
      "れ",
      "も",
      "ゃ",
      "に"
    ]
  },
  {
    "id": "topic04-review-12",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "location-ni-vs-de",
    "conceptId": "location-ni-vs-de",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic04-review-12.prompt",
    "successKey": "grammar.v2.topic04-review-12.explanation",
    "errorKey": "grammar.v2.topic04-review-12.explanation",
    "options": [
      {
        "id": "topic04-review-12-option-0",
        "textKey": "grammar.v2.topic04-review-12.option.0",
        "feedbackKey": "grammar.v2.topic04-review-12.feedback.0"
      },
      {
        "id": "topic04-review-12-option-1",
        "textKey": "grammar.v2.topic04-review-12.option.1",
        "feedbackKey": "grammar.v2.topic04-review-12.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic04-review-12.option.0",
      "grammar.v2.topic04-review-12.option.1"
    ],
    "answer": 1
  },
  {
    "id": "topic04-review-13",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "position-words",
    "conceptId": "position-words",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-13.prompt",
    "successKey": "grammar.v2.topic04-review-13.explanation",
    "errorKey": "grammar.v2.topic04-review-13.explanation",
    "acceptedAnswers": [
      "に"
    ],
    "solutionKey": "grammar.v2.topic04-review-13.solution",
    "kanaBank": [
      "も",
      "ゃ",
      "や",
      "ら",
      "る",
      "に"
    ]
  },
  {
    "id": "topic04-review-14",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "question-words-basic",
    "conceptId": "question-words-basic",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-14.prompt",
    "successKey": "grammar.v2.topic04-review-14.explanation",
    "errorKey": "grammar.v2.topic04-review-14.explanation",
    "acceptedAnswers": [
      "何"
    ],
    "solutionKey": "grammar.v2.topic04-review-14.solution",
    "kanaBank": [
      "し",
      "何",
      "す",
      "じ",
      "た",
      "う"
    ]
  },
  {
    "id": "topic04-review-15",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "question-words-ka-mo",
    "conceptId": "question-words-ka-mo",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic04-review-15.prompt",
    "successKey": "grammar.v2.topic04-review-15.explanation",
    "errorKey": "grammar.v2.topic04-review-15.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic04-review-15.left.0",
        "rightKey": "grammar.v2.topic04-review-15.right.0"
      },
      {
        "leftKey": "grammar.v2.topic04-review-15.left.1",
        "rightKey": "grammar.v2.topic04-review-15.right.1"
      }
    ]
  },
  {
    "id": "topic04-review-16",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "basic-counters",
    "conceptId": "basic-counters",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic04-review-16.prompt",
    "successKey": "grammar.v2.topic04-review-16.explanation",
    "errorKey": "grammar.v2.topic04-review-16.explanation",
    "options": [
      {
        "id": "topic04-review-16-option-0",
        "textKey": "grammar.v2.topic04-review-16.option.0",
        "feedbackKey": "grammar.v2.topic04-review-16.feedback.0"
      },
      {
        "id": "topic04-review-16-option-1",
        "textKey": "grammar.v2.topic04-review-16.option.1",
        "feedbackKey": "grammar.v2.topic04-review-16.feedback.1"
      },
      {
        "id": "topic04-review-16-option-2",
        "textKey": "grammar.v2.topic04-review-16.option.2",
        "feedbackKey": "grammar.v2.topic04-review-16.feedback.2"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic04-review-16.option.0",
      "grammar.v2.topic04-review-16.option.1",
      "grammar.v2.topic04-review-16.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic04-review-17",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "clock-time",
    "conceptId": "clock-time",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-17.prompt",
    "successKey": "grammar.v2.topic04-review-17.explanation",
    "errorKey": "grammar.v2.topic04-review-17.explanation",
    "acceptedAnswers": [
      "くじ"
    ],
    "solutionKey": "grammar.v2.topic04-review-17.solution",
    "kanaBank": [
      "た",
      "じ",
      "す",
      "し",
      "が",
      "く"
    ]
  },
  {
    "id": "topic04-review-18",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "calendar-dates",
    "conceptId": "calendar-dates",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic04-review-18.prompt",
    "successKey": "grammar.v2.topic04-review-18.explanation",
    "errorKey": "grammar.v2.topic04-review-18.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic04-review-18.left.0",
        "rightKey": "grammar.v2.topic04-review-18.right.0"
      },
      {
        "leftKey": "grammar.v2.topic04-review-18.left.1",
        "rightKey": "grammar.v2.topic04-review-18.right.1"
      }
    ]
  },
  {
    "id": "topic04-review-19",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "duration",
    "conceptId": "duration",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic04-review-19.prompt",
    "successKey": "grammar.v2.topic04-review-19.explanation",
    "errorKey": "grammar.v2.topic04-review-19.explanation",
    "options": [
      {
        "id": "topic04-review-19-option-0",
        "textKey": "grammar.v2.topic04-review-19.option.0",
        "feedbackKey": "grammar.v2.topic04-review-19.feedback.0"
      },
      {
        "id": "topic04-review-19-option-1",
        "textKey": "grammar.v2.topic04-review-19.option.1",
        "feedbackKey": "grammar.v2.topic04-review-19.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic04-review-19.option.0",
      "grammar.v2.topic04-review-19.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic04-review-20",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "04",
    "lessonId": "duration-gurai",
    "conceptId": "duration-gurai",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic04",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic04-review-20.prompt",
    "successKey": "grammar.v2.topic04-review-20.explanation",
    "errorKey": "grammar.v2.topic04-review-20.explanation",
    "acceptedAnswers": [
      "くらい",
      "ぐらい"
    ],
    "solutionKey": "grammar.v2.topic04-review-20.solution",
    "kanaBank": [
      "も",
      "ゃ",
      "ら",
      "い",
      "く",
      "ぐ"
    ]
  },
  {
    "id": "topic05-review-01",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "verb-stem",
    "conceptId": "verb-stem",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-01.prompt",
    "successKey": "grammar.v2.topic05-review-01.explanation",
    "errorKey": "grammar.v2.topic05-review-01.explanation",
    "acceptedAnswers": [
      "書き"
    ],
    "solutionKey": "grammar.v2.topic05-review-01.solution",
    "kanaBank": [
      "い",
      "う",
      "え",
      "か",
      "き",
      "書"
    ]
  },
  {
    "id": "topic05-review-02",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "verb-stem",
    "conceptId": "verb-stem",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-02.prompt",
    "successKey": "grammar.v2.topic05-review-02.explanation",
    "errorKey": "grammar.v2.topic05-review-02.explanation",
    "acceptedAnswers": [
      "買い"
    ],
    "solutionKey": "grammar.v2.topic05-review-02.solution",
    "kanaBank": [
      "い",
      "や",
      "買",
      "じ",
      "す",
      "た"
    ]
  },
  {
    "id": "topic05-review-03",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "motion-purpose-ni-iku",
    "conceptId": "motion-purpose-ni-iku",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-03.prompt",
    "successKey": "grammar.v2.topic05-review-03.explanation",
    "errorKey": "grammar.v2.topic05-review-03.explanation",
    "acceptedAnswers": [
      "見"
    ],
    "solutionKey": "grammar.v2.topic05-review-03.solution",
    "kanaBank": [
      "な",
      "に",
      "と",
      "の",
      "は",
      "見"
    ]
  },
  {
    "id": "topic05-review-04",
    "version": 2,
    "kind": "sentence-order",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "motion-purpose-ni-iku",
    "conceptId": "motion-purpose-ni-iku",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic05-review-04.prompt",
    "successKey": "grammar.v2.topic05-review-04.explanation",
    "errorKey": "grammar.v2.topic05-review-04.explanation",
    "tokenKeys": [
      "grammar.v2.topic05-review-04.token.0",
      "grammar.v2.topic05-review-04.token.1",
      "grammar.v2.topic05-review-04.token.2",
      "grammar.v2.topic05-review-04.token.3"
    ],
    "solution": [
      1,
      3,
      2,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic05-review-05",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "polite-verb-masu-system",
    "conceptId": "polite-verb-masu-system",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-05.prompt",
    "successKey": "grammar.v2.topic05-review-05.explanation",
    "errorKey": "grammar.v2.topic05-review-05.explanation",
    "acceptedAnswers": [
      "飲みませんでした"
    ],
    "solutionKey": "grammar.v2.topic05-review-05.solution",
    "kanaBank": [
      "飲",
      "を",
      "ん",
      "れ",
      "ま",
      "み",
      "で",
      "た",
      "せ",
      "し"
    ]
  },
  {
    "id": "topic05-review-06",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "polite-verb-masu-system",
    "conceptId": "polite-verb-masu-system",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic05-review-06.prompt",
    "successKey": "grammar.v2.topic05-review-06.explanation",
    "errorKey": "grammar.v2.topic05-review-06.explanation",
    "options": [
      {
        "id": "topic05-review-06-option-0",
        "textKey": "grammar.v2.topic05-review-06.option.0",
        "feedbackKey": "grammar.v2.topic05-review-06.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic05-review-06-option-1",
        "textKey": "grammar.v2.topic05-review-06.option.1",
        "feedbackKey": "grammar.v2.topic05-review-06.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic05-review-06-option-2",
        "textKey": "grammar.v2.topic05-review-06.option.2",
        "feedbackKey": "grammar.v2.topic05-review-06.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic05-review-06.option.0",
      "grammar.v2.topic05-review-06.option.1",
      "grammar.v2.topic05-review-06.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic05-review-07",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "polite-verb-masu-system",
    "conceptId": "polite-verb-masu-system",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic05-review-07.prompt",
    "successKey": "grammar.v2.topic05-review-07.explanation",
    "errorKey": "grammar.v2.topic05-review-07.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic05-review-07.left.0",
        "rightKey": "grammar.v2.topic05-review-07.right.0"
      },
      {
        "leftKey": "grammar.v2.topic05-review-07.left.1",
        "rightKey": "grammar.v2.topic05-review-07.right.1"
      },
      {
        "leftKey": "grammar.v2.topic05-review-07.left.2",
        "rightKey": "grammar.v2.topic05-review-07.right.2"
      },
      {
        "leftKey": "grammar.v2.topic05-review-07.left.3",
        "rightKey": "grammar.v2.topic05-review-07.right.3"
      }
    ]
  },
  {
    "id": "topic05-review-08",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "polite-desu-system",
    "conceptId": "polite-desu-system",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-08.prompt",
    "successKey": "grammar.v2.topic05-review-08.explanation",
    "errorKey": "grammar.v2.topic05-review-08.explanation",
    "acceptedAnswers": [
      "静かです"
    ],
    "solutionKey": "grammar.v2.topic05-review-08.solution",
    "kanaBank": [
      "ん",
      "を",
      "す",
      "静",
      "か",
      "で"
    ]
  },
  {
    "id": "topic05-review-09",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "polite-desu-system",
    "conceptId": "polite-desu-system",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-09.prompt",
    "successKey": "grammar.v2.topic05-review-09.explanation",
    "errorKey": "grammar.v2.topic05-review-09.explanation",
    "acceptedAnswers": [
      "高かったです"
    ],
    "solutionKey": "grammar.v2.topic05-review-09.solution",
    "kanaBank": [
      "を",
      "ん",
      "高",
      "か",
      "す",
      "た",
      "っ",
      "で"
    ]
  },
  {
    "id": "topic05-review-10",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "polite-desu-system",
    "conceptId": "polite-desu-system",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic05-review-10.prompt",
    "successKey": "grammar.v2.topic05-review-10.explanation",
    "errorKey": "grammar.v2.topic05-review-10.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic05-review-10.left.0",
        "rightKey": "grammar.v2.topic05-review-10.right.0"
      },
      {
        "leftKey": "grammar.v2.topic05-review-10.left.1",
        "rightKey": "grammar.v2.topic05-review-10.right.1"
      }
    ]
  },
  {
    "id": "topic05-review-11",
    "version": 2,
    "kind": "detect-error",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "da-vs-desu",
    "conceptId": "da-vs-desu",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.detect",
    "promptKey": "grammar.v2.topic05-review-11.prompt",
    "successKey": "grammar.v2.topic05-review-11.explanation",
    "errorKey": "grammar.v2.topic05-review-11.explanation",
    "options": [
      {
        "id": "topic05-review-11-option-0",
        "textKey": "grammar.v2.topic05-review-11.option.0",
        "feedbackKey": "grammar.v2.topic05-review-11.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic05-review-11-option-1",
        "textKey": "grammar.v2.topic05-review-11.option.1",
        "feedbackKey": "grammar.v2.topic05-review-11.feedback.1",
        "grammarStatus": "invalid"
      },
      {
        "id": "topic05-review-11-option-2",
        "textKey": "grammar.v2.topic05-review-11.option.2",
        "feedbackKey": "grammar.v2.topic05-review-11.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic05-review-11.option.0",
      "grammar.v2.topic05-review-11.option.1",
      "grammar.v2.topic05-review-11.option.2"
    ],
    "answer": 1
  },
  {
    "id": "topic05-review-12",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "question-ka",
    "conceptId": "question-ka",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-12.prompt",
    "successKey": "grammar.v2.topic05-review-12.explanation",
    "errorKey": "grammar.v2.topic05-review-12.explanation",
    "acceptedAnswers": [
      "か"
    ],
    "solutionKey": "grammar.v2.topic05-review-12.solution",
    "kanaBank": [
      "へ",
      "ま",
      "だ",
      "で",
      "と",
      "か"
    ]
  },
  {
    "id": "topic05-review-13",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "plain-vs-polite",
    "conceptId": "plain-vs-polite",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-13.prompt",
    "successKey": "grammar.v2.topic05-review-13.explanation",
    "errorKey": "grammar.v2.topic05-review-13.explanation",
    "acceptedAnswers": [
      "食べませんでした"
    ],
    "solutionKey": "grammar.v2.topic05-review-13.solution",
    "kanaBank": [
      "ん",
      "を",
      "食",
      "い",
      "し",
      "た",
      "せ",
      "で",
      "ま",
      "べ"
    ]
  },
  {
    "id": "topic05-review-14",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "plain-vs-polite",
    "conceptId": "plain-vs-polite",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic05-review-14.prompt",
    "successKey": "grammar.v2.topic05-review-14.explanation",
    "errorKey": "grammar.v2.topic05-review-14.explanation",
    "acceptedAnswers": [
      "この映画は面白くなかったです。"
    ],
    "solutionKey": "grammar.v2.topic05-review-14.solution",
    "kanaBank": [
      "か",
      "え",
      "し",
      "こ",
      "た",
      "す",
      "映",
      "画",
      "。",
      "で",
      "面",
      "っ",
      "の",
      "は",
      "な",
      "白",
      "く"
    ]
  },
  {
    "id": "topic05-review-15",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "sentence-ending-ne-yo",
    "conceptId": "sentence-ending-ne-yo",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic05-review-15.prompt",
    "successKey": "grammar.v2.topic05-review-15.explanation",
    "errorKey": "grammar.v2.topic05-review-15.explanation",
    "options": [
      {
        "id": "topic05-review-15-option-0",
        "textKey": "grammar.v2.topic05-review-15.option.0",
        "feedbackKey": "grammar.v2.topic05-review-15.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic05-review-15-option-1",
        "textKey": "grammar.v2.topic05-review-15.option.1",
        "feedbackKey": "grammar.v2.topic05-review-15.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic05-review-15-option-2",
        "textKey": "grammar.v2.topic05-review-15.option.2",
        "feedbackKey": "grammar.v2.topic05-review-15.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic05-review-15.option.0",
      "grammar.v2.topic05-review-15.option.1",
      "grammar.v2.topic05-review-15.option.2"
    ],
    "answer": 0
  },
  {
    "id": "topic05-review-16",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "05",
    "lessonId": "sentence-ending-ne-yo",
    "conceptId": "sentence-ending-ne-yo",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic05",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic05-review-16.prompt",
    "successKey": "grammar.v2.topic05-review-16.explanation",
    "errorKey": "grammar.v2.topic05-review-16.explanation",
    "options": [
      {
        "id": "topic05-review-16-option-0",
        "textKey": "grammar.v2.topic05-review-16.option.0",
        "feedbackKey": "grammar.v2.topic05-review-16.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic05-review-16-option-1",
        "textKey": "grammar.v2.topic05-review-16.option.1",
        "feedbackKey": "grammar.v2.topic05-review-16.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic05-review-16-option-2",
        "textKey": "grammar.v2.topic05-review-16.option.2",
        "feedbackKey": "grammar.v2.topic05-review-16.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic05-review-16.option.0",
      "grammar.v2.topic05-review-16.option.1",
      "grammar.v2.topic05-review-16.option.2"
    ],
    "answer": 1
  },
  {
    "id": "topic06-review-01",
    "version": 2,
    "kind": "sentence-order",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "relative-clause-noun",
    "conceptId": "relative-clause-noun",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic06-review-01.prompt",
    "successKey": "grammar.v2.topic06-review-01.explanation",
    "errorKey": "grammar.v2.topic06-review-01.explanation",
    "tokenKeys": [
      "grammar.v2.topic06-review-01.token.0",
      "grammar.v2.topic06-review-01.token.1",
      "grammar.v2.topic06-review-01.token.2"
    ],
    "solution": [
      1,
      2,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic06-review-02",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "relative-clause-noun",
    "conceptId": "relative-clause-noun",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic06-review-02.prompt",
    "successKey": "grammar.v2.topic06-review-02.explanation",
    "errorKey": "grammar.v2.topic06-review-02.explanation",
    "options": [
      {
        "id": "topic06-review-02-option-0",
        "textKey": "grammar.v2.topic06-review-02.option.0",
        "feedbackKey": "grammar.v2.topic06-review-02.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic06-review-02-option-1",
        "textKey": "grammar.v2.topic06-review-02.option.1",
        "feedbackKey": "grammar.v2.topic06-review-02.feedback.1",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic06-review-02.option.0",
      "grammar.v2.topic06-review-02.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic06-review-03",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "relative-clause-noun",
    "conceptId": "relative-clause-noun",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic06-review-03.prompt",
    "successKey": "grammar.v2.topic06-review-03.explanation",
    "errorKey": "grammar.v2.topic06-review-03.explanation",
    "acceptedAnswers": [
      "が"
    ],
    "solutionKey": "grammar.v2.topic06-review-03.solution",
    "kanaBank": [
      "ゃ",
      "も",
      "や",
      "ら",
      "る",
      "が"
    ]
  },
  {
    "id": "topic06-review-04",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "nominalizer-no",
    "conceptId": "nominalizer-no",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic06-review-04.prompt",
    "successKey": "grammar.v2.topic06-review-04.explanation",
    "errorKey": "grammar.v2.topic06-review-04.explanation",
    "acceptedAnswers": [
      "の"
    ],
    "solutionKey": "grammar.v2.topic06-review-04.solution",
    "kanaBank": [
      "が",
      "う",
      "い",
      "じ",
      "す",
      "の"
    ]
  },
  {
    "id": "topic06-review-05",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "nominalizer-no",
    "conceptId": "nominalizer-no",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic06-review-05.prompt",
    "successKey": "grammar.v2.topic06-review-05.explanation",
    "errorKey": "grammar.v2.topic06-review-05.explanation",
    "acceptedAnswers": [
      "は"
    ],
    "solutionKey": "grammar.v2.topic06-review-05.solution",
    "kanaBank": [
      "う",
      "い",
      "く",
      "が",
      "か",
      "は"
    ]
  },
  {
    "id": "topic06-review-06",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "nominalizer-no",
    "conceptId": "nominalizer-no",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic06-review-06.prompt",
    "successKey": "grammar.v2.topic06-review-06.explanation",
    "errorKey": "grammar.v2.topic06-review-06.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic06-review-06.left.0",
        "rightKey": "grammar.v2.topic06-review-06.right.0"
      },
      {
        "leftKey": "grammar.v2.topic06-review-06.left.1",
        "rightKey": "grammar.v2.topic06-review-06.right.1"
      }
    ]
  },
  {
    "id": "topic06-review-07",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "explanatory-no-ndesu",
    "conceptId": "explanatory-no-ndesu",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic06-review-07.prompt",
    "successKey": "grammar.v2.topic06-review-07.explanation",
    "errorKey": "grammar.v2.topic06-review-07.explanation",
    "acceptedAnswers": [
      "なん"
    ],
    "solutionKey": "grammar.v2.topic06-review-07.solution",
    "kanaBank": [
      "ん",
      "な",
      "だ",
      "で",
      "へ",
      "ま"
    ]
  },
  {
    "id": "topic06-review-08",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "explanatory-no-ndesu",
    "conceptId": "explanatory-no-ndesu",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic06-review-08.prompt",
    "successKey": "grammar.v2.topic06-review-08.explanation",
    "errorKey": "grammar.v2.topic06-review-08.explanation",
    "acceptedAnswers": [
      "んです"
    ],
    "solutionKey": "grammar.v2.topic06-review-08.solution",
    "kanaBank": [
      "く",
      "が",
      "か",
      "で",
      "ん",
      "す"
    ]
  },
  {
    "id": "topic06-review-09",
    "version": 2,
    "kind": "detect-error",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "explanatory-no-ndesu",
    "conceptId": "explanatory-no-ndesu",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.detect",
    "promptKey": "grammar.v2.topic06-review-09.prompt",
    "successKey": "grammar.v2.topic06-review-09.explanation",
    "errorKey": "grammar.v2.topic06-review-09.explanation",
    "options": [
      {
        "id": "topic06-review-09-option-0",
        "textKey": "grammar.v2.topic06-review-09.option.0",
        "feedbackKey": "grammar.v2.topic06-review-09.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic06-review-09-option-1",
        "textKey": "grammar.v2.topic06-review-09.option.1",
        "feedbackKey": "grammar.v2.topic06-review-09.feedback.1",
        "grammarStatus": "invalid"
      },
      {
        "id": "topic06-review-09-option-2",
        "textKey": "grammar.v2.topic06-review-09.option.2",
        "feedbackKey": "grammar.v2.topic06-review-09.feedback.2",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic06-review-09.option.0",
      "grammar.v2.topic06-review-09.option.1",
      "grammar.v2.topic06-review-09.option.2"
    ],
    "answer": 1
  },
  {
    "id": "topic06-review-10",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "casual-question-no",
    "conceptId": "casual-question-no",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic06-review-10.prompt",
    "successKey": "grammar.v2.topic06-review-10.explanation",
    "errorKey": "grammar.v2.topic06-review-10.explanation",
    "acceptedAnswers": [
      "の"
    ],
    "solutionKey": "grammar.v2.topic06-review-10.solution",
    "kanaBank": [
      "ん",
      "を",
      "ゃ",
      "も",
      "や",
      "の"
    ]
  },
  {
    "id": "topic06-review-11",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "casual-question-no",
    "conceptId": "casual-question-no",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic06-review-11.prompt",
    "successKey": "grammar.v2.topic06-review-11.explanation",
    "errorKey": "grammar.v2.topic06-review-11.explanation",
    "acceptedAnswers": [
      "の"
    ],
    "solutionKey": "grammar.v2.topic06-review-11.solution",
    "kanaBank": [
      "の",
      "は",
      "と",
      "な",
      "に",
      "で"
    ]
  },
  {
    "id": "topic06-review-12",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "quotation-to",
    "conceptId": "quotation-to",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic06-review-12.prompt",
    "successKey": "grammar.v2.topic06-review-12.explanation",
    "errorKey": "grammar.v2.topic06-review-12.explanation",
    "options": [
      {
        "id": "topic06-review-12-option-0",
        "textKey": "grammar.v2.topic06-review-12.option.0",
        "feedbackKey": "grammar.v2.topic06-review-12.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic06-review-12-option-1",
        "textKey": "grammar.v2.topic06-review-12.option.1",
        "feedbackKey": "grammar.v2.topic06-review-12.feedback.1"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic06-review-12.option.0",
      "grammar.v2.topic06-review-12.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic06-review-13",
    "version": 2,
    "kind": "sentence-order",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "quotation-to",
    "conceptId": "quotation-to",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic06-review-13.prompt",
    "successKey": "grammar.v2.topic06-review-13.explanation",
    "errorKey": "grammar.v2.topic06-review-13.explanation",
    "tokenKeys": [
      "grammar.v2.topic06-review-13.token.0",
      "grammar.v2.topic06-review-13.token.1",
      "grammar.v2.topic06-review-13.token.2"
    ],
    "solution": [
      2,
      0,
      1
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic06-review-14",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "quotation-to",
    "conceptId": "quotation-to",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic06-review-14.prompt",
    "successKey": "grammar.v2.topic06-review-14.explanation",
    "errorKey": "grammar.v2.topic06-review-14.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic06-review-14.left.0",
        "rightKey": "grammar.v2.topic06-review-14.right.0"
      },
      {
        "leftKey": "grammar.v2.topic06-review-14.left.1",
        "rightKey": "grammar.v2.topic06-review-14.right.1"
      },
      {
        "leftKey": "grammar.v2.topic06-review-14.left.2",
        "rightKey": "grammar.v2.topic06-review-14.right.2"
      }
    ]
  },
  {
    "id": "topic06-review-15",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "06",
    "lessonId": "casual-question-no",
    "conceptId": "casual-question-no",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic06",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic06-review-15.prompt",
    "successKey": "grammar.v2.topic06-review-15.explanation",
    "errorKey": "grammar.v2.topic06-review-15.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic06-review-15.left.0",
        "rightKey": "grammar.v2.topic06-review-15.right.0"
      },
      {
        "leftKey": "grammar.v2.topic06-review-15.left.1",
        "rightKey": "grammar.v2.topic06-review-15.right.1"
      },
      {
        "leftKey": "grammar.v2.topic06-review-15.left.2",
        "rightKey": "grammar.v2.topic06-review-15.right.2"
      }
    ]
  },
  {
    "id": "topic07-review-01",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-form-formation",
    "conceptId": "te-form-formation",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-01.prompt",
    "successKey": "grammar.v2.topic07-review-01.explanation",
    "errorKey": "grammar.v2.topic07-review-01.explanation",
    "acceptedAnswers": [
      "読んで"
    ],
    "solutionKey": "grammar.v2.topic07-review-01.solution",
    "kanaBank": [
      "へ",
      "ま",
      "な",
      "で",
      "ん",
      "読"
    ]
  },
  {
    "id": "topic07-review-02",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-form-formation",
    "conceptId": "te-form-formation",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-02.prompt",
    "successKey": "grammar.v2.topic07-review-02.explanation",
    "errorKey": "grammar.v2.topic07-review-02.explanation",
    "acceptedAnswers": [
      "行って"
    ],
    "solutionKey": "grammar.v2.topic07-review-02.solution",
    "kanaBank": [
      "い",
      "う",
      "が",
      "行",
      "て",
      "っ"
    ]
  },
  {
    "id": "topic07-review-03",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-form-formation",
    "conceptId": "te-form-formation",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic07-review-03.prompt",
    "successKey": "grammar.v2.topic07-review-03.explanation",
    "errorKey": "grammar.v2.topic07-review-03.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic07-review-03.left.0",
        "rightKey": "grammar.v2.topic07-review-03.right.0"
      },
      {
        "leftKey": "grammar.v2.topic07-review-03.left.1",
        "rightKey": "grammar.v2.topic07-review-03.right.1"
      }
    ]
  },
  {
    "id": "topic07-review-04",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-form-formation",
    "conceptId": "te-form-formation",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic07-review-04.prompt",
    "successKey": "grammar.v2.topic07-review-04.explanation",
    "errorKey": "grammar.v2.topic07-review-04.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic07-review-04.left.0",
        "rightKey": "grammar.v2.topic07-review-04.right.0"
      },
      {
        "leftKey": "grammar.v2.topic07-review-04.left.1",
        "rightKey": "grammar.v2.topic07-review-04.right.1"
      }
    ]
  },
  {
    "id": "topic07-review-05",
    "version": 2,
    "kind": "sentence-order",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-action-sequence",
    "conceptId": "te-action-sequence",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic07-review-05.prompt",
    "successKey": "grammar.v2.topic07-review-05.explanation",
    "errorKey": "grammar.v2.topic07-review-05.explanation",
    "tokenKeys": [
      "grammar.v2.topic07-review-05.token.0",
      "grammar.v2.topic07-review-05.token.1",
      "grammar.v2.topic07-review-05.token.2"
    ],
    "solution": [
      1,
      2,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic07-review-06",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "contrast",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-action-sequence",
    "conceptId": "te-action-sequence",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic07-review-06.prompt",
    "successKey": "grammar.v2.topic07-review-06.explanation",
    "errorKey": "grammar.v2.topic07-review-06.explanation",
    "options": [
      {
        "id": "topic07-review-06-option-0",
        "textKey": "grammar.v2.topic07-review-06.option.0",
        "feedbackKey": "grammar.v2.topic07-review-06.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic07-review-06-option-1",
        "textKey": "grammar.v2.topic07-review-06.option.1",
        "feedbackKey": "grammar.v2.topic07-review-06.feedback.1",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic07-review-06.option.0",
      "grammar.v2.topic07-review-06.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic07-review-07",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-iru-progressive",
    "conceptId": "te-iru-progressive",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-07.prompt",
    "successKey": "grammar.v2.topic07-review-07.explanation",
    "errorKey": "grammar.v2.topic07-review-07.explanation",
    "acceptedAnswers": [
      "読んでいる"
    ],
    "solutionKey": "grammar.v2.topic07-review-07.solution",
    "kanaBank": [
      "る",
      "や",
      "も",
      "ん",
      "で",
      "い",
      "読"
    ]
  },
  {
    "id": "topic07-review-08",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-iru-progressive",
    "conceptId": "te-iru-progressive",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-08.prompt",
    "successKey": "grammar.v2.topic07-review-08.explanation",
    "errorKey": "grammar.v2.topic07-review-08.explanation",
    "acceptedAnswers": [
      "読んでいます"
    ],
    "solutionKey": "grammar.v2.topic07-review-08.solution",
    "kanaBank": [
      "え",
      "う",
      "い",
      "ま",
      "で",
      "ん",
      "読",
      "す"
    ]
  },
  {
    "id": "topic07-review-09",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-iru-result-state",
    "conceptId": "te-iru-result-state",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic07-review-09.prompt",
    "successKey": "grammar.v2.topic07-review-09.explanation",
    "errorKey": "grammar.v2.topic07-review-09.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic07-review-09.left.0",
        "rightKey": "grammar.v2.topic07-review-09.right.0"
      },
      {
        "leftKey": "grammar.v2.topic07-review-09.left.1",
        "rightKey": "grammar.v2.topic07-review-09.right.1"
      }
    ]
  },
  {
    "id": "topic07-review-10",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-iru-result-state",
    "conceptId": "te-iru-result-state",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-10.prompt",
    "successKey": "grammar.v2.topic07-review-10.explanation",
    "errorKey": "grammar.v2.topic07-review-10.explanation",
    "acceptedAnswers": [
      "知っている"
    ],
    "solutionKey": "grammar.v2.topic07-review-10.solution",
    "kanaBank": [
      "を",
      "ん",
      "る",
      "い",
      "て",
      "っ",
      "知"
    ]
  },
  {
    "id": "topic07-review-11",
    "version": 2,
    "kind": "sentence-order",
    "skill": "ordering",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-kara",
    "conceptId": "te-kara",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.order",
    "promptKey": "grammar.v2.topic07-review-11.prompt",
    "successKey": "grammar.v2.topic07-review-11.explanation",
    "errorKey": "grammar.v2.topic07-review-11.explanation",
    "tokenKeys": [
      "grammar.v2.topic07-review-11.token.0",
      "grammar.v2.topic07-review-11.token.1"
    ],
    "solution": [
      1,
      0
    ],
    "orderPolicy": "constrained"
  },
  {
    "id": "topic07-review-12",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-kudasai",
    "conceptId": "te-kudasai",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-12.prompt",
    "successKey": "grammar.v2.topic07-review-12.explanation",
    "errorKey": "grammar.v2.topic07-review-12.explanation",
    "acceptedAnswers": [
      "書いてください"
    ],
    "solutionKey": "grammar.v2.topic07-review-12.solution",
    "kanaBank": [
      "書",
      "し",
      "さ",
      "た",
      "い",
      "く",
      "て",
      "だ"
    ]
  },
  {
    "id": "topic07-review-13",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-mo-ii",
    "conceptId": "te-mo-ii",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic07-review-13.prompt",
    "successKey": "grammar.v2.topic07-review-13.explanation",
    "errorKey": "grammar.v2.topic07-review-13.explanation",
    "options": [
      {
        "id": "topic07-review-13-option-0",
        "textKey": "grammar.v2.topic07-review-13.option.0",
        "feedbackKey": "grammar.v2.topic07-review-13.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic07-review-13-option-1",
        "textKey": "grammar.v2.topic07-review-13.option.1",
        "feedbackKey": "grammar.v2.topic07-review-13.feedback.1",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic07-review-13.option.0",
      "grammar.v2.topic07-review-13.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic07-review-14",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-wa-ikenai",
    "conceptId": "te-wa-ikenai",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic07-review-14.prompt",
    "successKey": "grammar.v2.topic07-review-14.explanation",
    "errorKey": "grammar.v2.topic07-review-14.explanation",
    "options": [
      {
        "id": "topic07-review-14-option-0",
        "textKey": "grammar.v2.topic07-review-14.option.0",
        "feedbackKey": "grammar.v2.topic07-review-14.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic07-review-14-option-1",
        "textKey": "grammar.v2.topic07-review-14.option.1",
        "feedbackKey": "grammar.v2.topic07-review-14.feedback.1",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic07-review-14.option.0",
      "grammar.v2.topic07-review-14.option.1"
    ],
    "answer": 0
  },
  {
    "id": "topic07-review-15",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "nai-de-kudasai",
    "conceptId": "nai-de-kudasai",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-15.prompt",
    "successKey": "grammar.v2.topic07-review-15.explanation",
    "errorKey": "grammar.v2.topic07-review-15.explanation",
    "acceptedAnswers": [
      "撮らないでください"
    ],
    "solutionKey": "grammar.v2.topic07-review-15.solution",
    "kanaBank": [
      "撮",
      "ん",
      "を",
      "ら",
      "で",
      "だ",
      "な",
      "さ",
      "い",
      "く"
    ]
  },
  {
    "id": "topic07-review-16",
    "version": 2,
    "kind": "fill-gap",
    "skill": "formation",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "nai-de-kudasai",
    "conceptId": "nai-de-kudasai",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.fill",
    "promptKey": "grammar.v2.topic07-review-16.prompt",
    "successKey": "grammar.v2.topic07-review-16.explanation",
    "errorKey": "grammar.v2.topic07-review-16.explanation",
    "acceptedAnswers": [
      "来ないでください"
    ],
    "solutionKey": "grammar.v2.topic07-review-16.solution",
    "kanaBank": [
      "が",
      "う",
      "い",
      "さ",
      "な",
      "だ",
      "で",
      "来",
      "く"
    ]
  },
  {
    "id": "topic07-review-17",
    "version": 2,
    "kind": "multiple-choice",
    "skill": "usage",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "te-kudasai",
    "conceptId": "te-kudasai",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.choose",
    "promptKey": "grammar.v2.topic07-review-17.prompt",
    "successKey": "grammar.v2.topic07-review-17.explanation",
    "errorKey": "grammar.v2.topic07-review-17.explanation",
    "options": [
      {
        "id": "topic07-review-17-option-0",
        "textKey": "grammar.v2.topic07-review-17.option.0",
        "feedbackKey": "grammar.v2.topic07-review-17.feedback.0",
        "grammarStatus": "valid"
      },
      {
        "id": "topic07-review-17-option-1",
        "textKey": "grammar.v2.topic07-review-17.option.1",
        "feedbackKey": "grammar.v2.topic07-review-17.feedback.1",
        "grammarStatus": "valid"
      },
      {
        "id": "topic07-review-17-option-2",
        "textKey": "grammar.v2.topic07-review-17.option.2",
        "feedbackKey": "grammar.v2.topic07-review-17.feedback.2",
        "grammarStatus": "valid"
      },
      {
        "id": "topic07-review-17-option-3",
        "textKey": "grammar.v2.topic07-review-17.option.3",
        "feedbackKey": "grammar.v2.topic07-review-17.feedback.3",
        "grammarStatus": "valid"
      }
    ],
    "optionKeys": [
      "grammar.v2.topic07-review-17.option.0",
      "grammar.v2.topic07-review-17.option.1",
      "grammar.v2.topic07-review-17.option.2",
      "grammar.v2.topic07-review-17.option.3"
    ],
    "answer": 0
  },
  {
    "id": "topic07-review-18",
    "version": 2,
    "kind": "matching",
    "skill": "recognition",
    "difficulty": 3,
    "topicId": "07",
    "lessonId": "nai-de-kudasai",
    "conceptId": "nai-de-kudasai",
    "labelKey": "grammar.v2.practice",
    "topicKey": "grammar.v2.topic07",
    "questionKey": "grammar.v2.match",
    "promptKey": "grammar.v2.topic07-review-18.prompt",
    "successKey": "grammar.v2.topic07-review-18.explanation",
    "errorKey": "grammar.v2.topic07-review-18.explanation",
    "pairs": [
      {
        "leftKey": "grammar.v2.topic07-review-18.left.0",
        "rightKey": "grammar.v2.topic07-review-18.right.0"
      },
      {
        "leftKey": "grammar.v2.topic07-review-18.left.1",
        "rightKey": "grammar.v2.topic07-review-18.right.1"
      },
      {
        "leftKey": "grammar.v2.topic07-review-18.left.2",
        "rightKey": "grammar.v2.topic07-review-18.right.2"
      },
      {
        "leftKey": "grammar.v2.topic07-review-18.left.3",
        "rightKey": "grammar.v2.topic07-review-18.right.3"
      }
    ]
  }
];
