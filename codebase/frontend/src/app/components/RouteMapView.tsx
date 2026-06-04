import { useEffect, useState } from "react";
import { X, MapPin, Clock, Navigation, ChevronDown, ExternalLink, Route } from "lucide-react";
import type { Activity } from "../App";
import { estimateTravelSegment } from "../agent/travelAgent";

interface RouteMapViewProps {
  dayLabel: string;
  destination: string;
  activities: Activity[];
  onClose: () => void;
}

// Approximate coordinates for popular Vietnamese attractions
const ACTIVITY_COORDS: Record<string, [number, number]> = {
  // Hà Nội
  "Hồ Hoàn Kiếm": [21.0285, 105.8522],
  "Hồ Hoàn Kiếm & Tháp Rùa": [21.0285, 105.8522],
  "Hồ Hoàn Kiếm & đi bộ quanh hồ": [21.0285, 105.8522],
  "Văn Miếu - Quốc Tử Giám": [21.0228, 105.8356],
  "Phố cổ 36 phố phường": [21.0341, 105.8492],
  "Phố cổ Hà Nội": [21.0341, 105.8492],
  "Lăng Chủ tịch Hồ Chí Minh": [21.0366, 105.8343],
  "Bún chả Hương Liên": [21.0220, 105.8427],
  "Chùa Trấn Quốc": [21.0453, 105.8373],
  "Hồ Tây – Đạp xe": [21.0538, 105.8232],
  "Cà phê trứng Giảng": [21.0337, 105.8523],
  "Bánh mì 25": [21.0295, 105.8527],
  "Phố đi bộ Hồ Gươm": [21.0278, 105.8527],
  // Đà Nẵng
  "Bãi biển Mỹ Khê": [16.0573, 108.2475],
  "Cầu Rồng": [16.0607, 108.2275],
  "Cầu Rồng phun lửa": [16.0607, 108.2275],
  "Ngũ Hành Sơn": [15.9977, 108.2614],
  "Bà Nà Hills – Cầu Vàng": [15.9994, 107.9879],
  "Bà Nà Hills": [15.9994, 107.9879],
  "Mì Quảng Bà Mua": [16.0524, 108.2197],
  "Bánh mì Bà Lan": [16.0678, 108.2213],
  "Chùa Linh Ứng Sơn Trà": [16.1061, 108.2778],
  "Bảo tàng Chăm": [16.0677, 108.2239],
  // Hội An
  "Phố cổ Hội An": [15.8801, 108.3380],
  "Phố cổ Hội An & Đèn lồng": [15.8801, 108.3380],
  "Cù Lao Chàm – Lặn biển": [15.9643, 108.5312],
  "Cù Lao Chàm – Lặn ngắm san hô": [15.9643, 108.5312],
  "Rừng dừa Bảy Mẫu – Chèo thuyền": [15.8587, 108.3751],
  "Rừng dừa Bảy Mẫu – Chèo thúng": [15.8587, 108.3751],
  "Cao lầu Bà Bé": [15.8797, 108.3363],
  "Ăn Cao lầu & Bánh mì Phượng": [15.8797, 108.3363],
  // Hạ Long
  "Hang Sửng Sốt": [20.9183, 107.1052],
  "Đảo Ti Tốp – Tắm biển": [20.8951, 107.0786],
  "Đảo Ti Tốp": [20.8951, 107.0786],
  // Sa Pa
  "Đỉnh Fansipan – Cáp treo": [22.3036, 103.7761],
  "Bản Cát Cát": [22.3220, 103.8358],
  // Phú Quốc
  "VinWonders Phú Quốc": [10.3467, 103.8446],
  "Cáp treo Hòn Thơm": [10.0369, 104.0208],
};

const CITY_CENTER: Record<string, [number, number]> = {
  "Hà Nội": [21.0285, 105.8542],
  "Đà Nẵng": [16.0479, 108.2208],
  "Đà Nẵng + Hội An": [16.0200, 108.2800],
  "Hội An": [15.8801, 108.3380],
  "Hạ Long": [20.9515, 107.0887],
  "Sa Pa": [22.3364, 103.8438],
  "Phú Quốc": [10.2899, 103.9840],
};

const CITY_ZOOM: Record<string, number> = {
  "Hà Nội": 14,
  "Đà Nẵng": 13,
  "Đà Nẵng + Hội An": 12,
  "Hội An": 14,
  "Hạ Long": 12,
  "Sa Pa": 13,
  "Phú Quốc": 12,
};

