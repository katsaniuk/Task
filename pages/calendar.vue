<template>
  <div class="calendar-container">
    <div class="header">
      <h1>Calendar</h1>
      <Button label="На головну" @click="goToHomePage" class="home-button" />
    </div>
    <FullCalendar ref="calendar" :options="calendarOptions" />
    <Dialog :header="dialogHeader" :visible="showDialog" modal @hide="resetDialog">
      <div class="p-fluid">
        <div class="p-field">
          <label for="title">Title</label>
          <InputText id="title" v-model="newMeeting.title" />
        </div>
        <div class="p-field description-field">
          <label for="description">Description</label>
          <InputText id="description" v-model="newMeeting.description" />
        </div>
        <div class="p-field">
          <label for="date">Date</label>
          <Calendar id="date" v-model="newMeeting.date" dateFormat="yy-mm-dd" />
        </div>
        <div class="p-field">
          <label>Time</label>
          <div class="p-inputgroup">
            <InputNumber v-model="newMeeting.hours" placeholder="Hours" showButtons mode="decimal" :min="0" :max="23" />
            <InputNumber v-model="newMeeting.minutes" placeholder="Minutes" showButtons mode="decimal" :step="5" :min="0" :max="59" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button label="Cancel" @click="resetDialog" />
          <Button label="Save" @click="saveMeeting" />
          <Button v-if="isEditMode" label="Delete" class="p-button-danger" @click="deleteMeeting" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'

function getLocalStorageItem(key, defaultValue) {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
}

function setLocalStorageItem(key, value) {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
}

const defaultView = getLocalStorageItem('fcDefaultView', 'dayGridMonth');

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: defaultView,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  editable: true,
  selectable: true,
  select: handleDateSelect,
  eventClick: handleMeetingClick,
  eventDrop: handleMeetingDrop,
  eventResize: handleMeetingResize,
  events: [],
  datesSet: function(info) {
    setLocalStorageItem('fcDefaultView', info.view.type);
  }
})

const showDialog = ref(false)
const isEditMode = ref(false)
const dialogHeader = ref('Create Meeting')
const newMeeting = ref({
  title: '',
  description: '',
  date: new Date(),
  hours: 0,
  minutes: 0
})
let selectedMeeting = null
let calendarApi = ref(null)

const router = useRouter()

function handleDateSelect(selectInfo) {
  calendarApi.value = selectInfo.view.calendar
  newMeeting.value.date = selectInfo.start
  newMeeting.value.hours = 0
  newMeeting.value.minutes = 0
  isEditMode.value = false
  dialogHeader.value = 'Create Meeting'
  showDialog.value = true
}

function saveMeeting() {
  if (newMeeting.value.title && newMeeting.value.date) {
    const start = new Date(newMeeting.value.date)
    start.setHours(newMeeting.value.hours)
    start.setMinutes(newMeeting.value.minutes)

    if (isEditMode.value && selectedMeeting) {
      selectedMeeting.remove()
      calendarApi.value.addEvent({
        title: newMeeting.value.title,
        start: start,
        description: newMeeting.value.description,
        allDay: false,
        backgroundColor: '#f0f0f0'
      })
    } else {
      calendarApi.value.addEvent({
        title: newMeeting.value.title,
        start: start,
        description: newMeeting.value.description,
        allDay: false,
        backgroundColor: '#f0f0f0'
      })
    }
    saveMeetingsToLocalStorage()
    resetDialog()
  }
}

function deleteMeeting() {
  if (isEditMode.value && selectedMeeting) {
    selectedMeeting.remove()
    saveMeetingsToLocalStorage()
    resetDialog()
  }
}

function handleMeetingClick(clickInfo) {
  selectedMeeting = clickInfo.event
  newMeeting.value.title = clickInfo.event.title
  newMeeting.value.description = clickInfo.event.extendedProps.description
  newMeeting.value.date = clickInfo.event.start
  newMeeting.value.hours = clickInfo.event.start.getHours()
  newMeeting.value.minutes = clickInfo.event.start.getMinutes()
  isEditMode.value = true
  dialogHeader.value = 'Edit Meeting'
  showDialog.value = true
}

function handleMeetingDrop(dropInfo) {
  saveMeetingsToLocalStorage()
  alert(`Meeting moved to ${dropInfo.event.startStr}`)
}

function handleMeetingResize(resizeInfo) {
  saveMeetingsToLocalStorage()
  alert(`Meeting resized to end at ${resizeInfo.event.endStr}`)
}

function resetDialog() {
  showDialog.value = false
  newMeeting.value = { title: '', description: '', date: new Date(), hours: 0, minutes: 0 }
  isEditMode.value = false
  selectedMeeting = null
}

function goToHomePage() {
  router.push('/')  // Перехід на головну сторінку
}

function saveMeetingsToLocalStorage() {
  const meetings = calendarApi.value.getEvents().map(event => ({
    title: event.title,
    start: event.start.toISOString(), // Ensure proper format for Date
    description: event.extendedProps.description,
    allDay: event.allDay,
    backgroundColor: event.backgroundColor
  }))
  setLocalStorageItem('calendarMeetings', JSON.stringify(meetings))
}

function loadMeetingsFromLocalStorage() {
  const meetings = JSON.parse(getLocalStorageItem('calendarMeetings', '[]'))
  meetings.forEach(meeting => {
    calendarApi.value.addEvent({
      ...meeting,
      start: new Date(meeting.start) // Convert back to Date object
    })
  })
}

onMounted(() => {
  nextTick(() => {
    const calendarComponent = document.querySelector('.fc').__vueParentComponent
    if (calendarComponent) {
      calendarApi.value = calendarComponent.exposed.getApi()
      if (calendarApi.value) {
        loadMeetingsFromLocalStorage()
      }
    }
  })
})
</script>

<style scoped>
.calendar-container {
  max-width: 100%;
  margin: 0 auto;
  overflow-x: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.home-button {
  margin-left: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.description-field {
  width: 100%;
}

@media (max-width: 768px) {
  .calendar-container {
    max-width: 100%;
    padding: 0 10px;
  }
}

.fc-daygrid-event-harness .fc-daygrid-event {
  background-color: #f0f0f0 !important;
}
</style>
