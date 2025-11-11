'use client';

import { useState } from 'react';
import { Reservation } from '../types';

interface CalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  roomId?: string;
  reservations?: Reservation[];
}

export default function Calendar({ selectedDate, onDateChange, roomId, reservations = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    // Use local date formatting to avoid timezone issues
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateChange(formattedDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    // Parse the date string directly to avoid timezone issues
    const [selectedYear, selectedMonth, selectedDay] = selectedDate.split('-').map(Number);
    return (
      selectedDay === day &&
      selectedMonth - 1 === month &&
      selectedYear === year
    );
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(year, month, day);
    return dateToCheck < today;
  };

  // 특정 날짜에 예약이 있는지 확인
  const hasReservation = (day: number) => {
    if (!roomId) return false;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return reservations.some(r => r.roomId === roomId && r.date === dateString);
  };

  // 특정 날짜에 예약 가능한 시간이 있는지 확인 (08:30 - 19:00 범위)
  const hasAvailableSlots = (day: number) => {
    if (!roomId) return true;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 해당 날짜의 모든 예약 가져오기
    const dayReservations = reservations
      .filter(r => r.roomId === roomId && r.date === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (dayReservations.length === 0) return true;

    // 시간을 분으로 변환
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const START_TIME = 8 * 60 + 30; // 08:30
    const END_TIME = 19 * 60; // 19:00
    const MIN_SLOT = 30; // 최소 30분

    // 첫 예약 전에 시간이 있는지 확인
    if (timeToMinutes(dayReservations[0].startTime) - START_TIME >= MIN_SLOT) {
      return true;
    }

    // 예약 사이의 간격 확인
    for (let i = 0; i < dayReservations.length - 1; i++) {
      const gap = timeToMinutes(dayReservations[i + 1].startTime) - timeToMinutes(dayReservations[i].endTime);
      if (gap >= MIN_SLOT) {
        return true;
      }
    }

    // 마지막 예약 후에 시간이 있는지 확인
    const lastReservation = dayReservations[dayReservations.length - 1];
    if (END_TIME - timeToMinutes(lastReservation.endTime) >= MIN_SLOT) {
      return true;
    }

    return false;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const past = isPastDate(day);
    const today = isToday(day);
    const selected = isSelected(day);
    const hasReservations = hasReservation(day);
    const isFullyBooked = !hasAvailableSlots(day);
    const isDisabled = past || isFullyBooked;

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => !isDisabled && handleDateClick(day)}
        disabled={isDisabled}
        className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors relative ${
          selected
            ? 'bg-[#4F00F8] text-white font-semibold'
            : today
            ? 'bg-[#E6D9FF] text-[#4F00F8] font-semibold'
            : isFullyBooked
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
            : past
            ? 'text-gray-300 cursor-not-allowed'
            : hasReservations
            ? 'hover:bg-gray-100 text-gray-700 font-medium'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        {day}
        {hasReservations && !selected && !isFullyBooked && !past && (
          <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></span>
        )}
      </button>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#333]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h3 className="font-semibold text-gray-900">
          {year}년 {monthNames[month]}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#333]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="aspect-square flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
}
