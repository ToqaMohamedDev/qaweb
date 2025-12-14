/**
 * Game Questions Database
 * يمكنك إضافة/تعديل/حذف الأسئلة من هذا الملف مباشرة
 */

export interface GameQuestion {
    id: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    articleHtml?: string;
    questionText: string;
    options: Array<{ id: string; text: string }>;
    correctOption: string;
    timeLimitSeconds: number;
    isActive: boolean;
}

export const GAME_QUESTIONS: GameQuestion[] = [
    {
        id: 'q1',
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
        id: 'q2',
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
        id: 'q3',
        category: 'science',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>الماء يغلي عند درجة حرارة 100 درجة مئوية عند مستوى سطح البحر. هذه الدرجة تتغير مع تغير الضغط الجوي.</p>
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
        id: 'q4',
        category: 'science',
        difficulty: 'medium',
        articleHtml: `<div class="article">
            <p>كوكب المريخ هو الكوكب الرابع من الشمس، ويُعرف بالكوكب الأحمر بسبب لون سطحه. يبلغ قطره حوالي نصف قطر الأرض.</p>
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
        id: 'q5',
        category: 'language',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>اللغة العربية هي إحدى أكثر اللغات انتشارًا في العالم، ويتحدث بها أكثر من 400 مليون شخص. وهي اللغة الرسمية في 22 دولة.</p>
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
        id: 'q6',
        category: 'history',
        difficulty: 'medium',
        articleHtml: `<div class="article">
            <p>اكتشف كريستوفر كولومبوس أمريكا في عام 1492 عندما كان يبحث عن طريق تجاري جديد إلى الهند.</p>
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
        id: 'q7',
        category: 'geography',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>مصر دولة عربية تقع في شمال شرق أفريقيا. عاصمتها القاهرة، وهي أكبر مدنها.</p>
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
        id: 'q8',
        category: 'math',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>الدائرة هي شكل هندسي يتكون من جميع النقاط التي تبعد مسافة ثابتة عن نقطة مركزية. محيط الدائرة = 2πr</p>
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
        id: 'q9',
        category: 'sports',
        difficulty: 'medium',
        articleHtml: `<div class="article">
            <p>كأس العالم لكرة القدم هي أكبر بطولة على مستوى العالم. فازت البرازيل باللقب 5 مرات.</p>
        </div>`,
        questionText: 'كم مرة فازت البرازيل بكأس العالم؟',
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
        id: 'q10',
        category: 'general',
        difficulty: 'easy',
        articleHtml: `<div class="article">
            <p>السنة الكبيسة تحتوي على 366 يوماً بدلاً من 365 يوماً، وتحدث كل 4 سنوات.</p>
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
 * Get questions with optional filters
 */
export function getQuestions(options?: {
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard' | 'all';
    limit?: number;
    random?: boolean;
}): GameQuestion[] {
    let questions = GAME_QUESTIONS.filter(q => q.isActive);

    // Filter by category
    if (options?.category && options.category !== 'all') {
        questions = questions.filter(q => q.category === options.category);
    }

    // Filter by difficulty
    if (options?.difficulty && options.difficulty !== 'all') {
        questions = questions.filter(q => q.difficulty === options.difficulty);
    }

    // Randomize if requested
    if (options?.random) {
        questions = questions.sort(() => Math.random() - 0.5);
    }

    // Limit results
    if (options?.limit && options.limit > 0) {
        questions = questions.slice(0, options.limit);
    }

    return questions;
}
