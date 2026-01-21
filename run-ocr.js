const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'public', 'his', '2024');
const results = {};

async function run() {
    console.log("Starting optimized batch OCR (chi_tra only)...");
    let worker;
    try {
        // Reverting to chi_tra only as chi_tra+eng was failing to load
        worker = await createWorker('chi_tra', 1, {
            logger: m => {
                if (m.status === 'recognizing text' && (m.progress * 100) % 20 < 5)
                    process.stdout.write('.');
            }
        });

        console.log("\nWorker initialized (chi_tra).");

        for (let i = 1; i <= 100; i++) {
            let questionText = "";
            const singlePath = path.join(imgDir, `${i}.jpg`);
            const part1Path = path.join(imgDir, `${i}-1.jpg`);
            const part2Path = path.join(imgDir, `${i}-2.jpg`);

            process.stdout.write(`\nProcessing Q${i}: `);

            try {
                if (fs.existsSync(part1Path)) {
                    process.stdout.write('[Part 1] ');
                    const { data: { text: t1 } } = await worker.recognize(part1Path);

                    let t2 = "";
                    if (fs.existsSync(part2Path)) {
                        process.stdout.write('[Part 2] ');
                        const { data: { text: t2Res } } = await worker.recognize(part2Path);
                        t2 = t2Res;
                    }
                    questionText = t1 + "\n" + t2;
                } else if (fs.existsSync(singlePath)) {
                    process.stdout.write('[Single] ');
                    const { data: { text } } = await worker.recognize(singlePath);
                    questionText = text;
                } else {
                    process.stdout.write('No image found.');
                }
            } catch (err) {
                console.error(`\nError processing Q${i}:`, err.message);
            }

            if (questionText) {
                results[i] = questionText.trim();
            }
        }

        fs.writeFileSync('ocr-results.json', JSON.stringify(results, null, 2), 'utf8');
        console.log("\nBatch OCR complete. Saved to ocr-results.json");

    } catch (e) {
        console.error("Fatal error in OCR batch:", e);
    } finally {
        if (worker) {
            await worker.terminate();
        }
    }
}

run();
