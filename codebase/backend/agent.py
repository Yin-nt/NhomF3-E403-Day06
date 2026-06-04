import os
import re
import json
import time
import httpx
from typing import Dict, Any, List, Optional
from schemas import BackendAgentResponse, ActionButton, ChatAction, TripState, Activity, AISuggestion

# Load local mock data once
MOCK_DATA_FILE = os.path.join(os.path.dirname(__file__), "mock_data", "vietnam_spots.json")
MOCK_SPOTS = {}
try:
    if os.path.exists(MOCK_DATA_FILE):
        with open(MOCK_DATA_FILE, 'r', encoding='utf-8') as f:
            MOCK_SPOTS = json.load(f)
            print(f"[Debug] Loaded local mock data with {len(MOCK_SPOTS)} provinces.")
except Exception as e:
    print(f"[Debug] Failed to load local mock data: {e}")

# Hardcoded metadata to match the React app as defaults/known points
DESTINATIONS = [
    {
        "name": "Hà Nội",
        "aliases": ["ha noi", "hanoi"],
        "tag": "Lịch sử",
        "days": 3,
        "cost": "3–7 triệu",
        "description": "Thủ đô ngàn năm văn hiến, hợp cho hành trình văn hoá và ẩm thực.",
        "center": [21.0285, 105.8542],
        "weatherHint": "Thời tiết đẹp nhất thường vào mùa thu và mùa xuân.",
    },
    {
        "name": "Đà Nẵng",
        "aliases": ["da nang", "danang"],
        "tag": "Biển",
        "days": 3,
        "cost": "4–10 triệu",
        "description": "Thành phố biển dễ đi, nhiều điểm tham quan cô đọng trong vài ngày.",
        "center": [16.0479, 108.2208],
        "weatherHint": "Mùa khô từ khoảng tháng 2 đến tháng 8 thường thuận lợi hơn.",
    },
    {
        "name": "Hội An",
        "aliases": ["hoi an", "hoian"],
        "tag": "Cổ đại",
        "days": 2,
        "cost": "2–5 triệu",
        "description": "Phố cổ, đèn lồng, ẩm thực đặc sắc và đi bộ rất hợp.",
        "center": [15.8801, 108.338],
        "weatherHint": "Buổi tối và mùa ít mưa là thời điểm lý tưởng nhất.",
    },
    {
        "name": "Hạ Long",
        "aliases": ["ha long", "halong"],
        "tag": "Thiên nhiên",
        "days": 3,
        "cost": "5–12 triệu",
        "description": "Kỳ quan vịnh, du thuyền và hoạt động ngoài trời.",
        "center": [20.9515, 107.0887],
        "weatherHint": "Ưu tiên ngày ít mưa để đi du thuyền và kayak.",
    },
    {
        "name": "Sa Pa",
        "aliases": ["sapa", "sa pa"],
        "tag": "Núi rừng",
        "days": 3,
        "cost": "3.5–8 triệu",
        "description": "Khí hậu mát, ruộng bậc thang và trekking.",
        "center": [22.3364, 103.8438],
        "weatherHint": "Mùa lúa chín và ngày trời quang là đẹp nhất.",
    },
    {
        "name": "Phú Quốc",
        "aliases": ["phu quoc", "phuquoc"],
        "tag": "Đảo",
        "days": 4,
        "cost": "5–18 triệu",
        "description": "Đảo nghỉ dưỡng, biển xanh, sunset và hoạt động đảo.",
        "center": [10.2899, 103.984],
        "weatherHint": "Mùa khô từ tháng 11 đến tháng 4 phù hợp nhất.",
    },
]

def normalize_text(text: str) -> str:
    text = text.lower()
    # Basic translation of Vietnamese characters to normal latin
    replacements = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.strip()

def parse_budget_from_message(message: str) -> Optional[int]:
    """
    Parses budget in VND from text like 'ngân sách 1.5 triệu', 'budget 500k', 'chi phí 2 triệu', '1000000đ'.
    """
    msg = normalize_text(message)
    million_match = re.search(r'(?:ngan sach|budget|chi phi|khoang)?\s*([0-9.,]+)\s*(?:trieu|tr)\b', msg)
    if million_match:
        val_str = million_match.group(1).replace(',', '.')
        try:
            return int(float(val_str) * 1_000_000)
        except ValueError:
            pass
            
    k_match = re.search(r'(?:ngan sach|budget|chi phi|khoang)?\s*([0-9.,]+)\s*k\b', msg)
    if k_match:
        val_str = k_match.group(1).replace(',', '.')
        try:
            return int(float(val_str) * 1_000)
        except ValueError:
            pass

    vnd_match = re.search(r'(?:ngan sach|budget|chi phi|khoang)?\s*([0-9.]{5,})\s*(?:vnd|d|dong|đồng)?\b', msg)
    if vnd_match:
        val_str = vnd_match.group(1).replace('.', '')
        try:
            return int(val_str)
        except ValueError:
            pass
            
    return None

def slugify_province_name(name: str) -> str:
    norm = normalize_text(name)
    norm = norm.replace(" ", "-")
    norm = re.sub(r'[^a-z0-9\-]', '', norm)
    if "ho-chi-minh" in norm or "hcm" in norm or "sai-gon" in norm: 
        return "ho-chi-minh"
    return norm

