import type { AISuggestion, Activity, ChatAction, TripState } from "../App";

export interface AgentActionButton {
  label: string;
  variant: "primary" | "secondary" | "add";
  chatAction: ChatAction;
}

export interface TravelAgentResponse {
  content: string;
  actions?: AgentActionButton[];
  sideEffects?: ChatAction[];
}

interface DestinationMeta {
  name: string;
  aliases: string[];
  tag: string;
  days: number;
  cost: string;
  description: string;
  center: [number, number];
  weatherHint: string;
}

interface WeatherSummary {
  tempC?: number;
  feelsLikeC?: number;
  humidity?: number;
  windMs?: number;
  description?: string;
  rainChance?: number;
}

interface SpotCandidate {
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  tags: Record<string, string>;
}

interface TravelEstimate {
  km: number;
  minutes: number;
  mode: string;
  source: "api" | "estimate";
}

const WEATHER_API_URL = import.meta.env.VITE_WEATHER_API_URL ?? "https://api.openweathermap.org/data/2.5/weather";
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY ?? "";
const TRAVEL_TIME_API_URL = import.meta.env.VITE_TRAVEL_TIME_API_URL ?? "";
const TRAVEL_TIME_API_KEY = import.meta.env.VITE_TRAVEL_TIME_API_KEY ?? "";
const TRAVEL_TIME_METHOD = String(import.meta.env.VITE_TRAVEL_TIME_API_METHOD ?? "GET").toUpperCase();
const OVERPASS_API_URL = import.meta.env.VITE_OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";

const DESTINATIONS: DestinationMeta[] = [
  {
    name: "Hà Nội",
    aliases: ["ha noi", "hanoi"],
    tag: "Lịch sử",
    days: 3,
    cost: "3–7 triệu",
    description: "Thủ đô ngàn năm văn hiến, hợp cho hành trình văn hoá và ẩm thực.",
    center: [21.0285, 105.8542],
    weatherHint: "Thời tiết đẹp nhất thường vào mùa thu và mùa xuân.",
  },
  {
    name: "Đà Nẵng",
    aliases: ["da nang", "danang"],
    tag: "Biển",
    days: 3,
    cost: "4–10 triệu",
    description: "Thành phố biển dễ đi, nhiều điểm tham quan cô đọng trong vài ngày.",
    center: [16.0479, 108.2208],
    weatherHint: "Mùa khô từ khoảng tháng 2 đến tháng 8 thường thuận lợi hơn.",
  },
  {
    name: "Hội An",
    aliases: ["hoi an", "hoian"],
    tag: "Cổ đại",
    days: 2,
    cost: "2–5 triệu",
    description: "Phố cổ, đèn lồng, ẩm thực đặc sắc và đi bộ rất hợp.",
    center: [15.8801, 108.338],
    weatherHint: "Buổi tối và mùa ít mưa là thời điểm lý tưởng nhất.",
  },
  {
    name: "Hạ Long",
    aliases: ["ha long", "halong"],
    tag: "Thiên nhiên",
    days: 3,
    cost: "5–12 triệu",
    description: "Kỳ quan vịnh, du thuyền và hoạt động ngoài trời.",
    center: [20.9515, 107.0887],
    weatherHint: "Ưu tiên ngày ít mưa để đi du thuyền và kayak.",
  },
  {
    name: "Sa Pa",
    aliases: ["sapa", "sa pa"],
    tag: "Núi rừng",
    days: 3,
    cost: "3.5–8 triệu",
    description: "Khí hậu mát, ruộng bậc thang và trekking.",
    center: [22.3364, 103.8438],
    weatherHint: "Mùa lúa chín và ngày trời quang là đẹp nhất.",
  },
  {
    name: "Phú Quốc",
    aliases: ["phu quoc", "phuquoc"],
    tag: "Đảo",
    days: 4,
    cost: "5–18 triệu",
    description: "Đảo nghỉ dưỡng, biển xanh, sunset và hoạt động đảo.",
    center: [10.2899, 103.984],
    weatherHint: "Mùa khô từ tháng 11 đến tháng 4 phù hợp nhất.",
  },
];

