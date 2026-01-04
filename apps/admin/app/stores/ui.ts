import { defineStore } from 'pinia'
import { ref, reactive } from 'vue' // Added ref and reactive imports

export const useUIStore = defineStore('ui', () => {
    // Table specific settings grouped by page
    const tableSettings = reactive({
        users: {
            itemsPerPage: 10
        }
        // 추가될 페이지들:
        // transactions: { itemsPerPage: 20 },
        // auditLogs: { itemsPerPage: 50 }
    })

    // Global UI settings
    const sidebarCollapsed = ref(false)
    const theme = ref('system')

    return {
        tableSettings,
        sidebarCollapsed,
        theme
    }
}, {
    persist: true
})
