import { buildModal, buildTextInput } from "@/shared/modal/modal.builder.js";
import { MODALS } from "@/bot/constants/modals.js";
import { TextInputStyle } from "discord.js";

export function buildTeamCreateModal(){
  return buildModal(
    MODALS.TEAM_CREATE,
    '팀 생성',
    [
      buildTextInput('name', '팀 이름',{
        placeholder : '팀 이름을 입력하세요',
        maxLength : 20,
      }),

      buildTextInput('description', '팀 설명', {
        style : TextInputStyle.Paragraph,
        placeholder: '팀 설명을 입력하세요 (선택)',
        required : false,
        maxLength : 100,
      })
    ]
  )
}