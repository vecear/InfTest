import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// Read explanations
const explanations = JSON.parse(fs.readFileSync('explanations-2024.json', 'utf8'));

// Answer key from 0.Answer.jpg - 2024 Exam (113年度感染症專科醫師甄審筆試)
const answers2024: Record<number, string> = {
    1: 'B', 2: 'D', 3: 'D', 4: 'A', 5: 'E',
    6: 'B', 7: 'B', 8: 'B', 9: 'A', 10: 'C',
    11: 'C', 12: 'D', 13: 'A', 14: 'C', 15: 'C',
    16: 'B', 17: 'D', 18: 'D', 19: 'C', 20: 'E',
    21: 'C', 22: 'B', 23: 'D', 24: 'E', 25: 'C',
    26: 'D', 27: 'C', 28: 'B', 29: 'B', 30: 'D',
    31: 'C', 32: 'E', 33: 'A', 34: 'C', 35: 'C',
    36: 'C', 37: 'B', 38: 'C', 39: 'A', 40: 'C',
    41: 'A', 42: 'B', 43: 'C', 44: 'D', 45: 'B',
    46: 'C', 47: 'D', 48: 'D', 49: 'D', 50: 'C',
    51: 'E', 52: 'E', 53: 'D', 54: 'E', 55: 'C',
    56: 'D', 57: 'B', 58: 'C', 59: 'D', 60: 'E',
    61: 'A', 62: 'B', 63: 'D', 64: 'D', 65: 'B',
    66: 'E', 67: 'C', 68: 'B', 69: 'E', 70: 'D',
    71: 'A', 72: 'C', 73: 'A', 74: 'D', 75: 'E',
    76: 'D', 77: 'D', 78: 'D', 79: 'A', 80: 'E',
    81: 'B', 82: 'B', 83: 'E', 84: 'B', 85: 'B',
    86: 'B', 87: 'E', 88: 'D', 89: 'B', 90: 'E',
    91: 'C', 92: 'C', 93: 'A', 94: 'D', 95: 'C',
    96: 'D', 97: 'C', 98: 'E', 99: 'E', 100: 'E'
};

// OCR'd text for each question (partial - first 10 as examples)
// OCR'd text for each question (full - from Tesseract batch)
const ocrTexts2024 = JSON.parse(fs.readFileSync('ocr-results.json', 'utf8'));

// Questions that have multiple images
const multiImageQuestions = [5, 30, 37, 46, 86];

async function main() {
    console.log('Seeding 2024 exam data...');

    // Delete existing 2024 exam if exists
    await prisma.comment.deleteMany({});
    await prisma.questionOption.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.exam.deleteMany({});

    // Create 2024 exam
    const exam2024 = await prisma.exam.create({
        data: {
            title: '113年度感染症專科醫師甄審筆試',
            year: 2024,
            category: 'WRITTEN'
        }
    });

    console.log('Created exam:', exam2024.title);

    // Create questions
    for (let i = 1; i <= 100; i++) {
        // Determine image URL(s)
        let imageUrl: string;
        if (multiImageQuestions.includes(i)) {
            // For multi-image questions, use the first image
            imageUrl = `/his/2024/${i}-1.jpg`;
        } else {
            imageUrl = `/his/2024/${i}.jpg`;
        }

        const question = await prisma.question.create({
            data: {
                examId: exam2024.id,
                content: `第 ${i} 題`,
                imageUrl: imageUrl,
                ocrText: ocrTexts2024[i] || null,
                type: 'CHOICE',
                correctAnswer: answers2024[i],
                answerExplanation: explanations[i] || null,
                order: i
            }
        });

        // Create options A-E
        const optionLabels = ['A', 'B', 'C', 'D', 'E'];
        for (let j = 0; j < optionLabels.length; j++) {
            await prisma.questionOption.create({
                data: {
                    questionId: question.id,
                    text: optionLabels[j],
                    order: j
                }
            });
        }

        if (i % 10 === 0) {
            console.log(`Created ${i} questions...`);
        }
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
