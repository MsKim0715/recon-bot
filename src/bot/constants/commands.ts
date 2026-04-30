export const COMMANDS= {

    //테스트 용도 커맨드 [ping]
    PING : 'ping',
    TEAM_CREATE: 'team-create',
    TEAM_VIEW : 'team-view',
    
    SCRIM_CREATE : 'scrim-create',
    MEMBER_REGISTER : 'member-register',
    MEMBER_VIEW : 'member-view',
    MEMBER_DELETE : 'member-delete',


} as const;

export type CommandName = typeof COMMANDS[keyof typeof COMMANDS];