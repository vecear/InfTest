import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { answerExplanation } = body;

        if (answerExplanation === undefined || answerExplanation === null) {
            return NextResponse.json(
                { error: 'answerExplanation is required' },
                { status: 400 }
            );
        }

        // Update the question's answer explanation
        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: { answerExplanation },
            select: { id: true, answerExplanation: true }
        });

        return NextResponse.json(updatedQuestion);
    } catch (error) {
        console.error('Error updating explanation:', error);
        return NextResponse.json(
            { error: 'Failed to update explanation', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
