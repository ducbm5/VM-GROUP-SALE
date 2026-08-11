import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PasswordGateProps {
  onSuccess: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(true);
      setErrorMessage('Vui lòng nhập mật khẩu truy cập.');
      return;
    }

    setSubmitting(true);
    setError(false);

    try {
      // Direct validation with exact required password '898989'
      if (password === '898989') {
        sessionStorage.setItem('page_access_authenticated', 'true');
        onSuccess();
      } else {
        setError(true);
        setErrorMessage('Mật khẩu không chính xác! Vui lòng thử lại.');
      }
    } catch (err) {
      setError(true);
      setErrorMessage('Đã xảy ra lỗi khi kiểm tra mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] flex flex-col justify-center items-center p-4 selection:bg-[#1A1A1A] selection:text-[#F4F1EA]">
      {/* Background Subtle Grid Accent */}
      <div className="w-full max-w-md">
        
        {/* Brand Masthead Tag */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] text-white font-mono-tech text-xs font-bold uppercase tracking-widest mb-3">
            <Lock className="w-3.5 h-3.5 text-[#CC0000]" />
            HỆ THỐNG TRA CỨU BẢO MẬT
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight">
            Tra Cứu Đăng Ký Giải Chạy
          </h1>
          <p className="font-serif-title italic text-xs sm:text-sm text-neutral-600 mt-1">
            Báo Tài Chính - Financial Times Portal
          </p>
        </div>

        {/* Lock Screen Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border-2 border-[#1A1A1A] bg-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_#1A1A1A] relative"
        >
          {/* Top Red Accent Header Line */}
          <div className="h-1.5 bg-[#CC0000] -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6"></div>

          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1A1A1A]">
            <div className="p-2.5 bg-[#F4F1EA] border border-[#1A1A1A]">
              <KeyRound className="w-6 h-6 text-[#CC0000]" />
            </div>
            <div>
              <h2 className="font-serif-title text-lg font-bold text-[#1A1A1A]">
                Yêu Cầu Mật Khẩu
              </h2>
              <p className="font-mono-tech text-xs text-neutral-500">
                Nhập mật khẩu để truy cập thông tin
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="page-password-input"
                className="block font-mono-tech text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2"
              >
                Mật Khẩu Truy Cập Trang
              </label>
              
              <div className="relative">
                <input
                  id="page-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Nhập 6 chữ số mật khẩu..."
                  autoFocus
                  className={`w-full px-4 py-3 bg-[#F4F1EA] border-2 font-mono-tech text-sm tracking-wider text-[#1A1A1A] focus:outline-none transition-colors ${
                    error ? 'border-[#CC0000] bg-red-50' : 'border-[#1A1A1A] focus:bg-white'
                  }`}
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1A1A1A] p-1"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[#CC0000]/10 border border-[#CC0000] text-[#CC0000] font-mono-tech text-xs flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-[#1A1A1A] text-white font-mono-tech text-xs font-bold uppercase tracking-wider border-2 border-[#1A1A1A] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#CC0000]"
            >
              <span>{submitting ? 'Đang xác thực...' : 'Xác Nhận Truy Cập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-neutral-200 text-center">
            <p className="font-mono-tech text-[11px] text-neutral-500">
              Trang web chỉ dành cho nhân sự có thẩm quyền tra cứu.
            </p>
          </div>
        </motion.div>

        {/* Security badge below */}
        <div className="mt-6 text-center font-mono-tech text-[10px] text-neutral-500 uppercase tracking-widest">
          Mã bảo vệ: 898989 • Financial Times Editorial
        </div>
      </div>
    </div>
  );
};
