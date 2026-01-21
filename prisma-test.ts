import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function test() {
    try {
        const exams = await prisma.exam.findMany();
        console.log("Exams found:", exams.length);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
