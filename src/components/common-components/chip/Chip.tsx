import { PropsWithChildren, forwardRef, useEffect, useState } from 'react';

import { useAllActivity } from '@/hooks/api/useActivity';

import useSelectedJoinChipStore from '@/store/join/selectedJoinChipStore';

import { ChipProps } from '.';

import clsx from 'clsx';

const style: {
  base: string;
  size: Record<string, string>;
  focus: Record<string, string>;
  color: Record<string, string>;
  type: string;
} = {
  base: 'inline-flex justify-center items-center',
  size: {
    sm: 'max-h-[32px] rounded-[20px] px-[20px] py-[6px] text-chip-bold', // 활동 정보 컴포넌트에서 사용하는 칩
    md: 'max-h-9 rounded-[22px] px-[22px] py-[6px] text-chip-semibold-sm cursor-pointer', // 필터링에서 사용하는 칩
  },
  focus: {
    abled: 'text-white bg-primary-orange6',
    disabled: 'border-gray-04 text-gray-07 !bg-gray-04',
  },
  color: {
    활발한: 'bg-[rgba(253,143,42,0.10)] border border-[#FD8F2A] text-[#FD8F2A]', // 활발한
    학문적인:
      'border border-[#E78751] bg-[rgba(231,135,81,0.10)] text-[#E78751]', // 학문적인
    평화로운:
      'border border-[#8598FC] bg-[rgba(133,152,252,0.10)] text-[#8598FC]',
    예술적인:
      'border border-[#A954DD] bg-[rgba(169,84,221,0.10)] text-[#A954DD]',
    자연친화적인:
      'border border-chip-natural bg-[rgba(75,171,90,0.1)] text-chip-natural',
    '배울 수 있는':
      'border border-chip-learnable bg-[rgba(234,112,156,0.1)] text-chip-learnable',
    창의적인:
      'border border-chip-creative bg-[rgba(255,199,0,0.1)] text-chip-creative',
  },
  // 활동 타입은 아래 type 색상만 사용합니다.
  type: '!px-[16px] !rounded-[30px] text-white text-chip-bold bg-primary-orange4 bg-opacity-80',
};

/**
 * Chip - 활동 성격과 타입에 사용되는 컴포넌트
 * @param text
 * @returns
 */
const Chip = forwardRef<HTMLDivElement, PropsWithChildren<ChipProps>>(
  (props, ref) => {
    const {
      className,
      size = 'sm',
      text,
      type,
      isBtn = false,
      isPersonality = true,
    } = props;

    const [isSelected, setIsSelected] = useState<boolean>(false);
    const isInit = useSelectedJoinChipStore((state) => state.isInit);
    const currentChips = useSelectedJoinChipStore(
      (state) => state.currentChips,
    );
    const setCurrentChips = useSelectedJoinChipStore(
      (state) => state.setCurrentChips,
    );
    const { data } = useAllActivity({
      page: 0,
      // agencyType: '문화센터',
      personalities: ['배울 수 있는', '활발한'],
    });

    const handleClick = () => {
      if (isBtn && text) {
        setIsSelected((prev) => !prev);
        setCurrentChips(text);
        console.log(data);
      }
    };

    useEffect(() => {
      if (isInit) {
        setIsSelected(false);
      }
    }, [currentChips]);

    return (
      <div
        className={clsx(
          style.base,
          className,
          isBtn
            ? isSelected
              ? !isPersonality && style.focus['abled']
              : style.focus['disabled']
            : '',
          text ? style.color[text as string] : style.type,
          style.size[size],
        )}
        onClick={handleClick}
      >
        {text ?? type}
      </div>
    );
  },
);

Chip.displayName = 'Chip';

export default Chip;
