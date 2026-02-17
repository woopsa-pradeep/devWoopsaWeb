import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CustomButton from "./CustomButton";
import CommonModal from "./CommonModal";
import AddIcon from "@mui/icons-material/Add";
import { IconButton, Tooltip } from "@mui/material";

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
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Predefined time slots with 1-hour gaps starting from 00-01 to 23-24
  const predefinedTimeSlots = [
    "00:00 - 01:00",
    "01:00 - 02:00",
    "02:00 - 03:00",
    "03:00 - 04:00",
    "04:00 - 05:00",
    "05:00 - 06:00",
    "06:00 - 07:00",
    "07:00 - 08:00",
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
    "21:00 - 22:00",
    "22:00 - 23:00",
    "23:00 - 00:00",
  ];

  const handleAddTimeSlots = () => {
    if (!selectedDay || selectedTimeSlots.length === 0) return;

    const newTimeSlots: TimeSlot[] = selectedTimeSlots.map((timeSlot) => {
      const [startTime, endTime] = timeSlot.split(" - ");
      return {
        startTime,
        endTime,
      };
    });

    const updatedValue = value.map((day) => {
      if (day.day === selectedDay) {
        return {
          ...day,
          timeSlots: newTimeSlots, // Replace all slots with the selected ones
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
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);

    if (checked) {
      // select all slots
      setSelectedTimeSlots(predefinedTimeSlots);
    } else {
      // clear all
      setSelectedTimeSlots([]);
    }
  };

  const handleOpenModal = (day: string) => {
    setSelectedDay(day);
    setOpenModal(true);

    const dayData = value.find((d) => d.day === day);

    if (dayData && dayData.timeSlots.length > 0) {
      const existingTimeSlots = dayData.timeSlots.map(
        (slot) => `${slot.startTime} - ${slot.endTime}`,
      );

      setSelectedTimeSlots(existingTimeSlots);
      setSelectAll(existingTimeSlots.length === predefinedTimeSlots.length);
    } else {
      setSelectedTimeSlots([]);
      setSelectAll(false);
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlots((prev) => {
      let updatedSlots: string[];

      if (prev.includes(timeSlot)) {
        updatedSlots = prev.filter((slot) => slot !== timeSlot);
      } else {
        updatedSlots = [...prev, timeSlot];
      }

      // If not all slots are selected anymore → uncheck Select All
      if (updatedSlots.length !== predefinedTimeSlots.length) {
        setSelectAll(false);
      }

      // If all slots selected manually → auto check Select All
      if (updatedSlots.length === predefinedTimeSlots.length) {
        setSelectAll(true);
      }
      return updatedSlots;
    });
  };

  // Initialize days if not present
  React.useEffect(() => {
    if (value.length === 0) {
      const initialDays = daysOfWeek.map((day) => ({
        day,
        timeSlots: [],
      }));
      onChange(initialDays);
    }
  }, [value.length, onChange]);

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: theme.palette.text.primary,
        }}
      >
        Day Time Slots
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: 2,
        }}
      >
        {value.map((dayData) => (
          <Paper
            key={dayData.day}
            elevation={1}
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  lineHeight: "28px",
                }}
              >
                {dayData.day}
              </Typography>

              <Tooltip title="Add Time Slot" arrow>
                <IconButton
                  onClick={() => handleOpenModal(dayData.day)}
                  size="small"
                  sx={{
                    width: 28,
                    height: 28,
                    border: `1px solid ${theme.palette.primary.main}`,
                    borderRadius: "6px",
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main,
                      color: "#ffffff",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {dayData.timeSlots.length > 0 ? (
              <Box
                sx={{
                  mt: 1.5,
                  px: 1,
                  py: 0.5,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                  },
                  gap: 1,
                  maxHeight: { xs: 160, sm: 200 },
                  overflowY: "auto",
                }}
              >
                {dayData.timeSlots.map((slot, index) => (
                  <Box
                    key={slot.id || `slot-${index}`}
                    sx={{
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        width: "100%",
                        height: 40,
                        padding: "4px 6px",

                        backgroundColor: theme.palette.primary.main,
                        color: "#ffffff",
                        borderRadius: "14px",

                        fontSize: "12px",
                        fontWeight: 500,
                        textAlign: "center",
                        lineHeight: 1.2,

                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",

                        transition: "all 0.2s ease-in-out",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        border: "2px solid transparent",

                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                          borderColor: theme.palette.primary.dark,
                        },
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
      </Box>

      {/* Custom Modal for Time Slot Selection */}
      <CommonModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={`Select Time Slot for ${selectedDay}`}
        maxWidth="sm"
      >
        <Box
          sx={{
            p: { xs: 1, sm: 1.5 },
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              pr: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose a time slot from the available options:
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  color="primary"
                />
              }
              label="Select All Time Slots"
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(4, 1fr)",
                },
                gap: 1.5,
                p: 2,
                maxHeight: { xs: 260, sm: 320 },
                overflowY: "auto",
              }}
            >
              {predefinedTimeSlots.map((timeSlot) => (
                <Box
                  key={timeSlot}
                  onClick={() => handleTimeSlotSelect(timeSlot)}
                  sx={{
                    cursor: "pointer",
                    padding: "12px 8px",
                    borderRadius: "10px",
                    border: `2px solid ${
                      selectedTimeSlots.includes(timeSlot)
                        ? theme.palette.primary.main
                        : theme.palette.grey[300]
                    }`,
                    backgroundColor: selectedTimeSlots.includes(timeSlot)
                      ? theme.palette.primary.main
                      : theme.palette.background.paper,
                    color: selectedTimeSlots.includes(timeSlot)
                      ? "#ffffff"
                      : theme.palette.text.primary,
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: selectedTimeSlots.includes(timeSlot)
                      ? 600
                      : 500,
                    transition: "all 0.2s ease-in-out",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "40px",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: selectedTimeSlots.includes(timeSlot)
                        ? "0 6px 20px rgba(0, 0, 0, 0.15)"
                        : "0 3px 10px rgba(0, 0, 0, 0.1)",
                      borderColor: selectedTimeSlots.includes(timeSlot)
                        ? theme.palette.primary.dark
                        : theme.palette.primary.main,
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      backgroundColor: selectedTimeSlots.includes(timeSlot)
                        ? theme.palette.primary.dark
                        : "transparent",
                      transition: "background-color 0.2s ease-in-out",
                    },
                  }}
                >
                  {timeSlot}
                  {selectedTimeSlots.includes(timeSlot) && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#ffffff",
                      }}
                    >
                      ✓
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              p: { xs: 1, sm: 2 },
            }}
          >
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
