import React, { useState, useEffect } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { MultiSearchableDropdown } from "../../atoms/SearchableDropdown";
import { getProductList } from "../../../redux/apis/distrubutor/listApis";
import { useDebounce } from "../../../hooks/useDebounce";

interface Product {
  id: number;
  Item_Number: string | number;
  Item_Image: string;
  Item_Name: string;
  Description: string;
  pack: string;
  CaseCount: string;
  UOM: string;
  UnitOunces: string;
  Price1: number;
  Price2: number;
  BaseCost: number;
  Invoice_Cost: number;
  orderQty: number;
  shippedQty: number;
  qtyShipped: number;
  qtyOrder: number;
  AvgCost: number;
  priceWithoutTax: number;
  taxAmount: number;
  totalPrice: number;
  extendedPrice: number;
  salesTaxApplies: boolean;
  showDistributorImage: boolean;
  distributorImage: string;
  masterImage: string;
  imageId: any;
}

interface PromotedItemsSelectorProps {
  value: string[];
  onChange: (items: string[]) => void;
  maxItems: number;
  disabled?: boolean;
}

const PromotedItemsSelector: React.FC<PromotedItemsSelectorProps> = ({
  value = [],
  onChange,
  maxItems,
  disabled = false,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch products on component mount and when search query changes
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearchQuery]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = debouncedSearchQuery ? { search: debouncedSearchQuery } : {};
      const response = await getProductList(params);
      const data = (response as any)?.data?.data || [];
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductChange = (selectedOptions: {label: string, value: string}[]) => {
    // Limit the selection to maxItems
    const limitedSelection = selectedOptions.slice(0, maxItems);
    const inventors: string[] = limitedSelection.map(option => String(option.value));
    onChange(inventors);
  };

  const handleSearchChange = (searchValue: string) => {
    setSearchQuery(searchValue);
  };

  const removeProduct = (itemNumber: string) => {
    const updatedItems = value.filter(p => p !== itemNumber);
    onChange(updatedItems);
  };

  const dropdownValue = value.map(itemNumber => {
    const product = products.find(p => String(p.Item_Number) === itemNumber);
    return {
      label: product?.Description || itemNumber,
      value: itemNumber,
    };
  });

  return (
    <Box>
      <MultiSearchableDropdown
        label={`Select Promoted Products (Max: ${maxItems})`}
        options={products.map((p) => ({
          label: p.Description,
          value: String(p.Item_Number),
        }))}
        value={dropdownValue}
        onChange={handleProductChange}
        onSearchChange={handleSearchChange}
        loading={loadingProducts}
        placeholder="Search and select products"
        noOptionsText="No products found"
        disabled={disabled}
      />

      {/* Selected Products Display */}
      {value.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
            Selected Products ({value.length}/{maxItems})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {value.map((itemNumber) => {
              const product = products.find(p => String(p.Item_Number) === itemNumber);
              return (
                <Chip
                  key={itemNumber}
                  label={`${product?.Description || 'Product'} (${itemNumber})`}
                  onDelete={disabled ? undefined : () => removeProduct(itemNumber)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PromotedItemsSelector; 