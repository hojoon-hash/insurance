import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ current, total }) {
  const progress = (current / total) * 100;
  
  return (
    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}
