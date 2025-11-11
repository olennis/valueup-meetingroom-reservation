'use client';

import { useState } from 'react';

interface FooterProps {
  onCopy: (message: string) => void;
}

export default function Footer({ onCopy }: FooterProps) {
  const [isCopied, setIsCopied] = useState(false);
  const developerEmail = 'olennis0217@gmail.com';

  const handleEmailCopy = async () => {
    try {
      await navigator.clipboard.writeText(developerEmail);
      setIsCopied(true);
      onCopy('개발자 이메일이 클립보드에 복사되었습니다!');
      
      // 2초 후 상태 초기화
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      // 클립보드 접근 실패 시 fallback
      const textArea = document.createElement('textarea');
      textArea.value = developerEmail;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setIsCopied(true);
      onCopy('개발자 이메일이 클립보드에 복사되었습니다!');
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <footer className="mt-8 sm:mt-12 lg:mt-16 py-6 sm:py-8 border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          
          <button
            onClick={handleEmailCopy}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 text-xs sm:text-sm
              ${isCopied 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
              }
            `}
            title={`개발자 이메일: ${developerEmail}`}
          >
            {isCopied ? (
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>개발자에게 문의하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}