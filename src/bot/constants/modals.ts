export const MODALS = {
    MEMBER_REGISTER : 'modal:member:register',
    TEAM_CREATE : 'modal:team:create',
    TEAM_UPDATE :  'modal:team:update',
    VALORANT_LINK: 'modal:valorant:link',
} as const;

export type ModalName = typeof MODALS[keyof typeof MODALS];