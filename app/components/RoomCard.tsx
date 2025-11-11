import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onReserve: (roomId: string) => void;
  inUse: boolean;
}

export default function RoomCard({ room, onReserve, inUse }: RoomCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold mb-2 text-[#333]">{room.name}</h3>
      <p className="text-gray-600 mb-2">수용 인원: {room.capacity}명</p>
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${
          inUse
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {inUse ? '사용 중' : '예약 가능'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {room.amenities.map((amenity, index) => (
          <span key={index} className="bg-[#E6D9FF] text-[#4F00F8] px-2 py-1 rounded text-sm">
            {amenity}
          </span>
        ))}
      </div>
      <button
        onClick={() => onReserve(room.id)}
        className="w-full py-2 px-4 rounded font-medium bg-[#4F00F8] text-white hover:bg-[#3D00C4] rounded-[8px]"
      >
        예약하기
      </button>
    </div>
  );
}
