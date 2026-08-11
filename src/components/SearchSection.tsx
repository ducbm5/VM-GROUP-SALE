import React, { useState } from 'react';
import { Search, ShieldAlert, X, ArrowRight } from 'lucide-react';

interface SearchSectionProps {
  onSearch: (query: string, exact: boolean) => void;
  loading: boolean;
  currentQuery: string;
  hasSearched: boolean;
  onClearSearch: () => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  onSearch,
  loading,
  currentQuery,
  hasSearched,
  onClearSearch,
}) => {
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [exactMatch, setExactMatch] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim(), exactMatch);
    }
  };

  const handleClear = () => {
    setSearchInput('');
    onClearSearch();
  };

  return (
    <div className="bg-[#F4F1EA] border-b-2 border-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Search Panel Card - Sharp Neo-Brutalist Layout */}
        <div className="border-2 border-[#1A1A1A] bg-[#F4F1EA] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-5">
            <div className="font-mono-tech text-xs uppercase tracking-widest font-bold text-[#1A1A1A] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#CC0000]" />
              <span>TRA CỨU THEO MÃ ID_GROUP</span>
            </div>
            <span className="font-mono-tech text-[10px] text-neutral-600 uppercase border border-[#1A1A1A] px-2 py-0.5">
              ID_GROUP LOOKUP
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-0 border-2 border-[#1A1A1A]">
              <div className="relative flex-grow flex items-center bg-white">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nhập mã ID_GROUP (VD: 14399)..."
                  className="w-full px-4 py-3.5 font-mono-tech text-sm text-[#1A1A1A] placeholder-neutral-400 bg-transparent outline-none border-none focus:ring-0"
                  autoFocus
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="p-2 text-neutral-400 hover:text-[#1A1A1A] mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || searchInput.trim().length < 5}
                className="px-8 py-3.5 bg-[#1A1A1A] text-[#F4F1EA] hover:bg-[#333333] active:bg-black font-mono-tech text-sm font-bold uppercase border-t-2 sm:border-t-0 sm:border-l-2 border-[#1A1A1A] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[150px]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#F4F1EA] border-t-transparent animate-spin inline-block"></span>
                    <span>ĐANG TÌM...</span>
                  </>
                ) : (
                  <>
                    <span>TÌM KIẾM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Validation feedback & Actions */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono-tech pt-1 gap-3">
              <div className="flex items-center gap-2">
                {searchInput.trim().length > 0 && searchInput.trim().length < 5 ? (
                  <span className="text-[#CC0000] font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 inline" />
                    Cần tối thiểu 5 ký tự ({searchInput.trim().length}/5)
                  </span>
                ) : searchInput.trim().length >= 5 ? (
                  <span className="text-emerald-700 font-bold">
                    ✓ Đã đạt {searchInput.trim().length} ký tự
                  </span>
                ) : null}
              </div>

              {hasSearched && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-neutral-600 hover:text-[#CC0000] underline font-mono-tech text-[11px] uppercase flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Xóa kết quả</span>
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
