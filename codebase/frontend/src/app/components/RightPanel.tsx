import { HeroSection } from "./HeroSection";
import { ItineraryPage } from "./ItineraryPage";
import type { TripState, Activity, AISuggestion } from "../App";

interface RightPanelProps {
  trip: TripState;
  pendingActivities: Activity[];
  chatHighlight: string | null;
  aiSuggestions: AISuggestion[];
  onStartPlanning: (destination: string, days: number) => void;
  onBack: () => void;
  onClearPending: () => void;
  onActivitiesChange?: (activities: Activity[]) => void;
}

export function RightPanel({
  trip, pendingActivities, chatHighlight, aiSuggestions,
  onStartPlanning, onBack, onClearPending, onActivitiesChange,
}: RightPanelProps) {
  if (trip.view === "itinerary") {
    return (
      <ItineraryPage
        key={`${trip.destination}-${trip.days}`}
        destination={trip.destination}
        days={trip.days}
        onBack={onBack}
        pendingActivities={pendingActivities}
        chatHighlight={chatHighlight}
        onClearPending={onClearPending}
        clearDefaults={trip.clearDefaults}
        popularSpots={trip.popularSpots}
        onActivitiesChange={onActivitiesChange}
      />
    );
  }

  return (
    <HeroSection
      onStartPlanning={onStartPlanning}
      aiSuggestions={aiSuggestions}
    />
  );
}
