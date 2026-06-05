import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Calendar, CheckCircle, Shield, ChevronRight } from 'lucide-react';
import { apiUrl } from '../lib/api';
import Turnstile from './Turnstile';

export default function LeadFormModal({ isOpen, onClose, diagnosisData, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    target: '본인',
    privacyAgree: false,
    marketingAgree: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // 전화번호 자동 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
    if (errors.phone) setErrors({ ...errors, phone: null });
  };

  const validateForm = () => {
    const newErrors = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름을 정확히 입력해주세요';
    } else if (!/^[가-힣]{2,10}$/.test(formData.name.trim())) {
      newErrors.name = '한글 이름을 입력해주세요';
    }

    // 전화번호 검증
    if (!formData.phone) {
      newErrors.phone = '휴대폰 번호를 입력해주세요';
    } else if (!/^01[0-9]-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 휴대폰 번호를 입력해주세요';
    }

    // 생년월일 검증 (상담 대상에 따라 허용 연령 분기)
    if (!formData.birthDate) {
      newErrors.birthDate = '생년월일을 입력해주세요';
    } else {
      const birth = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      if (formData.target === '자녀') {
        if (age < 0 || age > 19) {
          newErrors.birthDate = '자녀(미성년) 생년월일을 확인해주세요';
        }
      } else if (formData.target === '가족') {
        if (age < 0 || age > 90) {
          newErrors.birthDate = '생년월일을 확인해주세요';
        }
      } else if (age < 20 || age > 80) {
        newErrors.birthDate = '만 20세 ~ 80세만 가입 가능합니다';
      }
    }

    // 필수 동의 검증
    if (!formData.privacyAgree) {
      newErrors.privacyAgree = '개인정보 수집·이용에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const leadId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const leadData = {
        leadId,
        stage: 'diagnosis',
        ...formData,
        company: honeypot,
        turnstileToken,
        score: diagnosisData.score,
        grade: diagnosisData.grade.text,
        savings: diagnosisData.savings,
        leadQuality: diagnosisData.leadScore.quality,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(apiUrl('/api/lead'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      const result = await response.json();

      if (result.success) {
        onSubmitSuccess({ ...formData, leadId });
      } else {
        alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Lead submission error:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: '430px', margin: '0 auto' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-3xl">
              <h3 className="text-xl font-bold text-gray-800">
                📋 상세 분석 결과 받기
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
              <p className="text-gray-600 mb-6 text-center">
                💌 상세 결과 확인을 위해 정보를 입력해주세요
              </p>

              {/* 상담 대상 */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  누구를 위한 상담인가요? <span className="text-alert">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['본인', '자녀', '가족'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, target: opt });
                        if (errors.birthDate) setErrors({ ...errors, birthDate: null });
                      }}
                      className={`py-3 rounded-xl border-2 font-medium transition-colors ${
                        formData.target === opt
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {opt === '자녀' ? '자녀(미성년)' : opt === '가족' ? '가족 함께' : '본인'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 이름 */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  이름 <span className="text-alert">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="홍길동"
                  className={`w-full px-4 py-3 border-2 ${
                    errors.name ? 'border-alert' : 'border-gray-200'
                  } rounded-xl focus:border-primary focus:outline-none transition-colors`}
                />
                {errors.name && (
                  <p className="text-alert text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* 전화번호 */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  휴대폰 번호 <span className="text-alert">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  maxLength="13"
                  className={`w-full px-4 py-3 border-2 ${
                    errors.phone ? 'border-alert' : 'border-gray-200'
                  } rounded-xl focus:border-primary focus:outline-none transition-colors`}
                />
                {errors.phone && (
                  <p className="text-alert text-xs mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  💬 전문 상담사가 이 번호로 연락드려요
                </p>
              </div>

              {/* 생년월일 */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  생년월일 <span className="text-alert">*</span>
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => {
                    setFormData({ ...formData, birthDate: e.target.value });
                    if (errors.birthDate) setErrors({ ...errors, birthDate: null });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border-2 ${
                    errors.birthDate ? 'border-alert' : 'border-gray-200'
                  } rounded-xl focus:border-primary focus:outline-none transition-colors`}
                />
                {errors.birthDate && (
                  <p className="text-alert text-xs mt-1">{errors.birthDate}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.target === '자녀'
                    ? '💡 자녀(피보험자)의 생년월일을 입력해주세요'
                    : formData.target === '가족'
                    ? '💡 가입 대상자의 생년월일을 입력해주세요'
                    : '💡 정확한 보험 설계를 위해 필요해요'}
                </p>
              </div>

              {/* 동의 항목 */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="font-bold text-gray-800 mb-4">📩 수신 동의</h4>

                {/* 필수 동의 */}
                <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer mb-3 ${
                  errors.privacyAgree ? 'bg-red-50 border-2 border-alert' : 'bg-gray-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.privacyAgree}
                    onChange={(e) => {
                      setFormData({ ...formData, privacyAgree: e.target.checked });
                      if (errors.privacyAgree) setErrors({ ...errors, privacyAgree: null });
                    }}
                    className="mt-1 w-5 h-5 text-primary rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        [필수] 개인정보 수집·이용 동의
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(!showPrivacy)}
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      상세보기 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </label>
                {errors.privacyAgree && (
                  <p className="text-alert text-xs mb-3">{errors.privacyAgree}</p>
                )}

                {/* 선택 동의 */}
                <label className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marketingAgree}
                    onChange={(e) =>
                      setFormData({ ...formData, marketingAgree: e.target.checked })
                    }
                    className="mt-1 w-5 h-5 text-primary rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        [선택] 보험 상품 안내 수신 동의
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      ✨ 동의 시 맞춤 추천 자료를 제공해드립니다
                    </p>
                  </div>
                </label>
              </div>

              {/* 허니팟(봇 차단용 숨김 필드) — 사람에겐 보이지 않음 */}
              <input
                type="text"
                name="company"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />

              {/* Turnstile(봇 검증) — VITE_TURNSTILE_SITE_KEY 설정 시에만 표시 */}
              <Turnstile onToken={setTurnstileToken} />

              {/* Submit 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-white font-bold py-5 rounded-xl hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>처리 중...</>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    동의하고 상세 결과 보기
                  </>
                )}
              </button>

              {/* 보안 안내 */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>입력하신 정보는 상담 목적으로만 안전하게 사용됩니다</span>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
