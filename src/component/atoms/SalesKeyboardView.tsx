import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import { VisibilityOutlined } from '@mui/icons-material';
import ViewModeToggleSales from './ViewModeToggleSales';
import cart from '../../assets/icons/cart.svg';
import TextInput from './TextInput';
import { useShowPrepaidTax, calculateDisplayPrice } from '../../utils/prepaidTaxDisplayUtils';
import scrollIntoView from 'scroll-into-view-if-needed';

export interface SalesKeyboardProduct {
  id: string;
  image: string;
  name: string;
  itemNumber: string;
  pack: string;
  case: string;
  size: string;
  UnitOunces: string;
  stock: 'in stock' | 'low stock' | 'out of stock';
  stockCount?: number;
  price: number;
  crvPrice: number;
  quantity: number;
  upc: string;
  category: string;
  subCategory: string;
  Tax_Rate: number;
  priceWithTax: number;
  showWithOutPrice: boolean;
  isDiscounted: boolean;
  isNewItem: boolean;
  allowToOrder: boolean;
  hasProductLimit: boolean;
  productLimit: number | null;
  hasQtyDiscount?: boolean;
  qtyDiscount?: unknown;
  prepaidTaxRate?: number;
}

export interface SalesKeyboardViewProps {
  items: SalesKeyboardProduct[];
  loading: boolean;
  searchTerm: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;
  masterSearchTerm?: string;
  viewMode: 'table' | 'grid' | 'keyboard';
  setViewMode: (mode: 'table' | 'grid' | 'keyboard') => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  orderItems?: {
    [key: string]: {
      quantity: number;
      price: number;
      Description: string;
      productId: number;
      placedBySalesPerson: boolean;
    };
  };
  onQuantityChange?: (id: string, change: number) => void;
  onHistoryClick?: (product: SalesKeyboardProduct) => void;
  onDiscountModalOpen?: (product: SalesKeyboardProduct, qtyDiscount: unknown) => void;
  isReturnOrder?: boolean;
}

const scrollRowIntoList = (container: HTMLElement | null, row: HTMLElement | null) => {
  if (!container || !row) return;
  scrollIntoView(row, {
    scrollMode: 'if-needed',
    block: 'nearest',
    inline: 'nearest',
    boundary: container,
  });
};

/**
 * Isolated keyboard quick-order UI: search, list navigation, qty entry, pagination.
 * Scroll + global key handling use refs so behavior stays stable across re-renders/API refreshes.
 */
