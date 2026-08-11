import React from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { MetaResponse } from '../types';

interface HeaderProps {
  meta: MetaResponse | null;
  loadingMeta: boolean;
  onRefreshMeta: () => void;
}

export const Header: React.FC<HeaderProps> = ({ meta, loadingMeta, onRefreshMeta }) => {
  return (
    <header className="border-b-2 border-[#1A1A1A] bg-[#F4F1EA]">
      {/* Main Editorial Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#1A1A1A] pb-6 gap-6">
          <div>
            <div className="font-mono-tech text-xs tracking-widest uppercase text-[#CC0000] font-bold mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#CC0000] inline-block"></span>
              BÁO CÁO DỮ LIỆU ĐĂNG KÝ GIẢI CHẠY BÁO TÀI CHÍNH
            </div>
            <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tight">
              Thống Kê Nhóm Đăng Ký
            </h1>
            <p className="font-serif-title italic text-sm sm:text-base text-neutral-700 mt-2">
              Tra cứu thông tin danh sách nhóm, thành viên, phân bổ cự ly và nghĩa vụ tài chính
            </p>
          </div>

          {/* Metadata Block */}
          <div className="border border-[#1A1A1A] p-3 bg-[#F4F1EA] font-mono-tech text-xs flex flex-col gap-2 min-w-[260px]">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-1.5">
              <span className="text-neutral-600 uppercase">Trạng thái hệ thống:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                SẴN SÀNG TRA CỨU
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-1.5">
              <span className="text-neutral-600 uppercase">Số nhóm đã lưu:</span>
              <span className="font-bold text-[#1A1A1A]">
                {loadingMeta ? '...' : meta?.totalGroups ? `${meta.totalGroups.toLocaleString('vi-VN')} Nhóm` : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-1.5">
              <span className="text-neutral-600 uppercase">Cơ sở dữ liệu:</span>
              <span className="font-bold text-[#1A1A1A] flex items-center gap-1">
                <Database className="w-3 h-3 text-[#CC0000]" />
                {loadingMeta ? 'Loading TSV...' : `${(meta?.totalRunners || 0).toLocaleString('vi-VN')} VĐV`}
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-neutral-500 uppercase">
                {meta?.lastUpdated ? `Cập nhật: ${new Date(meta.lastUpdated).toLocaleTimeString('vi-VN')}` : 'Cập nhật tự động'}
              </span>
              <button 
                onClick={onRefreshMeta}
                disabled={loadingMeta}
                className="hover:underline flex items-center gap-1 text-[10px] font-bold uppercase text-[#1A1A1A] disabled:opacity-50"
                title="Làm mới cache dữ liệu"
              >
                <RefreshCw className={`w-3 h-3 ${loadingMeta ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
