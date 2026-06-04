import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Clock, MapPin, DollarSign, ChevronDown, ChevronUp, Camera, Utensils, Hotel, Landmark, Bus, X, Star, Edit3, Share2, Sparkles, Route, GripVertical } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { Activity } from "../App";
import { RouteMapView } from "./RouteMapView";

interface Day {
  id: string;
  label: string;
  city: string;
  activities: Activity[];
  expanded: boolean;
}

interface OtherCost {
  id: string;
  name: string;
  amount: number;
}

interface ItineraryPageProps {
  destination: string;
  days: number;
  onBack: () => void;
  pendingActivities: Activity[];
  chatHighlight: string | null;
  onClearPending: () => void;
  clearDefaults?: boolean;
  popularSpots?: string[];
  onActivitiesChange?: (activities: Activity[]) => void;
}

const ACTIVITY_TYPES = [
  { value: "sightseeing", label: "Tham quan", icon: Landmark },
  { value: "food", label: "Ẩm thực", icon: Utensils },
  { value: "hotel", label: "Lưu trú", icon: Hotel },
  { value: "transport", label: "Di chuyển", icon: Bus },
  { value: "photo", label: "Chụp ảnh", icon: Camera },
];

const TYPE_COLORS: Record<string, string> = {
  sightseeing: "bg-blue-100 text-blue-600",
  food: "bg-green-100 text-green-600",
  hotel: "bg-purple-100 text-purple-600",
  transport: "bg-yellow-100 text-yellow-600",
  photo: "bg-pink-100 text-pink-600",
};

const POPULAR_SPOTS: Record<string, string[]> = {
  "Hà Nội": ["Hồ Hoàn Kiếm", "Văn Miếu", "Phố cổ Hà Nội", "Lăng Bác", "Bảo tàng HCM", "Chùa Một Cột"],
  "Đà Nẵng": ["Bãi biển Mỹ Khê", "Cầu Rồng", "Ngũ Hành Sơn", "Bà Nà Hills", "Cầu Vàng", "Bảo tàng Chăm"],
  "Hội An": ["Phố cổ Hội An", "Cù Lao Chàm", "Làng rau Trà Quế", "Rừng dừa Bảy Mẫu", "Cầu Nhật Bản"],
  "Hạ Long": ["Hang Sửng Sốt", "Đảo Ti Tốp", "Hang Đầu Gỗ", "Đảo Tuần Châu", "Hang Thiên Cung"],
  "Sa Pa": ["Đỉnh Fansipan", "Bản Cát Cát", "Thung lũng Mường Hoa", "Bản Lao Chải", "Chợ phiên Sa Pa"],
  "Phú Quốc": ["Sunset Town", "VinWonders", "Cáp treo Hòn Thơm", "Làng chài Hàm Ninh", "Chợ đêm Dinh Cậu"],
};

const SPOT_IMAGES = [
  "1593994602837-530142086918",
  "1543355890-20bc0a26fda1",
  "1569271532956-3fb81a207115",
  "1732243395944-cb3ff9311091",
  "1780236250852-3971a716cdb7",
  "1603269231725-4ea1da7d02fd",
];

const DEFAULT_ACTIVITIES: Record<string, Omit<Activity, "id">[]> = {
  "Hà Nội": [
    { type: "sightseeing", name: "Hồ Hoàn Kiếm & Tháp Rùa", address: "Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội", startTime: "08:00", endTime: "10:00", cost: 0, note: "" },
    { type: "food", name: "Bún chả Hương Liên", address: "24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội", startTime: "12:00", endTime: "13:00", cost: 70000, note: "" },
    { type: "sightseeing", name: "Văn Miếu - Quốc Tử Giám", address: "58 Quốc Tử Giám, Đống Đa, Hà Nội", startTime: "14:00", endTime: "16:00", cost: 30000, note: "" },
  ],
  "Đà Nẵng": [
    { type: "sightseeing", name: "Bãi biển Mỹ Khê", address: "Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng", startTime: "06:00", endTime: "08:30", cost: 0, note: "" },
    { type: "food", name: "Mì Quảng Bà Mua", address: "19/3 Trần Bình Trọng, Hải Châu, Đà Nẵng", startTime: "07:00", endTime: "08:00", cost: 45000, note: "" },
    { type: "sightseeing", name: "Ngũ Hành Sơn", address: "Non Nước, Ngũ Hành Sơn, Đà Nẵng", startTime: "09:00", endTime: "11:30", cost: 40000, note: "" },
  ],
  "Hội An": [
    { type: "sightseeing", name: "Phố cổ Hội An", address: "Minh An, Hội An, Quảng Nam", startTime: "08:00", endTime: "12:00", cost: 120000, note: "" },
    { type: "food", name: "Cao lầu Bà Bé", address: "26 Thái Phiên, Hội An", startTime: "12:00", endTime: "13:00", cost: 50000, note: "" },
  ],
};

