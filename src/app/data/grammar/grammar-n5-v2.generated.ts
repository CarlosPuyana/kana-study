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
      "particle-wa-topic"
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
      "adjective-i"
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
      "adjective-negative"
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
          "じ",
          "ゃ",
          "な",
          "い"
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
      "adjective-past"
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
          "だ",
          "っ",
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
      "adjective-past-negative"
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
          "じ",
          "ゃ",
          "な",
          "か",
          "っ",
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
      "adjectival-predicates-ga"
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
      "demonstratives-ko-so-a-do"
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
    "relatedIds": [],
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
          "こ",
          "の"
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
      "adjectival-predicates-ga"
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
      "adjective-past"
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
      "degree-adverbs"
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
          "く",
          "な",
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
      "adjective-ii-irregular"
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
          "か",
          "っ",
          "た"
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
      "adjective-ii-irregular"
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
          "な",
          "か",
          "っ",
          "た"
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
    "relatedIds": [],
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
          "よ",
          "か",
          "っ",
          "た"
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
          "な",
          "い"
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
      "じ",
      "ゃ",
      "な",
      "い"
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
      "が"
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
      "そ",
      "の"
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
      "く",
      "な",
      "い"
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
      "じ",
      "ゃ",
      "な",
      "い"
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
      "か",
      "っ",
      "た"
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
      "だ",
      "っ",
      "た"
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
      "な",
      "か",
      "っ",
      "た"
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
      "よ",
      "く",
      "な",
      "か",
      "っ",
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
  }
];
