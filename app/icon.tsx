import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#4F00F8',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '6px',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 회의실 테이블과 의자 아이콘 */}
          <rect x="6" y="10" width="12" height="8" rx="1" fill="white" />
          <circle cx="8" cy="7" r="1.5" fill="white" />
          <circle cx="16" cy="7" r="1.5" fill="white" />
          <circle cx="8" cy="21" r="1.5" fill="white" />
          <circle cx="16" cy="21" r="1.5" fill="white" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
