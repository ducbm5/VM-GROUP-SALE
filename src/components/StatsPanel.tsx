import React from 'react';
import { GroupSummary, SearchStats } from '../types';
import { Users, Award, ShieldCheck, Flag, User, Banknote } from 'lucide-react';

interface StatsPanelProps {
  stats: SearchStats;
  groups: GroupSummary[];
  query: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, groups, query }) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const group = groups[0] || null;
  const groupName = group?.nameGroup || 'Chưa cập nhật tên';
  const idGroup = group?.idGroup || query;
  const leaderName = group?.nameLead || 'Chưa cập nhật';
  const raceName = group?.race || 'Chưa cập nhật giải';
  const totalMembers = group?.memberCount || stats.totalMembersFound || 0;
  const totalAmount = group?.totalTxnAmount || stats.totalAmount || 0;

  return (
    <section className="bg-[#F4F1EA] border-b-2 border-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#1A1A1A] pb-3 mb-6 gap-2">
          <div>
            <div className="font-mono-tech text-xs uppercase tracking-widest text-[#CC0000] font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-[#CC0000]"></span>
              THỐNG KÊ CHI TIẾT NHÓM
            </div>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-black text-[#1A1A1A]">
              Thông Tin Nhóm: {groupName}
            </h2>
          </div>
          <div className="font-mono-tech text-xs text-[#1A1A1A] bg-white border border-[#1A1A1A] px-3 py-1.5 font-bold uppercase self-start md:self-auto shadow-[2px_2px_0px_0px_#1A1A1A]">
            ID_GROUP: <span className="text-[#CC0000]">{idGroup}</span>
          </div>
        </div>

        {/* 1 BOX THÔNG TIN CỦA NHÓM */}
        <div className="border-2 border-[#1A1A1A] bg-[#F4F1EA] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#1A1A1A]">
          
          <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-4 mb-6">
            <div className="font-mono-tech text-sm uppercase font-black text-[#1A1A1A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#CC0000]" />
              <span>THÔNG TIN XÁC NHẬN CỦA NHÓM</span>
            </div>
            <span className="font-mono-tech text-xs text-emerald-800 bg-emerald-100 border border-emerald-800 px-2.5 py-0.5 font-bold">
              HỢP LỆ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Giải chạy */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-[#CC0000]" />
                <span>GIẢI CHẠY</span>
              </div>
              <div className="font-serif-title text-lg font-bold text-[#1A1A1A]">
                {raceName}
              </div>
            </div>

            {/* 2. Tên nhóm */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>TÊN NHÓM</span>
              </div>
              <div className="font-serif-title text-lg font-bold text-[#1A1A1A]">
                {groupName} <span className="text-xs font-mono-tech text-neutral-500 font-normal">(ID: {idGroup})</span>
              </div>
            </div>

            {/* 3. Tên trưởng nhóm */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>TRƯỞNG NHÓM</span>
              </div>
              <div className="font-serif-title text-lg font-bold text-[#1A1A1A]">
                {leaderName}
              </div>
            </div>

            {/* 4. Tổng số thành viên */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#CC0000]" />
                <span>SỐ THÀNH VIÊN</span>
              </div>
              <div className="font-serif-title text-2xl font-black text-[#CC0000]">
                {totalMembers} <span className="text-xs font-mono-tech text-[#1A1A1A] font-bold">VĐV</span>
              </div>
            </div>

            {/* 5. Tổng số tiền */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                <span>TỔNG SỐ TIỀN</span>
              </div>
              <div className="font-serif-title text-xl font-black text-emerald-800">
                {formatVND(totalAmount)}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

