import { defineStore } from 'pinia'
import { CredentialAdminController_checkStatus, CredentialAdminController_logout } from '~/api/generated/endpoints/dPCBackendAPI'
import type { CredentialUserLoginUserResponseDto } from '~/api/generated/models'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<CredentialUserLoginUserResponseDto | null>(null)
    const isAuthenticated = ref(false)
    const isInitialized = ref(false)

    const isLoggedIn = computed(() => isAuthenticated.value && !!user.value)

    async function fetchUserStatus() {
        try {
            const response = await CredentialAdminController_checkStatus()
            user.value = response.data?.user || null
            isAuthenticated.value = response.data?.isAuthenticated || false
        } catch (error) {
            user.value = null
            isAuthenticated.value = false
        } finally {
            isInitialized.value = true
        }
    }

    async function logout() {
        try {
            await CredentialAdminController_logout()
        } finally {
            user.value = null
            isAuthenticated.value = false
            navigateTo('/login')
        }
    }

    function setUser(userData: CredentialUserLoginUserResponseDto) {
        user.value = userData
        isAuthenticated.value = true
    }

    function clearAuth() {
        user.value = null
        isAuthenticated.value = false
    }

    return {
        user,
        isAuthenticated,
        isInitialized,
        isLoggedIn,
        fetchUserStatus,
        logout,
        setUser,
        clearAuth
    }
}, {
    persist: true // 세션 쿠키 기반이지만, 사용자 정보 UI 노출을 위해 persist 사용 (선택 사항)
})
