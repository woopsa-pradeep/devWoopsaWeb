# GridCardSales Component

A comprehensive component that provides three different view modes for displaying products, specifically designed for sales applications.

## Features

### View Modes

1. **Table View** - Traditional table layout with columns
2. **Grid View** - Card-based layout for visual browsing
3. **Keyboard View** - Optimized for salespeople who primarily use keyboards

### Keyboard View Features

The keyboard view is specifically designed for salespeople who need to quickly process orders using only the keyboard:

- **Search-focused**: Large, prominent search bar that auto-focuses
- **Keyboard Navigation**: Use ↑↓ arrow keys to navigate through products
- **Quick Selection**: Press Enter to select a product and add to cart
- **Quantity Input**: Direct quantity input with Enter to confirm
- **Visual Feedback**: Clear highlighting of selected items
- **Keyboard Shortcuts**: Comprehensive keyboard shortcuts for all operations

## Usage

```tsx
import GridCardSales from './component/atoms/GridCardSales';

<GridCardSales
  items={products}
  viewMode={viewMode}
  setViewMode={setViewMode}
  loading={loading}
  // Table props
  columns={columns}
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={pageSize}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  // Grid props
  xs={12}
  sm={6}
  md={6}
  lg={4}
  xl={3}
  spacing={2}
  // Keyboard view props
  onProductSelect={handleProductSelect}
  onProductClick={handleProductClick}
  onHistoryClick={handleHistoryClick}
  orderItems={orderItems}
  onQuantityChange={handleQuantityChange}
  onAddToCart={handleAddToCart}
  onQuantityInputBlur={handleQuantityInputBlur}
  searchTerm={searchTerm}
  onSearchChange={handleSearchChange}
  onClearMasterSearch={handleClearMasterSearch}
  masterSearchTerm={masterSearchTerm}
  debouncedSearchTerm={debouncedSearchTerm}
/>
```

## Keyboard View Shortcuts

| Key | Action |
|-----|--------|
| ↑ | Navigate to previous product |
| ↓ | Navigate to next product |
| Enter | Select current product / Confirm quantity |
| Escape | Cancel current action / Return to search |
| Tab | Normal tab navigation |
| Any other key | Focus search input |

## Keyboard View Workflow

1. **Search**: Type in the search bar to find products
2. **Navigate**: Use ↑↓ keys to move through results
3. **Select**: Press Enter on a product to add it to cart
4. **Quantity**: Enter quantity and press Enter to confirm
5. **Continue**: Focus automatically returns to search for next item

## Benefits for Salespeople

- **Speed**: No mouse required for most operations
- **Efficiency**: Streamlined workflow for rapid order processing
- **Accuracy**: Clear visual feedback and confirmation
- **Accessibility**: Full keyboard navigation support
- **Productivity**: Optimized for high-volume order entry

## Integration

The component integrates seamlessly with existing order management systems and maintains all existing functionality while adding the new keyboard-optimized view.

