export const COMMANDS= {

    //테스트 용도 커맨드 [ping]
    PING : 'ping',
    TEAM_CREATE: '팀생성',
    SCRIM_CREATE : '모집생성',
} as const;

export type CommandName = typeof COMMANDS[keyof typeof COMMANDS];