# أنواع البيانات المخصصة - Enums

## قائمة الـ Enums

### chat_sender_type
```sql
نوع مرسل رسالة المحادثة
القيم: user, admin, ai
```

---

### device_type
```sql
نوع الجهاز
القيم: mobile, desktop, tablet, unknown
```

---

### exam_type
```sql
نوع الامتحان
القيم: quiz, midterm, final, practice
```

---

### notification_status
```sql
حالة الإشعار
القيم: pending, sent, failed
```

---

### notification_target_role
```sql
الفئة المستهدفة للإشعار
القيم: all, students, teachers, admins
```

---

### notification_type
```sql
نوع الإشعار
القيم: system, exam, lesson, message, subscription
```

---

### semester_type
```sql
الفصل الدراسي
القيم: first, second, full_year
```
- `first` - الترم الأول
- `second` - الترم الثاني
- `full_year` - السنة كاملة

---

### sender_type
```sql
نوع المرسل
القيم: user, admin, system
```

---

### support_chat_status
```sql
حالة محادثة الدعم
القيم: open, closed, pending
```

---

### user_role
```sql
دور المستخدم
القيم: student, teacher, admin
```
- `student` - طالب
- `teacher` - معلم
- `admin` - مشرف
