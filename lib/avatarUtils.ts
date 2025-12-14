// دالة لتوليد لون بناءً على الحرف الأول
export function getAvatarColor(letter: string): string {
  const char = letter.toUpperCase().charCodeAt(0);
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-green-500 to-emerald-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
    "from-teal-500 to-cyan-600",
    "from-yellow-500 to-orange-600",
    "from-red-500 to-pink-600",
    "from-purple-500 to-indigo-600",
  ];
  
  // استخدام الحرف لتحديد اللون بشكل ثابت
  const index = char % colors.length;
  return colors[index];
}

// دالة لإنشاء Avatar Component
export function getAvatarInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return "U";
}

