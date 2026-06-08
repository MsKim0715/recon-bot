import { buildModal, buildTextInput } from '@/shared/modal/modal.builder.js';
import { MODALS } from '@/bot/constants/modals.js';
import { TextInputStyle } from 'discord.js';

export function buildScrimCreateModal() {
  return buildModal(
    MODALS.SCRIM_CREATE,
    '스크림 모집 생성',
    [

      buildTextInput('date', '경기 날짜', {
        placeholder: 'YYYY-MM-DD (예: 2026-05-20)',
        maxLength: 10,
      }),
      buildTextInput('time', '경기 시간', {
        placeholder: 'HH:mm (예: 21:00)',
        maxLength: 5,
      }),
      buildTextInput('description', '설명', {
        style: TextInputStyle.Paragraph,
        placeholder: '스크림 설명을 입력하세요 (선택)',
        required: false,
        maxLength: 100,
      }),
      buildTextInput('minTier', '최소 티어 번호 (선택)', {
        placeholder: '예: 13 = Platinum 1 (없으면 비워두세요)',
        required: false,
        maxLength: 2,
      }),
      buildTextInput('maxTier', '최대 티어 번호 (선택)', {
        placeholder: '예: 18 = Diamond 3 (없으면 비워두세요)',
        required: false,
        maxLength: 2,
      }),
    ]
  );
}

export function buildScrimApplyModal(scrimNumber: number) {
  return buildModal(

    `${MODALS.SCRIM_APPLY}:${scrimNumber}`,
    '스크림 신청',
    [
      buildTextInput('message', '신청 메시지', {
        style: TextInputStyle.Paragraph,
        placeholder: '신청 메시지를 입력하세요 (선택)',
        required: false,
        maxLength: 100,
      }),
    ]
  );
}