// Estimate walk/drive time between two stops (mock)
function getMockDistance(idx: number): { km: string; time: string; mode: string } {
  const options = [
    { km: "1.2", time: "5 phút", mode: "🚶" },
    { km: "2.8", time: "8 phút", mode: "🛵" },
    { km: "4.5", time: "12 phút", mode: "🚗" },
    { km: "1.8", time: "6 phút", mode: "🚶" },
    { km: "8.3", time: "20 phút", mode: "🚗" },
    { km: "3.1", time: "10 phút", mode: "🛵" },
  ];
  return options[idx % options.length];
}

function getStableOffset(name: string): [number, number] {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((hash % 17) - 8) / 1000;
  const lngOffset = (((hash >> 3) % 17) - 8) / 1000;
  return [latOffset, lngOffset];
}

function getActivityCoords(name: string, destination: string): [number, number] {
  const clean = name.trim();
  for (const [key, coords] of Object.entries(ACTIVITY_COORDS)) {
    if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
      return coords;
    }
  }
  // Fallback: city center with a stable per-name offset
  const center = CITY_CENTER[destination] || [16.0, 108.0];
  const [latOffset, lngOffset] = getStableOffset(clean);
  return [center[0] + latOffset, center[1] + lngOffset];
}

function buildOsmUrl(destination: string, activities: Activity[]): string {
  const center = CITY_CENTER[destination] || [16.0, 108.0];
  const zoom = CITY_ZOOM[destination] || 13;
  const lat = center[0];
  const lng = center[1];

  // Build bbox from center + zoom approximation
  const delta = zoom >= 14 ? 0.02 : zoom >= 13 ? 0.04 : 0.08;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
}

// Normalize coords to 0-100% within the map viewport
function normalizeCoords(
  point: [number, number],
  center: [number, number],
  delta: number
): { x: number; y: number } {
  const x = ((point[1] - (center[1] - delta)) / (2 * delta)) * 100;
  const y = ((center[0] + delta - point[0]) / (2 * delta)) * 100; // flip lat
  return {
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
  };
}

const STOP_COLORS = [
  "bg-orange-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-teal-500",
];

const STOP_BORDER = [
  "border-orange-500 text-orange-600",
  "border-blue-500 text-blue-600",
  "border-green-500 text-green-600",
  "border-purple-500 text-purple-600",
  "border-rose-500 text-rose-600",
  "border-amber-500 text-amber-600",
  "border-teal-500 text-teal-600",
];

