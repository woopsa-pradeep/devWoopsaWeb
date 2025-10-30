    import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
    import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
    import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
    import { useSelector } from 'react-redux';
    import { RootState } from '../../redux/store';
    import LoadingSpinner from './loader/LoadingSpinner';
    interface CarouselItem {
    image: string;
    alt: string;
    // Add optional properties for banner data
    id?: number;
    inventors?: string[];
    inventoryItems?: Array<{ Item_Number: number; Description: string }>;
    }

    interface Carousel3Props {
    title: string;
    items: CarouselItem[];
    autoSwipe?: boolean;
    swipeInterval?: number;
    hideNav?: boolean;
    pauseOnHover?: boolean;
    onItemClick?: (item: CarouselItem) => void; // Add click handler prop
    loading?: boolean;
        }

    const Carousel3: React.FC<Carousel3Props> = ({
    title,
    items,
    autoSwipe = true,
    swipeInterval = 3000,
    hideNav = false,
    pauseOnHover = true,
    onItemClick, // Add to destructuring
    loading = false,
    }) => {
    const mode = useSelector((state: RootState) => state.theme.mode);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    // const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoSwipe && !isPaused && items.length > 0) {
        interval = setInterval(() => {
            handleNext();
        }, swipeInterval);
        }
        return () => clearInterval(interval);
    }, [isPaused, autoSwipe, swipeInterval, items.length]);

    const handleNext = () => {
        if (items.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        }
    };

    const handlePrev = () => {
        if (items.length > 0) {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        }
    };

    return (
        <Box
        sx={{
            bgcolor: mode === 'dark' ? 'background.paper' : '#ffffff',
            borderRadius: '12px',
            border: 1,
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'divider',
            p: "10px 16px",
            height: '100%',
            overflow: 'hidden',
        }}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
        <Box
            sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            
            }}
        >
            <Typography fontSize={"16px"} fontWeight={500}>
            {title}
            </Typography>
            {!hideNav && (
            <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                onClick={handlePrev}
                size="small"
                >
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} color="primary"/>
                </IconButton>
                <IconButton
                onClick={handleNext}
                size="small"
                >
                <ArrowForwardIosIcon sx={{ fontSize: 14 }} color="primary"/>
                </IconButton>
            </Box>
            )}
        </Box>

        <Box
            sx={{
            position: 'relative',
            width: '100%',
            height: 200,
            overflow: 'hidden',
            borderRadius: '8px',
            }}
        >
                    {loading ? <LoadingSpinner fullScreen={true} /> : <Box
                sx={{
                    display: 'flex',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.5s ease-in-out',
                    transform: `translateX(-${currentIndex * 50}%)`,
                }}
                >
                {items.length > 0 ? items.map((item, index) => (
                    <Box
                    key={index}
                    sx={{
                        flex: '0 0 50%',
                        width: '50%',
                        height: '100%',
                        position: 'relative',
                        padding: '0 4px',
                    }}
                    >
                    <Tooltip 
                    title={onItemClick ? "Click to view products" : ""} 
                    placement="top"
                    disableHoverListener={!onItemClick}
                    >
                    <Box
                        component="img"
                        src={item.image}
                        alt={item.alt}
                        onClick={() => onItemClick && onItemClick(item)}
                        sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        // backgroundColor: 'primary.main',
                        cursor: onItemClick ? 'pointer' : 'default',
                        transition: onItemClick ? 'transform 0.2s ease-in-out' : 'none',
                        '&:hover': onItemClick ? {
                            transform: 'scale(1.02)',
                        } : {},
                        }}
                    />
                    </Tooltip>
                    </Box>
                )) : <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography fontSize={"16px"} fontWeight={500}>No items found</Typography>
                </Box>}
                </Box>}
            </Box>

        {/* Dots indicator */}
        <Box
            sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 2,
            }}
        >
            {items.map((_, index) => (
            <Box
                key={index}
                sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? 'primary.main' : 'divider',
                transition: 'background-color 0.3s ease',
                cursor: 'pointer',
                }}
                onClick={() => {
                setCurrentIndex(index);
                }}
            />
            ))}
        </Box>
        </Box>
    );
    };

    export default Carousel3;