function generateDays(destination: string, numDays: number, clearDefaults?: boolean): Day[] {
  const acts = clearDefaults ? [] : (DEFAULT_ACTIVITIES[destination] || []);
  return Array.from({ length: numDays }, (_, i) => ({
    id: `day-${i + 1}`,
    label: `Ngày ${i + 1}`,
    city: destination,
    expanded: i === 0,
    activities: i === 0 ? acts.map((a, j) => ({ ...a, id: `init-${j}` })) : [],
  }));
}

interface AddActivityModalProps {
  onClose: () => void;
  onAdd: (a: Omit<Activity, "id">) => void;
  destination: string;
}

function AddActivityModal({ onClose, onAdd, destination }: AddActivityModalProps) {
  const [type, setType] = useState("sightseeing");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [cost, setCost] = useState(0);

  const spots = POPULAR_SPOTS[destination] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Thêm hoạt động</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Loại hoạt động</label>
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${type === t.value ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                  <t.icon className="w-3 h-3" />{t.label}
                </button>
              ))}
            </div>
          </div>
          {spots.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Điểm phổ biến</label>
              <div className="flex gap-2 flex-wrap">
                {spots.slice(0, 5).map((s) => (
                  <button key={s} type="button" onClick={() => setName(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${name === s ? "bg-orange-100 border-orange-400 text-orange-700" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tên hoạt động *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Từ</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Đến</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Địa chỉ</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nhập địa chỉ..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Chi phí (VNĐ)</label>
            <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Hủy</button>
            <button
              onClick={() => { if (name.trim()) { onAdd({ type, name, address, startTime, endTime, cost, note: "" }); onClose(); } }}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditActivityModalProps {
  activity: Activity;
  onClose: () => void;
  onSave: (updated: Activity) => void;
  destination: string;
}

function EditActivityModal({ activity, onClose, onSave, destination }: EditActivityModalProps) {
  const [type, setType] = useState(activity.type);
  const [name, setName] = useState(activity.name);
  const [address, setAddress] = useState(activity.address);
  const [startTime, setStartTime] = useState(activity.startTime);
  const [endTime, setEndTime] = useState(activity.endTime);
  const [cost, setCost] = useState(activity.cost);
  const [note, setNote] = useState(activity.note);

  const spots = POPULAR_SPOTS[destination] || [];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ ...activity, type, name, address, startTime, endTime, cost, note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
              <Edit3 className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-sm leading-tight">Chỉnh sửa hoạt động</h2>
              <p className="text-xs text-gray-400 leading-tight truncate max-w-[200px]">{activity.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wide">Loại hoạt động</label>
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    type === t.value
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  <t.icon className="w-3 h-3" />{t.label}
                </button>
              ))}
            </div>
          </div>

          {spots.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wide">Chọn nhanh điểm đến</label>
              <div className="flex gap-1.5 flex-wrap">
                {spots.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setName(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      name === s
                        ? "bg-orange-100 border-orange-400 text-orange-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-orange-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Tên hoạt động *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên hoạt động..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Bắt đầu</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Kết thúc</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-400" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Địa chỉ</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-orange-400" />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Chi phí (VNĐ)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-400" />
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                placeholder="0"
                min={0}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            {cost === 0 && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                Miễn phí
              </p>
            )}
            {cost > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                = {cost.toLocaleString("vi-VN")}đ
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm ghi chú cho hoạt động này..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityTypeIcon({ type }: { type: string }) {
  const t = ACTIVITY_TYPES.find((a) => a.value === type);
  if (!t) return <Landmark className="w-4 h-4" />;
  return <t.icon className="w-4 h-4" />;
}

const DRAG_TYPE = "ACTIVITY";

interface DragItem {
  idx: number;
}

interface DraggableActivityProps {
  act: Activity;
  idx: number;
  totalInDay: number;
  isNew: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
}

function DraggableActivity({ act, idx, totalInDay, isNew, onEdit, onRemove, onReorder }: DraggableActivityProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: DRAG_TYPE,
    item: { idx },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item) {
      if (item.idx === idx) return;
      onReorder(item.idx, idx);
      item.idx = idx;
    },
  });

  drag(handleRef);
  drop(cardRef);

  return (
    <div
      ref={cardRef}
      className={`flex gap-3 group transition-all duration-300 ${
        isNew ? "ring-2 ring-green-400 rounded-xl bg-green-50" : ""
      } ${isDragging ? "opacity-30 scale-95" : ""} ${
        isOver && !isDragging ? "ring-2 ring-orange-300 rounded-xl" : ""
      }`}
    >
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[act.type] || "bg-gray-100 text-gray-600"}`}>
          <ActivityTypeIcon type={act.type} />
        </div>
        {idx < totalInDay - 1 && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[20px]" />}
      </div>
      <div className="flex-1 bg-gray-50 rounded-xl p-3 group-hover:bg-orange-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-800 text-sm truncate">{act.name}</p>
              {isNew && (
                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> AI thêm
                </span>
              )}
            </div>
            {act.address && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-400 truncate">{act.address}</p>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{act.startTime}–{act.endTime}</span>
              </div>
              {act.cost > 0 && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">{act.cost.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {/* Drag handle */}
              <div
                ref={handleRef}
                title="Kéo để sắp xếp"
                className="flex items-center gap-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-orange-400 transition-colors ml-1 select-none"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2 flex-shrink-0 transition-all">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-orange-100 hover:text-orange-600 rounded-lg transition-colors text-gray-400"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors text-gray-400"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItineraryPage({ destination, days, onBack, pendingActivities, chatHighlight, onClearPending, clearDefaults, popularSpots: initialPopularSpots, onActivitiesChange }: ItineraryPageProps) {
  const [daysList, setDaysList] = useState<Day[]>(() => generateDays(destination, days, clearDefaults));
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<{ dayId: string; activity: Activity } | null>(null);
  const [routeMapDay, setRouteMapDay] = useState<Day | null>(null);
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([]);
  const [budget, setBudget] = useState(5000000);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [newlyAdded, setNewlyAdded] = useState<Set<string>>(new Set());
  // Dynamic popular spots: seeded from LLM payload, then fetched from /api/spots
  const staticSpots = POPULAR_SPOTS[destination];
  const [dynamicSpots, setDynamicSpots] = useState<string[]>(
    initialPopularSpots?.length ? initialPopularSpots : (staticSpots || [])
  );

  // Fetch spots from backend for non-hardcoded or empty destinations
  useEffect(() => {
    if (staticSpots && !initialPopularSpots?.length) return; // already have static data
    if (initialPopularSpots?.length) {
      setDynamicSpots(initialPopularSpots);
      return;
    }
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    fetch(`${backendUrl.replace(/\/$/, "")}/api/spots?destination=${encodeURIComponent(destination)}`)
      .then((r) => r.json())
      .then((data: { spots: Array<{ name: string }> }) => {
        if (data.spots?.length) {
          setDynamicSpots(data.spots.map((s) => s.name));
        }
      })
      .catch(() => {}); // silently fail, carousel stays with defaults
  }, [destination, initialPopularSpots]);

  // Notify parent of activity changes for chat context
  useEffect(() => {
    const allActivities = daysList.flatMap((d) =>
      d.activities.map((a) => ({ ...a, day: parseInt(d.id.replace('day-', '')) }))
    );
    onActivitiesChange?.(allActivities);
  }, [daysList, onActivitiesChange]);

  useEffect(() => {
    if (pendingActivities.length === 0) return;
    setDaysList((prev) => {
      const updated = prev.map(d => ({ ...d, activities: [...d.activities] }));
      pendingActivities.forEach((pa) => {
        // Handle remove via __remove__ marker
        if (pa.type === "__remove__" && pa.note.startsWith("__remove__")) {
          const matchName = pa.note.replace("__remove__", "");
          updated.forEach((d) => {
            d.activities = d.activities.filter((a) => a.name !== matchName);
          });
          return;
        }
        // Handle replace via __replace__ marker
        if (pa.note.startsWith("__replace__")) {
          const matchName = pa.note.replace("__replace__", "");
          let replaced = false;
          updated.forEach((d) => {
            const idx = d.activities.findIndex((a) => a.name === matchName);
            if (idx !== -1 && !replaced) {
              d.activities[idx] = { ...pa, id: d.activities[idx].id, note: "" };
              d.expanded = true;
              replaced = true;
            }
          });
          if (!replaced) {
            // Not found – just add it to the right day
            const targetIdx = pa.day && pa.day > 0 && pa.day <= updated.length ? pa.day - 1 : 0;
            updated[targetIdx].activities.push({ ...pa, note: "" });
            updated[targetIdx].expanded = true;
          }
          return;
        }
        // Normal add
        const targetIdx = pa.day && pa.day > 0 && pa.day <= updated.length ? pa.day - 1 : 0;
        const day = updated[targetIdx];
        if (!day.activities.some((a) => a.name === pa.name)) {
          day.activities.push(pa);
          day.expanded = true;
        }
      });
      
      updated.forEach((d) => {
        d.activities.sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
      });
      
      return updated;
    });
    setNewlyAdded((prev) => {
      const next = new Set(prev);
      pendingActivities.forEach((a) => next.add(a.id));
      return next;
    });
    onClearPending();
    setTimeout(() => setNewlyAdded(new Set()), 3000);
  }, [pendingActivities, onClearPending]);

  const toggleDay = (id: string) =>
    setDaysList((prev) => prev.map((d) => d.id === id ? { ...d, expanded: !d.expanded } : d));

  const timeToMins = (t: string) => {
    if (!t) return Number.MAX_SAFE_INTEGER;
    const parts = t.split(":");
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
  };

  const addActivity = (dayId: string, act: Omit<Activity, "id">) => {
    const newAct = { ...act, id: Date.now().toString() };
    setDaysList((prev) => prev.map((d) => {
      if (d.id === dayId) {
        const sorted = [...d.activities, newAct].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
        return { ...d, activities: sorted };
      }
      return d;
    }));
    setNewlyAdded((prev) => { const n = new Set(prev); n.add(newAct.id); return n; });
    setTimeout(() => setNewlyAdded((prev) => { const n = new Set(prev); n.delete(newAct.id); return n; }), 3000);
  };

  const removeActivity = (dayId: string, actId: string) =>
    setDaysList((prev) => prev.map((d) => d.id === dayId ? { ...d, activities: d.activities.filter((a) => a.id !== actId) } : d));

  const updateActivity = (dayId: string, updated: Activity) =>
    setDaysList((prev) => prev.map((d) => {
      if (d.id === dayId) {
        const sorted = d.activities.map((a) => a.id === updated.id ? updated : a).sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
        return { ...d, activities: sorted };
      }
      return d;
    }));

  const reorderActivities = (dayId: string, fromIdx: number, toIdx: number) => {
    setDaysList((prev) => prev.map((d) => {
      if (d.id !== dayId) return d;
      const acts = [...d.activities];
      const [moved] = acts.splice(fromIdx, 1);
      acts.splice(toIdx, 0, moved);
      return { ...d, activities: acts };
    }));
  };

  const addDay = () => {
    setDaysList((prev) => {
      const nextNum = prev.length + 1;
      return [...prev, {
        id: `day-${nextNum}`,
        label: `Ngày ${nextNum}`,
        city: destination,
        expanded: true,
        activities: [],
      }];
    });
  };

  const deleteDay = (dayId: string) => {
    setDaysList((prev) => {
      const filtered = prev.filter((d) => d.id !== dayId);
      // Re-number labels
      return filtered.map((d, i) => ({ ...d, label: `Ngày ${i + 1}` }));
    });
  };

  const totalCost = daysList.flatMap((d) => d.activities).reduce((s, a) => s + a.cost, 0)
    + otherCosts.reduce((s, c) => s + c.amount, 0);
  const budgetPct = Math.min((totalCost / budget) * 100, 100);

  const DEST_INFO: Record<string, { rating: number; reviews: number; bestTime: string }> = {
    "Hà Nội": { rating: 4.7, reviews: 12400, bestTime: "T9–11 & T3–5" },
    "Đà Nẵng": { rating: 4.8, reviews: 18200, bestTime: "T2–8" },
    "Hội An": { rating: 4.9, reviews: 21000, bestTime: "T2–4" },
    "Hạ Long": { rating: 4.8, reviews: 15000, bestTime: "T4–6 & T9–10" },
    "Sa Pa": { rating: 4.6, reviews: 9800, bestTime: "T9–11 & T3–5" },
    "Phú Quốc": { rating: 4.7, reviews: 16200, bestTime: "T11–4" },
  };
  const info = DEST_INFO[destination] || { rating: 4.6, reviews: 8000, bestTime: "T3–8" };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-full bg-gray-50">
        {/* Sticky trip header */}
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-gray-400 hover:text-orange-500 transition-colors text-sm">← Quay lại</button>
              <div className="w-px h-4 bg-gray-200" />
              <div>
                <h1 className="font-bold text-gray-800 text-sm">{destination} • {days} ngày {days - 1} đêm</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= Math.round(info.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}
                  </div>
                  <span className="text-xs text-gray-400">{info.rating} • {info.reviews.toLocaleString()} đánh giá • Đẹp nhất: {info.bestTime}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><Share2 className="w-4 h-4" /></button>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" />Hoàn tất
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left: days */}
          <div className="xl:col-span-2 space-y-4">

            {chatHighlight && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">AI đã thêm <strong>{chatHighlight}</strong> vào lịch trình!</p>
              </div>
            )}

            {/* Popular spots carousel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                Điểm đến phổ biến tại {destination}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {(dynamicSpots.length > 0 ? dynamicSpots : ["Khu trung tâm","Chợ địa phương","Công viên"]).map((spot, i) => (
                  <div key={spot} className="flex-shrink-0 w-24 cursor-pointer group">
                    <div className="w-24 h-16 rounded-lg overflow-hidden mb-1.5">
                      <img
                        src={`https://images.unsplash.com/photo-${SPOT_IMAGES[i % SPOT_IMAGES.length]}?w=200&q=70`}
                        alt={spot}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">4.{5 + (i % 5)}</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium truncate">{spot}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Day cards */}
            {daysList.map((day) => (
              <div key={day.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-0">
                  <button
                    onClick={() => toggleDay(day.id)}
                    className="flex-1 flex items-center gap-3 py-1 text-left"
                  >
                    <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{day.label}</span>
                    <span className="text-sm text-gray-500">{day.city}</span>
                    {day.activities.some((a) => newlyAdded.has(a.id)) && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Vừa cập nhật
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2 py-1">
                    {day.activities.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setRouteMapDay(day); }}
                        className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-500 border border-orange-200 hover:border-orange-500 text-orange-600 hover:text-white text-xs px-3 py-1.5 rounded-full font-medium transition-all group"
                      >
                        <Route className="w-3.5 h-3.5" />
                        Xem lộ trình
                      </button>
                    )}
                    <button onClick={() => toggleDay(day.id)} className="flex items-center gap-1 text-xs text-gray-400 px-1">
                      <span>{day.activities.length} điểm</span>
                      {day.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {daysList.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Xóa ${day.label}? Các hoạt động trong ngày này sẽ bị mất.`)) deleteDay(day.id); }}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-300 transition-colors"
                        title="Xóa ngày"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {day.expanded && (
                  <div className="border-t border-gray-50 px-4 pb-4">
                    {day.activities.length === 0 && (
                      <p className="text-sm text-gray-400 italic py-4 text-center">Chưa có hoạt động. Hỏi AI chatbot để gợi ý!</p>
                    )}
                    <div className="space-y-3 mt-3">
                      {day.activities.map((act, idx) => (
                        <DraggableActivity
                          key={act.id}
                          act={act}
                          idx={idx}
                          totalInDay={day.activities.length}
                          isNew={newlyAdded.has(act.id)}
                          onEdit={() => setEditingActivity({ dayId: day.id, activity: act })}
                          onRemove={() => removeActivity(day.id, act.id)}
                          onReorder={(from, to) => reorderActivities(day.id, from, to)}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setAddingToDay(day.id)}
                      className="mt-3 flex items-center gap-2 text-orange-500 text-sm font-medium hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors w-full"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm hoạt động mới
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add Day button */}
            <button
              onClick={addDay}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-orange-200 hover:border-orange-400 rounded-xl text-orange-500 hover:text-orange-600 hover:bg-orange-50 text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm ngày mới
            </button>

            {/* Other costs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">Chi phí khác</h3>
                <button
                  onClick={() => {
                    const name = prompt("Tên chi phí:"); if (!name) return;
                    const amount = Number(prompt("Số tiền (VNĐ):") || 0);
                    setOtherCosts((p) => [...p, { id: Date.now().toString(), name, amount }]);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Thêm
                </button>
              </div>
              {otherCosts.length === 0
                ? <p className="text-sm text-gray-400 italic">Taxi, tiền bo, mua sắm...</p>
                : otherCosts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.amount.toLocaleString("vi-VN")}đ</span>
                      <button onClick={() => setOtherCosts((p) => p.filter((x) => x.id !== c.id))} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Right: Budget */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h3 className="font-bold text-gray-800 mb-4">Ngân sách</h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Tổng chi phí thực tế</p>
                <p className="text-2xl font-bold text-gray-800">{totalCost.toLocaleString("vi-VN")}</p>
                <p className="text-xs text-gray-500">đồng</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Đã chi</span>
                    <span className={budgetPct > 90 ? "text-red-500" : "text-orange-500"}>{budgetPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${budgetPct > 90 ? "bg-red-500" : "bg-orange-500"}`} style={{ width: `${budgetPct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Ngân sách: {budget.toLocaleString("vi-VN")}đ</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {daysList.map((d) => {
                  const cost = d.activities.reduce((s, a) => s + a.cost, 0);
                  if (cost === 0) return null;
                  return (
                    <div key={d.id} className="flex justify-between">
                      <span className="text-gray-500">{d.label}</span>
                      <span className="font-medium">{cost.toLocaleString("vi-VN")}đ</span>
                    </div>
                  );
                })}
                {otherCosts.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chi phí khác</span>
                    <span className="font-medium">{otherCosts.reduce((s, c) => s + c.amount, 0).toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
                  <span>Tổng</span>
                  <span className="text-orange-500">{totalCost.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              {showBudgetInput ? (
                <div className="flex gap-2">
                  <input type="number" defaultValue={budget} onChange={(e) => setBudget(Number(e.target.value))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />
                  <button onClick={() => setShowBudgetInput(false)} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm">OK</button>
                </div>
              ) : (
                <button onClick={() => setShowBudgetInput(true)}
                  className="w-full text-sm text-gray-500 hover:text-orange-500 border border-dashed border-gray-200 py-2 rounded-lg hover:border-orange-300 transition-colors flex items-center justify-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" />Thêm ngân sách dự kiến
                </button>
              )}

              <div className="mt-4 bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-xs text-orange-700 font-medium flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Mẹo từ AI
                </p>
                <p className="text-xs text-orange-600">Hỏi chatbot bên trái để tôi tự động thêm địa điểm vào lịch trình cho bạn!</p>
              </div>
            </div>
          </div>
        </div>

        {addingToDay && (
          <AddActivityModal
            onClose={() => setAddingToDay(null)}
            onAdd={(a) => addActivity(addingToDay, a)}
            destination={destination}
          />
        )}

        {editingActivity && (
          <EditActivityModal
            activity={editingActivity.activity}
            onClose={() => setEditingActivity(null)}
            onSave={(updated) => {
              updateActivity(editingActivity.dayId, updated);
              setEditingActivity(null);
            }}
            destination={destination}
          />
        )}

        {routeMapDay && (
          <RouteMapView
            dayLabel={routeMapDay.label}
            destination={destination}
            activities={routeMapDay.activities}
            onClose={() => setRouteMapDay(null)}
          />
        )}
      </div>
    </DndProvider>
  );
}
