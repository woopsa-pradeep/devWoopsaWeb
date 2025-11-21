  import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  TextField,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Checkbox,
  Collapse,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../component/atoms/CustomButton';
import CommonModal from '../component/atoms/CommonModal';
import CategoryIcon from '../component/atoms/CategoryIcon';
import Footer from '../component/atoms/Footer';
import StickySocialMedia from '../component/atoms/StickySocialMedia';
import distributorLogo from '../assets/Woopsa White.svg';
import '../pages/LandingPage.css';

// Import APIs
import { 
  getProductList,
  getProductByCategoryList,
  getProductCategory,
  getContactUsData
} from '../redux/apis/landingPageApis';

// Import product images
import product1 from '../assets/product1.png';
import product2 from '../assets/product2.png';
import product3 from '../assets/product3.png';
import product4 from '../assets/product4.png';
import product5 from '../assets/product5.jpg';
import product6 from '../assets/product6.png';
import product7 from '../assets/product7.png';
import DefaultProductImage from '../assets/Default-Product-Image.jpg';

// TypeScript interfaces for better type safety
interface PriceClass {
  Price_Class: number;
  Class_Desc: string;
}

interface ProductCategory {
  Sales_Category: number;
  Category_Desc: string;
  priceClasses: PriceClass[];
}

