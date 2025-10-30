import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import { getStories, updateStory } from '../../../redux/apis/retailer/stories';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import moment from 'moment';

interface Story {
  isActive: boolean;
  id: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  updatedAt: string;
  createdAt: string;
}

interface StoriesProps {
  open: boolean;
  onClose: () => void;
}

const Stories: React.FC<StoriesProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const logo = useSelector((state: RootState) => state.auth.logo);
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to track story view
  const trackStoryView = async (storyId: number) => {
    try {
      await updateStory(storyId.toString());
    } catch (error) {
      console.error('Error tracking story view:', error);
      // Don't show error to user as this is just analytics
    }
  };

  // Fetch stories when modal opens
  useEffect(() => {
    if (open) {
      fetchStories();
    }
  }, [open]);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStories();
      const fetchedStories :any = (response as any)?.data || response || [];
      // console.log(fetchedStories,'fetchedStories');
      // Filter only active stories
      setStories(fetchedStories.stories || []);
    } catch (err: any) {
      console.error('Error fetching stories:', err);
      setError(err.response?.data?.message || 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const currentStory = stories[currentStoryIndex];
  const storyDuration = 5000; // 5 seconds per story

  // Progress bar animation
  useEffect(() => {
    if (!open || !isPlaying || !currentStory || stories.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            return 0;
          } else {
            // End of stories
            onClose();
            return 0;
          }
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [open, isPlaying, currentStoryIndex, stories.length, onClose, storyDuration, currentStory]);

  // Reset progress when story changes and track view
  useEffect(() => {
    setProgress(0);
    // Track story view when story changes
    if (currentStory && stories.length > 0) {
      trackStoryView(currentStory.id);
    }
  }, [currentStoryIndex, currentStory, stories.length]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStoryIndex(0);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [open]);

  // Track first story view when modal opens
  useEffect(() => {
    if (open && stories.length > 0 && currentStory) {
      trackStoryView(currentStory.id);
    }
  }, [open, stories, currentStory]);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setProgress(0);
      // Track view for the next story
      if (stories[nextIndex]) {
        trackStoryView(stories[nextIndex].id);
      }
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setProgress(0);
      // Track view for the previous story
      if (stories[prevIndex]) {
        trackStoryView(stories[prevIndex].id);
      }
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!open) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        handlePrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleNext();
        break;
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
      case ' ':
        event.preventDefault();
        setIsPlaying(!isPlaying);
        break;
    }
  }, [open, isPlaying, handlePrevious, handleNext, handleClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  // Show loading state
  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'black',
            borderRadius: isMobile ? 0 : 2,
            maxWidth: isMobile ? '100vw' : '400px',
            maxHeight: isMobile ? '100vh' : '80vh',
            width: isMobile ? '100vw' : '400px',
            height: isMobile ? '100vh' : '80vh',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress sx={{ color: 'white' }} />
          <Typography variant="body1" color="white">
            Loading stories...
          </Typography>
        </Box>
      </Dialog>
    );
  }

  // Show error state
  if (error) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'black',
            borderRadius: isMobile ? 0 : 2,
            maxWidth: isMobile ? '100vw' : '400px',
            maxHeight: isMobile ? '100vh' : '80vh',
            width: isMobile ? '100vw' : '400px',
            height: isMobile ? '100vh' : '80vh',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="white">
            Error Loading Stories
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" textAlign="center">
            {error}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Dialog>
    );
  }

  // Show empty state
  if (!currentStory || stories.length === 0) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'black',
            borderRadius: isMobile ? 0 : 2,
            maxWidth: isMobile ? '100vw' : '400px',
            maxHeight: isMobile ? '100vh' : '80vh',
            width: isMobile ? '100vw' : '400px',
            height: isMobile ? '100vh' : '80vh',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="white">
            No Stories Available
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" textAlign="center">
            There are no stories to display at the moment.
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: 'black',
          borderRadius: isMobile ? 0 : 2,
          maxWidth: isMobile ? '100vw' : '400px',
          maxHeight: isMobile ? '100vh' : '80vh',
          width: isMobile ? '100vw' : '400px',
          height: isMobile ? '100vh' : '80vh',
          position: 'relative',
          overflow: 'hidden'
        }
      }}
    >
      {/* Progress Bars */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {stories.map((_, index) => (
            <Box key={index} sx={{ flex: 1, height: 2, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 1 }}>
              <LinearProgress
                variant="determinate"
                value={index === currentStoryIndex ? progress : index < currentStoryIndex ? 100 : 0}
                sx={{
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: 'transparent',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white',
                    borderRadius: 1
                  }
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Header */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10, 
        p: 2,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main',
                fontSize: '0.875rem'
              }}
            >
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                />
              ) : (
                'W'
              )}
            </Avatar>
            <Box>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                {moment(currentStory.createdAt).isValid() 
                  ? (moment(currentStory.createdAt).isAfter(moment().subtract(7, 'days')) 
                      ? moment(currentStory.createdAt).fromNow() 
                      : moment(currentStory.createdAt).format('MMM DD, YYYY'))
                  : 'Recently'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => setIsPlaying(!isPlaying)}
              sx={{ color: 'white' }}
              size="small"
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton
              onClick={handleClose}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Story Content */}
      <Box sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {currentStory.mediaType === 'image' ? (
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.caption}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              width: '100%',
              height: '100%'
            }}
          />
        ) : (
          <video
            src={currentStory.mediaUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              width: '100%',
              height: '100%'
            }}
          />
        )}

                 {/* Caption */}
         {currentStory.caption && (
           <Box sx={{
             position: 'absolute',
             bottom: 0,
             left: 0,
             right: 0,
             background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
             p: 3,
             pt: 6,
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center'
           }}>
             <Typography variant="body1" color="white" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', textAlign: 'center' }}>
               {currentStory.caption}
             </Typography>
           </Box>
         )}
      </Box>

      {/* Navigation Buttons */}
      <IconButton
        onClick={handlePrevious}
        disabled={currentStoryIndex === 0}
        sx={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          bgcolor: 'rgba(0,0,0,0.3)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
          '&.Mui-disabled': { opacity: 0.3 }
        }}
      >
        <NavigateBeforeIcon />
      </IconButton>

      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          bgcolor: 'rgba(0,0,0,0.3)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
        }}
      >
        <NavigateNextIcon />
      </IconButton>

      {/* Story Counter */}
      <Box sx={{
        position: 'absolute',
        top: 80,
        right: 16,
        zIndex: 10
      }}>
        <Chip
          label={`${currentStoryIndex + 1} / ${stories.length}`}
          size="small"
          sx={{
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '& .MuiChip-label': { color: 'white' }
          }}
        />
      </Box>
    </Dialog>
  );
};

export default Stories;
