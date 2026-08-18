import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SearchSection } from './components/SearchSection';
import { GroupSettingsBox } from './components/GroupSettingsBox';
import { MemberListingTable } from './components/MemberListingTable';
import { Footer } from './components/Footer';
import { PasswordGate } from './components/PasswordGate';
import { MetaResponse, SearchResponse, RunnerMember } from './types';
import { clientGetMeta, clientSearch } from './lib/tsvParser';
import { ShieldAlert, Search, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('page_access_authenticated') === 'true';
  });

  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);

  // Fetch Meta Statistics with automatic static host fallback
  const fetchMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const res = await fetch('/api/meta');
      if (res.ok) {
        const data = await res.json();
        if (data && data.totalRunners !== undefined) {
          setMeta(data);
          return;
        }
      }
      // Fallback for Vercel static hosting or offline API
      const fallbackData = await clientGetMeta();
      setMeta(fallbackData);
    } catch (err) {
      console.warn('Backend API /api/meta not reachable, using client TSV parser:', err);
      try {
        const fallbackData = await clientGetMeta();
        setMeta(fallbackData);
      } catch (fallbackErr) {
        console.error('Client TSV fetch failed:', fallbackErr);
      }
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Handle Search Submission with automatic static host fallback
  const handleSearch = async (query: string, exact: boolean = false) => {
    if (!query.trim()) return;

    setSearching(true);
    setCurrentQuery(query);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&exact=${exact}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data: SearchResponse = await res.json();
          if (data && data.status) {
            setSearchResponse(data);
            return;
          }
        }
      }
      // Fallback for Vercel static hosting or offline API
      const clientResult = await clientSearch(query, exact);
      setSearchResponse(clientResult);
    } catch (err: any) {
      console.warn('Backend API /api/search not reachable, using client TSV search:', err);
      try {
        const clientResult = await clientSearch(query, exact);
        setSearchResponse(clientResult);
      } catch (clientErr: any) {
        setSearchResponse({
          status: 'error',
          query,
          groups: [],
          stats: null,
          message: clientErr.message || 'Lỗi mạng khi tải dữ liệu tra cứu.'
        });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setHasSearched(false);
    setCurrentQuery('');
    setSearchResponse(null);
  };

  // Aggregate all members from matched groups
  const allMatchedMembers: RunnerMember[] = React.useMemo(() => {
    if (!searchResponse || !searchResponse.groups) return [];
    return searchResponse.groups.flatMap(g => g.members);
  }, [searchResponse]);

  const handleLockPage = () => {
    sessionStorage.removeItem('page_access_authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#1A1A1A] selection:text-[#F4F1EA]">
      
      {/* FT Editorial Masthead */}
      <Header 
        meta={meta} 
        loadingMeta={loadingMeta} 
        onRefreshMeta={fetchMeta} 
        onLockPage={handleLockPage}
      />

      {/* Search Bar Component - Always displayed at top */}
      <SearchSection
        onSearch={handleSearch}
        loading={searching}
        currentQuery={currentQuery}
        hasSearched={hasSearched}
        onClearSearch={handleClearSearch}
      />

      {/* Main Content Area */}
      <main className="flex-grow">

        {/* LOADING STATE */}
        {searching && (
          <div className="py-20 px-4 text-center font-mono-tech text-sm">
            <div className="inline-block border-2 border-[#1A1A1A] p-8 bg-white shadow-[4px_4px_0px_0px_#1A1A1A]">
              <span className="inline-block w-8 h-8 border-4 border-[#1A1A1A] border-t-[#CC0000] animate-spin mb-4"></span>
              <div className="font-bold uppercase text-[#1A1A1A] tracking-wider text-base">
                ĐANG LẤY VÀ TRA CỨU DỮ LIỆU...
              </div>
              <p className="text-neutral-500 text-xs mt-1">Đang tra cứu cơ sở dữ liệu VĐV theo mã ID_GROUP</p>
            </div>
          </div>
        )}

        {/* SEARCH RESULT CONTENT */}
        {hasSearched && !searching && searchResponse && (
          <AnimatePresence mode="wait">
            {searchResponse.status !== 'success' || searchResponse.groups.length === 0 ? (
              
              /* ERROR OR UNMATCHED OR MULTIPLE MATCHES STATE */
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key="not_found"
                className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
              >
                <div className="border-2 border-[#CC0000] bg-[#F4F1EA] p-8 shadow-[6px_6px_0px_0px_#CC0000] text-center">
                  <div className="inline-flex p-3 bg-[#CC0000] text-white mb-4">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="font-mono-tech text-xs uppercase font-bold text-[#CC0000] mb-1">
                    {searchResponse.status === 'multiple_matches' 
                      ? 'LỖI: TRÙNG LẮP NHIỀU KẾT QUẢ' 
                      : searchResponse.status === 'invalid_length'
                      ? 'LỖI: ĐỘ DÀI MÃ TÌM KIẾM KHÔNG ĐỦ'
                      : 'KẾT QUẢ TRA CỨU KHÔNG THÀNH CÔNG'}
                  </div>
                  <h3 className="font-serif-title text-2xl font-bold text-[#1A1A1A] mb-3">
                    {searchResponse.message || `Không thể hiển thị thông tin nhóm cho từ khóa "${currentQuery}"`}
                  </h3>
                  <p className="font-mono-tech text-xs text-neutral-700 mb-6 max-w-lg mx-auto bg-white p-3 border border-[#1A1A1A] text-left">
                    <strong>Yêu cầu hệ thống:</strong><br />
                    • Chỉ tìm kiếm theo mã <strong>ID_GROUP</strong> (không tìm theo tên nhóm).<br />
                    • Độ dài từ khóa cần ít nhất <strong>5 ký tự</strong>.<br />
                    • Luôn hiển thị duy nhất 1 nhóm. Vui lòng nhập chính xác đầy đủ mã ID.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="px-6 py-2.5 bg-[#1A1A1A] text-white font-mono-tech text-xs font-bold uppercase border border-[#1A1A1A] hover:bg-neutral-800"
                  >
                    Thử Nhập Mã ID_GROUP Khác
                  </button>
                </div>
              </motion.div>

            ) : (

              /* SUCCESS STATE: Display Group Settings Box & Member Listing Table */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                key="results"
              >
                {/* 1. BOX CÀI ĐẶT NHÓM (GROUP SETTINGS BOX - CHỨA ĐẦY ĐỦ CẤU HÌNH & PHÂN BỔ CỰ LY) */}
                <GroupSettingsBox
                  setting={searchResponse.groupSetting}
                  query={currentQuery}
                  stats={searchResponse.stats}
                />

                {/* 2. BẢNG LISTING THÀNH VIÊN (MEMBER LISTING TABLE) */}
                <MemberListingTable
                  members={allMatchedMembers}
                  query={currentQuery}
                />
              </motion.div>

            )}
          </AnimatePresence>
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
