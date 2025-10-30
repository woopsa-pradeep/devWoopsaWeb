import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, IconButton, CircularProgress } from "@mui/material";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TextInput from "../atoms/TextInput";
import CustomDatePicker from "../atoms/CustomDatePicker";
import FileUploadInput from "../atoms/FileUploadInput";
import SwitchInput from "../atoms/SwitchInput";
import CustomButton from "../atoms/CustomButton";
import { getProductListBySearch } from "../../redux/apis/distrubutor/promoApis";
import { toast } from "react-hot-toast";

interface Product {
  Item_Number: number;
  Description: string;
  AltDesc: string;
}

interface PromoFormProps {
  initialData?: PromoFormSchema;
  onSubmit: (data: PromoFormSchema) => void;
  onCancel: () => void;
  loading?: boolean;
}

const promoFormSchema = z.object({
  _id: z.string().optional(),
  image_url: z.union([z.custom<File>(), z.string()]).nullable(),
  imagePreview: z.string().optional(),
  bannerTitle: z.string().min(1, "Banner title is required"),
  bannerDescription: z.string()
    .min(1, "Banner description is required")
    .max(100, "Banner description must be 100 characters or less"),
  startDate: z.custom<Dayjs | null>().refine(date => date !== null, "Start date is required").nullable(),
  endDate: z.custom<Dayjs | null>().refine(date => date !== null, "End date is required").nullable(),
  status: z.boolean(),
  hasForWeb: z.boolean(),
  inventors: z.array(z.string()).min(1, "At least one product must be selected") // Array of item number strings
});

type PromoFormSchema = z.infer<typeof promoFormSchema>;

