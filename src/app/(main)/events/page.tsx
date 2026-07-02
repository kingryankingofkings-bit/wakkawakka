"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  _PlusCircle, _Search, Calendar as CalendarIcon, MapPin, Users, _Filter, 
  _Clock, _MoreHorizontal, _UserCheck, _X, Globe, Plus, Star, Check, 
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { _format, _isSameDay } from "date-fns";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { apiFetch, apiGet } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { z } from "zod";

interface EventRow {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  location?: string;
  isOnline: boolean;
  category?: string;
  startsAt: string;
  endsAt?: string;
  goingCount: number;
  interestedCount: number;
  creator: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  attendees?: { status: string }[];
}

const FILTERS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "going", label: "Going" },
  { id: "hosting", label: "Hosting" },
  { id: "past", label: "Past" },
] as const;

export default function EventsPage() {
  const [filter, setFilter] = useState<string>("upcoming");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // View Mode: 'list' or 'calendar'
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Calendar Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState<EventRow[]>([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>("");

  // Attendees Modal State
  const [activeEventIdForAttendees, setActiveEventIdForAttendees] = useState<
    string | null
  >(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const serverEvents = await apiGet<EventRow[]>("/api/events", []);
      setEvents(serverEvents || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const isPast = new Date(e.startsAt).getTime() < Date.now();
      const myStatus = e.attendees?.[0]?.status;

      if (filter === "past") return isPast;
      if (filter === "upcoming") return !isPast;
      if (filter === "going") return myStatus === "GOING";
      if (filter === "hosting")
        return e.creator.id === "u_current" || e.creator.id === "u1"; // hosting fallback
      return true;
    });
  }, [events, filter]);

  // Calendar helper functions
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Fill previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Fill next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      const eDate = new Date(e.startsAt);
      return (
        eDate.getDate() === date.getDate() &&
        eDate.getMonth() === date.getMonth() &&
        eDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const selectDay = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    setSelectedDateEvents(dayEvents);
    setSelectedDayLabel(
      date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
    setSelectedDateEvents([]);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
    setSelectedDateEvents([]);
  };

  async function rsvp(eventId: string, status: "GOING" | "INTERESTED" | "MAYBE") {
    let selectedStatus: string | undefined = status;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const isCurrentStatus = e.attendees?.[0]?.status === status;
          selectedStatus = isCurrentStatus ? undefined : status;

          let goingOffset = 0;
          let interestedOffset = 0;

          const oldStatus = e.attendees?.[0]?.status;
          if (oldStatus === "GOING") goingOffset--;
          if (oldStatus === "INTERESTED" || oldStatus === "MAYBE") interestedOffset--; // Combine maybe/interested for counts if needed, but let's just use interested count

          if (selectedStatus === "GOING") goingOffset++;
          if (selectedStatus === "INTERESTED" || selectedStatus === "MAYBE") interestedOffset++;

          return {
            ...e,
            attendees: selectedStatus ? [{ status: selectedStatus }] : [],
            goingCount: Math.max(0, e.goingCount + goingOffset),
            interestedCount: Math.max(0, e.interestedCount + interestedOffset),
          };
        }
        return e;
      }),
    );

    if (selectedStatus) {
      toast.success(`Marked as ${selectedStatus.toLowerCase()}!`);
    } else {
      toast.success("RSVP removed");
    }

    try {
      await apiFetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ status: selectedStatus || "NONE" }),
      });
    } catch (err) {
      console.error("Failed to sync RSVP:", err);
      toast.error("Failed to sync with server");
    }
  }

  async function fetchAttendeesList(eventId: string) {
    setActiveEventIdForAttendees(eventId);
    setLoadingAttendees(true);
    try {
      const res = await apiGet<any[]>(`/api/events/${eventId}/attendees`, []);
      setAttendees(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendees(false);
    }
  }

  const handleCreateCreated = () => {
    load();
    setShowCreate(false);
    toast.success("Event created successfully!");
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Events</h1>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-muted/80 p-0.5 rounded-xl border border-border text-xs mr-2">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-bold transition-all",
                  viewMode === "list"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-bold transition-all",
                  viewMode === "calendar"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Calendar
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>
        {viewMode === "list" && (
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border active:scale-95",
                  filter === f.id
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === "list" ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <div className="flex justify-between mt-2">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-12 rounded-lg" />
                  </div>
                </div>
              ))}
            </>
          )}
          {!loading && filteredEvents.length === 0 && (
            <div className="col-span-full flex flex-col items-center py-20 text-center bg-card border border-border border-dashed rounded-3xl space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">
                  No events found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  No events matched your category filters. Create a new event to
                  get started.
                </p>
              </div>
            </div>
          )}
          {filteredEvents.map((e) => {
            const myStatus = e.attendees?.[0]?.status;
            return (
              <Card
                key={e.id}
                padding="none"
                className="overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="h-32 bg-gradient-to-br from-primary/30 to-purple-500/30 relative">
                  {e.coverImage && (
                    <img
                      src={e.coverImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-background/90 rounded-xl p-2 text-center shadow-md min-w-[40px] leading-tight">
                    <div className="text-[10px] uppercase text-primary font-extrabold">
                      {fmtMonth(e.startsAt)}
                    </div>
                    <div className="text-base font-extrabold text-foreground">
                      {fmtDay(e.startsAt)}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-card">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1 leading-tight">
                      {e.title}
                    </h3>
                    {e.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {e.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-1 pt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {e.isOnline ? (
                          <Globe className="h-3 w-3 text-primary" />
                        ) : (
                          <MapPin className="h-3 w-3 text-primary" />
                        )}
                        <span>
                          {e.isOnline
                            ? "Online via Wakka Live"
                            : e.location || "Location TBA"}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {fmtFull(e.startsAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => fetchAttendeesList(e.id)}
                      className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {e.goingCount} going · {e.interestedCount} interested
                    </button>
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant={myStatus === "GOING" ? "primary" : "outline"}
                        className="flex-1 text-xs py-1.5 h-8 font-semibold rounded-xl"
                        onClick={() => rsvp(e.id, "GOING")}
                      >
                        <Check className="h-3.5 w-3.5" /> Going
                      </Button>
                      <Button
                        size="xs"
                        variant={
                          myStatus === "INTERESTED" ? "primary" : "outline"
                        }
                        className="flex-1 text-xs py-1.5 h-8 font-semibold rounded-xl"
                        onClick={() => rsvp(e.id, "INTERESTED")}
                      >
                        <Star className="h-3.5 w-3.5" /> Interested
                      </Button>
                      <Button
                        size="xs"
                        variant={myStatus === "MAYBE" ? "primary" : "outline"}
                        className="flex-1 text-xs py-1.5 h-8 font-semibold rounded-xl"
                        onClick={() => rsvp(e.id, "MAYBE")}
                      >
                        Maybe
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Calendar View Mode */
        <div className="p-4 space-y-6">
          {/* Month Navigator Header */}
          <div className="flex items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
            <h2 className="text-base font-bold text-foreground">
              {currentDate.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card padding="md" className="overflow-hidden shadow-sm">
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground pb-2 border-b border-border">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Monthly grid cells */}
            <div className="grid grid-cols-7 gap-1 mt-2">
              {calendarDays.map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.date);
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => selectDay(cell.date)}
                    className={cn(
                      "aspect-square p-1 rounded-xl flex flex-col justify-between items-center transition-all border",
                      cell.isCurrentMonth
                        ? "bg-background hover:bg-muted/30 border-border/40"
                        : "bg-muted/20 border-transparent text-muted-foreground/50",
                      hasEvents ? "border-primary/50" : "",
                    )}
                  >
                    <span className="text-xs font-bold">
                      {cell.date.getDate()}
                    </span>

                    {/* Event Dots */}
                    {hasEvents && (
                      <div className="flex gap-1 mb-1">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse"
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Day Preview Section */}
          {selectedDayLabel && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground">
                Events on {selectedDayLabel}
              </h3>
              {selectedDateEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border border-dashed rounded-2xl">
                  No events scheduled for this day.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDateEvents.map((e) => {
                    const myStatus = e.attendees?.[0]?.status;
                    return (
                      <Card
                        key={e.id}
                        padding="md"
                        className="flex flex-col justify-between space-y-3 bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-sm text-foreground line-clamp-1 leading-tight">
                            {e.title}
                          </h4>
                          {e.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {e.description}
                            </p>
                          )}
                          <div className="flex flex-col gap-1 pt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {e.isOnline ? (
                                <Globe className="h-3 w-3 text-primary" />
                              ) : (
                                <MapPin className="h-3 w-3 text-primary" />
                              )}
                              <span>
                                {e.isOnline
                                  ? "Online via Wakka Live"
                                  : e.location || "Location TBA"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <button
                            onClick={() => fetchAttendeesList(e.id)}
                            className="text-[10px] text-primary hover:underline font-semibold"
                          >
                            {e.goingCount} going · {e.interestedCount}{" "}
                            interested
                          </button>
                          <div className="flex gap-2">
                            <Button
                              size="xs"
                              variant={
                                myStatus === "GOING" ? "primary" : "outline"
                              }
                              className="text-[10px] py-1 px-3 h-7 font-bold rounded-lg"
                              onClick={() => rsvp(e.id, "GOING")}
                            >
                              Going
                            </Button>
                            <Button
                              size="xs"
                              variant={
                                myStatus === "INTERESTED"
                                  ? "primary"
                                  : "outline"
                              }
                              className="text-[10px] py-1 px-3 h-7 font-bold rounded-lg"
                              onClick={() => rsvp(e.id, "INTERESTED")}
                            >
                              Interested
                            </Button>
                            <Button
                              size="xs"
                              variant={
                                myStatus === "MAYBE"
                                  ? "primary"
                                  : "outline"
                              }
                              className="text-[10px] py-1 px-3 h-7 font-bold rounded-lg"
                              onClick={() => rsvp(e.id, "MAYBE")}
                            >
                              Maybe
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreateCreated}
      />

      {/* Attendees Modal */}
      <Modal
        isOpen={!!activeEventIdForAttendees}
        onClose={() => setActiveEventIdForAttendees(null)}
        title="Event Attendees"
      >
        {loadingAttendees ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 p-1 max-h-[60vh] overflow-y-auto">
            {/* Going Group */}
            <div>
              <h4 className="text-xs font-bold text-success mb-2">
                Going ({attendees.filter((a) => a.status === "GOING").length})
              </h4>
              <div className="space-y-2">
                {attendees
                  .filter((a) => a.status === "GOING")
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <Avatar
                        src={a.user.avatar}
                        name={a.user.displayName}
                        size="xs"
                      />
                      <div>
                        <span className="text-xs font-bold block text-foreground">
                          {a.user.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          @{a.user.username}
                        </span>
                      </div>
                    </div>
                  ))}
                {attendees.filter((a) => a.status === "GOING").length === 0 && (
                  <div className="text-[10px] text-muted-foreground pl-2">
                    No attendees going yet.
                  </div>
                )}
              </div>
            </div>

            {/* Interested Group */}
            <div>
              <h4 className="text-xs font-bold text-primary mb-2">
                Interested (
                {attendees.filter((a) => a.status === "INTERESTED").length})
              </h4>
              <div className="space-y-2">
                {attendees
                  .filter((a) => a.status === "INTERESTED")
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <Avatar
                        src={a.user.avatar}
                        name={a.user.displayName}
                        size="xs"
                      />
                      <div>
                        <span className="text-xs font-bold block text-foreground">
                          {a.user.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          @{a.user.username}
                        </span>
                      </div>
                    </div>
                  ))}
                {attendees.filter((a) => a.status === "INTERESTED").length ===
                  0 && (
                  <div className="text-[10px] text-muted-foreground pl-2">
                    No interested users yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CreateEventModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    isOnline: false,
    startsAt: "",
    category: "",
  });
  const [_saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const eventSchema = z.object({
      title: z.string().min(1, "Event title is required").max(100, "Title is too long"),
      startsAt: z.string().min(1, "Start date and time is required"),
      description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
      location: z.string().max(100, "Location is too long").optional(),
    });

    const validation = eventSchema.safeParse(form);

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSaving(true);

    try {
      const res = await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onCreated();
      } else {
        toast.error("Failed to create event");
      }
    } catch (err) {
      console.error("Failed to save event:", err);
      toast.error("Failed to sync with server");
    }

    setSaving(false);
    setForm({
      title: "",
      description: "",
      location: "",
      isOnline: false,
      startsAt: "",
      category: "",
    });
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Create Event">
      <form onSubmit={submit} className="space-y-4 p-1">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">
            Title
          </label>
          <Input
            required
            placeholder="e.g. Design Sync & Coffee ☕"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">
            Description
          </label>
          <textarea
            placeholder="Describe what attendees can expect..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-2xl border border-border bg-background p-3 text-xs min-h-[90px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex items-center gap-2 py-1.5">
          <input
            type="checkbox"
            id="isOnline"
            checked={form.isOnline}
            onChange={(e) => setForm({ ...form, isOnline: e.target.checked })}
            className="h-4 w-4 accent-primary rounded cursor-pointer"
          />
          <label
            htmlFor="isOnline"
            className="text-xs text-foreground font-semibold cursor-pointer"
          >
            This is an online virtual event
          </label>
        </div>

        {!form.isOnline && (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              Location
            </label>
            <Input
              placeholder="e.g. Cafe HQ, San Francisco"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              Starts At
            </label>
            <Input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              Category
            </label>
            <Input
              placeholder="e.g. Design, Tech"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border mt-2">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">
            Recurring Event
          </label>
          <select className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!form.title || !form.startsAt}>
            Create Event
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function fmtMonth(s: string) {
  return new Date(s).toLocaleString("en-US", { month: "short" });
}
function fmtDay(s: string) {
  return new Date(s).getDate();
}
function fmtFull(s: string) {
  return new Date(s).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