def format_slug_to_name(slug: str) -> str:
    special = {
        "ha-noi": "Hà Nội",
        "ho-chi-minh": "Hồ Chí Minh",
        "da-nang": "Đà Nẵng",
        "hai-phong": "Hải Phòng",
        "can-tho": "Cần Thơ",
        "ba-ria-vung-tau": "Bà Rịa - Vũng Tàu",
        "bac-giang": "Bắc Giang",
        "bac-kan": "Bắc Kạn",
        "bac-lieu": "Bạc Liêu",
        "bac-ninh": "Bắc Ninh",
        "ben-tre": "Bến Tre",
        "binh-dinh": "Bình Định",
        "binh-duong": "Bình Dương",
        "binh-phuoc": "Bình Phước",
        "binh-thuan": "Bình Thuận",
        "ca-mau": "Cà Mau",
        "cao-bang": "Cao Bằng",
        "dak-lak": "Đắk Lắk",
        "dak-nong": "Đắk Nông",
        "dien-bien": "Điện Biên",
        "dong-nai": "Đồng Nai",
        "dong-thap": "Đồng Tháp",
        "gia-lai": "Gia Lai",
        "ha-giang": "Hà Giang",
        "ha-nam": "Hà Nam",
        "ha-tinh": "Hà Tĩnh",
        "hai-duong": "Hải Dương",
        "hau-giang": "Hậu Giang",
        "hoa-binh": "Hòa Bình",
        "hung-yen": "Hưng Yên",
        "khanh-hoa": "Khánh Hòa",
        "kien-giang": "Kiên Giang",
        "kon-tum": "Kon Tum",
        "lai-chau": "Lai Châu",
        "lam-dong": "Lâm Đồng",
        "lang-son": "Lạng Sơn",
        "lao-cai": "Lào Cai",
        "long-an": "Long An",
        "nam-dinh": "Nam Định",
        "nghe-an": "Nghệ An",
        "ninh-binh": "Ninh Bình",
        "ninh-thuan": "Ninh Thuận",
        "phu-tho": "Phú Thọ",
        "phu-yen": "Phú Yên",
        "quang-binh": "Quảng Bình",
        "quang-nam": "Quảng Nam",
        "quang-ngai": "Quảng Ngãi",
        "quang-ninh": "Quảng Ninh",
        "quang-tri": "Quảng Trị",
        "soc-trang": "Sóc Trăng",
        "son-la": "Sơn La",
        "tay-ninh": "Tây Ninh",
        "thai-binh": "Thái Bình",
        "thai-nguyen": "Thái Nguyên",
        "thanh-hoa": "Thanh Hóa",
        "thua-thien-hue": "Thừa Thiên Huế",
        "tien-giang": "Tiền Giang",
        "tra-vinh": "Trà Vinh",
        "tuyen-quang": "Tuyên Quang",
        "vinh-long": "Vĩnh Long",
        "vinh-phuc": "Vĩnh Phúc",
        "yen-bai": "Yên Bái"
    }
    return special.get(slug, slug.replace("-", " ").title())

def extract_days(message: str, default_days: int) -> int:
    msg = normalize_text(message)
    match = re.search(r'\b([0-9]+)\s*(?:ngay|n)\b', msg)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            pass
    return default_days

def fetch_local_mock_spots(province_name: str) -> List[Dict[str, Any]]:
    slug = slugify_province_name(province_name)
    if slug in MOCK_SPOTS:
        print(f"[Debug] Found local mock data for {slug}")
        return MOCK_SPOTS[slug][:15]
    
    for key in MOCK_SPOTS.keys():
        if slug in key or key in slug:
            print(f"[Debug] Found partial local mock data match: {key}")
            return MOCK_SPOTS[key][:15]
            
    print(f"[Debug] No local mock data found for {province_name} ({slug})")
    return []


