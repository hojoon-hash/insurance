import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  Shield,
  ChevronDown,
  ChevronUp,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Gift
} from 'lucide-react';
import ScoreChart from '../components/ScoreChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { apiUrl } from '../lib/api';
import Turnstile from '../components/Turnstile';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { diagnosisResult, answers, userName, leadInfo } = location.state || {};

  const [expandedRisk, setExpandedRisk] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [consultType, setConsultType] = useState('phone'); // 'phone' or 'visit'
  const [formData, setFormData] = useState({
    name: leadInfo?.name || '',
    phone: leadInfo?.phone || '',
    date: '',
    time: '',
    location: ''
  });
  // 진단 단계에서 이름·전화를 이미 받았으면 재입력 대신 확인만 한다.
  const [editContact, setEditContact] = useState(!(leadInfo?.name && leadInfo?.phone));
  const [consultErrors, setConsultErrors] = useState({});
  const [isConsultSubmitting, setIsConsultSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');

  if (!diagnosisResult) {
    navigate('/');
    return null;
  }

  const {
    score,
    grade,
    riskFactors,
    totalScenarioCost,
    scenarioCosts,
    currentOutOfPocket,
    optimizedOutOfPocket,
    savings,
    categories,
    insurancePremium,
  } = diagnosisResult;

  const displayName = userName || '고객';

  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR');
  };

  const getBarColor = (percentage) => {
    if (percentage >= 70) return '#22c55e';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const categoryData = [
    {
      name: categories.cavity_nerve.displayName.split('·')[0],
      fullName: categories.cavity_nerve.displayName,
      value: categories.cavity_nerve.percentage,
      status: categories.cavity_nerve.status,
      data: categories.cavity_nerve
    },
    {
      name: categories.crown_implant.displayName.split('·')[0],
      fullName: categories.crown_implant.displayName,
      value: categories.crown_implant.percentage,
      status: categories.crown_implant.status,
      data: categories.crown_implant
    },
    {
      name: categories.gum_disease.displayName.split(' ')[0],
      fullName: categories.gum_disease.displayName,
      value: categories.gum_disease.percentage,
      status: categories.gum_disease.status,
      data: categories.gum_disease
    }
  ];

  const validateConsult = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = '이름을 입력해주세요';
    } else if (!/^[가-힣]{2,10}$/.test(formData.name.trim())) {
      errs.name = '한글 이름을 입력해주세요';
    }
    if (!formData.phone) {
      errs.phone = '연락처를 입력해주세요';
    } else if (!/^01[0-9]-\d{4}-\d{4}$/.test(formData.phone)) {
      errs.phone = '올바른 휴대폰 번호를 입력해주세요';
    }
    if (!formData.date) errs.date = '희망 날짜를 선택해주세요';
    if (!formData.time) errs.time = '희망 시간대를 선택해주세요';
    if (consultType === 'visit' && !formData.location) errs.location = '방문 장소를 선택해주세요';
    setConsultErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();

    if (!validateConsult()) return;
    if (isConsultSubmitting) return;

    setIsConsultSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/lead'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: leadInfo?.leadId,
          stage: 'consult',
          name: formData.name,
          phone: formData.phone,
          birthDate: leadInfo?.birthDate,
          consultType,
          date: formData.date,
          time: formData.time,
          location: consultType === 'visit' ? formData.location : '유선상담',
          company: honeypot,
          turnstileToken,
          score,
          grade: grade.text,
          riskFactors: riskFactors.length,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success !== false) {
        alert('✅ 상담 신청이 완료되었습니다!\n영업일 기준 1일 이내 연락드리겠습니다.');
        setShowContactModal(false);
      } else {
        alert('❌ 상담 신청에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('상담 신청 실패:', error);
      alert('❌ 상담 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsConsultSubmitting(false);
    }
  };

  // 휴대폰 번호 자동 포맷팅
  const handleConsultPhoneChange = (e) => {
    const numbers = e.target.value.replace(/[^\d]/g, '');
    let formatted = numbers;
    if (numbers.length > 3 && numbers.length <= 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length > 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
    setFormData({ ...formData, phone: formatted });
    if (consultErrors.phone) setConsultErrors({ ...consultErrors, phone: null });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">처음으로</span>
          </button>
          <p className="text-xs text-gray-500">
            💾 캡처하여 저장하세요
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 pb-32">
        {/* 섹션 1: 종합 점수 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🎉 {displayName}님의<br />
              치아보험 종합 분석
            </h2>
            <p className="text-sm text-gray-600">
              📅 분석일: {new Date().toLocaleDateString('ko-KR')} | 29개 보험사 약관 기준
            </p>
          </div>

          <ScoreChart score={score} status={grade.text} />

          <div className="text-center mt-6">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold ${
              grade.color === 'blue' ? 'bg-blue-50' : 
              grade.color === 'yellow' ? 'bg-yellow-50' : 
              grade.color === 'orange' ? 'bg-orange-50' : 
              'bg-red-50'
            }`}>
              <span className="text-2xl">{grade.emoji}</span>
              <span className={`text-xl ${
                grade.color === 'blue' ? 'text-blue-800' : 
                grade.color === 'yellow' ? 'text-yellow-800' : 
                grade.color === 'orange' ? 'text-orange-800' : 
                'text-red-800'
              }`}>
                {score}점 ({grade.text})
              </span>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              {score >= 70 && "✅ 전반적으로 양호하나, 예방 관리가 필요합니다"}
              {score >= 55 && score < 70 && "⚠️ 일부 보장 강화가 필요합니다"}
              {score >= 35 && score < 55 && "🔴 보장이 부족합니다. 빠른 보완이 필요합니다"}
              {score < 35 && "🚨 보장이 매우 부족합니다. 즉시 대응이 필요합니다"}
            </p>
          </div>
        </motion.div>

        {/* 섹션 2: 예상 보험료 비교 (NEW!) */}
        {insurancePremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg mb-6 border-2 border-blue-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">
                💳 예상 보험료 비교
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* 현재 수준 */}
              <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-xs text-gray-500 mb-1">현재 예상 보험료</p>
                <p className="text-sm text-gray-600 mb-2">{insurancePremium.current.type}</p>
                <p className="text-2xl font-bold text-gray-800">
                  월 {formatCurrency(insurancePremium.current.monthly)}원
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  연 {formatCurrency(insurancePremium.current.annual)}원
                </p>
              </div>

              {/* 권장 수준 */}
              <div className="bg-blue-600 rounded-xl p-4 shadow-lg">
                <p className="text-xs text-blue-100 mb-1">권장 보험료</p>
                <p className="text-sm text-blue-200 mb-2">{insurancePremium.recommended.type}</p>
                <p className="text-2xl font-bold text-white">
                  월 {formatCurrency(insurancePremium.recommended.monthly)}원
                </p>
                <p className="text-xs text-blue-100 mt-1">
                  연 {formatCurrency(insurancePremium.recommended.annual)}원
                </p>
              </div>
            </div>

            {insurancePremium.isUpgradeNeeded && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  💡 월 {formatCurrency(insurancePremium.difference.monthly)}원만 추가하면
                </p>
                <p className="text-xs text-yellow-700">
                  → 실제 치료 시 <strong className="text-yellow-900">{formatCurrency(savings)}원</strong> 절감 가능!
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4 text-center">
              * 35~45세 기준, 보험사별로 차이가 있을 수 있습니다
            </p>
          </motion.div>
        )}

        {/* 섹션 3: 예상 치료비 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-gray-800">
              💰 실제 치료 시 예상 비용
            </h3>
          </div>

          {/* 선택한 고민 항목 */}
          {scenarioCosts.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">선택하신 고민 항목</p>
              {scenarioCosts.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-gray-700">{item.item}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.cost)}원
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-2 border-t-2">
                <span className="text-base font-bold text-gray-800">총 예상 비용</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(totalScenarioCost)}원
                </span>
              </div>
            </div>
          )}

          {/* 영수증 스타일 비교 */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-xl">
            <div className="text-center mb-6">
              <p className="text-2xl font-black mb-1">🧾 치료비 영수증</p>
              <p className="text-xs text-gray-400">최적화 전 vs 후</p>
            </div>

            {/* 현재 자부담 */}
            <div className="mb-4 pb-4 border-b border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-sm">현재 보장 ({Math.floor((1 - (currentOutOfPocket / totalScenarioCost)) * 100)}%)</span>
                <span className="text-red-400 text-sm line-through">
                  {formatCurrency(currentOutOfPocket)}원
                </span>
              </div>
            </div>

            {/* 최적화 후 자부담 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-300 text-sm font-bold">최적화 후 보장 (85%)</span>
                <span className="text-green-300 text-2xl font-black">
                  {formatCurrency(optimizedOutOfPocket)}원
                </span>
              </div>
            </div>

            {/* 절감액 */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-bold">💰 예상 절감액</span>
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  className="text-white text-3xl font-black"
                >
                  -{formatCurrency(savings)}원
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 섹션 4: 3대 항목 분석 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-gray-800">
              📊 세부 항목별 보장 분석
            </h3>
          </div>

          {/* 막대 차트 */}
          <div className="mb-8">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 항목별 상세 */}
          {categoryData.map((item, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.data.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{item.fullName}</h4>
                      <p className="text-xs text-gray-500">{item.data.medicalName}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    item.status === '적정' ? 'bg-green-100 text-green-700' :
                    item.status === '부족' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.value}% ({item.status})
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-3">{item.data.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">현재 보장</p>
                    <p className="text-sm font-bold text-gray-800">
                      {formatCurrency(item.data.currentCoverage)}원
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">권장 보장</p>
                    <p className="text-sm font-bold text-blue-800">
                      {formatCurrency(item.data.recommendedCoverage)}원
                    </p>
                  </div>
                </div>

                {item.data.shortfall > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p className="text-xs text-yellow-800">
                      ⚠️ 부족액: <strong>{formatCurrency(item.data.shortfall)}원</strong>
                    </p>
                  </div>
                )}

                {item.data.relatedSymptoms && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded mt-2">
                    <p className="text-xs text-red-800">{item.data.relatedSymptoms}</p>
                  </div>
                )}

                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">포함 치료 예시:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.data.examples.map((example, i) => (
                      <span key={i} className="text-xs bg-white px-2 py-1 rounded-full border text-gray-600">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* 섹션 5: 위험 요인 */}
        {riskFactors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-800">
                ⚠️ 발견된 위험 요인 ({riskFactors.length}개)
              </h3>
            </div>

            <div className="space-y-3">
              {riskFactors.map((risk, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded-lg cursor-pointer ${
                    risk.severity === 'high' ? 'bg-red-50 border-red-500' :
                    risk.severity === 'medium' ? 'bg-orange-50 border-orange-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}
                  onClick={() => setExpandedRisk(expandedRisk === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${
                        risk.severity === 'high' ? 'text-red-800' :
                        risk.severity === 'medium' ? 'text-orange-800' :
                        'text-yellow-800'
                      }`}>
                        [{risk.category}] {risk.detail}
                      </p>
                    </div>
                    {expandedRisk === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>

                  {expandedRisk === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 pt-3 border-t"
                    >
                      <p className="text-xs text-gray-600">
                        {risk.severity === 'high' && '🚨 즉시 대응이 필요한 고위험 요인입니다. 전문가 상담을 권장합니다.'}
                        {risk.severity === 'medium' && '⚠️ 단기 내 보완이 필요한 중간 위험 요인입니다.'}
                        {risk.severity === 'low' && '💡 예방 차원에서 관리가 필요한 요인입니다.'}
                      </p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl px-6 py-4 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            🎁 방문 상담 시 구강케어 세트 증정
          </div>
        </div>
        <button
          onClick={() => setShowContactModal(true)}
          className="w-full mt-3 bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Phone className="w-5 h-5" />
          지금 바로 전문가 상담 예약하기
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          💬 평일 09:00~18:00 | 주말·공휴일 휴무
        </p>
      </div>

      {/* 상담 신청 모달 (개선 버전) */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-t-3xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📞 전문가 상담 신청</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConsultSubmit} className="space-y-4" noValidate>
              {/* 상담 유형 선택 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  상담 유형 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultType('phone')}
                    className={`py-3 rounded-xl font-bold transition-all ${
                      consultType === 'phone'
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    📞 유선 상담
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultType('visit')}
                    className={`py-3 rounded-xl font-bold transition-all ${
                      consultType === 'visit'
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    🏢 방문 상담
                  </button>
                </div>
                {consultType === 'phone' && (
                  <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                    ⚠️ 080 또는 비공개 번호로 연락드립니다. 꼭 받아주세요!
                  </p>
                )}
                {consultType === 'visit' && (
                  <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded flex items-center gap-1">
                    <Gift className="w-4 h-4" />
                    방문 상담 시 프리미엄 구강케어 세트를 드립니다!
                  </p>
                )}
              </div>

              {/* 연락처 정보: 진단 때 받았으면 확인만, 없으면 입력 */}
              {!editContact ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 mb-1">이 정보로 예약합니다</p>
                    <p className="text-sm font-bold text-gray-800">
                      {formData.name} · {formData.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditContact(true)}
                    className="text-sm text-primary font-medium hover:underline shrink-0"
                  >
                    수정
                  </button>
                </div>
              ) : (
                <>
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (consultErrors.name) setConsultErrors({ ...consultErrors, name: null });
                      }}
                      placeholder="홍길동"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-primary focus:outline-none ${
                        consultErrors.name ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    {consultErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{consultErrors.name}</p>
                    )}
                  </div>

                  {/* 연락처 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      연락처 *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={handleConsultPhoneChange}
                      placeholder="010-1234-5678"
                      maxLength="13"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-primary focus:outline-none ${
                        consultErrors.phone ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    {consultErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{consultErrors.phone}</p>
                    )}
                  </div>
                </>
              )}

              {/* 희망 날짜 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  희망 날짜 *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData({ ...formData, date: e.target.value });
                    if (consultErrors.date) setConsultErrors({ ...consultErrors, date: null });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-primary focus:outline-none ${
                    consultErrors.date ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {consultErrors.date && (
                  <p className="text-red-500 text-xs mt-1">{consultErrors.date}</p>
                )}
              </div>

              {/* 희망 시간대 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  희망 시간대 *
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => {
                    setFormData({ ...formData, time: e.target.value });
                    if (consultErrors.time) setConsultErrors({ ...consultErrors, time: null });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-primary focus:outline-none ${
                    consultErrors.time ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  <option value="">선택해주세요</option>
                  <option value="09:00-12:00">오전 (09:00~12:00)</option>
                  <option value="12:00-15:00">점심 (12:00~15:00)</option>
                  <option value="15:00-18:00">오후 (15:00~18:00)</option>
                </select>
                {consultErrors.time && (
                  <p className="text-red-500 text-xs mt-1">{consultErrors.time}</p>
                )}
              </div>

              {/* 방문 상담 시 장소 선택 */}
              {consultType === 'visit' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    방문 상담 장소 *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value });
                      if (consultErrors.location) setConsultErrors({ ...consultErrors, location: null });
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:border-primary focus:outline-none ${
                      consultErrors.location ? 'border-red-400' : 'border-gray-300'
                    }`}
                  >
                    <option value="">선택해주세요</option>
                    <option value="강남점">강남점 (강남역 5번 출구)</option>
                    <option value="종로점">종로점 (종각역 3번 출구)</option>
                    <option value="판교점">판교점 (판교역 1번 출구)</option>
                  </select>
                  {consultErrors.location && (
                    <p className="text-red-500 text-xs mt-1">{consultErrors.location}</p>
                  )}
                </div>
              )}

              {/* 허니팟(봇 차단용 숨김 필드) */}
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

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isConsultSubmitting}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-6 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isConsultSubmitting ? '처리 중...' : '상담 신청 완료하기'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                * 영업일 기준 1일 이내 연락드립니다
              </p>
              <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed">
                예약 시 진단 정보와 연락처가 상담 목적으로 전문 상담사에게 전달됩니다.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
