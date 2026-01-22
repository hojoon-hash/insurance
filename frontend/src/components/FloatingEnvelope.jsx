import React from 'react';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, TrendingDown, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingEnvelope() {
  return (
    <motion.div
      className="relative"
      animate={{
        y: [0, -20, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="relative">
        {/* Envelope Back */}
        <motion.div
          className="w-48 h-32 bg-white rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden"
          initial={{ rotateX: 0 }}
          animate={{ rotateX: [0, 5, 0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {/* Envelope Flap */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-blue-100 to-white"
            style={{
              clipPath: 'polygon(0 0, 50% 60%, 100% 0)',
            }}
            animate={{
              rotateX: [0, -15, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Mail Icon */}
          <Mail className="w-16 h-16 text-primary z-10" strokeWidth={1.5} />
          
          {/* Sparkles */}
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
          <motion.div
            className="absolute bottom-4 left-4 w-2 h-2 bg-yellow-300 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
            }}
          />
        </motion.div>
        
        {/* Label on envelope */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
          내 치아보험 점수 분석 결과
        </div>
      </div>
    </motion.div>
  );
}
