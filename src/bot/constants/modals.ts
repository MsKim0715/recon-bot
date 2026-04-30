export const MODALS = {
    MEMBER_REGISTER : 'modal:member:register',
    TEAM_CREATE : 'modal:team:create'
} as const;

export type ModalName = typeof MODALS[keyof typeof MODALS];