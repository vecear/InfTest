const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('his/2024/2024answer.pdf');

pdf(dataBuffer).then(function (data) {
    fs.writeFileSync('pdf-output.txt', data.text, 'utf8');
    console.log('Successfully wrote to pdf-output.txt');
}).catch(function (error) {
    console.error('Error:', error);
});
