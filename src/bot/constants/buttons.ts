export const BUTTONS = {
  TEAM_APPLICATION_ACCEPT: "button:team:application:accept",
  TEAM_APPLICATION_REJECT: "button:team:application:reject",
  TEAM_LIST: "button:team:list",
  TEAM_CREATE_OPEN: "button:team:createopen", // [팀 생성] → 생성 모달
  TEAM_UPDATE_OPEN: "button:team:updateopen", // [팀 정보 수정] → 수정 모달
  TEAM_BROWSE: "button:team:browse", // [팀 목록] 열기
  TEAM_DISBAND: "button:team:disband", // [팀 해체]
  TEAM_MEMBERS: "button:team:members", // [멤버 관리]
  TEAM_PENDING: "button:team:pending", // [가입 신청 목록]
  TEAM_LEAVE: "button:team:leave", // [팀 탈퇴]
  TEAM_JOIN_OPEN: "button:team:joinopen", // 목록 카드 [가입 신청]
  TEAM_KICK: "button:team:kick", // 멤버 [추방]
  TEAM_TRANSFER: "button:team:transfer", // 멤버 [위임]
  TEAM_APPLY_CANCEL: "button:team:unapply", // 내 가입 신청 [신청 취소]

  MATCH_APPROVE: "button:match:approve",
  MATCH_REJECT: "button:match:reject",
  MATCH_LIST: "button:match:list",
  MATCH_RESULT_OPEN: "button:match:resultopen", // [결과 입력] → 결과 모달
  MATCH_NOSHOW: "button:match:noshow", // [노쇼 신고]

  SCRIM_LIST: "button:scrim:list",
  SCRIM_ACCEPT: "button:scrim:accept",
  SCRIM_REJECT: "button:scrim:reject",
  SCRIM_CREATE_OPEN: "button:scrim:createopen",
  SCRIM_APPLY_OPEN: "button:scrim:applyopen",
  SCRIM_APPLICATIONS: "button:scrim:applist",
  SCRIM_CLOSE: "button:scrim:close",
  SCRIM_CANCEL: "button:scrim:cancel",
  SCRIM_MY_APPS: "button:scrim:myapps",
  SCRIM_APPLY_CANCEL: "button:scrim:unapply",
} as const;

export type ButtonName = (typeof BUTTONS)[keyof typeof BUTTONS];
