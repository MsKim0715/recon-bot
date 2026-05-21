import { buildModal, buildTextInput } from '@/shared/modal/modal.builder.js';
import { MODALS } from '@/bot/constants/modals.js';

export function buildLinkModal() {
  return buildModal(
    MODALS.VALORANT_LINK,
    'Riot 계정 연동',
    [
      buildTextInput('gameName', '닉네임', {
        placeholder: '닉네임을 입력하세요 (예: GEN T3xture',
        maxLength: 16,
      }),
      buildTextInput('tagLine', '태그', {
        placeholder: '태그를 입력하세요 (예: KR1)',
        maxLength: 5,
      }),
    ]
  );
}