import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100" style={{ backgroundColor: '#f3f4f6' }}>
      {/* Mobile First Container - Max Width 430px centered on desktop */}
      <div className="mx-auto max-w-[430px] min-h-screen bg-white shadow-2xl relative">
        {children}
      </div>
    </div>
  );
}
