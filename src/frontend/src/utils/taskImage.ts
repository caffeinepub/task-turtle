// Keyword-to-emoji mapping for task card images
// Returns an emoji string based on task title/description keywords
// Falls back to '🐢' (Task Turtle logo placeholder)

const KEYWORD_MAP: Array<[string[], string]> = [
  [["banana", "bananas", "kela"], "🍌"],
  [["milk", "doodh", "dairy"], "🥛"],
  [
    ["medicine", "dawa", "tablet", "capsule", "medical", "pharmacy", "chemist"],
    "💊",
  ],
  [["grocery", "groceries", "kirana", "supermarket"], "🛒"],
  [["bread", "pav", "roti", "chapati"], "🍞"],
  [
    [
      "vegetables",
      "sabzi",
      "veggie",
      "onion",
      "tomato",
      "potato",
      "carrot",
      "spinach",
    ],
    "🥦",
  ],
  [
    ["fruit", "fruits", "apple", "mango", "orange", "grapes", "watermelon"],
    "🍎",
  ],
  [["water", "pani", "bottle", "jar", "mineral"], "💧"],
  [["rice", "chawal", "dal", "lentil"], "🍚"],
  [["egg", "eggs", "anda"], "🥚"],
  [["coffee", "tea", "chai", "beverage", "drink"], "☕"],
  [
    [
      "pizza",
      "burger",
      "food",
      "khana",
      "snack",
      "biryani",
      "lunch",
      "dinner",
      "breakfast",
      "meal",
    ],
    "🍕",
  ],
  [["book", "notebook", "copy", "stationery", "pen", "pencil"], "📚"],
  [["phone", "mobile", "charger", "cable", "earphone", "headphone"], "📱"],
  [["parcel", "package", "deliver", "courier", "box", "shipment"], "📦"],
  [["flower", "flowers", "bouquet", "rose", "lily"], "💐"],
  [
    ["clothes", "shirt", "dress", "laundry", "pants", "jeans", "kurta", "sari"],
    "👔",
  ],
  [
    [
      "cake",
      "sweets",
      "mithai",
      "birthday",
      "chocolate",
      "dessert",
      "ice cream",
    ],
    "🎂",
  ],
  [
    [
      "documents",
      "document",
      "papers",
      "file",
      "certificate",
      "form",
      "paperwork",
    ],
    "📄",
  ],
  [["shoes", "footwear", "chappal", "sandals", "slippers"], "👟"],
  [["oil", "cooking", "mustard", "sunflower", "ghee", "butter"], "🫙"],
  [["sugar", "salt", "spice", "masala", "flour", "atta", "maida"], "🧂"],
  [["soap", "shampoo", "detergent", "toothpaste", "brush", "razor"], "🧴"],
  [["chicken", "mutton", "fish", "meat", "prawn", "seafood"], "🍗"],
  [["newspaper", "magazine", "book"], "📰"],
  [["toy", "toys", "kids", "children", "baby"], "🧸"],
  [["tool", "repair", "fix", "hardware", "screw", "bolt"], "🔧"],
  [["key", "lock", "duplicate", "spare"], "🔑"],
  [["pet", "dog", "cat", "animal", "food"], "🐾"],
  [["bank", "atm", "cash", "money", "payment", "cheque", "challan"], "💳"],
];

export function getTaskEmoji(title: string, description = ""): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const [keywords, emoji] of KEYWORD_MAP) {
    if (keywords.some((k) => text.includes(k))) {
      return emoji;
    }
  }
  return "🐢"; // Task Turtle fallback
}
