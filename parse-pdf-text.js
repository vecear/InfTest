const fs = require('fs');

const rawContent = fs.readFileSync('pdf-output.txt', 'utf8');

// Character mapping
const mapObj = {
    '': '1', '': '2', '': '3', '': '4', '': '5', '': '6',
    '': '.',
    '': '~',
    '': '...',
    '': '→',
    '': '≤',
    '': '>',
    '': '<',
    '': '≥',
    '': '≈',
    '': '-', // Hyphen commonly seen in "COVID19", "MALDITOF"
    // Additional
    '': '<', // Check context later if needed, but 'CD4 35' usually < 35
    '': '+',
    '': '×', // or for duration? "q6h  4 days" -> x 4 days
    '∕': '/',
    '’': "'",
    '”': '"',
    '“': '"'
};

function cleanLine(str) {
    let s = str;
    // Apply map
    for (const [key, val] of Object.entries(mapObj)) {
        s = s.split(key).join(val);
    }
    // Remove "2024考古"
    s = s.replace(/2024考古/g, '');

    // Fix broken markdown bolding
    // e.g. "*題目主旨：**" -> "**題目主旨：**"
    s = s.replace(/^\*([^*\n]+)\*\*/g, '**$1**');
    s = s.replace(/^\*\*([^*\n]+)\*/g, '**$1**');

    return s.trim();
}

const lines = rawContent.split(/\r?\n/);
const explanations = {};
let currentQ = 0;
let buffer = [];

// Helper to determine if we should merge lines
function shouldMerge(prev, next) {
    if (!prev || !next) return false;
    // Don't merge if prev ends with sentence punctuation
    if (/[。？！：；?!:]$/.test(prev)) return false;
    // Don't merge if next looks like a list item
    if (/^(\d+\.|[A-Z]\.|[\u2022\-])/.test(next)) return false;
    // Don't merge if next looks like a header/title start (e.g. "解析", "結論")
    if (/^(解析|結論|重點整理)/.test(next)) return false;

    return true;
}

function getSeparator(prev, next) {
    if (!prev || !next) return '';
    const lastChar = prev.slice(-1);
    const firstChar = next[0];

    const isEngNum = (c) => /[a-zA-Z0-9%]/.test(c);

    if (isEngNum(lastChar) && isEngNum(firstChar)) {
        return ' ';
    }
    return ''; // Chinese-Chinese
}

// Helper to format the final text block with nice spacing
function formatBuffer(linesArray) {
    if (!linesArray || linesArray.length === 0) return '';

    let result = [];
    for (let i = 0; i < linesArray.length; i++) {
        const line = linesArray[i];

        // Check if this line is a "Major Section" that needs extra breathing room before it
        // A., B., C... or "解析", "答案", "重點整理", or lines starting with bold **
        const isOption = /^[A-Z]\./.test(line);
        const isHeader = /^(解析|答案|重點整理|題目|題幹|補充|結論)/.test(line); // Added more
        const isBoldHeader = /^\*\*.+\*\*$/.test(line); // e.g. **題目主旨：**
        const isNumList = /^\d+\./.test(line); // 1. 2. 3.

        // If it's a header or option, and not the very first line, add an empty line before it
        if ((isOption || isHeader || isBoldHeader || isNumList) && i > 0) {

            // For headers (semantic or bold), give double space
            if (isHeader || isBoldHeader) {
                result.push('');
            }
        }

        result.push(line);
    }

    // Join with single newlines
    return result.join('\n');
}

for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Check for strict Q number line
    const pureNumMatch = rawLine.trim().match(/^(\d+)$/);
    if (pureNumMatch) {
        const num = parseInt(pureNumMatch[1], 10);
        // Page numbers or years often appear as standalone numbers > 100
        if (num > 100) continue;

        // Heuristic: sequential or valid range
        if (num > 0 && num <= 100) {
            // Save previous
            if (currentQ > 0 && buffer.length > 0) {
                explanations[currentQ] = formatBuffer(buffer);
            }
            // Start new
            currentQ = num;
            buffer = [];
            continue;
        }
    }

    const cleaned = cleanLine(rawLine);
    if (!cleaned) continue;

    // Add to buffer with merge logic
    if (buffer.length === 0) {
        buffer.push(cleaned);
    } else {
        const lastIndex = buffer.length - 1;
        const lastLine = buffer[lastIndex];

        if (shouldMerge(lastLine, cleaned)) {
            const sep = getSeparator(lastLine, cleaned);
            buffer[lastIndex] = lastLine + sep + cleaned;
        } else {
            buffer.push(cleaned);
        }
    }
}

// Save last
if (currentQ > 0 && buffer.length > 0) {
    explanations[currentQ] = formatBuffer(buffer);
}

fs.writeFileSync('explanations-2024.json', JSON.stringify(explanations, null, 2), 'utf8');
console.log('Parsed', Object.keys(explanations).length, 'explanations.');
