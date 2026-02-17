import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import formReducer from "./slices/formSlice";
import themeReducer from "./slices/themeSlice";
import authReducer from "./slices/authSlice";
import layoutReducer from "./slices/layoutSlice";
import cartReducer from "./slices/cartSlice";
import salesCartReducer from "./slices/salesCartSlice";
import globalPopupReducer from "./slices/globalPopupSlice";
import dashboardReducer from "./slices/dashboardSlice";
import salesDashboardReducer from "./slices/salesDashboardSlice";
import notificationReducer from "./slices/notificationSlice";
import navigationReducer from "./slices/navigationSlice";
import retailerRequestReducer from "./slices/retailerRequestSlice";
import orderConfirmReducer from "./slices/orderConfirmSlice";
import tradeShowReducer from "./slices/tradeShowSlice";
import retailerTradeShowCartReducer from "./slices/retailerTradeShowCartSlice";
import salesTradeShowCartReducer from "./slices/salesTradeShowCartSlice";
import { useDispatch, useSelector } from 'react-redux';

const formPersistConfig = {
  key: 'form',
  storage,
  whitelist: ['data'] // only data will be persisted
};

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'isAuthenticated', 'role', 'wareHouseDetail', 'storeDetail', 'signUpData', 'module', 'selectedCustomer', 'isSessionActive','logo', 'allowDiscount', 'discountLimit', 'allowDeliveryCharge', 'showTradeShow', 'hasMultipleStore', 'stores', 'selectedStore'] // only persist these fields
};

const salesDashboardPersistConfig = {
  key: 'salesDashboard',
  storage,
  whitelist: ['newItems', 'discountedItems', 'popularItems']
};
const dashboardPersistConfig = {
  key: 'dashboard',
  storage,
  whitelist: ['newItems', 'discountedItems', 'popularItems']
};

const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items', 'count', 'totalItems', 'totalAmountWithTax', 'totalAmount', 'userItemLimitQty', 'userLimitMinOrderAmount']
};

const salesCartPersistConfig = {
  key: 'salesCart',
  storage,
  whitelist: ['items', 'count', 'totalItems', 'totalAmountWithTax', 'totalAmount', 'userItemLimitQty', 'userLimitMinOrderAmount']
};

const tradeShowPersistConfig = {
  key: 'tradeShow',
  storage,
  whitelist: [
    'currentTradeShow',
    'selectedVendorIds',
    'createDraft',
    'activeStep',
    'selectedRetailerIds',
    'appliedItems',
    'savedTradeShowItems',
    'weekProductAssignments',
    'summaryData',
    'lastSavedVendorIds',
    'lastSavedRetailerIds',
    'lastSavedDeliveryItemNumbers',
    'lastSavedItemNumbers',
  ],
};

const persistedFormReducer = persistReducer(formPersistConfig, formReducer);
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedSalesDashboardReducer = persistReducer(salesDashboardPersistConfig, salesDashboardReducer);
const persistDashboardReducer = persistReducer(dashboardPersistConfig, dashboardReducer);
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedSalesCartReducer = persistReducer(salesCartPersistConfig, salesCartReducer);
const persistedTradeShowReducer = persistReducer(tradeShowPersistConfig, tradeShowReducer);

export const store = configureStore({
  reducer: {
    form: persistedFormReducer,
    theme: themeReducer,
    auth: persistedAuthReducer,
    layout: layoutReducer,
    cart: persistedCartReducer,
    salesCart: persistedSalesCartReducer,
    globalPopup: globalPopupReducer,
    dashboard: persistDashboardReducer,
    salesDashboard: persistedSalesDashboardReducer,
    notification: notificationReducer,
    navigation: navigationReducer,
    retailerRequest: retailerRequestReducer,
    orderConfirm: orderConfirmReducer,
    tradeShow: persistedTradeShowReducer,
    retailerTradeShowCart: retailerTradeShowCartReducer,
    salesTradeShowCart: salesTradeShowCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// For TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  return useSelector(selector);
};
