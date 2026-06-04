import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, Sparkles, MapPin, DollarSign,
  Clock, ChevronRight, Plus, Calendar, RotateCcw,
} from "lucide-react";
import type { TripState, ChatAction, Activity } from "../App";
import { runTravelAgent, type TravelAgentResponse } from "../agent/travelAgent";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface ActionButton {
  label: string;
  variant: "primary" | "secondary" | "add";
  chatAction: ChatAction;
  autoTriggerAfterMs?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ActionButton[];
}

interface BackendAgentResponse {
  content: string;
  actions?: ActionButton[];
  sideEffects?: ChatAction[];
}

/* ─── Quick prompts ──────────────────────────────────────────────────────────── */

const QUICK_PROMPTS = [
  { icon: MapPin, label: "Gợi ý điểm đến", query: "Gợi ý cho tôi các điểm đến đẹp ở Việt Nam" },
  { icon: Calendar, label: "Lịch trình mẫu", query: "Lập lịch trình Đà Nẵng 3 ngày cho tôi" },
  { icon: DollarSign, label: "Ước tính chi phí", query: "Chi phí đi Phú Quốc 4 ngày bao nhiêu?" },
  { icon: Clock, label: "Thời điểm đẹp nhất", query: "Thời điểm nào đẹp nhất để đi Hội An?" },
];

/* ─── Static bot responses ───────────────────────────────────────────────────── */

function makeAct(name: string, address: string, cost: number, type: string, s: string, e: string): ChatAction {
  const a: Activity = { id: Date.now() + Math.random() + "", name, address, cost, type, startTime: s, endTime: e, note: "" };
  return { type: "add_activity", payload: a };
}
function plan(dest: string, days: number): ChatAction {
  return { type: "start_planning", payload: { destination: dest, days } };
}

interface StaticResponse { content: string; actions?: ActionButton[]; sideEffect?: ChatAction }

const DEST_SUGGESTIONS: Record<string, import("../App").AISuggestion> = {
  "Hà Nội": {
    name: "Hà Nội", tag: "Lịch sử", days: 3, cost: "3–7 triệu",
    img: "https://images.unsplash.com/photo-1543355890-20bc0a26fda1?w=400&q=80",
    reason: "Thủ đô ngàn năm văn hiến, phố cổ, ẩm thực đường phố phong phú",
  },
  "Đà Nẵng": {
    name: "Đà Nẵng", tag: "Biển", days: 3, cost: "4–10 triệu",
    img: "https://images.unsplash.com/photo-1732243395944-cb3ff9311091?w=400&q=80",
    reason: "Bãi biển đẹp nhất miền Trung, Bà Nà Hills Cầu Vàng nổi tiếng thế giới",
  },
  "Hội An": {
    name: "Hội An", tag: "Cổ đại", days: 2, cost: "2–5 triệu",
    img: "https://images.unsplash.com/photo-1569271532956-3fb81a207115?w=400&q=80",
    reason: "Phố cổ UNESCO huyền ảo, đèn lồng rực rỡ, ẩm thực đặc sắc",
  },
  "Hạ Long": {
    name: "Hạ Long", tag: "Thiên nhiên", days: 3, cost: "5–12 triệu",
    img: "https://images.unsplash.com/photo-1593994602837-530142086918?w=400&q=80",
    reason: "Kỳ quan thiên nhiên thế giới, du thuyền hang động, chèo kayak",
  },
  "Sa Pa": {
    name: "Sa Pa", tag: "Núi rừng", days: 3, cost: "3.5–8 triệu",
    img: "https://images.unsplash.com/photo-1780236250852-3971a716cdb7?w=400&q=80",
    reason: "Ruộng bậc thang mùa lúa chín, Fansipan nóc nhà Đông Dương",
  },
  "Phú Quốc": {
    name: "Phú Quốc", tag: "Đảo", days: 4, cost: "5–18 triệu",
    img: "https://images.unsplash.com/photo-1603269231725-4ea1da7d02fd?w=400&q=80",
    reason: "Đảo Ngọc biển trong xanh, lặn san hô, cáp treo dài nhất thế giới",
  },
};

function suggestAction(names: string[]): ChatAction {
  return {
    type: "suggest_destinations",
    payload: names.map((n) => DEST_SUGGESTIONS[n]).filter(Boolean),
  };
}

function getStaticResponse(msg: string, trip: TripState): StaticResponse {
  const q = msg.toLowerCase();

  if (q.match(/^(xin chào|hello|hi|chào|hey)/)) {
    return {
      content: "Xin chào! 👋 Tôi là trợ lý du lịch AI.\n\nHỏi tôi về **điểm đến**, **lịch trình**, **chi phí** — giao diện bên phải sẽ tự cập nhật!",
      actions: [
        { label: "🗺️ Gợi ý điểm đến", variant: "secondary", chatAction: { type: "highlight_spot", payload: "" } }
      ],
    };
  }
  if (q.includes("gợi ý") && (q.includes("điểm đến") || q.includes("đi đâu") || q.includes("du lịch"))) {
    return {
      content: "🌟 **Top điểm đến Việt Nam 2025** — Gợi ý đã xuất hiện bên phải! Nhấn để lập lịch:",
      sideEffect: suggestAction(["Hà Nội", "Đà Nẵng", "Hội An", "Hạ Long", "Sa Pa", "Phú Quốc"]),
      actions: [
        { label: "🏛️ Hà Nội – 3 ngày", variant: "primary", chatAction: plan("Hà Nội", 3) },
        { label: "🏖️ Đà Nẵng – 3 ngày", variant: "primary", chatAction: plan("Đà Nẵng", 3) },
        { label: "🏮 Hội An – 2 ngày", variant: "primary", chatAction: plan("Hội An", 2) },
        { label: "⛵ Hạ Long – 3 ngày", variant: "primary", chatAction: plan("Hạ Long", 3) },
        { label: "🌿 Sa Pa – 3 ngày", variant: "primary", chatAction: plan("Sa Pa", 3) },
        { label: "🏝️ Phú Quốc – 4 ngày", variant: "primary", chatAction: plan("Phú Quốc", 4) },
      ],
    };
  }
  if (q.includes("đà nẵng")) {
    const days = q.includes("5") ? 5 : q.includes("4") ? 4 : q.includes("2") ? 2 : 3;
    return {
      content: `🏖️ **Đà Nẵng ${days} ngày** – Thành phố đáng sống!\n\n• Bãi biển Mỹ Khê\n• Bà Nà Hills + Cầu Vàng (850.000đ)\n• Ngũ Hành Sơn, Cầu Rồng\n• Gần Hội An 30km\n\n**Chi phí:** ~4–10 triệu/người`,
      actions: [
        { label: "📅 Lập lịch Đà Nẵng", variant: "primary", chatAction: plan("Đà Nẵng", days) },
        { label: "➕ Thêm Bà Nà Hills", variant: "add", chatAction: makeAct("Bà Nà Hills – Cầu Vàng", "Hòa Vang, Đà Nẵng", 850000, "sightseeing", "09:00", "17:00") },
      ],
    };
  }
  if (q.includes("hà nội")) {
    const days = q.includes("5") ? 5 : q.includes("4") ? 4 : q.includes("2") ? 2 : 3;
    return {
      content: `🏛️ **Hà Nội ${days} ngày** – Ngàn năm văn hiến!\n\n• Hồ Hoàn Kiếm (miễn phí)\n• Văn Miếu (30.000đ)\n• Phố cổ, Lăng Bác\n\n**Chi phí:** ~3–7 triệu/người`,
      actions: [
        { label: "📅 Lập lịch Hà Nội", variant: "primary", chatAction: plan("Hà Nội", days) },
        { label: "➕ Thêm Hồ Hoàn Kiếm", variant: "add", chatAction: makeAct("Hồ Hoàn Kiếm & Tháp Rùa", "Hoàn Kiếm, Hà Nội", 0, "sightseeing", "08:00", "10:00") },
      ],
    };
  }
  if (q.includes("hội an")) {
    return {
      content: "🏮 **Hội An** – Phố cổ huyền ảo!\n\n• Phố cổ UNESCO (120.000đ)\n• Cù Lao Chàm lặn biển\n• Rừng dừa Bảy Mẫu\n\n**Thời điểm:** Tháng 2–4",
      actions: [
        { label: "📅 Lập lịch Hội An", variant: "primary", chatAction: plan("Hội An", 2) },
        { label: "➕ Thêm Phố cổ", variant: "add", chatAction: makeAct("Phố cổ Hội An", "Minh An, Hội An", 120000, "sightseeing", "08:00", "12:00") },
      ],
    };
  }
  if (q.includes("chi phí") || q.includes("bao nhiêu") || q.includes("ngân sách")) {
    return {
      content: "💰 **Ước tính chi phí:**\n\n🎒 Budget: ~500–800k/ngày\n✈️ Trung bình: ~900k–1.5 triệu/ngày\n👑 Luxury: ~3–15 triệu/ngày",
      actions: [
        { label: "📅 Lập lịch Đà Nẵng tiết kiệm", variant: "primary", chatAction: plan("Đà Nẵng", 3) },
      ],
    };
  }
  if (q.includes("thời điểm") || q.includes("tháng mấy") || q.includes("mùa")) {
    return {
      content: "🗓️ **Thời điểm lý tưởng:**\n\n🏛️ Hà Nội: Tháng 9–11 & 3–5\n🏖️ Đà Nẵng: Tháng 2–8\n🌿 Sa Pa: Tháng 9–11\n🏝️ Phú Quốc: Tháng 11–4",
      actions: [
        { label: "📅 Lập lịch ngay", variant: "primary", chatAction: plan("Đà Nẵng", 3) },
      ],
    };
  }

  if (trip.view === "itinerary" && trip.destination) {
    return {
      content: `🗺️ Bạn đang lên kế hoạch **${trip.destination} ${trip.days} ngày**.\n\nTôi có thể thêm địa điểm, gợi ý ăn uống, hoặc ước tính chi phí. Bạn muốn gì?`,
      actions: [
        { label: "➕ Thêm địa điểm nổi bật", variant: "add", chatAction: makeAct(`Địa điểm nổi bật ${trip.destination}`, trip.destination, 0, "sightseeing", "09:00", "12:00") },
        { label: "💰 Xem ước tính chi phí", variant: "secondary", chatAction: { type: "highlight_spot", payload: "" } },
      ],
    };
  }

  return {
    content: "Hỏi tôi về điểm đến, lịch trình hoặc chi phí nhé!\n\nVí dụ: \"Lập lịch Đà Nẵng 3 ngày\" hoặc \"Chi phí đi Phú Quốc?\"",
    actions: [
      { label: "🗺️ Gợi ý điểm đến", variant: "secondary", chatAction: { type: "highlight_spot", payload: "" } },
      { label: "📅 Lập lịch nhanh", variant: "primary", chatAction: plan("Đà Nẵng", 3) },
    ],
  };
}

