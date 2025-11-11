'use client';

import { useState } from 'react';

interface ShareButtonProps {
  onShare: (message: string) => void;
}

export default function ShareButton({ onShare }: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    
    // Web Share API 지원 확인
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🏃‍♂️ 실시간 첨단구장 사용 현황판',
          text: '구장 이용 계획을 확인하고 공유해보세요!',
          url: url,
        });
        onShare('링크가 공유되었습니다!');
        return;
      } catch (error) {
        // 사용자가 공유를 취소했거나 오류가 발생한 경우
        console.log('Share cancelled or failed:', error);
      }
    }
    
    // Clipboard API 사용
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      onShare('링크가 클립보드에 복사되었습니다!');
      
      // 2초 후 상태 초기화
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      // 클립보드 접근 실패 시 fallback
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setIsCopied(true);
      onShare('링크가 클립보드에 복사되었습니다!');
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
        ${isCopied 
          ? 'bg-green-500 text-white' 
          : 'bg-orange-500 hover:bg-orange-600 text-white'
        }
        text-sm font-medium shadow-lg hover:shadow-xl
      `}
      title="페이지 공유"
    >
      {isCopied ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="hidden sm:inline">복사됨!</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span className="hidden sm:inline">공유</span>
        </>
      )}
    </button>
  );
}