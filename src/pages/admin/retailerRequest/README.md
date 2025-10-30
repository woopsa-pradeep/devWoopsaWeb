# Retailer Request Management System

This system provides comprehensive management of retailer requests with a modern, responsive interface built using React, Material-UI, and TypeScript.

## Features

### Main Listing Page (`RetilerRequest.tsx`)
- **Data Table**: Displays all retailer requests with pagination
- **Search & Filters**: Search by business name, contact, email; filter by status and business type
- **Actions**: View, Edit, Update Status, and Delete requests
- **Responsive Design**: Works on all screen sizes
- **Real-time Updates**: Automatic refresh after actions

### Add/Update Form (`AddUpdateRequest.tsx`)
- **Comprehensive Form**: All fields from the schema with proper validation
- **Accordion Layout**: Organized sections for better user experience
- **Dynamic Fields**: Add/remove owners and references dynamically
- **File Uploads**: Support for document uploads
- **Conditional Logic**: Mailing address automatically copies from physical address
- **Form Validation**: Zod schema validation with error messages

### Schema (`retailerRequestSchema.ts`)
- **Zod Validation**: Type-safe validation using Zod
- **Comprehensive Fields**: Business info, contact details, addresses, licenses, owners, references
- **Type Safety**: Full TypeScript support with inferred types

## Components Used

The system leverages existing common components:

- **CommonTable**: For data display with pagination
- **TextInput**: For text fields with validation
- **SelectInput**: For dropdown selections
- **CheckboxInput**: For boolean inputs
- **SwitchInput**: For toggle switches
- **FileUploadInput**: For file uploads
- **CustomButton**: For consistent button styling
- **CommonModal**: For confirmation dialogs

## API Integration

Uses the existing `retailerApis.ts` for:
- `getAllRetailerRequests`: Fetch paginated list with filters
- `createRetailerRequest`: Create new requests
- `updateRetailerRequest`: Update existing requests
- `getRetailerRequestById`: Fetch single request for editing
- `deleteRetailerRequest`: Delete requests
- `updateRetailerRequestStatus`: Update request status

## Usage

### Navigation
- **Main List**: `/admin/retailer-requests`
- **Add New**: `/admin/retailer-requests/add`
- **Edit**: `/admin/retailer-requests/edit/:id`
- **View**: `/admin/retailer-requests/view/:id`

### Form Sections
1. **Basic Information**: Business name, type, EIN, ownership
2. **Contact Information**: Primary contact, phone, email, website
3. **Physical Address**: Street, city, state, ZIP, county
4. **Mailing Address**: Optional, can copy from physical
5. **Licenses & Permits**: Tax ID, tobacco licenses
6. **Document Uploads**: Certificates, licenses, IDs
7. **Owners**: Dynamic list with full details
8. **Financial Information**: Credit limit, bank details
9. **References**: Dynamic list of business references
10. **Additional Notes**: Free-form text area

### Validation Rules
- Required fields: Business name, business type, primary contact, physical address
- Optional fields: DBA name, EIN, phone, email, website
- Conditional fields: Mailing address (when different from physical)
- Dynamic arrays: Owners and references with individual validation

## Styling & Theme

- Uses Material-UI theme system
- Consistent with existing application design
- Responsive grid layout
- Accordion sections for better organization
- Proper spacing and typography hierarchy

## Error Handling

- Form validation errors displayed inline
- API error handling with toast notifications
- Loading states for all async operations
- Graceful fallbacks for missing data

## Performance Features

- Lazy loading of form sections
- Debounced search input
- Efficient pagination
- Optimized re-renders with React Hook Form

## Future Enhancements

- Bulk operations (approve/reject multiple requests)
- Advanced filtering and sorting
- Export functionality (PDF, Excel)
- Email notifications
- Workflow automation
- Audit trail logging
