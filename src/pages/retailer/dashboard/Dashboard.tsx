// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Grid, Box, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ProductList from "../../../component/atoms/dashboard/ProductList";
import Carousel3 from "../../../component/atoms/Carousel3";
// import image1 from "../../../assets/product1.png";
// import image2 from "../../../assets/product2.png";
// import image3 from "../../../assets/product3.png";
// import image4 from "../../../assets/product4.png";
import { getBannerListRetailer } from "../../../redux/apis/retailer/dashboardApis";
import { useAppDispatch } from "../../../redux/store";
import { fetchNewItems, fetchDiscountedItems, fetchPopularItems } from "../../../redux/slices/dashboardSlice";
import { fetchCartItems } from "../../../redux/slices/cartSlice";
import { fetchNotifications } from "../../../redux/slices/notificationSlice";
import { initializeFCMAndSendToken, isFCMSupported } from "../../../utils/fcmUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { addToCart } from "../../../redux/apis/retailer/orderApis";
import { calculateTotalPrepaidTax, roundAmount } from "../../../utils/prepaidTaxUtils";

// Simple toast function for now
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  console.log(`${type.toUpperCase()}: ${message}`);
};

import QuantityDiscountModal from "../../../component/molecules/QuantityDiscountModal";

// Sample data for the carousel
// const specialItems = [
//     {
//         image: image1,
//         alt: "Special Item 1",
//     },
//     {
//         image: image2,
//         alt: "Special Item 2",
//     },
//     {
//         image: image3,
//         alt: "Special Item 3",
//     },
// ];

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [promotedItems, setPromotedItems] = useState<any>([]);
  const auth = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  
  // Quantity discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedDiscountProduct, setSelectedDiscountProduct] = useState<any>(null);
  const [selectedDiscountData, setSelectedDiscountData] = useState<any>(null);

  useEffect(() => {
    const fetchBannerList = async () => {
      setLoading(true);
        const data: any = await getBannerListRetailer();
      // Transform banner data to match CarouselItem interface
      const transformedBanners = (data?.data?.bannerList || []).map((banner: any) => ({
        image: banner.image_url,
        alt: banner.bannerTitle || 'Banner',
        id: banner.id,
        inventors: banner.inventors,
        inventoryItems: banner.inventoryItems
      }));
      
      setPromotedItems(transformedBanners);
      setLoading(false);  
    };
    fetchBannerList();
  }, []);

  // Separate useEffect for dashboard data to prevent double calls
  useEffect(() => {
    // Only fetch dashboard data if auth is properly loaded
    if (auth?.role && auth?.storeDetail?.C_Number) {
      console.log('Retailer Dashboard: Fetching data with params:', {
        role: auth.role,
        c_number: auth.storeDetail.C_Number.toString()
      });
      
      dispatch(fetchNewItems({ role: auth.role, c_number: auth.storeDetail.C_Number.toString() }));
      dispatch(fetchDiscountedItems({ role: auth.role, c_number: auth.storeDetail.C_Number.toString() }));
      dispatch(fetchPopularItems({ role: auth.role, c_number: auth.storeDetail.C_Number.toString() }));
    } else {
      console.log('Retailer Dashboard: Skipping API calls - auth not ready:', {
        role: auth?.role,
        c_number: auth?.storeDetail?.C_Number
      });
    }
  }, [dispatch, auth?.role, auth?.storeDetail?.C_Number]);
  useEffect(() => {
    const initFCM = async () => {
      try {
        // Check if FCM is supported
        if (!isFCMSupported()) {
          console.warn('FCM is not supported in this browser');
          return;
        }

        // Register service worker first
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('SW registered: ', registration);
          
          // Wait a bit for service worker to be ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Initialize FCM and send token to backend (only for retailer users)
          if (auth?.role === 'retailer') {
            const token = await initializeFCMAndSendToken();
            if (token) {
              console.log('FCM Token obtained and sent to backend:', token);
            } else {
              console.warn('Failed to get FCM token');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    // Only initialize FCM if user is authenticated
    if (auth?.isAuthenticated) {
      initFCM();
      
      // Fetch initial notifications for retailer users
      if (auth?.role === 'retailer') {
        dispatch(fetchNotifications());
      }
    }
  }, [auth?.isAuthenticated, auth?.role, dispatch]);
  
  // Handle banner click - navigate to order page with search parameters
  const handleBannerClick = (banner: any) => {
    if (banner.inventors && banner.inventors.length > 0) {
      // Create search query with inventor item numbers
      const searchQuery = banner.inventors.join(', ');
      navigate(`/retailer/order?masterSearch=${encodeURIComponent(searchQuery)}`);
    } else {
      // If no inventors, just navigate to order page
      navigate('/retailer/order');
    }
  };

  // Handle quantity discount modal open
  const handleDiscountModalOpen = (product: any, discountData: any, _quantity: number = 1) => {
    setSelectedDiscountProduct(product);
    setSelectedDiscountData(discountData);
    setDiscountModalOpen(true);
  };

  // Helper function to calculate cart payload with prepaidTaxRate
  // New calculation: Price_With_Tax = Price_With_Tax * (1 + prepaidTaxRate)
  // Where base Price_With_Tax = price + Tax_Rate
  const calculateCartPayload = (product: any, quantity: number, finalPriceWithTax?: number) => {
    const basePrice = product.price;
    const prepaidTaxRate = product.prepaidTaxRate || 0;
    const taxRate = product.Tax_Rate || 0;
    
    let priceWithTax: number;
    let price: number;
    let totalPrepaidTax: number;
    
    if (finalPriceWithTax !== undefined) {
      // For discounted items, use the provided finalPriceWithTax, rounded with our prepaid rule
      priceWithTax = roundAmount(finalPriceWithTax);
      
      // Calculate base Price_With_Tax (before prepaid tax): finalPriceWithTax / (1 + prepaidTaxRate)
      const basePriceWithTax = prepaidTaxRate > 0 ? priceWithTax / (1 + prepaidTaxRate) : priceWithTax;
      
      // Calculate price from basePriceWithTax: basePriceWithTax - Tax_Rate
      price = basePriceWithTax - taxRate;
      
      // Prepaid tax: round per-unit first, then multiply by qty
      totalPrepaidTax = calculateTotalPrepaidTax(basePriceWithTax, prepaidTaxRate, quantity);
    } else {
      // Standard calculation: Price_With_Tax = (price + Tax_Rate) * (1 + prepaidTaxRate)
      const basePriceWithTax = basePrice + taxRate;
      
      // Calculate final Price_With_Tax: basePriceWithTax * (1 + prepaidTaxRate)
      priceWithTax = roundAmount(basePriceWithTax * (1 + prepaidTaxRate));
      price = basePrice;
      
      // Prepaid tax: round per-unit first, then multiply by qty
      totalPrepaidTax = calculateTotalPrepaidTax(basePriceWithTax, prepaidTaxRate, quantity);
    }
    
    // Always round unit Price_With_Tax first, then multiply
    const unitPriceWithTax = roundAmount(priceWithTax);
    const totalPriceWithTax = unitPriceWithTax * quantity;
    
    return {
      Price: Number(price.toFixed(2)),
      Price_With_Tax: unitPriceWithTax,
      Qty: quantity,
      Tax_Rate: Number(taxRate.toFixed(2)),
      TotalPrice: Number((price * quantity).toFixed(2)),
      TotalPriceWithTax: Number(totalPriceWithTax.toFixed(2)),
      originalPrice: Number(basePrice.toFixed(2)),
      prepaidTaxRate: Number(prepaidTaxRate.toFixed(4)), // Pass actual prepaidTaxRate from API
      TotalprepaidTaxRate: Number(totalPrepaidTax.toFixed(2))
    };
  };

  // Handle discount confirmation
  const handleDiscountConfirm = async (discountInfo: any) => {
    if (selectedDiscountProduct && discountInfo) {
      try {
        const product = selectedDiscountProduct;
        const quantity = discountInfo.quantity || discountInfo.minQty || 1;
        
        // Calculate discounted price
        // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
        const basePrice = product.price;
        const prepaidTaxRate = product.prepaidTaxRate || 0;
        const taxRate = product.Tax_Rate || 0;
        
        let discountedBasePrice = basePrice;
        if (discountInfo.type === 'case') {
          // Case discount: apply percentage discount to base price
          const discountAmount = (basePrice * discountInfo.discountPercentage) / 100;
          discountedBasePrice = basePrice - discountAmount;
        } else if (discountInfo.type === 'quantity') {
          // Quantity discount: apply based on discount tier to base price
          if (discountInfo.discount.hasPercentageDiscount) {
            const discountAmount = (basePrice * discountInfo.discount.perDiscount) / 100;
            discountedBasePrice = basePrice - discountAmount;
          } else {
            // Apply amount discount to base price
            discountedBasePrice = basePrice - discountInfo.discount.amountDiscount;
          }
        }
        
        // Ensure discounted base price doesn't go below 0
        discountedBasePrice = Math.max(0, discountedBasePrice);
        
        // Calculate Price_With_Tax from discounted base price: (discountedBasePrice + Tax_Rate) * (1 + prepaidTaxRate)
        const basePriceWithTax = Number(Number(discountedBasePrice + taxRate).toFixed(2));
        const discountedPrice = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
        
        // Add to cart with discounted price
        const payload = calculateCartPayload(product, quantity, discountedPrice);
        await addToCart({
          Item_Number: parseInt(product.id),
          ...payload
        });
        
        showToast(`Discount applied! Added ${quantity} ${product.name} to cart with discounted price.`, 'success');
        
        // Close modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
        
        // Refresh cart items
        dispatch(fetchCartItems());
      } catch (error) {
        console.error('Error applying discount:', error);
        showToast('Failed to apply discount. Please try again.', 'error');
      }
    }
  };

  // Handle no discount selection
  const handleNoDiscount = async () => {
    if (selectedDiscountProduct) {
      try {
        const product = selectedDiscountProduct;
        const quantity = 1; // Default quantity when no discount is selected
        
        const payload = calculateCartPayload(product, quantity);
        await addToCart({
          Item_Number: parseInt(product.id),
          ...payload
        });
        
        showToast(`Added ${quantity} ${product.name} to cart without discount.`, 'success');
        
        // Close modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
        
        // Refresh cart items
        dispatch(fetchCartItems());
      } catch (error) {
        console.error('Error adding item without discount:', error);
        showToast('Failed to add item to cart. Please try again.', 'error');
      }
    }
  };

  return (
    <Box p={{ sm: "0px", md: "5px 15px" }}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Box sx={{
          display: "flex",
          flexDirection: "column",
        }}>
          <Typography fontSize={"20px"} fontWeight={500}>
            Welcome to Dashboard
          </Typography>
              <Typography fontSize={"13px"} fontWeight={400} mb={2} color={theme.palette.text.secondary}>
                Supplying Trust. Delivering Value.
              </Typography>
        </Box>
        {/* <Box
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: "6px",
            border: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
          }}
        >
          <Box
            component="img"
            src={filter}
            alt="filter"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box> */}
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Carousel3 
            title="Special Items" 
            items={promotedItems}
            autoSwipe={true}
            swipeInterval={3000}
            pauseOnHover={true}
            onItemClick={handleBannerClick}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Carousel3
            title="Promoted Items"
            items={promotedItems}
            autoSwipe={true}
            swipeInterval={3000}
            pauseOnHover={true}
            onItemClick={handleBannerClick}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ProductList 
            title="New Items" 
            type="new" 
            onDiscountModalOpen={handleDiscountModalOpen}
          />
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <CustomButton
              size="small"
              onClick={() => navigate('/retailer/order?viewAll=new')}
              sx={{ fontSize: '12px', py: 0.5 }}
            >
              View All New Items
            </CustomButton>
          </Box> */}
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ProductList 
            title="Discounted Items" 
            type="discounted" 
            onDiscountModalOpen={handleDiscountModalOpen}
          />
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <CustomButton
              size="small"
              onClick={() => navigate('/retailer/order?viewAll=discounted')}
              sx={{ fontSize: '12px', py: 0.5 }}
            >
              View All Discounted Items
            </CustomButton>
          </Box> */}
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ProductList 
            title="Popular Items" 
            type="popular" 
            onDiscountModalOpen={handleDiscountModalOpen}
          />
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <CustomButton
              size="small"
              onClick={() => navigate('/retailer/order?viewAll=popular')}
              sx={{ fontSize: '12px', py: 0.5 }}
            >
              View All Popular Items
            </CustomButton>
          </Box> */}
        </Grid>
      </Grid>

      {/* Quantity Discount Modal */}
      <QuantityDiscountModal
        open={discountModalOpen}
        onClose={() => {
          setDiscountModalOpen(false);
          setSelectedDiscountProduct(null);
          setSelectedDiscountData(null);
        }}
        onConfirm={handleDiscountConfirm}
        onNoDiscount={handleNoDiscount}
        product={selectedDiscountProduct}
        qtyDiscountData={selectedDiscountData}
      />
    </Box>
  );
};

export default Dashboard;