async def geocode_destination(destination_name: str) -> Optional[Dict[str, Any]]:
    """
    Query OpenStreetMap Nominatim API to find coordinates of a destination dynamically.
    """
    # Check predefined first
    norm_name = normalize_text(destination_name)
    for d in DESTINATIONS:
        if normalize_text(d["name"]) == norm_name or any(alias == norm_name for alias in d["aliases"]):
            print(f"[Debug] Geocoding matched predefined: {d['name']}")
            return {
                "name": d["name"],
                "center": d["center"],
                "tag": d["tag"],
                "days": d["days"],
                "cost": d["cost"],
                "description": d["description"]
            }

    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "VietTravelAI/1.0"}
    params = {
        "q": destination_name + ", Vietnam",
        "format": "json",
        "limit": 1
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(url, params=params, headers=headers)
            print(f"[Debug] Nominatim status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data:
                    item = data[0]
                    print(f"[Debug] Nominatim matched: {item['display_name']} -> [{item['lat']}, {item['lon']}]")
                    return {
                        "name": destination_name,
                        "center": [float(item["lat"]), float(item["lon"])],
                        "tag": "Khám phá",
                        "days": 3,
                        "cost": "3-8 triệu",
                        "description": item.get("display_name", f"Thành phố {destination_name}")
                    }
    except Exception as e:
        print(f"[Debug] Geocoding error for {destination_name}: {e}")

    # Fallback to local mock database province check
    slug = slugify_province_name(destination_name)
    if slug in MOCK_SPOTS:
        return {
            "name": format_slug_to_name(slug),
            "center": [16.4, 107.6],
            "tag": "Khám phá",
            "days": 3,
            "cost": "3-8 triệu",
            "description": f"Tỉnh {format_slug_to_name(slug)}, Việt Nam"
        }
    return None

async def fetch_weather_api(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch live weather data from OpenWeatherMap using coordinates.
    """
    url = os.environ.get("WEATHER_API_URL", "https://api.openweathermap.org/data/2.5/weather")
    api_key = os.environ.get("WEATHER_API_KEY", "")
    if not api_key:
        print("[Debug] WEATHER_API_KEY is empty")
        return {}
    try:
        params = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
            "lang": "vi"
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params)
            print(f"[Debug] Weather API status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                weather_desc = data.get("weather", [{}])[0].get("description", "")
                temp = data.get("main", {}).get("temp")
                humidity = data.get("main", {}).get("humidity")
                return {
                    "temp": temp,
                    "description": weather_desc,
                    "humidity": humidity
                }
    except Exception as e:
        print(f"[Debug] Error querying Weather API: {e}")
    return {}

async def fetch_overpass_spots(lat: float, lon: float) -> List[Dict[str, Any]]:
    """
    Query Overpass API dynamically to search for attractions and restaurants around the city's coordinates.
    """
    url = os.environ.get("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")
    query = f"""
    [out:json][timeout:25];
    (
      node["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:6000,{lat},{lon});
      way["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:6000,{lat},{lon});
      relation["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"](around:6000,{lat},{lon});
      node["historic"](around:6000,{lat},{lon});
      way["historic"](around:6000,{lat},{lon});
      relation["historic"](around:6000,{lat},{lon});
      node["leisure"~"park|nature_reserve|water_park"](around:6000,{lat},{lon});
      way["leisure"~"park|nature_reserve|water_park"](around:6000,{lat},{lon});
      relation["leisure"~"park|nature_reserve|water_park"](around:6000,{lat},{lon});
      node["amenity"~"restaurant|cafe|fast_food|food_court"](around:4000,{lat},{lon});
      way["amenity"~"restaurant|cafe|fast_food|food_court"](around:4000,{lat},{lon});
    );
    out center 40;
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {"Content-Type": "text/plain", "User-Agent": "VietTravelAI/1.0 (test@example.com)"}
            response = await client.post(url, content=query, headers=headers)
            print(f"[Debug] Overpass API status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                elements = data.get("elements", [])
                spots = []
                for el in elements:
                    tags = el.get("tags", {})
                    name = tags.get("name")
                    if not name:
                        continue
                    el_lat = el.get("lat") or el.get("center", {}).get("lat")
                    el_lon = el.get("lon") or el.get("center", {}).get("lon")
                    if el_lat is None or el_lon is None:
                        continue
                    spots.append({
                        "name": name,
                        "type": tags.get("tourism") or tags.get("amenity") or "attraction",
                        "lat": el_lat,
                        "lng": el_lon,
                        "address": tags.get("addr:full") or tags.get("addr:street") or tags.get("addr:place") or tags.get("contact:address") or ""
                    })
                print(f"[Debug] Overpass matched {len(spots)} spots")
                import random
                random.shuffle(spots)
                diverse_spots = []
                counts = {"museum": 0, "temple": 0, "park": 0}
                for spot in spots:
                    name_l = spot["name"].lower()
                    type_l = str(spot["type"]).lower()
                    if "bảo tàng" in name_l or "museum" in type_l:
                        if counts["museum"] >= 2: continue
                        counts["museum"] += 1
                    elif "chùa" in name_l or "đền" in name_l:
                        if counts["temple"] >= 2: continue
                        counts["temple"] += 1
                    elif "công viên" in name_l or "park" in type_l:
                        if counts["park"] >= 2: continue
                        counts["park"] += 1
                    
                    diverse_spots.append(spot)
                    if len(diverse_spots) >= 25:
                        break
                return diverse_spots
    except Exception as e:
        print(f"[Debug] Error querying Overpass API: {e}")
    return []

def extract_destination_name(message: str, current_dest: Optional[str]) -> Optional[str]:
    # Match predefined destinations first
    msg_normalized = normalize_text(message)
    for d in DESTINATIONS:
        for alias in d["aliases"] + [normalize_text(d["name"])]:
            if alias in msg_normalized:
                return d["name"]
    
    # Check if message contains any of the 63 provinces slug
    msg_slug = slugify_province_name(message)
    sorted_slugs = sorted(MOCK_SPOTS.keys(), key=len, reverse=True)
    for slug in sorted_slugs:
        if slug in msg_slug and len(slug) > 3:
            return format_slug_to_name(slug)

    # case-insensitive keywords, capturing capitalized name phrases (handles multi-word capital names)
    keywords = ["đi", "đến", "tới", "du lịch", "lịch trình", "thời tiết", "ở", "tại", "diem den"]
    pattern = r"(?i)(?:" + "|".join(keywords) + r")\s+([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴđđ₫][\w\sÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴđđ₫]+)"
    
    match = re.search(pattern, message)
    if match:
        city = match.group(1).strip()
        city = re.sub(r'^(?:chơi\s+ở|chơi\s+tại|chơi|thăm|ghé)\s+', '', city, flags=re.IGNORECASE).strip()
        city = re.split(r'\s+(?:3|4|5|2|ngay|tu|voi|ngan|budget|trong|the|va)\b', city, flags=re.IGNORECASE)[0].strip()
        city = re.sub(r'[?.!,;:]', '', city).strip()
        if len(city) > 2:
            return city
            
    return current_dest if current_dest else None

def is_planning_request(message: str) -> bool:
    msg = normalize_text(message)
    # Check if they specify a day count like "2 ngày", "3 ngay", "4 n"
    if re.search(r'\b([0-9]+)\s*(?:ngay|n)\b', msg):
        return True
    # Or if they use explicit planning/scheduling keywords
    plan_keywords = ["lich trinh", "lap ke hoach", "len ke hoach", "len lich", "lap lich", "tao lich", "itinerary", "planning", "trip"]
    if any(kw in msg for kw in plan_keywords):
        return True
    return False

def is_edit_request(message: str, trip: TripState) -> bool:
    """Returns True if user is requesting to modify/add/remove from the existing itinerary."""
    # Must be in itinerary view with an active destination
    if trip.view != "itinerary" or not trip.destination:
        return False
    msg = normalize_text(message)
    # Edit/modification keywords
    edit_keywords = [
        "muon di", "toi muon", "them vao", "them cho toi", "doi",
        "sua", "thay", "thay the", "bo", "xoa", "loai bo", "cat",
        "nhieu hon", "it hon", "them nhieu", "them diem", "thay bang",
        "doi sang", "cap nhat", "chinh sua", "muon them", "muon xoa",
        "muon doi", "muon bo", "thay lich", "doi lich",
    ]
    return any(kw in msg for kw in edit_keywords)

async def run_travel_agent_llm(message: str, trip: TripState) -> BackendAgentResponse:
    """
    Main entry point for running the travel agent. Geocodes, fetches live weather,
    queries Overpass dynamically, and calls local/cloud LLM with structured details.
    """
    is_plan_req = is_planning_request(message)
    is_edit_req = is_edit_request(message, trip)
    print(f"[Debug] Message: '{message}', Is Plan Req: {is_plan_req}, Is Edit Req: {is_edit_req}")

    # Build current activities context string
    current_activities_str = "Chưa có hoạt động nào trong lịch trình"
    if trip.currentActivities:
        acts_lines = []
        for a in trip.currentActivities:
            acts_lines.append(f"  - [Ngày {a.day or '?'}] {a.name} ({a.type}, {a.startTime}-{a.endTime})")
        current_activities_str = "\n".join(acts_lines)

    # 1. Detect and fetch destination metadata
    dest_name = extract_destination_name(message, trip.destination)
    print(f"[Debug] Extracted Destination Name: '{dest_name}'")
    dest_info = None
    weather_info = {}
    overpass_spots = []
    local_spots = []
    
    if dest_name:
        dest_info = await geocode_destination(dest_name)
        if dest_info:
            lat, lon = dest_info["center"]
            # Fetch Weather
            weather_info = await fetch_weather_api(lat, lon)
            # Fetch Overpass spots
            overpass_spots = await fetch_overpass_spots(lat, lon)
            # Fetch local mock spots
            local_spots = fetch_local_mock_spots(dest_info["name"])

    # Calculate budget threshold globally
    extracted_budget = parse_budget_from_message(message)
    if extracted_budget is not None and dest_info:
        # Determine number of days
        num_days = extract_days(message, trip.days if (trip.days and trip.days > 0) else dest_info.get("days", 3))
        if num_days <= 0:
            num_days = 3
            
        # Require at least 500k VND per day
        min_required = num_days * 500000
        
        # Check standard ticket cost logic for specific locations (extra validation)
        estimated_min_cost = 200000  # Default minimum cost
        if "Đà Nẵng" in dest_info["name"]:
            estimated_min_cost = 850000
        elif "Hà Nội" in dest_info["name"]:
            estimated_min_cost = 30000
        elif "Hội An" in dest_info["name"]:
            estimated_min_cost = 120000
        elif "Fansipan" in dest_info["name"] or "Sa Pa" in dest_info["name"]:
            estimated_min_cost = 800000
            
        if extracted_budget < min_required or estimated_min_cost > extracted_budget * 1.1:
            return BackendAgentResponse(
                content=f"⚠️ **Cảnh báo ngân sách quá thấp!**\n\nNgân sách {extracted_budget:,}đ của bạn không phù hợp cho chuyến đi {num_days} ngày tại {dest_info['name']}. Mức chi tiêu tối thiểu nên vào khoảng 500,000đ/ngày (tổng ~{min_required:,}đ). Riêng vé tham quan các điểm nổi tiếng đã tốn một khoản đáng kể.\n\nVui lòng tăng ngân sách hoặc giảm số ngày để tôi có thể lập lịch trình khả thi nhé!",
                actions=[],
                sideEffects=[]
            )

    # 2. Formulate prompts
    weather_str = "Chưa có thông tin thời tiết trực tiếp"
    if weather_info:
        weather_str = f"Nhiệt độ {weather_info.get('temp')}°C, {weather_info.get('description')}, độ ẩm {weather_info.get('humidity')}%"

    combined_spots = []
    if local_spots:
        for s in local_spots[:10]:
            desc = s.get('description', '')
            desc_short = desc[:100] + "..." if len(desc) > 100 else desc
            price = s.get('price', 'N/A')
            open_t = s.get('open_time', 'N/A')
            addr = s.get('address', 'N/A')
            combined_spots.append(f"- {s['name']} (Giá: {price}, Giờ mở: {open_t}, Mô tả: {desc_short}, Đ/c: {addr})")
            
    if overpass_spots:
        for s in overpass_spots[:5]:
            combined_spots.append(f"- {s['name']} (Loại: {s['type']}, Lat: {s['lat']}, Lng: {s['lng']}, Đ/c: {s['address']})")

    spots_str = "Dữ liệu địa điểm trống"
    if combined_spots:
        spots_str = "\n".join(combined_spots)

    if is_edit_req:
        system_prompt = f"""
You are VietTravel AI, a professional travel assistant.
The user wants to MODIFY, ADD TO, or REMOVE FROM an existing itinerary for {trip.destination}.
You MUST return a valid JSON object:
{{
  "content": "Acknowledge the change in Vietnamese, confirm what was modified.",
  "actions": [],
  "sideEffects": [
    {{
      "type": "add_activity" | "replace_activity" | "remove_activity",
      "payload": <see below>
    }}
  ]
}}

Payload structures:
- add_activity: {{"id": "rand-id", "type": "sightseeing"|"food"|"hotel"|"transport", "name": "tên", "address": "địa chỉ", "startTime": "HH:MM", "endTime": "HH:MM", "cost": số, "note": "ghi chú", "day": số_ngày}}
- replace_activity: {{"matchName": "tên hoạt động cần thay thế (must match existing)", "newActivity": {{same structure as add_activity}}}}
- remove_activity: {{"matchName": "tên hoạt động cần xóa"}}

Current itinerary for {trip.destination} ({trip.days} ngày):
{current_activities_str}

Available spots from database:
{spots_str}

Weather: {weather_str}

Rules:
- If user says "tôi muốn đi [location]" or "thêm [location]": use add_activity with that spot.
- If user says "thay [A] bằng [B]" or "đổi [A] sang [B]": use replace_activity.
- If user says "bỏ" or "xóa [location]": use remove_activity.
- If user says "thêm nhiều hơn" or "muốn vui hơn": add 2-3 more sightseeing activities.
- Use the existing day numbers from currentActivities when deciding which day to put new activity.
- Output ONLY the JSON block. No markdown fences.
"""
    elif is_plan_req:
        system_prompt = f"""
You are VietTravel AI, a professional travel assistant.
You MUST analyze the user query and return a valid JSON object matching the structure:
{{
  "content": "Your chatbot text response in Vietnamese. Use markdown formatting. Summarize the day-by-day plan.",
  "actions": [
    {{
      "label": "Button Label",
      "variant": "primary" | "secondary" | "add",
      "chatAction": {{
        "type": "start_planning" | "add_activity" | "highlight_spot" | "suggest_destinations",
        "payload": <appropriate payload>
      }}
    }}
  ],
  "sideEffects": [
    {{
      "type": "start_planning" | "add_activity" | "highlight_spot" | "suggest_destinations",
      "payload": <appropriate payload>
    }}
  ]
}}

Payload structures:
1. start_planning: {{"destination": "Thành phố", "days": số ngày, "clearDefaults": true, "popularSpots": ["Điểm 1", "Điểm 2", ...]}}
2. add_activity: {{"id": "chuỗi ngẫu nhiên", "type": "sightseeing"|"food"|"hotel"|"transport", "name": "tên hoạt động", "address": "địa chỉ", "startTime": "HH:MM", "endTime": "HH:MM", "cost": số_tiền, "note": "ghi chú", "day": số_ngày_1_đến_N}}
3. suggest_destinations: [{{"name": "Thành phố", "tag": "Biển"|"Lịch sử"|"Thiên nhiên", "img": "url", "reason": "lý do gợi ý", "days": số ngày, "cost": "chi phí"}}]

Live API & Local Database Context:
- Target Destination: {dest_name or 'Chưa xác định'}
- Live Weather: {weather_str}
- Real attractions from Local DB and Overpass API:
{spots_str}

Instruction:
- You must generate a complete day-by-day plan for the requested days (total: {trip.days if (trip.days and trip.days > 0) else '3'} days).
- Each day MUST follow this exact structure (5 activities/day):
  1. Ăn sáng (type: "food", time: ~08:00)
  2. Tham quan buổi sáng (type: "sightseeing", time: ~09:00)
  3. Ăn trưa (type: "food", time: ~12:00)
  4. Tham quan buổi chiều (type: "sightseeing", time: ~14:00)
  5. Ăn tối (type: "food", time: ~18:00)
- CRITICAL: DO NOT include "transport" or "di chuyển" activities. You MUST provide exactly these 5 activities for each day.
- CRITICAL: Make the itinerary DIVERSE! Limit to a MAXIMUM of 1 museum per trip. Prioritize outdoor parks, famous streets, historic monuments, lakes, local markets, and entertainment areas.
- The "day" field in "add_activity" payloads is mandatory (1-indexed).
- Return "start_planning" first in sideEffects with "clearDefaults": true and "popularSpots" listing attractions from the database/Overpass context, followed by "add_activity" actions.
- CRITICAL: Do NOT put every "add_activity" into the "actions" array! The "actions" array is only for 1 or 2 quick-reply UI buttons (e.g., "Sửa lịch trình"). All itinerary events MUST go into the "sideEffects" array!
- Output ONLY the JSON block. Do not include markdown code fence formatting (```json) inside the JSON string.
"""
    else:
        system_prompt = f"""
You are VietTravel AI, a professional travel assistant.
The user is asking a general question, recommendation, weather inquiry, or chatting (NOT asking to generate a full day-by-day travel schedule).
You MUST analyze the user query and return a valid JSON object matching the structure:
{{
  "content": "Your conversational response in Vietnamese. Answer their question directly based on the weather/spots context. Use markdown.",
  "actions": [
    {{
      "label": "Button Label",
      "variant": "primary" | "secondary",
      "chatAction": {{
        "type": "start_planning" | "suggest_destinations",
        "payload": <appropriate payload>
      }}
    }}
  ],
  "sideEffects": []
}}

CRITICAL RULES:
- You MUST NOT return any "start_planning" or "add_activity" in "sideEffects". The "sideEffects" array MUST be empty [].
- Do not build or generate a full daily schedule in sideEffects. Just answer their question conversationally in "content".
- You may suggest a button in "actions" like "Lập kế hoạch đi {dest_name or 'Hà Nội'} 3 ngày" with a start_planning payload, but do not execute it automatically.
- Output ONLY the JSON block. Do not include markdown code fence formatting (```json) inside the JSON string.

Context:
- Target Destination: {dest_name or 'Chưa xác định'}
- Live Weather: {weather_str}
- Attractions/Spots:
{spots_str}
"""

    user_prompt = f"User Message: \"{message}\"\nCurrent Trip State: destination='{trip.destination}', days={trip.days}, view='{trip.view}'"

    llm_output = await query_llm(user_prompt, system_prompt)
    
    if llm_output:
        try:
            cleaned = llm_output.strip()
            # Try to extract just the JSON part if there is markdown or conversational padding
            match = re.search(r'(\{.*\})', cleaned, re.DOTALL)
            if match:
                cleaned = match.group(1)
                
            data = json.loads(cleaned)
            actions = []
            for a in data.get("actions", []):
                act = a.get("chatAction", {})
                actions.append(ActionButton(
                    label=a.get("label", ""),
                    variant=a.get("variant", "secondary"),
                    chatAction=ChatAction(type=act.get("type", ""), payload=act.get("payload"))
                ))
                
            side_effects = []
            for s in data.get("sideEffects", []):
                side_effects.append(ChatAction(type=s.get("type", ""), payload=s.get("payload")))
                
            return BackendAgentResponse(
                content=data.get("content", ""),
                actions=actions,
                sideEffects=side_effects
            )
        except Exception as ex:
            print(f"Failed to parse LLM JSON: {ex}. Output was:\n{llm_output}")

    # Fallback to rule-based response using the fetched live data if LLM is unavailable
    if dest_info:
        if is_edit_req:
            # Collect new spots not already in the current itinerary
            current_names = {a.name for a in (trip.currentActivities or [])}
            spots_to_add = (local_spots + overpass_spots)
            seen = set()
            unique_spots = []
            for s in spots_to_add:
                if s['name'] not in seen and s['name'] not in current_names:
                    unique_spots.append(s)
                    seen.add(s['name'])

            msg_lower = normalize_text(message)

            # Check for explicit remove request
            for act in (trip.currentActivities or []):
                if normalize_text(act.name) in msg_lower or normalize_text(act.name.split()[0]) in msg_lower:
                    # Remove this activity
                    return BackendAgentResponse(
                        content=f"✅ Đã xóa **{act.name}** khỏi lịch trình của bạn!",
                        actions=[],
                        sideEffects=[ChatAction(type="remove_activity", payload={"matchName": act.name})]
                    )

            # Check for specific spot mentioned in message
            if unique_spots:
                for s in unique_spots[:10]:
                    if normalize_text(s['name']) in msg_lower or any(word in msg_lower for word in normalize_text(s['name']).split() if len(word) > 3):
                        # Add this specific spot
                        target_day = (trip.currentActivities[-1].day if trip.currentActivities else 1) or 1
                        payload = {
                            "id": f"edit-{int(time.time())}-0",
                            "name": s["name"],
                            "address": s.get("address", dest_info["name"]),
                            "startTime": "09:00",
                            "endTime": "11:30",
                            "cost": s.get("price", 0) if isinstance(s.get("price"), (int, float)) else 0,
                            "type": s.get("type", "sightseeing"),
                            "note": s.get("description", "Điểm tham quan thú vị.")[:100],
                            "day": target_day
                        }
                        return BackendAgentResponse(
                            content=f"✅ Đã thêm **{s['name']}** vào lịch trình ngày {target_day}!\n\n_{s.get('description', '')[:80]}_",
                            actions=[],
                            sideEffects=[ChatAction(type="add_activity", payload=payload)]
                        )

            # "muốn đi chơi nhiều hơn" – add up to 3 new spots
            added = unique_spots[:3]
            if not added:
                return BackendAgentResponse(
                    content=f"Tôi không tìm thấy điểm tham quan mới phù hợp để thêm. Bạn thử tìm kiếm theo tên địa điểm cụ thể nhé!",
                    actions=[], sideEffects=[]
                )

            side_effects = []
            names_added = []
            for idx, s in enumerate(added):
                target_day = (trip.currentActivities[-1].day if trip.currentActivities else 1) or 1
                payload = {
                    "id": f"edit-{int(time.time())}-{idx}",
                    "name": s["name"],
                    "address": s.get("address", dest_info["name"]),
                    "startTime": "14:00",
                    "endTime": "16:30",
                    "cost": s.get("price", 0) if isinstance(s.get("price"), (int, float)) else 0,
                    "type": s.get("type", "sightseeing"),
                    "note": s.get("description", "")[:100],
                    "day": target_day
                }
                side_effects.append(ChatAction(type="add_activity", payload=payload))
                names_added.append(s["name"])

            return BackendAgentResponse(
                content=f"🎉 Đã thêm {len(names_added)} địa điểm mới vào lịch trình:\n" + "\n".join(f"• **{n}**" for n in names_added),
                actions=[],
                sideEffects=side_effects
            )

        if is_plan_req:
            num_days = extract_days(message, trip.days if (trip.days and trip.days > 0) else dest_info["days"])
            if num_days <= 0:
                num_days = 3

            weather_desc = f"\nThời tiết hiện tại: {weather_str}." if weather_info else ""
            content = f"🗺️ **Kế hoạch du lịch {dest_info['name']} ({num_days} ngày)**\n\n{dest_info['description']}{weather_desc}\n\nLịch trình chi tiết đã được tối ưu hóa cho {num_days} ngày với đầy đủ các khoảng thời gian nghỉ ngơi, ẩm thực và tham quan:"
            
            # Start planning automatically
            # Collect and deduplicate unique spots
            spots_to_add = (local_spots + overpass_spots)
            seen = set()
            unique_spots = []
            for s in spots_to_add:
                if s['name'] not in seen:
                    unique_spots.append(s)
                    seen.add(s['name'])
            
            unique_spot_names = [s['name'] for s in unique_spots[:8]]

            side_effects = [
                ChatAction(type="start_planning", payload={
                    "destination": dest_info["name"], 
                    "days": num_days, 
                    "clearDefaults": True,
                    "popularSpots": unique_spot_names
                })
            ]
            actions = []
            
            # Fallback spots if none exist
            if not unique_spots:
                unique_spots = [
                    {"name": f"Khu du lịch trung tâm {dest_info['name']}", "address": dest_info['name'], "type": "sightseeing", "price": 0},
                    {"name": f"Chợ truyền thống {dest_info['name']}", "address": dest_info['name'], "type": "sightseeing", "price": 0},
                    {"name": f"Công viên trung tâm {dest_info['name']}", "address": dest_info['name'], "type": "sightseeing", "price": 0},
                ]

            spot_idx = 0
            activity_counter = 0
            
            # Distribute attractions and dining/rest slots across all days
            for d in range(1, num_days + 1):
                content += f"\n\n📅 **Ngày {d}:**"
                
                # 1. Breakfast (07:30 - 08:30)
                breakfast_name = f"Ăn sáng: Đặc sản địa phương tại {dest_info['name']}"
                breakfast_addr = dest_info['name']
                food_spots = [s for s in unique_spots if s.get('type') == 'food' or 'quán' in s['name'].lower() or 'nhà hàng' in s['name'].lower() or 'bánh' in s['name'].lower()]
                if food_spots:
                    fs = food_spots[d % len(food_spots)]
                    breakfast_name = f"Ăn sáng tại {fs['name']}"
                    breakfast_addr = fs.get('address', dest_info['name'])
                
                breakfast_payload = {
                    "id": f"act-{activity_counter}-auto",
                    "name": breakfast_name,
                    "address": breakfast_addr,
                    "startTime": "07:30",
                    "endTime": "08:30",
                    "cost": 50000,
                    "type": "food",
                    "note": "Thưởng thức bữa sáng tràn đầy năng lượng.",
                    "day": d
                }
                side_effects.append(ChatAction(type="add_activity", payload=breakfast_payload))
                activity_counter += 1
                content += f"\n  - 07:30 - 08:30: {breakfast_name}"

                # 2. Morning Sightseeing (09:00 - 11:30)
                sight_spots = [s for s in unique_spots if s.get('type') != 'food' and 'quán' not in s['name'].lower() and 'nhà hàng' not in s['name'].lower() and 'bánh' not in s['name'].lower()]
                if not sight_spots:
                    sight_spots = unique_spots
                    
                morning_spot = sight_spots[spot_idx % len(sight_spots)]
                spot_idx += 1
                
                morning_payload = {
                    "id": f"act-{activity_counter}-auto",
                    "name": morning_spot["name"],
                    "address": morning_spot.get("address", dest_info['name']),
                    "startTime": "09:00",
                    "endTime": "11:30",
                    "cost": morning_spot.get("price", 0) if isinstance(morning_spot.get("price"), (int, float)) else 0,
                    "type": "sightseeing",
                    "note": morning_spot.get("description", "Điểm tham quan hấp dẫn.")[:100],
                    "day": d
                }
                side_effects.append(ChatAction(type="add_activity", payload=morning_payload))
                activity_counter += 1
                content += f"\n  - 09:00 - 11:30: {morning_spot['name']}"
                
                if len(actions) < 3:
                    actions.append(ActionButton(
                        label=f"➕ Ngày {d}: {morning_spot['name'][:12]}...",
                        variant="add",
                        chatAction=ChatAction(type="add_activity", payload=morning_payload)
                    ))

                # 3. Coffee Break (11:30 - 12:30)
                coffee_payload = {
                    "id": f"act-{activity_counter}-auto",
                    "name": "Nghỉ ngơi & Cà phê thư giãn",
                    "address": dest_info['name'],
                    "startTime": "11:30",
                    "endTime": "12:30",
                    "cost": 30000,
                    "type": "food",
                    "note": "Uống cà phê đá/nước dừa, nghỉ chân sau giờ đi bộ.",
                    "day": d
                }
                side_effects.append(ChatAction(type="add_activity", payload=coffee_payload))
                activity_counter += 1
                content += f"\n  - 11:30 - 12:30: Nghỉ ngơi & Cà phê thư giãn"

                # 4. Lunch (12:30 - 13:30)
                lunch_name = "Thưởng thức bữa trưa đặc sản"
                lunch_addr = dest_info['name']
                if food_spots:
                    fs = food_spots[(d + 1) % len(food_spots)]
                    lunch_name = f"Ăn trưa tại {fs['name']}"
                    lunch_addr = fs.get('address', dest_info['name'])
                    
                lunch_payload = {
                    "id": f"act-{activity_counter}-auto",
                    "name": lunch_name,
                    "address": lunch_addr,
                    "startTime": "12:30",
                    "endTime": "13:30",
                    "cost": 100000,
                    "type": "food",
                    "note": "Nạp năng lượng cho buổi chiều.",
                    "day": d
                }
                side_effects.append(ChatAction(type="add_activity", payload=lunch_payload))
                activity_counter += 1
                content += f"\n  - 12:30 - 13:30: {lunch_name}"

                # 5. Afternoon Sightseeing (14:00 - 16:30)
                afternoon_spot = sight_spots[spot_idx % len(sight_spots)]
                spot_idx += 1
                
                afternoon_payload = {
                    "id": f"act-{activity_counter}-auto",
                    "name": afternoon_spot["name"],
                    "address": afternoon_spot.get("address", dest_info['name']),
                    "startTime": "14:00",
                    "endTime": "16:30",
                    "cost": afternoon_spot.get("price", 0) if isinstance(afternoon_spot.get("price"), (int, float)) else 0,
                    "type": "sightseeing",
                    "note": afternoon_spot.get("description", "Điểm tham quan hấp dẫn.")[:100],
                    "day": d
                }
                side_effects.append(ChatAction(type="add_activity", payload=afternoon_payload))
                activity_counter += 1
                content += f"\n  - 14:00 - 16:30: {afternoon_spot['name']}"
                
                if len(actions) < 3:
                    actions.append(ActionButton(
                        label=f"➕ Ngày {d}: {afternoon_spot['name'][:12]}...",
                        variant="add",
                        chatAction=ChatAction(type="add_activity", payload=afternoon_payload)
                    ))

                # 6. Afternoon Rest (16:30 - 17:30)
                tea_payload = {
                    "id": f"act-{activity_counter}-auto",
                    "name": "Nghỉ ngơi và uống trà chiều",
                    "address": dest_info['name'],
                    "startTime": "16:30",
                    "endTime": "17:30",
                    "cost": 25000,
                    "type": "food",
                    "note": "Nghỉ ngơi thư giãn trước khi đi ăn tối.",
                    "day": d
                }
                side_effects.append(ChatAction(type="add_activity", payload=tea_payload))
                activity_counter += 1
                content += f"\n  - 16:30 - 17:30: Nghỉ ngơi & Trà chiều"

                # 7. Dinner (18:30 - 20:30)
                dinner_name = "Ăn tối & dạo chơi đêm"
                dinner_addr = dest_info['name']
                if food_spots:
                    fs = food_spots[(d + 2) % len(food_spots)]
                    dinner_name = f"Ăn tối tại {fs['name']}"
                    dinner_addr = fs.get('address', dest_info['name'])
                    
                dinner_payload = {
                    "id": f"act-{activity_counter}-auto",
                    "name": dinner_name,
                    "address": dinner_addr,
                    "startTime": "18:30",
                    "endTime": "20:30",
                    "cost": 150000,
                    "type": "food",
                    "note": "Kết thúc ngày bằng ẩm thực ngon miệng.",
                    "day": d
                }
                side_effects.append(ChatAction(type="add_activity", payload=dinner_payload))
                activity_counter += 1
                content += f"\n  - 18:30 - 20:30: {dinner_name}"

            content += "\n\n*(Tôi đã tự động tạo lịch trình hoàn chỉnh với các khoảng nghỉ, ăn uống và thêm chúng vào kế hoạch của bạn bên phải!)*"
            return BackendAgentResponse(content=content, actions=actions, sideEffects=side_effects)
        else:
            # Fallback to conversational response
            weather_desc = f"\nThời tiết hiện tại ở {dest_info['name']}: {weather_str}." if weather_info else ""
            content = f"👋 Chào bạn! Tại **{dest_info['name']}** có rất nhiều điểm tham quan thú vị và ẩm thực đặc trưng.\n{weather_desc}\n\n"
            
            # Suggest popular spots
            content += "📍 **Một số địa điểm vui chơi nổi bật:**\n"
            spots_to_add = (local_spots + overpass_spots)
            seen = set()
            unique_spots = []
            for s in spots_to_add:
                if s['name'] not in seen:
                    unique_spots.append(s)
                    seen.add(s['name'])
            
            if unique_spots:
                for idx, s in enumerate(unique_spots[:6]):
                    addr_str = f" ({s['address']})" if s.get('address') else ""
                    content += f"- **{s['name']}**{addr_str}\n"
            else:
                content += "- Khu du lịch trung tâm\n- Chợ truyền thống địa phương\n- Công viên & phố đi bộ\n"
                
            content += f"\nNếu bạn muốn lên lịch trình chi tiết cho chuyến đi, hãy nhắn ví dụ: **\"Lập lịch {dest_info['name']} 3 ngày\"** nhé!"
            
            actions = [
                ActionButton(
                    label=f"📅 Lập lịch {dest_info['name']} 3 ngày",
                    variant="primary",
                    chatAction=ChatAction(type="start_planning", payload={"destination": dest_info["name"], "days": 3, "clearDefaults": True})
                )
            ]
            return BackendAgentResponse(content=content, actions=actions, sideEffects=[])

    # General Fallback
    return BackendAgentResponse(
        content="Tôi chưa hiểu rõ địa điểm bạn muốn đi. Bạn có thể nói cụ thể hơn không, ví dụ: \"Lập lịch Đà Nẵng 3 ngày\" hoặc \"Thời tiết Hội An thế nào?\"",
        actions=[
            ActionButton(
                label="🗺️ Gợi ý điểm du lịch",
                variant="secondary",
                chatAction=ChatAction(type="highlight_spot", payload="")
            )
        ]
    )

async def query_llm(prompt: str, system_prompt: str) -> Optional[str]:
    ollama_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    ollama_model = os.environ.get("OLLAMA_MODEL", "qwen")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    # 1. Try Ollama (Local Qwen)
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{ollama_url}/chat/completions",
                json={
                    "model": ollama_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "num_predict": 8192,
                    "num_ctx": 8192,
                    "response_format": {"type": "json_object"}
                }
            )
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Ollama connection failed: {e}")
        
    # 2. Try Gemini API
    if gemini_key:
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"System Instruction: {system_prompt}\n\nUser Query: {prompt}"}
                        ]
                    }],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    return result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini API query failed: {e}")
            
    # 3. Try OpenAI API
    if openai_key:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "response_format": {"type": "json_object"}
                    }
                )
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI API query failed: {e}")
            
    return None
