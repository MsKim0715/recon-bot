export const BUTTONS = {
    TEAM_APPLICATION_ACCEPT: 'button:team:application:accept',
    TEAM_APPLICATION_REJECT: 'button:team:application:reject',
} as const;


export type ButtonName = typeof BUTTONS[keyof typeof BUTTONS];