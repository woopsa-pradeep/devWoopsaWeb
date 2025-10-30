import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card,
  CardMedia,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
 
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Fullscreen as ViewIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import CustomButton from '../../atoms/CustomButton';
import CommonTable from '../../atoms/Table/CommonTable';
import FileUploadInput from '../../atoms/FileUploadInput';
import DeleteConfirmationModal from '../../atoms/DeleteConfirmationModal';
import SelectInput from '../../atoms/SelectInput';
import TextInput from '../../atoms/TextInput';
import SwitchInput from '../../atoms/SwitchInput';
import { createWebView, getWebView, updateWebView, deleteWebView, createWebCategory, getAllWebCategories, deleteWebCategory, updateWebCategory, createWebPriceClass, getAllWebPriceClasses, deleteWebPriceClass, updateWebPriceClass, getProductListBySearch, associateProductsWithWebView, getProductsByWebView, createWebViewForSection, getQuickLinks, createQuickLink, updateQuickLink, deleteQuickLink, createLocation, getAllLocations, updateLocation, deleteLocation } from '../../../redux/apis/distrubutor/promoApis';
import { getSalesCategoryList, getPriceClassList } from '../../../redux/apis/distrubutor/listApis';
import { toast } from 'react-hot-toast';

interface WebViewImage {
  id: number;
  section: 'header' | 'middle' | 'bottom';
  image_url: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: any[];
  productArray?: number[];
}

interface SectionData {
  title: string;
  sectionKey: 'header' | 'middle' | 'bottom';
  images: WebViewImage[];
}

interface Category {
  id: number;
  categoryId: number;
  name: string;
  image?: string;
}

interface PriceClass {
  id: number;
  priceClassId: number;
  name: string;
  image?: string;
}

interface SalesCategory {
  Sales_Category: number;
  Category_Desc: string;
}

interface PriceClassItem {
  Price_Class: number;
  Class_Desc: string;
}

interface Product {
  Item_Number: number;
  Description: string;
  AltDesc: string;
}

