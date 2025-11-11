'use client';

import { useState, useEffect } from 'react';
import RoomCard from './components/RoomCard';
import ReservationForm from './components/ReservationForm';
import ReservationList from './components/ReservationList';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { Room, Reservation, RoomDB, ReservationDB, dbToRoom, dbToReservation } from './types';
import { supabase } from '@/lib/supabase';

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'reservations'>('rooms');
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    reservationId: string | null;
  }>({
    isOpen: false,
    reservationId: null,
  });

  // Supabase에서 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 회의실 데이터 가져오기
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .order('name');

        if (roomsError) throw roomsError;

        // 예약 데이터 가져오기
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (reservationsError) throw reservationsError;

        // DB 타입을 클라이언트 타입으로 변환
        if (roomsData) {
          setRooms(roomsData.map((room: RoomDB) => dbToRoom(room)));
        }

        if (reservationsData) {
          setReservations(reservationsData.map((res: ReservationDB) => dbToReservation(res)));
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setToast({ message: '데이터를 불러오는데 실패했습니다.', type: 'error', isVisible: true });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleReserve = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
    }
  };

  const handleSubmitReservation = async (reservation: Omit<Reservation, 'id' | 'roomName'>) => {
    const room = rooms.find((r) => r.id === reservation.roomId);
    if (!room) return;

    try {
      // Supabase에 예약 추가
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            room_id: reservation.roomId,
            room_name: room.name,
            user_name: reservation.userName,
            user_email: reservation.userEmail || null,
            date: reservation.date,
            start_time: reservation.startTime,
            end_time: reservation.endTime,
            purpose: reservation.purpose || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 로컬 상태 업데이트
      if (data) {
        const newReservation = dbToReservation(data as ReservationDB);
        const updatedReservations = [...reservations, newReservation];
        setReservations(updatedReservations);

        // 오늘 날짜의 예약이 있는지 확인
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayReservations = updatedReservations.filter(r => r.date === todayString);

        // 오늘 날짜의 예약이 없으면 목록 뷰로, 있으면 타임라인 뷰로
        setViewMode(todayReservations.length === 0 ? 'list' : 'timeline');
      }

      setSelectedRoom(null);
      setActiveTab('reservations');
      setToast({ message: '예약이 완료되었습니다.', type: 'success', isVisible: true });
    } catch (error) {
      console.error('예약 실패:', error);
      setToast({ message: '예약에 실패했습니다. 다시 시도해주세요.', type: 'error', isVisible: true });
    }
  };

  const handleCancelReservation = (id: string) => {
    setConfirmModal({
      isOpen: true,
      reservationId: id,
    });
  };

  const confirmCancelReservation = async () => {
    const id = confirmModal.reservationId;
    if (!id) return;

    try {
      // Supabase에서 예약 삭제
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 로컬 상태 업데이트
      setReservations(reservations.filter((r) => r.id !== id));
      setToast({ message: '예약이 취소되었습니다.', type: 'success', isVisible: true });

      // 회의실 목록 탭으로 이동
      setActiveTab('rooms');
    } catch (error) {
      console.error('예약 취소 실패:', error);
      setToast({ message: '예약 취소에 실패했습니다. 다시 시도해주세요.', type: 'error', isVisible: true });
    } finally {
      setConfirmModal({ isOpen: false, reservationId: null });
    }
  };

  // 현재 시간에 회의실이 사용 중인지 확인
  const isRoomInUse = (roomId: string): boolean => {
    const now = new Date();
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // 오늘 해당 회의실의 예약 찾기
    const todayReservations = reservations.filter(
      (r) => r.roomId === roomId && r.date === todayString
    );

    // 현재 시간이 예약 시간 범위 내에 있는지 확인
    return todayReservations.some((reservation) => {
      const [startHour, startMinute] = reservation.startTime.split(':').map(Number);
      const [endHour, endMinute] = reservation.endTime.split(':').map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F00F8]"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">제주밸류업 회의실 예약 시스템</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rooms'
                    ? 'border-[#4F00F8] text-[#4F00F8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                회의실 목록
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reservations'
                    ? 'border-[#4F00F8] text-[#4F00F8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                예약 내역 ({reservations.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onReserve={handleReserve}
                inUse={isRoomInUse(room.id)}
              />
            ))}
          </div>
        )}

        {activeTab === 'reservations' && (
          <ReservationList
            reservations={reservations}
            onCancel={handleCancelReservation}
            initialViewMode={viewMode}
          />
        )}

        {selectedRoom && (
          <ReservationForm
            room={selectedRoom}
            reservations={reservations}
            onSubmit={handleSubmitReservation}
            onCancel={() => setSelectedRoom(null)}
          />
        )}

        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title="예약 취소"
          message="예약을 취소하시겠습니까?"
          onConfirm={confirmCancelReservation}
          onCancel={() => setConfirmModal({ isOpen: false, reservationId: null })}
          confirmText="취소하기"
          cancelText="돌아가기"
        />
      </main>
    </div>
  );
};

export default Home;