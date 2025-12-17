// src/pages/sales/dashboard/SalesDashboard.tsx
import React, { useEffect, useState } from "react";
import { Grid, Box, Typography, useTheme, Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Carousel3 from "../../../component/atoms/Carousel3";
import SalesProductList from "../../../component/atoms/dashboard/SalesProductList";
import { getBannerList } from "../../../redux/apis/sales/profileApis";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { fetchSalesNewItems, fetchSalesDiscountedItems, fetchSalesPromotedItems } from "../../../redux/slices/salesDashboardSlice";
import { fetchSalesCartItems } from "../../../redux/slices/salesCartSlice";
import { addToCart } from "../../../redux/apis/sales/salesOrderApis";
import QuantityDiscountModal from "../../../component/molecules/QuantityDiscountModal";
// import CustomButton from "../../../component/atoms/CustomButton";
import { getTopProducts } from "../../../redux/apis/dashboardApis";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import CommonTable, { TableColumn } from "../../../component/atoms/Table/CommonTable";
import { roundPrepaidTax } from "../../../utils/prepaidTaxUtils";

const SalesDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedCustomer } = useAppSelector((state: any) => state.auth);
  const [promotedItems, setPromotedItems] = useState<any>([]);
  const auth = useAppSelector((state: any) => state.auth);
  const [topProducts, setTopProducts] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  
  // Quantity discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedDiscountProduct, setSelectedDiscountProduct] = useState<any>(null);
  const [selectedDiscountData, setSelectedDiscountData] = useState<any>(null);
  const [highDemandViewMode, setHighDemandViewMode] = useState<"table" | "graph">("graph");

  const highDemandColumns: TableColumn[] = [
    {
      id: "item",
      label: "Item Name",
      render: (row) => (
        <Box>
          <Typography fontSize={14} fontWeight={400} color="text.primary">
            {row.inventory.Description}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {row.Item_Number}
          </Typography>
        </Box>
      ),
    },
    {
      id: "popularity",
      label: "Popularity (QTY & Orders)",
      render: (row) => (
        <Box>
          <Typography fontSize={14} color="text.primary">
            Qty: {row.totalQuantityOrdered.toLocaleString()}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Orders: {row.orderCount}
          </Typography>
        </Box>
      ),
    },
    {
      id: "pack",
      label: "Pack Info",
      render: (row) => (
        <Box>
          <Typography fontSize={14} color="text.primary">
            Pack: {row.inventory.Pack}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Case: {row.inventory.CaseCount} {row.inventory.UOM}
          </Typography>
        </Box>
      ),
    },
  ];


  useEffect(() => {
    const fetchBannerList = async () => {
      setLoading(true);
      if (selectedCustomer?.C_Number) {
        try {
          const data: any = await getBannerList(selectedCustomer.C_Number.toString());
          
          // Transform banner data to match CarouselItem interface
          const transformedBanners = (data?.data?.data?.bannerList || []).map((banner: any) => ({
            image: banner.image_url,
            alt: banner.bannerTitle || 'Banner',
            id: banner.id,
            inventors: banner.inventors,
            inventoryItems: banner.inventoryItems
          }));
          
          setPromotedItems(transformedBanners);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching banner list:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchBannerList();
  
  }, [selectedCustomer]);

  // Separate useEffect for dashboard data to prevent double calls
  useEffect(() => {
    // Only fetch dashboard data if auth is properly loaded
    if (auth?.role && auth?.storeDetail?.C_Number) {
      console.log('Sales Dashboard: Fetching data with params:', {
        role: auth.role,
        c_number: auth.storeDetail.C_Number.toString()
      });
      
      dispatch(fetchSalesNewItems({role: auth.role, c_number: auth.storeDetail.C_Number.toString()}));
      dispatch(fetchSalesDiscountedItems({role: auth.role, c_number: auth.storeDetail.C_Number.toString()}));
      dispatch(fetchSalesPromotedItems({role: auth.role, c_number: auth.storeDetail.C_Number.toString()}));
      dispatch(fetchSalesCartItems());
    } else {
      console.log('Sales Dashboard: Skipping API calls - auth not ready:', {
        role: auth?.role,
        c_number: auth?.storeDetail?.C_Number
      });
    }
  }, [dispatch, auth?.role, auth?.storeDetail?.C_Number]);

  // Handle banner click - navigate to order page with search parameters
  const handleBannerClick = (banner: any) => {
    if (banner.inventors && banner.inventors.length > 0) {
      // Create search query with inventor item numbers
      const searchQuery = banner.inventors.join(', ');
      navigate(`/sales/order?masterSearch=${encodeURIComponent(searchQuery)}`);
    } else {
      // If no inventors, just navigate to order page
      navigate('/sales/order');
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
    let prepaidTaxPerUnit: number;
    let totalPrepaidTax: number;
    
    if (finalPriceWithTax !== undefined) {
      // For discounted items, use the provided finalPriceWithTax
      priceWithTax = finalPriceWithTax;
      
      // Calculate base Price_With_Tax (before prepaid tax): finalPriceWithTax / (1 + prepaidTaxRate)
      const basePriceWithTax = prepaidTaxRate > 0 ? finalPriceWithTax / (1 + prepaidTaxRate) : finalPriceWithTax;
      
      // Calculate price from basePriceWithTax: basePriceWithTax - Tax_Rate
      price = basePriceWithTax - taxRate;
      
      // Calculate prepaid tax per unit: basePriceWithTax * prepaidTaxRate
      prepaidTaxPerUnit = basePriceWithTax * prepaidTaxRate;
      // Calculate total prepaid tax: (basePriceWithTax * prepaidTaxRate) * qty
      totalPrepaidTax = prepaidTaxPerUnit * quantity;
    } else {
      // Standard calculation: Price_With_Tax = (price + Tax_Rate) * (1 + prepaidTaxRate)
      const basePriceWithTax = basePrice + taxRate;
      
      // Calculate final Price_With_Tax: basePriceWithTax * (1 + prepaidTaxRate)
      priceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
      price = basePrice;
      
      // Calculate prepaid tax per unit: basePriceWithTax * prepaidTaxRate
      prepaidTaxPerUnit = basePriceWithTax * prepaidTaxRate;
      // Calculate total prepaid tax: (basePriceWithTax * prepaidTaxRate) * qty
      totalPrepaidTax = prepaidTaxPerUnit * quantity;
    }
    
    // Calculate total price with tax: Price_With_Tax * qty
    const totalPriceWithTax = priceWithTax * quantity;
    
    return {
      Price: Number(price.toFixed(2)),
      Price_With_Tax: Number(priceWithTax.toFixed(2)),
      Qty: quantity,
      Tax_Rate: Number(taxRate.toFixed(2)),
      TotalPrice: Number((price * quantity).toFixed(2)),
      TotalPriceWithTax: Number(totalPriceWithTax.toFixed(2)),
      originalPrice: Number(basePrice.toFixed(2)),
      prepaidTaxRate: Number(prepaidTaxRate.toFixed(4)), // Pass actual prepaidTaxRate from API
      TotalprepaidTaxRate: roundPrepaidTax(totalPrepaidTax)
    };
  };

  // Handle discount confirmation
  const handleDiscountConfirm = async (discountInfo: any) => {
    if (selectedDiscountProduct && discountInfo && selectedCustomer?.C_Number) {
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
        const basePriceWithTax = discountedBasePrice + taxRate;
        const discountedPrice = basePriceWithTax * (1 + prepaidTaxRate);
        
        // Add to cart with discounted price
        const payload = calculateCartPayload(product, quantity, discountedPrice);
        await addToCart(selectedCustomer.C_Number.toString(), {
          Item_Number: parseInt(product.id),
          ...payload
        });
        
        // Show success message (you can implement toast notification here)
        
        // Close modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
        
        // Refresh cart items
        dispatch(fetchSalesCartItems());
      } catch (error) {
        console.error('Error applying discount:', error);
        console.error('Failed to apply discount. Please try again.');
      }
    }
  };

  // Handle no discount selection
  const handleNoDiscount = async () => {
    if (selectedDiscountProduct && selectedCustomer?.C_Number) {
      try {
        const product = selectedDiscountProduct;
        const quantity = 1; // Default quantity when no discount is selected
        
        const payload = calculateCartPayload(product, quantity);
        await addToCart(selectedCustomer.C_Number.toString(), {
          Item_Number: parseInt(product.id),
          ...payload
        });
        
        // console.log(`Added ${quantity} ${product.name} to cart without discount.`);
        
        // Close modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
        
        // Refresh cart items
        dispatch(fetchSalesCartItems());
      } catch (error) {
        console.error('Error adding item without discount:', error);
        console.error('Failed to add item to cart. Please try again.');
      }
    }
  };
  useEffect(() => {
    const fetchTopProducts = async () => {
      const data: any = await getTopProducts();
      // console.log('Raw top products data:', data);
      // console.log('Processed top products:', data?.data || []);
      setTopProducts(data?.data || []);
    };
    fetchTopProducts();
  }, []);

  // Prepare data for bar chart - matching AdminDashboard structure
  const topProductsBarData = topProducts.map((product: any) => ({
    itemNumber: product.Item_Number || product.itemNumber || product.id,
    name: product.inventory?.Description || product.Description || product.name || product.title,
    quantity: product.totalQuantityOrdered || product.quantity || 0,
    orders: product.orderCount || product.orders || 0,
    pack: product.inventory?.Pack || product.Pack || product.pack || 0,
    caseCount: product.inventory?.CaseCount || product.CaseCount || product.caseCount || 0,
    uom: product.inventory?.UOM || product.UOM || product.uom || '',
  })) || [];
  
  // console.log('Top products for chart:', topProductsBarData);

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
          <Typography fontSize={"22px"} fontWeight={500}>
            Welcome Sales Team
          </Typography>
          <Typography fontSize={"14px"} fontWeight={400} mb={2} color={theme.palette.text.secondary}>
            Manage Orders. Serve Customers.
          </Typography>
        </Box>
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
          <SalesProductList 
            title="New Items" 
            type="new" 
            onDiscountModalOpen={handleDiscountModalOpen}
          />
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <CustomButton
              size="small"
              onClick={() => navigate('/sales/order?viewAll=new')}
              sx={{ fontSize: '12px', py: 0.5 }}
            >
              View All New Items
            </CustomButton>
          </Box> */}
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <SalesProductList 
            title="Discounted Items" 
            type="discounted" 
            onDiscountModalOpen={handleDiscountModalOpen}
          />
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <CustomButton
              size="small"
              onClick={() => navigate('/sales/order?viewAll=discounted')}
              sx={{ fontSize: '12px', py: 0.5 }}
            >
              View All Discounted Items
            </CustomButton>
          </Box> */}
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <SalesProductList 
            title="Promoted Items" 
            type="promoted" 
            onDiscountModalOpen={handleDiscountModalOpen}
          />
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <CustomButton
              size="small"
              onClick={() => navigate('/sales/order?viewAll=promoted')}
              sx={{ fontSize: '12px', py: 0.5 }}
            >
              View All Promoted Items
            </CustomButton>
          </Box> */}
        </Grid>
                 {/* Retailer's Board */}
         {/* <Grid size={{ sm: 12, md: 12, xl: 12 }}>
           <Box
             sx={{
               backgroundColor: 'background.paper',
               borderRadius: 3,
               boxShadow: "none",
               border: "1px solid divider",
               p: 3,
               mb: 3,
             }}
           >
             <Typography 
               fontSize={18} 
               fontWeight={600} 
               mb={3}
               sx={{ 
                 color: theme.palette.primary.main,
                 borderBottom: `2px solid ${theme.palette.primary.main}`,
                 pb: 1,
                 display: 'inline-block'
               }}
             >
               Retailer's Dashboard
             </Typography>
             <Grid container spacing={3}>
               <Grid size={{ xs: 12, md: 4 }}>
                 <Box
                   sx={{
                     backgroundColor: 'background.default',
                     borderRadius: 2,
                     p: 2,
                     border: '1px solid',
                     borderColor: 'divider',
                     height: '100%',
                     transition: 'all 0.3s ease',
                     '&:hover': {
                       boxShadow: 2,
                       transform: 'translateY(-2px)',
                     }
                   }}
                 >
                   <SalesProductList title="New Items" type="new" />
                 </Box>
               </Grid>
               <Grid size={{ xs: 12, md: 4 }}>
                 <Box
                   sx={{
                     backgroundColor: 'background.default',
                     borderRadius: 2,
                     p: 2,
                     border: '1px solid',
                     borderColor: 'divider',
                     height: '100%',
                     transition: 'all 0.3s ease',
                     '&:hover': {
                       boxShadow: 2,
                       transform: 'translateY(-2px)',
                     }
                   }}
                 >
                   <SalesProductList title="Discounted Items" type="discounted" />
                 </Box>
               </Grid>
               <Grid size={{ xs: 12, md: 4 }}>
                 <Box
                   sx={{
                     backgroundColor: 'background.default',
                     borderRadius: 2,
                     p: 2,
                     border: '1px solid',
                     borderColor: 'divider',
                     height: '100%',
                     transition: 'all 0.3s ease',
                     '&:hover': {
                       boxShadow: 2,
                       transform: 'translateY(-2px)',
                     }
                   }}
                 >
                   <SalesProductList title="Promoted Items" type="promoted" />
                 </Box>
               </Grid>
             </Grid>
           </Box>
         </Grid>
          */}
         {/* High Demand Products Section */}
         <Grid size={{ sm: 12, md: 12, xl: 12 }}>
           <Box
             sx={{
               backgroundColor: 'background.paper',
               borderRadius: 3,
               boxShadow: "none",
               border: "1px solid divider",
               pb: 1,
             }}
           >
                           <Box display="flex" justifyContent="space-between" px={2} pt={2} alignItems="center">
                <Box>
                  <Typography fontSize={16} fontWeight={500}>
                    High Demand Products
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
                    For Retailer's
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Button
                    size="small"
                    onClick={() => setHighDemandViewMode("table")}
                    variant={highDemandViewMode === "table" ? "contained" : "outlined"}
                    sx={{
                      backgroundColor:
                        highDemandViewMode === "table"
                          ? theme.palette.primary.main
                          : "transparent",
                      color:
                        highDemandViewMode === "table" ? "#fff" : theme.palette.text.primary,
                      borderColor:
                        highDemandViewMode === "table"
                          ? theme.palette.primary.main
                          : theme.palette.divider,
                      boxShadow: "none",
                      minWidth: 60,
                      fontSize: 12,
                    }}
                  >
                    Table
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setHighDemandViewMode("graph")}
                    variant={highDemandViewMode === "graph" ? "contained" : "outlined"}
                    sx={{
                      backgroundColor:
                        highDemandViewMode === "graph"
                          ? theme.palette.primary.main
                          : "transparent",
                      color:
                        highDemandViewMode === "graph" ? "#fff" : theme.palette.text.primary,
                      borderColor:
                        highDemandViewMode === "graph"
                          ? theme.palette.primary.main
                          : theme.palette.divider,
                      boxShadow: "none",
                      minWidth: 60,
                      fontSize: 12,
                    }}
                  >
                    Graph
                  </Button>
                </Stack>
              </Box>
             <Box sx={{ m: 2 }}>
               {highDemandViewMode === "table" ? (
                 <CommonTable
                   padding={0}
                   data={topProducts || []}
                   columns={highDemandColumns}
                   currentPage={1}
                   totalPages={1}
                   totalItems={topProducts.length || 0}
                   stickyHeader={true}
                   pageSize={5}
                   onPageChange={() => {}}
                   onPageSizeChange={() => {}}
                   showPageSizeSelector={false}
                   showTotalItems={false}
                   showPageNumbers={false}
                   loading={loading}
                   containerHeight="320px"
                   emptyStateComponent={<Typography>No products</Typography>}
                 />
               ) : (
                                 <Box sx={{ height: 300, width: "100%" }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart
                       data={topProductsBarData}
                       margin={{ top: 30, right: 30, left: 20, bottom: -20 }}
                     >
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis
                         dataKey="itemNumber"
                         angle={-45}
                         textAnchor="end"
                         height={60}
                         interval={0}
                         tick={{
                           fontSize: 11,
                           fill: theme.palette.text.secondary,
                         }}
                       />
                       <YAxis
                         tick={{
                           fontSize: 12,
                           fill: theme.palette.text.secondary,
                         }}
                         tickFormatter={(value) => value.toLocaleString()}
                       />
                                               <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <Box
                                  sx={{
                                    background: "#1A2B3C",
                                    color: "#fff",
                                    borderRadius: 2,
                                    px: 2,
                                    py: 1,
                                    boxShadow: 2,
                                    maxWidth: 280,
                                  }}
                                >
                                  <Typography fontWeight={700} fontSize={14} mb={1}>
                                    {data.name}
                                  </Typography>
                                  <Typography fontSize={12} color="#ccc" mb={0.5}>
                                    Item Number: {data.itemNumber}
                                  </Typography>
                                  <Typography fontSize={12} mb={0.5}>
                                    Total Quantity: {data.quantity.toLocaleString()}
                                  </Typography>
                                  <Typography fontSize={12} mb={0.5}>
                                    Total Orders: {data.orders}
                                  </Typography>
                                  <Typography fontSize={12} mb={0.5}>
                                    Pack Size: {data.pack}
                                  </Typography>
                                  <Typography fontSize={12}>
                                    Case Count: {data.caseCount} {data.uom}
                                  </Typography>
                                </Box>
                              );
                            }
                            return null;
                          }}
                          cursor={{ fill: "rgba(0,0,0,0.1)" }}
                        />
                        <Bar
                          dataKey="quantity"
                          fill={theme.palette.primary.main}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={80}
                        />
                     </BarChart>
                   </ResponsiveContainer>
                 </Box>
               )}
             </Box>
           </Box>
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

export default SalesDashboard; 