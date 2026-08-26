import React, { createContext, useContext, useState } from 'react';
import type { Coords } from '../lib/firestore';

interface BookingData {
  pickupLocation: string;
  pickupCoords?: Coords;
  destination: string;
  destinationCoords?: Coords;
  distanceKm?: number;
  date: string;
  time: string;
  truckId?: string;
  truckName?: string;
  price?: number;
  bookingId?: string;
}

interface BookingContextType {
  booking: BookingData;
  setBooking: React.Dispatch<React.SetStateAction<BookingData>>;
  resetBooking: () => void;
}

const defaultBooking: BookingData = {
  pickupLocation: 'Current Location',
  destination: '',
  date: 'Now',
  time: 'ASAP',
};

const BookingContext = createContext<BookingContextType>({
  booking: defaultBooking,
  setBooking: () => {},
  resetBooking: () => {},
});

export const useBooking = () => useContext(BookingContext);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [booking, setBooking] = useState<BookingData>(defaultBooking);

  const resetBooking = () => setBooking(defaultBooking);

  return (
    <BookingContext.Provider value={{ booking, setBooking, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};
