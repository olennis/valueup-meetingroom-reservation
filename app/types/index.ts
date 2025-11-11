// Database types (snake_case to match Supabase)
export interface RoomDB {
  id: string;
  name: string;
  capacity: number;
  available: boolean;
  amenities: string[];
  created_at?: string;
}

export interface ReservationDB {
  id: string;
  room_id: string;
  room_name: string;
  user_name: string;
  user_email: string | null;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  created_at?: string;
}

// Client types (camelCase for React components)
export interface Room {
  id: string;
  name: string;
  capacity: number;
  available: boolean;
  amenities: string[];
}

export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  userName: string;
  userEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

// Helper functions to convert between DB and client types
export function dbToRoom(db: RoomDB): Room {
  return {
    id: db.id,
    name: db.name,
    capacity: db.capacity,
    available: db.available,
    amenities: db.amenities,
  };
}

export function dbToReservation(db: ReservationDB): Reservation {
  return {
    id: db.id,
    roomId: db.room_id,
    roomName: db.room_name,
    userName: db.user_name,
    userEmail: db.user_email || '',
    date: db.date,
    startTime: db.start_time,
    endTime: db.end_time,
    purpose: db.purpose || '',
  };
}

export function reservationToDB(res: Omit<Reservation, 'id' | 'roomName'>): Omit<ReservationDB, 'id' | 'created_at'> {
  return {
    room_id: res.roomId,
    room_name: '', // Will be set from room lookup
    user_name: res.userName,
    user_email: res.userEmail || null,
    date: res.date,
    start_time: res.startTime,
    end_time: res.endTime,
    purpose: res.purpose || null,
  };
}
