import React from 'react';
import { GroupSetting, SearchStats } from '../types';
import { 
  Sliders, 
  Calendar, 
  Banknote, 
  Percent, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Layers, 
  AlertCircle, 
  Tag, 
  Hash, 
  Trophy, 
  BarChart3 
} from 'lucide-react';

interface GroupSettingsBoxProps {
  setting: GroupSetting | null | undefined;
  query: string;
  stats?: SearchStats | null;
}

export const GroupSettingsBox: React.FC<GroupSettingsBoxProps> = ({ setting, query, stats }) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Calculate Distance breakdown entries sorted by distance number from stats
  const distanceEntries = React.useMemo(() => {
    if (!stats?.distances) return [];
    return Object.entries(stats.distances).sort((a, b) => {
      const numA = parseInt(a[0]) || 0;
      const numB = parseInt(b[0]) || 0;
      return numA - numB;
    });
  }, [stats]);

  const totalRegisteredRunners = stats?.totalMembersFound || setting?.totalRegSuccess || 0;

  if (!setting) {
    return (
      <section className="bg-[#F4F1EA] border-b-2 border-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="border-2 border-[#1A1A1A] bg-[#F4F1EA] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#1A1A1A]">
            <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3 mb-4">
              <div className="font-mono-tech text-xs uppercase tracking-widest text-[#CC0000] font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#CC0000]" />
                <span>CÀI ĐẶT NHÓM</span>
              </div>
              <span className="font-mono-tech text-xs text-neutral-500">ID: {query}</span>
            </div>
            <div className="bg-white border border-[#1A1A1A] p-4 flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="font-mono-tech text-xs text-neutral-700">
                Chưa tìm thấy bản ghi cấu hình trong bảng Cài đặt nhóm cho mã ID <strong>{query}</strong>.
              </p>
            </div>

            {/* Số lượng đã đăng ký theo cự ly nếu có dữ liệu từ VĐV */}
            {distanceEntries.length > 0 && (
              <div className="border border-[#1A1A1A] bg-white p-5 shadow-[3px_3px_0px_0px_#1A1A1A]">
                <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-4">
                  <div className="font-mono-tech text-xs uppercase font-bold text-[#1A1A1A] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#CC0000]" />
                    <span>SỐ LƯỢNG ĐÃ ĐĂNG KÝ</span>
                  </div>
                  <span className="font-mono-tech text-[10px] text-neutral-500 uppercase">TỔNG {totalRegisteredRunners} VĐV</span>
                </div>

                <div className="space-y-4">
                  {distanceEntries.map(([dist, count]) => {
                    const runnerCount = Number(count) || 0;
                    const total = Number(totalRegisteredRunners) || 1;
                    const percent = Math.round((runnerCount / total) * 100);
                    return (
                      <div key={dist} className="space-y-1.5 font-mono-tech text-xs">
                        <div className="flex justify-between items-center text-[#1A1A1A]">
                          <span className="font-bold text-sm">
                            CỰ LY {dist.toUpperCase() === 'KHÁC' ? 'KHÁC' : `${dist} KM`}
                          </span>
                          <span className="bg-[#1A1A1A] text-[#F4F1EA] px-2.5 py-0.5 font-bold">
                            {count} VĐV ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-4 bg-neutral-100 border border-[#1A1A1A] p-0.5">
                          <div 
                            className="h-full bg-[#CC0000] transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const isBtc = setting.isBtcGroup === '1' || setting.isBtcGroup?.toLowerCase() === 'true';
  const totalSuccess = setting.totalRegSuccess || 0;
  const maxQuota = parseInt(setting.maxRegCount) || 0;
  const successRate = maxQuota > 0 
    ? Math.min(100, Math.round((totalSuccess / maxQuota) * 100))
    : 100;

  // Status text mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '1':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-800 px-2.5 py-0.5 font-bold font-mono-tech text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            TRẠNG THÁI: ĐÃ KÍCH HOẠT (1)
          </span>
        );
      case '2':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-800 px-2.5 py-0.5 font-bold font-mono-tech text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            TRẠNG THÁI: ĐANG HOẠT ĐỘNG (2)
          </span>
        );
      case '5':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-800 px-2.5 py-0.5 font-bold font-mono-tech text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
            TRẠNG THÁI: CHỜ XỬ LÝ (5)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 border border-[#1A1A1A] px-2.5 py-0.5 font-bold font-mono-tech text-xs">
            TRẠNG THÁI: {status || 'N/A'}
          </span>
        );
    }
  };

  return (
    <section className="bg-[#F4F1EA] border-b-2 border-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Box Container with FT Neo-brutalist shadow & borders */}
        <div className="border-2 border-[#1A1A1A] bg-[#F4F1EA] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#1A1A1A]">
          
          {/* Header Row of the Box */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#1A1A1A] pb-4 mb-6 gap-4">
            <div>
              <div className="font-mono-tech text-xs uppercase tracking-widest text-[#CC0000] font-bold flex items-center gap-2 mb-1">
                <Sliders className="w-4 h-4 text-[#CC0000]" />
                <span>THÔNG TIN CẤU HÌNH NHÓM</span>
              </div>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-black text-[#1A1A1A] flex items-center flex-wrap gap-2">
                <span>Cài đặt nhóm:</span>
                <span className="text-[#CC0000]">{setting.nameGroup || `Nhóm ID ${setting.idGroup}`}</span>
              </h2>
            </div>

            {/* Badges on Top Right */}
            <div className="flex flex-wrap items-center gap-2 font-mono-tech text-xs">
              <div className="bg-white border border-[#1A1A1A] px-3 py-1.5 font-bold uppercase shadow-[2px_2px_0px_0px_#1A1A1A] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#CC0000]" />
                <span>ID NHÓM:</span>
                <span className="text-[#CC0000] font-black">{setting.idGroup}</span>
              </div>

              {isBtc && (
                <span className="bg-[#CC0000] text-white border border-[#1A1A1A] px-3 py-1.5 font-bold uppercase shadow-[2px_2px_0px_0px_#1A1A1A] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  NHÓM BTC
                </span>
              )}

              {getStatusBadge(setting.status)}
            </div>
          </div>

          {/* Section 1: Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* 1. Tổng đăng ký thành công */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ĐĂNG KÝ THÀNH CÔNG
                </span>
                {maxQuota > 0 && (
                  <span className="text-[10px] text-neutral-400 font-mono-tech">/ HẠN MỨC {maxQuota}</span>
                )}
              </div>
              <div className="font-serif-title text-2xl font-black text-emerald-800">
                {setting.totalRegSuccess || 0} <span className="text-xs font-mono-tech text-[#1A1A1A] font-bold">VĐV</span>
              </div>
              {maxQuota > 0 && (
                <div className="mt-2 font-mono-tech text-[10px] text-neutral-600">
                  Đạt {successRate}% chỉ tiêu ({setting.totalRegSuccess}/{maxQuota} BIB)
                </div>
              )}
            </div>

            {/* 2. Số tiền thành công */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                <span>SỐ TIỀN THÀNH CÔNG</span>
              </div>
              <div className="font-serif-title text-xl font-black text-emerald-800">
                {formatVND(setting.amountSuccess || 0)}
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đã ghi nhận vào hệ thống</span>
              </div>
            </div>

            {/* 3. Giai đoạn & Hạn mức */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#CC0000]" />
                <span>GIAI ĐOẠN (STAGE)</span>
              </div>
              <div className="font-serif-title text-xl font-bold text-[#1A1A1A]">
                {setting.stage || 'Regular'}
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-neutral-600 flex items-center gap-1">
                <Percent className="w-3 h-3 text-[#CC0000]" />
                <span>Chiết khấu: <strong>{setting.discount ? `${setting.discount}%` : 'Không có'}</strong></span>
              </div>
            </div>

            {/* 4. Thời hạn đăng ký */}
            <div className="border border-[#1A1A1A] bg-white p-4 shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-[11px] uppercase text-neutral-500 font-bold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>THỜI HẠN ĐĂNG KÝ</span>
              </div>
              <div className="font-mono-tech text-sm font-bold text-[#1A1A1A] break-words">
                {setting.regDeadline || 'Không giới hạn'}
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>Tạo lúc: {setting.createdAt || 'N/A'}</span>
              </div>
            </div>

          </div>

          {/* Section 2: Contact Info & Quota Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            
            {/* Left: Group Contact & Administrative Details (7 Cols) */}
            <div className="lg:col-span-7 border border-[#1A1A1A] bg-white p-5 shadow-[3px_3px_0px_0px_#1A1A1A]">
              <div className="font-mono-tech text-xs uppercase font-bold text-[#1A1A1A] border-b border-[#1A1A1A] pb-2.5 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#CC0000]" />
                <span>CHI TIẾT LIÊN HỆ & THÔNG TIN HỆ THỐNG</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-tech text-xs">
                
                {/* Tên nhóm */}
                <div className="p-3 bg-neutral-50 border border-neutral-200">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold">TÊN NHÓM</div>
                  <div className="font-serif-title text-base font-bold text-[#1A1A1A] mt-0.5">
                    {setting.nameGroup || '---'}
                  </div>
                </div>

                {/* Trưởng nhóm */}
                <div className="p-3 bg-neutral-50 border border-neutral-200">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold flex items-center gap-1">
                    <User className="w-3 h-3 text-[#CC0000]" />
                    <span>TRƯỞNG NHÓM</span>
                  </div>
                  <div className="font-serif-title text-base font-bold text-[#1A1A1A] mt-0.5">
                    {setting.nameLead || '---'}
                  </div>
                </div>

                {/* Điện thoại */}
                <div className="p-3 bg-neutral-50 border border-neutral-200">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-700" />
                    <span>ĐIỆN THOẠI</span>
                  </div>
                  <div className="font-bold text-[#1A1A1A] mt-0.5 text-sm">
                    {setting.phone || '---'}
                  </div>
                </div>

                {/* Email */}
                <div className="p-3 bg-neutral-50 border border-neutral-200">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-700" />
                    <span>EMAIL</span>
                  </div>
                  <div className="font-bold text-[#1A1A1A] mt-0.5 truncate text-xs" title={setting.email}>
                    {setting.email || '---'}
                  </div>
                </div>

                {/* Giải đấu / Match */}
                <div className="p-3 bg-neutral-50 border border-neutral-200 sm:col-span-2">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#CC0000]" />
                    <span>GIẢI ĐẤU (MATCH)</span>
                  </div>
                  <div className="font-bold text-[#1A1A1A] mt-0.5 text-sm">
                    {setting.matchName || '---'} <span className="text-neutral-500 font-normal">(Mã giải: {setting.matchId || '---'})</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Quota & Distance Allocations (5 Cols) */}
            <div className="lg:col-span-5 border border-[#1A1A1A] bg-white p-5 shadow-[3px_3px_0px_0px_#1A1A1A] flex flex-col justify-between">
              <div>
                <div className="font-mono-tech text-xs uppercase font-bold text-[#1A1A1A] border-b border-[#1A1A1A] pb-2.5 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#CC0000]" />
                    <span>SỐ LƯỢNG PHÂN BỔ THEO CỰ LY</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono-tech">CẤU HÌNH</span>
                </div>

                {/* Distance Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 font-mono-tech">
                  
                  {/* 5KM */}
                  <div className="border border-[#1A1A1A] p-3 bg-[#F4F1EA]">
                    <div className="text-[10px] text-neutral-600 font-bold uppercase">CỰ LY 5KM</div>
                    <div className="text-xl font-black text-[#1A1A1A] mt-1">
                      {setting.qty5km ? `${setting.qty5km}` : '0'} <span className="text-[10px] font-bold text-neutral-500">BIB</span>
                    </div>
                  </div>

                  {/* 10KM */}
                  <div className="border border-[#1A1A1A] p-3 bg-[#F4F1EA]">
                    <div className="text-[10px] text-neutral-600 font-bold uppercase">CỰ LY 10KM</div>
                    <div className="text-xl font-black text-[#1A1A1A] mt-1">
                      {setting.qty10km ? `${setting.qty10km}` : '0'} <span className="text-[10px] font-bold text-neutral-500">BIB</span>
                    </div>
                  </div>

                  {/* 21KM */}
                  <div className="border border-[#1A1A1A] p-3 bg-[#F4F1EA]">
                    <div className="text-[10px] text-neutral-600 font-bold uppercase">CỰ LY 21KM</div>
                    <div className="text-xl font-black text-[#1A1A1A] mt-1">
                      {setting.qty21km ? `${setting.qty21km}` : '0'} <span className="text-[10px] font-bold text-neutral-500">BIB</span>
                    </div>
                  </div>

                  {/* 42KM */}
                  <div className="border border-[#1A1A1A] p-3 bg-[#F4F1EA]">
                    <div className="text-[10px] text-neutral-600 font-bold uppercase">CỰ LY 42KM</div>
                    <div className="text-xl font-black text-[#1A1A1A] mt-1">
                      {setting.qty42km ? `${setting.qty42km}` : '0'} <span className="text-[10px] font-bold text-neutral-500">BIB</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Total registered vs Max Quota bar */}
              <div className="pt-3 border-t border-neutral-200 font-mono-tech text-xs">
                <div className="flex justify-between items-center text-neutral-700 mb-1.5">
                  <span className="font-bold text-[11px] uppercase">HẠN MỨC ĐƯỢC ĐĂNG KÝ:</span>
                  <span className="font-bold text-[#CC0000] text-sm">{setting.maxRegCount ? `${setting.maxRegCount} BIB` : 'Không giới hạn'}</span>
                </div>
                {maxQuota > 0 && (
                  <div className="w-full h-3.5 bg-neutral-100 border border-[#1A1A1A] p-0.5">
                    <div 
                      className="h-full bg-[#1A1A1A] transition-all duration-500" 
                      style={{ width: `${successRate}%` }}
                    ></div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Section 3: SỐ LƯỢNG ĐÃ ĐĂNG KÝ (NẰM TRONG BOX CÀI ĐẶT NHÓM) */}
          <div className="border border-[#1A1A1A] bg-white p-5 shadow-[3px_3px_0px_0px_#1A1A1A]">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-4">
              <div className="font-mono-tech text-xs uppercase font-bold text-[#1A1A1A] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#CC0000]" />
                <span>SỐ LƯỢNG ĐÃ ĐĂNG KÝ</span>
              </div>
              <span className="font-mono-tech text-[10px] text-neutral-500 uppercase font-bold">
                TỔNG {totalRegisteredRunners} VĐV THAM GIA
              </span>
            </div>

            <div className="space-y-4">
              {distanceEntries.length === 0 ? (
                <p className="font-mono-tech text-xs text-neutral-500 py-2">
                  Chưa có dữ liệu phân bổ cự ly chạy từ danh sách VĐV.
                </p>
              ) : (
                distanceEntries.map(([dist, count]) => {
                  const runnerCount = Number(count) || 0;
                  const total = Number(totalRegisteredRunners) || 1;
                  const percent = Math.round((runnerCount / total) * 100);
                  return (
                    <div key={dist} className="space-y-1.5 font-mono-tech text-xs">
                      <div className="flex justify-between items-center text-[#1A1A1A]">
                        <span className="font-bold text-sm">
                          CỰ LY {dist.toUpperCase() === 'KHÁC' ? 'KHÁC' : `${dist} KM`}
                        </span>
                        <span className="bg-[#1A1A1A] text-[#F4F1EA] px-2.5 py-0.5 font-bold">
                          {count} VĐV ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-4 bg-neutral-100 border border-[#1A1A1A] p-0.5">
                        <div 
                          className="h-full bg-[#CC0000] transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};


