export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as any | null,
    }),
    getters: {
        isLoggedIn: (state) => !!state.user,
    },
    actions: {
        setUser(user: any) {
            this.user = user;
        },
        logout() {
            this.user = null;
            const router = useRouter();
            router.push('/login');
        },
    },
    persist: true,
});
