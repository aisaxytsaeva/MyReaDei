import React, { useState } from 'react';
import Button from '../Button/Button';

const BookingMenu = ({ isOpen, onClose, onBook }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const bookingPeriods = [
    { days: 7, label: '7 дней' },
    { days: 14, label: '14 дней' },
    { days: 30, label: '30 дней' },
    { days: 60, label: '60 дней' }
  ];

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    onBook(period);
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        minWidth: '250px'
      }}>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0 }}>Booking</h3>
          <button 
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ marginBottom: '15px' }}>
          Забронировать на
        </p>

        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bookingPeriods.map(period => (
            <Button
              key={period.days}
              onClick={() => handlePeriodSelect(period.days)}
              variant="primary" 
              size="medium"
              style={{ width: '100%' }}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingMenu;