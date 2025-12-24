import { lazyLoad } from "../utils/lazyLoadUtils";

// Lazy load all page components

// retailers
export const Dashboard = lazyLoad(
  () => import("../pages/retailer/dashboard/Dashboard"),
  "Loading Dashboard..."
);
export const Order = lazyLoad(
  () => import("../pages/retailer/order/Order"),
  "Loading Order..."
);
export const OrderTablePage = lazyLoad(
  () => import("../pages/retailer/order/OrderTablePage"),
  "Loading Order Table Page..." 
);
export const OrderDetailsPage = lazyLoad(
  () => import("../pages/retailer/order/OrderDetailsPage"),
  "Loading Order Details Page..."
);
export const OrderedItems = lazyLoad(
  () => import("../pages/retailer/order/OrderedItems"),
  "Loading Ordered Items..."
);

export const ProductCatalog = lazyLoad(
  () => import("../pages/retailer/productCatalog/ProductCatalog"),
  "Loading Product Catalog..."
);
export const ExampleForm = lazyLoad(
  () => import("../pages/exampleForm/ExampleForm"),
  "Loading Form..."
);
export const Profile = lazyLoad(
  () => import("../pages/retailer/profile/Profile"),
  "Loading Profile..."
);
export const ContactUs = lazyLoad(
  () => import("../pages/retailer/contactUs/ContactUs"),
  "Loading Contact Us..."
);
export const ProductLicense = lazyLoad(
  () => import("../pages/retailer/productLicense/ProductLicense"),
  "Loading Product License..."
);
export const TermsAndConditions = lazyLoad(
  () => import("../pages/retailer/TermsAndConditions"),
  "Loading Terms And Conditions..."
);
export const PrivacyPolicy = lazyLoad(
  () => import("../pages/retailer/PrivacyPolicy"),
  "Loading Privacy Policy..."
);    
export const Disclaimer = lazyLoad(
  () => import("../pages/retailer/Disclaimer"),
  "Loading Disclaimer..."
);
export const ReturnPolicy = lazyLoad(
  () => import("../pages/retailer/ReturnPolicy"),
  "Loading Return Policy..."
);
export const WebTermsConditions = lazyLoad(
  () => import("../pages/TermsConditions"),
  "Loading Terms & Conditions..."
);
export const WebSoftwareLicense = lazyLoad(
  () => import("../pages/SoftwareLicense"),
  "Loading Software License..."
);
export const WebPrivacyPolicy = lazyLoad(
  () => import("../pages/PrivacyPolicy"),
  "Loading Privacy Policy..."
);
export const Policies = lazyLoad(
  () => import("../pages/admin/policies/policies"),
  "Loading Policies..."
);
export const RetailerPolicies = lazyLoad(
  () => import("../pages/retailer/policies/policies"),
  "Loading Retailer Policies..."
);
export const SalesPolicies = lazyLoad(
  () => import("../pages/sales/policies/policies"),
  "Loading Sales Policies..."
);
export const AccountReceivableRetailer = lazyLoad(
  () => import("../pages/retailer/AccountReceivableRetailer"),
  "Loading Account Receivable Retailer..."
);

// admin
export const AdminDashboard = lazyLoad(
  () => import("../pages/admin/dashboard/AdminDashboard"),
  "Loading Admin Dashboard..."
);
export const SupportTickets = lazyLoad(
  () => import("../pages/admin/support-tickets/SupportTickets"),
  "Loading Support Tickets..."
);
export const Links = lazyLoad(
  () => import("../pages/admin/links/Links"),
  "Loading Links..."
);
export const AdminProduct = lazyLoad(
  () => import("../pages/admin/products/Product"),
  "Loading Product..."
);
export const AdminTrackLoginDevices = lazyLoad(
  () => import("../pages/admin/trackLoginDevices/TrackLoginDevices"),
  "Loading Admin Track Login Devices..."
);
export const AdminProfile = lazyLoad(
  () => import("../pages/admin/profile/AdminProfile"),
  "Loading Admin Profile..."
);
export const AdminRetailer = lazyLoad(
  () => import("../pages/admin/retailer/Retailer"),
  "Loading Admin Retailer..."
);
export const AddRetailer = lazyLoad(
  () => import("../pages/admin/retailer/AddRetailer"),
  "Loading Add Retailer..."
);    
export const AdminPromo = lazyLoad(
  () => import("../pages/admin/promo/Promo"),
  "Loading Admin Promo..."
);
export const AdminNotifications = lazyLoad(
  () => import("../pages/admin/notifications/Notifications"),
  "Loading Admin Notifications..."
);
export const AccountReceivable = lazyLoad(
  () => import("../pages/admin/accountReceivable/AccountReceivable"),
  "Loading Account Receivable..."
);
export const Vendors = lazyLoad(
  () => import("../pages/admin/vendor/Vendors"),
  "Loading Vendors..."
);
export const AddVendor = lazyLoad(
  () => import("../pages/admin/vendor/AddVendor"),
  "Loading Add Vendor..."
);
export const Permissions = lazyLoad(
  () => import("../pages/admin/permissions/Permissions"),
  "Loading Permissions..."
);
export const AddSalesPerson = lazyLoad(
  () => import("../pages/admin/permissions/AddSalesPerson"),
  "Loading Add Sales Person..."
);
export const Settings = lazyLoad(
  () => import("../pages/admin/settings/Settings"),
  "Loading Settings..."
);
export const ViewSalesPerson = lazyLoad(
  () => import("../pages/admin/permissions/ViewSalesPerson"),
  "Loading View Sales Person..."
);

export const EditSalesPerson = lazyLoad(
  () => import("../pages/admin/permissions/EditSalesPerson"),
  "Loading Edit Sales Person..."
);
export const AdminOrder = lazyLoad(
  () => import("../pages/admin/order/AdminOrder"),
  "Loading Admin Order..."
);
export const AdminOrderDetail = lazyLoad(
  () => import("../pages/admin/order/AdminOrderDetail"),
  "Loading Admin Order Detail..."
);
export const AdminCalender = lazyLoad(
  () => import("../pages/admin/calender/DistrubutorCalender"),
  "Loading Admin Calender..."
);
export const DistributorStatusView = lazyLoad(
  () => import("../pages/admin/calender/DistributorStatusView"),
  "Loading Distributor Status View..."
);
export const EpickSetting = lazyLoad(
  () => import("../pages/admin/epickSetting/EpickSetting"),
  "Loading Epick Setting..."
);
export const Inventory = lazyLoad(
  () => import("../pages/admin/inventory/Inventory"),
  "Loading Inventory..."
);
export const BulkUpdate = lazyLoad(
  () => import("../pages/admin/products/BulkUpdate"),
  "Loading Bulk Update..."
);
export const ReportsAnalytics = lazyLoad(
  () => import("../pages/admin/reportsAnalytics/ReportsAnalytics"),
  "Loading Reports Analytics..."
);
// sales
export const SalesDashboard = lazyLoad(
  () => import("../pages/sales/dashboard/SalesDashboard"),
  "Loading Sales Dashboard..."
);
export const SalesProfile = lazyLoad(
  () => import("../pages/sales/Profile/Profile"),
  "Loading Sales Profile..."
);
export const SalesOrder = lazyLoad(
  () => import("../pages/sales/salesOrder/Order"),
  "Loading Sales Order..."
);
export const SalesOrderTablePage = lazyLoad(
  () => import("../pages/sales/salesOrder/OrderTablePage"),
  "Loading Sales Order Table Page..."
);
export const SalesOrderDetailsPage = lazyLoad(
  () => import("../pages/sales/salesOrder/OrderDetailsPage"),
  "Loading Sales Order Details Page..."
);
export const SalesReturnOrder = lazyLoad(
  () => import("../pages/sales/salesReturnOrder/ReturnOrder"),
  "Loading Sales Return Order..."
);
export const SalesReturnOrderTablePage = lazyLoad(
  () => import("../pages/sales/salesReturnOrder/ReturnOrderTablePage"),
  "Loading Sales Return Order Table Page..."
);
export const SalesReturnOrderDetailsPage = lazyLoad(
  () => import("../pages/sales/salesReturnOrder/ReturnOrderDetailsPage"),
  "Loading Sales Return Order Details Page..."
);