interface Category {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  category: string;
  subcategory: string;
  description: string;
  inStock: boolean;
  rating: number;
  Item_Number?: string;
  Description?: string;
  masterImage?: string;
  distributorImage?: string;
  showDistributorImage?: boolean;
  SalesCategory?: string;
  PriceClass?: string;
  Pack?: number;
  UOM?: string;
  CaseCount?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const Products: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Responsive navigation state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productsAnchorEl, setProductsAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLAnchorElement>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contactData, setContactData] = useState<any>(null);
  
  // New state variables for multi-select filters
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState<{ [key: number]: string }>({});
  const [subcategoryDisplayCounts, setSubcategoryDisplayCounts] = useState<{ [key: number]: number }>({});
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);
  const [crossButtonClicked, setCrossButtonClicked] = useState<boolean>(false); // Track if cross button was clicked
  const [hasInitialized, setHasInitialized] = useState(false); // Add flag to prevent duplicate API calls
  
  // Pagination and filtering states
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [masterSearchTerm, setMasterSearchTerm] = useState(''); // Add masterSearchTerm state
  const [paginationLoading, setPaginationLoading] = useState(false);
  
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const masterSearch = searchParams.get('masterSearch'); // Extract masterSearch parameter from URL
  
  const openProductsMenu = Boolean(productsAnchorEl);

  // Fetch categories and contact data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, contactResponse] = await Promise.all([
          getProductCategory(),
          getContactUsData()
        ]);
        
        if (categoriesResponse && Array.isArray(categoriesResponse)) {
          const processedCategories = categoriesResponse?.map((cat: ProductCategory) => ({
            id: cat.Sales_Category,
            name: cat.Category_Desc,
            subcategories: cat.priceClasses?.map((priceClass: PriceClass) => ({
              id: priceClass.Price_Class,
              name: priceClass.Class_Desc
            }))
          }));
          setCategories(processedCategories);
        }
        
        if (contactResponse) {
          setContactData(contactResponse);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize search term from URL parameter
  useEffect(() => {
    if (masterSearch) {
      setSearchTerm(masterSearch);
      setDebouncedSearchTerm(masterSearch);
      setMasterSearchTerm(masterSearch); // Set masterSearchTerm state
      setCrossButtonClicked(false); // Reset cross button state for new masterSearch
      setHasInitialized(true); // Mark as initialized to allow future API calls
    }
  }, [masterSearch]);

  // Reset pagination when URL parameters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [category, subcategory, masterSearchTerm]);

  // Fetch products based on query parameters and filters
  useEffect(() => {
    const fetchProducts = async () => {
      // Prevent duplicate API calls when masterSearchTerm changes on mount
      if (!hasInitialized && masterSearchTerm) {
        setHasInitialized(true);
        return;
      }
      
      // Prevent initial API call when no search parameters are present
      if (!hasInitialized && !masterSearchTerm && !debouncedSearchTerm && !category && !subcategory) {
        setHasInitialized(true);
        return;
      }
      
      try {
        setLoading(true);
        let response;

        if (category && subcategory) {
          // Filter by both category and subcategory with pagination
          response = await getProductByCategoryList(subcategory, category, pagination.currentPage, pagination.itemsPerPage);
          
          // Extract products from response - handle different possible structures
          let products = [];
          let totalCount = 0;
          
          if (response?.finalProductList && Array.isArray(response.finalProductList)) {
            products = response.finalProductList;
            totalCount = response.totalCount || products.length;
          } else if (response?.data && Array.isArray(response.data)) {
            products = response.data;
            totalCount = response.totalCount || products.length;
          } else if (Array.isArray(response)) {
            products = response;
            totalCount = products.length;
          }
          
          setFilteredProducts(products);
          setPagination({
            currentPage: pagination.currentPage,
            totalPages: Math.ceil(totalCount / pagination.itemsPerPage),
            totalItems: totalCount,
            itemsPerPage: pagination.itemsPerPage
          });
        } else if (subcategory && !category) {
          // Filter by subcategory only (when coming from brand logos)
          // Use getProductList instead of getProductByCategoryList because:
          // 1. We only want to filter by priceClass (subcategory), not by salesCategory
          // 2. getProductByCategoryList requires both parameters and would include salesCategory
          // 3. getProductList allows us to pass empty salesCategoryId array and only filter by priceClassId
          const payload = {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            salesCategoryId: [], // Empty array - no category filter
            search: '',
            masterSearch: undefined,
            priceClassId: [parseInt(subcategory)] // Only filter by subcategory/priceClass
          };
          
          response = await getProductList(payload);
          
          // Extract products from response
          let products = [];
          let totalCount = 0;
          
          if (response?.finalProductList && Array.isArray(response.finalProductList)) {
            products = response.finalProductList;
            totalCount = response.totalCount || products.length;
          } else if (response?.data && Array.isArray(response.data)) {
            products = response.data;
            totalCount = response.totalCount || products.length;
          } else if (Array.isArray(response)) {
            products = response;
            totalCount = products.length;
          }
          
          setFilteredProducts(products);
          setPagination({
            currentPage: pagination.currentPage,
            totalPages: Math.ceil(totalCount / pagination.itemsPerPage),
            totalItems: totalCount,
            itemsPerPage: pagination.itemsPerPage
          });
        } else if (category) {
          // Filter by category only with pagination
          response = await getProductByCategoryList(undefined, category, pagination.currentPage, pagination.itemsPerPage);
          
          // Extract products from response
          let products = [];
          let totalCount = 0;
          
          if (response?.finalProductList && Array.isArray(response.finalProductList)) {
            products = response.finalProductList;
            totalCount = response.totalCount || products.length;
          } else if (response?.data && Array.isArray(response.data)) {
            products = response.data;
            totalCount = response.totalCount || products.length;
          } else if (Array.isArray(response)) {
            products = response;
            totalCount = products.length;
          }
          
          setFilteredProducts(products);
          setPagination({
            currentPage: pagination.currentPage,
            totalPages: Math.ceil(totalCount / pagination.itemsPerPage),
            totalItems: totalCount,
            itemsPerPage: pagination.itemsPerPage
          });
        } else {
          // No query params, get all products with pagination and filters
          const payload = {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            salesCategoryId: selectedCategories.length > 0 ? selectedCategories : [],
            search: masterSearchTerm ? '' : debouncedSearchTerm, // Empty if masterSearchTerm is active, otherwise use regular search
            masterSearch: masterSearchTerm || undefined, // Use masterSearchTerm state
            priceClassId: selectedSubcategories.length > 0 ? selectedSubcategories : []
          };
          
          response = await getProductList(payload);
          
          // Extract products and pagination info from response
          let products = [];
          let totalCount = 0;
          
          if (response?.finalProductList && Array.isArray(response.finalProductList)) {
            products = response.finalProductList;
            totalCount = response.totalCount || 0;
          } else if (response?.data && Array.isArray(response.data)) {
            products = response.data;
            totalCount = response.totalCount || 0;
          } else if (Array.isArray(response)) {
            products = response;
            totalCount = products.length;
          }
          
          setFilteredProducts(products);
          setPagination({
            currentPage: pagination.currentPage,
            totalPages: Math.ceil(totalCount / pagination.itemsPerPage),
            totalItems: totalCount,
            itemsPerPage: pagination.itemsPerPage
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
        setPaginationLoading(false); // Reset pagination loading state
      }
    };

    fetchProducts();
  }, [category, subcategory, pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm, filtersApplied, masterSearchTerm, hasInitialized, categories]);

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

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleSubcategoryClick = (categoryId: number, subcategoryId: number) => {
    navigate(`/products?category=${categoryId}&subcategory=${subcategoryId}`);
    // Close dropdown immediately after subcategory click
    setProductsAnchorEl(null);
    setSelectedCategory('');
    // Reset pagination to first page when navigating to category/subcategory
    setPagination(prev => ({ ...prev, currentPage: 1 }));
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setProductDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const handleLoginToViewPrice = () => {
    handleModalClose();
    navigate('/login');
  };

  // Handle pagination change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPaginationLoading(true);
    setPagination(prev => ({ ...prev, currentPage: value }));
    
    // Smooth scroll to top when page changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle search input change - clear master search when user types
  const handleSearchChange = (e: any) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    // Clear master search when user starts typing
    if (newSearchTerm.trim() !== '' && masterSearch) {
      setMasterSearchTerm('');
      // Remove masterSearch parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('masterSearch');
      navigate(`/products?${newSearchParams.toString()}`);
      setHasInitialized(false); // Reset flag to allow API calls
    }
    
    // Reset to first page on search, but don't trigger loading immediately
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Clear master search
  const handleClearMasterSearch = () => {
    setMasterSearchTerm('');
    setSearchTerm(''); // Also clear the regular search field
    setDebouncedSearchTerm(''); // Clear debounced search term
    // Remove masterSearch parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('masterSearch');
    navigate(`/products?${newSearchParams.toString()}`);
    setHasInitialized(false); // Reset flag to allow API calls
    // Reset pagination to first page
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };


  // Handle items per page change
  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    const newItemsPerPage = Number(event.target.value);
    setPaginationLoading(true);
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newItemsPerPage,
      currentPage: 1, // Reset to first page
      totalPages: Math.ceil(prev.totalItems / newItemsPerPage)
    }));
    
    // Smooth scroll to top when items per page changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // New handler functions for multi-select filters
  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        // When adding a category, remove any subcategories that belong to this category
        const categorySubcategories = categories.find(cat => cat.id === categoryId)?.subcategories || [];
        const subcategoryIds = categorySubcategories?.map((sub : any) => sub.id);
        setSelectedSubcategories(prevSubs => prevSubs.filter(id => !subcategoryIds.includes(id)));
        return [...prev, categoryId];
      }
    });
  };

  const handleSubcategoryToggle = (subcategoryId: number) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategoryId)) {
        return prev.filter(id => id !== subcategoryId);
      } else {
        // When adding a subcategory, find its parent category and uncheck it
        let parentCategoryId: number | null = null;
        for (const cat of categories) {
          if (cat.subcategories.some(sub => sub.id === subcategoryId)) {
            parentCategoryId = cat.id;
            break;
          }
        }
        
        // Uncheck the parent category if found
        if (parentCategoryId) {
          setSelectedCategories(prevCats => prevCats.filter(id => id !== parentCategoryId));
        }
        
        return [...prev, subcategoryId];
      }
    });
  };

  const handleCategoryExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        // Clear search term for this category when expanding
        // This ensures that when switching between categories, each category starts with a clear search
        setSubcategorySearchTerm(prevTerms => {
          const newTerms = { ...prevTerms };
          newTerms[categoryId] = '';
          return newTerms;
        });
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleApplyFilters = () => {
    setPaginationLoading(true);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Trigger API call by setting filtersApplied to true
    setFiltersApplied(prev => !prev);
    
    // Close mobile drawer if open
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
    
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setExpandedCategories(new Set());
    setSubcategorySearchTerm({});
    setSearchTerm('');
    setMasterSearchTerm(''); // Clear masterSearchTerm state
    setSubcategoryDisplayCounts({});
    setFiltersApplied(prev => !prev); // Trigger API call to refresh results
    setPaginationLoading(true);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Clear masterSearch parameter from URL if it exists
    if (masterSearch) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('masterSearch');
      navigate(`/products?${newSearchParams.toString()}`);
      setCrossButtonClicked(true); // Mark cross button as clicked to disable it
    }
    
    setHasInitialized(false); // Reset flag to allow API calls
    
    // Close mobile drawer if open
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
    
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleMobileDrawer = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };

  // Handle view more subcategories
  const handleViewMoreSubcategories = (categoryId: number) => {
    setSubcategoryDisplayCounts(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || 10) + 10
    }));
  };

  // Get display count for subcategories
  const getSubcategoryDisplayCount = (categoryId: number) => {
    return subcategoryDisplayCounts[categoryId] || 10;
  };

  // Check if a category should be disabled (when its subcategories are selected)
  const isCategoryDisabled = (categoryId: number) => {
    const categorySubcategories = categories.find(cat => cat.id === categoryId)?.subcategories || [];
    return categorySubcategories.some(sub => selectedSubcategories.includes(sub.id));
  };

  // Check if a subcategory should be disabled (when its parent category is selected)
  const isSubcategoryDisabled = (subcategoryId: number) => {
    for (const cat of categories) {
      if (cat.subcategories.some(sub => sub.id === subcategoryId)) {
        return selectedCategories.includes(cat.id);
      }
    }
    return false;
  };

  // Process product data from API
  const processProductData = (product: any): Product => {
    
    // Get category name from categories array if available
    let categoryName = 'Unknown Category';
    let subcategoryName = 'Unknown Subcategory';
    
    if (product.SalesCategory && categories.length > 0) {
      const categoryObj = categories.find(cat => cat.id.toString() === product.SalesCategory.toString());
      if (categoryObj) {
        categoryName = categoryObj.name;
        
        // Get subcategory name if available
        if (product.PriceClass) {
          const subcategoryObj = categoryObj.subcategories.find(sub => sub.id.toString() === product.PriceClass.toString());
          if (subcategoryObj) {
            subcategoryName = subcategoryObj.name;
          }
        }
      }
    }
    
    return {
      id: product.Item_Number?.toString() || product.id?.toString() || Math.random().toString(),
      name: product.Description || 'Product Name Not Available',
      image: product.showDistributorImage && product.distributorImage ? product.distributorImage : product.masterImage || DefaultProductImage,
      price: 0, // Price not available in current API response
      originalPrice: undefined,
      discount: undefined,
      category:  product?.Sales_Category || categoryName,
      subcategory: product?.Price_Class || subcategoryName,
      description: product.Description || 'Product description not available.',
      inStock: true, // Default to true since stock info not available
      rating: 0, // Rating not available in current API response
      Item_Number: product.Item_Number?.toString(),
      Description: product.Description,
      masterImage: product.masterImage,
      distributorImage: product.distributorImage,
      showDistributorImage: product.showDistributorImage,
      SalesCategory: product.SalesCategory?.toString(),
      PriceClass: product.PriceClass?.toString(),
      Pack: product.Pack,
      UOM: product.UOM,
      CaseCount: product.CaseCount
    };
  };

  const getImageSrc = (imagePath: string) => {
    if (!imagePath || imagePath === DefaultProductImage) {
      return DefaultProductImage;
    }
    
    const imageMap: { [key: string]: string } = {
      '/src/assets/product1.png': product1,
      '/src/assets/product2.png': product2,
      '/src/assets/product3.png': product3,
      '/src/assets/product4.png': product4,
      '/src/assets/product5.jpg': product5,
      '/src/assets/product6.png': product6,
      '/src/assets/product7.png': product7,
    };
    return imageMap[imagePath] || imagePath;
  };

  // Get category name by ID
  const getCategoryNameById = (categoryId: string) => {
    const categoryObj = categories.find(cat => cat.id.toString() === categoryId);
    return categoryObj ? categoryObj.name : categoryId;
  };

  // Get subcategory name by ID
  const getSubcategoryNameById = (categoryId: string, subcategoryId: string) => {
    if (!categoryId) {
      // When no category is provided, search through all categories for the subcategory
      for (const cat of categories) {
        const subcategoryObj = cat.subcategories.find(sub => sub.id.toString() === subcategoryId);
        if (subcategoryObj) {
          return subcategoryObj.name;
        }
      }
      return subcategoryId;
    }
    
    const categoryObj = categories.find(cat => cat.id.toString() === categoryId);
    if (categoryObj) {
      const subcategoryObj = categoryObj.subcategories.find(sub => sub.id.toString() === subcategoryId);
      return subcategoryObj ? subcategoryObj.name : subcategoryId;
    }
    return subcategoryId;
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img 
              src={contactData?.logo || distributorLogo} 
              alt={contactData?.D_Name || "Distributor"} 
              style={{ height: '35px' , cursor: 'pointer' }} 
              onClick={() => navigate("/")}
              onError={(e) => {
                e.currentTarget.src = distributorLogo;
              }}
            />
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a 
                href="/products" 
                className="nav-link"
                onMouseEnter={handleProductsMenuOpen}
                onMouseLeave={handleProductsMenuClose}
                ref={navbarRef}
              >
                Products
              </a>
              <a
                href="#"
                className="nav-link"
                onClick={() => {
                  navigate('/contact-us');
                }}
              >
                Become a Retailer
              </a>
              <CustomButton
                onClick={handleLoginRedirect}
                buttonType="primary"
                appearance="filled"
                size="medium"
                fullWidth={false}
                sx={{mt: 0}}
              >
                Login
              </CustomButton>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CustomButton
                onClick={handleLoginRedirect}
                buttonType="primary"
                appearance="filled"
                size="small"
                fullWidth={false}
                sx={{ mt: 0 }}
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
        {openProductsMenu && !isMobile && (
          <Box
            ref={dropdownRef}
            sx={{
              position: 'absolute',
              top: '100%',
              right: '130px',
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
                <Grid size={{xs: 6}}>
                  <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#2c3e50', fontWeight: 600, borderBottom: '2px solid #3498db', pb: 0.5, fontSize: '0.9rem' }}>
                    Categories
                  </Typography>
                  <List sx={{ p: 0, maxHeight: '300px', overflow: 'auto' }}>
                    {categories.length > 0 ? (
                      categories?.map((category) => (
                        <ListItem 
                          key={category.id}
                          onClick={() => setSelectedCategory(category.name)}
                          sx={{ 
                            borderRadius: 1, 
                            mb: 0.5,
                            py: 0.5,
                            px: 1,
                            cursor: 'pointer',
                            backgroundColor: selectedCategory === category.name ? 'rgba(60, 119, 149, 0.08)' : 'transparent',
                            '&:hover': { 
                              backgroundColor: selectedCategory === category.name ? 'rgba(60, 119, 149, 0.12)' : 'rgba(60, 119, 149, 0.05)' 
                            }
                          }}
                        >
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <CategoryIcon size={16} color={selectedCategory === category.name ? '#3C7795' : '#666'} />
                          </Box>
                          <ListItemText 
                            primary={category.name} 
                            primaryTypographyProps={{ 
                              fontWeight: selectedCategory === category.name ? 600 : 500,
                              color: selectedCategory === category.name ? '#2c3e50' : '#555',
                              fontSize: '0.8rem'
                            }}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 1, color: '#999', fontSize: '0.8rem' }}>
                        Loading categories...
                      </Box>
                    )}
                  </List>
                </Grid>

                {/* Right Side - Subcategories */}
                <Grid size={{xs: 6}}>
                  <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#2c3e50', fontWeight: 600, borderBottom: '2px solid #3498db', pb: 0.5, fontSize: '0.9rem' }}>
                    {selectedCategory ? `${selectedCategory} Subcategories` : 'Select a Category'}
                  </Typography>
                  
                  {selectedCategory ? (
                    <List sx={{ p: 0, maxHeight: '300px', overflow: 'auto' }}>
                      {(() => {
                        const selectedCat = categories.find(cat => cat.name === selectedCategory);
                        return selectedCat?.subcategories && selectedCat.subcategories.length > 0 ? (
                          selectedCat?.subcategories?.map((subcategory: { id: number; name: string }) => (
                            <ListItem 
                              key={subcategory.id}
                              onClick={() => {
                                if (selectedCat) {
                                  handleSubcategoryClick(selectedCat.id, subcategory.id);
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
                                primary={subcategory.name} 
                                primaryTypographyProps={{ 
                                  fontSize: '0.75rem',
                                  color: '#2c3e50',
                                  fontWeight: 500
                                }}
                              />
                            </ListItem>
                          ))
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 2, color: '#999', fontSize: '0.8rem' }}>
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
                  navigate('/');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="Home" />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate('/products');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="All Products" />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate('/contact-us');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="Become a Retailer" />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
      </nav>

             {/* Main Content with top margin for navbar */}
      <Box sx={{ py: 3, mt: 8, pb: 12, px: 2 }}>
        {/* Mobile Filter Button */}
        {!category && !subcategory && isMobile && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'start' }}>
            <CustomButton
              onClick={toggleMobileDrawer}
              buttonType="primary"
              appearance="filled"
              size="medium"
              fullWidth={false}
              sx={{ px: 4 }}
            >
              {filterDrawerOpen ? 'Close Filters' : 'Open Filters'}
            </CustomButton>
          </Box>
        )}

        {/* Main Layout with Sidebar and Products Grid */}
        <Box sx={{ display: 'flex', gap: 3, minHeight: filteredProducts.length === 0 ? 'calc(100vh - 460px)' : 'calc(100vh - 120px)'  }}>
          {/* Left Sidebar - Filters */}
          {!category && !subcategory && !isMobile && (
         <Box sx={{ 
              width: '280px', 
              flexShrink: 0,
              backgroundColor: 'white',
              borderRadius: 2,
              p: 2,
              height: 'fit-content',
              position: 'sticky',
              top: 80,
              border: '1px solid #f0f0f0',
              alignSelf: 'flex-start'
            }}>
              <Typography variant="h6" sx={{ 
                color: 'primary.main', 
                fontWeight: 600, 
                mb: 2,
                fontSize: '0.95rem',
                 textAlign: 'left'
               }}>
                Filters
               </Typography>

                 {/* Search */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                  Search Products
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={masterSearchTerm && !searchTerm && !crossButtonClicked ? "Master search active..." : "Search by product name..."}
                    disabled={paginationLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: masterSearchTerm && !searchTerm && !crossButtonClicked ? '#fff3e0' : '#fafafa', // Orange only when masterSearch active and no user input
                        borderRadius: 1.5,
                        fontSize: '0.8rem',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                  {/* Clear search button when search has value */}
                  {(masterSearchTerm || searchTerm) && (
                    <Tooltip title="Clear search">
                      <IconButton
                        size="small"
                        onClick={handleClearMasterSearch}
                        sx={{ 
                          p: 0.5,
                          color: 'grey.500',
                          '&:hover': {
                            backgroundColor: 'grey.100'
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {/* Show helper text when search is from URL */}
                {masterSearchTerm && !searchTerm && (
                  <Typography variant="caption" sx={{ 
                    color: 'primary.main', 
                    fontSize: '0.7rem', 
                    mt: 0.5, 
                    display: 'block',
                    fontStyle: 'italic'
                  }}>
                    Master search from banner: {masterSearchTerm} (searches by item numbers)
                  </Typography>
                )}
                {/* Show helper text for regular search */}
                {searchTerm && (
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary', 
                    fontSize: '0.7rem', 
                    mt: 0.5, 
                    display: 'block',
                    fontStyle: 'italic'
                  }}>
                    Regular search: {searchTerm} (searches by product names)
                  </Typography>
                )}
              </Box>

              {/* Categories with Checkboxes */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                  Categories
                </Typography>
                <Box sx={{ maxHeight: '440px', overflow: 'auto' }}>
                     {categories?.map((cat) => (
                    <Box key={cat.id} sx={{ mb: 1 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 0.5,
                        p: 0.75,
                        borderRadius: 1.5,
                        backgroundColor: selectedCategories.includes(cat.id) ? 'primary.50' : 'transparent',
                        border: selectedCategories.includes(cat.id) ? '1px solid primary.200' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}>
                        <Checkbox
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => handleCategoryToggle(cat.id)}
                          disabled={isCategoryDisabled(cat.id)}
                          size="small"
                          sx={{ 
                            p: 0.25,
                            color: isCategoryDisabled(cat.id) ? 'grey.300' : 'grey.400',
                            '&.Mui-checked': {
                              color: 'primary.main'
                            },
                            '&.Mui-disabled': {
                              color: 'grey.300'
                            }
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            flex: 1, 
                            cursor: isCategoryDisabled(cat.id) ? 'not-allowed' : 'pointer',
                            fontWeight: selectedCategories.includes(cat.id) ? 600 : 400,
                            color: isCategoryDisabled(cat.id) ? 'grey.400' : (selectedCategories.includes(cat.id) ? 'primary.main' : 'text.primary'),
                            fontSize: '0.8rem',
                            transition: 'all 0.15s ease',
                            opacity: isCategoryDisabled(cat.id) ? 0.6 : 1
                          }}
                          onClick={() => !isCategoryDisabled(cat.id) && handleCategoryToggle(cat.id)}
                        >
                         {cat.name}
                        </Typography>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => handleCategoryExpand(cat.id)}
                            sx={{ 
                              p: 0.25,
                              color: expandedCategories.has(cat.id) ? 'primary.main' : 'grey.500',
                              '&:hover': {
                                backgroundColor: 'primary.50'
                              }
                            }}
                          >
                            {expandedCategories.has(cat.id) ? '−' : '+'}
                          </IconButton>
                        )}
                      </Box>
                      
                      {/* Subcategories Dropdown */}
                      <Collapse in={expandedCategories.has(cat.id)}>
                        <Box sx={{ ml: 1.5, mb: 0.5 }}>
                          {/* Subcategory Search */}
                          <TextField
                            size="small"
                            placeholder="Search subcategories..."
                            value={subcategorySearchTerm[cat.id] || ''}
                            onChange={(e) => setSubcategorySearchTerm(prev => ({
                              ...prev,
                              [cat.id]: e.target.value
                            }))}
                            sx={{ 
                              mb: 1,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fafafa',
                                fontSize: '0.75rem',
                                borderRadius: 1.5
                              }
                            }}
                          />
                          
                          {/* Subcategories List */}
                          <Box sx={{ 
                            maxHeight: '180px', 
                            overflow: 'auto',
                            backgroundColor: '#fafafa',
                            borderRadius: 1.5,
                            p: 1
                          }}>
                            {cat.subcategories
                              .filter(sub => 
                                sub.name.toLowerCase().includes((subcategorySearchTerm[cat.id] || '').toLowerCase())
                              )
                              .slice(0, getSubcategoryDisplayCount(cat.id))
                              ?.map((sub : any) => (
                                <Box key={sub.id} sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  mb: 0.5,
                                  p: 0.75,
                                  borderRadius: 1,
                                  backgroundColor: selectedSubcategories.includes(sub.id) ? 'primary.50' : 'transparent',
                                  border: selectedSubcategories.includes(sub.id) ? '1px solid primary.200' : '1px solid transparent',
                                  transition: 'all 0.15s ease'
                                }}>
                                  <Checkbox
                                    checked={selectedSubcategories.includes(sub.id)}
                                    onChange={() => handleSubcategoryToggle(sub.id)}
                                    disabled={isSubcategoryDisabled(sub.id)}
                                    size="small"
                                    sx={{ 
                                      p: 0.25,
                                      color: isSubcategoryDisabled(sub.id) ? 'grey.300' : 'grey.400',
                                      '&.Mui-checked': {
                                        color: 'primary.main'
                                      },
                                      '&.Mui-disabled': {
                                        color: 'grey.300'
                                      }
                                    }}
                                  />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      cursor: isSubcategoryDisabled(sub.id) ? 'not-allowed' : 'pointer',
                                      color: isSubcategoryDisabled(sub.id) ? 'grey.400' : (selectedSubcategories.includes(sub.id) ? 'primary.main' : 'text.primary'),
                                      fontWeight: selectedSubcategories.includes(sub.id) ? 500 : 400,
                                      transition: 'all 0.15s ease',
                                      opacity: isSubcategoryDisabled(sub.id) ? 0.6 : 1
                                    }}
                                    onClick={() => !isSubcategoryDisabled(sub.id) && handleSubcategoryToggle(sub.id)}
                                  >
                         {sub.name}
                                  </Typography>
                                </Box>
                              ))}
                            
                            {/* View More Button */}
                            {cat.subcategories.length > getSubcategoryDisplayCount(cat.id) && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleViewMoreSubcategories(cat.id)}
                                sx={{ 
                                  fontSize: '0.7rem',
                                  color: 'primary.main',
                                  mt: 0.5,
                                  p: 0.25,
                                  width: '100%',
                                  minHeight: '24px',
                                  '&:hover': {
                                    backgroundColor: 'primary.50'
                                  }
                                }}
                              >
                                View More ({cat.subcategories.length - getSubcategoryDisplayCount(cat.id)})
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </Box>
              </Box>

                             {/* Items Per Page */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                  Items Per Page
                </Typography>
                 <FormControl fullWidth size="small">
                   <Select
                     value={pagination.itemsPerPage}
                     onChange={handleItemsPerPageChange}
                     disabled={paginationLoading}
                    sx={{
                      backgroundColor: '#fafafa',
                      borderRadius: 1.5,
                      fontSize: '0.8rem',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }}
                   >
                     <MenuItem value={10}>10</MenuItem>
                     <MenuItem value={20}>20</MenuItem>
                     <MenuItem value={50}>50</MenuItem>
                     <MenuItem value={100}>100</MenuItem>
                   </Select>
                 </FormControl>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <CustomButton
                  onClick={handleApplyFilters}
                  buttonType="primary"
                  appearance="filled"
                  size="small"
                  fullWidth={true}
                  disabled={paginationLoading}
                  sx={{ 
                    borderRadius: 1.5,
                    fontSize: '0.75rem',
                    py: 0.5,
                    minHeight: '32px'
                  }}
                >
                  Apply
                </CustomButton>
                <CustomButton
                  onClick={handleClearFilters}
                  appearance="outlined"
                  size="small"
                  fullWidth={true}
                  disabled={paginationLoading}
                  sx={{ 
                    borderRadius: 1.5,
                    fontSize: '0.75rem',
                    py: 0.5,
                    minHeight: '32px'
                  }}
                >
                  Clear
                </CustomButton>
              </Box>
             
                           {/* Filter Loading Indicator */}
              {(paginationLoading || (searchTerm !== debouncedSearchTerm)) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} sx={{ color: 'primary.main' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      {searchTerm !== debouncedSearchTerm ? 'Searching...' : 'Updating...'}
                    </Typography>
                  </Box>
                </Box>
              )}
         </Box>
        )}

          {/* Right Side - Products Grid */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Products Header - Positioned at top beside sidebar */}
            <Box sx={{ 
              mb: 3,
              p: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" sx={{ 
                  color: 'primary.main', 
                  fontWeight: 600, 
                  fontSize: '1.1rem'
                }}>
                  {subcategory && !category ? 
                    getSubcategoryNameById('', subcategory) : 
                    subcategory && category ? 
                      getSubcategoryNameById(category, subcategory) : 
                      category ? 
                        getCategoryNameById(category) : 
                        'All Products'
                  }
                  {masterSearchTerm && !searchTerm && !crossButtonClicked && (
                    <Typography component="span" sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 400, 
                      fontSize: '0.9rem',
                      ml: 1
                    }}>
                      - Master Search: {masterSearchTerm}
                    </Typography>
                  )}
                  {searchTerm && (
                    <Typography component="span" sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 400, 
                      fontSize: '0.9rem',
                      ml: 1
                    }}>
                      - Search: {searchTerm}
                    </Typography>
                  )}
                </Typography>
                <Box>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 400, 
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}>
                    {loading ? 'Loading...' : `${pagination.totalItems} products found`}
                    {category && categories.length > 0 && ` in ${getCategoryNameById(category)}`}
                    {subcategory && categories.length > 0 && (
                      category ? 
                        ` > ${getSubcategoryNameById(category, subcategory)}` : 
                        ` in ${getSubcategoryNameById('', subcategory)}`
                    )}
                    {masterSearchTerm && !searchTerm && ` for master search "${masterSearchTerm}"`}
                    {searchTerm && ` for search "${searchTerm}"`}
                  </Typography>
                </Box>
              </Box>
            </Box>

                 {/* Loading State */}
         {(loading || paginationLoading) && (
           <Box sx={{ 
             display: 'flex', 
             flexDirection: 'column',
             justifyContent: 'center', 
             alignItems: 'center',
             py: 8,
                gap: 2,
                flex: 1
           }}>
                <CircularProgress size={60} sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
               {loading ? 'Loading products...' : 'Updating results...'}
             </Typography>
           </Box>
         )}

                 {/* Products Grid */}
         {!loading && !paginationLoading && (
           <Box
             sx={{
               flex: 1,
               display: 'flex',
               justifyContent: 'center',
               alignItems: 'flex-start',
             }}
           >
             <Box
               sx={{
                 display: 'flex',
                 flexWrap: 'wrap',
                 gap: 1.5,
                 maxWidth: 1200,
                 width: '100%',
                 justifyContent: { xs: 'center', md: 'flex-start' },
               }}
             >
               {filteredProducts?.map((product : any) => {
                 const processedProduct = processProductData(product);
                 return (
                   <Box
                     key={processedProduct.id}
                     sx={{
                       flex: '1 1 180px',
                       minWidth: { xs: '160px', sm: '180px', md: '220px' },
                       maxWidth: { xs: '100%', sm: '220px' },
                       boxSizing: 'border-box',
                       display: 'flex',
                       justifyContent: 'center',
                     }}
                   >
                     <div
                       className="product-card-new"
                       onClick={() => handleProductClick(processedProduct)}
                       style={{ width: '100%' }}
                     >
                       <div className="product-image-new">
                         <img
                           src={getImageSrc(processedProduct.image)}
                           alt={processedProduct.name}
                           onError={(e) => {
                             e.currentTarget.src = DefaultProductImage;
                           }}
                         />
                       </div>

                       <div className="product-content-new">
                         <div className="category-tag">
                           {processedProduct.SalesCategory || processedProduct.category || 'PRODUCT'}
                         </div>
                         <h3 className="product-title">{processedProduct.name}</h3>
                         <div className="product-specs">
                           <div className="spec-left">
                             <div className="spec-item">Pack: {processedProduct.Pack || 1}</div>
                             <div className="spec-item">Case: {processedProduct.CaseCount || 1}</div>
                           </div>
                           <div className="spec-right">
                             <div className="spec-item">Size: {processedProduct.UOM || 'EACH'}</div>
                             <div className="spec-item">Item: {processedProduct.Item_Number || 'N/A'}</div>
                           </div>
                         </div>
                         <CustomButton
                           onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                             e.stopPropagation();
                             handleProductClick(processedProduct);
                           }}
                           buttonType="primary"
                           appearance="filled"
                           size="small"
                           fullWidth={true}
                           sx={{
                             mt: 0.7,
                             py: 0,
                             px: 1,
                             borderRadius: '4px',
                             maxHeight: '16px',
                           }}
                         >
                           View Details
                         </CustomButton>
                       </div>
                     </div>
                   </Box>
                 );
               })}
             </Box>
           </Box>
         )}

                 {/* No Products Found */}
         {!loading && !paginationLoading && filteredProducts.length === 0 && (
           <Box sx={{ 
             textAlign: 'center', 
             py: 8,
                color: 'text.secondary',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
           }}>
             <Typography variant="h5" sx={{ mb: 2 }}>
               No products found
             </Typography>
             <Typography variant="body1" sx={{ mb: 3 }}>
               Try adjusting your search criteria or browse all products
             </Typography>
             <Button 
               variant="outlined" 
               onClick={() => navigate('/')}
               sx={{ 
                    borderColor: 'primary.main',
                    color: 'primary.main',
                 '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.50'
                 }
               }}
             >
               Back to Home
             </Button>
           </Box>
         )}
          </Box>
        </Box>
      </Box>

      {/* Mobile Filter Drawer */}
      {!category && !subcategory && (
        <Drawer
          anchor="left"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '260px',
              p: 2,
              backgroundColor: 'white',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ 
              color: 'primary.main', 
              fontWeight: 600, 
              mb: 2,
              fontSize: '0.95rem',
              textAlign: 'left'
            }}>
              Filters
            </Typography>

            {/* Search */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                Search Products
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={masterSearchTerm && !searchTerm && !crossButtonClicked ? "Master search active..." : "Search by product name..."}
                  disabled={paginationLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: masterSearchTerm && !searchTerm && !crossButtonClicked ? '#fff3e0' : '#fafafa', // Orange only when masterSearch active and no user input
                      borderRadius: 1.5,
                      fontSize: '0.8rem',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
                {/* Clear search button when search has value */}
                {(masterSearchTerm || searchTerm) && (
                  <Tooltip title="Clear search">
                    <IconButton
                      size="small"
                      onClick={handleClearMasterSearch}
                      sx={{ 
                        p: 0.5,
                        color: 'grey.500',
                        '&:hover': {
                          backgroundColor: 'grey.100'
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {/* Show helper text when search is from URL */}
              {masterSearchTerm && !searchTerm && (
                <Typography variant="caption" sx={{ 
                  color: 'primary.main', 
                  fontSize: '0.7rem', 
                  mt: 0.5, 
                  display: 'block',
                  fontStyle: 'italic'
                }}>
                  Master search from banner: {masterSearchTerm} (searches by item numbers)
                </Typography>
              )}
              {/* Show helper text for regular search */}
              {searchTerm && (
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary', 
                  fontSize: '0.7rem', 
                  mt: 0.5, 
                  display: 'block',
                  fontStyle: 'italic'
                }}>
                  Regular search: {searchTerm} (searches by product names)
                </Typography>
              )}
            </Box>

            {/* Categories with Checkboxes */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                Categories
              </Typography>
              <Box sx={{ maxHeight: '440px', overflow: 'auto' }}>
                {categories?.map((cat : any) => (
                  <Box key={cat.id} sx={{ mb: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 0.5,
                      p: 0.75,
                      borderRadius: 1.5,
                      backgroundColor: selectedCategories.includes(cat.id) ? 'primary.50' : 'transparent',
                      border: selectedCategories.includes(cat.id) ? '1px solid primary.200' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}>
                      <Checkbox
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        disabled={isCategoryDisabled(cat.id)}
                        size="small"
                        sx={{ 
                          p: 0.25,
                          color: isCategoryDisabled(cat.id) ? 'grey.300' : 'grey.400',
                          '&.Mui-checked': {
                            color: 'primary.main'
                          },
                          '&.Mui-disabled': {
                            color: 'grey.300'
                          }
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          flex: 1, 
                          cursor: isCategoryDisabled(cat.id) ? 'not-allowed' : 'pointer',
                          fontWeight: selectedCategories.includes(cat.id) ? 600 : 400,
                          color: isCategoryDisabled(cat.id) ? 'grey.400' : (selectedCategories.includes(cat.id) ? 'primary.main' : 'text.primary'),
                          fontSize: '0.8rem',
                          transition: 'all 0.15s ease',
                          opacity: isCategoryDisabled(cat.id) ? 0.6 : 1
                        }}
                        onClick={() => !isCategoryDisabled(cat.id) && handleCategoryToggle(cat.id)}
                      >
                        {cat.name}
                      </Typography>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => handleCategoryExpand(cat.id)}
                          sx={{ 
                            p: 0.25,
                            color: expandedCategories.has(cat.id) ? 'primary.main' : 'grey.500',
                            '&:hover': {
                              backgroundColor: 'primary.50'
                            }
                          }}
                        >
                          {expandedCategories.has(cat.id) ? '−' : '+'}
                        </IconButton>
                      )}
                    </Box>
                    
                    {/* Subcategories Dropdown */}
                    <Collapse in={expandedCategories.has(cat.id)}>
                      <Box sx={{ ml: 1.5, mb: 0.5 }}>
                        {/* Subcategory Search */}
                        <TextField
                          size="small"
                          placeholder="Search subcategories..."
                          value={subcategorySearchTerm[cat.id] || ''}
                          onChange={(e) => setSubcategorySearchTerm(prev => ({
                            ...prev,
                            [cat.id]: e.target.value
                          }))}
                          sx={{ 
                            mb: 1,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#fafafa',
                              fontSize: '0.75rem',
                              borderRadius: 1.5
                            }
                          }}
                        />
                        
                        {/* Subcategories List */}
                        <Box sx={{ 
                          maxHeight: '180px', 
                          overflow: 'auto',
                          backgroundColor: '#fafafa',
                          borderRadius: 1.5,
                          p: 1
                        }}>
                          {cat.subcategories
                            .filter((sub : any) => 
                              sub.name.toLowerCase().includes((subcategorySearchTerm[cat.id] || '').toLowerCase())
                            )
                            .slice(0, getSubcategoryDisplayCount(cat.id))
                            .map((sub : any) => (
                              <Box key={sub.id} sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mb: 0.5,
                                p: 0.75,
                                borderRadius: 1,
                                backgroundColor: selectedSubcategories.includes(sub.id) ? 'primary.50' : 'transparent',
                                border: selectedSubcategories.includes(sub.id) ? '1px solid primary.200' : '1px solid transparent',
                                transition: 'all 0.15s ease'
                              }}>
                                <Checkbox
                                  checked={selectedSubcategories.includes(sub.id)}
                                  onChange={() => handleSubcategoryToggle(sub.id)}
                                  disabled={isSubcategoryDisabled(sub.id)}
                                  size="small"
                                  sx={{ 
                                    p: 0.25,
                                    color: isSubcategoryDisabled(sub.id) ? 'grey.300' : 'grey.400',
                                    '&.Mui-checked': {
                                      color: 'primary.main'
                                    },
                                    '&.Mui-disabled': {
                                      color: 'grey.300'
                                    }
                                  }}
                                />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    cursor: isSubcategoryDisabled(sub.id) ? 'not-allowed' : 'pointer',
                                    color: isSubcategoryDisabled(sub.id) ? 'grey.400' : (selectedSubcategories.includes(sub.id) ? 'primary.main' : 'text.primary'),
                                    fontWeight: selectedSubcategories.includes(sub.id) ? 500 : 400,
                                    transition: 'all 0.15s ease',
                                    opacity: isSubcategoryDisabled(sub.id) ? 0.6 : 1
                                  }}
                                  onClick={() => !isSubcategoryDisabled(sub.id) && handleSubcategoryToggle(sub.id)}
                                >
                                  {sub.name}
                                </Typography>
                              </Box>
                            ))}
                          
                          {/* View More Button */}
                          {cat.subcategories.length > getSubcategoryDisplayCount(cat.id) && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleViewMoreSubcategories(cat.id)}
                              sx={{ 
                                fontSize: '0.7rem',
                                color: 'primary.main',
                                mt: 0.5,
                                p: 0.25,
                                width: '100%',
                                minHeight: '24px',
                                '&:hover': {
                                  backgroundColor: 'primary.50'
                                }
                              }}
                            >
                              View More ({cat.subcategories.length - getSubcategoryDisplayCount(cat.id)})
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Items Per Page */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                Items Per Page
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={pagination.itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  disabled={paginationLoading}
                  sx={{
                    backgroundColor: '#fafafa',
                    borderRadius: 1.5,
                    fontSize: '0.8rem',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <CustomButton
                onClick={handleApplyFilters}
                buttonType="primary"
                appearance="filled"
                size="small"
                fullWidth={true}
                disabled={paginationLoading}
                sx={{ 
                  borderRadius: 1.5,
                  fontSize: '0.75rem',
                  py: 0.5,
                  minHeight: '32px'
                }}
              >
                Apply
              </CustomButton>
              <CustomButton
                onClick={handleClearFilters}
                appearance="outlined"
                size="small"
                fullWidth={true}
                disabled={paginationLoading}
                sx={{ 
                  borderRadius: 1.5,
                  fontSize: '0.75rem',
                  py: 0.5,
                  minHeight: '32px'
                }}
              >
                Clear
              </CustomButton>
            </Box>

            {/* Filter Loading Indicator */}
            {(paginationLoading || (searchTerm !== debouncedSearchTerm)) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} sx={{ color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {searchTerm !== debouncedSearchTerm ? 'Searching...' : 'Updating...'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Drawer>
      )}

               {/* Sticky Pagination at Bottom */}
        {!loading && pagination.totalPages > 1 && (
          <Box
            sx={{
            position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              zIndex: 1000,
            py: 1.5,
            px: 2,
            borderTop: '1px solid #f0f0f0',
            mt: 3
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            maxWidth: '100%',
            mx: 'auto'
          }}>
               {paginationLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={20} sx={{ color: 'primary.main' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                     Loading page {pagination.currentPage}...
                   </Typography>
                 </Box>
               ) : (
                 <Pagination
                   count={pagination.totalPages}
                   page={pagination.currentPage}
                   onChange={handlePageChange}
                   color="primary"
                size="medium"
                   showFirstButton
                   showLastButton
                   sx={{
                    '& .MuiPaginationItem-root': {
                    color: 'primary.main',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                        color: 'white',
                      padding: '0.4rem 0.4rem',
                        borderRadius: '50% ',
                      border: '1px solid primary.main',
                        '&:hover': {
                        backgroundColor: 'primary.main',
                          color: 'white',
                        }
                      }
                    }
                   }}
                 />
               )}
             </Box>
         </Box>
       )}

      {/* Sticky Social Media */}
      <StickySocialMedia contactData={contactData} />

      {/* Footer */}
      <Footer contactData={contactData} />

      {/* Product Detail Modal */}
      <CommonModal
        open={productDetailModalOpen}
        onClose={handleModalClose}
        title={'Product Details'}
        size="md"
      >
        {selectedProduct && (
          <Box>
            <Grid container spacing={3}>
              {/* Product Image */}
              <Grid size={{xs: 12, md: 5}}>
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={getImageSrc(selectedProduct.image)} 
                    alt={selectedProduct.name}
                    style={{ 
                      width: '100%', 
                      maxWidth: '250px', 
                      maxHeight: '250px',
                      height: 'auto',
                      borderRadius: '8px'
                    }} 
                    onError={(e) => {
                      e.currentTarget.src = DefaultProductImage;
                    }}
                  />
                </Box>
              </Grid>
              
              {/* Product Details */}
              <Grid size={{xs: 12, md: 7}}>
                <Typography variant="h6" sx={{ fontWeight: 500, color: '#2c3e50', mb: 2, fontSize: '1rem'   }}>
                  {selectedProduct.name}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Product Info */}
                <Box sx={{ mb: 2 }}>
                  {selectedProduct.Item_Number && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      <strong>Item ID:</strong> {selectedProduct.Item_Number}
                    </Typography>
                  )}
                  {selectedProduct.SalesCategory && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      <strong>Category:</strong> {selectedProduct.SalesCategory}
                    </Typography>
                  )}
                  {selectedProduct.Pack && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      <strong>Pack:</strong> {selectedProduct.Pack}
                    </Typography>
                  )}
                  {selectedProduct.UOM && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      <strong>Size:</strong> {selectedProduct.UOM}
                    </Typography>
                  )}
                  {selectedProduct.CaseCount && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      <strong>Case Count:</strong> {selectedProduct.CaseCount}
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Price Section */}
                <Box sx={{ textAlign: 'right', py: 2 }}>
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
    </div>
  );
};

export default Products;
