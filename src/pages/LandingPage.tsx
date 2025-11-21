import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, List, ListItem, ListItemText, Typography, Grid, Divider, CircularProgress, Stack, Drawer, IconButton, useMediaQuery, useTheme, ListItemButton } from '@mui/material';
import toast from 'react-hot-toast';

/**
 * LandingPage Component
 * 
 * Features:
 * - Dynamic category loading from API (getProductCategory)
 * - Categories use Sales_Category ID and Category_Desc name
 * - Subcategories use Price_Class ID and Class_Desc name
 * - Navigation uses category/subcategory IDs in URL parameters
 * - Fallback to hardcoded categories if API fails
 * - Loading states for better UX
 * - TypeScript interfaces for type safety
 */

// TypeScript interfaces for better type safety

interface PriceClass {
  Price_Class: number;
  Class_Desc: string;
}

interface ProductCategory {
  Sales_Category: number;
  Category_Desc: string;
  priceClasses: PriceClass[];
  image: string;
}

interface Category {
  id: number;
  name: string;
  image: string;
  subcategories: { id: number; name: string }[];
}
import CustomButton from '../component/atoms/CustomButton';
import ProductCarousel from '../component/atoms/ProductCarousel';
import AdvertisementBanner from '../component/atoms/AdvertisementBanner';
import CommonModal from '../component/atoms/CommonModal';
import CategoryIcon from '../component/atoms/CategoryIcon';
import Footer from '../component/atoms/Footer';
import StickySocialMedia from '../component/atoms/StickySocialMedia';
import './LandingPage.css';
import logo from '../assets/Vector.svg';
import distributorLogo from '../assets/Woopsa White.svg';
import DefaultProductImage from '../assets/Default-Product-Image.jpg';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Import APIs
import {
  getBannerData,
  getSpecialOffersData,
  getPromotionalData,
  getNewArrivalsData,
  getPopularProductsData,
  getAdvertisementData,
  getProductCategory,
  getContactUsData,
  getWebPriceClass,
} from '../redux/apis/landingPageApis';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Responsive navigation state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const [productsAnchorEl, setProductsAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  // Age verification state - check sessionStorage for existing verification
  const [ageConfirmModal, setAgeConfirmModal] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(() => {
    const isAgeVerified = sessionStorage.getItem('woopsa_age_verified');
    return !!isAgeVerified; // Set confirmed if already verified in this session
  });
  const [isAgeVerifying, setIsAgeVerifying] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll state for brand logos section
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);

  // API data states
  const [bannerData, setBannerData] = useState<any[]>([]);
  const [specialOffersData, setSpecialOffersData] = useState<any[]>([]);
  const [promotionalData, setPromotionalData] = useState<any[]>([]);
  const [newArrivalsData, setNewArrivalsData] = useState<any[]>([]);
  const [popularProductsData, setPopularProductsData] = useState<any[]>([]);
  // const [advertisementData, setAdvertisementData] = useState<any[]>([]);
  const [headerAds, setHeaderAds] = useState<any[]>([]);
  const [middleAds, setMiddleAds] = useState<any[]>([]);
  const [bottomAds, setBottomAds] = useState<any[]>([]);
  const [productCategoriesData, setProductCategoriesData] = useState<ProductCategory[]>([]);
  const [webPriceClasses, setWebPriceClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);


  // Contact data state
  const [contactData, setContactData] = useState<any>(null);

  const openProductsMenu = Boolean(productsAnchorEl);

  // Modern promotional content with clean design - use API data only
  const promotionalContent = React.useMemo(() => {
    if (bannerData && bannerData?.length > 0) {
      return bannerData?.map((banner : any, index : number) => ({
        id: banner?.id || index + 1,
        title: banner?.bannerTitle || banner?.title || banner?.name || `Banner ${index + 1}`,
        subtitle: banner?.bannerDescription || banner?.subtitle || banner?.description || 'Exclusive Offers',
        image: banner?.image_url || banner?.image || [],
        cta: banner?.cta || banner?.buttonText || 'Shop Now',
        inventors: banner?.inventors || [] // Include inventors array from banner data
      }));
    }

    // Return empty array if no data
    return [];
  }, [bannerData]);

  // Check if promotional content is ready to render
  const isPromotionalContentReady = dataInitialized && promotionalContent && promotionalContent?.length > 0 && promotionalContent?.every(item => item && item?.image && item?.title);

  // Check if current slide data is valid
  const isCurrentSlideValid = isPromotionalContentReady && promotionalContent[currentSlide] && promotionalContent[currentSlide]?.image && promotionalContent[currentSlide]?.title;

  // Reset currentSlide when promotional content changes
  useEffect(() => {
    if (isPromotionalContentReady && promotionalContent?.length > 0) {
      setCurrentSlide(0);
    }
  }, [isPromotionalContentReady, promotionalContent?.length]);

  // Ensure currentSlide is within bounds when promotional content changes
  useEffect(() => {
    if (isPromotionalContentReady && promotionalContent?.length > 0 && currentSlide >= promotionalContent?.length) {
      setCurrentSlide(0);
    }
  }, [isPromotionalContentReady, promotionalContent?.length, currentSlide]);
  // Debug: Check if images are imported correctly

  // Auto-rotate promotional content
  useEffect(() => {
    if (!isCurrentSlideValid || !isPromotionalContentReady) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promotionalContent.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isCurrentSlideValid, isPromotionalContentReady, promotionalContent.length]);

  // Check age verification on component mount
  useEffect(() => {
    try {
      const isAgeVerified = sessionStorage.getItem('woopsa_age_verified');
      if (!isAgeVerified) {
        setAgeConfirmModal(true);
      }
    } catch (error) {
      console.log('Error checking age verification:', error);
      // If sessionStorage is not available, show the modal
      setAgeConfirmModal(true);
    }
  }, []);

  // Fetch all API data on component mount
  useEffect(() => {
    let isMounted = true;

    const normalize = <T,>(res: any): T[] => {
      // Accept either a raw array or { data: [...] } or { promotedItemsList: [...] } or { finalProductList: [...] }
      if (Array.isArray(res)) return res as T[];
      if (Array.isArray(res?.data)) return res.data as T[];
      if (Array.isArray(res?.promotedItemsList)) return res.promotedItemsList as T[];
      if (Array.isArray(res?.finalProductList)) return res.finalProductList as T[];
      return [];
    };

    const fetchAllData = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          getBannerData(),
          getSpecialOffersData(),
          getPromotionalData(),
          getNewArrivalsData(),
          getPopularProductsData(),
          getAdvertisementData(),
          getProductCategory(),
          getContactUsData(),
          getWebPriceClass(),
          // getProductByCategoryList(),
          // getProductList(),
        ]);

        if (!isMounted) return;

        // Extract values or empty arrays on failure
        const [
          bannerRes,
          specialOffersRes,
          promotionalRes,
          newArrivalsRes,
          popularProductsRes,
          advertisementRes,
          productCategoryRes,
          contactRes,
          webPriceClassesRes,
        ] = results?.map((r : any) => (r.status === 'fulfilled' ? r.value : []));


        setBannerData(bannerRes);
        setSpecialOffersData(normalize(specialOffersRes));
        setPromotionalData(normalize(promotionalRes));
        setNewArrivalsData(normalize(newArrivalsRes));
        setPopularProductsData(normalize(popularProductsRes));
        // setAdvertisementData(normalize(advertisementRes));

        // Set product categories data
        if (productCategoryRes && Array.isArray(productCategoryRes)) {
          setProductCategoriesData(productCategoryRes as ProductCategory[]);
        }

        // Set web price classes data
        if (webPriceClassesRes && Array.isArray(webPriceClassesRes)) {
          setWebPriceClasses(webPriceClassesRes);
        }

        // Separate advertisement data by sections
        const ads = normalize(advertisementRes) as any[];
        setHeaderAds(ads?.filter((ad : any) => ad?.section === 'header'));
        setMiddleAds(ads?.filter((ad : any) => ad?.section === 'middle'));
        setBottomAds(ads?.filter((ad : any) => ad?.section === 'bottom'));

        // Set contact data
        if (contactRes) {
          setContactData(contactRes);
        }

        // Mark data as initialized
        setDataInitialized(true);
      } catch (err) {
        console.error('Error fetching landing page data:', err);
        if (isMounted) setDataInitialized(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, []);


  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleProductsMenuClose();
      }
    };

    if (openProductsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openProductsMenu]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  // Auto-scroll effect for brand logos section
  useEffect(() => {
    if (!isAutoScrolling || !webPriceClasses || webPriceClasses?.length === 0) return;

    let animationId: number;
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    const scrollSpeed = 0.5; // pixels per frame for ultra-smooth movement

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
        setScrollOffset(prev => {
          // Calculate the total width needed for all brands
          const brandWidth = 140; // Each brand is 140px wide
          const gap = 12; // Gap between brands (matches marginRight in CSS)
          const totalWidth = webPriceClasses?.length * brandWidth + (webPriceClasses?.length - 1) * gap; // Total width with gaps
          
          // Always ensure we have enough content to scroll by duplicating if needed
          const minScrollWidth = Math.max(totalWidth * 2, window.innerWidth + 200); // At least double the content or screen width + buffer
          
          // If we've scrolled past the minimum scroll width, reset to start
          if (prev >= minScrollWidth) {
            // console.log('Resetting scroll to 0');
            return 0; // Loop back to start
          }
          return prev + scrollSpeed; // Move smoothly pixel by pixel
        });
        lastTime = currentTime;
      }
      
      if (isAutoScrolling) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAutoScrolling, webPriceClasses]);

  // Cleanup auto-scroll timers on unmount
  useEffect(() => {
    return () => {
      // No setInterval to clear here as we are using requestAnimationFrame
    };
  }, []);

  const handleLoginRedirect = () => {
    // Clear age verification session when user clicks login
    sessionStorage.removeItem('woopsa_age_verified');
    // Use window.location.href for hard navigation to ensure page reload
    window.location.href = '/login';
  };

  // const handleProductRedirect = () => {
  //   // Clear age verification session when user clicks product redirect
  //   // sessionStorage.removeItem('woopsa_age_verified');
  //   navigate('/products');
  // };

  const handleBannerClick = (banner: any) => {
    try {
      // Safety check for valid banner data
      if (!banner || !banner.title) {
        console.warn('Invalid banner data for click:', banner);
        toast.error('Invalid banner data. Please try again.');
        return;
      }

      if (banner?.inventors && Array.isArray(banner?.inventors) && banner?.inventors?.length > 0) {
        // Create search query with inventor item numbers
        const searchQuery = banner?.inventors?.join(', ');
        toast.success(`Searching for products: ${searchQuery}`, {
          duration: 3000,
          position: 'top-center'
        });
        // Use window.location.href for hard navigation to ensure page reload
        window.location.href = `/products?masterSearch=${encodeURIComponent(searchQuery)}`;
      } else {
        // If no inventors, just navigate to products page
        toast.success('Navigating to products page', {
          duration: 2000,
          position: 'top-center'
        });
        window.location.href = '/products';
      }
    } catch (error) {
      console.error('Error handling banner click:', error);
      toast.error('Unable to process banner click. Please try again.');
      // Fallback navigation
      window.location.href = '/products';
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setProductDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setProductDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const handleLoginToViewPrice = () => {
    // Clear age verification session when user clicks login to view price
    sessionStorage.removeItem('woopsa_age_verified');
    handleModalClose();
    // Use window.location.href for hard navigation to ensure page reload
    window.location.href = '/login';
  };

  const handleAgeConfirm = () => {
    setIsAgeVerifying(true);
    try {
      // Store age verification in sessionStorage first
      sessionStorage.setItem('woopsa_age_verified', 'true');
      // Then update state with a small delay for smooth transition
      setTimeout(() => {
        setIsAgeConfirmed(true);
        setAgeConfirmModal(false);
        setIsAgeVerifying(false);
      }, 300);
    } catch (error) {
      console.log('Error confirming age:', error);
      // Fallback if sessionStorage fails
      setTimeout(() => {
        setIsAgeConfirmed(true);
        setAgeConfirmModal(false);
        setIsAgeVerifying(false);
      }, 300);
    }
  };

  // Category and subcategory data - now dynamic from API only
  const categories: Category[] = React.useMemo(() => {
    if (productCategoriesData && productCategoriesData?.length > 0) {
      const processedCategories = productCategoriesData?.map((category : any) => ({
        id: category.Sales_Category,
        name: category.Category_Desc,
        image: category.image,
        subcategories: category.priceClasses?.map((priceClass: PriceClass) => ({
          id: priceClass.Price_Class,
          name: priceClass.Class_Desc
        }))
      }));
      return processedCategories;
    }

    // Return empty array if no API data
    return [];
  }, [productCategoriesData]);



  const handleCategoryClick = (categoryId: number) => {
    // Use window.location.href for hard navigation to ensure page reload
    window.location.href = `/products?category=${categoryId}`;
  };

  const handleSubcategoryClick = (categoryId: number, subcategoryId: number) => {
    // Use window.location.href for hard navigation to ensure page reload
    window.location.href = `/products?category=${categoryId}&subcategory=${subcategoryId}`;
    // Close dropdown immediately after subcategory click
    setProductsAnchorEl(null);
    setSelectedCategory('');
  };

  const handleProductsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setProductsAnchorEl(event.currentTarget);
  };

  const handleProductsMenuClose = () => {
    const timeout = setTimeout(() => {
      setProductsAnchorEl(null);
      setSelectedCategory('');
    }, 150); // Small delay to prevent flickering
    setCloseTimeout(timeout);
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };



  // Sample product data for carousels - use API data only
  const newItems = React.useMemo(() => {
    if (newArrivalsData && newArrivalsData?.length > 0) {
      return newArrivalsData?.map((item: any, index: number) => ({
        id: item.Item_Number || item.id || item.productId || (index + 1).toString(),
        name: item.Description || item.name || item.productName || `New Product ${index + 1}`,
        image: item.showDistributorImage && item.distributorImage ? item.distributorImage : item.masterImage || item.image || [],
        description: item.Description || item.description || item.productDescription || 'High-quality product with excellent features.',
        pack: item.Pack || item.pack || 1,
        uom: item.UOM || item.uom || 'EACH',
        caseCount: item.CaseCount || item.caseCount || 1,
        category: item.SalesCategory || item.category,
        subcategory: item.PriceClass || item.subcategory,
        itemNumber: item.Item_Number || item.id
      }));
    }

    // Return empty array if no data
    return [];
  }, [newArrivalsData]);

  const popularItems = React.useMemo(() => {
    if (popularProductsData && popularProductsData?.length > 0) {
      return popularProductsData?.map((item: any, index: number) => ({
        id: item?.Item_Number || item?.id || item?.productId || (index + 6).toString(),
        name: item?.Description || item?.name || item?.productName || `Popular Product ${index + 1}`,
        image: item?.showDistributorImage && item?.distributorImage ? item?.distributorImage : item?.masterImage || item?.image || [],
        description: item?.Description || item?.description || item?.productDescription || 'Popular product with great customer satisfaction.',
        pack: item?.Pack || item?.pack || 1,
        uom: item?.UOM || item?.uom || 'EACH',
        caseCount: item?.CaseCount || item?.caseCount || 1,
        category: item?.SalesCategory || item?.category,
        itemNumber: item?.Item_Number || item?.id
      }));
    }

    // Return empty array if no data
    return [];
  }, [popularProductsData]);

  const discountedItems = React.useMemo(() => {
    if (specialOffersData && specialOffersData?.length > 0) {
      return specialOffersData?.map((item: any, index: number) => ({
        id: item?.Item_Number || item?.id || item?.productId || (index + 11).toString(),
        name: item?.Description || item?.name || item?.productName || `Special Offer ${index + 1}`,
        image: item?.showDistributorImage && item?.distributorImage ? item?.distributorImage : item?.masterImage || item?.image || [],
        description: item?.Description || item?.description || item?.productDescription || 'Special offer product with great value.',
        pack: item?.Pack || item?.pack || 1,
        uom: item?.UOM || item?.uom || 'EACH',
        caseCount: item?.CaseCount || item?.caseCount || 1,
        category: item?.SalesCategory || item?.category,
        subcategory: item?.PriceClass || item?.subcategory,
        itemNumber: item?.Item_Number || item?.id
      }));
    }

    // Return empty array if no data
    return [];
  }, [specialOffersData]);

  const promotedItems = React.useMemo(() => {
    if (promotionalData && promotionalData?.length > 0) {
      return promotionalData?.map((item: any, index: number) => ({
        id: item?.Item_Number || item?.id || (index + 16).toString(),
        name: item?.Description || item?.name || item?.productName || `Featured Product ${index + 1}`,
        image: item?.showDistributorImage && item?.distributorImage ? item?.distributorImage : item?.masterImage || item?.image || [][index % 5],
        description: item?.Description || item?.description || item?.productDescription || 'Featured product with exceptional quality and value.',
        pack: item?.Pack || item?.pack || 1,
        uom: item?.UOM || item?.uom || 'EACH',
        caseCount: item?.CaseCount || item?.caseCount || 1,
        category: item?.SalesCategory || item?.category,
        subcategory: item?.PriceClass || item?.subcategory,
        itemNumber: item?.Item_Number || item?.id
      }));
    } 

    // Return empty array if no data
    return [];
  }, [promotionalData]);

  // Determine which section is first to apply navbar margin-top
  const getFirstSectionStyle = () => {
    if (isPromotionalContentReady) {
      return { marginTop: '80px' }; // Hero section is first
    } else if (newItems?.length > 0 || popularItems?.length > 0 || discountedItems?.length > 0 || promotedItems?.length > 0 || headerAds?.length > 0 || middleAds?.length > 0 || bottomAds?.length > 0) {
      return { marginTop: '110px' }; // Carousels section is first
    } else if (categories?.length > 0) {
      return { marginTop: '80px' }; // Categories section is first
    }
    return {}; // No sections to show
  };

  return (
    <div className="landing-page">
      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#3C7795', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#3C7795' }}>
              Loading amazing content...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img
              src={contactData?.logo || distributorLogo}
              alt={contactData?.D_Name || "Distributor"}
              style={{ height: '35px', cursor: isAgeConfirmed ? 'pointer' : 'not-allowed' }}
              onClick={isAgeConfirmed ? () => navigate("/") : undefined}
              onError={(e) => {
                e.currentTarget.src = distributorLogo;
              }}
            />
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="nav-menu">
              <a
                href="#home"
                className="nav-link"
                style={{ pointerEvents: isAgeConfirmed ? 'auto' : 'none', opacity: isAgeConfirmed ? 1 : 0.5 }}
              >
                Home
              </a>
              <a
                href="#products"
                className="nav-link"
                onMouseEnter={isAgeConfirmed ? handleProductsMenuOpen : undefined}
                onMouseLeave={isAgeConfirmed ? handleProductsMenuClose : undefined}
                ref={navbarRef}
                onClick={isAgeConfirmed ? (e) => {
                  e.preventDefault();
                  // Use window.location.href for hard navigation to ensure page reload
                  window.location.href = '/products';
                } : undefined}
                style={{ pointerEvents: isAgeConfirmed ? 'auto' : 'none', opacity: isAgeConfirmed ? 1 : 0.5 }}
              >
                All Products
              </a>
              {newItems?.length > 0 && (
                <a
                  href="#"
                  className="nav-link"
                  onClick={isAgeConfirmed ? (e) => {
                    e.preventDefault();
                    handleScrollToSection('new-items');
                  } : undefined}
                  style={{ pointerEvents: isAgeConfirmed ? 'auto' : 'none', opacity: isAgeConfirmed ? 1 : 0.5 }}
                >
                  New Items
                </a>
              )}
              {popularItems?.length > 0 && (
                <a
                  href="#"
                  className="nav-link"
                  onClick={isAgeConfirmed ? (e) => {
                    e.preventDefault();
                    handleScrollToSection('popular-items');
                  } : undefined}
                  style={{ pointerEvents: isAgeConfirmed ? 'auto' : 'none', opacity: isAgeConfirmed ? 1 : 0.5 }}
                >
                  Popular Items
                </a>
              )}
              {promotedItems?.length > 0 && (
                <a
                  href="#"
                  className="nav-link"
                  onClick={isAgeConfirmed ? (e) => {
                    e.preventDefault();
                    handleScrollToSection('promoted-items');
                  } : undefined}
                  style={{ pointerEvents: isAgeConfirmed ? 'auto' : 'none', opacity: isAgeConfirmed ? 1 : 0.5 }}
                >
                  Promoted Items
                </a>
              )}
              {discountedItems?.length > 0 && (
                <a
                  href="#"
                  className="nav-link"
                  onClick={isAgeConfirmed ? (e) => {
                    e.preventDefault();
                    handleScrollToSection('discount-items');
                  } : undefined}
                  style={{ pointerEvents: isAgeConfirmed ? 'auto' : 'none', opacity: isAgeConfirmed ? 1 : 0.5 }}
                >
                  Special Offers
                </a>
              )}
              <a
                href="#"
                className="nav-link"
                onClick={isAgeConfirmed ? (e) => {
                  e.preventDefault();
                  // Use window.location.href for hard navigation to ensure page reload
                  window.location.href = '/contact-us';
                } : undefined}
                style={{ pointerEvents: isAgeConfirmed ? 'auto' : 'none', opacity: isAgeConfirmed ? 1 : 0.5 }}
              >
                Become a Retailer
              </a>
              <CustomButton
                onClick={isAgeConfirmed ? handleLoginRedirect : undefined}
                buttonType="primary"
                appearance="filled"
                size="medium"
                fullWidth={false}
                sx={{ mt: 0 }}
                disabled={!isAgeConfirmed}
              >
                Login
              </CustomButton>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CustomButton
                onClick={isAgeConfirmed ? handleLoginRedirect : undefined}
                buttonType="primary"
                appearance="filled"
                size="small"
                fullWidth={false}
                sx={{ mt: 0 }}
                disabled={!isAgeConfirmed}
              >
                Login
              </CustomButton>
              <IconButton
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ color: 'primary.main' }}
              >
                <MenuIcon />
              </IconButton>
            </div>
          )}
        </div>

        {/* Products Dropdown Menu - Desktop Only */}
        {openProductsMenu && isAgeConfirmed && !isMobile && (
          <Box
            ref={dropdownRef}
            sx={{
              position: 'absolute',
              top: '100%',
              right: '300px',
              backgroundColor: 'white',
              minWidth: 600,
              maxWidth: 700,
              maxHeight: '400px',
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderTop: 'none',
              zIndex: 1001,
              mt: 0,
              overflow: 'hidden',
            }}
            onMouseEnter={() => {
              if (closeTimeout) {
                clearTimeout(closeTimeout);
                setCloseTimeout(null);
              }
            }}
            onMouseLeave={handleProductsMenuClose}
          >
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {/* Left Side - Categories */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#2c3e50', fontWeight: 600, borderBottom: '2px solid #3498db', pb: 0.5, fontSize: '0.9rem' }}>
                    Categories
                  </Typography>
                  <List sx={{ p: 0, maxHeight: '300px', overflow: 'auto' }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                        <CircularProgress size={20} sx={{ color: '#3C7795' }} />
                      </Box>
                    ) : categories?.length > 0 ? (
                      categories?.map((category) => (
                        <ListItem
                          key={category?.id}
                          onClick={() => setSelectedCategory(category?.name)}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            py: 0.5,
                            px: 1,
                            cursor: 'pointer',
                            backgroundColor: selectedCategory === category?.name ? 'rgba(60, 119, 149, 0.08)' : 'transparent',
                            '&:hover': {
                              backgroundColor: selectedCategory === category?.name ? 'rgba(60, 119, 149, 0.12)' : 'rgba(60, 119, 149, 0.05)'
                            }
                          }}
                        >
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <CategoryIcon size={16} color={selectedCategory === category?.name ? '#3C7795' : '#666'} />
                          </Box>
                          <ListItemText
                            primary={category?.name}
                            primaryTypographyProps={{
                              fontWeight: selectedCategory === category?.name ? 600 : 500,
                              color: selectedCategory === category?.name ? '#2c3e50' : '#555',
                              fontSize: '0.8rem'
                            }}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 1, color: '#999', fontSize: '0.8rem' }}>
                        No categories available
                      </Box>
                    )}
                  </List>
                </Grid>

                {/* Right Side - Subcategories */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#2c3e50', fontWeight: 600, borderBottom: '2px solid #3498db', pb: 0.5, fontSize: '0.9rem' }}>
                    {selectedCategory ? `${selectedCategory} Subcategories` : 'Select a Category'}
                  </Typography>

                  {selectedCategory ? (
                    <List sx={{ p: 0, maxHeight: '300px', overflow: 'auto' }}>
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                          <CircularProgress size={18} sx={{ color: '#3C7795' }} />
                        </Box>
                      ) : (() => {
                        const selectedCat = categories?.find((cat : any) => cat?.name === selectedCategory);
                        return selectedCat?.subcategories && selectedCat?.subcategories?.length > 0 ? (
                          selectedCat?.subcategories?.map((subcategory: { id: number; name: string }) => (
                            <ListItem
                              key={subcategory.id}
                              onClick={() => {
                                if (selectedCat) {
                                  handleSubcategoryClick(selectedCat?.id, subcategory?.id);
                                }
                              }}
                              sx={{
                                py: 0.5,
                                px: 1.5,
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(60, 119, 149, 0.08)' }
                              }}
                            >
                              <ListItemText
                                primary={subcategory?.name}
                                primaryTypographyProps={{
                                  fontSize: '0.75rem',
                                  color: '#2c3e50',
                                  fontWeight: 500
                                }}
                              />
                            </ListItem>
                          ))
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 1, color: '#999', fontSize: '0.8rem' }}>
                            No subcategories available for this category
                          </Box>
                        );
                      })()}
                    </List>
                  ) : (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '150px',
                      color: '#999',
                      fontSize: '0.8rem'
                    }}>
                      Choose a category from the left to see subcategories
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '280px',
              backgroundColor: '#f8f9fa',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <img
                src={contactData?.logo || distributorLogo}
                alt={contactData?.D_Name || "Distributor"}
                style={{ height: '30px' }}
                onError={(e) => {
                  e.currentTarget.src = distributorLogo;
                }}
              />
              <IconButton onClick={() => setMobileDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <List sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (isAgeConfirmed) {
                    handleScrollToSection('home');
                  }
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: isAgeConfirmed ? 'transparent' : 'rgba(0,0,0,0.1)',
                  opacity: isAgeConfirmed ? 1 : 0.5,
                }}
              >
                <ListItemText primary="Home" />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (isAgeConfirmed) {
                    window.location.href = '/products';
                  }
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: isAgeConfirmed ? 'transparent' : 'rgba(0,0,0,0.1)',
                  opacity: isAgeConfirmed ? 1 : 0.5,
                }}
              >
                <ListItemText primary="All Products" />
              </ListItemButton>

              {newItems?.length > 0 && (
                <ListItemButton
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    if (isAgeConfirmed) {
                      handleScrollToSection('new-items');
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isAgeConfirmed ? 'transparent' : 'rgba(0,0,0,0.1)',
                    opacity: isAgeConfirmed ? 1 : 0.5,
                  }}
                >
                  <ListItemText primary="New Items" />
                </ListItemButton>
              )}

              {popularItems?.length > 0 && (
                <ListItemButton
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    if (isAgeConfirmed) {
                      handleScrollToSection('popular-items');
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isAgeConfirmed ? 'transparent' : 'rgba(0,0,0,0.1)',
                    opacity: isAgeConfirmed ? 1 : 0.5,
                  }}
                >
                  <ListItemText primary="Popular Items" />
                </ListItemButton>
              )}

              {promotedItems?.length > 0 && (
                <ListItemButton
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    if (isAgeConfirmed) {
                      handleScrollToSection('promoted-items');
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isAgeConfirmed ? 'transparent' : 'rgba(0,0,0,0.1)',
                    opacity: isAgeConfirmed ? 1 : 0.5,
                  }}
                >
                  <ListItemText primary="Promoted Items" />
                </ListItemButton>
              )}

              {discountedItems?.length > 0 && (
                <ListItemButton
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    if (isAgeConfirmed) {
                      handleScrollToSection('discount-items');
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isAgeConfirmed ? 'transparent' : 'rgba(0,0,0,0.1)',
                    opacity: isAgeConfirmed ? 1 : 0.5,
                  }}
                >
                  <ListItemText primary="Special Offers" />
                </ListItemButton>
              )}

              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (isAgeConfirmed) {
                    window.location.href = '/contact-us';
                  }
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: isAgeConfirmed ? 'transparent' : 'rgba(0,0,0,0.1)',
                  opacity: isAgeConfirmed ? 1 : 0.5,
                }}
              >
                <ListItemText primary="Become a Retailer" />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
      </nav>

      {/* Content - Only show if age is confirmed */}
      {isAgeConfirmed ? (
        <div style={{
          opacity: isAgeConfirmed ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}>
          <>
            {/* Hero Section - Full Width & Height */}
            {isCurrentSlideValid ? (
              <section id="home" className="hero-section" style={getFirstSectionStyle()}>
                {/* Modern Promotional Showcase - Full Width & Height */}
                <div className="promo-showcase">
                  {/* Main Promotional Card - Full Size */}
                  <div className="main-promo-card">
                    <div className="promo-background">
                      <div className="promo-image" onClick={() => handleBannerClick(promotionalContent[currentSlide])} style={{ cursor: 'pointer' }}>
                        <img
                          src={promotionalContent[currentSlide]?.image}
                          alt={promotionalContent[currentSlide]?.title}
                        />
                        {/* Hover Overlay with Content and Buttons */}
                        <div className="promo-hover-overlay">
                          <div className="promo-header">
                            <h2 className="promo-title">{promotionalContent[currentSlide]?.title}</h2>
                            <p className="promo-subtitle">{promotionalContent[currentSlide]?.subtitle}</p>
                          </div>
                          <div className="promo-actions">
                            <CustomButton
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent double triggering
                                handleBannerClick(promotionalContent[currentSlide]);
                              }}
                              buttonType="primary"
                              appearance="filled"
                              size="large"
                              fullWidth={false}
                              sx={{
                                background: '#3C7795',
                                color: 'white',
                                padding: '8px 16px',
                                fontSize: '1.1rem',
                                mt: 0,
                              }}
                            >
                              {promotionalContent[currentSlide]?.cta}
                            </CustomButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide Indicators */}
                  <div className="slide-indicators">
                    {promotionalContent?.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ) : loading && !dataInitialized ? (
              // Show loading placeholder while data is being fetched
              <section id="home" className="hero-section" style={getFirstSectionStyle()}>
                <div className="promo-showcase">
                  <div className="main-promo-card">
                    <div className="promo-background">
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '500px',
                        backgroundColor: '#f5f5f5'
                      }}>
                        <CircularProgress size={60} sx={{ color: '#3C7795' }} />
                      </Box>
                    </div>
                  </div>
                </div>
              </section>
            ) : !isPromotionalContentReady && dataInitialized ? (
              // Show placeholder when data is initialized but no promotional content
              <section
                id="home"
                className="hero-section"
                style={{
                  ...getFirstSectionStyle(),
                  minHeight: 480,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  background: "none",
                  borderRadius: 0,
                  boxShadow: "none",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 1200,
                    mx: "auto",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: { xs: 4, md: 8 },
                    py: { xs: 4, md: 8 },
                    zIndex: 2,
                  }}
                >
                  {/* Left Side: Content */}
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: { xs: "center", md: "flex-start" },
                      justifyContent: "center",
                      textAlign: { xs: "center", md: "left" },
                      gap: 2,
                      zIndex: 2,
                    }}
                  >
                    <Typography variant="h4" sx={{ color: '#3C7795', fontWeight: 700 }}>
                      Welcome to Our Store
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', maxWidth: 400 }}>
                      Discover amazing products and exclusive offers. Shop the latest trends and enjoy a seamless shopping experience.
                    </Typography>
                    <CustomButton
                      buttonType="primary"
                      appearance="filled"
                      sx={{
                        mt: 4,
                        px: 5,
                        py: 1.5,
                        fontSize: "1.13rem",
                        borderRadius: 3,
                        boxShadow: "0 4px 24px 0 rgba(60,119,149,0.13)",
                        textTransform: "none",
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        background: "#3C7795",
                        color: "#fff",
                        transition: "background 0.2s, transform 0.2s",
                        "&:hover": {
                          background: "#28516a",
                          transform: "scale(1.05)"
                        },
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5
                      }}
                      fullWidth={false}
                      onClick={() => window.location.href = "/login"}
                    >
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                        <path d="M10 17l5-5-5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Login to Get Started
                    </CustomButton>
                  </Box>
                  {/* Right Side: Smile Trolley Animation */}
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 340,
                      width: "100%",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 220, sm: 340, md: 400 },
                        height: { xs: 180, sm: 260, md: 300 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        zIndex: 2,
                        overflow: "visible",
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          position: "relative",
                          overflow: "visible",
                        }}
                      >
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 360 240"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            animation: "cartMoveRight 2.8s cubic-bezier(.4,1.6,.6,1) infinite"
                          }}
                        >
                          {/* Common Shopping Cart Trolley - Large SVG */}
                          {/* Cart Basket */}
                          <rect x="80" y="80" width="160" height="80" rx="16"
                            fill="#fff"
                            stroke="#3C7795"
                            strokeWidth="6"
                          />
                          {/* Cart Grid */}
                          <line x1="120" y1="80" x2="120" y2="160" stroke="#3C7795" strokeWidth="3"/>
                          <line x1="160" y1="80" x2="160" y2="160" stroke="#3C7795" strokeWidth="3"/>
                          <line x1="200" y1="80" x2="200" y2="160" stroke="#3C7795" strokeWidth="3"/>
                          <line x1="80" y1="110" x2="240" y2="110" stroke="#3C7795" strokeWidth="2.5"/>
                          <line x1="80" y1="140" x2="240" y2="140" stroke="#3C7795" strokeWidth="2.5"/>
                          {/* Cart Handle */}
                          <rect x="240" y="60" width="16" height="60" rx="8"
                            fill="#fff"
                            stroke="#3C7795"
                            strokeWidth="4"
                          />
                          {/* Cart Front Bar */}
                          <rect x="64" y="160" width="192" height="12" rx="6"
                            fill="#3C7795"
                            stroke="#3C7795"
                            strokeWidth="2"
                          />
                          {/* Wheels */}
                          <circle cx="100" cy="190" r="20"
                            fill="#fff"
                            stroke="#3C7795"
                            strokeWidth="6"
                          />
                          <circle cx="220" cy="190" r="20"
                            fill="#fff"
                            stroke="#3C7795"
                            strokeWidth="6"
                          />
                          {/* Wheel Hubs */}
                          <circle cx="100" cy="190" r="6" fill="#3C7795"/>
                          <circle cx="220" cy="190" r="6" fill="#3C7795"/>
                          {/* Smile on Cart */}
                          <path
                            d="M130 130 Q180 170 230 130"
                            stroke="#3C7795"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                          >
                            <animate
                              attributeName="d"
                              values="
                                M130 130 Q180 170 230 130;
                                M130 136 Q180 200 230 136;
                                M130 130 Q180 170 230 130
                              "
                              keyTimes="0;0.5;1"
                              dur="2.8s"
                              repeatCount="indefinite"
                            />
                          </path>
                        </svg>
                        <style>
                          {`
                            @keyframes cartMoveRight {
                              0% {
                                left: 0;
                                transform: translateX(0) scale(1) rotate(-2deg);
                              }
                              10% {
                                left: 0;
                                transform: translateX(20px) scale(1.04) rotate(2deg);
                              }
                              20% {
                                left: 0;
                                transform: translateX(60px) scale(1.07) rotate(-2deg);
                              }
                              30% {
                                left: 0;
                                transform: translateX(120px) scale(1.04) rotate(2deg);
                              }
                              40% {
                                left: 0;
                                transform: translateX(180px) scale(1) rotate(-2deg);
                              }
                              60% {
                                left: 0;
                                transform: translateX(180px) scale(1) rotate(-2deg);
                              }
                              70% {
                                left: 0;
                                transform: translateX(120px) scale(1.03) rotate(1deg);
                              }
                              80% {
                                left: 0;
                                transform: translateX(60px) scale(1) rotate(-2deg);
                              }
                              100% {
                                left: 0;
                                transform: translateX(0) scale(1) rotate(-2deg);
                              }
                            }
                          `}
                        </style>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </section>
            ) : null}


            {/* New Items Carousel */}
            <section id="new-items" style={{ ...(!isPromotionalContentReady ? getFirstSectionStyle() : {marginTop: '60px' })}}>
              <Container maxWidth="xl">
                {newItems?.length > 0 && (
                  <div id="new-items">
                    <ProductCarousel
                      title="New Arrivals"
                      subtitle="Discover our latest products"
                      products={newItems}
                      speed={200}
                      onProductClick={handleProductClick}
                    />
                  </div>
                )}
                {headerAds?.length > 0 && (
                  <AdvertisementBanner
                    images={headerAds?.map((ad : any) => ad?.image_url)}
                    width="100%"
                    height={500}
                    my={8}
                  />
                )}

                {/* Popular Items Carousel */}
                {popularItems?.length > 0 && (
                  <div id="popular-items">
                    <ProductCarousel
                      title="Popular Items"
                      subtitle="Our best-selling products"
                      products={popularItems}
                      speed={200}
                      onProductClick={handleProductClick}
                    />
                  </div>
                )}
                {/* Discounted Items Carousel */}
                {discountedItems?.length > 0 && (
                  <div id="discount-items">
                    <ProductCarousel
                      title="Special Offers"
                      subtitle="Special offers and featured products"
                      products={discountedItems}
                      speed={200}
                      onProductClick={handleProductClick}
                    />
                  </div>
                )}
              </Container>
            </section>
            {/* Promoted Items Carousel - Only show if not already in other carousels */}
            {promotedItems?.length > 0 && (
              <section id="promoted-items" style={{ marginTop: '48px' }}>
                <Container maxWidth="xl">
                  <ProductCarousel
                    title="Featured Promotions"
                    subtitle="Discover our handpicked promotional products"
                    products={promotedItems}
                    speed={200}
                    onProductClick={handleProductClick}
                  />
                </Container>
              </section>
            )}

            {/* Product Carousels Section */}
            {(newItems?.length > 0 || popularItems?.length > 0 || discountedItems?.length > 0 || headerAds?.length > 0 || middleAds?.length > 0 || bottomAds?.length > 0) && (
              <section className="carousels-section" style={!isPromotionalContentReady ? getFirstSectionStyle() : {}}>
                <Container maxWidth="xl">
                  {/* Middle Advertisement Banner - Below Popular Items */}
                  <Grid
                    container
                    spacing={4}
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <Grid
                      size={{ xs: 12, md: 6.5 }}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {middleAds?.length > 0 && (
                        <AdvertisementBanner
                          images={middleAds?.map((ad : any) => ad?.image_url)}
                          width="100%"
                          height={400}
                          my={0}
                        />
                      )}
                    </Grid>
                    <Grid
                      size={{ xs: 12, md: 5.5 }}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        flexDirection: 'column',
                      }}
                    >
                      {middleAds?.length > 0 && middleAds[0]?.productList && middleAds[0]?.productList?.length > 0 && (
                        <section style={{ marginTop: '0px' }}>
                          <ProductCarousel
                            title="Trending Items"
                            subtitle="Discover unexpected finds and limited buys."
                            itemsPerView={3}
                            products={middleAds[0]?.productList?.map((item: any, index: number) => ({
                              id: item?.Item_Number || item?.id || (index + 1).toString(),
                              name: item?.Description || item?.name || item?.productName || `Product ${index + 1}`,
                              image: item?.showDistributorImage && item?.distributorImage ? item?.distributorImage : item?.masterImage || item?.image || DefaultProductImage,
                              description: item?.Description || item?.description || item?.productDescription || 'High-quality product with excellent features.',
                              pack: item?.Pack || item?.pack || 1,
                              uom: item?.UOM || item?.uom || 'EACH',
                              caseCount: item?.CaseCount || item?.caseCount || 1,
                              category: item?.SalesCategory || item?.category,
                              subcategory: item?.Price_Subclass || item?.subcategory,
                              itemNumber: item?.Item_Number || item?.id,
                              price1: item?.Price1,
                              price2: item?.Price2,
                              baseCost: item?.BaseCost,
                              invoiceCost: item?.Invoice_Cost,
                              avgCost: item?.AvgCost,
                              netCost: item?.NetCost,
                              upcList: item?.UPCList || []
                            }))}
                            speed={200}
                            onProductClick={handleProductClick}
                            my={0}
                          />
                          <Typography 
                          onClick={() => {
                            if (middleAds?.length > 0) {
                              // Create search query with inventor item numbers
                              const searchQuery = middleAds[0]?.productArray?.join(', ');
                             
                              if(searchQuery && searchQuery.length > 0){
                                // Use window.location.href for hard navigation to ensure page reload
                                window.location.href = `/products?masterSearch=${encodeURIComponent(searchQuery)}`;
                              }
                          }}}
                          variant="body2" sx={{ color: '#3C7795', mt: 2, fontWeight: 400, fontSize: '0.8rem', display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { color: '#2980b9' } }}>View more <ArrowForwardIcon sx={{ fontSize: '0.8rem', ml: 1 }} /></Typography>
                        </section>
                      )}
                    </Grid>
                  </Grid>

                  <Grid
                    container
                    spacing={4}
                    alignItems="flex-start"
                    justifyContent="space-between"
                    sx={{
                      my: 7,
                    }}
                  >
                    <Grid
                      size={{ xs: 12, md: 5.5 }}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        flexDirection: 'column',
                      }}
                    >
                      {bottomAds?.length > 0 && bottomAds[0]?.productList && bottomAds[0]?.productList?.length > 0 && (
                        <section style={{ marginTop: '0px' }}>
                          <ProductCarousel
                            title="Trending Items"
                            subtitle="Discover unexpected finds and limited buys."
                            itemsPerView={3}
                            products={bottomAds[0]?.productList?.map((item: any, index: number) => ({
                              id: item?.Item_Number || item?.id || (index + 1).toString(),
                              name: item?.Description || item?.name || item?.productName || `Product ${index + 1}`,
                              image: item?.showDistributorImage && item?.distributorImage ? item?.distributorImage : item?.masterImage || item?.image || DefaultProductImage,
                              description: item?.Description || item?.description || item?.productDescription || 'High-quality product with excellent features.',
                              pack: item?.Pack || item?.pack || 1,
                              uom: item?.UOM || item?.uom || 'EACH',
                              caseCount: item?.CaseCount || item?.caseCount || 1,
                              category: item?.SalesCategory || item?.category,
                              subcategory: item?.Price_Class || item?.subcategory,
                              itemNumber: item?.Item_Number || item?.id,
                              upcList: item?.UPCList || []
                            }))}
                            speed={200}
                            onProductClick={handleProductClick}
                            my={0}
                          />
                          <Typography 
                          onClick={() => {
                            if (bottomAds?.length > 0) {
                              const searchQuery = bottomAds[0]?.productArray?.join(', ');
                             
                              if(searchQuery && searchQuery.length > 0){
                                // Use window.location.href for hard navigation to ensure page reload
                                window.location.href = `/products?masterSearch=${encodeURIComponent(searchQuery)}`;
                              }
                            }
                          }}
                          variant="body2" sx={{ color: '#3C7795', mt: 2, fontWeight: 400, fontSize: '0.8rem', display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { color: '#2980b9' } }}>View more <ArrowForwardIcon sx={{ fontSize: '0.8rem', ml: 1 }} /></Typography>
                        </section>
                      )}
                    </Grid>
                    <Grid
                      size={{ xs: 12, md: 6.5 }}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Bottom Advertisement Banner - Below Special Offers */}
                      {bottomAds?.length > 0 && (
                        <AdvertisementBanner
                          images={bottomAds?.map((ad : any) => ad?.image_url)}
                          width="100%"
                          height={400}
                          my={0}
                        />
                      )}
                    </Grid>
                  </Grid>


                </Container>
              </section>
            )}

            {/* Product Categories - Middle */}
            {categories?.length > 0 && (
              <section id="products" className="categories-section" style={(!isPromotionalContentReady && promotedItems?.length === 0 && newItems?.length === 0 && popularItems?.length === 0 && discountedItems?.length === 0 && headerAds?.length === 0 && middleAds?.length === 0 && bottomAds?.length === 0) ? getFirstSectionStyle() : {}}>
                <div className="container">
                  <div className="section-header">
                    <h2>Our Product Categories</h2>
                    <p>Discover our comprehensive range of wholesale products</p>
                  </div>
                  <div className="categories-grid">
                    {categories?.map((category : any) => (
                      <div key={category?.id} className="category-card" onClick={() => handleCategoryClick(category?.id)}>
                          {category.image ? (
                            <div className="category-icon">
                            <img
                              src={category?.image}
                              alt={category?.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: "cover",
                              }}
                            />
                            </div>
                          ) : (
                            <div className="category-icon">
                              <CategoryIcon size={32} color="#3C7795" />
                            </div>
                          )}
                        <h3>{category?.name}</h3>
                        <p>{category?.subcategories?.length} subcategories available</p>
                        <CustomButton
                          onClick={() => handleCategoryClick(category?.id)}
                          buttonType="primary"
                          appearance="filled"
                          size="small"
                          fullWidth={false}
                          sx={{
                            fontSize: '0.6rem',
                            py: 0,
                            px: 1,
                            borderRadius: '4px',
                            minHeight: '16px'
                          }}
                        >
                          View Products
                        </CustomButton>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Brand Logos Carousel - Below Categories */}
            {webPriceClasses?.length > 0 && (
              <section className="brand-logos-section" style={{ 
                padding: '0 0 3rem 0',
                backgroundColor: 'white',
                margin: '0 0 2rem 0'
              }}>
                <Container maxWidth="xl">
                  
                  {/* Brand Logos Carousel - Using ProductCarousel Structure */}
                  <Box sx={{ my: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1
                    }}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontSize: { xs: '1rem', md: '1.2rem' },
                            fontWeight: 500,
                            color: 'primary.main',
                          }}
                        >
                          An Inventory Bigger Than Your Imagination
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'text.secondary',
                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                            fontWeight: 400
                          }}
                        >
                          From everyday essentials to rare finds — All in one place.
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        width: '100%',
                        height: '140px'
                      }}
                      onMouseEnter={() => {
                        // Pause auto-scroll on hover
                        if (isAutoScrolling) {
                          setIsAutoScrolling(false);
                        }
                      }}
                      onMouseLeave={() => {
                        // Resume auto-scroll after a short delay
                        setTimeout(() => {
                          setIsAutoScrolling(true);
                        }, 1000);
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 3,
                          py: 0.5,
                          transform: `translateX(-${scrollOffset}px)`,
                          transition: isAutoScrolling ? 'none' : 'transform 0.3s ease-in-out',
                          width: 'max-content',
                          position: 'relative',
                          willChange: 'transform',
                          backfaceVisibility: 'hidden'
                        }}
                      >
                        {/* Render brands multiple times to ensure continuous scrolling */}
                        {[...webPriceClasses, ...webPriceClasses, ...webPriceClasses]?.map((brand : any, index : number) => (
                          <div
                            key={`${brand?.id || index}-${index}`}
                            style={{
                              flexShrink: 0,
                              width: '140px',
                              height: '140px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px 0px',
                              cursor: 'pointer',
                              marginRight: index === (webPriceClasses?.length * 3) - 1 ? '0px' : '12px'
                            }}
                            onClick={() => {
                              // Use window.location.href for hard navigation to ensure page reload
                              window.location.href = `/products?subcategory=${brand?.priceClassId}`;
                            }}
                          >
                            {/* Only Brand Image - Direct Display */}
                            {brand.image ? (
                              <img
                                src={brand?.image}
                                alt={brand?.name || brand?.Class_Desc || `Brand ${index + 1}`}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallbackElement) {
                                    fallbackElement.style.display = 'flex';
                                  }
                                }}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain'
                                }}
                              />
                            ) : (
                              /* Fallback Text if no image */
                              <div 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  height: '100%',
                                  color: '#3C7795',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  textAlign: 'center'
                                }}
                              >
                                {brand?.name || brand?.Class_Desc || `Brand ${index + 1}`}
                              </div>
                            )}
                          </div>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Container>
              </section>
            )}
          </>
        </div>
      ) : (
        /* Age Verification Required Message */
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            px: 2
          }}
        >
          <Box>
            <img
              src={logo}
              alt="Woopsa"
              style={{
                height: '80px',
                marginBottom: '20px',
                opacity: 0.7
              }}
            />
            <Typography variant="h5" sx={{ color: '#666', mb: 2 }}>
              Age Verification Required
            </Typography>
            <Typography variant="body1" sx={{ color: '#999', maxWidth: '400px', mb: 3 }}>
              Please confirm your age to access our products and services.
              You must be 21 years or older to view this content.
            </Typography>
            <CustomButton
              onClick={() => setAgeConfirmModal(true)}
              buttonType="primary"
              appearance="filled"
              size="medium"
              fullWidth={false}
              sx={{ py: "8px", px: 4 }}
            >
              Verify Age Again
            </CustomButton>
          </Box>
        </Box>
      )}

      {/* Sticky Social Media */}
      <StickySocialMedia contactData={contactData} />

      {/* Footer */}
      <Footer contactData={contactData} />

      {/* Product Detail Modal */}
      <CommonModal
        open={productDetailModalOpen && isAgeConfirmed}
        onClose={handleModalClose}
        title={'Product Details'}
        size="md"
      >
        {selectedProduct && (
          <Box>
            <Grid container spacing={3}>
              {/* Product Image */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={selectedProduct?.image}
                    alt={selectedProduct?.name}
                    onError={(e) => {
                      e.currentTarget.src = DefaultProductImage;
                    }}
                    style={{
                      width: '100%',
                      maxWidth: '250px',
                      maxHeight: '250px',
                      height: 'auto',
                      borderRadius: '8px'
                    }}
                  />
                </Box>
              </Grid>

              {/* Product Details */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="h6" sx={{ fontWeight: 500, color: '#2c3e50', mb: 2, fontSize: '1rem' }}>
                  {selectedProduct?.name}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Product Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Item ID:</strong> {selectedProduct?.itemNumber}
                  </Typography>
                  {selectedProduct?.category && (
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>Category:</strong> {selectedProduct?.category}
                    </Typography>
                  )}
                  {/* {selectedProduct?.subcategory && (
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>Subcategory:</strong> {selectedProduct?.subcategory}
                    </Typography>
                  )} */}
                  {selectedProduct?.pack && (
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>Pack:</strong> {selectedProduct?.pack}
                    </Typography>
                  )}
                  {selectedProduct?.uom && (
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>Size:</strong> {selectedProduct?.uom}
                    </Typography>
                  )}
                  {selectedProduct?.caseCount && (
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>Case Count:</strong> {selectedProduct?.caseCount}
                    </Typography>
                  )}

                  {/* Additional Product Details */}


                  {/* UPC Information */}
                  {selectedProduct?.upcList && selectedProduct?.upcList?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1, fontWeight: 600 }}>
                        <strong>UPC Numbers:</strong>
                      </Typography>
                      {selectedProduct?.upcList?.map((upc: any, index: number) => (
                        <Typography key={index} variant="body2" sx={{ color: '#666', mb: 0.5, ml: 2 }}>
                          • {upc?.UPC_Number || upc?.upcNumber || upc}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Price Section */}
                <Box sx={{ textAlign: 'right', py: 2 }}>
                  {/* <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                    Price Information
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                    Login to place orders
                  </Typography> */}
                  <CustomButton
                    onClick={handleLoginToViewPrice}
                    buttonType="primary"
                    appearance="filled"
                    size="medium"
                    fullWidth={false}
                    sx={{
                      mt: 0
                    }}
                  >
                    Login to Cart
                  </CustomButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CommonModal>

      {/* Age Verification Modal */}
      <CommonModal
        open={ageConfirmModal}
        onClose={() => { }}
        size="sm"
        isCloseIcon={false}
      >
        <Stack
          spacing={3}
          alignItems="center"
          textAlign="center"
          sx={{
            width: "100%",
            maxWidth: "100%",
            px: 1,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Woopsa Logo"
            sx={{
              width: { xs: 120, sm: 150 },
              height: "auto",
            }}
          />
          <Typography fontSize={"14px"} color={"#7c7c7c"} sx={{ px: 1 }}>
            You must be 21 years old to access this application. Please verify
            your age.
          </Typography>
        </Stack>

        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="center"
          alignItems="center"
          width="100%"
          gap={2}
        >
          <CustomButton
            appearance="filled"
            onClick={handleAgeConfirm}
            disabled={isAgeVerifying}
            sx={{ py: "6px", px: 3, fontWeight: 300 }}
            fullWidth={false}
          >
            {isAgeVerifying ? 'Verifying...' : 'I am Over 21'}
          </CustomButton>

          <CustomButton
            appearance="outlined"
            onClick={() => {
              setAgeConfirmModal(false);
              setIsAgeConfirmed(false);
              // Clear session storage when user cancels
              sessionStorage.removeItem('woopsa_age_verified');
              toast.error("You must be over 21 to access this application.");
            }}
            sx={{ py: "6px", px: 3 }}
            fullWidth={false}
          >
            Cancel
          </CustomButton>
        </Box>
      </CommonModal>
    </div>
  );
};

export default LandingPage;
