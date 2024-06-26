'use client';

import React, { useEffect, useState } from 'react';
import { FaHeart } from 'react-icons/fa6';

import Input from '@/components/common-components/input';
import Pagination from '@/components/common-components/pagination';

import ActivityBanner from '@/components/join/ActivityBanner';
import RecommendItem from '@/components/main/RecommendItem';

import {
  useAllActivity,
  useLikedActivity,
  useOnboardingInfo,
} from '@/hooks/api/useActivity';
import { ActivityType } from '@/types/activity';

import ActivityContainer from '@/containers/join/ActivityContainer';
import ChipContainer from '@/containers/join/ChipContainer';
import useSelectedJoinChipStore from '@/store/join/selectedJoinChipStore';

import clsx from 'clsx';

const page = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const initChips = useSelectedJoinChipStore((state) => state.initChips);

  const currentAgency = useSelectedJoinChipStore(
    (state) => state.currentAgency,
  );
  const currentPersonality = useSelectedJoinChipStore(
    (state) => state.currentPersonality,
  );

  const { data: initialData, isLoading: initialLoading } = useOnboardingInfo();

  const { data, isLoading, refetch } = useAllActivity({
    page: currentPage - 1,
    agencyTypes:
      currentAgency.length === 0 || currentAgency.includes('전체')
        ? undefined
        : currentAgency.join(','),
    personalities: currentPersonality,
  });

  const {
    data: likedData,
    isLoading: likedLoading,
    refetch: likedRefetch,
  } = useLikedActivity({
    page: currentPage - 1,
    agencyTypes:
      currentAgency.length === 0 || currentAgency.includes('전체')
        ? undefined
        : currentAgency.join(','),
    personalities: currentPersonality,
  });

  useEffect(() => {
    initChips(initialData && initialData.personalities);
  }, [initialData]);

  useEffect(() => {
    setCurrentPage(1);
    refetch();
    likedRefetch();
  }, [currentAgency, currentPersonality]);

  useEffect(() => {
    // 관심활동 클릭 시 선택된 태그 초기화
    if (isLiked) {
      initChips(initialData && initialData.personalities);
      setCurrentPage(1);
      likedRefetch();
    }
  }, [isLiked]);

  const [tempValue, setTempValue] = useState<string>('');

  return (
    <>
      <ActivityBanner
        title={'활동 참여하기'}
        content={'취향에 맞는 활동을 찾고 참여하세요!'}
        imgUrl={'/assets/components/activity-top-banner.png'}
      />
      <div className="max-w-[1210px] w-full mx-auto">
        <div className="mt-[60px] flex justify-between">
          <Input
            onChange={(e) => setTempValue(e.currentTarget.value)}
            placeholder={'찾으시는 활동을 검색해보세요!'}
            search={true}
            value={tempValue}
            shape={'rounded'}
            size={'sm'}
          />
          <div
            className={clsx(
              'mb-6 flex items-center gap-[10px] px-[18px] py-[8px] rounded-[30px] text-body3 whitespace-nowrap cursor-pointer',
              isLiked
                ? 'bg-primary-orange6 text-white'
                : 'bg-gray-02 text-gray-09',
            )}
            onClick={() => setIsLiked((prev) => !prev)}
          >
            <FaHeart
              width={20}
              height={20}
              className={clsx(isLiked ? 'text-white' : 'text-primary-orange6')}
            />
            <span>관심활동 모아보기</span>
          </div>
        </div>
        <ChipContainer className="mb-10" />
        <ActivityContainer className="mb-[100px]">
          {!isLiked
            ? data &&
              data.activitySummaries.map((item: ActivityType, key: number) => (
                <RecommendItem
                  key={item.id.toString() + item.liked}
                  id={item.id}
                  title={item.title}
                  location={item.location}
                  time={item.time}
                  imageUrl={item.activityThumbnail}
                  isLiked={item.liked}
                  personalities={[item.personality]}
                  isHoverSet={false}
                  isLoading={isLoading}
                />
              ))
            : likedData &&
              likedData.activitySummaries.map(
                (item: ActivityType, key: number) => (
                  <RecommendItem
                    key={item.id.toString() + item.liked}
                    id={item.id}
                    title={item.title}
                    location={item.location}
                    time={item.time}
                    imageUrl={item.activityThumbnail}
                    isLiked={item.liked}
                    personalities={[item.personality]}
                    isHoverSet={false}
                    isLoading={likedLoading}
                  />
                ),
              )}
        </ActivityContainer>
        {(data && data.activitySummaries.length > 0) ||
        (likedData && likedData.activitySummaries.length > 0) ? (
          <Pagination
            totalPages={
              isLiked
                ? likedData && likedData.pageCount
                : data && data.pageCount
            }
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        ) : (
          ''
        )}
      </div>
    </>
  );
};

export default page;
