export const COMMANDS = {
  PING: "ping",

  // 회원
  MEMBER_REGISTER: "member-register",
  MEMBER_VIEW: "member-view",
  MEMBER_DELETE: "member-delete",

  // 팀
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

  // 스크림
  SCRIM_CREATE: "scrim-create",
  SCRIM_LIST: "scrim-list",
  SCRIM_APPLY: "scrim-apply",
  SCRIM_PENDING: "scrim-pending",
  SCRIM_CLOSE: "scrim-close",
  SCRIM_CANCEL: "scrim-cancel",
  SCRIM_APPLY_CANCEL: "scrim-apply-cancel",

  // 발로란트
  VALORANT_LINK: "link",
  VALORANT_VIEW: "stats",

  //매치
  MATCH_RESULT: "match-result",
  MATCH_NOSHOW: "match-noshow",
  MATCH_LIST: "match-list",
} as const;

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS];
