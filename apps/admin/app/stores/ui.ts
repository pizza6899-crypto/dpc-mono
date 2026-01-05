import { defineStore } from 'pinia'
import { ref, reactive } from 'vue' // Added ref and reactive imports

export const useUIStore = defineStore('ui', () => {
    // Table specific settings grouped by page
    const tableSettings = reactive({
        users: {
            itemsPerPage: 10
        },
        tierHistory: {
            itemsPerPage: 20
        },
        walletTransactions: {
            itemsPerPage: 20
        }
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
