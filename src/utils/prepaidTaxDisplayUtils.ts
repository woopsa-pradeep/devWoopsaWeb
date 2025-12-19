import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getInventoryShowPrepaidTax } from '../redux/apis/retailer/orderApis';
import { getInventoryShowPrepaidTax as getSalesInventoryShowPrepaidTax } from '../redux/apis/sales/salesOrderApis';

/**
 * Hook to get showWithPerpaidTax setting
 * Returns true if prepaid tax should be shown in price (current behavior)
 * Returns false if prepaid tax should NOT be shown in price (display only price + tax_rate)
 */
export const useShowPrepaidTax = () => {
  const [showWithPerpaidTax, setShowWithPerpaidTax] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const auth = useSelector((state: any) => state.auth);
  const role = auth?.role;
  const selectedCustomer = auth?.selectedCustomer;

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        setLoading(true);
        let response: any;
        
        if (role === 'sales' && selectedCustomer?.C_Number) {
          response = await getSalesInventoryShowPrepaidTax(selectedCustomer.C_Number.toString());
        } else {
          response = await getInventoryShowPrepaidTax();
        }
        
        if (response?.success && response?.data) {
          setShowWithPerpaidTax(response.data.showWithPerpaidTax ?? true);
        } else {
          // Default to true if API fails
          setShowWithPerpaidTax(true);
        }
      } catch (error) {
        console.error('Failed to fetch showWithPerpaidTax setting:', error);
        // Default to true if API fails
        setShowWithPerpaidTax(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSetting();
  }, [role, selectedCustomer?.C_Number]);

  return { showWithPerpaidTax, loading };
};

/**
 * Calculate display price based on showWithPerpaidTax setting
 * If showWithPerpaidTax is false: return (price + Tax_Rate) - without prepaid tax
 * If showWithPerpaidTax is true: return (price + Tax_Rate) * (1 + prepaidTaxRate) - with prepaid tax
 */
export const calculateDisplayPrice = (
  basePrice: number,
  taxRate: number,
  prepaidTaxRate: number = 0,
  showWithPerpaidTax: boolean = true
): number => {
  // Ensure all values are valid numbers
  const base = Number(basePrice) || 0;
  const tax = Number(taxRate) || 0;
  const prepaid = Number(prepaidTaxRate) || 0;
  
  const basePriceWithTax = base + tax;
  
  if (showWithPerpaidTax) {
    // Current behavior: include prepaid tax in display
    return Number(Number(basePriceWithTax * (1 + prepaid)).toFixed(2));
  } else {
    // New behavior: exclude prepaid tax from display
    return Number(Number(basePriceWithTax).toFixed(2));
  }
};

/**
 * Calculate prepaid tax amount for display
 * Returns the prepaid tax amount that would be added to the base price with tax
 */
export const calculatePrepaidTaxAmount = (
  basePrice: number,
  taxRate: number,
  prepaidTaxRate: number = 0
): number => {
  const basePriceWithTax = basePrice + taxRate;
  const prepaidTaxAmount = basePriceWithTax * prepaidTaxRate;
  return Number(Number(prepaidTaxAmount).toFixed(2));
};

