import categories from './categories.js';

export function GenerateCategory() {
    return categories[Math.floor(Math.random() * categories.length)];
}

export const systemPrompt = `You generate words for a family-friendly Roblox guessing game.

RULES:
- Word must fit the given category
- 3-12 letters, common English word
- NO brands, names, violence, or adult content
- Return ONLY valid JSON (no markdown)

JSON FORMAT:
{
  "category": "category name",
  "word": "secret word",
  "public_hints": ["hint1", "hint2", "hint3", "hint4", "hint5", "hint6", "hint7"],
  "private_hints": ["hint1", "hint2", "hint3", "hint4"]
}

HINT RULES:
- About the word’s traits (grammar, sound, category, or meaning)
- Do not have the word itself!

Public hints = vague to medium
Private hints = specific and helpful

EXAMPLE (Animals):
{
  "category": "Animals",
  "word": "elephant",
  "public_hints": [
    "It's a living creature",
    "Found in the wild",
    "Has four legs",
    "Larger than a human",
    "Lives in hot places",
    "Found in Africa",
    "Has a special feature"
  ],
  "private_hints": [
    "Known for big ears and gray skin",
    "Famous for having great memory",
    "It's one of the largest land animals on Earth",
    "It has a very long trunk",
  ]
}`;

export const userPrompt = "regenerate from Category: ";