'use client';

import { useState } from 'react';
import { Reservation } from '../types';

interface ReservationListProps {
  reservations: Reservation[];
  onCancel: (id: string) => void;
  initialViewMode?: 'timeline' | 'list';
}

export default function ReservationList({ reservations, onCancel, initialViewMode = 'timeline' }: ReservationListProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>(initialViewMode);

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        예약 내역이 없습니다.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 없음';
    // dateString이 이미 YYYY-MM-DD 형식이므로 그대로 반환
    return dateString;
  };

  // 시간을 HH:MM 형식으로 변환 (초 제거)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // HH:MM:SS 또는 HH:MM 형식을 HH:MM으로 변환
    return timeString.substring(0, 5);
  };

  // 오늘 날짜 구하기 (YYYY-MM-DD 형식)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();

  // 시간을 분 단위로 변환
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 시간대를 시각화하기 위한 함수 (9시~18시 기준)
  const getTimelinePosition = (time: string) => {
    const minutes = timeToMinutes(time);
    const startMinutes = 9 * 60; // 9:00
    const endMinutes = 18 * 60; // 18:00
    const totalMinutes = endMinutes - startMinutes;

    const relativeMinutes = minutes - startMinutes;
    return (relativeMinutes / totalMinutes) * 100;
  };

  const getTimelineWidth = (startTime: string, endTime: string) => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const duration = end - start;
    const totalMinutes = 9 * 60; // 9시간 (9:00~18:00)

    return (duration / totalMinutes) * 100;
  };

  // 현재 시간 위치 계산
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startMinutes = 9 * 60; // 9:00
    const endMinutes = 18 * 60; // 18:00
    const totalMinutes = endMinutes - startMinutes;

    // 9시 이전이거나 18시 이후면 null 반환
    if (currentTimeInMinutes < startMinutes || currentTimeInMinutes > endMinutes) {
      return null;
    }

    const relativeMinutes = currentTimeInMinutes - startMinutes;
    return (relativeMinutes / totalMinutes) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();
  const currentTimeString = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // 회의실 목록 추출
  const roomNames = Array.from(new Set(reservations.map(r => r.roomName)));

  // 타임라인용: 오늘 날짜의 예약만 필터링하고 회의실별로 그룹화
  const todayReservations = reservations.filter(r => r.date === todayString);

  // 예약자별로 그룹화하는 함수
  const groupByUser = (reservations: Reservation[]) => {
    if (reservations.length === 0) return [];

    const sorted = [...reservations].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const grouped = new Map<string, Reservation[]>();

    sorted.forEach(reservation => {
      const userName = reservation.userName;
      if (!grouped.has(userName)) {
        grouped.set(userName, []);
      }
      grouped.get(userName)!.push(reservation);
    });

    return Array.from(grouped.entries()).map(([userName, userReservations]) => ({
      userName,
      reservations: userReservations
    }));
  };

  const todayGroupedByRoom = roomNames.map(roomName => ({
    roomName,
    userGroups: groupByUser(
      todayReservations.filter(r => r.roomName === roomName)
    )
  }));

  // 목록용: 전체 예약을 회의실별로 그룹화
  const allGroupedByRoom = roomNames.map(roomName => ({
    roomName,
    reservations: reservations
      .filter(r => r.roomName === roomName)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
  }));

  return (
    <div className="space-y-6">
      {/* 필터 버튼 및 뷰 모드 셀렉트 */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        {/* 회의실 필터 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRoom('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRoom === 'all'
                ? 'bg-[#4F00F8] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({reservations.length})
          </button>
          {roomNames.map((roomName) => {
            const count = reservations.filter(r => r.roomName === roomName).length;
            return (
              <button
                key={roomName}
                onClick={() => setSelectedRoom(roomName)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRoom === roomName
                    ? 'bg-[#4F00F8] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {roomName} ({count})
              </button>
            );
          })}
        </div>

        {/* 뷰 모드 셀렉트 박스 */}
        <div className="relative">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'timeline' | 'list')}
            className="appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F00F8] focus:border-transparent cursor-pointer"
          >
            <option value="timeline">오늘</option>
            <option value="list">목록</option>
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 타임라인 뷰 */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {todayReservations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              오늘 예약 내역이 없습니다.
            </div>
          ) : (
            todayGroupedByRoom
              .filter(({ roomName, userGroups }) => {
                // 선택된 회의실 필터링
                const matchesRoomFilter = selectedRoom === 'all' || roomName === selectedRoom;
                // 오늘 예약이 있는 회의실만 표시
                const hasReservations = userGroups.length > 0;
                return matchesRoomFilter && hasReservations;
              })
              .map(({ roomName, userGroups }) => (
                <div key={roomName} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg text-[#333] mb-4">{roomName}</h3>

                  {/* 시간 눈금 */}
                  <div className="relative mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>09:00</span>
                      <span>12:00</span>
                      <span>15:00</span>
                      <span>18:00</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full relative">
                      {/* 시간 구분선 */}
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gray-300"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gray-300"></div>
                    </div>
                  </div>

                  {/* 예약 목록 - 예약자별로 그룹화 */}
                  <div className="space-y-3 mt-4 relative">
                    {/* 현재 시간 라인 */}
                    {currentTimePosition !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                        style={{ left: `${currentTimePosition}%` }}
                      >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">
                          {currentTimeString}
                        </div>
                        <div className="absolute -top-0.5 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                    )}

                    {userGroups.map(({ userName, reservations: userReservations }) => (
                      <div key={userName} className="relative">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">{userName}</span>
                        </div>

                        {/* 타임라인 바 - 같은 예약자의 모든 예약을 한 줄에 표시 */}
                        <div className="relative h-8 bg-gray-100 rounded-lg mb-6">
                          {userReservations.map((reservation: Reservation) => {
                            const width = getTimelineWidth(reservation.startTime, reservation.endTime);
                            // 30분 예약의 경우 최소 너비 보장
                            const minWidth = Math.max(width, 8); // 최소 8%

                            return (
                              <div
                                key={reservation.id}
                                className="absolute h-full"
                                style={{
                                  left: `${getTimelinePosition(reservation.startTime)}%`,
                                  width: `${minWidth}%`
                                }}
                              >
                                <div className="h-full bg-[#4F00F8] rounded-lg flex items-center justify-between px-3 text-white text-xs font-medium">
                                  <span>{formatTime(reservation.startTime)}</span>
                                  <span>{formatTime(reservation.endTime)}</span>
                                </div>
                                <button
                                  onClick={() => onCancel(reservation.id)}
                                  className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
                                >
                                  취소
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* 목록 뷰 */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {allGroupedByRoom
            .filter(({ roomName }) => selectedRoom === 'all' || roomName === selectedRoom)
            .map(({ roomName, reservations: roomReservations }) => (
              <div key={roomName} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-[#333] mb-4">{roomName}</h3>

                <div className="space-y-3">
                  {roomReservations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">예약 내역이 없습니다</p>
                  ) : (
                    roomReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-800">{reservation.userName}</p>
                            <p className="text-sm text-gray-600">{formatDate(reservation.date)}</p>
                          </div>
                          <button
                            onClick={() => onCancel(reservation.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            취소
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{formatTime(reservation.startTime)}</span>
                          <span>-</span>
                          <span>{formatTime(reservation.endTime)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
