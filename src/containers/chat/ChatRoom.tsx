'use client';

import { useEffect, useRef, useState } from 'react';
import { FaRegSmile } from 'react-icons/fa';
import { LuCalendarDays } from 'react-icons/lu';

import Button from '@/components/common-components/button';
import Input from '@/components/common-components/input';

import { AppointmentModal } from '@/components/chat/AppointmentModal';
import { AppointmentMsgItem } from '@/components/chat/AppointmentMsgItem';
import { MyAppointmentMsgItem } from '@/components/chat/MyAppointmentMsgItem';
import { MyMsgItem } from '@/components/chat/MyMsgItem';
import { OtherMsgItem } from '@/components/chat/OtherMsgItem';

import { DirectChatRoom, GroupChatRoom, MsgLogProps } from '@/types/chat';

import { useChatStore } from '@/store/chatStore';
import { formatSimpleDate, strToDate, trimDateString } from '@/utils';
import { CompatClient, StompSubscription } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';

import clsx from 'clsx';
import moment from 'moment';
import Image from 'next/image';

export const ChatRoom = (props: {
  roomId: number;
  roomInfo: GroupChatRoom | DirectChatRoom;
  stompClient: CompatClient | null;
  isGroup?: boolean;
}) => {
  const { roomId, roomInfo, stompClient, isGroup = true } = props;
  const { myId } = useChatStore();
  const queryClient = useQueryClient();

  const [value, setValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [subscription, setSubscription] = useState<StompSubscription | null>(
    null,
  );

  const [logData, setLogData] = useState<MsgLogProps[]>([]);
  const [chatList, setChatList] = useState<MsgLogProps[]>([]);

  const msgBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (msgBoxRef.current) {
      msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
    }
  };

  const disabledBtn = () => value.length === 0;

  useEffect(() => {
    if (stompClient?.connected) {
      if (subscription) {
        subscription.unsubscribe();
      }

      const newSubscription = stompClient.subscribe(
        `/topic/chatting/${roomId}`,
        callback,
      );
      setSubscription(newSubscription);
      setChatList([]);
      setLogData([]);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [roomId, stompClient]);

  const callback = (message: any) => {
    if (message.body) {
      const msg = JSON.parse(message.body);
      if (msg.chatMessageLog) {
        setLogData(msg.chatMessageLog);
      }
      setChatList((chats) => [...chats, msg]);
    }
  };

  const sendChat = (id: number) => {
    if (value === '') return;

    const messageObject = {
      senderId: myId,
      text: value,
    };

    stompClient?.send(
      `/app/chatting/${id}/text`,
      {},
      JSON.stringify(messageObject),
    );
    setValue('');
  };

  const sendEmoticon = (id: number) => {
    const messageObject = {
      senderId: myId,
      emoticon: '안녕',
    };

    stompClient?.send(
      `/app/chatting/${id}/emoticon`,
      {},
      JSON.stringify(messageObject),
    );
  };

  useEffect(() => {
    scrollToBottom();
    queryClient.invalidateQueries({ queryKey: ['chatroomsGroup'] });
    queryClient.invalidateQueries({ queryKey: ['chatroomsDirect'] });

    setLastDate(logData[logData.length - 1]?.createdAt);
  }, [chatList]);

  const [lastDate, setLastDate] = useState<string>('');

  const renderDateSeparator = (
    currentDate: string,
    previousDate: string | null,
    isNewMsg: boolean | undefined,
  ) => {
    if (previousDate !== currentDate && !isNewMsg) {
      return (
        <div className="mx-auto">
          <div className="my-4 inline-flex py-2 px-5 text-h5 bg-gray-06 text-white rounded-full text-center items-center justify-center">
            {currentDate}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderMessageItem = (
    item: MsgLogProps,
    idx: number,
    isNewMsg?: boolean,
  ) => {
    const currentDate = formatSimpleDate(item?.createdAt);
    const previousDate =
      idx > 0 ? formatSimpleDate(logData[idx - 1]?.createdAt) : null;

    switch (item.type) {
      case 'TEXT':
        return (
          <>
            {renderDateSeparator(currentDate, previousDate, isNewMsg)}

            <div
              key={idx}
              className={`inline-flex ${item.senderId === myId ? 'justify-end' : ''}`}
            >
              {item.senderId === myId ? (
                <MyMsgItem data={item} />
              ) : (
                <OtherMsgItem data={item} />
              )}
            </div>
          </>
        );
      case 'APPOINTMENT':
        return (
          <>
            {renderDateSeparator(currentDate, previousDate, isNewMsg)}

            <div
              key={idx}
              className={`inline-flex ${item.senderId === myId ? 'justify-end' : ''}`}
            >
              {item.senderId === myId ? (
                <MyAppointmentMsgItem data={item as MsgLogProps} />
              ) : (
                <AppointmentMsgItem data={item as MsgLogProps} />
              )}
            </div>
          </>
        );
      case 'EMOTICON':
        return (
          <>
            {renderDateSeparator(currentDate, previousDate, isNewMsg)}

            <div
              key={idx}
              className={`inline-flex ${item.senderId === myId ? 'justify-end' : ''}`}
            >
              <div>
                {item.senderId !== myId && (
                  <div className="flex gap-3 items-center">
                    <Image
                      src={item.senderImageUrl ?? '/assets/ddoba_profile.png'}
                      alt=""
                      width={48}
                      height={48}
                      className="object-cover w-[48px] h-[48px] rounded-full"
                    />
                    <span className="text-black text-body2">
                      {item.senderName ?? '또바기'}
                    </span>
                  </div>
                )}
                <div className="flex gap-3 items-end">
                  {item.senderId === myId && (
                    <span className="text-footer-regular text-gray-06">
                      {trimDateString(item.createdAt)}
                    </span>
                  )}

                  <Image
                    src={'/assets/ddoba_emoticon.png'}
                    alt=""
                    width={200}
                    height={200}
                    className="object-cover m-3 rounded-[20px]"
                  />

                  {item.senderId !== myId && (
                    <span className="text-footer-regular text-gray-06">
                      {trimDateString(item.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const handleAppointment = () => {
    setModalOpen((prev) => !prev);
  };

  const isDuplicated =
    strToDate(lastDate)?.toDateString().split(' ').slice(0, 4).join(' ') ===
    new Date().toDateString().split(' ').slice(0, 4).join(' ')
      ? true
      : false;

  return (
    <>
      <div className="flex flex-col ml-[10px] rounded-[20px] border border-gray-04 w-full max-w-[690px] h-[980px]">
        <div className="border-b border-b-gray-04 flex justify-between items-center max-h-[118px] px-[30px] py-[22px]">
          <div className="flex gap-5 items-center">
            <Image
              src={roomInfo.imageUrl ?? '/assets/ddoba_profile.png'}
              width={76}
              height={76}
              alt=""
              className="object-cover w-[76px] h-[76px] rounded-[10px]"
            />
            <p className="text-black text-body1">
              {isGroup
                ? (roomInfo as GroupChatRoom).title
                : (roomInfo as DirectChatRoom).opponentName}
            </p>
          </div>
          <button
            onClick={handleAppointment}
            className={clsx(
              'flex gap-1 justify-center items-center text-center border border-gray-05 text-body3 bg-white rounded-[6px] text-gray-09 py-[5px] px-3 hover:bg-gray-02',

              isGroup &&
                roomInfo.appointmentDate &&
                'border-none text-primary-orange6 !bg-primary-orange1',
              !isGroup &&
                roomInfo.appointmentDate &&
                'border-none text-primary-orange6 !bg-primary-orange1',
            )}
          >
            <LuCalendarDays />
            <span>
              {isGroup && !roomInfo.appointmentDate && '약속 잡기'}
              {isGroup && roomInfo.appointmentDate && '약속 잡기 완료'}
              {!isGroup && roomInfo.appointmentDate && '배움 나누기 확정 완료'}
              {!isGroup && !roomInfo.appointmentDate && '배움 나누기 확정하기'}
            </span>
          </button>
        </div>

        <div
          ref={msgBoxRef}
          className="flex-1 p-[30px] overflow-y-auto gray-scroll-container"
        >
          <div className="flex flex-col gap-[10px] -mt-3">
            {/* 배움 나누기 대화방 공지 */}

            {!isGroup && (
              <div className="mb-[20px] bg-gray-02 rounded-[20px] py-[18px] px-6 flex flex-col gap-[6px]">
                <span className="text-gray-08 text-footer-regular">
                  <b>[{(roomInfo as DirectChatRoom).experienceType}]</b>을(를)
                  통해 1:1 대화가 시작되었습니다.
                </span>
                <span className="text-h5 text-black">
                  대화를 통해 만날 시간을 약속하고 상단에 ‘배움 나누기 확정하기’
                  버튼을 눌러주세요!
                </span>
              </div>
            )}

            {logData?.map((item, idx) => renderMessageItem(item, idx, false))}

            {/* date - today status */}
            {!isDuplicated && chatList.length > 1 && (
              <div className="mx-auto">
                <div className="my-4 inline-flex py-2 px-5 text-h5 bg-gray-06 text-white rounded-full text-center items-center justify-center">
                  {moment(new Date()).local().format('YYYY년 MM월 DD일')}
                </div>
              </div>
            )}

            {chatList?.map(
              (item: MsgLogProps, idx: number) =>
                idx !== 0 && renderMessageItem(item, idx, true),
            )}
          </div>
        </div>

        <div className="flex gap-4 h-[94px] px-[30px] py-[18px]">
          <div className="relative w-full">
            <button
              onClick={() => sendEmoticon(roomId)}
              className="absolute h-[38px] inline-flex gap-[6px] items-center z-50 top-[10px] left-[10px] py-[6px] px-3 rounded-[20px] bg-primary-orange1 border border-primary-orange6 hover:bg-primary-orange2 text-h5 text-primary-orange6"
            >
              <FaRegSmile />
              보고싶어요
            </button>

            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              size="lg"
              placeholder="메시지를 입력하세요."
              shape="square"
              type="text"
              className="pl-[136px] !bg-gray-02 border-gray-04 !h-[58px]"
              onKeyDown={(ev) => {
                if (ev.keyCode === 13) {
                  sendChat(roomId);
                }
              }}
            />
          </div>
          <Button
            size="sm"
            shape="square"
            color={disabledBtn() ? 'disabled' : 'default'}
            disabled={disabledBtn()}
            onClick={() => sendChat(roomId)}
          >
            전송
          </Button>
        </div>
      </div>

      {/* 약속 잡기 모달 */}
      <AppointmentModal
        stompClient={stompClient}
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        roomId={roomId}
      />
    </>
  );
};
