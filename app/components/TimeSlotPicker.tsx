'use client';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface TimeSlotPickerProps {
  selectedDate: string;
  bookedSlots: TimeSlot[];
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export default function TimeSlotPicker({
  selectedDate,
  bookedSlots,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimeSlotPickerProps) {
  // 시간을 분 단위로 변환
  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 오늘 날짜인지 확인
  const isToday = (dateString: string): boolean => {
    if (!dateString) return false;
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateString === todayString;
  };

  // 현재 시간 이전인지 확인 (시간 단위로 비교)
  const isPastTime = (time: string): boolean => {
    if (!isToday(selectedDate)) return false;
    const now = new Date();
    const currentHour = now.getHours();
    const [timeHour] = time.split(':').map(Number);
    return timeHour < currentHour;
  };

  const isDisabledEndTime = (time: string): boolean => {
    const convertedStartTime = Number(startTime.replace(':','').slice(0,3))
    const convertedEndTime = Number(time.replace(':','').slice(0,3))
  
    return !!(convertedStartTime && convertedStartTime >= convertedEndTime)
  };

  // 시작 시간 변경 핸들러 (종료 시간 자동 설정 포함)
  const handleStartTimeChange = (time: string) => {
    onStartTimeChange(time);

    // 시작 시간 + 1시간을 종료 시간으로 설정
    if (time) {
      const startMinutes = timeToMinutes(time);
      const endMinutes = startMinutes + 60; // 1시간 추가
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;

      // 19:00를 넘지 않도록 체크
      if (endHour < 19 || (endHour === 19 && endMinute === 0)) {
        const endTimeString = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
        onEndTimeChange(endTimeString);
      } else {
        // 19:00를 넘으면 19:00으로 설정
        onEndTimeChange('19:00');
      }
    }
  };

  // 선택한 시간이 예약된 시간과 겹치는지 확인
  const isTimeOverlapping = (start: string, end: string): boolean => {
    if (!start || !end) return false;

    const selectedStart = timeToMinutes(start);
    const selectedEnd = timeToMinutes(end);

    if (selectedStart >= selectedEnd) return false;

    return bookedSlots.some((slot) => {
      const bookedStart = timeToMinutes(slot.startTime);
      const bookedEnd = timeToMinutes(slot.endTime);

      // 겹치는 경우
      return (
        (selectedStart >= bookedStart && selectedStart < bookedEnd) ||
        (selectedEnd > bookedStart && selectedEnd <= bookedEnd) ||
        (selectedStart <= bookedStart && selectedEnd >= bookedEnd)
      );
    });
  };

  const hasOverlap = isTimeOverlapping(startTime, endTime);

  // 시간을 HH:MM 형식으로 변환 (초 제거)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // HH:MM:SS 또는 HH:MM 형식을 HH:MM으로 변환
    return timeString.substring(0, 5);
  };

  // 시작 시간: 08:30부터 18:00까지 (30분 단위)
  const generateStartTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // 08:30부터 시작
        if (hour === 8 && minute === 0) continue;
        if (hour === 18 && minute > 0) break;
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // 종료 시간: 09:00부터 19:00까지 (30분 단위)
  const generateEndTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 19 && minute > 0) break;
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const startTimeSlots = generateStartTimeSlots();
  const endTimeSlots = generateEndTimeSlots();

  return (
    <div className="space-y-4">
      {/* 예약된 시간대 표시 */}
      {selectedDate && bookedSlots.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm font-medium text-yellow-800 mb-2">예약된 시간대</p>
          <div className="space-y-1">
            {bookedSlots.map((slot, index) => (
              <div key={index} className="text-sm text-yellow-700">
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시간 선택 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium mb-2 text-[#333]">
            시작 시간 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="startTime"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              required
              className="appearance-none w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F00F8] text-gray-700 cursor-pointer"
            >
              <option value="">선택</option>
              {startTimeSlots.map((time) => (
                <option key={time} value={time} disabled={isPastTime(time)}>
                  {time}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium mb-2 text-[#333]">
            종료 시간 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="endTime"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              required
              className="appearance-none w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F00F8] text-gray-700 cursor-pointer"
            >
              <option value="">선택</option>
              {endTimeSlots.map((time) => (
                <option key={time} value={time} disabled={isDisabledEndTime(time)}>
                  {time}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 겹침 경고 */}
      {hasOverlap && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800">
            ⚠️ 선택한 시간이 이미 예약된 시간과 겹칩니다. 다른 시간을 선택해주세요.
          </p>
        </div>
      )}

      {/* 시간 오류 경고 */}
      {startTime && endTime && timeToMinutes(startTime) >= timeToMinutes(endTime) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800">
            ⚠️ 종료 시간은 시작 시간보다 늦어야 합니다.
          </p>
        </div>
      )}
    </div>
  );
}
