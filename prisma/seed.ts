import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.comment.deleteMany({});
    await prisma.questionOption.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.exam.deleteMany({});

    const exam1 = await prisma.exam.create({
        data: {
            title: "112年度感染科專科醫師筆試",
            year: 112,
            category: "WRITTEN",
            questions: {
                create: [
                    {
                        content: "關於由Staphylococcus aureus引起的化膿性肌炎（pyomyositis），下列敘述何者錯誤？",
                        type: "CHOICE",
                        order: 1,
                        correctAnswer: "1", // Index 1 (B)
                        answerExplanation: "Pyomyositis常見於熱帶地區，但溫帶地區也有增加趨勢。大多數病例是由S. aureus引起。典型的表現是肌肉內膿瘍，而不是單純的蜂窩性組織炎。",
                        options: {
                            create: [
                                { text: "常見於熱帶地區，故又稱為熱帶性化膿性肌炎", order: 0 },
                                { text: "大多數病例無明顯的外傷史", order: 1 },
                                { text: "最常見的致病菌為Streptococcus pyogenes", order: 2 },
                                { text: "MRI是診斷此病最敏感的影像檢查", order: 3 },
                            ],
                        },
                    },
                    {
                        content: "一名65歲男性，有糖尿病史，因發燒及右側腰痛入院。尿液分析顯示膿尿，尿液培養長出Klebsiella pneumoniae。腎臟超音波顯示右側腎實質內有氣體。下列診斷何者最正確？",
                        type: "CHOICE",
                        order: 2,
                        correctAnswer: "0", // Index 0 (A)
                        answerExplanation: "腎實質內出現氣體是氣腫性腎盂腎炎（Emphysematous pyelonephritis）的典型特徵，常見於糖尿病患者，最常見致病菌為E. coli及K. pneumoniae。",
                        options: {
                            create: [
                                { text: "氣腫性腎盂腎炎（Emphysematous pyelonephritis）", order: 0 },
                                { text: "腎周圍膿瘍（Perinephric abscess）", order: 1 },
                                { text: "氣腫性膀胱炎（Emphysematous cystitis）", order: 2 },
                                { text: "黃色肉芽腫性腎盂腎炎（Xanthogranulomatous pyelonephritis）", order: 3 },
                            ],
                        },
                    },
                ],
            },
        },
    });

    console.log("Seed data created successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
