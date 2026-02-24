// src/composables/useNotifications.js
import { ref } from 'vue'

const notifications = ref([])
let nextId = 0

export function useNotifications() {
    const addNotification = ({ message, type = 'info', duration = 3000 }) => {
        const id = nextId++
        const notification = {
            id,
            message,
            type
        }

        notifications.value.push(notification)

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id)
            }, duration)
        }
    }

    const removeNotification = (id) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1) {
            notifications.value.splice(index, 1)
        }
    }

    return {
        notifications,
        addNotification,
        removeNotification
    }
}