const STATIC_SPOTS: Record<string, string[]> = {
  "Hà Nội": ["Hồ Hoàn Kiếm", "Văn Miếu", "Phố cổ Hà Nội", "Lăng Bác", "Chùa Trấn Quốc"],
  "Đà Nẵng": ["Bãi biển Mỹ Khê", "Cầu Rồng", "Ngũ Hành Sơn", "Bà Nà Hills", "Chùa Linh Ứng Sơn Trà"],
  "Hội An": ["Phố cổ Hội An", "Cù Lao Chàm", "Rừng dừa Bảy Mẫu", "Làng rau Trà Quế"],
  "Hạ Long": ["Hang Sửng Sốt", "Đảo Ti Tốp", "Hang Đầu Gỗ", "Tuần Châu"],
  "Sa Pa": ["Đỉnh Fansipan", "Bản Cát Cát", "Thung lũng Mường Hoa", "Chợ phiên Sa Pa"],
  "Phú Quốc": ["Sunset Town", "VinWonders", "Cáp treo Hòn Thơm", "Làng chài Hàm Ninh"],
};

const DEFAULT_CONTENT =
  "Tôi có thể tra thời tiết, tìm điểm tham quan, và dựng lịch trình theo ngày. Hãy hỏi theo kiểu: \"Lập lịch Đà Nẵng 3 ngày\", \"Thời tiết Hội An thế nào?\" hoặc \"Mất bao lâu để đi từ A đến B?\"";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function destinationByQuery(query: string): DestinationMeta | undefined {
  const normalized = normalizeText(query);
  return DESTINATIONS.find((dest) => {
    const key = normalizeText(dest.name);
    return normalized.includes(key) || dest.aliases.some((alias) => normalized.includes(alias));
  });
}

function extractDays(query: string, fallback: number): number {
  const normalized = normalizeText(query);
  const match = normalized.match(/(\d+)\s*ngay/);
  if (!match) return fallback;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function extractBudgetHint(query: string): string | null {
  const normalized = normalizeText(query);
  if (normalized.includes("tiet kiem")) return "tiết kiệm";
  if (normalized.includes("luxury") || normalized.includes("cao cap")) return "cao cấp";
  if (normalized.includes("ngan sach")) return "ngân sách";
  return null;
}

function buildSuggestion(dest: DestinationMeta): AISuggestion {
  return {
    name: dest.name,
    tag: dest.tag,
    days: dest.days,
    cost: dest.cost,
    img:
      dest.name === "Hà Nội"
        ? "https://images.unsplash.com/photo-1543355890-20bc0a26fda1?w=400&q=80"
        : dest.name === "Đà Nẵng"
        ? "https://images.unsplash.com/photo-1732243395944-cb3ff9311091?w=400&q=80"
        : dest.name === "Hội An"
        ? "https://images.unsplash.com/photo-1569271532956-3fb81a207115?w=400&q=80"
        : dest.name === "Hạ Long"
        ? "https://images.unsplash.com/photo-1593994602837-530142086918?w=400&q=80"
        : dest.name === "Sa Pa"
        ? "https://images.unsplash.com/photo-1780236250852-3971a716cdb7?w=400&q=80"
        : "https://images.unsplash.com/photo-1603269231725-4ea1da7d02fd?w=400&q=80",
    reason: dest.description,
  };
}

function createAddActivityAction(
  destination: string,
  name: string,
  address: string,
  cost: number,
  type: Activity["type"],
  startTime: string,
  endTime: string,
  day?: number
): ChatAction {
  return {
    type: "add_activity",
    payload: {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      address,
      cost,
      type,
      startTime,
      endTime,
      note: `Gợi ý tự động từ agent cho ${destination}`,
      day,
    } as Activity,
  };
}

function toAddActivityAction(destination: string, spot: SpotCandidate, index: number, day?: number): ChatAction {
  const isFood = /food|restaurant|cafe|bakery|fast_food|restaurant/i.test(spot.type);
  const startHour = isFood ? 12 + index : 9 + index * 2;
  const endHour = isFood ? startHour + 1 : startHour + 2;
  const startTime = `${String(Math.min(startHour, 22)).padStart(2, "0")}:00`;
  const endTime = `${String(Math.min(endHour, 23)).padStart(2, "0")}:00`;
  return createAddActivityAction(
    destination,
    spot.name,
    spot.address || destination,
    0,
    isFood ? "food" : "sightseeing",
    startTime,
    endTime,
    day
  );
}

async function fetchJson<T>(url: string, options?: RequestInit, timeoutMs = 10000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildWeatherUrl(destination: DestinationMeta): string {
  const url = new URL(WEATHER_API_URL);
  url.searchParams.set("q", destination.name);
  url.searchParams.set("appid", WEATHER_API_KEY);
  url.searchParams.set("key", WEATHER_API_KEY);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "vi");
  url.searchParams.set("lat", String(destination.center[0]));
  url.searchParams.set("lon", String(destination.center[1]));
  return url.toString();
}

function parseWeatherPayload(payload: unknown): WeatherSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, any>;

  if (Array.isArray(data.weather) && data.main) {
    return {
      tempC: typeof data.main.temp === "number" ? data.main.temp : undefined,
      feelsLikeC: typeof data.main.feels_like === "number" ? data.main.feels_like : undefined,
      humidity: typeof data.main.humidity === "number" ? data.main.humidity : undefined,
      windMs: typeof data.wind?.speed === "number" ? data.wind.speed : undefined,
      description: typeof data.weather[0]?.description === "string" ? data.weather[0].description : undefined,
    };
  }

  if (data.current) {
    return {
      tempC: typeof data.current.temp === "number" ? data.current.temp : undefined,
      feelsLikeC: typeof data.current.feels_like === "number" ? data.current.feels_like : undefined,
      humidity: typeof data.current.humidity === "number" ? data.current.humidity : undefined,
      windMs: typeof data.current.wind_speed === "number" ? data.current.wind_speed : undefined,
      description:
        typeof data.current.weather?.[0]?.description === "string"
          ? data.current.weather[0].description
          : undefined,
      rainChance: typeof data.current.pop === "number" ? Math.round(data.current.pop * 100) : undefined,
    };
  }

  return null;
}

