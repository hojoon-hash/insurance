import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Clock } from 'lucide-react';

export default function LeadModal({ isOpen, onClose, score }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    preferredTime: '오전',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          score,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData({ name: '', phone: '', preferredTime: '오전' });
        }, 2000);
      }
    } catch (error) {
      console.error('Lead submission error:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
            style={{ maxWidth: '430px', margin: '0 auto' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl"
            style={{ maxWidth: '430px', margin: '0 auto' }}
          >
            {isSuccess ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                  className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <span className="text-4xl">✓</span>
                </motion.div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  신청 완료!
                </h3>
                <p className="text-gray-600">
                  곧 전문 상담사가 연락드리겠습니다.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                  <h3 className="text-xl font-bold text-gray-800">
                    무료 상담 신청
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      이름
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="홍길동"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4" />
                      연락처
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4" />
                      상담 희망 시간
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['오전', '오후'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, preferredTime: time })
                          }
                          className={`py-3 rounded-xl font-medium transition-all ${
                            formData.preferredTime === time
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-colors disabled:bg-gray-300"
                  >
                    {isSubmitting ? '신청 중...' : '무료 상담 신청하기'}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    📞 평균 2시간 내 연락드립니다
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
