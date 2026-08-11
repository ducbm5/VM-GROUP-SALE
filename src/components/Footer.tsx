import React from 'react';
import { Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F4F1EA] py-6 px-4 sm:px-6 lg:px-8 mt-auto font-mono-tech">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>&copy; {new Date().getFullYear()} THỐNG KÊ ĐĂNG KÝ NHÓM GIẢI CHẠY. ALL RIGHTS RESERVED.</span>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-neutral-400">
          FINANCIAL DATA GRAPHICS SPECIFICATION
        </div>
      </div>
    </footer>
  );
};
