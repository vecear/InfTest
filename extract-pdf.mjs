import fs from 'fs';
import pdf from 'pdf-parse';

console.log('Imported pdf:', pdf);

const dataBuffer = fs.readFileSync('his/2024/2024answer.pdf');

// Try to find the function 
let parseFunc = null;
if (typeof pdf === 'function') parseFunc = pdf;
else if (pdf.default && typeof pdf.default === 'function') parseFunc = pdf.default;
else if (pdf.PDFParse && typeof pdf.PDFParse === 'function') {
    // Maybe it's a class?
    console.log('PDFParse found, trying to usage...');
}

if (parseFunc) {
    parseFunc(dataBuffer).then(function (data) {
        fs.writeFileSync('pdf-output.txt', data.text, 'utf8');
        console.log('Successfully wrote to pdf-output.txt');
    });
} else {
    // If it's this specific new version, maybe usage is different?
    // Let's try `new PDFParse(buffer)` if it's a class?
    console.log('Could not find main function.');
}
