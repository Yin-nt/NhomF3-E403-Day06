from pydantic import BaseModel
from typing import Optional, List, Any, Union

class Activity(BaseModel):
    id: str
    type: str  # e.g., "sightseeing", "food", "transportation", etc.
    name: str
    address: str
    startTime: str
    endTime: str
    cost: float
    note: str
    day: Optional[int] = None

class ActivitySummary(BaseModel):
    """Lightweight activity summary sent to backend for edit context."""
    id: str
    name: str
    type: str
    day: Optional[int] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None

class AISuggestion(BaseModel):
    name: str
    tag: str
    img: str
    reason: str
    days: int
    cost: str

class TripState(BaseModel):
    destination: str
    days: int
    view: str  # "home" | "itinerary"
    highlightedSpot: Optional[str] = None
    currentActivities: Optional[List[ActivitySummary]] = []

class ChatRequest(BaseModel):
    message: str
    trip: TripState

class ChatAction(BaseModel):
    type: str  # "start_planning", "add_activity", "replace_activity", "remove_activity", "highlight_spot", "set_destination", "set_days", "suggest_destinations"
    payload: Any  # Dict, List, String, Int depending on type

class ActionButton(BaseModel):
    label: str
    variant: str  # "primary", "secondary", "add"
    chatAction: ChatAction
    autoTriggerAfterMs: Optional[int] = None

class BackendAgentResponse(BaseModel):
    content: str
    actions: Optional[List[ActionButton]] = []
    sideEffects: Optional[List[ChatAction]] = []