async function fetchWeather(destination: DestinationMeta): Promise<WeatherSummary | null> {
  if (!WEATHER_API_KEY) return null;
  const payload = await fetchJson<unknown>(buildWeatherUrl(destination));
  return parseWeatherPayload(payload);
}

function buildOverpassQuery(destination: DestinationMeta): string {
  const [lat, lon] = destination.center;
  return `
[out:json][timeout:25];
(
  node["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:4500,${lat},${lon});
  way["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:4500,${lat},${lon});
  relation["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:4500,${lat},${lon});
  node["amenity"~"restaurant|cafe|fast_food|food_court"](around:3500,${lat},${lon});
  way["amenity"~"restaurant|cafe|fast_food|food_court"](around:3500,${lat},${lon});
);
out center 35;
  `.trim();
}

function mapOverpassElements(elements: any[]): SpotCandidate[] {
  return elements
    .map((element) => {
      const tags = (element?.tags ?? {}) as Record<string, string>;
      const name = typeof tags.name === "string" ? tags.name : "";
      const centerLat = typeof element.lat === "number" ? element.lat : typeof element.center?.lat === "number" ? element.center.lat : null;
      const centerLon = typeof element.lon === "number" ? element.lon : typeof element.center?.lon === "number" ? element.center.lon : null;
      if (!name || centerLat === null || centerLon === null) return null;
      return {
        name,
        type: tags.tourism || tags.amenity || "attraction",
        lat: centerLat,
        lng: centerLon,
        address: tags["addr:full"] || tags["addr:street"] || tags["addr:place"] || tags["contact:address"],
        tags,
      } satisfies SpotCandidate;
    })
    .filter(Boolean)
    .slice(0, 12) as SpotCandidate[];
}

async function searchAttractions(destination: DestinationMeta): Promise<SpotCandidate[]> {
  const query = buildOverpassQuery(destination);
  const payload = await fetchJson<{ elements?: any[] }>(OVERPASS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8", Accept: "application/json" },
    body: query,
  });

  const elements = payload?.elements ?? [];
  const spots = mapOverpassElements(elements);
  if (spots.length > 0) return spots;

  return (STATIC_SPOTS[destination.name] ?? []).map((name) => ({
    name,
    type: "tourism",
    lat: destination.center[0],
    lng: destination.center[1],
    address: destination.name,
    tags: {},
  }));
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * r * Math.asin(Math.sqrt(h));
}

