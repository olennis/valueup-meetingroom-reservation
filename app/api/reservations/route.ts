import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { ReservationDB } from '@/app/types';

// 예약 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const roomId = searchParams.get('room_id');

  let query = supabaseServer
    .from('reservations')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (date) {
    query = query.eq('date', date);
  }

  if (roomId) {
    query = query.eq('room_id', roomId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reservations: data });
}

// 예약 생성
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { room_id, user_name, date, start_time, end_time, user_email, purpose } = body;

  // 필수 필드 검증
  if (!room_id || !user_name || !date || !start_time || !end_time) {
    return NextResponse.json(
      { error: '필수 필드가 누락되었습니다. (room_id, user_name, date, start_time, end_time)' },
      { status: 400 }
    );
  }

  // 날짜 형식 검증 (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' }, { status: 400 });
  }

  // 시간 형식 검증 (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
    return NextResponse.json({ error: '시간 형식이 올바르지 않습니다. (HH:MM)' }, { status: 400 });
  }

  // 종료 시간이 시작 시간보다 뒤인지 검증
  if (start_time >= end_time) {
    return NextResponse.json({ error: '종료 시간은 시작 시간보다 뒤여야 합니다.' }, { status: 400 });
  }

  // 회의실 존재 여부 확인
  const { data: room, error: roomError } = await supabaseServer
    .from('rooms')
    .select('*')
    .eq('id', room_id)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: '존재하지 않는 회의실입니다.' }, { status: 404 });
  }

  // 시간 겹침 확인
  const { data: existing } = await supabaseServer
    .from('reservations')
    .select('*')
    .eq('room_id', room_id)
    .eq('date', date);

  if (existing && existing.length > 0) {
    const hasOverlap = existing.some((res: ReservationDB) => {
      return start_time < res.end_time && end_time > res.start_time;
    });

    if (hasOverlap) {
      return NextResponse.json({ error: '해당 시간대에 이미 예약이 존재합니다.' }, { status: 409 });
    }
  }

  // 예약 생성
  const { data, error } = await supabaseServer
    .from('reservations')
    .insert([{
      room_id,
      room_name: room.name,
      user_name,
      user_email: user_email || null,
      date,
      start_time,
      end_time,
      purpose: purpose || null,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reservation: data }, { status: 201 });
}
