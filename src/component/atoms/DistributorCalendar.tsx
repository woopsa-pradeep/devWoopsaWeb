import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { 
  Box, 
  Typography, 
  Card,
  CardContent,
  useTheme, 
  alpha,
  Paper,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getCustomerListForDistrubutorCalender } from '../../redux/apis/distrubutor/calenderApis';
import { getSalesRepList, getListOfRoutes } from '../../redux/apis/distrubutor/listApis';
import LoadingSpinner from './loader/LoadingSpinner';
import { MultiSearchableDropdown } from './SearchableDropdown';

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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter state
  const [selectedSalesRep, setSelectedSalesRep] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any[]>([]);
  const [salesRepList, setSalesRepList] = useState<any[]>([]);
  const [routeList, setRouteList] = useState<any[]>([]);

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Generate events for the current month based on customer order days
  const generateEventsForMonth = (customers: CustomerData[], viewDate: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
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
    const eventForDate = events.find(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
    
    return eventForDate ? eventForDate.allCustomers : [];
  };

  // Get customers count for a specific date
  const getCustomerCountForDate = (date: Date): number => {
    return getCustomersForDate(date).length;
  };

  // Navigate to today's customer page
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    
    // Navigate directly to today's customer page (same as clicking on calendar date)
    const formattedDate = moment(today).format('YYYY-MM-DD');
    navigate('/admin/calender/view', { 
      state: { 
        selectedDate: formattedDate,
        customers: getCustomersForDate(today)
      } 
    });
  };

  // Generate calendar days for the current month view
  const generateCalendarDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
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
  }, [selectedSalesRep, selectedRoute, currentDate]);

  // Calendar day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateCalendarDays();

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
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          background: theme.palette.background.paper,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MultiSearchableDropdown
              options={salesRepList.map(salesRep => ({
                label: `${salesRep.S_Desc} (${salesRep.S_Number})`,
                value: salesRep.S_Number,
              }))}
              value={selectedSalesRep}
              onChange={handleSalesRepChange}
              placeholder="Search Sales Reps"
              sx={{ mb: 0 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MultiSearchableDropdown
              options={routeList.map(route => ({
                label: `Route ${route.Route_Number}`,
                value: route.Route_Number,
              }))}
              value={selectedRoute}
              onChange={handleRouteChange}
              placeholder="Search Routes"
              sx={{ mb: 0 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Modern Calendar Design */}
      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper,
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
        }}
      >
        {/* Modern Header */}
        <Box
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            py: { xs: 1, sm: 1.25, md: 1.5 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
              color: theme.palette.text.primary,
              letterSpacing: { xs: '0.2px', sm: '0.25px', md: '0.3px' },
            }}
          >
            {moment(currentDate).format('MMMM YYYY')}
          </Typography>
          <Box
            onClick={handleToday}
            sx={{
              px: { xs: 1.5, sm: 1.75, md: 2 },
              py: { xs: 0.25, sm: 0.5, md: 0.625 },
              borderRadius: { xs: 1.5, sm: 2 },
              cursor: 'pointer',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              backgroundColor: 'transparent',
              color: theme.palette.primary.main,
              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
              },
            }}
          >
            Today
          </Box>
        </Box>

        {/* Modern Calendar Grid */}
        <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
          {/* Day Names Header - Simple & Modern */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: { xs: 0.25, sm: 0.5, md: 0.75 },
              mb: { xs: 0.5, sm: 0.75, md: 1 },
              pb: { xs: 0.5, sm: 0.75, md: 1 },
              borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            {dayNames.map((day, index) => {
              const today = new Date();
              const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
              const isToday = index === todayDayOfWeek;
              return (
                <Typography
                  key={day}
                  sx={{
                    textAlign: 'center',
                    fontWeight: isToday ? 700 : 600,
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                    color: isToday
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    py: { xs: 0.25, sm: 0.375, md: 0.5 },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: { xs: '-6px', sm: '-7px', md: '-9px' },
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: isToday ? '30px' : '20px',
                      height: '2px',
                      borderRadius: '2px',
                      background: isToday
                        ? theme.palette.primary.main
                        : alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  {day}
                </Typography>
              );
            })}
          </Box>

          {/* Calendar Days - Modern Grid Design */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: { xs: 0.5, sm: 0.75, md: 1 },
            }}
          >
            {calendarDays.map((date, index) => {
              const isCurrentMonthDate = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              const customerCount = getCustomerCountForDate(date);
              const hasCustomers = customerCount > 0;

              return (
                <Box
                  key={index}
                  onClick={() => {
                    if (isCurrentMonthDate) {
                  handleDateClick(date);
                }
                  }}
                  sx={{
                    minHeight: { xs: '55px', sm: '65px', md: '75px', lg: '80px' },
                    p: { xs: 0.75, sm: 0.875, md: 1 },
                    borderRadius: { xs: 1.5, sm: 2 },
                    cursor: isCurrentMonthDate ? 'pointer' : 'default',
                    position: 'relative',
                    background: isTodayDate
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.05)})`
                      : 'transparent',
                    border: isTodayDate
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isCurrentMonthDate ? 1 : 0.35,
                    '&:hover': isCurrentMonthDate
                      ? {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        }
                      : {},
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    overflow: 'hidden',
                  }}
                >
                  {/* Date Number - Circular Badge Style */}
                  <Box
                    sx={{
                      width: { xs: isTodayDate ? '24px' : '22px', sm: isTodayDate ? '28px' : '26px', md: isTodayDate ? '32px' : '28px' },
                      height: { xs: isTodayDate ? '24px' : '22px', sm: isTodayDate ? '28px' : '26px', md: isTodayDate ? '32px' : '28px' },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isTodayDate
                        ? theme.palette.primary.main
                        : 'transparent',
                      mb: { xs: 0.25, sm: 0.375, md: 0.5 },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: isTodayDate ? 700 : 500,
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem', lg: '0.875rem' },
                        color: isTodayDate
                          ? theme.palette.common.white
                          : isCurrentMonthDate
                          ? theme.palette.text.primary
                          : alpha(theme.palette.text.primary, 0.4),
                        lineHeight: 1,
                      }}
                    >
                      {date.getDate()}
                    </Typography>
                  </Box>

                  {/* Customer Indicator - Single Dot with Count */}
                  {hasCustomers && isCurrentMonthDate && (
                    <Box
                      sx={{
                        mt: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: { xs: 0.4, sm: 0.5, md: 0.6 },
                      }}
                    >
                      {/* Single Dot */}
                      <Box
                        sx={{
                          width: { xs: '5px', sm: '6px', md: '7px' },
                          height: { xs: '5px', sm: '6px', md: '7px' },
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.3)}`,
                          flexShrink: 0,
                        }}
                      />
                      {/* Customer Count */}
                      <Typography
                        sx={{
                          fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                          color: theme.palette.text.secondary,
                          fontWeight: 400,
                          lineHeight: 1,
                        }}
                      >
                        {customerCount} {customerCount === 1 ? 'customer' : 'customers'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Card>
    </>
  );
};

export default DistributorCalendar;
