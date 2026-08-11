'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin, Mail, Phone, MessageCircle, Send } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('يرجى إدخال الاسم والرسالة');
      return;
    }
    setSending(true);
    // Simulate sending; connect to a real endpoint when available.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSending(false);
    setForm({ name: '', email: '', message: '' });
    toast.success('تم إرسال رسالتك بنجاح وسنرد عليك قريباً');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              اتصل بنا
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact info */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                معلومات التواصل
              </h2>
              <ul className="space-y-4 text-sm text-gray-700">
                <li className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>الرياض، المملكة العربية السعودية</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                  <a href="mailto:support@shop.com" className="hover:text-blue-600">
                    support@shop.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                  <a href="tel:+966555555555" className="hover:text-blue-600">
                    +966 555 555 555
                  </a>
                </li>
              </ul>

              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  تواصل عبر واتساب
                </h3>
                <p className="text-sm text-gray-600">
                  للمساعدة الفورية يمكنك التواصل معنا عبر الواتساب
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الرسالة
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {sending ? 'جارٍ الإرسال...' : 'إرسال'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}