import { useState, useCallback, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { ChatbotPanel } from "./components/ChatbotPanel";
import { RightPanel } from "./components/RightPanel";

export interface Activity {
  id: string;
  type: string;
  name: string;
  address: string;
  startTime: string;
  endTime: string;
  cost: number;
  note: string;
  day?: number;
}

export interface AISuggestion {
  name: string;
  tag: string;
  img: string;
  reason: string;
  days: number;
  cost: string;
}

export interface TripState {
  destination: string;
  days: number;
  view: "home" | "itinerary";
  highlightedSpot: string | null;
  clearDefaults?: boolean;
  popularSpots?: string[];
  currentActivities?: { id: string; name: string; type: string; day?: number; startTime?: string; endTime?: string }[];
}

export interface ChatAction {
  type:
    | "start_planning"
    | "add_activity"
    | "replace_activity"
    | "remove_activity"
    | "highlight_spot"
    | "set_destination"
    | "set_days"
    | "suggest_destinations";
  payload: unknown;
}

const initialTrip: TripState = {
  destination: "",
  days: 3,
  view: "home",
  highlightedSpot: null,
};

export default function App() {
  const [trip, setTrip] = useState<TripState>(initialTrip);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [chatHighlight, setChatHighlight] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [currentActivities, setCurrentActivities] = useState<Activity[]>([]);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChatAction = useCallback((action: ChatAction) => {
    switch (action.type) {
      case "start_planning": {
        const { destination, days, clearDefaults, popularSpots } = action.payload as { destination: string; days: number; clearDefaults?: boolean; popularSpots?: string[] };
        setTrip({ destination, days, view: "itinerary", highlightedSpot: null, clearDefaults, popularSpots });
        setPendingActivities([]);
        break;
      }
      case "set_destination": {
        setTrip((prev) => ({ ...prev, destination: action.payload as string, highlightedSpot: null }));
        break;
      }
      case "set_days": {
        setTrip((prev) => ({ ...prev, days: action.payload as number }));
        break;
      }
      case "add_activity": {
        const act = action.payload as Activity;
        setPendingActivities((prev) => [...prev, act]);
        setChatHighlight(act.name);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => setChatHighlight(null), 3000);
        break;
      }
      case "replace_activity": {
        const { matchName, newActivity } = action.payload as { matchName: string; newActivity: Activity };
        const replaceAct: Activity = { ...newActivity, id: `replace-${Date.now()}`, note: `__replace__${matchName}` };
        setPendingActivities((prev) => [...prev, replaceAct]);
        setChatHighlight(newActivity.name);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => setChatHighlight(null), 3000);
        break;
      }
      case "remove_activity": {
        const { matchName } = action.payload as { matchName: string };
        const removeAct: Activity = { id: `remove-${Date.now()}`, type: "__remove__", name: matchName, address: "", startTime: "", endTime: "", cost: 0, note: `__remove__${matchName}` };
        setPendingActivities((prev) => [...prev, removeAct]);
        break;
      }
      case "highlight_spot": {
        const spot = action.payload as string;
        if (spot) {
          setTrip((prev) => ({ ...prev, highlightedSpot: spot }));
          setTimeout(() => setTrip((prev) => ({ ...prev, highlightedSpot: null })), 3000);
        }
        break;
      }
      case "suggest_destinations": {
        setAiSuggestions(action.payload as AISuggestion[]);
        break;
      }
    }
  }, []);

  const handleStartPlanning = useCallback((destination: string, days: number) => {
    setTrip({ destination, days, view: "itinerary", highlightedSpot: null });
    setPendingActivities([]);
    setCurrentActivities([]);
  }, []);

  const handleActivitiesChange = useCallback((activities: Activity[]) => {
    setCurrentActivities(activities);
  }, []);

  const handleBack = useCallback(() => {
    setTrip(initialTrip);
    setPendingActivities([]);
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar onNewTrip={handleBack} />
      <main className="flex-1 pt-14 flex overflow-hidden">
        <div className="w-[380px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
          <ChatbotPanel
            trip={{
              ...trip,
              currentActivities: currentActivities.map((a) => ({
                id: a.id, name: a.name, type: a.type,
                day: a.day, startTime: a.startTime, endTime: a.endTime,
              }))
            }}
            onAction={handleChatAction}
          />
        </div>
        <div className="flex-1 overflow-y-auto h-full">
          <RightPanel
            trip={trip}
            pendingActivities={pendingActivities}
            chatHighlight={chatHighlight}
            aiSuggestions={aiSuggestions}
            onStartPlanning={handleStartPlanning}
            onBack={handleBack}
            onClearPending={() => setPendingActivities([])}
            onActivitiesChange={handleActivitiesChange}
          />
        </div>
      </main>
    </div>
  );
}
