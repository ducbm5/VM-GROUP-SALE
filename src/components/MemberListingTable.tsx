import React, { useState, useMemo } from 'react';
import { RunnerMember } from '../types';
import { 
  Download, Filter, ArrowUpDown, ChevronLeft, ChevronRight, 
  Search, FileSpreadsheet 
} from 'lucide-react';

interface MemberListingTableProps {
  members: RunnerMember[];
  query: string;
}

export const MemberListingTable: React.FC<MemberListingTableProps> = ({
  members,
  query,
}) => {
  // Local Table Controls
  const [filterDistance, setFilterDistance] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterText, setFilterText] = useState<string>('');
  const [sortField, setSortField] = useState<keyof RunnerMember | 'stt'>('stt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  // Extract distinct distances for filter dropdown
  const distinctDistances = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.distance) set.add(m.distance);
    });
    return Array.from(set).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [members]);

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Distance filter
      if (filterDistance !== 'ALL' && m.distance !== filterDistance) {
        return false;
      }
      // Gender filter
      if (filterGender !== 'ALL') {
        const gUpper = (m.gender || '').toUpperCase();
        if (filterGender === 'M' && !(gUpper === 'M' || gUpper === 'NAM' || gUpper === 'MALE')) return false;
        if (filterGender === 'F' && !(gUpper === 'F' || gUpper === 'NỮ' || gUpper === 'FEMALE')) return false;
      }
      // Text search inside results
      if (filterText.trim()) {
        const q = filterText.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchUserId = (m.userId || '').toLowerCase().includes(q);
        const matchGroup = (m.nameGroup || '').toLowerCase().includes(q);
        const matchLead = (m.nameLead || '').toLowerCase().includes(q);
        const matchPhone = (m.phNo || '').toLowerCase().includes(q);
        const matchPassport = (m.idPassport || '').toLowerCase().includes(q);
        if (!matchName && !matchUserId && !matchGroup && !matchLead && !matchPhone && !matchPassport) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortField === 'stt') {
        return sortDirection === 'asc' ? a.rawRowIndex - b.rawRowIndex : b.rawRowIndex - a.rawRowIndex;
      }
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB, 'vi') : strB.localeCompare(strA, 'vi');
    });
  }, [members, filterDistance, filterGender, filterText, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const handleSort = (field: keyof RunnerMember | 'stt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'STT', 'USER_ID', 'NAME', 'ID_PASSPORT', 'PH_NO', 'DISTANCE', 'GENDER', 'TXNAMOUNT', 'DATE_CREATE'
    ];

    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      `"${m.userId || ''}"`,
      `"${m.name || ''}"`,
      `"${m.idPassport || ''}"`,
      `"${m.phNo || ''}"`,
      `"${m.distance || ''}"`,
      `"${m.gender || ''}"`,
      m.txnAmount || 0,
      `"${m.dateCreate || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_nhom_${query}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-[#F4F1EA] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Table Header Controls */}
        <div className="border-2 border-[#1A1A1A] bg-[#F4F1EA] shadow-[4px_4px_0px_0px_#1A1A1A] p-5 mb-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#1A1A1A] pb-4 mb-4 gap-4">
            <div>
              <div className="font-mono-tech text-xs uppercase tracking-widest text-[#CC0000] font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#CC0000]" />
                BẢNG LISTING THÀNH VIÊN CHI TIẾT
              </div>
              <h3 className="font-serif-title text-2xl font-black text-[#1A1A1A] mt-1">
                Danh Sách Thành Viên ({filteredMembers.length} VĐV)
              </h3>
            </div>

            {/* Action Button - Export Excel / CSV only */}
            <div className="flex items-center gap-2 font-mono-tech text-xs self-start sm:self-auto">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-[#1A1A1A] text-[#F4F1EA] hover:bg-neutral-800 font-bold uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_#CC0000] transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>XUẤT EXCEL / CSV</span>
              </button>
            </div>
          </div>

          {/* Filters Bar - Fixed line wrapping & padding */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-tech text-xs">
            
            {/* Filter Text */}
            <div className="relative flex items-center bg-white border border-[#1A1A1A] px-2.5 py-1.5 min-w-0">
              <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Lọc tên VĐV, CCCD, SĐT..."
                className="w-full font-mono-tech text-xs bg-transparent outline-none border-none focus:ring-0 min-w-0"
              />
            </div>

            {/* Filter Distance */}
            <div className="flex items-center gap-2 bg-white border border-[#1A1A1A] px-3 py-1.5 min-w-0">
              <Filter className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="text-[11px] font-bold text-neutral-600 uppercase whitespace-nowrap shrink-0">CỰ LY:</span>
              <select
                value={filterDistance}
                onChange={(e) => {
                  setFilterDistance(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent font-bold outline-none cursor-pointer text-xs min-w-0 truncate"
              >
                <option value="ALL">Tất cả cự ly ({members.length})</option>
                {distinctDistances.map(d => (
                  <option key={d} value={d}>Cự ly {d} KM</option>
                ))}
              </select>
            </div>

            {/* Filter Gender */}
            <div className="flex items-center gap-2 bg-white border border-[#1A1A1A] px-3 py-1.5 min-w-0">
              <span className="text-[11px] font-bold text-neutral-600 uppercase whitespace-nowrap shrink-0">GIỚI TÍNH:</span>
              <select
                value={filterGender}
                onChange={(e) => {
                  setFilterGender(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent font-bold outline-none cursor-pointer text-xs min-w-0 truncate"
              >
                <option value="ALL">Tất cả giới tính</option>
                <option value="M">Nam (Male)</option>
                <option value="F">Nữ (Female)</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="flex items-center justify-between gap-2 bg-white border border-[#1A1A1A] px-3 py-1.5 min-w-0">
              <span className="text-[11px] font-bold text-neutral-600 uppercase whitespace-nowrap shrink-0">HIỂN THỊ:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold outline-none cursor-pointer text-xs shrink-0"
              >
                <option value={15}>15 dòng / trang</option>
                <option value={20}>20 dòng / trang</option>
                <option value={50}>50 dòng / trang</option>
                <option value={100}>100 dòng / trang</option>
              </select>
            </div>

          </div>

        </div>

        {/* Financial Times Neo-Brutalist Hairline Grid Table */}
        <div className="border-2 border-[#1A1A1A] bg-[#F4F1EA] shadow-[4px_4px_0px_0px_#1A1A1A] overflow-x-auto">
          <table className="w-full text-left font-mono-tech text-xs border-collapse">
            
            {/* Dark Ink Header */}
            <thead>
              <tr className="bg-[#1A1A1A] text-[#F4F1EA] uppercase tracking-wider text-[11px] border-b-2 border-[#1A1A1A]">
                <th 
                  onClick={() => handleSort('stt')}
                  className="p-3 border-r border-neutral-700 font-bold cursor-pointer hover:bg-neutral-800 text-center w-12 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>#</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('userId')}
                  className="p-3 border-r border-neutral-700 font-bold cursor-pointer hover:bg-neutral-800 select-none min-w-[100px]"
                >
                  <div className="flex items-center gap-1">
                    <span>USER_ID</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('name')}
                  className="p-3 border-r border-neutral-700 font-bold cursor-pointer hover:bg-neutral-800 select-none min-w-[180px]"
                >
                  <div className="flex items-center gap-1">
                    <span>NAME (TÊN VĐV)</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                <th className="p-3 border-r border-neutral-700 font-bold min-w-[130px]">
                  <span>ID_PASSPORT</span>
                </th>

                <th className="p-3 border-r border-neutral-700 font-bold min-w-[110px]">
                  <span>PH_NO</span>
                </th>

                <th 
                  onClick={() => handleSort('distance')}
                  className="p-3 border-r border-neutral-700 font-bold cursor-pointer hover:bg-neutral-800 select-none text-center min-w-[90px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>DISTANCE</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('gender')}
                  className="p-3 border-r border-neutral-700 font-bold cursor-pointer hover:bg-neutral-800 select-none text-center min-w-[70px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>GENDER</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('txnAmount')}
                  className="p-3 border-r border-neutral-700 font-bold cursor-pointer hover:bg-neutral-800 select-none text-right min-w-[120px]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>TXNAMOUNT</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('dateCreate')}
                  className="p-3 font-bold cursor-pointer hover:bg-neutral-800 select-none text-center min-w-[110px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>DATE_CREATE</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500 font-mono-tech italic">
                    Không tìm thấy thành viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={idx}
                      className={`border-b border-[#1A1A1A]/20 hover:bg-[#CC0000]/10 transition-colors ${
                        isEven ? 'bg-[#F4F1EA]' : 'bg-white'
                      }`}
                    >
                      <td className="p-2.5 border-r border-[#1A1A1A]/20 text-center font-bold text-neutral-500">
                        {globalIdx}
                      </td>

                      <td className="p-2.5 border-r border-[#1A1A1A]/20 font-mono-tech font-bold text-neutral-800">
                        {m.userId || '---'}
                      </td>

                      <td className="p-2.5 border-r border-[#1A1A1A]/20 font-serif-title font-bold text-[#1A1A1A] text-sm">
                        {m.name || '---'}
                      </td>

                      <td className="p-2.5 border-r border-[#1A1A1A]/20 font-mono-tech text-neutral-800 font-semibold">
                        {m.idPassport || '---'}
                      </td>

                      <td className="p-2.5 border-r border-[#1A1A1A]/20 font-mono-tech text-neutral-800 font-semibold">
                        {m.phNo || '---'}
                      </td>

                      <td className="p-2.5 border-r border-[#1A1A1A]/20 text-center">
                        <span className="border border-[#1A1A1A] px-2 py-0.5 font-bold text-[#CC0000]">
                          {m.distance ? `${m.distance} KM` : '---'}
                        </span>
                      </td>

                      <td className="p-2.5 border-r border-[#1A1A1A]/20 text-center font-bold">
                        {m.gender?.toUpperCase() === 'M' || m.gender?.toUpperCase() === 'NAM' ? (
                          <span className="text-blue-800 bg-blue-100 px-1.5 py-0.5 border border-blue-300">NAM</span>
                        ) : m.gender?.toUpperCase() === 'F' || m.gender?.toUpperCase() === 'NỮ' ? (
                          <span className="text-[#CC0000] bg-red-100 px-1.5 py-0.5 border border-red-300">NỮ</span>
                        ) : (
                          <span>{m.gender || '---'}</span>
                        )}
                      </td>

                      <td className="p-2.5 border-r border-[#1A1A1A]/20 text-right font-bold text-[#1A1A1A]">
                        {formatVND(m.txnAmount || 0)}
                      </td>

                      <td className="p-2.5 text-center text-neutral-600 text-[11px]">
                        {m.dateCreate || '---'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table Footer / Pagination Controls */}
          <div className="bg-[#1A1A1A] text-[#F4F1EA] p-3 font-mono-tech text-xs flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-[#1A1A1A]">
            
            <div className="text-neutral-300 text-[11px]">
              HIỂN THỊ <span className="font-bold text-white">{filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> TỚI <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredMembers.length)}</span> TRONG TỔNG SỐ <span className="font-bold text-emerald-400">{filteredMembers.length}</span> KẾT QUẢ
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 border border-neutral-600 font-bold"
              >
                &laquo;
              </button>
              
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 border border-neutral-600 font-bold flex items-center"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 py-1 font-bold text-white bg-[#CC0000] border border-[#CC0000]">
                TRANG {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 border border-neutral-600 font-bold flex items-center"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 border border-neutral-600 font-bold"
              >
                &raquo;
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
