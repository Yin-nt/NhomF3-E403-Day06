import { Sparkles, Star, Clock, DollarSign, MapPin, ChevronRight, X } from "lucide-react";
import type { AISuggestion } from "../App";

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  onSelect: (name: string, days: number) => void;
  onDismiss: () => void;
}

const TAG_COLORS: Record<string, string> = {
  "Lịch sử": "bg-amber-100 text-amber-700",
  "Biển": "bg-blue-100 text-blue-700",
  "Cổ đại": "bg-rose-100 text-rose-700",
  "Thiên nhiên": "bg-green-100 text-green-700",
  "Núi rừng": "bg-teal-100 text-teal-700",
  "Đảo": "bg-cyan-100 text-cyan-700",
  "Tiết kiệm": "bg-orange-100 text-orange-700",
  "Luxury": "bg-purple-100 text-purple-700",
};

export function AISuggestionsPanel({ suggestions, onSelect, onDismiss }: AISuggestionsPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-base leading-tight">Gợi ý từ AI</h2>
            <p className="text-xs text-gray-400">Dựa trên cuộc trò chuyện của bạn</p>
          </div>
          <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium border border-orange-200">
            {suggestions.length} điểm đến
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {suggestions.map((dest, i) => (
          <div
            key={dest.name}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all overflow-hidden cursor-pointer"
            onClick={() => onSelect(dest.name, dest.days)}
          >
            {/* Image */}
            <div className="relative h-36 overflow-hidden">
              <img
                src={dest.img}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* AI badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                AI #{i + 1}
              </div>

              {/* Tag */}
              <div className="absolute top-2 right-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[dest.tag] || "bg-gray-100 text-gray-700"}`}>
                  {dest.tag}
                </span>
              </div>

              {/* Name on image */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-bold text-sm drop-shadow">{dest.name}</h3>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              {/* AI reason */}
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 italic">
                "{dest.reason}"
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3 text-orange-400" />
                  {dest.days} ngày
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <DollarSign className="w-3 h-3 text-green-500" />
                  {dest.cost}
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs py-2 rounded-xl font-semibold transition-colors"
                onClick={(e) => { e.stopPropagation(); onSelect(dest.name, dest.days); }}
              >
                <MapPin className="w-3 h-3" />
                Lập lịch trình
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Divider with label */}
      <div className="flex items-center gap-3 mt-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
          Điểm đến phổ biến
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    </div>
  );
}
