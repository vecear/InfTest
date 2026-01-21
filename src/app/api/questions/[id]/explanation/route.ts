import { NextRequest, NextResponse } from 'next/server';
import { updateQuestionExplanation } from '@/lib/firestore';

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
        const result = await updateQuestionExplanation(id, answerExplanation);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating explanation:', error);
        return NextResponse.json(
            { error: 'Failed to update explanation', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
