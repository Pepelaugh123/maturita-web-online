import { qs } from './utils.js';

export const initEvents = () => {
  const wrap = qs('#eventsList');
  if (!wrap) return;

  const eventsData = [
    {
      date: '2025-02-10',
      city: 'Praha',
      venue: 'Holešovice',
      title: 'Studio session / poslechovka',
      note: 'Malý listening večer, jen pro pozvané.'
    },
    {
      date: '2025-03-05',
      city: 'Plzeň',
      venue: 'Klub Panorama',
      title: 'Live show',
      note: 'Set s novým materiálem + hosté.'
    },
    {
      date: '2026-01-15',
      city: 'Praha',
      venue: 'SaSaZu Club',
      title: 'Tour',
      note: 'Věci z alba + hosté.'
    },
    {
      date: '2026-02-14',
      city: 'Brno',
      venue: 'Sono Music Club',
      title: 'Tour',
      note: 'Věci z alba + hosté.'
    }
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fmtDate = new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const sorted = eventsData
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sorted.length) {
    wrap.innerHTML = '<p class="muted">Zatím nejsou vypsané žádné akce.</p>';
    return;
  }

  sorted.forEach((event, index) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const isUpcoming = !Number.isNaN(eventDate.getTime()) && eventDate >= today;

    const card = document.createElement('article');
    card.className = 'event-card glass is-interactive reveal';
    card.setAttribute('data-delay', String(index * 60));

    card.innerHTML = `
      <div class="event-meta">
        <span>${fmtDate.format(eventDate)}</span>
        ${event.city ? `<span>${event.city}${event.venue ? ' — ' + event.venue : ''}</span>` : ''}
        ${isUpcoming ? '<span class="event-label">Nadcházející</span>' : ''}
      </div>
      <h3 class="event-title">${event.title || ''}</h3>
      ${event.note ? `<p class="event-note">${event.note}</p>` : ''}
    `;

    wrap.appendChild(card);
  });
};
