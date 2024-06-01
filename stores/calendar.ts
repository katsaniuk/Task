import { defineStore } from 'pinia'

export const useCalendarStore = defineStore('calendar', {
    state: () => ({
        events: [] as Array<{ title: string, start: string, allDay: boolean }>
    }),
    actions: {
        addEvent(event: { title: string, start: string, allDay: boolean }) {
            this.events.push(event)
        },
        updateEvent(event: { title: string, start: string, allDay: boolean }) {
            const index = this.events.findIndex(e => e.start === event.start)
            if (index !== -1) {
                this.events[index] = event
            }
        },
        removeEvent(start: string) {
            this.events = this.events.filter(e => e.start !== start)
        }
    }
})
