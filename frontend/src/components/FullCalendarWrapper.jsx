import React, { useEffect, useRef } from 'react';

export default function FullCalendarWrapper({ events = [], onDateSelect, onEventClick }) {
  const ref = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (!window.FullCalendar) return;
    const { Calendar } = window.FullCalendar;
    const plugins = [];
    if (window.FullCalendarDayGrid) plugins.push(window.FullCalendarDayGrid.default || window.FullCalendarDayGrid);
    if (window.FullCalendarTimeGrid) plugins.push(window.FullCalendarTimeGrid.default || window.FullCalendarTimeGrid);
    if (window.FullCalendarInteraction) plugins.push(window.FullCalendarInteraction.default || window.FullCalendarInteraction);

    calendarRef.current = new Calendar(ref.current, {
      plugins,
      initialView: 'dayGridMonth',
      selectable: true,
      editable: false,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end
      })),
      select: (info) => {
        if (onDateSelect) onDateSelect(info);
      },
      eventClick: (info) => {
        if (onEventClick) onEventClick(info);
      }
    });

    calendarRef.current.render();

    return () => {
      try { calendarRef.current && calendarRef.current.destroy(); } catch (e) {}
    };
  }, []); // mount once

  // update events when prop changes
  useEffect(() => {
    if (!calendarRef.current) return;
    calendarRef.current.removeAllEventSources();
    calendarRef.current.addEventSource(events.map(e => ({ id: e.id, title: e.title, start: e.start, end: e.end })));
  }, [events]);

  return <div ref={ref} />;
}
