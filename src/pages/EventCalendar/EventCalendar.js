import {
  getCalendarEvents,
  EVENT_TYPES,
  SA_LIST
} from '../../services/eventCalendarService.js'

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Semua Event' },
  { value: EVENT_TYPES.ETA, label: 'ETA' },
  { value: EVENT_TYPES.PART_ARRIVAL, label: 'Part Arrival' },
  { value: EVENT_TYPES.BOOKING, label: 'Booking' }
]

const DAY_NAMES = [
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
  'Min'
]

let events = []
let selectedSA = ''
let selectedType = ''
let selectedDateKey = ''
let currentMonth = null

export function renderEventCalendar() {
  return `
    <div class="event-calendar-page">
      <div class="event-calendar-toolbar">
        <div class="event-calendar-filter">
          <label for="event-calendar-sa">SA</label>
          <select id="event-calendar-sa">
            <option value="">Semua SA</option>
            ${SA_LIST.map(sa => `
              <option value="${sa}">${sa}</option>
            `).join('')}
          </select>
        </div>

        <div class="event-calendar-filter">
          <label for="event-calendar-type">Jenis Event</label>
          <select id="event-calendar-type">
            ${EVENT_TYPE_OPTIONS.map(option => `
              <option value="${option.value}">${option.label}</option>
            `).join('')}
          </select>
        </div>

        <div class="event-calendar-legend">
          <span><i class="event-calendar-dot eta"></i> ETA</span>
          <span><i class="event-calendar-dot part-arrival"></i> Part Arrival</span>
          <span><i class="event-calendar-dot booking"></i> Booking</span>
        </div>
      </div>

      <div class="event-calendar-card">
        <div class="event-calendar-header">
          <button
            type="button"
            class="event-calendar-nav-button"
            id="event-calendar-prev"
            aria-label="Bulan sebelumnya"
          >
            ‹
          </button>

          <h2 id="event-calendar-month-label"></h2>

          <button
            type="button"
            class="event-calendar-nav-button"
            id="event-calendar-next"
            aria-label="Bulan berikutnya"
          >
            ›
          </button>
        </div>

        <div
          id="event-calendar-loading"
          class="event-calendar-loading"
        >
          Memuat kalender...
        </div>

        <div
          id="event-calendar-error"
          class="event-calendar-error"
        ></div>

        <div id="event-calendar-grid-container"></div>
      </div>

      <div class="event-calendar-events-card">
        <div class="event-calendar-events-header">
          <div>
            <h2 id="event-calendar-selected-date"></h2>
            <p id="event-calendar-event-count"></p>
          </div>
        </div>

        <div id="event-calendar-events-list"></div>
      </div>
    </div>
  `
}

export async function initEventCalendar() {
  resetCalendarState()
  bindToolbar()
  bindNavigation()

  try {
    events = await getCalendarEvents()
    renderCalendar()
    renderSelectedDateEvents()
  }
  catch (error) {
    console.error(
      'GAGAL MEMUAT EVENT CALENDAR:',
      error
    )

    showError(
      error.message ||
      'Gagal memuat Event Calendar.'
    )
  }
  finally {
    const loading =
      document.getElementById('event-calendar-loading')

    if (loading) {
      loading.style.display = 'none'
    }
  }
}

function resetCalendarState() {
  const today = new Date()

  selectedSA = ''
  selectedType = ''
  selectedDateKey = toDateKey(today)
  currentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  )
  events = []
}

function bindToolbar() {
  document
    .getElementById('event-calendar-sa')
    ?.addEventListener('change', event => {
      selectedSA = event.target.value
      renderCalendar()
      renderSelectedDateEvents()
    })

  document
    .getElementById('event-calendar-type')
    ?.addEventListener('change', event => {
      selectedType = event.target.value
      renderCalendar()
      renderSelectedDateEvents()
    })
}

function bindNavigation() {
  document
    .getElementById('event-calendar-prev')
    ?.addEventListener('click', () => {
      moveMonth(-1)
    })

  document
    .getElementById('event-calendar-next')
    ?.addEventListener('click', () => {
      moveMonth(1)
    })
}

function moveMonth(offset) {
  const selected =
    parseDateKey(selectedDateKey)

  const nextMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + offset,
    1
  )

  const maxDay =
    new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0
    ).getDate()

  const nextDay =
    Math.min(selected.getDate(), maxDay)

  currentMonth = nextMonth
  selectedDateKey = toDateKey(
    new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      nextDay
    )
  )

  renderCalendar()
  renderSelectedDateEvents()
}

function renderCalendar() {
  const container =
    document.getElementById(
      'event-calendar-grid-container'
    )

  const label =
    document.getElementById(
      'event-calendar-month-label'
    )

  if (!container || !currentMonth) {
    return
  }

  if (label) {
    label.textContent =
      currentMonth.toLocaleDateString(
        'id-ID',
        {
          month: 'long',
          year: 'numeric'
        }
      )
  }

  const filteredEvents =
    getFilteredEvents()

  const eventMap =
    buildEventMap(filteredEvents)

  const firstDay =
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    )

  const offset =
    (firstDay.getDay() + 6) % 7

  const gridStart =
    new Date(firstDay)

  gridStart.setDate(
    gridStart.getDate() - offset
  )

  const cells = []

  for (let index = 0; index < 42; index++) {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index
    )

    const dateKey = toDateKey(date)
    const dateEvents = eventMap.get(dateKey) || []
    const isCurrentMonth =
      date.getMonth() === currentMonth.getMonth()

    const isSelected =
      dateKey === selectedDateKey

    const isToday =
      dateKey === toDateKey(new Date())

    const flags =
      [...new Set(dateEvents.map(event => event.type))]
        .map(type => renderEventFlag(type, dateEvents))
        .join('')

    cells.push(`
      <button
        type="button"
        class="event-calendar-day${isCurrentMonth ? '' : ' other-month'}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}"
        data-calendar-date="${dateKey}"
      >
        <span class="event-calendar-day-number">
          ${date.getDate()}
        </span>

        <span class="event-calendar-day-flags">
          ${flags}
        </span>
      </button>
    `)
  }

  container.innerHTML = `
    <div class="event-calendar-weekdays">
      ${DAY_NAMES.map(day => `<div>${day}</div>`).join('')}
    </div>

    <div class="event-calendar-grid">
      ${cells.join('')}
    </div>
  `

  container
    .querySelectorAll('[data-calendar-date]')
    .forEach(button => {
      button.addEventListener('click', () => {
        selectDate(button.dataset.calendarDate)
      })
    })
}