const PromoForm: React.FC<PromoFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<PromoFormSchema>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: initialData ? {
      _id: initialData._id,
      image_url: initialData.image_url,
      imagePreview: typeof initialData.image_url === 'string' ? initialData.image_url : undefined,
      bannerTitle: initialData.bannerTitle || "",
      bannerDescription: initialData.bannerDescription || "",
      startDate: initialData.startDate ? dayjs(initialData.startDate) : null,
      endDate: initialData.endDate ? dayjs(initialData.endDate) : null,
      status: initialData.status ?? true,
      hasForWeb: initialData.hasForWeb ?? false,
      inventors: initialData.inventors || [],
    } : {
      image_url: null,
      bannerTitle: "",
      bannerDescription: "",
      startDate: null,
      endDate: null,
      status: true,
      hasForWeb: false,
      inventors: [],
    }
  });

  // Initialize selected products from initialData when in edit mode
  useEffect(() => {
    if (initialData && initialData.inventors && initialData.inventors.length > 0) {
      // Convert inventors array to Product objects for display
      const productsFromInventors: Product[] = initialData.inventors.map(itemNumber => {
        // Try to get description from inventoryItems if available
        const inventoryItem = (initialData as any).inventoryItems?.find((item: string) => 
          item.startsWith(itemNumber)
        );
        
        let description = `Product ${itemNumber}`;
        let altDesc = `Alt ${itemNumber}`;
        
        if (inventoryItem) {
          // Extract description from format "10123 - Maverick 100 Red Bx"
          const parts = inventoryItem.split(' - ');
          if (parts.length > 1) {
            description = parts[1];
            altDesc = parts[1];
          }
        }
        
        return {
          Item_Number: Number(itemNumber),
          Description: description,
          AltDesc: altDesc
        };
      });
      setSelectedProducts(productsFromInventors);
    }
  }, [initialData]);

  // Debounced product search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productSearchQuery.length >= 2) {
        searchProducts(productSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [productSearchQuery]);

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

  const handleProductSearch = (query: string) => {
    setProductSearchQuery(query);
  };

  const handleProductSelection = (product: Product) => {
    const isSelected = selectedProducts.some(p => p.Item_Number === product.Item_Number);
    
    if (isSelected) {
      // Remove product
      const updatedProducts = selectedProducts.filter(p => p.Item_Number !== product.Item_Number);
      setSelectedProducts(updatedProducts);
      setValue('inventors', updatedProducts.map(p => String(p.Item_Number)));
    } else {
      // Add product
      const updatedProducts = [...selectedProducts, product];
      setSelectedProducts(updatedProducts);
      setValue('inventors', updatedProducts.map(p => String(p.Item_Number)));
    }
  };

  const handleBannerChange = (file: File | null) => {
    setValue('image_url', file);
    if (file) {
      setValue('imagePreview', URL.createObjectURL(file));
    }
  };

  const handleFormSubmit: SubmitHandler<PromoFormSchema> = (data) => {
    // Validate that at least one product is selected
    if (data.inventors.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    // Transform the data to match your desired payload format
    const transformedData = {
      ...data,
      status: data.status, // Keep as boolean
      startDate: data.startDate?.format('YYYY-MM-DD'),
      endDate: data.endDate?.format('YYYY-MM-DD'),
      image_url: data.image_url instanceof File ? data.image_url : data.imagePreview,
    };
    
    onSubmit(transformedData as any);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container rowSpacing={0.5} columnSpacing={3}>
        {/* Banner Upload */}
        <Grid size={{ xs: 12, sm: 6}}>
          <Controller
            name="image_url"
            control={control}
            render={({  }) => (
              <FileUploadInput
                label="Banner Image"
                onChange={handleBannerChange}
                error={!!errors.image_url}
                helperText={errors.image_url?.message}
                preview={watch('imagePreview')}
                accept="image/*"
              />
            )}
          />
        </Grid>

        {/* Banner Title */}
        <Grid size={{ xs: 12, sm: 6}}>
          <Controller
            name="bannerTitle"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Banner Title"
                error={!!errors.bannerTitle}
                helperText={errors.bannerTitle?.message}
                placeholder="Enter banner title"
              />
            )}
          />
        </Grid>

        {/* Banner Description */}
        <Grid size={{ xs: 12}}>
          <Controller
            name="bannerDescription"
            control={control}
            render={({ field }) => {
              const charCount = field.value ? field.value.length : 0;
              const isOverLimit = charCount > 100;
              
              return (
                <Box>
                  <TextInput
                    {...field}
                    label="Banner Description"
                    error={!!errors.bannerDescription}
                    helperText={errors.bannerDescription?.message}
                    placeholder="Enter banner description"
                    multiline
                    rows={3}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      color={isOverLimit ? "error.main" : "text.secondary"}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {charCount}/100 characters
                    </Typography>
                    {isOverLimit && (
                      <Typography 
                        variant="caption" 
                        color="error.main"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Character limit exceeded
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            }}
          />
        </Grid>

        {/* Start Date */}
        <Grid size={{ xs: 12, sm: 6}}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label="Start Date"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.startDate as boolean}
                helperText={errors.startDate?.message}
              />
            )}
          />
        </Grid>

        {/* End Date */}
        <Grid size={{ xs: 12, sm: 6}}>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label="End Date"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.endDate as boolean}
                helperText={errors.endDate?.message}
              />
            )}
          />
        </Grid>

        {/* Product Search */}
        <Grid size={{ xs: 12}}>
          <Box>
            <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
              Search Products *
            </Typography>
            <TextInput
              label="Search products by name or description"
              value={productSearchQuery}
              onChange={(e) => handleProductSearch(e.target.value)}
              placeholder="Type to search products..."
              helperText="Enter at least 2 characters to search. You must select at least one product to create the promo."
              error={!!errors.inventors}
              fullWidth
            />
            {errors.inventors && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.inventors.message}
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
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6}} sx={{display: 'flex', alignItems: 'center'}}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <SwitchInput
                label="Status"
                checked={field.value}
                onChange={field.onChange}
                isShowLabel={false}
              />
            )}
          />
        </Grid>

        {/* Allow Web */}
        <Grid size={{ xs: 12, sm: 6}} sx={{display: 'flex', alignItems: 'center'}}>
          <Controller
            name="hasForWeb"
            control={control}
            render={({ field }) => (
              <SwitchInput
                label="Allow Web"
                checked={field.value}
                onChange={field.onChange}
                isShowLabel={false}
              />
            )}
          />
        </Grid>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <Grid size={{ xs: 12}}>
            <Box>
              <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                Selected Products ({selectedProducts.length})
                {initialData && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Loaded from existing data)
                  </Typography>
                )}
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
                      <Box
                        component="span"
                        sx={{
                          fontSize: 18,
                          fontWeight: 'bold',
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </Box>
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={3}>
        <CustomButton
          type="submit"
          appearance="filled"
          loading={loading}
          fullWidth={false}
        >
          {initialData ? "Update Promo" : "Create Promo"}
        </CustomButton>
        <CustomButton
          type="button"
          appearance="outlined"
          onClick={onCancel}
          fullWidth={false}
        >
          Cancel
        </CustomButton>
      </Box>
    </Box>
  );
};

export default PromoForm;