function fallbackTravelEstimate(origin: [number, number], destination: [number, number]): TravelEstimate {
  const km = Math.max(0.4, haversineKm(origin, destination) * 1.35);
  const minutes = Math.max(5, Math.round(km * 4.2));
  const mode = km < 2 ? "🚶" : km < 6 ? "🛵" : "🚗";
  return { km: Number(km.toFixed(1)), minutes, mode, source: "estimate" };
}

function parseTravelEstimate(payload: unknown, origin: [number, number], destination: [number, number]): TravelEstimate {
  if (!payload || typeof payload !== "object") return fallbackTravelEstimate(origin, destination);
  const data = payload as Record<string, any>;
  const rawMinutes =
    data.minutes ??
    data.durationMinutes ??
    data.duration_minutes ??
    data.travelTimeMinutes ??
    data.travel_time_minutes ??
    data.timeMinutes ??
    data.time_minutes ??
    data.routes?.[0]?.duration ??
    data.routes?.[0]?.duration_minutes ??
    data.data?.duration ??
    data.data?.duration_minutes;

  const rawKm =
    data.km ??
    data.distanceKm ??
    data.distance_km ??
    data.distance ??
    data.routes?.[0]?.distance ??
    data.routes?.[0]?.distance_km ??
    data.data?.distance ??
    data.data?.distance_km;

  if (typeof rawMinutes === "number") {
    const km =
      typeof rawKm === "number"
        ? rawKm
        : Number((haversineKm(origin, destination) * 1.35).toFixed(1));
    return {
      km,
      minutes: Math.max(1, Math.round(rawMinutes)),
      mode: km < 2 ? "🚶" : km < 6 ? "🛵" : "🚗",
      source: "api",
    };
  }

  return fallbackTravelEstimate(origin, destination);
}

export async function estimateTravelSegment(
  origin: { name: string; coords: [number, number] },
  destination: { name: string; coords: [number, number] }
): Promise<TravelEstimate> {
  if (!TRAVEL_TIME_API_URL) {
    return fallbackTravelEstimate(origin.coords, destination.coords);
  }

  const payload = {
    origin: origin.name,
    destination: destination.name,
    from: origin.name,
    to: destination.name,
    originLat: origin.coords[0],
    originLng: origin.coords[1],
    destinationLat: destination.coords[0],
    destinationLng: destination.coords[1],
    key: TRAVEL_TIME_API_KEY,
    apiKey: TRAVEL_TIME_API_KEY,
    appid: TRAVEL_TIME_API_KEY,
  };

  if (TRAVEL_TIME_METHOD === "POST") {
    const response = await fetch(TRAVEL_TIME_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response || !response.ok) return fallbackTravelEstimate(origin.coords, destination.coords);
    const data = await response.json().catch(() => null);
    return parseTravelEstimate(data, origin.coords, destination.coords);
  }

  const url = new URL(TRAVEL_TIME_API_URL);
  url.searchParams.set("origin", origin.name);
  url.searchParams.set("destination", destination.name);
  url.searchParams.set("from", origin.name);
  url.searchParams.set("to", destination.name);
  url.searchParams.set("originLat", String(origin.coords[0]));
  url.searchParams.set("originLng", String(origin.coords[1]));
  url.searchParams.set("destinationLat", String(destination.coords[0]));
  url.searchParams.set("destinationLng", String(destination.coords[1]));
  if (TRAVEL_TIME_API_KEY) {
    url.searchParams.set("key", TRAVEL_TIME_API_KEY);
    url.searchParams.set("apiKey", TRAVEL_TIME_API_KEY);
    url.searchParams.set("appid", TRAVEL_TIME_API_KEY);
  }

  const data = await fetchJson<unknown>(url.toString());
  return parseTravelEstimate(data, origin.coords, destination.coords);
}

function formatWeatherSummary(destination: DestinationMeta, weather: WeatherSummary | null): string {
  if (!weather) return `${destination.name}: chưa lấy được dữ liệu thời tiết trực tiếp, nhưng ${destination.weatherHint}`;

  const parts = [
    `${destination.name}: ${typeof weather.tempC === "number" ? `${weather.tempC.toFixed(0)}°C` : "không rõ nhiệt độ"}`,
  ];
  if (weather.description) parts.push(weather.description);
  if (typeof weather.humidity === "number") parts.push(`độ ẩm ${weather.humidity}%`);
  if (typeof weather.rainChance === "number") parts.push(`khả năng mưa ${weather.rainChance}%`);
  return parts.join(" · ");
}

