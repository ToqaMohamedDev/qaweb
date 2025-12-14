/**
 * Seed Game Questions to Firestore
 * Run once to populate Firestore with demo questions
 */

import { NextResponse } from 'next/server';
import { getFirestoreDB } from '@/lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';

// أسئلة تجريبية متنوعة
const DEMO_QUESTIONS = [
    {
        category: 'technology',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>الذكاء الاصطناعي (AI) هو فرع من علوم الحاسوب يهتم بإنشاء أنظمة قادرة على أداء مهام تتطلب عادةً ذكاءً بشريًا. تشمل هذه المهام التعلم، والتفكير، وحل المشكلات، وفهم اللغة الطبيعية.</p>
        </div>`,
        questionText: 'ما هو الذكاء الاصطناعي؟',
        options: [
            { id: 'A', text: 'برنامج لتحرير الصور' },
            { id: 'B', text: 'فرع من علوم الحاسوب لإنشاء أنظمة ذكية' },
            { id: 'C', text: 'لغة برمجة جديدة' },
            { id: 'D', text: 'نوع من الروبوتات فقط' },
        ],
        correctOption: 'B',
        timeLimitSeconds: 15,
        isActive: true,
    },
    {
        category: 'technology',
        difficulty: 'medium',
        articleHtml: `<div class="article">
            <p>تأسست شركة أبل في عام 1976 على يد ستيف جوبز وستيف وزنياك ورونالد واين. بدأت الشركة في مرآب منزل عائلة جوبز في كاليفورنيا، وأصبحت واحدة من أكبر شركات التكنولوجيا في العالم.</p>
        </div>`,
        questionText: 'متى تأسست شركة أبل؟',
        options: [
            { id: 'A', text: '1980' },
            { id: 'B', text: '1976' },
            { id: 'C', text: '1990' },
            { id: 'D', text: '2000' },
        ],
        correctOption: 'B',
        timeLimitSeconds: 12,
        isActive: true,
    },
    {
        category: 'science',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>الماء يغلي عند درجة حرارة 100 درجة مئوية عند مستوى سطح البحر. هذه الدرجة تتغير مع تغير الضغط الجوي - فكلما ارتفعنا عن مستوى سطح البحر، انخفضت درجة غليان الماء.</p>
        </div>`,
        questionText: 'عند أي درجة حرارة يغلي الماء عند مستوى سطح البحر؟',
        options: [
            { id: 'A', text: '50 درجة مئوية' },
            { id: 'B', text: '80 درجة مئوية' },
            { id: 'C', text: '100 درجة مئوية' },
            { id: 'D', text: '120 درجة مئوية' },
        ],
        correctOption: 'C',
        timeLimitSeconds: 10,
        isActive: true,
    },
    {
        category: 'science',
        difficulty: 'medium',
        articleHtml: `<div class="article">
            <p>كوكب المريخ هو الكوكب الرابع من الشمس، ويُعرف بالكوكب الأحمر بسبب لون سطحه الناتج عن أكسيد الحديد. يبلغ قطره حوالي نصف قطر الأرض، وله قمران صغيران هما فوبوس وديموس.</p>
        </div>`,
        questionText: 'ما هو ترتيب كوكب المريخ من الشمس؟',
        options: [
            { id: 'A', text: 'الثالث' },
            { id: 'B', text: 'الرابع' },
            { id: 'C', text: 'الخامس' },
            { id: 'D', text: 'السادس' },
        ],
        correctOption: 'B',
        timeLimitSeconds: 12,
        isActive: true,
    },
    {
        category: 'language',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>اللغة العربية هي إحدى أكثر اللغات انتشارًا في العالم، ويتحدث بها أكثر من 400 مليون شخص. وهي اللغة الرسمية في 22 دولة، وإحدى اللغات الست الرسمية في الأمم المتحدة.</p>
        </div>`,
        questionText: 'كم عدد الدول التي اللغة العربية هي لغتها الرسمية؟',
        options: [
            { id: 'A', text: '10 دول' },
            { id: 'B', text: '18 دولة' },
            { id: 'C', text: '22 دولة' },
            { id: 'D', text: '30 دولة' },
        ],
        correctOption: 'C',
        timeLimitSeconds: 15,
        isActive: true,
    },
    {
        category: 'history',
        difficulty: 'medium',
        articleHtml: `<div class="article">
            <p>اكتشف كريستوفر كولومبوس أمريكا في عام 1492 عندما كان يبحث عن طريق تجاري جديد إلى الهند. هبط في جزر الباهاما، معتقداً أنه وصل إلى الهند، ولذلك سمى السكان الأصليين "الهنود".</p>
        </div>`,
        questionText: 'في أي عام اكتشف كريستوفر كولومبوس أمريكا؟',
        options: [
            { id: 'A', text: '1392' },
            { id: 'B', text: '1492' },
            { id: 'C', text: '1592' },
            { id: 'D', text: '1692' },
        ],
        correctOption: 'B',
        timeLimitSeconds: 12,
        isActive: true,
    },
    {
        category: 'geography',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>مصر دولة عربية تقع في شمال شرق أفريقيا. عاصمتها القاهرة، وهي أكبر مدنها. تشتهر مصر بالأهرامات وأبو الهول ونهر النيل، أطول أنهار العالم.</p>
        </div>`,
        questionText: 'ما هي عاصمة مصر؟',
        options: [
            { id: 'A', text: 'الإسكندرية' },
            { id: 'B', text: 'القاهرة' },
            { id: 'C', text: 'الجيزة' },
            { id: 'D', text: 'أسوان' },
        ],
        correctOption: 'B',
        timeLimitSeconds: 10,
        isActive: true,
    },
    {
        category: 'math',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>الدائرة هي شكل هندسي يتكون من جميع النقاط التي تبعد مسافة ثابتة عن نقطة مركزية. محيط الدائرة يُحسب بالمعادلة: 2πr حيث r هو نصف القطر، أو πd حيث d هو القطر.</p>
        </div>`,
        questionText: 'ما هي صيغة حساب محيط الدائرة؟',
        options: [
            { id: 'A', text: 'πr²' },
            { id: 'B', text: '2πr' },
            { id: 'C', text: 'πd²' },
            { id: 'D', text: '4πr' },
        ],
        correctOption: 'B',
        timeLimitSeconds: 15,
        isActive: true,
    },
    {
        category: 'sports',
        difficulty: 'medium',
        articleHtml: `<div class="article">
            <p>كأس العالم لكرة القدم هي أكبر بطولة لكرة القدم على مستوى العالم. تُقام كل 4 سنوات، وقد فازت البرازيل باللقب 5 مرات، وهو الرقم القياسي في عدد البطولات.</p>
        </div>`,
        questionText: 'كم مرة فازت البرازيل بكأس العالم لكرة القدم؟',
        options: [
            { id: 'A', text: '3 مرات' },
            { id: 'B', text: '4 مرات' },
            { id: 'C', text: '5 مرات' },
            { id: 'D', text: '6 مرات' },
        ],
        correctOption: 'C',
        timeLimitSeconds: 12,
        isActive: true,
    },
    {
        category: 'general',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>السنة الميلادية تتكون من 365 يوماً في السنة العادية، و366 يوماً في السنة الكبيسة. السنة الكبيسة تحدث كل 4 سنوات لتعويض الفرق بين السنة الشمسية والسنة التقويمية.</p>
        </div>`,
        questionText: 'كم عدد أيام السنة الكبيسة؟',
        options: [
            { id: 'A', text: '364 يوم' },
            { id: 'B', text: '365 يوم' },
            { id: 'C', text: '366 يوم' },
            { id: 'D', text: '367 يوم' },
        ],
        correctOption: 'C',
        timeLimitSeconds: 10,
        isActive: true,
    },
];

/**
 * POST /api/game/questions/seed
 * Seeds Firestore with demo questions (run once)
 */
export async function POST() {
    try {
        const db = getFirestoreDB();
        const questionsRef = collection(db, 'game_questions');

        // Clear existing questions (optional - comment out if you want to keep old ones)
        const existingQuestions = await getDocs(questionsRef);
        const deletePromises = existingQuestions.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Add new questions
        const addPromises = DEMO_QUESTIONS.map(question =>
            addDoc(questionsRef, {
                ...question,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })
        );

        await Promise.all(addPromises);

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${DEMO_QUESTIONS.length} questions to Firestore`,
            count: DEMO_QUESTIONS.length,
        });

    } catch (error) {
        console.error('Seed questions error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to seed questions: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}

/**
 * GET /api/game/questions/seed
 * Returns info about seeding
 */
export async function GET() {
    return NextResponse.json({
        message: 'Use POST to seed questions to Firestore',
        endpoint: '/api/game/questions/seed',
        method: 'POST',
        questionsCount: DEMO_QUESTIONS.length,
    });
}