interface QuickLink {
  id: number;
  name: string;
  link: string;
  status?: boolean;
  showInWeb?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webview-tabpanel-${index}`}
      aria-labelledby={`webview-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const WebView: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sections, setSections] = useState<SectionData[]>([
    {
      title: 'Header Images',
      sectionKey: 'header',
      images: []
    },
    {
      title: 'Middle Banner',
      sectionKey: 'middle',
      images: []
    },
    {
      title: 'Bottom Banner',
      sectionKey: 'bottom',
      images: []
    }
  ]);
  
  // Categories and Price Classes state
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceClasses, setPriceClasses] = useState<PriceClass[]>([]);
  const [salesCategories, setSalesCategories] = useState<SalesCategory[]>([]);
  const [priceClassList, setPriceClassList] = useState<PriceClassItem[]>([]);
  
  // Quick Links state
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  
  // Modal states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [priceClassModalOpen, setPriceClassModalOpen] = useState(false);
  const [quickLinkModalOpen, setQuickLinkModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedPriceClass, setSelectedPriceClass] = useState<number | ''>('');
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [priceClassImage, setPriceClassImage] = useState<File | null>(null);
  
  // Quick Link modal states
  const [quickLinkName, setQuickLinkName] = useState('');
  const [quickLinkUrl, setQuickLinkUrl] = useState('');
  
  // Update mode states
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isUpdatingPriceClass, setIsUpdatingPriceClass] = useState(false);
  const [isUpdatingQuickLink, setIsUpdatingQuickLink] = useState(false);
  const [updateCategoryId, setUpdateCategoryId] = useState<number | null>(null);
  const [updatePriceClassId, setUpdatePriceClassId] = useState<number | null>(null);
  const [updateQuickLinkId, setUpdateQuickLinkId] = useState<number | null>(null);
  
  // Delete confirmation states
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [deletePriceClassModalOpen, setDeletePriceClassModalOpen] = useState(false);
  const [deleteQuickLinkModalOpen, setDeleteQuickLinkModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [priceClassToDelete, setPriceClassToDelete] = useState<PriceClass | null>(null);
  const [quickLinkToDelete, setQuickLinkToDelete] = useState<QuickLink | null>(null);
  
  // Status change confirmation modal states
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [quickLinkToUpdateStatus, setQuickLinkToUpdateStatus] = useState<QuickLink | null>(null);
  const [newStatus, setNewStatus] = useState<boolean>(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  // ShowInWeb change confirmation modal states
  const [showInWebChangeModalOpen, setShowInWebChangeModalOpen] = useState(false);
  const [quickLinkToUpdateShowInWeb, setQuickLinkToUpdateShowInWeb] = useState<QuickLink | null>(null);
  const [newShowInWeb, setNewShowInWeb] = useState<boolean>(false);
  const [showInWebUpdateLoading, setShowInWebUpdateLoading] = useState(false);
  
  // Location state
  const [location, setLocation] = useState({
    latitude: '',
    longitude: ''
  });
  const [locationId, setLocationId] = useState<number | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [tempLocation, setTempLocation] = useState({
    latitude: '',
    longitude: ''
  });
  
  // Product modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedWebViewImage, setSelectedWebViewImage] = useState<WebViewImage | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [productSubmitLoading, setProductSubmitLoading] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  
  // View modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBannerData, setSelectedBannerData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [priceClassesLoading, setPriceClassesLoading] = useState(false);
  const [quickLinksLoading, setQuickLinksLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<{ sectionIndex: number; imageIndex?: number } | null>(null);
  
  // API operation loading states
  const [categorySubmitLoading, setCategorySubmitLoading] = useState(false);
  const [priceClassSubmitLoading, setPriceClassSubmitLoading] = useState(false);
  const [quickLinkSubmitLoading, setQuickLinkSubmitLoading] = useState(false);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false);
  const [deletePriceClassLoading, setDeletePriceClassLoading] = useState(false);
  const [deleteQuickLinkLoading, setDeleteQuickLinkLoading] = useState(false);
  const [salesCategoriesLoading, setSalesCategoriesLoading] = useState(false);
  const [priceClassListLoading, setPriceClassListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [selectedImageToDelete, setSelectedImageToDelete] = useState<{ sectionIndex: number; imageIndex: number } | null>(null);
  const [sectionPages, setSectionPages] = useState<{ [key: string]: number }>({
    header: 0,
    middle: 0,
    bottom: 0
  });
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Pagination data from API
  const [categoriesPagination, setCategoriesPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [priceClassesPagination, setPriceClassesPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Fetch web view images on component mount
  useEffect(() => {
    fetchWebViewImages();
  }, []);

  // Fetch data only when specific tabs are active
  useEffect(() => {
    if (tabValue === 1) {
      fetchSalesCategories();
      fetchWebCategories();
    }
  }, [tabValue]);

  useEffect(() => {
    if (tabValue === 2) {
      fetchPriceClassList();
      fetchWebPriceClasses();
    }
  }, [tabValue]);

  useEffect(() => {
    if (tabValue === 3) {
      fetchQuickLinks();
    }
  }, [tabValue]);

  useEffect(() => {
    if (tabValue === 4) {
      fetchLocation();
    }
  }, [tabValue]);

  // Debounced product search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productSearchQuery.length >= 2) {
        searchProducts(productSearchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [productSearchQuery]);

  const fetchWebViewImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await getWebView();
      
      // Handle different response structures
      let webViewImages: WebViewImage[] = [];
      
      if (response?.data?.webViews && Array.isArray(response.data.webViews)) {
        webViewImages = response.data.webViews;
      } else if (response?.webViews && Array.isArray(response.webViews)) {
        webViewImages = response.webViews;
      } else if (Array.isArray(response?.data)) {
        webViewImages = response.data;
      } else if (Array.isArray(response)) {
        webViewImages = response;
      } else {
        console.warn('Unexpected response structure:', response);
        webViewImages = [];
      }
      
      // Safety check to ensure sections is valid
      if (!sections || !Array.isArray(sections)) {
        console.error('Invalid sections state in fetchWebViewImages:', sections);
        setError('Invalid sections configuration');
        return;
      }
      
      // For banner sections (middle and bottom), fetch associated products for each image
      const enhancedWebViewImages = await Promise.all(
        webViewImages.map(async (image) => {
          if (image.section === 'middle' || image.section === 'bottom') {
            try {
              const productsResponse: any = await getProductsByWebView(image.id.toString());
              let products: any[] = [];
              
              if (productsResponse?.data?.data && Array.isArray(productsResponse.data.data)) {
                products = productsResponse.data.data;
              } else if (productsResponse?.data && Array.isArray(productsResponse.data)) {
                products = productsResponse.data;
              } else if (productsResponse?.products && Array.isArray(productsResponse.products)) {
                products = productsResponse.products;
              } else if (Array.isArray(productsResponse)) {
                products = productsResponse;
              }
              
              return {
                ...image,
                products: products,
                productArray: products.map((p: any) => p.Item_Number)
              };
            } catch (err) {
              console.error(`Error fetching products for image ${image.id}:`, err);
              return image;
            }
          }
          return image;
        })
      );
      
      // Group images by section
      const groupedImages = sections.map(section => {
        if (!section || !section.sectionKey) {
          console.error('Invalid section found in fetchWebViewImages:', section);
          return {
            title: 'Unknown Section',
            sectionKey: 'header' as const,
            images: []
          };
        }
        
        return {
          ...section,
          images: Array.isArray(enhancedWebViewImages) ? enhancedWebViewImages
            .filter((img: WebViewImage) => img.section === section.sectionKey && img.isActive)
            .sort((a: WebViewImage, b: WebViewImage) => a.order - b.order) : []
        };
      });
      
      setSections(groupedImages);
    } catch (err: any) {
      console.error('Error fetching web view images:', err);
      setError(err.response?.data?.message || 'Failed to fetch web view images');
      toast.error('Failed to fetch web view images');
    } finally {
      setLoading(false);
    }
  }, [sections]);

  const fetchSalesCategories = async () => {
    setSalesCategoriesLoading(true);
    try {
      const response: any = await getSalesCategoryList();
      setSalesCategories(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching sales categories:', err);
      setSalesCategories([]);
    } finally {
      setSalesCategoriesLoading(false);
    }
  };

  const fetchPriceClassList = async () => {
    setPriceClassListLoading(true);
    try {
      const response: any = await getPriceClassList();
      setPriceClassList(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching price class list:', err);
      setPriceClassList([]);
    } finally {
      setPriceClassListLoading(false);
    }
  };

  const fetchWebCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response: any = await getAllWebCategories(categoriesPagination.page, categoriesPagination.limit);
      // Handle the actual API response structure
      if (response?.data?.data?.webCategories) {
        setCategories(response.data.data.webCategories);
        setCategoriesPagination(response.data.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });
      } else if (response?.data?.webCategories) {
        setCategories(response.data.webCategories);
        setCategoriesPagination(response.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });
      } else {
        setCategories([]);
        setCategoriesPagination({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });
      }
    } catch (err) {
      console.error('Error fetching web categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchWebPriceClasses = async () => {
    setPriceClassesLoading(true);
    try {
      const response: any = await getAllWebPriceClasses(priceClassesPagination.page, priceClassesPagination.limit);
      // Handle the actual API response structure
      if (response?.data?.data?.webPriceClasses) {
        setPriceClasses(response.data.data.webPriceClasses);
        setPriceClassesPagination(response.data.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });
      } else if (response?.data?.webPriceClasses) {
        setPriceClasses(response.data.webPriceClasses);
        setPriceClassesPagination(response.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });
      } else {
        setPriceClasses([]);
        setPriceClassesPagination({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });
      }
    } catch (err) {
      console.error('Error fetching web price classes:', err);
      setPriceClasses([]);
    } finally {
      setPriceClassesLoading(false);
    }
  };

  const fetchQuickLinks = async () => {
    setQuickLinksLoading(true);
    try {
      const response: any = await getQuickLinks();
      setQuickLinks(response?.data?.data || response?.data || []);
    } catch (err) {
      console.error('Error fetching quick links:', err);
      setQuickLinks([]);
    } finally {
      setQuickLinksLoading(false);
    }
  };

  const fetchLocation = async () => {
    try {
      const response: any = await getAllLocations();
      
      // Parse the response structure based on the actual API response
      let locations = [];
      if (response?.data?.data?.data) {
        locations = response.data.data.data;
      } else if (response?.data?.data) {
        locations = response.data.data;
      } else if (Array.isArray(response?.data)) {
        locations = response.data;
      } else if (Array.isArray(response)) {
        locations = response;
      }
      
      // Use the first location if available
      if (locations && locations.length > 0) {
        const firstLocation = locations[0];
        setLocationId(firstLocation.id || null);
        setLocation({
          latitude: firstLocation.latitude || '',
          longitude: firstLocation.longitude || ''
        });
        setTempLocation({
          latitude: firstLocation.latitude || '',
          longitude: firstLocation.longitude || ''
        });
      } else {
        // Reset location data if no locations found
        setLocationId(null);
        setLocation({
          latitude: '',
          longitude: ''
        });
        setTempLocation({
          latitude: '',
          longitude: ''
        });
      }
    } catch (err) {
      console.error('Error fetching location:', err);
      // Don't show error toast for location as it might not exist yet
    }
  };



  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response: any = await getProductListBySearch({ search: query });
      const products = response?.data?.data || response?.data || [];
      setSearchResults(products);
    } catch (err) {
      console.error('Error searching products:', err);
      setSearchResults([]);
      toast.error('Failed to search products');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Category modal handlers
  const handleCategoryModalOpen = (category?: Category) => {
    setCategoryModalOpen(true);
    if (category) {
      // Update mode
      setIsUpdatingCategory(true);
      setUpdateCategoryId(category.id);
      setSelectedCategory(category.categoryId);
      setCategoryImage(null); // Reset image for update mode
    } else {
      // Add mode - reset all update states
      setIsUpdatingCategory(false);
      setUpdateCategoryId(null);
      setSelectedCategory('');
      setCategoryImage(null);
    }
  };

  const handleCategoryModalClose = () => {
    setCategoryModalOpen(false);
    setSelectedCategory('');
    setCategoryImage(null);
    setIsUpdatingCategory(false);
    setUpdateCategoryId(null);
  };

  const handleCategorySubmit = async () => {
    if (!selectedCategory || (!categoryImage && !isUpdatingCategory)) {
      toast.error('Please select a category and upload an image');
      return;
    }

    setCategorySubmitLoading(true);
    try {
      const selectedCat = salesCategories.find(cat => cat.Sales_Category == selectedCategory);
       const formData = new FormData();
      
      if (categoryImage) {
        formData.append('image', categoryImage);
      }
      formData.append('categoryId', selectedCategory.toString());
      formData.append('name', selectedCat?.Category_Desc || 'Unknown');
      
      if (isUpdatingCategory && updateCategoryId) {
        // Update existing category
        await updateWebCategory(updateCategoryId.toString(), formData);
        toast.success('Category image updated successfully');
      } else {
        // Create new category
        await createWebCategory(formData);
        toast.success('Category image added successfully');
      }
      
      handleCategoryModalClose();
      // Refresh the categories
      await fetchWebCategories();
    } catch (err: any) {
      console.error('Error saving category image:', err);
      toast.error(err.response?.data?.message || 'Failed to save category image');
    } finally {
      setCategorySubmitLoading(false);
    }
  };

  // Price Class modal handlers
  const handlePriceClassModalOpen = (priceClass?: PriceClass) => {
    setPriceClassModalOpen(true);
    if (priceClass) {
      // Update mode
      setIsUpdatingPriceClass(true);
      setUpdatePriceClassId(priceClass.id);
      setSelectedPriceClass(priceClass.priceClassId);
      setPriceClassImage(null); // Reset image for update mode
    } else {
      // Add mode - reset all update states
      setIsUpdatingPriceClass(false);
      setUpdatePriceClassId(null);
      setSelectedPriceClass('');
      setPriceClassImage(null);
    }
  };

  const handlePriceClassModalClose = () => {
    setPriceClassModalOpen(false);
    setSelectedPriceClass('');
    setPriceClassImage(null);
    setIsUpdatingPriceClass(false);
    setUpdatePriceClassId(null);
  };

  const handlePriceClassSubmit = async () => {
    if (!selectedPriceClass || (!priceClassImage && !isUpdatingPriceClass)) {
      toast.error('Please select a price class and upload an image');
      return;
    }

    setPriceClassSubmitLoading(true);
    try {
      const selectedPriceClassItem = priceClassList.find(pc => pc.Price_Class == selectedPriceClass);
      const formData = new FormData();
      if (priceClassImage) {
        formData.append('image', priceClassImage);
      }
      formData.append('priceClassId', selectedPriceClass.toString());
      formData.append('name', selectedPriceClassItem?.Class_Desc || 'Unknown');
      
      if (isUpdatingPriceClass && updatePriceClassId) {
        // Update existing price class
        await updateWebPriceClass(updatePriceClassId.toString(), formData);
        toast.success('Price class image updated successfully');
      } else {
        // Create new price class
        await createWebPriceClass(formData);
        toast.success('Price class image added successfully');
      }
      
      handlePriceClassModalClose();
      // Refresh the price classes
      await fetchWebPriceClasses();
    } catch (err: any) {
      console.error('Error saving price class image:', err);
      toast.error(err.response?.data?.message || 'Failed to save price class image');
    } finally {
      setPriceClassSubmitLoading(false);
    }
  };

  // Quick Link modal handlers
  const handleQuickLinkModalOpen = (quickLink?: QuickLink) => {
    setQuickLinkModalOpen(true);
    if (quickLink) {
      // Update mode
      setIsUpdatingQuickLink(true);
      setUpdateQuickLinkId(quickLink.id);
      setQuickLinkName(quickLink.name);
      setQuickLinkUrl(quickLink.link);
      setQuickLinkToUpdateStatus(quickLink); // Set the full quick link object for status handling
    } else {
      // Add mode - reset all update states
      setIsUpdatingQuickLink(false);
      setUpdateQuickLinkId(null);
      setQuickLinkName('');
      setQuickLinkUrl('');
      setQuickLinkToUpdateStatus(null);
    }
  };

  const handleQuickLinkModalClose = () => {
    setQuickLinkModalOpen(false);
    setQuickLinkName('');
    setQuickLinkUrl('');
    setIsUpdatingQuickLink(false);
    setUpdateQuickLinkId(null);
    setQuickLinkToUpdateStatus(null);
  };

  const handleQuickLinkSubmit = async () => {
    if (!quickLinkName.trim() || !quickLinkUrl.trim()) {
      toast.error('Please enter both name and link');
      return;
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(quickLinkUrl.trim())) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setQuickLinkSubmitLoading(true);
    try {
      if (isUpdatingQuickLink && updateQuickLinkId) {
        // Update existing quick link
        await updateQuickLink(updateQuickLinkId.toString(), {
          name: quickLinkName.trim(),
          link: quickLinkUrl.trim(),
          status: quickLinkToUpdateStatus?.status ?? true,
          showInWeb: quickLinkToUpdateStatus?.showInWeb ?? true
        });
        toast.success('Quick link updated successfully');
      } else {
        // Create new quick link
        await createQuickLink({
          name: quickLinkName.trim(),
          link: quickLinkUrl.trim(),
          status: true, // Default to active for new quick links
          showInWeb: true // Default to show in web for new quick links
        });
        toast.success('Quick link added successfully');
      }
      
      handleQuickLinkModalClose();
      // Refresh the quick links
      await fetchQuickLinks();
    } catch (err: any) {
      console.error('Error saving quick link:', err);
      toast.error(err.response?.data?.message || 'Failed to save quick link');
    } finally {
      setQuickLinkSubmitLoading(false);
    }
  };

  // Product modal handlers
  const handleProductModalOpen = async (image: WebViewImage) => {
    if (!image) {
      console.error('handleProductModalOpen called with null/undefined image');
      return;
    }
    
    setSelectedWebViewImage(image);
    setProductModalOpen(true);
    setProductSearchQuery('');
    setSearchResults([]);
    setNewImageFile(null);
    setProductModalLoading(true);
    
    // Load existing associated products for existing images
    if (image.id !== -1) {
      // First check if the image object already has products data
      if ((image as any).products && Array.isArray((image as any).products) && (image as any).products.length > 0) {
        setSelectedProducts((image as any).products);
        setProductModalLoading(false);
        return;
      }
      
      try {
        const response: any = await getProductsByWebView(image.id.toString());
        
        // Handle different response structures and extract products
        let existingProducts: Product[] = [];
        
        if (response?.data?.data && Array.isArray(response.data.data)) {
          existingProducts = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          existingProducts = response.data;
        } else if (response?.products && Array.isArray(response.products)) {
          existingProducts = response.products;
        } else if (Array.isArray(response)) {
          existingProducts = response;
        }
        
        // If no products found in API response, try to use the products from the image object itself
        if (existingProducts.length === 0 && (image as any).products && Array.isArray((image as any).products)) {
          existingProducts = (image as any).products;
        }
        
        setSelectedProducts(existingProducts);
      } catch (err) {
        console.error('Error loading associated products:', err);
        // Try to use products from the image object if API fails
        if ((image as any).products && Array.isArray((image as any).products)) {
          const fallbackProducts = (image as any).products;
          setSelectedProducts(fallbackProducts);
        } else {
          setSelectedProducts([]);
        }
      }
    } else {
      // For new images, start with empty products
      setSelectedProducts([]);
    }
    setProductModalLoading(false);
  };

  const handleProductModalClose = () => {
    setProductModalOpen(false);
    setSelectedWebViewImage(null);
    setProductSearchQuery('');
    setSearchResults([]);
    setSelectedProducts([]);
    setNewImageFile(null);
  };

  const handleProductSearch = (query: string) => {
    setProductSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
    }
  };

  const handleProductSelection = (product: Product) => {
    const isSelected = selectedProducts.some(p => p.Item_Number === product.Item_Number);
    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p.Item_Number !== product.Item_Number));
    } else {
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  const handleProductSubmit = async () => {
    if (!selectedWebViewImage) {
      toast.error('No banner selected');
      return;
    }
    
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    setProductSubmitLoading(true);
    try {
      // If this is a new image (temporary ID), create it with products
      if (selectedWebViewImage.id === -1) {
        if (!newImageFile) {
          toast.error('Please upload an image first');
          setProductSubmitLoading(false);
          return;
        }

        // Additional check to ensure only one image per section for middle and bottom
        const currentSection = sections.find(s => s.sectionKey === selectedWebViewImage.section);
        if (currentSection && currentSection.images.length > 0) {
          toast.error(`${currentSection.title} can only have one image`);
          setProductSubmitLoading(false);
          return;
        }

        await createWebViewForSection({
          image: newImageFile,
          section: selectedWebViewImage.section,
          productsList: selectedProducts.map(p => p.Item_Number)
        });
        
        toast.success('Banner created and products associated successfully');
        handleProductModalClose();
        
        // Refresh the images to show the new one
        await fetchWebViewImages();
        return;
      }

      // For existing images, update the products (replace existing ones)
      const productIds = selectedProducts.map(p => p.Item_Number);
      
      // If a new image is provided, update the image first
      if (newImageFile) {
        // Update the banner image
        await updateWebView(selectedWebViewImage.id.toString(), {
          image: newImageFile,
        });
      }
      
      // Update the products
      await associateProductsWithWebView(selectedWebViewImage.id.toString(), productIds);
      toast.success('Banner products updated successfully');
      handleProductModalClose();
      
      // Refresh the images to show updated data
      await fetchWebViewImages();
    } catch (err: any) {
      console.error('Error processing request:', err);
      toast.error(err.response?.data?.message || 'Failed to process request');
    } finally {
      setProductSubmitLoading(false);
    }
  };

  // View modal handlers
  const handleViewModalOpen = async (bannerData: any) => {
    
    // If the banner data already has products, use them directly
    if (bannerData.products && Array.isArray(bannerData.products)) {
      setSelectedBannerData(bannerData);
      setViewModalOpen(true);
      return;
    }
    
    // Otherwise, fetch the products if they're not available
    try {
      const response: any = await getProductsByWebView(bannerData.id.toString());
      const products = response?.data?.data || response?.data || [];
      
      // Create enhanced banner data with products
      const enhancedBannerData = {
        ...bannerData,
        products: products,
        productArray: products.map((p: any) => p.Item_Number)
      };
      
      setSelectedBannerData(enhancedBannerData);
      setViewModalOpen(true);
    } catch (err) {
      console.error('Error fetching banner products:', err);
      // Still open the modal with basic data if product fetch fails
      setSelectedBannerData(bannerData);
      setViewModalOpen(true);
    }
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedBannerData(null);
  };

  // Delete handlers for categories and price classes
  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteCategoryModalOpen(true);
  };

  const handleDeletePriceClass = (priceClass: PriceClass) => {
    setPriceClassToDelete(priceClass);
    setDeletePriceClassModalOpen(true);
  };

  const handleDeleteQuickLink = (quickLink: QuickLink) => {
    setQuickLinkToDelete(quickLink);
    setDeleteQuickLinkModalOpen(true);
  };

  const handleStatusChange = (quickLink: QuickLink, newStatus: boolean) => {
    setQuickLinkToUpdateStatus(quickLink);
    setNewStatus(newStatus);
    setStatusChangeModalOpen(true);
  };

  const handleShowInWebChange = (quickLink: QuickLink, newShowInWeb: boolean) => {
    setQuickLinkToUpdateShowInWeb(quickLink);
    setNewShowInWeb(newShowInWeb);
    setShowInWebChangeModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setDeleteCategoryLoading(true);
    try {
      await deleteWebCategory(categoryToDelete.id.toString());
      toast.success('Category image deleted successfully');
      await fetchWebCategories();
    } catch (err: any) {
      console.error('Error deleting category image:', err);
      toast.error(err.response?.data?.message || 'Failed to delete category image');
    } finally {
      setDeleteCategoryLoading(false);
      setCategoryToDelete(null);
    }
  };

  const confirmDeletePriceClass = async () => {
    if (!priceClassToDelete) return;
    
    setDeletePriceClassLoading(true);
    try {
      await deleteWebPriceClass(priceClassToDelete.id.toString());
      toast.success('Price class image deleted successfully');
      await fetchWebPriceClasses();
    } catch (err: any) {
      console.error('Error deleting price class image:', err);
      toast.error(err.response?.data?.message || 'Failed to delete price class image');
    } finally {
      setDeletePriceClassLoading(false);
      setPriceClassToDelete(null);
    }
  };

  const confirmDeleteQuickLink = async () => {
    if (!quickLinkToDelete) return;
    
    setDeleteQuickLinkLoading(true);
    try {
      await deleteQuickLink(quickLinkToDelete.id.toString());
      toast.success('Quick link deleted successfully');
      await fetchQuickLinks();
    } catch (err: any) {
      console.error('Error deleting quick link:', err);
      toast.error(err.response?.data?.message || 'Failed to delete quick link');
    } finally {
      setDeleteQuickLinkLoading(false);
      setQuickLinkToDelete(null);
    }
  };

  const confirmStatusChange = async () => {
    if (!quickLinkToUpdateStatus) return;
    
    setStatusUpdateLoading(true);
    try {
      await updateQuickLink(quickLinkToUpdateStatus.id.toString(), {
        name: quickLinkToUpdateStatus.name,
        link: quickLinkToUpdateStatus.link,
        status: newStatus
      });
      toast.success(`Quick link status updated to ${newStatus ? 'Active' : 'Inactive'}`);
      await fetchQuickLinks();
      setStatusChangeModalOpen(false);
      setQuickLinkToUpdateStatus(null);
    } catch (err: any) {
      console.error('Error updating quick link status:', err);
      toast.error(err.response?.data?.message || 'Failed to update quick link status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const confirmShowInWebChange = async () => {
    if (!quickLinkToUpdateShowInWeb) return;
    
    setShowInWebUpdateLoading(true);
    try {
      await updateQuickLink(quickLinkToUpdateShowInWeb.id.toString(), {
        name: quickLinkToUpdateShowInWeb.name,
        link: quickLinkToUpdateShowInWeb.link,
        status: quickLinkToUpdateShowInWeb.status,
        showInWeb: newShowInWeb
      });
      toast.success(`Quick link show in web updated to ${newShowInWeb ? 'Yes' : 'No'}`);
      await fetchQuickLinks();
      setShowInWebChangeModalOpen(false);
      setQuickLinkToUpdateShowInWeb(null);
    } catch (err: any) {
      console.error('Error updating quick link show in web:', err);
      toast.error(err.response?.data?.message || 'Failed to update quick link show in web');
    } finally {
      setShowInWebUpdateLoading(false);
    }
  };

  // Location handlers
  const handleLocationEdit = () => {
    setTempLocation({ ...location });
    setIsEditingLocation(true);
  };

  const handleLocationCancel = () => {
    setTempLocation({ ...location });
    setIsEditingLocation(false);
  };

  const handleLocationSave = async () => {
    // Basic validation
    if (!tempLocation.latitude.trim() || !tempLocation.longitude.trim()) {
      toast.error('Please enter both latitude and longitude');
      return;
    }

    // Validate latitude range (-90 to 90)
    const lat = parseFloat(tempLocation.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }

    // Validate longitude range (-180 to 180)
    const lng = parseFloat(tempLocation.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    setLocationLoading(true);
    try {
      // Call the API to save/update location based on whether locationId exists
      if (locationId) {
        // Update existing location
        await updateLocation(locationId.toString(), {
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude
        });
        toast.success('Location updated successfully');
      } else {
        // Create new location
        await createLocation({
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude
        });
        toast.success('Location created successfully');
      }
      
      // Update local state
      setLocation(tempLocation);
      setIsEditingLocation(false);
      
      // Refresh location data to get the updated/created location with ID
      await fetchLocation();
    } catch (err: any) {
      console.error('Error saving location:', err);
      toast.error(err.response?.data?.message || 'Failed to save location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationDelete = async () => {
    if (!locationId) {
      toast.error('No location to delete');
      return;
    }

    if (window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      setLocationLoading(true);
      try {
        await deleteLocation(locationId.toString());
        toast.success('Location deleted successfully');
        
        // Reset location data
        setLocationId(null);
        setLocation({
          latitude: '',
          longitude: ''
        });
        setTempLocation({
          latitude: '',
          longitude: ''
        });
        setIsEditingLocation(false);
      } catch (err: any) {
        console.error('Error deleting location:', err);
        toast.error(err.response?.data?.message || 'Failed to delete location');
      } finally {
        setLocationLoading(false);
      }
    }
  };

  const handleLocationChange = (field: 'latitude' | 'longitude', value: string) => {
    setTempLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Pagination handlers
  const handleCategoriesPageChange = async (page: number) => {
    const newPagination = { ...categoriesPagination, page };
    setCategoriesPagination(newPagination);
    await getAllWebCategories(page, newPagination.limit).then((response : any) => {
      if (response?.data?.data?.webCategories) {
        setCategories(response.data.data.webCategories);
        setCategoriesPagination(response.data.data.pagination || newPagination);
      }
    });
  };

  const handleCategoriesPageSizeChange = async (pageSize: number) => {
    const newPagination = { ...categoriesPagination, limit: pageSize, page: 1 };
    setCategoriesPagination(newPagination);
    await getAllWebCategories(1, pageSize).then((response : any) => {
      if (response?.data?.data?.webCategories) {
        setCategories(response.data.data.webCategories);
        setCategoriesPagination(response.data.data.pagination || newPagination);
      }
    });
  };

  const handlePriceClassesPageChange = async (page: number) => {
    const newPagination = { ...priceClassesPagination, page };
    setPriceClassesPagination(newPagination);
    await getAllWebPriceClasses(page, newPagination.limit).then((response : any) => {
      if (response?.data?.data?.webPriceClasses) {
        setPriceClasses(response.data.data.webPriceClasses);
        setPriceClassesPagination(response.data.data.pagination || newPagination);
      }
    });
  };

  const handlePriceClassesPageSizeChange = async (pageSize: number) => {
    const newPagination = { ...priceClassesPagination, limit: pageSize, page: 1 };
    setPriceClassesPagination(newPagination);
    await getAllWebPriceClasses(1, pageSize).then((response : any) => {
      if (response?.data?.data?.webPriceClasses) {
        setPriceClasses(response.data.data.webPriceClasses);
        setPriceClassesPagination(response.data.data.pagination || newPagination);
      }
    });
  };

  const handleUpload = async (sectionIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false; // API seems to handle one image at a time
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        await uploadImage(file, sectionIndex);
      }
    };
    
    input.click();
  };

  const handleProductSelectionForNewImage = async (sectionIndex: number) => {
    const section = sections[sectionIndex];
    
    // Safety check to ensure section is valid
    if (!section || !section.sectionKey) {
      console.error('Invalid section found in handleProductSelectionForNewImage:', section);
      toast.error('Invalid section selected');
      return;
    }
    
    // Prevent adding more than one image to middle or bottom sections
    if (section.images && section.images.length > 0) {
      toast.error(`${section.title} can only have one image`);
      return;
    }
    
    // Create a temporary image object to open the product modal
    const tempImage: WebViewImage = {
      id: -1, // Temporary ID
      section: section.sectionKey,
      image_url: '',
      order: section.images ? section.images.length : 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Open product selection modal
    await handleProductModalOpen(tempImage);
  };

  const uploadImage = async (file: File, sectionIndex: number) => {
    setUploadingImage({ sectionIndex });
    
    try {
      const section = sections[sectionIndex];
      
      // Create FormData with full payload
      
      
      await createWebView({
        image: file,
        section: section.sectionKey,
      });
      toast.success('Image uploaded successfully');
      
      // Refresh the images
      await fetchWebViewImages();
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleEdit = async (sectionIndex: number, imageIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        await updateImage(file, sectionIndex, imageIndex);
      }
    };
    
    input.click();
  };

  const updateImage = async (file: File, sectionIndex: number, imageIndex: number) => {
    setUploadingImage({ sectionIndex, imageIndex });
    
    try {
      const section = sections[sectionIndex];
      const image = section.images[imageIndex];
      
      // Create FormData with full payload
      
      
      await updateWebView(image.id.toString(), {
        image: file,
        section: section.sectionKey,
      });
      toast.success('Image updated successfully');
      
      // Refresh the images
      await fetchWebViewImages();
    } catch (err: any) {
      console.error('Error updating image:', err);
      toast.error(err.response?.data?.message || 'Failed to update image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDelete = async (sectionIndex: number, imageIndex: number) => {
    setSelectedImageToDelete({ sectionIndex, imageIndex });
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedImageToDelete) return;

    const { sectionIndex, imageIndex } = selectedImageToDelete;
    const section = sections[sectionIndex];
    const image = section.images[imageIndex];

    if (!image) return;

    setLoading(true);
    try {
      await deleteWebView(image.id.toString());
      toast.success('Image deleted successfully');
      setDeleteConfirmationOpen(false);
      setSelectedImageToDelete(null);
      // Refresh the images
      await fetchWebViewImages();
    } catch (err: any) {
      console.error('Error deleting image:', err);
      toast.error(err.response?.data?.message || 'Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setSelectedImageToDelete(null);
  };

  const handlePreviousPage = useCallback((sectionKey: string) => {
    setSectionPages(prev => ({
      ...prev,
      [sectionKey]: Math.max(0, prev[sectionKey] - 1)
    }));
  }, []);

  const handleNextPage = useCallback((sectionKey: string, totalImages: number) => {
    const maxPage = Math.ceil(totalImages / 4) - 1;
    setSectionPages(prev => ({
      ...prev,
      [sectionKey]: Math.min(maxPage, prev[sectionKey] + 1)
    }));
  }, []);

  // const handleView = useCallback((sectionIndex: number, imageIndex: number) => {
  //   const section = sections[sectionIndex];
  //   const image = section.images[imageIndex];
  //   if (image && image.image_url) {
  //     window.open(image.image_url, '_blank');
  //   }
  // }, [sections]);

  const handleImageLoad = useCallback((imageUrl: string) => {
    setLoadedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  const renderImageSlot = useCallback((image: WebViewImage | null, sectionIndex: number, imageIndex: number) => {
    const hasImage = image && image.image_url;
    const isUploading = uploadingImage?.sectionIndex === sectionIndex && uploadingImage?.imageIndex === imageIndex;
    const isUploadingNew = uploadingImage?.sectionIndex === sectionIndex && !uploadingImage?.imageIndex && !hasImage;
    const isImageLoaded = hasImage ? loadedImages.has(image.image_url) : false;
    
    return (
      <Card 
        key={image?.id || `empty-${sectionIndex}-${imageIndex}`}
        elevation={hasImage ? 2 : 0}
        sx={{ 
          width: '100%', 
          height: 180, 
          position: 'relative',
          border: hasImage ? '1px solid #e0e0e0' : '2px dashed #d0d0d0',
          backgroundColor: hasImage ? '#ffffff' : 'transparent',
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: hasImage ? 'translateY(-2px)' : 'none',
            boxShadow: hasImage ? 4 : 0,
            borderColor: hasImage ? '#1976d2' : '#bdbdbd'
          }
        }}
      >
        {isUploading || isUploadingNew ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2
          }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              {isUploading ? 'Updating image...' : 'Uploading image...'}
            </Typography>
          </Box>
        ) : hasImage ? (
          <>
            <CardMedia
              component="img"
              image={image.image_url}
              alt={`${sections[sectionIndex].title} Image ${imageIndex + 1}`}
              loading="lazy"
              onLoad={() => handleImageLoad(image.image_url)}
              sx={{ 
                height: '100%', 
                objectFit: 'contain',
                borderRadius: '8px 8px 0 0',
                opacity: isImageLoaded ? 1 : 0.7,
                transition: 'opacity 0.3s ease-in-out'
              }}
            />
            {/* Overlay action buttons */}
            <Box sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              display: 'flex',
              gap: 0.5
            }}>
              <IconButton
                size="small"
                onClick={() => handleEdit(sectionIndex, imageIndex)}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  color: '#1976d2',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,1)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(sectionIndex, imageIndex)}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  color: '#d32f2f',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,1)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#9e9e9e',
            gap: 1
          }}>
            <UploadIcon sx={{ fontSize: 32, opacity: 0.6 }} />
            <Typography variant="caption" sx={{ textAlign: 'center', px: 2 }}>
              Click Add to upload image
            </Typography>
          </Box>
        )}
        
        {/* Bottom action buttons */}
        <Box sx={{ 
          p: 1,
          display: 'flex', 
          gap: 0.5, 
          justifyContent: 'center',
          borderTop: hasImage ? '1px solid #f0f0f0' : 'none',
          backgroundColor: hasImage ? '#fafafa' : 'transparent'
        }}>
          <IconButton
            size="small"
            onClick={() => handleEdit(sectionIndex, imageIndex)}
            disabled={isUploading || isUploadingNew}
            sx={{ 
              color: '#666',
              '&:hover': { 
                color: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              },
              '&:disabled': {
                color: '#ccc'
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          
          {hasImage && (
            <IconButton
              size="small"
              onClick={() => {
               
                handleViewModalOpen(image);
              }}
              disabled={isUploading}
              sx={{ 
                color: '#ffffff',
                backgroundColor: '#2e7d32',
                border: '2px solid #2e7d32',
                minWidth: '32px',
                minHeight: '32px',
                '&:hover': { 
                  color: '#ffffff',
                  backgroundColor: '#1b5e20',
                  borderColor: '#1b5e20',
                  transform: 'scale(1.1)'
                },
                '&:disabled': {
                  color: '#ccc',
                  backgroundColor: '#ccc'
                }
              }}
              title="View Banner Details"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          )}
          
        
          
          {hasImage && (
            <IconButton
              size="small"
              onClick={() => handleDelete(sectionIndex, imageIndex)}
              disabled={isUploading || isUploadingNew}
              sx={{ 
                color: '#666',
                '&:hover': { 
                  color: '#d32f2f',
                  backgroundColor: 'rgba(211, 47, 47, 0.08)'
                },
                '&:disabled': {
                  color: '#ccc'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Card>
    );
  }, [uploadingImage, sections, loadedImages, handleImageLoad, handleViewModalOpen, handleProductModalOpen]);

  const renderImageGrid = useCallback((section: SectionData, sectionIndex: number) => {
    const currentPage = sectionPages[section.sectionKey];
    const imagesPerPage = 4;
    const startIndex = currentPage * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    
    // Get images for current page
    const pageImages = section.images.slice(startIndex, endIndex);
    
    // Create array of 4 slots, filling with actual images or null for empty slots
    const imageSlots = Array.from({ length: 4 }, (_, index) => 
      pageImages[index] || null
    );

    const hasMoreThan4Images = section.images.length > 4;
    const canGoPrevious = currentPage > 0;
    const canGoNext = endIndex < section.images.length;

    return (
      <Box sx={{ p: 3, position: 'relative' }}>
        {/* Navigation Arrows - Only show if more than 4 images */}
        {hasMoreThan4Images && (
          <>
            {/* Left Arrow */}
            {canGoPrevious && (
              <IconButton
                onClick={() => handlePreviousPage(section.sectionKey)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #e0e0e0',
                  zIndex: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: 2
                  }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
            )}
            
            {/* Right Arrow */}
            {canGoNext && (
              <IconButton
                onClick={() => handleNextPage(section.sectionKey, section.images.length)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #e0e0e0',
                  zIndex: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: 2
                  }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            )}
          </>
        )}

        {/* Page Indicator */}
        {hasMoreThan4Images && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2,
            gap: 1
          }}>
            {Array.from({ length: Math.ceil(section.images.length / 4) }, (_, pageIndex) => (
              <Box
                key={pageIndex}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: pageIndex === currentPage ? 'primary.main' : 'grey.300',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: pageIndex === currentPage ? 'primary.dark' : 'grey.400'
                  }
                }}
                onClick={() => setSectionPages(prev => ({
                  ...prev,
                  [section.sectionKey]: pageIndex
                }))}
              />
            ))}
          </Box>
        )}

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
          gap: 3 
        }}>
          {imageSlots.map((image, imageIndex) => (
            <Box key={image?.id || `slot-${sectionIndex}-${imageIndex}`}>
              {renderImageSlot(image, sectionIndex, startIndex + imageIndex)}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }, [sectionPages, handlePreviousPage, handleNextPage, renderImageSlot]);

  // Render banner section (middle and bottom) with single image display
  const renderBannerSection = useCallback((section: SectionData, sectionIndex: number) => {
    const image = section.images[0] || null; // Only one image allowed
    const isUploading = uploadingImage?.sectionIndex === sectionIndex;
    // Safety check to ensure we have a valid section
    if (!section) {
      console.error('renderBannerSection called with invalid section');
      return null;
    }
    
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Card 
            elevation={image ? 3 : 1}
            sx={{ 
              width: '100%', 
              maxWidth: 800,
              minHeight: 400,
              position: 'relative',
              border: image ? '1px solid #e0e0e0' : '2px dashed #d0d0d0',
              backgroundColor: image ? '#ffffff' : '#fafafa',
              borderRadius: 3,
              transition: 'all 0.3s ease-in-out',
              overflow: 'hidden',
              '&:hover': {
                transform: image ? 'translateY(-4px)' : 'none',
                boxShadow: image ? 8 : 2,
                borderColor: image ? '#1976d2' : '#bdbdbd'
              }
            }}
          >
            {isUploading ? (
              <Box sx={{ 
                height: 400, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 2
              }}>
                <CircularProgress size={50} />
                <Typography variant="h6" color="text.secondary">
                  Uploading banner...
                </Typography>
              </Box>
            ) : image ? (
              <>
                {/* Banner Image */}
                <Box sx={{ 
                  position: 'relative',
                  height: 320,
                  backgroundColor: '#f8f9fa'
                }}>
                  <CardMedia
                    component="img"
                    image={image.image_url}
                    alt={`${section.title} Banner`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(image.image_url)}
                    sx={{ 
                      height: '100%', 
                      width: '100%',
                      objectFit: 'contain',
                      transition: 'all 0.3s ease-in-out'
                    }}
                  />
                  
                  {/* Overlay with gradient */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 2
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 600,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      {section.title}
                    </Typography>
                  </Box>
                </Box>

                {/* Banner Info and Actions */}
                <Box sx={{ 
                  p: 3,
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  {/* Banner Details */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Banner ID: {image.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(image.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                   
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <IconButton
                      size="medium"
                      onClick={() => handleProductModalOpen(image)}
                      disabled={isUploading}
                      sx={{ 
                        color: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                        '&:hover': { 
                          color: '#1976d2',
                          backgroundColor: 'rgba(25, 118, 210, 0.15)',
                          borderColor: 'rgba(25, 118, 210, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          color: '#ccc',
                          backgroundColor: '#f5f5f5'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="Edit Banner & Products"
                    >
                      <EditIcon fontSize="medium" />
                    </IconButton>
                    
                    <IconButton
                      size="medium"
                      onClick={() => {
                        handleViewModalOpen(image);
                      }}
                      disabled={isUploading}
                      sx={{ 
                        color: '#2e7d32',
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                        border: '1px solid rgba(46, 125, 50, 0.2)',
                        '&:hover': { 
                          color: '#2e7d32',
                          backgroundColor: 'rgba(46, 125, 50, 0.15)',
                          borderColor: 'rgba(46, 125, 50, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          color: '#ccc',
                          backgroundColor: '#f5f5f5'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="View Banner Details"
                    >
                      <ViewIcon fontSize="medium" />
                    </IconButton>
                    
                    <IconButton
                      size="medium"
                      onClick={() => handleDelete(sectionIndex, 0)}
                      disabled={isUploading}
                      sx={{ 
                        color: '#d32f2f',
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                        border: '1px solid rgba(211, 47, 47, 0.2)',
                        '&:hover': { 
                          color: '#d32f2f',
                          backgroundColor: 'rgba(211, 47, 47, 0.15)',
                          borderColor: 'rgba(211, 47, 47, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          color: '#ccc',
                          backgroundColor: '#f5f5f5'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="Delete Banner"
                    >
                      <DeleteIcon fontSize="medium" />
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                height: 400, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#9e9e9e',
                gap: 3,
                p: 4
              }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}>
                  <UploadIcon sx={{ fontSize: 40, opacity: 0.6 }} />
                </Box>
                <Typography variant="h5" sx={{ textAlign: 'center', opacity: 0.8, fontWeight: 500 }}>
                  No Banner Created
                </Typography>
                <Typography variant="body1" sx={{ textAlign: 'center', opacity: 0.6, maxWidth: 400 }}>
                  Click "Create Banner" to upload a banner image and associate it with products
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      </Box>
    );
  }, [uploadingImage, loadedImages, handleImageLoad, handleEdit, handleDelete, handleViewModalOpen, handleProductModalOpen]);

  // Memoize sections to prevent unnecessary re-renders
  const memoizedSections = useMemo(() => sections, [sections]);

  // Render categories table
  const renderCategoriesTable = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="text.primary" fontSize={14} fontWeight={400}>Categories</Typography>
        <CustomButton
          appearance="filled"
          onClick={() => handleCategoryModalOpen()}
          icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
          size="small"
          sx={{mt:0}}
          fullWidth={false}
        >
          Add
        </CustomButton>
      </Box>
      
      {categoriesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
                 <CommonTable
           data={categories}
           padding={0}
           columns={[
             { 
               id: 'image', 
               label: 'Image', 
               minWidth: 80, 
               render: (row: any) => (
                 row.image ? (
                   <Box
                     component="img"
                     src={row.image}
                     alt={row.name}
                     sx={{ 
                       width: 45, 
                       height: 45, 
                       objectFit: 'contain', 
                       borderRadius: 0.5,
                       border: '1px solid #e0e0e0'
                     }}
                   />
                 ) : (
                   <Typography 
                     color="text.secondary" 
                     fontSize="12px"
                     sx={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center',
                       height: 45,
                       backgroundColor: '#f5f5f5',
                       borderRadius: 0.5,
                       border: '1px dashed #ccc'
                     }}
                   >
                     No image
                   </Typography>
                 )
               )
             },
             { id: 'categoryId', label: 'Category ID', minWidth: 120 },
             { id: 'name', label: 'Name', minWidth: 180 },
             { 
               id: 'actions', 
               label: 'Actions', 
               minWidth: 160, 
               align: 'right',
               render: (row: any) => (
                 <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                   <IconButton
                     size="small"
                     onClick={() => window.open(row.image, '_blank')}
                     disabled={!row.image}
                     sx={{ padding: '4px' }}
                   >
                     <ViewIcon fontSize="small" />
                   </IconButton>
                   <IconButton 
                     size="small"
                     onClick={() => handleCategoryModalOpen(row)}
                     sx={{ padding: '4px' }}
                   >
                     <EditIcon fontSize="small" />
                   </IconButton>
                   <IconButton
                     size="small"
                     onClick={() => handleDeleteCategory(row)}
                     sx={{ padding: '4px' }}
                   >
                     <DeleteIcon fontSize="small" color="error"/>
                   </IconButton>
                 </Box>
               )
             }
           ]}
           currentPage={categoriesPagination.page}
           totalPages={categoriesPagination.totalPages}
           totalItems={categoriesPagination.total}
           pageSize={categoriesPagination.limit}
           onPageChange={handleCategoriesPageChange}
           onPageSizeChange={handleCategoriesPageSizeChange}
           loading={categoriesLoading}
           cellStyle={{ padding: '8px 12px' }}
           headerStyle={{ padding: '8px 12px' }}
         />
      )}
    </Box>
  );

  // Render price classes table
  const renderPriceClassesTable = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="text.primary" fontSize={14} fontWeight={400}>Price Classes</Typography>
        <CustomButton
          appearance="filled"
          onClick={() => handlePriceClassModalOpen()}
          icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
          size="small"
          sx={{mt:0}}
          fullWidth={false}
        >
          Add
        </CustomButton>
      </Box>
      
      {priceClassesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <CommonTable
          data={priceClasses}
          padding={0}
          columns={[
            { 
              id: 'image', 
              label: 'Image', 
              minWidth: 80, 
              render: (row: any) => (
                row.image ? (
                  <Box
                    component="img"
                    src={row.image}
                    alt={row.name}
                    sx={{ 
                      width: 45, 
                      height: 45, 
                      objectFit: 'contain', 
                      borderRadius: 0.5,
                      border: '1px solid #e0e0e0'
                    }}
                  />
                ) : (
                  <Typography 
                    color="text.secondary" 
                    fontSize="12px"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: 45,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 0.5,
                      border: '1px dashed #ccc'
                    }}
                  >
                    No image
                  </Typography>
                )
              )
            },
            { id: 'priceClassId', label: 'Price Class ID', minWidth: 120 },
            { id: 'name', label: 'Name', minWidth: 180 },
            { 
              id: 'actions', 
              label: 'Actions', 
              minWidth: 160,  
              align: 'right',
              render: (row: any) => (
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    onClick={() => window.open(row.image, '_blank')}
                    disabled={!row.image}
                    sx={{ padding: '4px' }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handlePriceClassModalOpen(row)}
                    sx={{ padding: '4px' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeletePriceClass(row)}
                    sx={{ padding: '4px' }}
                  >
                    <DeleteIcon fontSize="small" color="error"/>
                  </IconButton>
                </Box>
              )
            }
          ]}
          currentPage={priceClassesPagination.page}
          totalPages={priceClassesPagination.totalPages}
          totalItems={priceClassesPagination.total}
          pageSize={priceClassesPagination.limit}
          onPageChange={handlePriceClassesPageChange}
          onPageSizeChange={handlePriceClassesPageSizeChange}
          loading={priceClassesLoading}
          cellStyle={{ padding: '8px 12px' }}
          headerStyle={{ padding: '8px 12px' }}
        />
      )}
    </Box>
  );

  // Render quick links table
  const renderQuickLinksTable = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="text.primary" fontSize={14} fontWeight={400}>Quick Links</Typography>
        <CustomButton
          appearance="filled"
          onClick={() => handleQuickLinkModalOpen()}
          icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
          size="small"
          sx={{mt:0}}
          fullWidth={false}
        >
          Add
        </CustomButton>
      </Box>
      
      {quickLinksLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <CommonTable
          data={quickLinks}
          padding={0}
          columns={[
            { id: 'name', label: 'Name', minWidth: 200 },
            { 
              id: 'link', 
              label: 'Link', 
              minWidth: 300,
              render: (row: any) => (
                <Box sx={{ 
                  maxWidth: 300, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <Typography variant="body2" sx={{ color: 'primary.main' }}>
                    {row.link}
                  </Typography>
                </Box>
              )
            },
            { 
              id: 'status', 
              label: 'Status', 
              minWidth: 120,
              render: (row: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SwitchInput
                    checked={row.status || false}
                    onChange={(checked: boolean) => handleStatusChange(row, checked)}
                    size="small"
                    sx={{ mb: 0 }}
            isShowLabel={false}
                  />
                  {/* <Typography variant="caption" color="text.secondary">
                    {row.status ? 'Active' : 'Inactive'}
                  </Typography> */}
                </Box>
              )
            },
            { 
              id: 'showInWeb', 
              label: 'Show In Web', 
              minWidth: 120,
              render: (row: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SwitchInput
                    checked={row.showInWeb || false}
                    onChange={(checked: boolean) => handleShowInWebChange(row, checked)}
                    size="small"
                    sx={{ mb: 0 }}
            isShowLabel={false}
                  />
                  {/* <Typography variant="caption" color="text.secondary">
                    {row.showInWeb ? 'Yes' : 'No'}
                  </Typography> */}
                </Box>
              )
            },
            { 
              id: 'createdAt', 
              label: 'Created', 
              minWidth: 120,
              render: (row: any) => (
                <Typography variant="body2" color="text.secondary">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              )
            },
            { 
              id: 'actions', 
              label: 'Actions', 
              minWidth: 160,  
              align: 'right',
              render: (row: any) => (
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    onClick={() => window.open(row.link, '_blank')}
                    sx={{ padding: '4px' }}
                    title="Open Link"
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => handleQuickLinkModalOpen(row)}
                    sx={{ padding: '4px' }}
                    title="Edit Quick Link"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteQuickLink(row)}
                    sx={{ padding: '4px' }}
                    title="Delete Quick Link"
                  >
                    <DeleteIcon fontSize="small" color="error"/>
                  </IconButton>
                </Box>
              )
            }
          ]}
          currentPage={1}
          totalPages={1}
          totalItems={quickLinks.length}
          pageSize={10}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          loading={quickLinksLoading}
          cellStyle={{ padding: '8px 12px' }}
          headerStyle={{ padding: '8px 12px' }}
        />
      )}
    </Box>
  );

  if (loading && sections.every(section => section.images.length === 0)) {
    return (
      <Box sx={{ p: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}>
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
          
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="web view tabs">
          <Tab label="Product Images" />
          <Tab label="Sales Categories" />
          <Tab label="Price Classes" />
          <Tab label="Quick Links" />
          <Tab label="Location" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Product Images Tab */}
        {memoizedSections && memoizedSections.length > 0 ? memoizedSections.map((section, sectionIndex) => {
          // Safety check to ensure section is valid
          if (!section || !section.sectionKey) {
            console.error('Invalid section found:', section);
            return null;
          }
          
          return (
            <Paper 
              key={section.title || `section-${sectionIndex}`} 
              elevation={1}
              sx={{ 
                mb: 4, 
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Section Header */}
              <Box sx={{ 
                py: 1, 
                px: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: 'transparent',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <Typography 
                  fontSize={14} 
                  fontWeight={400} 
                  color="text.primary" 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {section.title || 'Untitled Section'}
                </Typography>
                 
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Show Add Image button only for header images */}
                  {section.sectionKey === 'header' && (
                    <CustomButton
                      appearance="filled"
                      onClick={() => handleUpload(sectionIndex)}
                      icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
                      size="small"
                      fullWidth={false}
                      sx={{ mt: 0 }}
                      disabled={loading || (uploadingImage?.sectionIndex === sectionIndex)}
                    >
                      {uploadingImage?.sectionIndex === sectionIndex && !uploadingImage?.imageIndex ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          Uploading...
                        </>
                      ) : (
                        'Add'
                      )}
                    </CustomButton>
                  )}
                  
                  {/* Show Select Products button for banner sections only if they have no images */}
                  {(section.sectionKey === 'middle' || section.sectionKey === 'bottom') && section.images && section.images.length === 0 && (
                    <CustomButton
                      appearance="filled"
                      onClick={() => handleProductSelectionForNewImage(sectionIndex)}
                      size="small"
                      fullWidth={false}
                      sx={{ mt: 0 }}
                      disabled={loading}
                    >
                      Create Banner
                    </CustomButton>
                  )}
                </Box>
              </Box>
              
              {/* Image Grid */}
              {section.sectionKey === 'header' ? renderImageGrid(section, sectionIndex) : renderBannerSection(section, sectionIndex)}
            </Paper>
          );
        }) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No sections available
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Categories Tab */}
        {renderCategoriesTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Sub Categories Tab */}
        {renderPriceClassesTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Quick Links Tab */}
        {renderQuickLinksTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {/* Location Tab */}
        <Box sx={{ p: 3 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3 
            }}>
              <Typography variant="h6" color="text.primary" fontSize={16} fontWeight={500}>
                Location Settings
              </Typography>
             {!isEditingLocation && (
               <Box sx={{ display: 'flex', gap: 1 }}>
                 <CustomButton
                   appearance="filled"
                   onClick={handleLocationEdit}
                   icon={<EditIcon fontSize='small' sx={{fontSize:16}}/>}
                   size="small"
                   sx={{mt:0}}
                   fullWidth={false}
                   disabled={locationLoading}
                 >
                   Edit
                 </CustomButton>
                 {locationId && (
                   <CustomButton
                     appearance="outlined"
                     onClick={handleLocationDelete}
                     icon={<DeleteIcon fontSize='small' sx={{fontSize:16}}/>}
                     size="small"
                     sx={{mt:0}}
                     fullWidth={false}
                     disabled={locationLoading}
                     buttonType="delete"
                   >
                     Delete
                   </CustomButton>
                 )}
               </Box>
             )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Latitude Field */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: 14 }}>
                  Latitude
                </Typography>
                {isEditingLocation ? (
                  <TextInput
                    value={tempLocation.latitude}
                    onChange={(e) => handleLocationChange('latitude', e.target.value)}
                    placeholder="Enter latitude"
                    helperText="Enter a valid latitude between -90 and 90"
                    fullWidth
                  />
                ) : (
                  <Box sx={{ 
                    p: "8px 16px", 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 1, 
                    border: '1px solid #e0e0e0',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body1" color="text.primary" fontSize={14}>
                      {location.latitude || 'Not set'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Longitude Field */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: 14 }}>
                  Longitude
                </Typography>
                {isEditingLocation ? (
                  <TextInput
                    value={tempLocation.longitude}
                    onChange={(e) => handleLocationChange('longitude', e.target.value)}
                    placeholder="Enter longitude"
                    helperText="Enter a valid longitude between -180 and 180"
                    fullWidth
                  />
                ) : (
                  <Box sx={{ 
                    p: "8px 16px", 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 1, 
                    border: '1px solid #e0e0e0',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body1" color="text.primary" fontSize={14}>
                      {location.longitude || 'Not set'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Action Buttons - Only show when editing */}
              {isEditingLocation && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  justifyContent: 'flex-end',
                  pt: 2,
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <CustomButton
                    onClick={handleLocationCancel}
                    appearance="outlined"
                    size="medium"
                    fullWidth={false}
                    sx={{ mt: 0 }}
                    disabled={locationLoading}
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton
                    onClick={handleLocationSave}
                    appearance="filled"
                    size="medium"
                    fullWidth={false}
                    sx={{ mt: 0 }}
                    disabled={locationLoading}
                    icon={locationLoading ? <CircularProgress size={16} /> : <SaveIcon fontSize='small' />}
                  >
                    {locationLoading ? 'Saving...' : 'Save'}
                  </CustomButton>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: "primary.main", fontWeight: 500, fontSize: 18, pb: 1 }}>Confirm Deletion</DialogTitle>  
        <DialogContent>
          <Typography id="delete-dialog-description" fontSize={14} fontWeight={400} color="text.secondary"> 
            Are you sure you want to delete this image? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton onClick={handleCancelDelete} appearance="outlined" size="small" fullWidth={false} sx={{ mt:0 }}>
                  Cancel
          </CustomButton>
          <CustomButton onClick={handleConfirmDelete} buttonType='delete' size="small" fullWidth={false} sx={{ mt:0 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onClose={handleCategoryModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isUpdatingCategory ? 'Update Category Image' : 'Add Category Image'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                         {isUpdatingCategory && (
               <Box sx={{ mb: 2 }}>
                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '14px' }}>
                   Current Image:
                 </Typography>
                 {categories.find(cat => cat.id === updateCategoryId)?.image ? (
                   <Box
                     component="img"
                     src={categories.find(cat => cat.id === updateCategoryId)?.image}
                     alt="Current category image"
                     sx={{ 
                       width: 80, 
                       height: 80, 
                       objectFit: 'contain', 
                       borderRadius: 0.5,
                       border: '1px solid #ddd'
                     }}
                   />
                 ) : (
                   <Typography color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '12px' }}>
                     No current image
                   </Typography>
                 )}
               </Box>
             )}
            
                         <SelectInput
               label="Select Category"
               value={selectedCategory ? selectedCategory.toString() : ""}
               onChange={(e) => setSelectedCategory(e.target.value as number | '')}
               options={salesCategories.map((category) => ({
                 label: category.Category_Desc,
                 value: category.Sales_Category.toString()
               }))}
               error={false}
               helperText=""
               disabled={salesCategoriesLoading}
             />
            
            <FileUploadInput
              label={isUpdatingCategory ? "Upload New Category Image (optional)" : "Upload Category Image"}
              onChange={setCategoryImage}
              accept="image/*"
              value={categoryImage}
              helperText={isUpdatingCategory ? "Select a new image file to replace the current one" : "Select an image file for this category"}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton onClick={handleCategoryModalClose} appearance="outlined" fullWidth={false} sx={{ mt:0 }}>
            Cancel
          </CustomButton>
                     <CustomButton 
             onClick={handleCategorySubmit} 
             appearance="filled" 
             fullWidth={false} 
             sx={{ mt:0 }}
             disabled={categorySubmitLoading}
           >
             {categorySubmitLoading ? (
               <>
                 <CircularProgress size={16} sx={{ mr: 1 }} />
                 {isUpdatingCategory ? 'Updating...' : 'Adding...'}
               </>
             ) : (
               isUpdatingCategory ? 'Update Category Image' : 'Add Category Image'
             )}
           </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Price Class Modal */}
      <Dialog open={priceClassModalOpen} onClose={handlePriceClassModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isUpdatingPriceClass ? 'Update Price Class Image' : 'Add Price Class Image'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                         {isUpdatingPriceClass && (
               <Box sx={{ mb: 2 }}>
                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '14px' }}>
                   Current Image:
                 </Typography>
                 {priceClasses.find(pc => pc.id === updatePriceClassId)?.image ? (
                   <Box
                     component="img"
                     src={priceClasses.find(pc => pc.id === updatePriceClassId)?.image}
                     alt="Current price class image"
                     sx={{ 
                       width: 80, 
                       height: 80, 
                       objectFit: 'contain', 
                       borderRadius: 0.5,
                       border: '1px solid #ddd'
                     }}
                   />
                 ) : (
                   <Typography color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '12px' }}>
                     No current image
                   </Typography>
                 )}
               </Box>
             )}
            
                         <SelectInput
               label="Select Price Class"
               value={selectedPriceClass ? selectedPriceClass.toString() : ""}
               onChange={(e) => setSelectedPriceClass(e.target.value as number | '')}
               options={priceClassList.map((priceClass) => ({
                 label: priceClass.Class_Desc,
                 value: priceClass.Price_Class.toString()
               }))}
               error={false}
               helperText=""
               disabled={priceClassListLoading}
             />
            
            <FileUploadInput
              label={isUpdatingPriceClass ? "Upload New Price Class Image (optional)" : "Upload Price Class Image"}
              onChange={setPriceClassImage}
              accept="image/*"
              value={priceClassImage}
              helperText={isUpdatingPriceClass ? "Select a new image file to replace the current one" : "Select an image file for this price class"}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton onClick={handlePriceClassModalClose} appearance="outlined" fullWidth={false} sx={{ mt:0 }}>
            Cancel
          </CustomButton>
                     <CustomButton 
             onClick={handlePriceClassSubmit} 
             appearance="filled" 
             fullWidth={false} 
             sx={{ mt:0 }}
             disabled={priceClassSubmitLoading}
           >
             {priceClassSubmitLoading ? (
               <>
                 <CircularProgress size={16} sx={{ mr: 1 }} />
                 {isUpdatingPriceClass ? 'Updating...' : 'Adding...'}
               </>
             ) : (
               isUpdatingPriceClass ? 'Update Price Class Image' : 'Add Price Class Image'
             )}
           </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modals */}
              <DeleteConfirmationModal
          open={deleteCategoryModalOpen}
          onClose={() => {
            setDeleteCategoryModalOpen(false);
            setCategoryToDelete(null);
          }}
          onConfirm={confirmDeleteCategory}
          title="Delete Category Image"
          message="Are you sure you want to delete this category image? This action cannot be undone."
          itemName={categoryToDelete?.name}
          buttonText={deleteCategoryLoading ? "Deleting..." : "Delete"}
          buttonType="delete"
        />

              <DeleteConfirmationModal
          open={deletePriceClassModalOpen}
          onClose={() => {
            setDeletePriceClassModalOpen(false);
            setPriceClassToDelete(null);
          }}
          onConfirm={confirmDeletePriceClass}
          title="Delete Price Class Image"
          message="Are you sure you want to delete this price class image? This action cannot be undone."
          itemName={priceClassToDelete?.name}
          buttonText={deletePriceClassLoading ? "Deleting..." : "Delete"}
          buttonType="delete"
        />

        <DeleteConfirmationModal
          open={deleteQuickLinkModalOpen}
          onClose={() => {
            setDeleteQuickLinkModalOpen(false);
            setQuickLinkToDelete(null);
          }}
          onConfirm={confirmDeleteQuickLink}
          title="Delete Quick Link"
          message="Are you sure you want to delete this quick link? This action cannot be undone."
          itemName={quickLinkToDelete?.name}
          buttonText={deleteQuickLinkLoading ? "Deleting..." : "Delete"}
          buttonType="delete"
        />

        {/* Status Change Confirmation Modal */}
        <Dialog open={statusChangeModalOpen} onClose={() => setStatusChangeModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Status Change</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                Are you sure you want to change the status of "{quickLinkToUpdateStatus?.name}" to{" "}
                <strong>{newStatus ? 'Active' : 'Inactive'}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This will update the quick link status in the system.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <CustomButton 
              onClick={() => setStatusChangeModalOpen(false)} 
              appearance="outlined" 
              fullWidth={false} 
              sx={{ mt: 0 }}
            >
              Cancel
            </CustomButton>
            <CustomButton 
              onClick={confirmStatusChange} 
              appearance="filled" 
              fullWidth={false} 
              sx={{ mt: 0 }}
              disabled={statusUpdateLoading}
            >
              {statusUpdateLoading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </CustomButton>
          </DialogActions>
        </Dialog>

        {/* ShowInWeb Change Confirmation Modal */}
        <Dialog open={showInWebChangeModalOpen} onClose={() => setShowInWebChangeModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Show In Web Change</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                Are you sure you want to change the show in web setting for "{quickLinkToUpdateShowInWeb?.name}" to{" "}
                <strong>{newShowInWeb ? 'Yes' : 'No'}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This will update whether the quick link is displayed on the web interface.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <CustomButton 
              onClick={() => setShowInWebChangeModalOpen(false)} 
              appearance="outlined" 
              fullWidth={false} 
              sx={{ mt: 0 }}
            >
              Cancel
            </CustomButton>
            <CustomButton 
              onClick={confirmShowInWebChange} 
              appearance="filled" 
              fullWidth={false} 
              sx={{ mt: 0 }}
              disabled={showInWebUpdateLoading}
            >
              {showInWebUpdateLoading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </CustomButton>
          </DialogActions>
        </Dialog>

      {/* Quick Links Modal */}
      <Dialog open={quickLinkModalOpen} onClose={handleQuickLinkModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isUpdatingQuickLink ? 'Update Quick Link' : 'Add Quick Link'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextInput
              label="Quick Link Name"
              value={quickLinkName}
              onChange={(e) => setQuickLinkName(e.target.value)}
              placeholder="Enter quick link name"
              helperText="Enter a descriptive name for the quick link"
              fullWidth
            />
            
            <TextInput
              label="URL/Link"
              value={quickLinkUrl}
              onChange={(e) => setQuickLinkUrl(e.target.value)}
              placeholder="https://example.com"
              helperText="Enter the full URL including http:// or https://. Example: https://www.example.com"
              fullWidth
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SwitchInput
                checked={isUpdatingQuickLink ? (quickLinkToUpdateStatus?.status || false) : true}
                onChange={(checked: boolean) => {
                  if (isUpdatingQuickLink && quickLinkToUpdateStatus) {
                    setQuickLinkToUpdateStatus({ ...quickLinkToUpdateStatus, status: checked });
                  }
                }}
                size="medium"
              />
              <Box>
                <Typography variant="body2" color="text.primary">
                  Status
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isUpdatingQuickLink 
                    ? (quickLinkToUpdateStatus?.status ? 'Active' : 'Inactive')
                    : 'Active (default)'
                  }
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SwitchInput
                checked={isUpdatingQuickLink ? (quickLinkToUpdateStatus?.showInWeb || false) : true}
                onChange={(checked: boolean) => {
                  if (isUpdatingQuickLink && quickLinkToUpdateStatus) {
                    setQuickLinkToUpdateStatus({ ...quickLinkToUpdateStatus, showInWeb: checked });
                  }
                }}
                size="medium"
              />
              <Box>
                <Typography variant="body2" color="text.primary">
                  Show In Web
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isUpdatingQuickLink 
                    ? (quickLinkToUpdateStatus?.showInWeb ? 'Yes' : 'No')
                    : 'Yes (default)'
                  }
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton onClick={handleQuickLinkModalClose} appearance="outlined" fullWidth={false} sx={{ mt:0 }}>
            Cancel
          </CustomButton>
          <CustomButton 
            onClick={handleQuickLinkSubmit} 
            appearance="filled" 
            fullWidth={false} 
            sx={{ mt:0 }}
            disabled={quickLinkSubmitLoading || !quickLinkName.trim() || !quickLinkUrl.trim()}
          >
            {quickLinkSubmitLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {isUpdatingQuickLink ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isUpdatingQuickLink ? 'Update Quick Link' : 'Add Quick Link'
            )}
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Product Selection Modal */}
      <Dialog open={productModalOpen} onClose={handleProductModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedWebViewImage?.id === -1 ? 'Create Banner with Products' : 'Edit Banner Image & Products'}
          {selectedWebViewImage && selectedWebViewImage.id !== -1 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 'normal' }}>
              Banner: {selectedWebViewImage.image_url.split('/').pop()}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {productModalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Image Upload for new images */}
              {selectedWebViewImage?.id === -1 && (
                <Box>
                  <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                    Upload Image
                  </Typography>
                  <FileUploadInput
                    label="Upload banner image"
                    onChange={setNewImageFile}
                    accept="image/*"
                    value={newImageFile}
                    helperText="Select a banner image file. This banner will be displayed with the selected products."
                  />
                </Box>
              )}

              {/* Show current banner info for existing banners */}
              {selectedWebViewImage?.id !== -1 && selectedWebViewImage && (
                <Box>
                  <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                    Current Banner
                  </Typography>
                  <Box
                    component="img"
                    src={selectedWebViewImage.image_url}
                    alt="Current Banner"
                    sx={{ 
                      width: '100%', 
                      maxWidth: 300,
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    You can modify both the image and products associated with this banner.
                  </Typography>
                  
                  {/* Image Upload for existing banners */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                      Update Banner Image (Optional)
                    </Typography>
                    <FileUploadInput
                      label="Upload new banner image"
                      onChange={setNewImageFile}
                      accept="image/*"
                      value={newImageFile}
                      helperText="Select a new image file to replace the current banner image. Leave empty to keep the current image."
                    />
                  </Box>
                  
                  {/* Debug: Show current products info */}
                  {selectedWebViewImage.products && selectedWebViewImage.products.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Current Products ({selectedWebViewImage.products.length}):
                      </Typography>
                      {selectedWebViewImage.products.map((product: any, index: number) => (
                        <Typography key={index} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          • {product.Description} (Item: {product.Item_Number})
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* Product Search */}
              <Box>
                <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                  Search Products *
                </Typography>
                <TextInput
                  label="Search products by name or description"
                  value={productSearchQuery}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Type to search products..."
                  helperText={selectedWebViewImage?.id === -1 
                    ? "Enter at least 2 characters to search. You must select at least one product to create the banner."
                    : "Enter at least 2 characters to search. You can modify both the image and selected products for this banner."
                  }
                  error={selectedProducts.length === 0}
                  fullWidth
                />
                {selectedProducts.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    At least one product must be selected
                  </Typography>
                )}
              </Box>

              {/* Search Results */}
              {searchLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : searchResults.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                    Search Results ({searchResults.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    {searchResults.map((product) => {
                      const isSelected = selectedProducts.some(p => p.Item_Number === product.Item_Number);
                      return (
                        <Box
                          key={product.Item_Number}
                          onClick={() => handleProductSelection(product)}
                          sx={{
                            p: 2,
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            '&:hover': {
                              backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                            },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: '2px solid',
                              borderColor: isSelected ? 'primary.main' : '#ccc',
                              backgroundColor: isSelected ? 'primary.main' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {isSelected && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: 'white'
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {product.Description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Item: {product.Item_Number} | Alt: {product.AltDesc}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : productSearchQuery.length >= 2 && !searchLoading ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                  No products found for "{productSearchQuery}"
                </Typography>
              ) : null}

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                    Selected Products ({selectedProducts.length})
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    {selectedProducts.map((product) => (
                      <Box
                        key={product.Item_Number}
                        sx={{
                          p: 2,
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(25, 118, 210, 0.08)'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {product.Description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Item: {product.Item_Number} | Alt: {product.AltDesc}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleProductSelection(product)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton onClick={handleProductModalClose} appearance="outlined" fullWidth={false} sx={{ mt: 0 }}>
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleProductSubmit}
            appearance="filled"
            fullWidth={false}
            sx={{ mt: 0 }}
            disabled={productSubmitLoading || selectedProducts.length === 0 || (selectedWebViewImage?.id === -1 && !newImageFile)}
          >
            {productSubmitLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {selectedWebViewImage?.id === -1 ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              selectedWebViewImage?.id === -1 
                ? `Create Banner with ${selectedProducts.length} Product${selectedProducts.length !== 1 ? 's' : ''}`
                : `Update Banner${newImageFile ? ' & Image' : ''} with ${selectedProducts.length} Product${selectedProducts.length !== 1 ? 's' : ''}`
            )}
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* View Banner Details Modal */}
      <Dialog open={viewModalOpen} onClose={handleViewModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Banner Details
          {selectedBannerData && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 'normal' }}>
              {selectedBannerData.section === 'middle' ? 'Middle Banner' : 'Bottom Banner'}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedBannerData ? (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Banner Image */}
              <Box>
                <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                  Banner Image
                </Typography>
                <Box
                  component="img"
                  src={selectedBannerData.image_url}
                  alt="Banner"
                  sx={{ 
                    width: '100%', 
                    maxWidth: 500,
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Box>

           

              {/* Associated Products */}
              {selectedBannerData.products && selectedBannerData.products.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                    Associated Products ({selectedBannerData.products.length})
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 200, 
                    overflow: 'auto', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1,
                    p: 2
                  }}>
                    {selectedBannerData.products.map((product: any, index: number) => (
                      <Box
                        key={product.Item_Number}
                        sx={{
                          p: 2,
                          borderBottom: index < selectedBannerData.products.length - 1 ? '1px solid #f0f0f0' : 'none',
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                          borderRadius: 1,
                          mb: index < selectedBannerData.products.length - 1 ? 1 : 0
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {product.Description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Item: {product.Item_Number}
                          {product.AltDesc && ` | Alt: ${product.AltDesc}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

            
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton onClick={handleViewModalClose} appearance="outlined" fullWidth={false} sx={{ mt: 0 }}>
            Close
          </CustomButton>
        </DialogActions>
      </Dialog>


    </Box>
  );
};

export default WebView; 