function formatSpotLine(spots: SpotCandidate[]): string {
  if (spots.length === 0) return "Chưa tìm được điểm phù hợp từ Overpass.";
  return spots
    .slice(0, 4)
    .map((spot, index) => `${index + 1}. ${spot.name}`)
    .join("\n");
}

function buildActivityActions(destination: DestinationMeta, spots: SpotCandidate[]): AgentActionButton[] {
  return spots.slice(0, 3).map((spot, index) => {
    const day = (index % destination.days) + 1;
    return {
      label: `➕ ${spot.name}`,
      variant: "add",
      chatAction: toAddActivityAction(destination.name, spot, index, day),
    };
  });
}

function buildDestinationActions(destination: DestinationMeta): AgentActionButton[] {
  return [
    {
      label: `📅 Lập lịch ${destination.name} ${destination.days} ngày`,
      variant: "primary",
      chatAction: { type: "start_planning", payload: { destination: destination.name, days: destination.days, clearDefaults: true } },
    },
    {
      label: `➕ Thêm điểm nổi bật`,
      variant: "secondary",
      chatAction: { type: "highlight_spot", payload: destination.name },
    },
  ];
}

function buildSuggestionSideEffect(destinations: DestinationMeta[]): ChatAction {
  return {
    type: "suggest_destinations",
    payload: destinations.map(buildSuggestion),
  };
}

function isGreeting(query: string): boolean {
  return /^(xin chao|hello|hi|chao|hey)/.test(normalizeText(query));
}

function wantsDestinationSuggestions(query: string): boolean {
  const normalized = normalizeText(query);
  return normalized.includes("goi y") && (normalized.includes("diem den") || normalized.includes("di dau") || normalized.includes("du lich"));
}

function wantsWeather(query: string): boolean {
  const normalized = normalizeText(query);
  return normalized.includes("thoi tiet") || normalized.includes("mua") || normalized.includes("nang") || normalized.includes("mua bao");
}

function wantsTravelTime(query: string): boolean {
  const normalized = normalizeText(query);
  return normalized.includes("mat bao lau") || normalized.includes("di chuyen") || normalized.includes("di tu") || normalized.includes("quang duong");
}

function createQuickActions(destination: DestinationMeta, days: number): AgentActionButton[] {
  return [
    {
      label: `📅 Lập lịch ${destination.name} ${days} ngày`,
      variant: "primary",
      chatAction: { type: "start_planning", payload: { destination: destination.name, days, clearDefaults: true } },
    },
    {
      label: `➕ Thêm ${destination.name} nổi bật`,
      variant: "add",
      chatAction: createAddActivityAction(
        destination.name,
        `${destination.name} nổi bật`,
        destination.name,
        0,
        "sightseeing",
        "09:00",
        "12:00",
        1
      ),
    },
  ];
}

