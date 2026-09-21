/**
 * WhatsApp message formatter utility
 * Converts HTML tags, standard Markdown, and tables into clean WhatsApp-compatible text
 */
export function formatForWhatsApp(content: string): string {
  if (!content || typeof content !== 'string') return '';

  let text = content;

  // 1. Replace HTML line breaks and paragraph tags
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');

  // 2. Convert common HTML styling tags to WhatsApp markers
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*');
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_');
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  text = text.replace(/<del[^>]*>(.*?)<\/del>/gi, '~$1~');
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '~$1~');

  // Strip any remaining unknown HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 3. Convert Markdown headers (#, ##, ###) to WhatsApp bold
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');

  // 4. Convert Markdown double asterisks **bold** to WhatsApp single asterisk *bold*
  // Avoid converting code blocks
  text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  text = text.replace(/__(.*?)__/g, '_$1_');

  // 5. Convert Markdown tables into clean, readable WhatsApp lists
  text = convertMarkdownTables(text);

  // 6. Clean up excessive whitespace and duplicate newlines
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Convert Markdown tables into clean WhatsApp formatted text
 */
function convertMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inTable = false;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line looks like a table row: starts and ends with '|'
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if this is the separator row: |---|---|
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));

      if (isSeparator) {
        continue;
      }

      if (!inTable) {
        // First row of table = headers
        inTable = true;
        headers = cells;
        result.push(''); // blank line before table
      } else {
        // Data row
        if (headers.length > 0) {
          const rowParts = cells.map((cell, idx) => {
            const header = headers[idx] || `Col ${idx + 1}`;
            return `*${header}:* ${cell}`;
          });
          result.push(`• ${rowParts.join(' | ')}`);
        } else {
          result.push(`• ${cells.join(' | ')}`);
        }
      }
    } else {
      if (inTable) {
        inTable = false;
        headers = [];
        result.push('');
      }
      result.push(lines[i]);
    }
  }

  return result.join('\n');
}

export default formatForWhatsApp;
