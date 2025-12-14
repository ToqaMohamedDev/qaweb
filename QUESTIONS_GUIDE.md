# 📚 إدارة الأسئلة

## كيفية إضافة أسئلة جديدة

### ✏️ **الطريقة البسيطة: تعديل الملف مباشرة**

افتح الملف: `/lib/game-questions.ts` وأضف أسئلة جديدة في المصفوفة `GAME_QUESTIONS`

```typescript
{
    id: 'q11', // ID فريد
    category: 'technology', // التصنيف
    difficulty: 'easy', // easy | medium | hard
    articleHtml: `<div class="article">
        <p>نص المقالة هنا...</p>
    </div>`,
    questionText: 'نص السؤال؟',
    options: [
        { id: 'A', text: 'الخيار الأول' },
        { id: 'B', text: 'الخيار الثاني' },
        { id: 'C', text: 'الخيار الثالث' },
        { id: 'D', text: 'الخيار الرابع' },
    ],
    correctOption: 'B', // الإجابة الصحيحة
    timeLimitSeconds: 15, // الوقت بالثواني
    isActive: true, // فعال أم لا
}
```

---

## 🎮 كيفية الاستخدام في اللعبة

1. **افتح غرفة لعبة** كمشرف
2. **اضغط على زر "📚 تحميل أسئلة"**
3. سيتم تحميل 10 أسئلة عشوائية
4. **ابدأ اللعبة!**

---

## 🎯 خصائص الفلترة

يمكنك تعديل الفلترة في الكود:

في `/app/game/room/[roomId]/page.tsx` - الدالة `handleLoadDemoQuestions`:

```typescript
body: JSON.stringify({
    category: 'all', // أو: 'technology', 'science', 'language', 'history', 'geography', 'math', 'sports', 'general'
    difficulty: 'all', // أو: 'easy', 'medium', 'hard'
    limit: 10, // عدد الأسئلة المطلوبة
}),
```

---

## 📁 التصنيفات المتاحة

- `technology` - تكنولوجيا
- `science` - علوم
- `language` - لغة
- `history` - تاريخ
- `geography` - جغرافيا
- `math` - رياضيات
- `sports` - رياضة
- `general` - عام

---

## 💡 نصائح

- ✅ تأكد أن كل سؤال له `id` فريد
- ✅ استخدم تصنيفات واضحة
- ✅ اجعل الوقت مناسباً لصعوبة السؤال (easy: 10-15s, medium: 12-18s, hard: 15-25s)
- ✅ راجع الإجابة الصحيحة قبل الحفظ
- ✅ اختبر الأسئلة في لعبة حقيقية قبل نش رها

---

## 🚀 تطوير مستقبلي (اختياري)

يمكنك لاحقاً:
- إنشاء صفحة Dashboard لإدارة الأسئلة عبر UI
- ربط بقاعدة بيانات (MongoDB, PostgreSQL, etc)
- إضافة صور للأسئلة
- نظام تقييم للأسئلة من اللاعبين
- إحصائيات عن أداء الأسئلة
