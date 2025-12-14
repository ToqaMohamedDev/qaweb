/**
 * Game Questions API
 * Get questions from Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDB } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    getDocs,
    Timestamp,
    QueryConstraint
} from 'firebase/firestore';

/**
 * GET /api/game/questions
 * Get questions from Firestore with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const db = getFirestoreDB();

        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const difficulty = searchParams.get('difficulty');
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        const questionsRef = collection(db, 'game_questions');

        // Build query with filters
        const constraints: QueryConstraint[] = [where('isActive', '==', true)];

        if (category && category !== 'all') {
            constraints.push(where('category', '==', category));
        }

        if (difficulty && difficulty !== 'all') {
            constraints.push(where('difficulty', '==', difficulty));
        }

        // Add ordering and limit
        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(firestoreLimit(limit));

        const q = query(questionsRef, ...constraints);
        const snapshot = await getDocs(q);

        const questions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate().toISOString()
                    : new Date().toISOString(),
                updatedAt: data.updatedAt instanceof Timestamp
                    ? data.updatedAt.toDate().toISOString()
                    : new Date().toISOString(),
            };
        });

        return NextResponse.json({
            success: true,
            questions,
            total: questions.length,
            filters: {
                category: category || 'all',
                difficulty: difficulty || 'all',
                limit,
            },
        });

    } catch (error) {
        console.error('Get questions error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get questions' },
            { status: 500 }
        );
    }
}
