import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  Box, 
  Typography, 
  Card,
  CardContent,
  useTheme, 
  alpha,
  Fade,
  Paper,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getCustomerListForDistrubutorCalender } from '../../redux/apis/distrubutor/calenderApis';
import { getSalesRepList, getListOfRoutes } from '../../redux/apis/distrubutor/listApis';
import LoadingSpinner from './loader/LoadingSpinner';
import { MultiSearchableDropdown } from './SearchableDropdown';

const localizer = momentLocalizer(moment);

interface CustomerData {
  C_Number: number;
  C_Name: string;
  C_CoName: string;
  C_OrderDay: number;
  OrderDayName: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  customer: CustomerData;
  allCustomers: CustomerData[];
}

const DistributorCalendar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedSalesRep, setSelectedSalesRep] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any[]>([]);
  const [salesRepList, setSalesRepList] = useState<any[]>([]);
  const [routeList, setRouteList] = useState<any[]>([]);

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date): boolean => {
    const currentDate = new Date();
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  // Generate events for the current month based on customer order days
  const generateEventsForMonth = (customers: CustomerData[], currentDate: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Group customers by their order day
    const customersByDay: { [key: string]: CustomerData[] } = {};
    
    customers.forEach((customer) => {
      // For each day in the month, check if it matches the customer's order day
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Convert customer's order day (1-7) to match JavaScript's day format (0-6)
        const customerOrderDay = customer.C_OrderDay === 7 ? 0 : customer.C_OrderDay;
        
        if (dayOfWeek === customerOrderDay) {
          const dateKey = date.toDateString();
          if (!customersByDay[dateKey]) {
            customersByDay[dateKey] = [];
          }
          customersByDay[dateKey].push(customer);
        }
      }
    });

    // Create one event per day with all customers for that day
    Object.keys(customersByDay).forEach(dateKey => {
      const date = new Date(dateKey);
      const customersForDay = customersByDay[dateKey];
      
      const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0); // 9 AM
      const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 0); // 5 PM
      
      events.push({
        id: date.getTime(), // Use timestamp as unique ID
        title: `${customersForDay.length} customers`,
        start: startTime,
        end: endTime,
        customer: customersForDay[0], // Store first customer as reference
        allCustomers: customersForDay // Store all customers for this day
      });
    });

    return events;
  };

  // Get customers for a specific date
  const getCustomersForDate = (date: Date): CustomerData[] => {
    // Find the event for this specific date
    const eventForDate = events.find(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
    
    if (!eventForDate) {
      return [];
    }
    
    // Return all customers for this day
    return eventForDate.allCustomers;
  };

  // Handle date click - navigate to distributor calendar view
  const handleDateClick = (date: Date) => {
    // Only allow clicks on current month dates
    if (!isCurrentMonth(date)) {
      console.log('Date not in current month, click ignored');
      return;
    }

    const formattedDate = moment(date).format('YYYY-MM-DD');
    
    // Navigate to DistributorStatusView page with the selected date
    navigate('/admin/calender/view', { 
      state: { 
        selectedDate: formattedDate,
        customers: getCustomersForDate(date)
      } 
    });
  };

  // Fetch sales rep list
  const fetchSalesRepList = async () => {
    try {
      const response: any = await getSalesRepList();
      const data = response?.data?.data || response?.data || [];
      setSalesRepList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sales rep list:', error);
      setSalesRepList([]);
    }
  };

  // Fetch route list
  const fetchRouteList = async () => {
    try {
      const response: any = await getListOfRoutes();
      const data = response?.data?.data?.routesWithoutStop || response?.data?.routesWithoutStop || [];
      setRouteList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching route list:', error);
      setRouteList([]);
    }
  };

  // Handle sales rep filter change
  const handleSalesRepChange = (value: any[]) => {
    setSelectedSalesRep(value);
  };

  // Handle route filter change
  const handleRouteChange = (value: any[]) => {
    setSelectedRoute(value);
  };

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: any = {};
        
        // Add filter parameters if selected
        if (selectedSalesRep.length > 0) {
          params.salesRepNumber = selectedSalesRep.map(rep => rep.value);
        }
        if (selectedRoute.length > 0) {
          params.routeNumber = selectedRoute.map(route => route.value);
        }
        
        const response:any = await getCustomerListForDistrubutorCalender(params);
        
        if (response.success && response.data) {
          const currentDate = new Date();
          const generatedEvents = generateEventsForMonth(response.data, currentDate);
          setEvents(generatedEvents);
        } else {
          setError('Failed to fetch calendar data');
        }
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError('Error loading calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
    fetchSalesRepList();
    fetchRouteList();
  }, [selectedSalesRep, selectedRoute]);

  const eventStyleGetter = (event: CalendarEvent) => {
    console.log(event);
    return {
      style: {
        backgroundColor: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: theme.palette.primary.contrastText,
        borderRadius: '8px',
        border: 'none',
        padding: '4px 8px',
        fontSize: '11px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }
      }
    };
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    // Extract count from the event title
    const count = event.title.split(' ')[0];
    
    return (
      <Fade in={true} timeout={300}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 0.5,
          width: '100%',
          minHeight: '20px'
        }}>
          <Typography variant="caption" sx={{ 
            fontWeight: '500', 
            display: 'block',
            color: 'white',
            fontSize: '11px',
            lineHeight: '1.2',
            textAlign: 'center'
          }}>
            {count} {event.allCustomers.length > 1 ? 'Customers' : 'Customer'}
          </Typography>
        </Box>
      </Fade>
    );
  };

  // Custom day cell component to handle date clicks
  const DayCellComponent = ({ children, value }: any) => {
    const isCurrentMonthDate = isCurrentMonth(value);
    const isToday = moment(value).isSame(moment(), 'day');
    
    const handleDayClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Only allow clicks on current month dates
      if (isCurrentMonthDate) {
        handleDateClick(value);
      }
    };
    
    return (
      <Box 
        sx={{ 
          height: '100%', 
          width: '100%',
          position: 'relative',
          cursor: isCurrentMonthDate ? 'pointer' : 'not-allowed',
          opacity: isCurrentMonthDate ? 1 : 0.4,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: isCurrentMonthDate ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            transform: isCurrentMonthDate ? 'scale(1.02)' : 'none',
          }
        }}
        onClick={handleDayClick}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 0,
          cursor: isCurrentMonthDate ? 'pointer' : 'not-allowed',
          borderRadius: isToday ? '8px' : '4px',
          border: isToday ? `2px solid ${theme.palette.primary.main}` : 'none',
          backgroundColor: isToday ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
        }} />
        <Box sx={{ 
          position: 'relative', 
          zIndex: 1,
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          p: 0.5,
          cursor: isCurrentMonthDate ? 'pointer' : 'not-allowed',
          pointerEvents: 'auto'
        }}>
          {children}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Card elevation={3} sx={{ 
        minHeight: '500px',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
        borderRadius: 3
      }}>
        <CardContent sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          minHeight: '500px'
        }}>
          <LoadingSpinner message="Loading distributor calendar data..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={3} sx={{ 
        minHeight: '500px',
        background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)}, ${alpha(theme.palette.warning.main, 0.05)})`,
        borderRadius: 3
      }}>
        <CardContent sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          minHeight: '500px'
        }}>
          <Box textAlign="center">
            <Typography color="error" variant="h6" gutterBottom>
              ⚠️ Error Loading Calendar
            </Typography>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MultiSearchableDropdown
              // label="Sales Rep"
              options={salesRepList.map(salesRep => ({
                label: `${salesRep.S_Desc} (${salesRep.S_Number})`,
                value: salesRep.S_Number,
                // description: `Sales Rep Number: ${salesRep.S_Number}`
              }))}
              value={selectedSalesRep}
              onChange={handleSalesRepChange}
              placeholder="Search Sales Reps"
              sx={{ mb: 0 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MultiSearchableDropdown
              // label="Route"
              options={routeList.map(route => ({
                label: `Route ${route.Route_Number}`,
                value: route.Route_Number,
                // description: `Route Number: ${route.Route_Number}`
              }))}
              value={selectedRoute}
              onChange={handleRouteChange}
              placeholder="Search Routes"
              sx={{ mb: 0 }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Card 
        elevation={4} 
        sx={{ 
          p: 0, 
          background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
          color: theme.palette.text.primary,
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`
        }}
        onClick={(e) => {
          // Handle clicks on empty calendar areas
          const target = e.target as HTMLElement;
          
          // Check if clicked on any calendar-related element
          if (target.classList.contains('rbc-day-slot') || 
              target.classList.contains('rbc-date-cell') ||
              target.closest('.rbc-day-slot') ||
              target.closest('.rbc-date-cell')) {
            
            // Find the closest date element
            let dateElement = target.closest('[data-date]');
            if (!dateElement) {
              // Try to find date from parent elements
              const daySlot = target.closest('.rbc-day-slot');
              if (daySlot) {
                const dateCell = daySlot.querySelector('[data-date]');
                if (dateCell) {
                  dateElement = dateCell;
                }
              }
            }
            
            if (dateElement) {
              const dateAttr = dateElement.getAttribute('data-date');
              if (dateAttr) {
                const date = new Date(dateAttr);
                // Only allow clicks on current month dates
                if (isCurrentMonth(date)) {
                  handleDateClick(date);
                }
              }
            }
          }
        }}
      >
        <Box sx={{ p: 2, height: '550px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ 
              color: theme.palette.text.primary,
            }}
            views={['month']}
            defaultView={Views.MONTH}
            components={{
              event: EventComponent,
              dateCellWrapper: DayCellComponent
            }}
            eventPropGetter={eventStyleGetter}
            tooltipAccessor={(event:any) => `${event.customer.C_Name} - ${event.customer.OrderDayName}`}
            selectable={true}
            onSelectSlot={(slotInfo) => {
              if (slotInfo.action === 'select' && isCurrentMonth(slotInfo.start)) {
                handleDateClick(slotInfo.start);
              }
            }}
            onSelectEvent={(event) => {
              if (isCurrentMonth(event.start)) {
                handleDateClick(event.start);
              }
            }}
            onDoubleClickEvent={(event) => {
              if (isCurrentMonth(event.start)) {
                handleDateClick(event.start);
              }
            }}
            onNavigate={(newDate) => {
              // This will be called when navigating between months
              console.log('Navigated to:', newDate);
            }}
            popup={true}
            className="distributor-calendar"
            dayPropGetter={() => ({
              style: {
                backgroundColor: 'transparent',
              }
            })}
            slotPropGetter={() => ({
              style: {
                backgroundColor: 'transparent',
              }
            })}
          />
        </Box>
      </Card>

      <style>{`
        .distributor-calendar .rbc-calendar {
          background: transparent !important;
          color: ${theme.palette.text.primary} !important;
          font-family: ${theme.typography.fontFamily} !important;
        }
        
        .distributor-calendar .rbc-header {
          background: ${theme.palette.primary.main} !important;
          color: ${theme.palette.common.white} !important;
          padding: 12px 8px !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          border-bottom: 2px solid ${theme.palette.primary.main} !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        
        .distributor-calendar .rbc-month-view {
          background: transparent !important;
        }
        
        .distributor-calendar .rbc-month-row {
          border-right: 1px solid ${alpha(theme.palette.divider, 0.3)} !important;
          border-bottom: 1px solid ${alpha(theme.palette.divider, 0.3)} !important;
          max-width: content-box !important;
        }
        
        .distributor-calendar .rbc-date-cell {
          border-right: 1px solid ${alpha(theme.palette.divider, 0.2)} !important;
          color: ${theme.palette.text.primary} !important;
          font-weight: 500 !important;
          transition: all 0.2s ease-in-out !important;
        }
        
        .distributor-calendar .rbc-off-range-bg {
          background: ${alpha(theme.palette.action.disabledBackground, 0.3)} !important;
        }
        
        .distributor-calendar .rbc-today {
          background: linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)}) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px ${alpha(theme.palette.primary.main, 0.2)} !important;
          position: relative !important;
        }
        
        .distributor-calendar .rbc-today::before {
          position: absolute !important;
          top: 0px !important;
          right: 0px !important;
          background: ${theme.palette.primary.main} !important;
          color: white !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          z-index: 10 !important;
        }
        
        .distributor-calendar .rbc-today .rbc-date-cell {
          font-weight: 700 !important;
          color: ${theme.palette.primary.main} !important;
        }
        
        .distributor-calendar .rbc-event {
          background: linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark}) !important;
          color: ${theme.palette.primary.contrastText} !important;
          border-radius: 6px !important;
          border: none !important;
          box-shadow: 0 2px 8px ${alpha(theme.palette.primary.main, 0.3)} !important;
          transition: all 0.2s ease-in-out !important;
          font-weight: 500 !important;
          max-width: 100px !important;
        }
        
        .distributor-calendar .rbc-event:hover {
          background: linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main}) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px ${alpha(theme.palette.primary.main, 0.4)} !important;
        }
        
        .distributor-calendar .rbc-selected {
          background: ${alpha(theme.palette.primary.main, 0.1)} !important;
          color: ${theme.palette.primary.main} !important;
          border-radius: 6px !important;
        }
        
        .distributor-calendar .rbc-selected * {
          color: ${theme.palette.primary.main} !important;
        }
        
        .distributor-calendar .rbc-day-slot .rbc-event {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 20px !important;
          margin-bottom: 2px !important;
        }
        
        .distributor-calendar .rbc-date-cell {
          cursor: pointer !important;
          pointer-events: auto !important;
          transition: all 0.2s ease-in-out !important;
        }
        
        .distributor-calendar .rbc-date-cell:hover {
          background: ${alpha(theme.palette.primary.main, 0.05)} !important;
          transform: scale(1.02) !important;
        }
        
        .distributor-calendar .rbc-day-slot {
          cursor: pointer !important;
          pointer-events: auto !important;
          position: relative !important;
          transition: all 0.2s ease-in-out !important;
          min-height: 60px !important;
        }
        
        .distributor-calendar .rbc-day-slot:hover {
          background: ${alpha(theme.palette.primary.main, 0.03)} !important;
        }
        
        .distributor-calendar .rbc-day-slot * {
          pointer-events: auto !important;
        }
        
        .distributor-calendar .rbc-day-slot .rbc-events-container {
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        
        .distributor-calendar .rbc-month-row {
          cursor: pointer !important;
        }
        
        .distributor-calendar .rbc-month-row * {
          pointer-events: auto !important;
        }
        
        .distributor-calendar .rbc-row-segment {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .distributor-calendar .rbc-off-range {
          opacity: 0.4 !important;
          cursor: not-allowed !important;
        }
        
        .distributor-calendar .rbc-off-range * {
          cursor: not-allowed !important;
        }
        
        .distributor-calendar .rbc-off-range:hover {
          background: transparent !important;
          transform: none !important;
        }
        
        .distributor-calendar .rbc-toolbar {
          margin-bottom: 16px !important;
        }
        
        .distributor-calendar .rbc-toolbar button {
          background: ${alpha(theme.palette.primary.main, 0.1)} !important;
          color: ${theme.palette.primary.main} !important;
          border: 1px solid ${alpha(theme.palette.primary.main, 0.3)} !important;
          border-radius: 6px !important;
          padding: 8px 16px !important;
          font-weight: 600 !important;
          transition: all 0.2s ease-in-out !important;
          margin-right: 10px !important;
        }
        
        .distributor-calendar .rbc-toolbar button:hover {
          background: ${theme.palette.primary.main} !important;
          color: white !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px ${alpha(theme.palette.primary.main, 0.3)} !important;
        }
      `}</style>
    </>
  );
};

export default DistributorCalendar;
