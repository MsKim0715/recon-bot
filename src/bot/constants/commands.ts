export const COMMANDS = {
  //테스트 용도 커맨드 [ping]
  PING: "ping",

  //team
  TEAM_CREATE: "team-create",
  TEAM_VIEW: "team-view",
  TEAM_DISBAND: "team-disband",
  TEAM_LIST: "team-list",
  TEAM_JOIN: "team-join",
  TEAM_APPLICATION: "team-application",
  TEAM_KICK: "team-kick",
  TEAM_LEAVE: "team-leave",
  TEAM_TRANSFER: "team-transfer",
  TEAM_UPDATE: "team-update",
  TEAM_CANCEL: "team-cancel",

  //member
  MEMBER_REGISTER: "member-register",
  MEMBER_VIEW: "member-view",
  MEMBER_DELETE: "member-delete",

  //scrim
  SCRIM_CREATE: "scrim-create",

  //riot
  VALORANT_LINK: "valorant-link",
  VALORANT_VIEW: "valorant-view",
} as const;

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS];
