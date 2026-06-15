import { buildModal, buildTextInput } from '@/shared/modal/modal.builder.js';
import { MODALS } from '@/bot/constants/modals.js';

export function buildMatchResultModal(matchId: string) {
  return buildModal(
    `${MODALS.MATCH_RESULT}:${matchId}`,
    '경기 결과 입력 (BO3)',
    [
      buildTextInput('set1', '1세트 (우리:상대)', {
        placeholder: '예: 13:7',
        maxLength: 7,
      }),
      buildTextInput('set2', '2세트 (우리:상대)', {
        placeholder: '예: 9:13',
        maxLength: 7,
      }),
      buildTextInput('set3', '3세트 (우리:상대) · 2:0이면 비움', {
        placeholder: '예: 13:11',
        required: false,
        maxLength: 7,
      }),
    ],
  );
}