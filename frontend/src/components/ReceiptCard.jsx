import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Receipt } from 'lucide-react';

export default function ReceiptCard({ baseCost, afterCost, savings }) {
  const [animatedSavings, setAnimatedSavings] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = savings;
    const duration = 2500;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 shadow-lg"
    >
      {/* Receipt Header */}
      <div className="flex items-center justify-center gap-2 mb-6 pb-4 border-b border-dashed border-gray-300">
        <Receipt className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-bold text-gray-800">예상 치료비 분석</h3>
      </div>

      {/* Before */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">기존 예상 자부담금</span>
          <span className="text-lg font-medium text-gray-500 line-through">
            {formatCurrency(baseCost)}원
          </span>
        </div>
      </div>

      {/* After */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">치위선생 컨설팅 후</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(afterCost)}원
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-400 my-4" />

      {/* Savings */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 1,
          type: 'spring',
        }}
        className="bg-red-50 rounded-lg p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-alert" />
            <span className="font-bold text-gray-800">예상 절감액</span>
          </div>
          <motion.span
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              delay: 2,
              repeat: 2,
            }}
            className="text-2xl font-bold text-alert"
          >
            -{formatCurrency(animatedSavings)}원
          </motion.span>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          💡 전문 컨설팅으로 이만큼 절약할 수 있어요!
        </p>
      </motion.div>

      {/* Receipt Footer */}
      <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center">
        <p className="text-xs text-gray-500">
          ※ 실제 치료 내역에 따라 달라질 수 있습니다.
        </p>
      </div>
    </motion.div>
  );
}
