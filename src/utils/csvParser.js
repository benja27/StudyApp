export function parseTextsFromCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('title') || firstLine.includes('título');
  
  const startIndex = hasHeader ? 1 : 0;
  
  const textsMap = new Map();

  const parseCSVLine = (text) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cur += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(cur);
                cur = '';
            } else {
                cur += char;
            }
        }
    }
    result.push(cur);
    return result;
  };

  for (let i = startIndex; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    const title = parts[0]?.trim() || '';
    const spanish = parts[1]?.trim() || '';
    const english = parts[2]?.trim() || '';
    const starsRaw = parts[3]?.trim();
    
    let stars = parseInt(starsRaw, 10);
    if (isNaN(stars) || stars < 1 || stars > 3) {
      stars = 1;
    }
    
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
      stars: stars
    });
  }

  return Array.from(textsMap.values());
}
