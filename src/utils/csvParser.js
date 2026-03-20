export function parseTextsFromCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('title') || firstLine.includes('título');
  
  const startIndex = hasHeader ? 1 : 0;
  
  const textsMap = new Map();

  for (let i = startIndex; i < lines.length; i++) {
    // Basic CSV split
    const parts = lines[i].split(',');
    const title = parts[0]?.trim() || '';
    const spanish = parts[1]?.trim() || '';
    const english = parts[2]?.trim() || '';
    
    if (!title || (!spanish && !english)) continue;

    if (!textsMap.has(title)) {
      textsMap.set(title, {
        id: title, // Usando el título como ID, asumiendo consistencia con TextCreator
        title: title,
        cards: []
      });
    }

    const text = textsMap.get(title);
    text.cards.push({
      id: crypto.randomUUID(),
      front: spanish,
      back: english,
      isActive: false, 
      stars: 1
    });
  }

  return Array.from(textsMap.values());
}
