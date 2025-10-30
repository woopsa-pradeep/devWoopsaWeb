import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,

} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CustomButton from './CustomButton';
import CommonModal from './CommonModal';

interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
}

interface DayTimeSlots {
  day: string;
  timeSlots: TimeSlot[];
}

interface TimeSlotPickerProps {
  value: DayTimeSlots[];
  onChange: (value: DayTimeSlots[]) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ value, onChange }) => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  const daysOfWeek = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  // Predefined time slots with 1-hour gaps starting from 00-01 to 23-24
  const predefinedTimeSlots = [
    '00:00 - 01:00',
    '01:00 - 02:00',
    '02:00 - 03:00',
    '03:00 - 04:00',
    '04:00 - 05:00',
    '05:00 - 06:00',
    '06:00 - 07:00',
    '07:00 - 08:00',
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00',
    '18:00 - 19:00',
    '19:00 - 20:00',
    '20:00 - 21:00',
    '21:00 - 22:00',
    '22:00 - 23:00',
    '23:00 - 24:00'
  ];

  const handleAddTimeSlots = () => {
    if (!selectedDay || selectedTimeSlots.length === 0) return;

    const newTimeSlots: TimeSlot[] = selectedTimeSlots.map(timeSlot => {
      const [startTime, endTime] = timeSlot.split(' - ');
      return {
        startTime,
        endTime
      };
    });

    const updatedValue = value.map(day => {
      if (day.day === selectedDay) {
        return {
          ...day,
          timeSlots: newTimeSlots // Replace all slots with the selected ones
        };
      }
      return day;
    });

    onChange(updatedValue);
    setOpenModal(false);
    setSelectedTimeSlots([]);
  };

  // const handleDeleteTimeSlot = (dayName: string, slotId: string) => {
  //   const updatedValue = value.map(day => {
  //     if (day.day === dayName) {
  //       return {
  //         ...day,
  //         timeSlots: day.timeSlots.filter(slot => slot.id && slot.id !== slotId)
  //       };
  //     }
  //     return day;
  //   });

  //   onChange(updatedValue);
  // };

  const handleOpenModal = (day: string) => {
    setSelectedDay(day);
    setOpenModal(true);
    
    // Get existing time slots for this day and pre-select them
    const dayData = value.find(d => d.day === day);
    if (dayData && dayData.timeSlots.length > 0) {
      const existingTimeSlots = dayData.timeSlots.map(slot => `${slot.startTime} - ${slot.endTime}`);
      setSelectedTimeSlots(existingTimeSlots);
    } else {
      setSelectedTimeSlots([]);
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(timeSlot)) {
        return prev.filter(slot => slot !== timeSlot);
      } else {
        return [...prev, timeSlot];
      }
    });
  };

  // Initialize days if not present
  React.useEffect(() => {
    if (value.length === 0) {
      const initialDays = daysOfWeek.map(day => ({
        day,
        timeSlots: []
      }));
      onChange(initialDays);
    }
  }, [value.length, onChange]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
        Day Time Slots
      </Typography>
      
      {value.map((dayData) => (
        <Paper 
          key={dayData.day} 
          elevation={1} 
          sx={{ 
            mb: 2, 
            p: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {dayData.day}
            </Typography>
            <CustomButton
              onClick={() => handleOpenModal(dayData.day)}
              appearance="outlined"
              size="small"
              fullWidth={false}
              sx={{
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }
              }}
            >
              Add Time Slot
            </CustomButton>
          </Box>
          
                     {dayData.timeSlots.length > 0 ? (
             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
               {dayData.timeSlots.map((slot, index) => (
                 <Box
                   key={slot.id || `slot-${index}`}
                   sx={{
                     position: 'relative',
                     display: 'inline-block',
                     margin: '4px 2px'
                   }}
                 >
                   {/* Badge-like time slot */}
                   <Box
                     sx={{
                       display: 'inline-flex',
                       alignItems: 'center',
                       padding: '8px 12px',
                       backgroundColor: theme.palette.primary.main,
                       color: '#ffffff',
                       borderRadius: '16px',
                       fontSize: '12px',
                       fontWeight: 500,
                       transition: 'all 0.2s ease-in-out',
                       boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                       border: '2px solid transparent',
                       '&:hover': {
                         transform: 'translateY(-2px)',
                         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                         borderColor: theme.palette.primary.dark,
                       }
                     }}
                   >
                     {`${slot.startTime} - ${slot.endTime}`}
                   </Box>
                   
                   {/* Cross button positioned above */}
                   {/* <CustomButton
                     size="small"
                     onClick={() => slot.id && handleDeleteTimeSlot(dayData.day, slot.id)}
                     sx={{
                       position: 'absolute',
                       top: '-8px',
                       right: '-8px',
                       minWidth: '20px',
                       width: '20px',
                       height: '20px',
                       padding: 0,
                       backgroundColor: theme.palette.error.main,
                       color: '#ffffff',
                       fontSize: '12px',
                       fontWeight: 'bold',
                       borderRadius: '50%',
                       border: '2px solid #ffffff',
                       boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                               zIndex: 0,
                       '&:hover': {
                         backgroundColor: theme.palette.error.dark,
                         transform: 'scale(1.1)',
                         boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
                       }
                     }}
                   >
                     ×
                   </CustomButton> */}
                 </Box>
               ))}
             </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No time slots added
            </Typography>
          )}
        </Paper>
      ))}

      {/* Custom Modal for Time Slot Selection */}
      <CommonModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={`Select Time Slot for ${selectedDay}`}
        maxWidth="md"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a time slot from the available options:
          </Typography>
          
                                <Box sx={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(4, 1fr)', 
             gap: 2, 
             p: 3,
             maxHeight: '400px',
             overflowY: 'auto'
           }}>
             {predefinedTimeSlots.map((timeSlot) => (
               <Box
                 key={timeSlot}
                 onClick={() => handleTimeSlotSelect(timeSlot)}
                                   sx={{
                    cursor: 'pointer',
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedTimeSlots.includes(timeSlot) 
                      ? theme.palette.primary.main 
                      : theme.palette.grey[300]}`,
                    backgroundColor: selectedTimeSlots.includes(timeSlot) 
                      ? theme.palette.primary.main 
                      : theme.palette.background.paper,
                    color: selectedTimeSlots.includes(timeSlot) 
                      ? '#ffffff' 
                      : theme.palette.text.primary,
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: selectedTimeSlots.includes(timeSlot) ? 600 : 500,
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '40px',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: selectedTimeSlots.includes(timeSlot)
                        ? '0 6px 20px rgba(0, 0, 0, 0.15)'
                        : '0 3px 10px rgba(0, 0, 0, 0.1)',
                      borderColor: selectedTimeSlots.includes(timeSlot)
                        ? theme.palette.primary.dark
                        : theme.palette.primary.main,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: selectedTimeSlots.includes(timeSlot)
                        ? theme.palette.primary.dark
                        : 'transparent',
                      transition: 'background-color 0.2s ease-in-out'
                    }
                  }}
               >
                 {timeSlot}
                 {selectedTimeSlots.includes(timeSlot) && (
                   <Box
                     sx={{
                       position: 'absolute',
                       top: '8px',
                       right: '8px',
                       width: '16px',
                       height: '16px',
                       borderRadius: '50%',
                                               backgroundColor: theme.palette.primary.main,
                                               display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                     }}
                   >
                     ✓
                   </Box>
                 )}
               </Box>
             ))}
           </Box>
           
           <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, p: 2 }}>
             <CustomButton
               onClick={() => setOpenModal(false)}
               appearance="outlined"
               fullWidth={false}
             >
               Cancel
             </CustomButton>
             <CustomButton
               onClick={handleAddTimeSlots}
               appearance="filled"
               fullWidth={false}
               disabled={selectedTimeSlots.length === 0}
             >
               Add Time Slots ({selectedTimeSlots.length})
             </CustomButton>
           </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default TimeSlotPicker; 