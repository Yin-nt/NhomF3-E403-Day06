import { useState } from "react";
import { Search, MapPin, Calendar, Users, ChevronDown, Sparkles, TrendingUp } from "lucide-react";
import { AISuggestionsPanel } from "./AISuggestionsPanel";
import type { AISuggestion } from "../App";

interface HeroSectionProps {
  onStartPlanning: (destination: string, days: number) => void;
  aiSuggestions: AISuggestion[];
}

const POPULAR_DESTINATIONS = [
  { name: "Hà Nội", tag: "Lịch sử", img: "https://images.unsplash.com/photo-1543355890-20bc0a26fda1?w=400&q=80" },
  { name: "Đà Nẵng", tag: "Biển", img: "https://images.unsplash.com/photo-1732243395944-cb3ff9311091?w=400&q=80" },
  { name: "Hội An", tag: "Cổ đại", img: "https://images.unsplash.com/photo-1569271532956-3fb81a207115?w=400&q=80" },
  { name: "Hạ Long", tag: "Thiên nhiên", img: "https://images.unsplash.com/photo-1593994602837-530142086918?w=400&q=80" },
  { name: "Sa Pa", tag: "Núi rừng", img: "https://images.unsplash.com/photo-1780236250852-3971a716cdb7?w=400&q=80" },
  { name: "Phú Quốc", tag: "Đảo", img: "https://images.unsplash.com/photo-1603269231725-4ea1da7d02fd?w=400&q=80" },
];

const SUGGESTIONS = ["Hà Nội", "Đà Nẵng", "Hội An", "Hạ Long", "Sa Pa", "Phú Quốc", "Nha Trang", "Đà Lạt", "Huế", "Vũng Tàu"];

export function HeroSection({ onStartPlanning, aiSuggestions }: HeroSectionProps) {
  const [dismissedKey, setDismissedKey] = useState<string>("");
  const suggestionsKey = aiSuggestions.map((s) => s.name).join(",");
  const showAI = aiSuggestions.length > 0 && dismissedKey !== suggestionsKey;
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [travelers, setTravelers] = useState(2);

  const filtered = SUGGESTIONS.filter(
    (s) => destination.length > 0 && s.toLowerCase().includes(destination.toLowerCase())
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Banner */}
      <div className="relative h-[300px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1585970661791-9cec67470281?w=1400&q=80"
          alt="Vietnam landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
          <div className="flex items-center gap-2 bg-orange-500/90 backdrop-blur rounded-full px-4 py-1.5 mb-3 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Travel Planner
          </div>
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Khám phá Việt Nam</h1>
          <p className="text-base text-white/90 max-w-sm drop-shadow">
            Hỏi AI chatbot bên trái để lên kế hoạch du lịch thông minh!
          </p>
        </div>
      </div>

      {/* Search Card */}
      <div className="max-w-2xl mx-auto -mt-12 relative z-10 px-6">
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <h2 className="font-semibold text-gray-800 text-sm">Chọn điểm đến và thời gian</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Destination */}
            <div className="relative">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Điểm đến</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => { setDestination(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Nhập điểm đến..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {showSuggestions && filtered.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                    {filtered.map((s) => (
                      <button
                        key={s}
                        onMouseDown={() => { setDestination(s); setShowSuggestions(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-orange-400" />{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Days */}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Số ngày</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 appearance-none bg-white">
                  {[1,2,3,4,5,6,7,10,14].map((d) => <option key={d} value={d}>{d} ngày {d-1} đêm</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Travelers */}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Số người</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <select value={travelers} onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 appearance-none bg-white">
                  {[1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n} người</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartPlanning(destination || "Hà Nội", days)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200 text-sm"
          >
            <Search className="w-4 h-4" />
            Lên kế hoạch ngay
          </button>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAI && (
        <div className="max-w-5xl mx-auto pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <AISuggestionsPanel
            suggestions={aiSuggestions}
            onSelect={(name, days) => { onStartPlanning(name, days); setDismissedKey(suggestionsKey); }}
            onDismiss={() => setDismissedKey(suggestionsKey)}
          />
        </div>
      )}

      {/* Popular Destinations */}
      <div className={`max-w-5xl mx-auto px-6 ${showAI ? "pt-2 pb-10" : "py-10"}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-gray-800">Điểm đến nổi bật</h2>
            </div>
            <p className="text-xs text-gray-500">Click để lập lịch trình ngay, hoặc hỏi AI chatbot bên trái</p>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.name}
              onClick={() => onStartPlanning(dest.name, 3)}
              className="group relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer"
            >
              <img src={dest.img} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                <p className="font-bold text-xs">{dest.name}</p>
                <span className="text-xs bg-orange-500/80 px-1.5 py-0.5 rounded-full">{dest.tag}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🤖", title: "AI tư vấn thông minh", desc: "Hỏi chatbot bên trái, giao diện tự động cập nhật theo gợi ý" },
            { icon: "🗺️", title: "Lịch trình chi tiết", desc: "Từng ngày với địa điểm, thời gian, địa chỉ và chi phí" },
            { icon: "💰", title: "Quản lý ngân sách", desc: "Theo dõi tổng chi phí và so sánh với ngân sách dự kiến" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
