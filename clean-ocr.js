const fs = require('fs');

const ocrData = JSON.parse(fs.readFileSync('ocr-results.json', 'utf8'));

const replacements = [
    // General Spacing
    { search: /([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, replace: '$1$2' }, // CJK-Space-CJK
    { search: /\s+([，、。？！：；])/g, replace: '$1' }, // Space before punctuation
    { search: /([，、。？！：；])\s+([\u4e00-\u9fa5])/g, replace: '$1$2' }, // Punctuation-Space-CJK

    // Specific Term Fixes (Infection Exam Context)
    // M Pox
    { search: /M\s*辣/g, replace: 'M 痘' },
    { search: /M\s*痊/g, replace: 'M 痘' },

    // Bacteria / Viruses
    { search: /Mersserjg\s*gozoryoeqe/gi, replace: 'Neisseria gonorrhoeae' },
    { search: /Sjrepfococcrey\s*dgdzgc\/zgde/gi, replace: 'Streptococcus agalactiae' },
    { search: /五\s*c9#/gi, replace: 'E. coli' },
    { search: /7s\/e7g\s*7o7ocyfogezey/gi, replace: 'Listeria monocytogenes' },
    { search: /Pverdoyo\/rds\s*derrgzgosg/gi, replace: 'Pseudomonas aeruginosa' },
    { search: /Sfrepzococcis\s*prereziozzge/gi, replace: 'Streptococcus pneumoniae' },
    { search: /Sfrepzococcr\s*zeroozzqe/gi, replace: 'Streptococcus pneumoniae' },
    { search: /Sfrep\/ococcrs\s*pzerozzge/gi, replace: 'Streptococcus pneumoniae' },
    { search: /7ep\/ospzrg\s*油\s*\/eryogdz/gi, replace: 'Leptospira interrogans' }, // Q14
    { search: /Cozizpyzopdc\/er/gi, replace: 'Campylobacter' }, // Q53
    { search: /Czzzzpyzopdczer/gi, replace: 'Campylobacter' },
    { search: /Cozjzoyzoqc\/er/gi, replace: 'Campylobacter' },
    { search: /Cqzdidz\s*dis/gi, replace: 'Candida auris' }, // Q5
    { search: /C\.\s*zzrzy/gi, replace: 'C. auris' },
    { search: /C\.\s*zzy/gi, replace: 'C. auris' },
    { search: /C'\s*wis/gi, replace: 'C. auris' },
    { search: /C'\s*diys/gi, replace: 'C. auris' },

    // Antibiotics
    { search: /ceftriaxone/gi, replace: 'ceftriaxone' }, // Normalize case if needed

    // General English Cleanup (reduce double spaces)
    { search: /\s{2,}/g, replace: ' ' },

    // Clean up " ?" at end of question lines (Chinese context)
    { search: /\s+\?/g, replace: '?' },
];

function cleanText(text) {
    let clean = text;
    // Repeatedly apply the CJK spacing fix to handle multiple spaces
    clean = clean.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2')
        .replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');

    replacements.forEach(r => {
        clean = clean.replace(r.search, r.replace);
    });

    return clean.trim();
}

const cleanedData = {};
for (const [key, value] of Object.entries(ocrData)) {
    cleanedData[key] = cleanText(value);
}

fs.writeFileSync('ocr-results.json', JSON.stringify(cleanedData, null, 2), 'utf8');
console.log('Cleaned ' + Object.keys(cleanedData).length + ' questions using advanced mapping.');

// Print sample Q6 (Neisseria) and Q1 (M 痘)
console.log('--- Sample Q1 ---');
console.log(cleanedData[1]?.substring(0, 100));
console.log('--- Sample Q6 ---');
console.log(cleanedData[6]?.substring(0, 100));
console.log('--- Sample Q15 ---');
console.log(cleanedData[15]?.substring(0, 100));
