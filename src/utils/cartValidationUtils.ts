import { showErrorToast } from './toastUtils';

export interface CartValidationData {
  userLimitMinOrderAmount: number | null;
  totalAmountWithTax: number;
  totalAmount: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  price: number;
  priceWithTax: number;
}

export interface ProductLimitData {
  hasProductLimit: boolean;
  productLimit: number | null;
}

/**
 * Validates if adding a quantity to an item exceeds the product's specific limit
 * @param currentQuantity Current quantity of the item
 * @param newQuantity New quantity to be added
 * @param productLimitData Product limit data containing hasProductLimit and productLimit
 * @param itemName Name of the item for error message
 * @returns true if validation passes, false if it fails
 */
export const validateItemQuantityLimit = (
  currentQuantity: number,
  newQuantity: number,
  productLimitData: ProductLimitData,
  itemName: string
): boolean => {
  // If hasProductLimit is false, no limit applies
  if (!productLimitData.hasProductLimit) {
    return true;
  }

  // If hasProductLimit is true but productLimit is null or 0, no limit applies
  if (productLimitData.productLimit === null || productLimitData.productLimit === 0) {
    return true;
  }

  if (newQuantity > productLimitData.productLimit) {
    showErrorToast(`Maximum quantity limit for ${itemName} is ${productLimitData.productLimit}. You cannot add more than ${productLimitData.productLimit} items.`);
    return false;
  }

  return true;
};

/**
 * Validates if the total order amount meets the minimum order requirement
 * @param totalAmountWithTax Total amount with tax
 * @param userLimitMinOrderAmount Minimum order amount required (null means no minimum)
 * @returns true if validation passes, false if it fails
 */
export const validateMinimumOrderAmount = (
  totalAmountWithTax: number,
  userLimitMinOrderAmount: number | null
): boolean => {
  if (userLimitMinOrderAmount === null || userLimitMinOrderAmount === 0) {
    return true; // No minimum order requirement
  }

  if (totalAmountWithTax < userLimitMinOrderAmount) {
    showErrorToast(`Minimum order amount is $${userLimitMinOrderAmount.toFixed(2)}. Your current total is $${totalAmountWithTax.toFixed(2)}. Please add more items to meet the minimum requirement.`);
    return false;
  }

  return true;
};

/**
 * Validates cart before proceeding to checkout
 * @param cartItems Array of cart items with product limit data
 * @param validationData Cart validation data from API
 * @returns true if validation passes, false if it fails
 */
export const validateCartForCheckout = (
  cartItems: (CartItem & ProductLimitData)[],
  validationData: CartValidationData
): boolean => {
  const { userLimitMinOrderAmount, totalAmountWithTax } = validationData;

  // Check if cart is empty
  if (cartItems.length === 0) {
    showErrorToast('Your cart is empty. Please add items before proceeding.');
    return false;
  }

  // Check minimum order amount
  if (!validateMinimumOrderAmount(totalAmountWithTax, userLimitMinOrderAmount)) {
    return false;
  }

  // Check individual item limits
  for (const item of cartItems) {
    const productLimitData: ProductLimitData = {
      hasProductLimit: item.hasProductLimit,
      productLimit: item.productLimit
    };
    
    if (!validateItemQuantityLimit(0, item.quantity, productLimitData, item.id)) {
      return false;
    }
  }

  return true;
};

/**
 * Validates adding an item to cart
 * @param currentQuantity Current quantity of the item
 * @param quantityToAdd Quantity to add
 * @param productLimitData Product limit data containing hasProductLimit and productLimit
 * @param itemName Name of the item
 * @returns true if validation passes, false if it fails
 */
export const validateAddToCart = (
  currentQuantity: number,
  quantityToAdd: number,
  productLimitData: ProductLimitData,
  itemName: string
): boolean => {
  const newQuantity = currentQuantity + quantityToAdd;
  return validateItemQuantityLimit(currentQuantity, newQuantity, productLimitData, itemName);
};

/**
 * Validates updating item quantity in cart
 * @param newQuantity New quantity to set
 * @param productLimitData Product limit data containing hasProductLimit and productLimit
 * @param itemName Name of the item
 * @returns true if validation passes, false if it fails
 */
export const validateUpdateQuantity = (
  newQuantity: number,
  productLimitData: ProductLimitData,
  itemName: string
): boolean => {
  return validateItemQuantityLimit(0, newQuantity, productLimitData, itemName);
}; 