export function RouteMapView({ dayLabel, destination, activities, onClose }: RouteMapViewProps) {
  const sightActivities = activities.filter((a) => a.type !== "food" && a.type !== "hotel");
  const allStops = activities; // show all
  const [segmentEstimates, setSegmentEstimates] = useState<Array<{ km: number; minutes: number; mode: string; source: "api" | "estimate" }>>([]);

  const center = CITY_CENTER[destination] || [16.0, 108.0];
  const zoom = CITY_ZOOM[destination] || 13;
  const delta = zoom >= 14 ? 0.02 : zoom >= 13 ? 0.04 : 0.08;

  const stopCoords = allStops.map((a) => getActivityCoords(a.name, destination));
  const normalizedCoords = stopCoords.map((c) => normalizeCoords(c, center, delta));

  useEffect(() => {
    let cancelled = false;

    async function loadSegments() {
      if (allStops.length < 2) {
        setSegmentEstimates([]);
        return;
      }

      const next: Array<{ km: number; minutes: number; mode: string; source: "api" | "estimate" }> = [];
      for (let i = 0; i < allStops.length - 1; i += 1) {
        const estimate = await estimateTravelSegment(
          { name: allStops[i].name, coords: stopCoords[i] },
          { name: allStops[i + 1].name, coords: stopCoords[i + 1] }
        );
        if (cancelled) return;
        next.push(estimate);
        setSegmentEstimates([...next]);
      }
    }

    void loadSegments();
    return () => {
      cancelled = true;
    };
  }, [destination, activities]);

  const osmUrl = buildOsmUrl(destination, allStops);

  const openInOSM = () => {
    const [lat, lng] = center;
    window.open(`https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`, "_blank");
  };

  const totalCost = allStops.reduce((s, a) => s + a.cost, 0);
  const earliestTime = allStops.reduce((min, a) => a.startTime < min ? a.startTime : min, "23:59");
  const latestTime = allStops.reduce((max, a) => a.endTime > max ? a.endTime : max, "00:00");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-orange-500 to-orange-400 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Lộ trình {dayLabel}</p>
              <p className="text-orange-100 text-xs">{destination} • {allStops.length} điểm dừng</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openInOSM}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Mở OpenStreetMap
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 px-5 py-2.5 bg-orange-50 border-b border-orange-100 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span><strong>{allStops.length}</strong> địa điểm</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span>{earliestTime} – {latestTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Navigation className="w-3.5 h-3.5 text-orange-500" />
            <span>~{(allStops.length * 3.2).toFixed(1)} km tổng</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 ml-auto">
            <span className="font-medium text-orange-600">{totalCost.toLocaleString("vi-VN")}đ</span>
            <span>chi phí tham quan</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: Map */}
          <div className="flex-1 relative min-h-0 flex items-center justify-center bg-gray-100 overflow-hidden">
            <div className="relative aspect-square h-full max-w-full mx-auto shadow-inner bg-white">
              {/* OSM iframe */}
              <iframe
                src={osmUrl}
                className="w-full h-full border-0"
                title="OpenStreetMap"
                loading="lazy"
              />

              {/* Overlay: pins + route SVG */}
              <div className="absolute inset-0 pointer-events-none">
              {/* SVG route lines */}
              <svg className="absolute inset-0 w-full h-full">
                {normalizedCoords.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = normalizedCoords[i - 1];
                  return (
                    <g key={i}>
                      <line
                        x1={`${prev.x}%`} y1={`${prev.y}%`}
                        x2={`${pt.x}%`} y2={`${pt.y}%`}
                        stroke="white" strokeWidth="4" strokeOpacity="0.6"
                        strokeDasharray="6 4"
                      />
                      <line
                        x1={`${prev.x}%`} y1={`${prev.y}%`}
                        x2={`${pt.x}%`} y2={`${pt.y}%`}
                        stroke="#f97316" strokeWidth="2.5"
                        strokeDasharray="6 4"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Pin markers */}
              {normalizedCoords.map((pos, i) => (
                <div
                  key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {/* Pin */}
                  <div className="flex flex-col items-center drop-shadow-lg">
                    <div className={`w-7 h-7 ${STOP_COLORS[i % STOP_COLORS.length]} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                      {i + 1}
                    </div>
                    <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent ${STOP_COLORS[i % STOP_COLORS.length].replace("bg-", "border-t-")}`} />
                  </div>
                  {/* Label bubble */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-white text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border border-gray-100 max-w-[120px] truncate">
                    {allStops[i]?.name}
                  </div>
                </div>
              ))}
            </div>

              {/* Map attribution overlay */}
              <div className="absolute bottom-1 left-1 bg-white/80 text-xs text-gray-500 px-1.5 py-0.5 rounded pointer-events-none">
                © OpenStreetMap
              </div>
            </div>
          </div>

          {/* Right: Stop list */}
          <div className="w-72 flex-shrink-0 border-l border-gray-100 overflow-y-auto bg-white">
            <div className="p-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-orange-500" />
                Các điểm dừng
              </h3>

              <div className="space-y-1">
                {allStops.map((stop, i) => (
                  <div key={stop.id}>
                    {/* Stop card */}
                    <div className="flex gap-3 p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors group">
                      {/* Number */}
                      <div className={`w-7 h-7 ${STOP_COLORS[i % STOP_COLORS.length]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight truncate">{stop.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="flex items-center gap-0.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {stop.startTime}–{stop.endTime}
                          </div>
                          {stop.cost > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              {stop.cost.toLocaleString("vi-VN")}đ
                            </span>
                          )}
                          {stop.cost === 0 && (
                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 rounded-full">Miễn phí</span>
                          )}
                        </div>
                        {stop.address && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{stop.address}</p>
                        )}
                      </div>
                    </div>

                    {/* Travel segment between stops */}
                    {i < allStops.length - 1 && (
                      <div className="flex items-center gap-2 my-1 px-3">
                        <div className="w-7 flex justify-center flex-shrink-0">
                          <div className="w-0.5 h-5 bg-dashed bg-gradient-to-b from-gray-300 to-gray-200" />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-xs text-gray-500">
                          {segmentEstimates[i] ? (
                            <>
                              <span>{segmentEstimates[i].mode}</span>
                              <span className="font-medium text-orange-500">{segmentEstimates[i].km.toFixed(1)} km</span>
                              <ChevronDown className="w-2.5 h-2.5 text-gray-300" />
                              <span>{segmentEstimates[i].minutes} phút</span>
                            </>
                          ) : (
                            <span>Đang tính...</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-xs font-semibold text-orange-700 mb-2">Tóm tắt lộ trình</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Số điểm dừng</span>
                    <span className="font-medium">{allStops.length} điểm</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Tổng quãng đường</span>
                    <span className="font-medium">~{(allStops.length * 3.2).toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Thời gian di chuyển</span>
                    <span className="font-medium">~{allStops.length * 12} phút</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 border-t border-orange-200 pt-1 mt-1">
                    <span className="font-semibold">Chi phí tham quan</span>
                    <span className="font-bold text-orange-600">{totalCost.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              {/* OSM link */}
              <button
                onClick={openInOSM}
                className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600 text-xs py-2.5 rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Xem chi tiết trên OpenStreetMap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
