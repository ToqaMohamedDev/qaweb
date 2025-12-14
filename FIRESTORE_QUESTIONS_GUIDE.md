# نظام الأسئلة من Firestore

## كيفية الاستخدام

### 1️⃣ **إضافة الأسئلة التجريبية لأول مرة (Seeding)**

قبل استخدام النظام لأول مرة، تحتاج لإضافة الأسئلة إلى Firestore:

```bash
# استخدم أي HTTP client (مثل Postman أو curl)
curl -X POST http://localhost:3000/api/game/questions/seed
```

أو افتح المتصفح وزور:
```
http://localhost:3000/api/game/questions/seed
```
ثم اضغط POST request

هذا سيضيف 10 أسئلة تجريبية إلى Firestore في collection اسمه `game_questions`

---

### 2️⃣ **استخدام الأسئلة في اللعبة**

1. **افتح غرفة لعبة جديدة**
2. **كمشرف، اضغط على زر "🔄 تحميل أسئلة من Firestore"**
3. سيتم تحميل 10 أسئلة عشوائية من Firestore
4. **ابدأ اللعبة**

---

### 3️⃣ **إضافة أسئلة جديدة من Dashboard (مستقبلاً)**

يمكنك إنشاء صفحة dashboard لإضافة وتعديل الأسئلة. مثال:

```typescript
// في /app/admin/questions/page.tsx
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const addQuestion = async (questionData) => {
    await addDoc(collection(db, 'game_questions'), {
        ...questionData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
};
```

---

## 📊 **هيكل بيانات السؤال في Firestore**

```typescript
{
    category: 'technology' | 'science' | 'language' | 'history' | 'geography' | 'math' | 'sports' | 'general',
    difficulty: 'easy' | 'medium' | 'hard',
    articleHtml: '<div><p>نص المقالة...</p></div>',
    questionText: 'نص السؤال؟',
    options: [
        { id: 'A', text: 'الخيار الأول' },
        { id: 'B', text: 'الخيار الثاني' },
        { id: 'C', text: 'الخيار الثالث' },
        { id: 'D', text: 'الخيار الرابع' },
    ],
    correctOption: 'B',
    timeLimitSeconds: 15,
    isActive: true,
    createdAt: Timestamp,
    updatedAt: Timestamp,
}
```

---

## 🎯 **الفلاتر المتاحة**

عند تحميل الأسئلة، يمكنك تحديد:
- **category**: نوع السؤال (technology, science, language, إلخ)
- **difficulty**: صعوبة السؤال (easy, medium, hard)
- **limit**: عدد الأسئلة (افتراضي: 10)

حالياً هذه القيم ثابتة في الكود، لكن يمكنك إضافة UI لاختيارها.

---

## 🔧 **تعديل عدد الأسئلة أو الفلترة**

في `/app/game/room/[roomId]/page.tsx`، ابحث عن:

```typescript
body: JSON.stringify({
    category: 'all', // غيّر إلى: 'technology', 'science', 'language', إلخ
    difficulty: 'all', // غيّر إلى: 'easy', 'medium', 'hard'
    limit: 10, // غيّر العدد حسب الحاجة
}),
```

---

## 📝 **Notes**

- جميع الأسئلة مخزنة في Firestore collection: `game_questions`
- يمكنك إضافة/تعديل/حذف الأسئلة مباشرة من Firebase Console
- الأسئلة المحملة يتم تخزينها في Redis لكل غرفة على حدة
- عند تحميل أسئلة جديدة، يتم مسح الأسئلة القديمة واستبدالها

---

## ✅ **المزايا**

- ✅ لا حاجة لتعديل الكود لإضافة أسئلة جديدة
- ✅ يمكن إدارة الأسئلة من Firebase Console أو Dashboard
- ✅ دعم الفلترة حسب التصنيف والصعوبة
- ✅ تحديث فوري بدون إعادة تشغيل السيرفر
- ✅ يمكن إضافة عدد غير محدود من الأسئلة

---

## 🚀 **الخطوات القادمة (اختياري)**

1. إنشاء صفحة Dashboard لإدارة الأسئلة
2. إضافة UI لاختيار category و difficulty قبل التحميل
3. إضافة pagination للأسئلة الكثيرة
4. إضافة نظام مراجعة للأسئلة قبل نشرها
5. إحصائيات عن استخدام كل سؤال في الألعاب