const SalesKeyboardView: React.FC<SalesKeyboardViewProps> = ({
  items,
  loading,
  searchTerm,
  onSearchChange,
  masterSearchTerm = '',
  viewMode,
  setViewMode,
  currentPage = 1,
  totalPages = 0,
  totalItems = 0,
  onPageChange,
  orderItems = {},
  onQuantityChange,
  onHistoryClick,
  onDiscountModalOpen,
  isReturnOrder = false,
}) => {
  const { showWithPerpaidTax } = useShowPrepaidTax();

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [quantityInput, setQuantityInput] = useState<{ [key: string]: string }>({});
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const [isSubmittingQuantity, setIsSubmittingQuantity] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  /** Sync refs for document key handler — subscribe once; always read latest values. */
  const selectedIndexRef = useRef(selectedIndex);
  const focusedProductIdRef = useRef(focusedProductId);
  const itemsRef = useRef(items);
  const quantityInputStateRef = useRef(quantityInput);
  const handleProductEnterRef = useRef<(product: SalesKeyboardProduct) => void>(() => {});
  const onPageChangeRef = useRef(onPageChange);
  const totalPagesRef = useRef(totalPages);
  const currentPageRef = useRef(currentPage);

  selectedIndexRef.current = selectedIndex;
  focusedProductIdRef.current = focusedProductId;
  itemsRef.current = items;
  quantityInputStateRef.current = quantityInput;
  onPageChangeRef.current = onPageChange;
  totalPagesRef.current = totalPages;
  currentPageRef.current = currentPage;

  const itemsRowKey = useMemo(() => items.map((p) => p.id).join(','), [items]);

  useEffect(() => {
    setSelectedIndex(-1);
    setFocusedProductId(null);
  }, [itemsRowKey]);

  const getRowEl = useCallback((index: number): HTMLElement | null => {
    const root = productListRef.current;
    if (!root || index < 0) return null;
    const nodes = root.querySelectorAll('[data-kb-row-index]');
    return (nodes[index] as HTMLElement) ?? null;
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      scrollRowIntoList(productListRef.current, getRowEl(index));
    },
    [getRowEl]
  );

  /**
   * One place for scroll-after-layout: selection, qty panel open/close, same rows refetched.
   */
  useLayoutEffect(() => {
    if (!searchTerm) return;
    const list = itemsRef.current;
    if (focusedProductId) {
      const idx = list.findIndex((p) => p.id === focusedProductId);
      if (idx >= 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToIndex(idx));
        });
      }
      return;
    }
    if (selectedIndex >= 0 && selectedIndex < list.length) {
      requestAnimationFrame(() => {
        scrollToIndex(selectedIndex);
      });
    }
  }, [selectedIndex, focusedProductId, itemsRowKey, searchTerm, scrollToIndex]);

  const focusQtyInput = useCallback((productId: string) => {
    window.setTimeout(() => {
      const root = productListRef.current;
      const input = root?.querySelector(
        `[data-kb-product-id="${CSS.escape(String(productId))}"] input`
      ) as HTMLInputElement | null;
      if (input) {
        input.focus({ preventScroll: true });
        input.select();
      }
    }, 0);
  }, []);

  const handleProductEnter = useCallback(
    (product: SalesKeyboardProduct) => {
      if (!product.allowToOrder) return;

      const currentQty = orderItems[product.id]?.quantity || 0;
      const isFirstTimeAdding = currentQty === 0;

      if (
        !isReturnOrder &&
        isFirstTimeAdding &&
        product.hasQtyDiscount &&
        product.qtyDiscount &&
        onDiscountModalOpen
      ) {
        onDiscountModalOpen(product, product.qtyDiscount);
        return;
      }

      setFocusedProductId(product.id);
      const inputValue = currentQty > 0 ? currentQty.toString() : '';
      setQuantityInput((prev) => ({ ...prev, [product.id]: inputValue }));
      focusQtyInput(product.id);
    },
    [orderItems, isReturnOrder, onDiscountModalOpen, focusQtyInput]
  );

  handleProductEnterRef.current = handleProductEnter;

  const handleQuantitySubmit = useCallback(
    (product: SalesKeyboardProduct, quantity: number) => {
      if (!product.allowToOrder) return;

      setIsSubmittingQuantity(true);

      try {
        if (quantity <= 0) {
          if (onQuantityChange) {
            onQuantityChange(product.id, -(orderItems[product.id]?.quantity || 0));
          }
          setQuantityInput((prev) => ({ ...prev, [product.id]: '' }));
          setFocusedProductId(null);
          const currentIndex = itemsRef.current.findIndex((item) => item.id === product.id);
          if (currentIndex !== -1) {
            setSelectedIndex(currentIndex);
          }
          return;
        }

        const currentQty = orderItems[product.id]?.quantity || 0;
        const isFirstTimeAdding = currentQty === 0;

        if (
          !isReturnOrder &&
          isFirstTimeAdding &&
          product.hasQtyDiscount &&
          product.qtyDiscount &&
          onDiscountModalOpen
        ) {
          onDiscountModalOpen(product, product.qtyDiscount);
          setQuantityInput((prev) => ({ ...prev, [product.id]: '' }));
          setFocusedProductId(null);
          return;
        }

        const difference = quantity - currentQty;
        if (difference !== 0 && onQuantityChange) {
          onQuantityChange(product.id, difference);
        }

        setQuantityInput((prev) => ({ ...prev, [product.id]: '' }));
        setFocusedProductId(null);

        const currentIndex = itemsRef.current.findIndex((item) => item.id === product.id);
        if (currentIndex !== -1) {
          setSelectedIndex(currentIndex);
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
        setFocusedProductId(product.id);
      } finally {
        window.setTimeout(() => setIsSubmittingQuantity(false), 100);
      }
    },
    [orderItems, isReturnOrder, onDiscountModalOpen, onQuantityChange]
  );

  const handleQuantityInputKeyDown = useCallback(
    (e: React.KeyboardEvent, product: SalesKeyboardProduct) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (!product.allowToOrder) return;
        const quantity = parseInt(quantityInputStateRef.current[product.id] || '0', 10);
        if (quantity >= 0) {
          handleQuantitySubmit(product, quantity);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (!product.allowToOrder) return;
        const currentQty = parseInt(quantityInputStateRef.current[product.id] || '0', 10);
        const newQty = Math.max(1, currentQty + 1);
        setQuantityInput((prev) => ({ ...prev, [product.id]: newQty.toString() }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (!product.allowToOrder) return;
        const currentQty = parseInt(quantityInputStateRef.current[product.id] || '0', 10);
        const newQty = Math.max(0, currentQty - 1);
        setQuantityInput((prev) => ({ ...prev, [product.id]: newQty.toString() }));
      } else if (e.key === 'Tab') {
        return;
      } else if (e.key === 'S' || e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        setQuantityInput((prev) => ({ ...prev, [product.id]: '' }));
        setFocusedProductId(null);
        searchInputRef.current?.focus();
      } else {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
        const isNumber = /^[0-9]$/.test(e.key);
        if (!isNumber && !allowedKeys.includes(e.key)) {
          e.preventDefault();
        }
      }
    },
    [handleQuantitySubmit]
  );

  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  /** Document listener: single subscription; reads latest state via refs. */
  useEffect(() => {
    let keyRepeatTimer: ReturnType<typeof setTimeout> | null = null;
    let isKeyRepeating = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      const fid = focusedProductIdRef.current;
      const itemsNow = itemsRef.current;
      const sel = selectedIndexRef.current;

      if (fid) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setFocusedProductId(null);
          setQuantityInput((prev) => ({ ...prev, [fid]: '' }));
          searchInputRef.current?.focus();
        }
        return;
      }

      if (e.repeat && !isKeyRepeating) {
        isKeyRepeating = true;
        if (keyRepeatTimer) clearTimeout(keyRepeatTimer);
        keyRepeatTimer = setTimeout(() => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(itemsNow.length - 1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(0);
          }
        }, 300);
      }

      if (!e.repeat) {
        isKeyRepeating = false;
        if (keyRepeatTimer) {
          clearTimeout(keyRepeatTimer);
          keyRepeatTimer = null;
        }

        const tp = totalPagesRef.current;
        const cp = currentPageRef.current;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => {
              const newIndex = prev < itemsNow.length - 1 ? prev + 1 : 0;
              if (newIndex === 0 && prev === itemsNow.length - 1 && tp && cp && cp < tp) {
                onPageChangeRef.current?.(cp + 1);
              }
              return newIndex;
            });
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => {
              const newIndex = prev > 0 ? prev - 1 : itemsNow.length - 1;
              if (newIndex === itemsNow.length - 1 && prev === 0 && tp && cp && cp > 1) {
                onPageChangeRef.current?.(cp - 1);
              }
              return newIndex;
            });
            break;
          case 'Enter':
            e.preventDefault();
            if (sel >= 0 && sel < itemsNow.length) {
              handleProductEnterRef.current(itemsNow[sel]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setSelectedIndex(-1);
            onSearchChangeRef.current?.({
              target: { value: '' },
            } as React.ChangeEvent<HTMLInputElement>);
            searchInputRef.current?.focus();
            break;
          case 'Tab':
            break;
          case 'S':
          case 's':
            setSelectedIndex(-1);
            setFocusedProductId(null);
            searchInputRef.current?.focus();
            break;
          case 'Home':
            e.preventDefault();
            setSelectedIndex(0);
            break;
          case 'End':
            e.preventDefault();
            setSelectedIndex(Math.max(0, itemsNow.length - 1));
            break;
          default:
            if (!e.ctrlKey && !e.altKey && !e.metaKey) {
              searchInputRef.current?.focus();
            }
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        isKeyRepeating = false;
        if (keyRepeatTimer) {
          clearTimeout(keyRepeatTimer);
          keyRepeatTimer = null;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (keyRepeatTimer) clearTimeout(keyRepeatTimer);
    };
  }, []);

  return (
    <Box
      sx={{
        height: 'calc(100vh - 180px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRadius: '10px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          p: 2,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: '10px 10px 0 0',
        }}
      >
        <Box sx={{ flex: 1, maxWidth: '400px' }}>
          <TextInput
            ref={searchInputRef}
            placeholder={
              masterSearchTerm
                ? `Banner search: ${masterSearchTerm}`
                : 'Search products (type to search, ↑↓ to navigate, Enter to select)'
            }
            value={searchTerm}
            onChange={onSearchChange}
            autoFocus
            fullWidth
            size="small"
            sx={{ mb: 0 }}
          />
        </Box>
        <ViewModeToggleSales viewMode={viewMode} setViewMode={setViewMode} />
      </Box>

      {searchTerm && (
        <Box
          ref={productListRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'background.paper',
            p: 1,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
              }}
            >
              <Typography>Loading products...</Typography>
            </Box>
          ) : items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
              }}
            >
              <Typography color="textSecondary">
                No products found. Try a different search term.
              </Typography>
            </Box>
          ) : (
            <>
              {items.map((product, index) => (
                <Box
                  key={product.id}
                  data-kb-row-index={index}
                  data-kb-product-id={product.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedIndex === index ? 'primary.main' : 'background.paper',
                    '&:hover': {
                      backgroundColor: selectedIndex === index ? 'primary.dark' : 'action.hover',
                    },
                    '&:last-child': { borderBottom: 'none' },
                    position: 'relative',
                  }}
                  onClick={() => setSelectedIndex(index)}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: selectedIndex === index ? 'white' : 'text.primary',
                        fontSize: '13px',
                        lineHeight: 1.2,
                        mb: 0.5,
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: selectedIndex === index ? 'rgba(255, 255, 255, 0.9)' : 'text.secondary',
                        fontSize: '12px',
                        lineHeight: 1.2,
                      }}
                    >
                      {product.itemNumber} | Pack: {product.pack} | Size: {product.size} | Case:{' '}
                      {product.case} | Unit: {product.UnitOunces}
                    </Typography>
                  </Box>

                  <Box sx={{ mr: 1, minWidth: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      sx={{
                        color: selectedIndex === index ? 'white' : 'primary.main',
                        p: 0.5,
                      }}
                      onClick={() => onHistoryClick?.(product)}
                    >
                      <VisibilityOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ mr: 1, minWidth: 60 }}>
                    {product.stockCount !== undefined ? (
                      <Typography
                        variant="body2"
                        sx={{
                          color: selectedIndex === index ? 'rgba(255, 255, 255, 0.9)' : 'text.secondary',
                          fontSize: '12px',
                        }}
                      >
                        Stock: {product.stockCount}
                      </Typography>
                    ) : (
                      <Chip
                        label={product.stock}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontSize: '10px',
                          height: '20px',
                          color: selectedIndex === index
                            ? 'white'
                            : product.stock === 'in stock'
                              ? 'success.main'
                              : 'error.main',
                          bgcolor: selectedIndex === index
                            ? 'rgba(255, 255, 255, 0.2)'
                            : product.stock === 'in stock'
                              ? 'success.light'
                              : 'error.light',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ mr: 1, minWidth: 70, textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: selectedIndex === index ? 'white' : 'text.primary',
                        fontSize: '13px',
                      }}
                    >
                      {product.showWithOutPrice
                        ? '-'
                        : (() => {
                            const basePrice = product.price || 0;
                            const prepaidTaxRate = product.prepaidTaxRate || 0;
                            const taxRate = product.Tax_Rate || 0;
                            const displayPrice = calculateDisplayPrice(
                              basePrice,
                              taxRate,
                              prepaidTaxRate,
                              showWithPerpaidTax
                            );
                            return `$${displayPrice.toFixed(2)}`;
                          })()}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {!product.allowToOrder ? (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: selectedIndex === index ? 'white' : 'error.main',
                        }}
                      >
                        Out of Stock
                      </Typography>
                    ) : focusedProductId === product.id ? (
                      <TextField
                        autoFocus
                        size="small"
                        type="text"
                        inputProps={{
                          inputMode: 'numeric',
                          pattern: '[0-9]*',
                          min: 1,
                        }}
                        value={quantityInput[product.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            if (!product.allowToOrder) return;
                            setQuantityInput((prev) => ({
                              ...prev,
                              [product.id]: value,
                            }));
                          }
                        }}
                        onKeyDown={(e) => handleQuantityInputKeyDown(e, product)}
                        onBlur={() => {}}
                        placeholder="Qty"
                        sx={{
                          width: 60,
                          '& .MuiInputBase-root': {
                            fontSize: '12px',
                            fontWeight: 500,
                            height: '32px',
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isSubmittingQuantity && focusedProductId === product.id && (
                                <CircularProgress size={12} sx={{ color: 'primary.main' }} />
                              )}
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                qty
                              </Typography>
                            </Box>
                          ),
                        }}
                      />
                    ) : (orderItems[product.id]?.quantity || 0) === 0 ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          width: '100%',
                          padding: '5px',
                        }}
                      >
                        <Box
                          component="img"
                          src={cart}
                          onClick={() => {
                            if (!product.allowToOrder) return;
                            if (
                              !isReturnOrder &&
                              product.hasQtyDiscount &&
                              product.qtyDiscount &&
                              onDiscountModalOpen
                            ) {
                              onDiscountModalOpen(product, product.qtyDiscount);
                            } else {
                              setFocusedProductId(product.id);
                              setQuantityInput((prev) => ({ ...prev, [product.id]: '' }));
                              focusQtyInput(product.id);
                            }
                          }}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: 'primary.main',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            padding: '2px',
                            border: selectedIndex === index ? '1px solid white' : 'none',
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': { transform: 'scale(1.1)' },
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                        <Box
                          sx={{
                            backgroundColor:
                              selectedIndex === index ? 'rgba(255, 255, 255, 0.2)' : 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: selectedIndex === index ? 'rgba(255, 255, 255, 0.3)' : 'divider',
                            padding: '4px 8px',
                            minWidth: '40px',
                            textAlign: 'center',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: '12px',
                              color: selectedIndex === index ? 'white' : 'text.primary',
                            }}
                          >
                            {orderItems[product.id]?.quantity}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </>
          )}
        </Box>
      )}

      {viewMode === 'keyboard' && totalPages && totalPages > 1 && (
        <Box
          sx={{
            py: 2,
            px: 2,
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Page {currentPage || 1} of {totalPages || 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({totalItems || 0} total items)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              disabled={currentPage === 1}
              onClick={() => {
                if (onPageChange && currentPage && currentPage > 1) {
                  onPageChange(currentPage - 1);
                }
              }}
              sx={{ minWidth: '40px', p: 1 }}
            >
              &lt;
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={currentPage >= (totalPages || 1)}
              onClick={() => {
                if (onPageChange && currentPage && currentPage < (totalPages || 1)) {
                  onPageChange(currentPage + 1);
                }
              }}
              sx={{ minWidth: '40px', p: 1 }}
            >
              &gt;
            </Button>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          mt: 1,
          py: 1,
          px: 2,
          backgroundColor: 'background.paper',
          borderRadius: '0 0 10px 10px',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          <strong>Quick Order Guide:</strong> Type to search &nbsp;→&nbsp; use <kbd>↑</kbd>/<kbd>↓</kbd> to navigate
          &nbsp;→&nbsp; <kbd>Enter</kbd> to select &nbsp;→&nbsp; type quantity &nbsp;→&nbsp; <kbd>Enter</kbd> to confirm
          &nbsp;→&nbsp; use <kbd>↑</kbd>/<kbd>↓</kbd> to continue navigating &nbsp;→&nbsp; <kbd>Esc</kbd> to exit quantity
          input.
          {totalPages && totalPages > 1 && (
            <>
              {' '}
              →&nbsp; Press <kbd>G</kbd> to go to specific page &nbsp;→&nbsp; Use <kbd>↑</kbd>/<kbd>↓</kbd> at list edges
              to navigate pages
            </>
          )}
          &nbsp;→&nbsp; Hold <kbd>↑</kbd>/<kbd>↓</kbd> for 300ms to jump to first/last &nbsp;→&nbsp; Press{' '}
          <kbd>Home</kbd>/<kbd>End</kbd> to jump to first/last
        </Typography>
      </Box>
    </Box>
  );
};

export default SalesKeyboardView;
