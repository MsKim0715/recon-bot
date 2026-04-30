import { buildModal, buildTextInput } from "@/shared/modal/modal.builder.js";
import { MODALS } from "@/bot/constants/modals.js";

export function buildRegisterModal(){
  return buildModal(
    MODALS.MEMBER_REGISTER,
    '회원 등록',
    [
      buildTextInput('nickname', '닉네임',{
        placeholder : '사용할 닉네임을 입력하세요',
        maxLength : 20,
      })
    ]
  )
}