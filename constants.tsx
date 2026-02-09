
import React from 'react';
import { Room, RoomType, RoomStatus } from './types';

export const COLORS = {
  primary: '#4A3728',
  secondary: '#8B5E3C',
  accent: '#D4A373',
  bg: '#FDFBF7',
};

export const INITIAL_ROOMS: Room[] = Array.from({ length: 28 }, (_, i) => {
  const num = i + 1;
  let type = RoomType.STANDARD;
  let price = 1500;
  if (num > 20) { type = RoomType.SUITE; price = 3500; }
  else if (num > 10) { type = RoomType.DELUXE; price = 2200; }

  return {
    id: num,
    number: num.toString().padStart(3, '0'),
    type,
    status: RoomStatus.AVAILABLE,
    baseRate: price,
    weekendRate: price * 1.2
  };
});

export const HusLogo = ({ className }: { className?: string }) => (
  <div className={`flex flex-col items-center justify-center leading-none ${className}`}>
    <span className="text-4xl font-bold tracking-tighter" style={{ fontFamily: 'serif' }}>Hǔs</span>
    <span className="text-[10px] tracking-[0.4em] font-light mt-1">HOTEL</span>
  </div>
);
