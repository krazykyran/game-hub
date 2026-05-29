// Curated list of common 5-letter words. Used both as the answer pool and the
// accepted-guess dictionary to keep the game fully self-contained (no API/files).
export const WORDS = [
  'apple', 'beach', 'brain', 'bread', 'brush', 'chair', 'chest', 'chord', 'click', 'clock',
  'cloud', 'dance', 'diary', 'eagle', 'earth', 'flame', 'flock', 'flour', 'fruit', 'ghost',
  'glass', 'grape', 'grass', 'green', 'happy', 'heart', 'horse', 'house', 'juice', 'knife',
  'lemon', 'light', 'lunch', 'magic', 'mango', 'maple', 'money', 'mouse', 'music', 'night',
  'ocean', 'paint', 'panda', 'party', 'peace', 'piano', 'pizza', 'plane', 'plant', 'plate',
  'pride', 'queen', 'quiet', 'quilt', 'radio', 'river', 'robot', 'sheep', 'shine', 'shirt',
  'smile', 'snake', 'space', 'spark', 'spoon', 'storm', 'sugar', 'sunny', 'sweet', 'table',
  'tiger', 'toast', 'tooth', 'torch', 'train', 'treat', 'trick', 'truck', 'water', 'whale',
  'wheel', 'world', 'zebra', 'amber', 'angel', 'arrow', 'bacon', 'badge', 'baker', 'beard',
  'beast', 'berry', 'bingo', 'blaze', 'bloom', 'board', 'bonus', 'boost', 'brave', 'brick',
  'bride', 'brick', 'bunny', 'cabin', 'camel', 'candy', 'cargo', 'charm', 'cheap', 'cheer',
  'chess', 'chick', 'chili', 'churn', 'civic', 'clean', 'clear', 'climb', 'cloak', 'coast',
  'crane', 'crisp', 'crown', 'daisy', 'dealt', 'depth', 'dizzy', 'dodge', 'dough', 'dozen',
  'draft', 'dream', 'dress', 'drink', 'drive', 'eaten', 'elbow', 'elder', 'emoji', 'enjoy',
  'fairy', 'feast', 'fence', 'field', 'fifty', 'fizzy', 'flash', 'fleet', 'float', 'focus',
  'frost', 'funny', 'genie', 'giant', 'glide', 'globe', 'glory', 'grand', 'great', 'grill',
  'haunt', 'hatch', 'hello', 'hippo', 'hobby', 'honey', 'humor', 'ideal', 'igloo', 'index',
  'ivory', 'jelly', 'jolly', 'joker', 'jumbo', 'kayak', 'kitty', 'koala', 'lemon', 'level',
  'lever', 'lilac', 'llama', 'lucky', 'lunar', 'medal', 'melon', 'mercy', 'merry', 'mirth',
  'moose', 'motor', 'mound', 'mummy', 'nacho', 'neigh', 'noble', 'noisy', 'north', 'novel',
  'olive', 'onion', 'otter', 'owner', 'pasta', 'patch', 'pearl', 'penny', 'pilot', 'pixel',
  'plumb', 'pouch', 'pound', 'power', 'price', 'prize', 'proud', 'pulse', 'puppy', 'quack',
  'quest', 'quick', 'quirk', 'ranch', 'reach', 'relax', 'reply', 'ridge', 'rinse', 'roast',
  'royal', 'sandy', 'sauce', 'scarf', 'scout', 'sense', 'shade', 'shark', 'sheet', 'shelf',
  'shell', 'shiny', 'shore', 'sight', 'silly', 'skate', 'sleep', 'slice', 'slide', 'sloth',
  'snail', 'sneak', 'snowy', 'solar', 'sound', 'south', 'speak', 'spice', 'spicy', 'spine',
  'sport', 'squid', 'stack', 'staff', 'stage', 'stair', 'stamp', 'stand', 'steam', 'steel',
  'stick', 'stone', 'stool', 'store', 'story', 'straw', 'study', 'sunny', 'super', 'surge',
  'swarm', 'sweat', 'swing', 'sword', 'syrup', 'teach', 'thumb', 'tidal', 'toast', 'today',
  'token', 'tonic', 'tower', 'trace', 'trail', 'trend', 'trout', 'trunk', 'tulip', 'tutor',
  'twist', 'ultra', 'uncle', 'unity', 'upper', 'usher', 'vapor', 'vault', 'vigor', 'vinyl',
  'vivid', 'vocal', 'voice', 'wagon', 'waist', 'waltz', 'watch', 'weary', 'weave', 'wider',
  'windy', 'witty', 'woven', 'wrist', 'yacht', 'yeast', 'yield', 'young', 'youth', 'zesty',
];

// De-duplicated set for O(1) guess validation.
export const WORD_SET = new Set(WORDS);

export function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}