export async function runTravelAgent(message: string, trip: TripState): Promise<TravelAgentResponse> {
  const destination = destinationByQuery(message) ?? (trip.destination ? destinationByQuery(trip.destination) : undefined);
  const fallbackDestination = destination ?? DESTINATIONS[0];
  const days = extractDays(message, trip.days || fallbackDestination.days);
  const budgetHint = extractBudgetHint(message);

  if (isGreeting(message)) {
    return {
      content:
        "Xin chào. Tôi là trợ lý du lịch có dữ liệu thời tiết, điểm tham quan và ước tính di chuyển.\n\nHãy hỏi theo kiểu: \"Lập lịch Đà Nẵng 3 ngày\", \"Thời tiết Hội An thế nào?\" hoặc \"Mất bao lâu để đi từ Bãi biển Mỹ Khê tới Bà Nà Hills?\"",
      actions: createQuickActions(fallbackDestination, days),
    };
  }

  if (wantsDestinationSuggestions(message)) {
    const picks = DESTINATIONS.slice(0, 6);
    return {
      content:
        "Tôi đã nạp danh sách điểm đến phù hợp. Các thẻ bên phải sẽ tự cập nhật khi bạn chọn một điểm.\n\nTop gợi ý:\n" +
        picks.map((dest, index) => `${index + 1}. ${dest.name} - ${dest.description}`).join("\n"),
      sideEffects: [buildSuggestionSideEffect(picks)],
      actions: picks.map((dest) => ({
        label: `📅 ${dest.name} - ${dest.days} ngày`,
        variant: "primary",
        chatAction: { type: "start_planning", payload: { destination: dest.name, days: dest.days, clearDefaults: true } },
      })),
    };
  }

  if (wantsWeather(message) || /thoi tiet|du bao/.test(normalizeText(message))) {
    if (!destination) {
      return {
        content: "Bạn muốn xem thời tiết ở điểm đến nào? Hãy nêu tên thành phố hoặc địa danh, ví dụ: \"Thời tiết Hội An\".",
      };
    }

    const weather = await fetchWeather(destination);
    return {
      content:
        `${formatWeatherSummary(destination, weather)}.\n\n${destination.weatherHint}` +
        (weather?.description ? "\n\nTôi có thể tạo lịch trình tối ưu theo điều kiện thời tiết hiện tại." : ""),
      actions: buildDestinationActions(destination),
    };
  }

  if (wantsTravelTime(message)) {
    const normalized = normalizeText(message);
    const matches = normalized.match(/di tu (.+?) (?:den|sang|toi) (.+?)(?:\?|$|,|\.)/);
    const originName = matches?.[1]?.trim() ?? fallbackDestination.name;
    const destName = matches?.[2]?.trim() ?? destination?.name ?? fallbackDestination.name;
    const originDest = destinationByQuery(originName) ?? fallbackDestination;
    const targetDest = destinationByQuery(destName) ?? destination ?? fallbackDestination;
    const estimate = await estimateTravelSegment(
      { name: originDest.name, coords: originDest.center },
      { name: targetDest.name, coords: targetDest.center }
    );

    return {
      content:
        `Ước tính từ ${originDest.name} đến ${targetDest.name}: khoảng ${estimate.km.toFixed(1)} km, mất khoảng ${estimate.minutes} phút (${estimate.mode}).\n\n` +
        `Nếu bạn muốn, tôi có thể biến đoạn di chuyển này thành hoạt động trong lịch trình.`,
      actions: [
        {
          label: `📅 Lập lịch ${targetDest.name}`,
          variant: "primary",
          chatAction: { type: "start_planning", payload: { destination: targetDest.name, days, clearDefaults: true } },
        },
      ],
    };
  }

  if (destination) {
    const weather = await fetchWeather(destination);
    const spots = await searchAttractions(destination);
    const topSpots = spots.slice(0, 5);
    const planSpotLines = formatSpotLine(topSpots);
    const budgetLine = budgetHint
      ? budgetHint === "tiết kiệm"
        ? "Tôi sẽ ưu tiên điểm miễn phí và chi phí thấp."
        : budgetHint === "cao cấp"
          ? "Tôi sẽ ưu tiên trải nghiệm thoải mái và dịch vụ cao hơn."
          : "Tôi sẽ cân đối theo ngân sách bạn đưa ra."
      : "Tôi sẽ tự cân bằng trải nghiệm và chi phí.";

    return {
      content:
        `Tôi đã tra cứu ${destination.name} cho kế hoạch ${days} ngày.\n\n` +
        `Thời tiết: ${formatWeatherSummary(destination, weather)}\n` +
        `Điểm nên ưu tiên:\n${planSpotLines}\n\n` +
        `${budgetLine}`,
      actions: [
        ...buildDestinationActions(destination),
        ...buildActivityActions(destination, topSpots),
      ],
    };
  }

  if (trip.view === "itinerary" && trip.destination) {
    const destinationTrip = destinationByQuery(trip.destination) ?? fallbackDestination;
    const weather = await fetchWeather(destinationTrip);
    const spots = await searchAttractions(destinationTrip);

    return {
      content:
        `Bạn đang ở chế độ lịch trình cho ${trip.destination} ${trip.days} ngày.\n\n` +
        `Thời tiết: ${formatWeatherSummary(destinationTrip, weather)}\n` +
        `Gợi ý điểm nổi bật:\n${formatSpotLine(spots)}\n\n` +
        `Tôi có thể thêm từng điểm vào ngày 1 hoặc sắp xếp lại lộ trình theo thời tiết.`,
      actions: [
        ...buildDestinationActions(destinationTrip),
        ...buildActivityActions(destinationTrip, spots),
      ],
    };
  }

  return {
    content: DEFAULT_CONTENT,
    actions: createQuickActions(fallbackDestination, days),
  };
}
