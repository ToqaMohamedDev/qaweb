# استخدام Firebase Client SDK فقط

تم تحديث المشروع لاستخدام **Firebase Client SDK** فقط بدلاً من Firebase Admin SDK.

## التغييرات المطبقة ✅

### 1. إزالة Firebase Admin SDK
- ✅ حذف `firebase-admin` من `package.json`
- ✅ حذف ملف `/lib/firebase-admin.ts`
- ✅ تم التثبيت وإزالة الـ dependency

### 2. إنشاء Firebase Client SDK (/lib/firebase.ts)
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// يمكن استخدامه في Server-side و Client-side
export function getFirestoreDB(): Firestore
```

### 3. تحديث API Routes
تم تحديث جميع الـ API routes لاستخدام Firebase Client SDK:

#### `/app/api/game/questions/route.ts`
- استبدال `getAdminFirestore()` بـ `getFirestoreDB()`
- استخدام `collection`, `query`, `where`, `orderBy`, `limit`, `getDocs`
- استخدام `QueryConstraint[]` للـ type safety

#### `/app/api/game/questions/seed/route.ts`
- استبدال `getAdminFirestore()` بـ `getFirestoreDB()`
- استخدام `collection`, `addDoc`, `getDocs`, `deleteDoc`
- استخدام `serverTimestamp()` بدلاً من `new Date()`

## متطلبات البيئة (Environment Variables)

تأكد من وجود هذه المتغيرات في ملف `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## الفوائد 🎯

1. **بساطة أكبر**: SDK واحد فقط بدلاً من اثنين
2. **حجم أصغر**: لا حاجة لـ firebase-admin وتبعياته الكثيرة
3. **سهولة الصيانة**: كود واحد موحد للـ server والـ client
4. **لا حاجة لـ Service Account**: يعمل مباشرة بمفاتيح Firebase العادية

## ملاحظات مهمة ⚠️

### الأمان
- Firebase Client SDK يستخدم **Firestore Security Rules** للحماية
- تأكد من ضبط Security Rules بشكل صحيح في Firebase Console
  
### مثال Security Rules للأسئلة:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /game_questions/{questionId} {
      // السماح بالقراءة فقط للأسئلة النشطة
      allow read: if resource.data.isActive == true;
      // السماح بالكتابة للمدراء فقط (حسب Authentication)
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## التشغيل

```bash
# تثبيت التبعيات
npm install

# تشغيل الخادم
npm run dev
```

## استخدام الأسئلة

### 1. إضافة أسئلة تجريبية
```bash
curl -X POST http://localhost:3000/api/game/questions/seed
```

### 2. جلب الأسئلة
```bash
# جميع الأسئلة
curl http://localhost:3000/api/game/questions

# تصفية حسب الفئة
curl http://localhost:3000/api/game/questions?category=technology

# تصفية حسب الصعوبة
curl http://localhost:3000/api/game/questions?difficulty=easy&limit=5
```

---

تم التحديث بنجاح! 🎉
