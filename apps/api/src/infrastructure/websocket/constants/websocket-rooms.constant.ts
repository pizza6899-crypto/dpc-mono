/**
 * 소켓 룸(채널) 상수
 */
export const SOCKET_ROOMS = {
    ADMIN: 'admin',
    LOBBY: 'lobby',
    GLOBAL: 'global',
} as const;

export type SocketRoomType =
    | (typeof SOCKET_ROOMS)[keyof typeof SOCKET_ROOMS]
    | `user:${string}`
    | `admin:${string}`
    | `chat:${string}`
    | `support:${string}`

export const getSocketRoom = {
    /** 유저 개인 룸 (1:1 알림용) */
    user: (userId: bigint) => `user:${userId.toString()}`,

    /** 어드민 개인 룸 (1:1 알림용) */
    admin: (adminId: bigint) => `admin:${adminId.toString()}`,

    /** 일반 채팅방 룸 (PUBLIC, 그룹 등) */
    chat: (roomId: bigint) => `chat:${roomId.toString()}`,

    /** 고객응대 상담 룸 (1:1 상담 전용) */
    support: (roomId: bigint) => `support:${roomId.toString()}`,
};