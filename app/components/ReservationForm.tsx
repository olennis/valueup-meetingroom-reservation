'use client';

import { useState } from 'react';
import { Reservation, Room } from '../types';
import Calendar from './Calendar';
import TimeSlotPicker from './TimeSlotPicker';

interface ReservationFormProps {
  room: Room;
  reservations: Reservation[];
  onSubmit: (reservation: Omit<Reservation, 'id' | 'roomName'>) => void;
  onCancel: () => void;
}

export default function ReservationForm({ room, reservations, onSubmit, onCancel }: ReservationFormProps) {
  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    date: getTodayDate(),
    startTime: '',
    endTime: '',
    purpose: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      roomId: room.id,
      ...formData,
    });
    setFormData({
      userName: '',
      userEmail: '',
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 선택한 날짜의 예약된 시간대 가져오기
  const getBookedSlots = () => {
    if (!formData.date) return [];

    return reservations
      .filter(r => r.roomId === room.id && r.date === formData.date)
      .map(r => ({
        startTime: r.startTime,
        endTime: r.endTime,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)); // 시작 시간 순으로 정렬
  };

  // 폼 유효성 검사
  const isFormValid = () => {
    return (
      formData.date &&
      formData.startTime &&
      formData.endTime &&
      formData.userName.trim()
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-[#333]">{room.name} 예약</h2>
        <form onSubmit={handleSubmit}>
         
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium mb-2 text-[#333]" >
              예약 날짜 <span className="text-red-500">*</span>
            </label>
            <Calendar
              selectedDate={formData.date}
              onDateChange={(date) => setFormData({ ...formData, date, startTime: '', endTime: '' })}
              roomId={room.id}
              reservations={reservations}
            />
            {formData.date && (
              <p className="mt-2 text-sm text-gray-600">
                선택한 날짜: {formData.date}
              </p>
            )}
          </div>

          <div className="mb-4">
            <TimeSlotPicker
              selectedDate={formData.date}
              bookedSlots={getBookedSlots()}
              startTime={formData.startTime}
              endTime={formData.endTime}
              onStartTimeChange={(time) => setFormData(prev => ({ ...prev, startTime: time }))}
              onEndTimeChange={(time) => setFormData(prev => ({ ...prev, endTime: time }))}
            />
          </div>
           <div className="mb-4">
            <label htmlFor="userName" className="block text-sm font-medium mb-2 text-[#333]">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F00F8] text-[#333]"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`flex-1 py-2 px-4 rounded-md font-medium ${
                isFormValid()
                  ? 'bg-[#4F00F8] text-white hover:bg-[#3D00C4]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              예약하기
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
