import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, TrendingDown, Shield } from 'lucide-react';

export default function PreviewResult({ diagnosisData, onShowLeadForm }) {
  const { currentOutOfPocket, optimizedOutOfPocket, savings } = diagnosisData;
  const [animatedSavings, setAnimatedSavings] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = savings;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedSavings(end);
        clearInterval(timer);
      } else {
        setAnimatedSavings(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [savings]);

  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-blue-900 to-primary flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        {/* 성공 아이콘 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* 제목 */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-center text-gray-800 mb-2"
        >
          ✅ 분석 완료!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-gray-600 mb-8"
        >
          당신의 치아보험 진단 결과가 준비되었습니다
        </motion.p>

        {/* 흐릿한 배경의 점수 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 mb-6 overflow-hidden"
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-white/30" />
          <div className="relative z-10 text-center">
            <div className="text-6xl font-bold text-gray-300 mb-2">??</div>
            <div className="text-sm text-gray-500">당신의 치아보험 점수</div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Lock className="w-16 h-16 text-gray-300" />
          </div>
        </motion.div>

        {/* 예상 금액 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gray-50 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-800">예상 치료 시 본인 부담금</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">현재 보험 기준:</span>
              <span className="text-lg font-bold text-gray-800">
                약 {formatCurrency(currentOutOfPocket)}원
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">치위선생 솔루션:</span>
              <span className="text-lg font-bold text-accent">
                약 {formatCurrency(optimizedOutOfPocket)}원
              </span>
            </div>

            <div className="border-t-2 border-dashed border-gray-300 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">💰 예상 절감액</span>
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, delay: 1.5, repeat: 2 }}
                  className="text-2xl font-bold text-alert"
                >
                  {formatCurrency(animatedSavings)}원!
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 잠금 해제 안내 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-900 mb-2">
                🔒 상세 분석 결과를 보려면
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 정확한 점수 및 등급</li>
                <li>• 항목별 상세 보장 분석</li>
                <li>• 개인 맞춤 해결 방안</li>
                <li>• 우선순위별 추천 플랜</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA 버튼 */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowLeadForm}
          className="w-full bg-accent text-white font-bold text-lg py-5 rounded-2xl shadow-lg hover:bg-green-600 transition-colors"
        >
          📋 상세 결과 받기
        </motion.button>

        {/* 신뢰 표시 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500"
        >
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>안전한 정보 보호</span>
          </div>
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <span>💬 3,245명 확인</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
