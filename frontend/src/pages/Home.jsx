import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingDown, Users, CheckCircle } from 'lucide-react';
import FloatingEnvelope from '../components/FloatingEnvelope';

export default function Home() {
  const navigate = useNavigate();
  const [tickerPosition, setTickerPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPosition(prev => (prev >= 100 ? -100 : prev + 0.5));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-blue-900 to-primary relative overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-xl">🦷</span>
          </div>
          <h1 className="text-white font-bold text-xl">치위선생</h1>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-yellow-300" />
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="px-6 pt-12 pb-32">
        {/* Sub Headline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <div className="inline-block bg-yellow-400 text-primary px-4 py-2 rounded-full font-bold text-sm shadow-lg">
            치과위생사 출신이 팩트체크 해드립니다
          </div>
        </motion.div>

        {/* Floating Envelope Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <FloatingEnvelope />
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-white font-bold text-2xl leading-tight mb-3">
            당신의 치아보험,<br />
            나중에 후회 안 할 자신 있나요?
          </h2>
          <p className="text-blue-200 text-sm">
            3분 진단으로 평균 26만원 절감
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="grid grid-cols-3 gap-3 mb-12"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-white font-bold text-lg">12,400</div>
            <div className="text-blue-200 text-xs">누적 진단</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <TrendingDown className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-white font-bold text-lg">26만원</div>
            <div className="text-blue-200 text-xs">평균 절감액</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <CheckCircle className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-white font-bold text-lg">98%</div>
            <div className="text-blue-200 text-xs">만족도</div>
          </div>
        </motion.div>
      </main>

      {/* Trust Badge Ticker - Bottom */}
      <div className="absolute bottom-36 left-0 right-0 overflow-hidden bg-white/5 backdrop-blur-sm py-3">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="whitespace-nowrap text-blue-200 text-sm font-medium"
        >
          ⭐ 누적 진단 12,400건 　|　 💰 평균 절감액 26만원 　|　 🏆 전문 치과위생사 출신 설계사 　|　 ✅ 100% 무료 진단 　|　
          ⭐ 누적 진단 12,400건 　|　 💰 평균 절감액 26만원 　|　 🏆 전문 치과위생사 출신 설계사 　|　 ✅ 100% 무료 진단 　|　
        </motion.div>
      </div>

      {/* Fixed CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-primary to-transparent"
        style={{ maxWidth: '430px', margin: '0 auto' }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(34, 197, 94, 0.7)',
              '0 0 0 15px rgba(34, 197, 94, 0)',
              '0 0 0 0 rgba(34, 197, 94, 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          onClick={() => navigate('/diagnosis')}
          className="w-full bg-accent text-white font-bold text-lg py-5 rounded-2xl shadow-2xl hover:bg-green-600 transition-colors"
        >
          3분 만에 무료 진단 시작하기
        </motion.button>
        <p className="text-center text-blue-200 text-xs mt-3">
          💳 카드 등록 없음 · 📱 앱 설치 불필요
        </p>
      </motion.div>

      {/* Background decoration circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
    </div>
  );
}