export const SalesReturnCartPage = lazyLoad(
  () => import("../pages/sales/salesCart/ReturnOrderCartPage"),
  "Loading Sales Return Cart..."
);

export const SalesCartPage = lazyLoad(
  () => import("../pages/sales/salesCart/CartPage"),
  "Loading Sales Cart..."
);
export const SalesRetailer = lazyLoad(
  () => import("../pages/sales/retailer/Retailer"),
  "Loading Sales Retailer..."
);
export const SalesOrderedItems = lazyLoad(
  () => import("../pages/sales/orderedItem/OrderedItems"),
  "Loading Sales Ordered Items..."
);
export const AccountReceivableSales = lazyLoad(
  () => import("../pages/sales/account/AccountReceivable"),
  "Loading Account Receivable..."
);
export const SalesOrderConfirmation = lazyLoad(
  () => import("../pages/sales/orderConfirm/OrderConfirmation"),
  "Loading Order Confirmation..."
);
export const SalesOrderConfirmationDetail = lazyLoad(
  () => import("../pages/sales/orderConfirm/OrderConfirmationDetail"),
  "Loading Order Confirmation Detail..."
);
export const SalesCalenderPage = lazyLoad(
  () => import("../pages/sales/calender/salesCalender"),
  "Loading Sales Calender..."
);
export const OrderChecker = lazyLoad(
  () => import("../pages/sales/checker/OrderChecker"),
  "Loading Order Checker..."
);

export const SalesCalenderViewPage = lazyLoad(
  () => import("../pages/sales/calender/SalesStatusView"),
  "Loading Sales Calender View..."
);


export const Login = lazyLoad(
  () => import("../pages/auth/LoginPage"),
  "Loading Form..."
)

export const SalesLogin = lazyLoad(
  () => import("../pages/auth/SalesLogin"),
  "Loading Sales Login..."
);

export const SignUp = lazyLoad(
  () => import("../pages/auth/SignUp"),
  "Loading Form..."
);
export const SignupOtp = lazyLoad(
  () => import("../pages/auth/SignupOtp"),
  "Loading Form..."
);
export const LoginOtp = lazyLoad(
  () => import("../pages/auth/OtpLoginPage"),
  "Loading Form..."
);;
export const OTPVerification = lazyLoad(
  () => import("../pages/auth/OTPVerification"),
  "Loading Form..."
);
export const ForgotPassword = lazyLoad(
  () => import("../pages/auth/ForgotPasswordPage"),
  "Loading Form..."
);
export const ResetPasswordPage = lazyLoad(
  () => import("../pages/auth/ResetPasswordPage"),
  "Loading Form..."
);
export const WarehouseSelection = lazyLoad(
  () => import("../pages/auth/WarehouseSelection"),
  "Loading Form..."
);

export const CartPage = lazyLoad(
  () => import("../pages/retailer/cart/CartPage"),
  "Loading Cart..."
);

export const RolesPermissionsPage = lazyLoad(
  () => import("../pages/admin/permissions/RolesPermissionsPage"),
  "Loading Roles & Permissions Page..."
);
export const Products = lazyLoad(
  () => import("../pages/Products"),
  "Loading Products..."
);
export const LandingPage = lazyLoad(
  () => import("../pages/LandingPage"),
  "Loading Landing Page..."
);
export const RetailerRequest = lazyLoad(
  () => import("../pages/admin/retailerRequest/RetilerRequest"),
  "Loading Retailer Request..."
);
export const AddUpdateRequest = lazyLoad(
  () => import("../pages/admin/retailerRequest/AddUpdateRequest"),
  "Loading Add Update Request..."
);
export const ViewRetailerRequest = lazyLoad(
  () => import("../pages/admin/retailerRequest/ViewRetailerRequest"),
  "Loading View Retailer Request..."
);    
export const ContactUsRequestForm = lazyLoad(
  () => import("../pages/ContactUsRequestForm"),
  "Loading Contact Us Request Form..."
);

// Add more lazy-loaded components as needed
// export const AnotherPage = lazyLoad(
//   () => import("../pages/anotherPage/AnotherPage"),
//   "Loading Another Page..."
// ); 