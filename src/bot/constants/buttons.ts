export const BUTTONS = {
  TEAM_APPLICATION_ACCEPT: 'button:team:application:accept',
  TEAM_APPLICATION_REJECT: 'button:team:application:reject',
  TEAM_LIST:               'button:team:list',    
  SCRIM_LIST:              'button:scrim:list',
  SCRIM_ACCEPT:            'button:scrim:accept',
  SCRIM_REJECT:            'button:scrim:reject',
} as const

export type ButtonName = typeof BUTTONS[keyof typeof BUTTONS];