function renderSelectedDateEvents() {
  const title =
    document.getElementById(
      'event-calendar-selected-date'
    )

  const count =
    document.getElementById(
      'event-calendar-event-count'
    )

  const list =
    document.getElementById(
      'event-calendar-events-list'
    )

  if (!title || !count || !list) {
    return
  }

  const date =
    parseDateKey(selectedDateKey)

  const filteredEvents =
    getFilteredEvents().filter(event => {
      return event.date === selectedDateKey
    })

  title.textContent =
    `Event — ${formatLongDate(date)}`

  count.textContent =
    filteredEvents.length === 0
      ? 'Tidak ada event pada tanggal ini.'
      : `${filteredEvents.length} event`

  if (filteredEvents.length === 0) {
    list.innerHTML = `
      <div class="event-calendar-empty">
        Tidak ada event yang sesuai dengan filter.
      </div>
    `
    return
  }

  list.innerHTML =
    filteredEvents
      .map(renderEventCard)
      .join('')

  list
    .querySelectorAll('[data-event-order-id]')
    .forEach(card => {
      card.addEventListener('click', () => {
        const orderId =
          card.dataset.eventOrderId

        if (!orderId) {
          return
        }

        document.dispatchEvent(
          new CustomEvent('open-event-calendar-wo-detail', {
            detail: { orderId }
          })
        )
      })
    })
}

function renderEventCard(event) {
  const label =
    getEventTypeLabel(event.type)

  const meta =
    event.type === EVENT_TYPES.BOOKING
      ? `SA: ${event.sa} · Model: ${escapeHTML(event.model)}`
      : `SA: ${event.sa} · PNO: ${escapeHTML(event.pno)}`

  const detail =
    event.type === EVENT_TYPES.BOOKING
      ? `Customer: ${escapeHTML(event.customer)}`
      : escapeHTML(event.namaPart)

  return `
    <button
      type="button"
      class="event-calendar-event-card ${getEventTypeClass(event.type)}"
      data-event-order-id="${escapeHTML(event.orderId)}"
    >
      <span class="event-calendar-event-icon"></span>

      <span class="event-calendar-event-body">
        <strong>${label}</strong>
        <span>WO: ${escapeHTML(event.noWo)}</span>
        <span>${meta}</span>
        <span>${detail}</span>
      </span>

      <span class="event-calendar-event-arrow">›</span>
    </button>
  `
}

function renderEventFlag(type, dateEvents) {
  const count =
    dateEvents.filter(event => event.type === type).length

  return `
    <span
      class="event-calendar-flag ${getEventTypeClass(type)}"
      title="${getEventTypeLabel(type)}: ${count}"
    >
      <i></i>
      ${count > 1 ? `<b>${count}</b>` : ''}
    </span>
  `
}

function selectDate(dateKey) {
  const date = parseDateKey(dateKey)

  selectedDateKey = dateKey

  if (
    date.getMonth() !== currentMonth.getMonth() ||
    date.getFullYear() !== currentMonth.getFullYear()
  ) {
    currentMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    )
  }

  renderCalendar()
  renderSelectedDateEvents()
}

function getFilteredEvents() {
  return events.filter(event => {
    const matchesSA =
      !selectedSA ||
      event.sa === selectedSA

    const matchesType =
      !selectedType ||
      event.type === selectedType

    return matchesSA && matchesType
  })
}

function buildEventMap(eventList) {
  const map = new Map()

  eventList.forEach(event => {
    if (!map.has(event.date)) {
      map.set(event.date, [])
    }

    map.get(event.date).push(event)
  })

  return map
}

function getEventTypeLabel(type) {
  if (type === EVENT_TYPES.ETA) {
    return 'ETA'
  }

  if (type === EVENT_TYPES.PART_ARRIVAL) {
    return 'Part Arrival'
  }

  return 'Booking'
}

function getEventTypeClass(type) {
  if (type === EVENT_TYPES.ETA) {
    return 'eta'
  }

  if (type === EVENT_TYPES.PART_ARRIVAL) {
    return 'part-arrival'
  }

  return 'booking'
}

function formatLongDate(date) {
  return date.toLocaleDateString(
    'id-ID',
    {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }
  )
}

function toDateKey(date) {
  const year =
    date.getFullYear()

  const month =
    String(date.getMonth() + 1)
      .padStart(2, '0')

  const day =
    String(date.getDate())
      .padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateKey(value) {
  const [year, month, day] =
    String(value).split('-').map(Number)

  return new Date(
    year,
    month - 1,
    day
  )
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function showError(message) {
  const element =
    document.getElementById(
      'event-calendar-error'
    )

  if (!element) {
    return
  }

  element.textContent = message
  element.style.display = 'block'
}