/* ─── Render helpers ─────────────────────────────────────────────────────────── */

function RenderContent({ text }: { text: string }) {
  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        if (line === "") return <div key={i} className="h-1" />;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-bold text-gray-800 text-sm">{line.slice(2, -2)}</p>;
        if (line.includes("**")) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-gray-700 text-sm">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-800">{p}</strong> : p)}
            </p>
          );
        }
        if (line.startsWith("• ")) return <p key={i} className="text-gray-600 text-sm pl-2">{line}</p>;
        return <p key={i} className="text-gray-700 text-sm">{line}</p>;
      })}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

interface ChatbotPanelProps {
  trip: TripState;
  onAction: (action: ChatAction) => void;
}

const INITIAL_MSG: Message = {
  id: "init",
  role: "assistant",
  content: "Xin chào! 👋 Tôi là trợ lý du lịch AI.\n\nHỏi tôi về **điểm đến**, **lịch trình**, **chi phí** — hoặc yêu cầu chỉnh sửa lịch trình hiện tại!",
  actions: [
    { label: "🗺️ Gợi ý điểm đến hot", variant: "secondary", chatAction: { type: "highlight_spot", payload: "" } },
  ],
};

export function ChatbotPanel({ trip, onAction }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingLabel, setTypingLabel] = useState("AI đang soạn...");
  const [triggeredActions, setTriggeredActions] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ── Manual send ── */
  const applyAgentResponse = (resp: BackendAgentResponse | TravelAgentResponse | { content: string; actions?: ActionButton[]; sideEffect?: ChatAction; sideEffects?: ChatAction[] }) => {
    const sideEffects = "sideEffects" in resp && Array.isArray(resp.sideEffects)
      ? resp.sideEffects
      : "sideEffect" in resp && resp.sideEffect
        ? [resp.sideEffect]
        : [];
    sideEffects.forEach((effect) => onAction(effect));

    const actions: ActionButton[] = (resp.actions || []).map((a) => ({
      label: a.label,
      variant: a.variant,
      chatAction: a.chatAction,
    }));

    setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: resp.content, actions }]);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: text }]);
    setIsTyping(true);
    setTypingLabel("AI đang tra cứu thời tiết, điểm đến và lộ trình...");

    void (async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
        const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, trip }),
        });

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const resp = (await response.json()) as BackendAgentResponse;
        if (requestId !== requestIdRef.current) return;
        setIsTyping(false);
        applyAgentResponse(resp);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setIsTyping(false);
        try {
          const fallback = await runTravelAgent(text, trip);
          applyAgentResponse(fallback);
        } catch {
          const staticFallback = getStaticResponse(text, trip);
          applyAgentResponse(staticFallback);
        }
      }
    })();
  };

  /* ── Manual action button click ── */
  const handleActionClick = (btn: ActionButton, msgId: string, btnIdx: number) => {
    const key = `${msgId}-${btnIdx}`;
    onAction(btn.chatAction);
    setTriggeredActions((prev) => new Set([...prev, key]));

    let confirm = "";
    if (btn.chatAction.type === "add_activity") {
      const a = btn.chatAction.payload as Activity;
      confirm = `✅ Đã thêm **${a.name}** vào lịch trình!`;
    } else if (btn.chatAction.type === "start_planning") {
      const { destination, days } = btn.chatAction.payload as { destination: string; days: number };
      confirm = `🗺️ Đã tạo lịch trình **${destination} ${days} ngày** bên phải!`;
    }
    if (confirm) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: confirm }]);
    }
  };

  const clearChat = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    requestIdRef.current += 1;
    setMessages([INITIAL_MSG]);
    setIsTyping(false);
    setTriggeredActions(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">VietTravel AI</p>
            <p className="text-orange-100 text-xs">Trợ lý du lịch thông minh</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {trip.view === "itinerary" && (
            <div className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" />{trip.destination}
            </div>
          )}
          <button onClick={clearChat} className="p-1.5 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors" title="Làm mới">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-3 py-2 border-b border-gray-100 bg-orange-50 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto">
          {QUICK_PROMPTS.map((qp) => (
            <button key={qp.label} onClick={() => sendMessage(qp.query)}
              className="flex items-center gap-1 text-xs text-orange-600 bg-white border border-orange-200 rounded-full px-2.5 py-1 whitespace-nowrap hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors flex-shrink-0 shadow-sm">
              <qp.icon className="w-3 h-3" />{qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "user" ? "bg-orange-500" : "bg-gradient-to-br from-orange-400 to-orange-600"}`}>
              {msg.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`rounded-2xl px-3 py-2.5 ${msg.role === "user" ? "bg-orange-500 text-white text-sm rounded-tr-sm" : "bg-white border border-gray-100 shadow-sm rounded-tl-sm"}`}>
                {msg.role === "assistant" ? <RenderContent text={msg.content} /> : <span className="text-sm">{msg.content}</span>}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-col gap-1.5 w-full">
                  {msg.actions.map((btn, bi) => {
                    const key = `${msg.id}-${bi}`;
                    const triggered = triggeredActions.has(key);
                    return (
                      <button
                        key={bi}
                        onClick={() => !triggered && handleActionClick(btn, msg.id, bi)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all text-left font-medium relative overflow-hidden ${
                          triggered
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                            : btn.variant === "primary"
                            ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-sm"
                            : btn.variant === "add"
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-500 hover:text-white hover:border-green-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                        }`}
                      >
                        {triggered && <span className="absolute inset-0 bg-gray-50/60" />}
                        {btn.variant === "add" && !triggered && <Plus className="w-3 h-3 flex-shrink-0" />}
                        {btn.variant === "primary" && !triggered && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                        {triggered && <span className="text-gray-400 mr-1">✓</span>}
                        <span className="relative">{triggered ? btn.label.replace(/^[🗺️📅➕🔄💰]/, "").trim() + " (đã thực hiện)" : btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-xs text-gray-400">{typingLabel}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 flex-shrink-0 bg-white">
        <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-orange-400 focus-within:bg-white transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Hỏi về điểm đến, lịch trình..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()}
            className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white hover:bg-orange-600 disabled:opacity-40 transition-colors flex-shrink-0">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">Chatbot cập nhật lịch trình trực tiếp →</p>
      </div>
    </div>
  );
}
