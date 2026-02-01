
# مواصفات نظام المعجم الموحد متعدد اللغات (Unified Polysemy Lexicon System)

## المبدأ الأساسي النظام
نظام لغوي ذكي يعتمد على **فصل المفهوم (Concept) عن الكلمة (Word)**.
- **التخزين:** يتم تخزين "المفاهيم" في المقام الأول.
- **الترجمة:** تتم من `Concept → Word` وليس `Word → Word`.
- **البحث:** القاعدة الذهبية هي **"التخيير أولاً" (Disambiguation First)**.

---

## 1. نموذج البيانات النهائى (Final Production Schema)

تم تحديث النموذج لدعم IPA والتصريف الوصفي (Structured Inflections).

```json
{
  "concept_id": "CNT-10502-V1",
  "definition": "A written or printed work consisting of pages glued or sewn together along one side.",
  "part_of_speech": "noun",
  "domains": ["Education", "General"],
  
  "relations": {
    "broader": ["CNT-10800"],
    "narrower": ["CNT-10999"],
    "related": ["CNT-10550"],
    "antonyms": [],
    "similar_to": []
  },

  "lexical_entries": {
    "en": {
      "lemma": "book",
      "variants": ["Book"], // Spelling/Case variants
      
      // النطق المهيكل (IPA + Audio)
      "pronunciations": [
        { "ipa": "/bʊk/", "region": "US", "audio_url": "..." },
        { "ipa": "/bʊk/", "region": "UK", "audio_url": "..." }
      ],

      // التصريف الوصفي (Structured Inflections)
      "inflections": [
        { "form": "books", "features": ["plural"] }
      ],

      "aliases": ["búk"], // Transliteration keys for search
      "synonyms": ["volume", "tome"],
      "examples": ["I read an interesting book yesterday."],
      "patterns": ["read <this_concept>"],
      "source": "Oxford_API_v3",
      "confidence": 0.98
    },
    
    "ar": {
      "lemma": "كتاب",
      "variants": [],
      
      "pronunciations": [
        { "ipa": "/kiˈtaːb/", "region": "MSA" }
      ],

      // التصريف العربي المتقدم
      "inflections": [
        { "form": "كتب",     "features": ["plural", "broken_plural"] },
        { "form": "كتابان",  "features": ["dual", "nominative"] },
        { "form": "كتابين",  "features": ["dual", "accusative_genitive"] }
      ],

      "diacritized_forms": [
        { "form": "كتابٌ", "features": ["nominative", "indefinite"] },
        { "form": "كتاباً", "features": ["accusative", "indefinite"] }
      ],

      "aliases": ["kitab", "ktab"],
      "gender": "masculine",
      "examples": ["قرأت كتاباً مفيداً."],
      "patterns": ["قراءة <this_concept>"],
      "source": "Almaany_Bridge_v1",
      "confidence": 0.95
    }
  },

  "metadata": {
    "usage_frequency": "high",
    "difficulty_level": "A1",
    "created_at": "2024-01-31T12:00:00Z",
    "updated_at": "2024-02-01T10:00:00Z"
  }
}
```

---

## 2. استراتيجية معالجة تعدد المعاني (Polysemy Handling)

الكلمة الواحدة (مثل `Book`) لا وجود لها ككيان مستقل، بل هي "قناع" لعدة مفاهيم.

### آلية التفكيك (Concept Splitting):
عند استيراد كلمة مثل `Book`، يتم إنشاء سجلات منفصلة:
1.  **Concept #10502:** (Def: Document) -> `POS: noun`.
2.  **Concept #10503:** (Def: Reserve)  -> `POS: verb`.

### الربط اللغوي (Mapping):
*   في `Concept 10502`: اللغة العربية = "كتاب".
*   في `Concept 10503`: اللغة العربية = "حجز".

---

## 3. خطة الإدخال والاستيراد (The Pipeline)

### Phase 1: Semantic Expansion (التوسع الدلالي)
1.  **Input:** كلمة خام (`book`).
2.  **Fetch:** استعلام ذكي (LLM/API) مع طلب المخرجات بصيغة JSON تطابق الـ Schema أعلاه.
3.  **Creation:** إنشاء Concept Object منفصل لكل معنى.

### Phase 2: Quality Control (ضبط الجودة)
*   **Duplicate Check:** فحص التشابه الدلالي.
*   **Structure Validation:** التأكد من وجود `ipa` و `features` للتصريفات.

---

## 4. سلوك البحث (Disambiguation First)

1.  **Input:** المستخدم يكتب "Book".
2.  **Display:** النظام يعرض بطاقات المعاني:
    *   **كتاب** (Noun) - *وثيقة للقراءة*
    *   **يحجز** (Verb) - *ترتيب مسبق*
3.  **Action:** المستخدم يختار، فيعرض النظام التفاصيل والترجمات الخاصة بذلك المعنى فقط.

---

## 5. أمثلة عملية (Final JSON Output)

### مثال 2: Book (بمعنى يحجز)
```json
{
  "concept_id": "CNT-1002",
  "definition": "To reserve (accommodation, a place, etc.) for a future event.",
  "part_of_speech": "verb",
  "domains": ["Travel", "Hospitality"],
  "relations": {
    "related": ["CNT-1600"],   // Ticket
    "similar_to": ["CNT-1500"] // Reserve
  },
  "lexical_entries": {
    "en": {
      "lemma": "book",
      "pronunciations": [{ "ipa": "/bʊk/" }],
      "inflections": [
        { "form": "booked",  "features": ["past", "participle"] },
        { "form": "booking", "features": ["gerund", "participle"] },
        { "form": "books",   "features": ["present", "3rd_person_singular"] }
      ],
      "examples": ["I booked a table for two."],
      "source": "Oxford_API_v3"
    },
    "ar": {
      "lemma": "حجز",
      "pronunciations": [{ "ipa": "/ħa.dʒa.za/", "region": "MSA" }],
      "inflections": [
        { "form": "يحجز",   "features": ["present", "active"] },
        { "form": "حجزت",   "features": ["past", "1st_person"] },
        { "form": "يحجزون", "features": ["present", "plural", "masculine"] },
        { "form": "احجز",   "features": ["imperative"] }
      ],
      "examples": ["حجزت طاولة لشخصين."],
      "source": "Almaany_Bridge_v1"
    }
  }
}
```
