import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function ChatMessage({ message, isUser = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
      )}
      
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.2 }}
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </motion.div>
      
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-full flex items-center justify-center">
          <span className="text-white font-bold">👤</span>
        </div>
      )}
    </motion.div>
  );
}
