import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { supabaseServer } from "@/lib/supabase-server";
import { z } from "zod";

// ── 세션 관리 ────────────────────────────────────────────────────
interface Session {
  transport: WebStandardStreamableHTTPServerTransport;
  server: McpServer;
}

const sessions = new Map<string, Session>();

// ── MCP 서버 팩토리 ──────────────────────────────────────────────
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "reserve-office-room",
    version: "1.0.0",
  });

  // Tool 1: 회의실 목록 조회
  server.tool(
    "list_rooms",
    "사용 가능한 회의실 목록을 조회합니다. 회의실 이름, 수용 인원, 편의시설 정보를 포함합니다.",
    {},
    async () => {
      const { data, error } = await supabaseServer
        .from("rooms")
        .select("*")
        .eq("available", true)
        .order("name");

      if (error) {
        return { content: [{ type: "text" as const, text: `오류: ${error.message}` }] };
      }

      if (!data || data.length === 0) {
        return { content: [{ type: "text" as const, text: "사용 가능한 회의실이 없습니다." }] };
      }

      const roomList = data.map((room) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        amenities: room.amenities,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(roomList, null, 2) }],
      };
    }
  );

  // Tool 2: 예약 조회
  server.tool(
    "list_reservations",
    "특정 날짜 또는 회의실의 예약 목록을 조회합니다. 날짜(YYYY-MM-DD)나 회의실 ID로 필터링할 수 있습니다.",
    {
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("조회할 날짜 (YYYY-MM-DD 형식)")
        .optional(),
      room_id: z
        .string()
        .uuid()
        .describe("회의실 ID (UUID)")
        .optional(),
    },
    async ({ date, room_id }) => {
      let query = supabaseServer
        .from("reservations")
        .select("*")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (date) {
        query = query.eq("date", date);
      }

      if (room_id) {
        query = query.eq("room_id", room_id);
      }

      if (!date) {
        const today = new Date().toISOString().slice(0, 10);
        query = query.gte("date", today);
      }

      const { data, error } = await query;

      if (error) {
        return { content: [{ type: "text" as const, text: `오류: ${error.message}` }] };
      }

      if (!data || data.length === 0) {
        return { content: [{ type: "text" as const, text: "해당 조건의 예약이 없습니다." }] };
      }

      const reservations = data.map((r) => ({
        id: r.id,
        room_name: r.room_name,
        user_name: r.user_name,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        purpose: r.purpose,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(reservations, null, 2) }],
      };
    }
  );

  // Tool 3: 예약 생성
  server.tool(
    "create_reservation",
    "회의실을 예약합니다. 회의실 ID, 예약자 이름, 날짜, 시작/종료 시간이 필요합니다. 영업시간: 08:30~19:00, 30분 단위.",
    {
      room_id: z.string().uuid().describe("회의실 ID (list_rooms로 조회 가능)"),
      user_name: z.string().min(1).describe("예약자 이름"),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("예약 날짜 (YYYY-MM-DD)"),
      start_time: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .describe("시작 시간 (HH:MM, 예: 09:00)"),
      end_time: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .describe("종료 시간 (HH:MM, 예: 10:00)"),
      user_email: z.string().email().describe("예약자 이메일").optional(),
      purpose: z.string().describe("예약 목적").optional(),
    },
    async ({ room_id, user_name, date, start_time, end_time, user_email, purpose }) => {
      if (start_time >= end_time) {
        return {
          content: [{ type: "text" as const, text: "오류: 종료 시간은 시작 시간보다 뒤여야 합니다." }],
        };
      }

      if (start_time < "08:30" || end_time > "19:00") {
        return {
          content: [{ type: "text" as const, text: "오류: 영업시간은 08:30~19:00입니다." }],
        };
      }

      const { data: room, error: roomError } = await supabaseServer
        .from("rooms")
        .select("*")
        .eq("id", room_id)
        .single();

      if (roomError || !room) {
        return {
          content: [{ type: "text" as const, text: "오류: 존재하지 않는 회의실입니다." }],
        };
      }

      const { data: existing } = await supabaseServer
        .from("reservations")
        .select("*")
        .eq("room_id", room_id)
        .eq("date", date);

      if (existing && existing.length > 0) {
        const toHHMM = (t: string) => t.slice(0, 5);
        const hasOverlap = existing.some((res) => {
          return start_time < toHHMM(res.end_time) && end_time > toHHMM(res.start_time);
        });

        if (hasOverlap) {
          return {
            content: [{ type: "text" as const, text: "오류: 해당 시간대에 이미 예약이 존재합니다." }],
          };
        }
      }

      const { data, error } = await supabaseServer
        .from("reservations")
        .insert([
          {
            room_id,
            room_name: room.name,
            user_name,
            user_email: user_email || null,
            date,
            start_time,
            end_time,
            purpose: purpose || null,
          },
        ])
        .select()
        .single();

      if (error) {
        return { content: [{ type: "text" as const, text: `오류: ${error.message}` }] };
      }

      return {
        content: [
          {
            type: "text" as const,
            text:
              `예약이 완료되었습니다!\n\n` +
              `- 회의실: ${room.name}\n` +
              `- 예약자: ${user_name}\n` +
              `- 날짜: ${date}\n` +
              `- 시간: ${start_time} ~ ${end_time}\n` +
              (purpose ? `- 목적: ${purpose}\n` : "") +
              `- 예약 ID: ${data.id}`,
          },
        ],
      };
    }
  );

  // Tool 4: 예약 취소
  server.tool(
    "cancel_reservation",
    "예약을 취소합니다. 예약 ID가 필요합니다. list_reservations로 예약 ID를 확인할 수 있습니다.",
    {
      reservation_id: z.string().uuid().describe("취소할 예약 ID"),
    },
    async ({ reservation_id }) => {
      const { data: reservation, error: findError } = await supabaseServer
        .from("reservations")
        .select("*")
        .eq("id", reservation_id)
        .single();

      if (findError || !reservation) {
        return {
          content: [{ type: "text" as const, text: "오류: 해당 예약을 찾을 수 없습니다." }],
        };
      }

      const { error } = await supabaseServer
        .from("reservations")
        .delete()
        .eq("id", reservation_id);

      if (error) {
        return { content: [{ type: "text" as const, text: `오류: ${error.message}` }] };
      }

      return {
        content: [
          {
            type: "text" as const,
            text:
              `예약이 취소되었습니다.\n\n` +
              `- 회의실: ${reservation.room_name}\n` +
              `- 예약자: ${reservation.user_name}\n` +
              `- 날짜: ${reservation.date}\n` +
              `- 시간: ${reservation.start_time} ~ ${reservation.end_time}`,
          },
        ],
      };
    }
  );

  return server;
}

// ── 세션 조회/생성 헬퍼 ──────────────────────────────────────────
function getOrCreateSession(sessionId: string | null): Session {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, { transport, server });
    },
    onsessionclosed: (id) => {
      sessions.delete(id);
    },
    enableJsonResponse: true,
  });

  const server = createMcpServer();
  server.connect(transport);

  return { transport, server };
}

// ── Route Handlers ───────────────────────────────────────────────
export async function POST(request: Request) {
  const sessionId = request.headers.get("mcp-session-id");
  const { transport } = getOrCreateSession(sessionId);
  return transport.handleRequest(request);
}

export async function GET(request: Request) {
  const sessionId = request.headers.get("mcp-session-id");
  if (!sessionId || !sessions.has(sessionId)) {
    return new Response("Session not found", { status: 404 });
  }
  const { transport } = sessions.get(sessionId)!;
  return transport.handleRequest(request);
}

export async function DELETE(request: Request) {
  const sessionId = request.headers.get("mcp-session-id");
  if (!sessionId || !sessions.has(sessionId)) {
    return new Response("Session not found", { status: 404 });
  }
  const { transport } = sessions.get(sessionId)!;
  return transport.handleRequest(request);
}
