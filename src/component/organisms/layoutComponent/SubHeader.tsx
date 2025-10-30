import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  IconButtonProps,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

interface SubHeaderItem {
  icon: string;
  label: string;
  value: string;
}

interface SubHeaderProps {
  isOpen: boolean;
  onClose: () => void;
  items: SubHeaderItem[];
}

const ScrollButton = (props: IconButtonProps & { direction: 'left' | 'right' }) => (
  <IconButton
    {...props}
    size="small"
    sx={{
      zIndex: 2,
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: '4px',
      width: 24,
      height: 24,
      '&:hover': {
        bgcolor: 'action.hover',
      },
      '& .MuiSvgIcon-root': {
        fontSize: 16,
      },
    }}
  >
    {props.direction === 'left' ? <KeyboardArrowLeftIcon /> : <KeyboardArrowRightIcon />}
  </IconButton>
);

const SubHeader: React.FC<SubHeaderProps> = ({ isOpen, onClose, items }) => {
  const mode = useSelector((state: RootState) => state.theme.mode);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = React.useState(false);
  const [showRightScroll, setShowRightScroll] = React.useState(false);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: mode === 'dark' ? 'background.paper' : '#ffffff',
        borderBottom: 1,
        borderColor: mode === 'dark' ? '#444' : 'divider',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}
      >
        {showLeftScroll && <ScrollButton direction="left" onClick={() => scroll('left')} />}
        
        <Box
          ref={containerRef}
          sx={{
            display: 'flex',
            gap: 3,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            flex: 1,
          }}
          onScroll={checkScroll}
        >
          {items.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
              }}
            >
              <img src={item.icon} alt={item.label} style={{ width: 20, height: 20 }} />
              <Box>
                <Typography fontSize={12} color="text.secondary">
                  {item.label}
                </Typography>
                <Typography fontSize={12} fontWeight={400}>
                  {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {showRightScroll && <ScrollButton direction="right" onClick={() => scroll('right')} />}
          <IconButton
            onClick={onClose}
            size="small"
            color="primary"
            sx={{
              border: 1,
              borderColor: 'primary.main',
              borderRadius: '8px',
              p: 0.5,
              width: 24,
              height: 24,
              flexShrink: 0,
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default SubHeader;