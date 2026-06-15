export const MODALS = {
  MEMBER_REGISTER: "modal:member:register",
  TEAM_CREATE: "modal:team:create",
  TEAM_UPDATE: "modal:team:update",
  SCRIM_CREATE: "modal:scrim:create",
  SCRIM_APPLY: "modal:scrim:apply",
  VALORANT_LINK: "modal:valorant:link",
  MATCH_RESULT: "modal:match:result",
} as const;

export type ModalName = (typeof MODALS)[keyof typeof MODALS];
