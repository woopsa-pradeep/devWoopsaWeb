import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Switch,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JsBarcode = require('jsbarcode');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { getPicklistTemplate, savePicklistTemplate, updatePicklistTemplate } from '../../../redux/apis/distrubutor/settingApis';
import toast from 'react-hot-toast';

// Field definitions for picklist - Line Number, Description, Ordered Qty and Scanned Qty are compulsory
const PICKLIST_FIELDS = [
  { key: 'lineNumber', label: 'Line #', required: true },
  { key: 'orderedQty', label: 'Ord Qty', required: true },
  { key: 'scannedQty', label: 'Qty', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'itemNumber', label: 'Item Number' },
  { key: 'pack', label: 'Pack' },
  { key: 'size', label: 'Size' },
  { key: 'upc', label: 'UPC' },
  // { key: 'onhand', label: 'On Hand' }, // Commented out for now - may come in future API updates
  { key: 'salesCategory', label: 'Sales Category' },
  { key: 'priceClass', label: 'Price Class' },
  { key: 'section', label: 'Section' },
  { key: 'location', label: 'Location' },
  { key: 'vendorItem', label: 'Vendor Item' },
  { key: 'sequence', label: 'Sequence' },
];

// Static sample data for preview
const SAMPLE_CUSTOMER = {
  number: 2290,
  name: 'WOOPSA',
  address: '500 JAMISON TEST STREET XX 12345',
  phone: '1234567890',
  route: 0,
  stop: 0,
};

const SAMPLE_DISTRIBUTOR = {
  name: 'WOOPSA TEST',
  address: '500 JAMISON TEST STREET XX 12345',
};

const SAMPLE_ITEMS = [
  { lineNumber: 1, orderedQty: 1.00, scannedQty: '', itemNumber: 44077, description: 'GAME 2/129 MVP WATERMELON 30CT', pack: 1, size: 'BOX', upc: '123456789012', salesCategory: 'Cigarettes', priceClass: 'A', section: '01', location: 'A1', vendorItem: 'V001', sequence: 1 },
  { lineNumber: 2, orderedQty: 2.00, scannedQty: '', itemNumber: 41742, description: 'DUTCH 2/129 COCOA 2PKT 30CT', pack: 1, size: 'BOX', upc: '123456789013', salesCategory: 'Cigarettes', priceClass: 'A', section: '01', location: 'A2', vendorItem: 'V002', sequence: 2 },
  { lineNumber: 3, orderedQty: 3.00, scannedQty: '', itemNumber: 44013, description: 'SWISHER 2/1.39 RED 30CT', pack: 1, size: 'BOX', upc: '123456789014', salesCategory: 'Cigars', priceClass: 'B', section: '02', location: 'B1', vendorItem: 'V003', sequence: 3 },
  { lineNumber: 4, orderedQty: 1.00, scannedQty: '', itemNumber: 44018, description: 'SWISHER 2/1.39 GRAPE 30CT', pack: 1, size: 'BOX', upc: '123456789015', salesCategory: 'Cigars', priceClass: 'B', section: '02', location: 'B2', vendorItem: 'V004', sequence: 4 },
  { lineNumber: 5, orderedQty: 1.00, scannedQty: '', itemNumber: 44006, description: 'SWISHER 2/1.19 HONEY BANANA 30CT', pack: 1, size: 'BOX', upc: '123456789016', salesCategory: 'Cigars', priceClass: 'C', section: '02', location: 'B3', vendorItem: 'V005', sequence: 5 },
  { lineNumber: 6, orderedQty: 1.00, scannedQty: '', itemNumber: 42016, description: 'SWISHER 2/1.39 CREAM 30CT', pack: 1, size: 'BOX', upc: '123456789017', salesCategory: 'Cigars', priceClass: 'B', section: '02', location: 'B4', vendorItem: 'V006', sequence: 6 },
  { lineNumber: 7, orderedQty: 1.00, scannedQty: '', itemNumber: 41592, description: 'GAME 2/129 DIAMOND 30CT', pack: 30, size: 'BOX', upc: '123456789018', salesCategory: 'Cigarettes', priceClass: 'A', section: '01', location: 'A3', vendorItem: 'V007', sequence: 7 },
  { lineNumber: 8, orderedQty: 1.00, scannedQty: '', itemNumber: 43041, description: 'WHITE OWL 2/119 PINEAPPLE 30CT', pack: 30, size: 'BOX', upc: '123456789019', salesCategory: 'Cigars', priceClass: 'C', section: '02', location: 'B5', vendorItem: 'V008', sequence: 8 },
  { lineNumber: 9, orderedQty: 2.00, scannedQty: '', itemNumber: 44020, description: 'SWISHER 2/1.39 SWEET 30CT', pack: 1, size: 'BOX', upc: '123456789020', salesCategory: 'Cigars', priceClass: 'B', section: '02', location: 'B6', vendorItem: 'V009', sequence: 9 },
  { lineNumber: 10, orderedQty: 3.00, scannedQty: '', itemNumber: 44021, description: 'GAME 2/129 BLUE 30CT', pack: 1, size: 'BOX', upc: '123456789021', salesCategory: 'Cigarettes', priceClass: 'A', section: '01', location: 'A4', vendorItem: 'V010', sequence: 10 },
  { lineNumber: 11, orderedQty: 1.00, scannedQty: '', itemNumber: 44022, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789022', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 12, orderedQty: 2.00, scannedQty: '', itemNumber: 44023, description: 'SWISHER 2/1.39 CHERRY 30CT', pack: 1, size: 'BOX', upc: '123456789023', salesCategory: 'Cigars', priceClass: 'B', section: '02', location: 'B7', vendorItem: 'V012', sequence: 12 },
  { lineNumber: 13, orderedQty: 1.00, scannedQty: '', itemNumber: 44024, description: 'GAME 2/129 GREEN 30CT', pack: 1, size: 'BOX', upc: '123456789024', salesCategory: 'Cigarettes', priceClass: 'A', section: '01', location: 'A6', vendorItem: 'V013', sequence: 13 },
  { lineNumber: 14, orderedQty: 4.00, scannedQty: '', itemNumber: 44025, description: 'WHITE OWL 2/119 STRAWBERRY 30CT WHITE OWL 2/119 STRAWBERRY 30CTWHITE OWL 2/119 STRAWBERRY 30CTWHITE OWL 2/119 STRAWBERRY 30CT', pack: 30, size: 'BOX', upc: '123456789025', salesCategory: 'Cigars', priceClass: 'C', section: '02', location: 'B8', vendorItem: 'V014', sequence: 14 },
  { lineNumber: 15, orderedQty: 2.00, scannedQty: '', itemNumber: 44026, description: 'SWISHER 2/1.39 PEACH 30CT', pack: 1, size: 'BOX', upc: '123456789026', salesCategory: 'Cigars', priceClass: 'B', section: '02', location: 'B9', vendorItem: 'V015', sequence: 15 },
  { lineNumber: 16, orderedQty: 1.00, scannedQty: '', itemNumber: 44027, description: 'DUTCH 2/129 ORIGINAL 30CT', pack: 1, size: 'BOX', upc: '123456789027', salesCategory: 'Cigarettes', priceClass: 'A', section: '01', location: 'A7', vendorItem: 'V016', sequence: 16 },
  { lineNumber: 17, orderedQty: 3.00, scannedQty: '', itemNumber: 44028, description: 'GAME 2/129 RED 30CT', pack: 1, size: 'BOX', upc: '123456789028', salesCategory: 'Cigarettes', priceClass: 'A', section: '01', location: 'A8', vendorItem: 'V017', sequence: 17 },
  { lineNumber: 18, orderedQty: 2.00, scannedQty: '', itemNumber: 44029, description: 'SWISHER 2/1.39 APPLE 30CT', pack: 1, size: 'BOX', upc: '123456789029', salesCategory: 'Cigars', priceClass: 'B', section: '02', location: 'B10', vendorItem: 'V018', sequence: 18 },
  { lineNumber: 19, orderedQty: 1.00, scannedQty: '', itemNumber: 44030, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789030', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 20, orderedQty: 1.00, scannedQty: '', itemNumber: 44031, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789031', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 21, orderedQty: 1.00, scannedQty: '', itemNumber: 44032, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789032', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 22, orderedQty: 1.00, scannedQty: '', itemNumber: 44033, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789033', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 23, orderedQty: 1.00, scannedQty: '', itemNumber: 44034, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789034', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 24, orderedQty: 1.00, scannedQty: '', itemNumber: 44035, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789035', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 25, orderedQty: 1.00, scannedQty: '', itemNumber: 44036, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789036', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 26, orderedQty: 1.00, scannedQty: '', itemNumber: 44037, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789037', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 27, orderedQty: 1.00, scannedQty: '', itemNumber: 44038, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789038', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 28, orderedQty: 1.00, scannedQty: '', itemNumber: 44039, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789039', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 29, orderedQty: 1.00, scannedQty: '', itemNumber: 44040, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789040', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 30, orderedQty: 1.00, scannedQty: '', itemNumber: 44041, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789041', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 31, orderedQty: 1.00, scannedQty: '', itemNumber: 44042, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789042', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 32, orderedQty: 1.00, scannedQty: '', itemNumber: 44043, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789043', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 33, orderedQty: 1.00, scannedQty: '', itemNumber: 44044, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789044', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 34, orderedQty: 1.00, scannedQty: '', itemNumber: 44045, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789045', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 35, orderedQty: 1.00, scannedQty: '', itemNumber: 44046, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789046', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 36, orderedQty: 1.00, scannedQty: '', itemNumber: 44047, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789047', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 37, orderedQty: 1.00, scannedQty: '', itemNumber: 44048, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789048', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 38, orderedQty: 1.00, scannedQty: '', itemNumber: 44049, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789049', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 39, orderedQty: 1.00, scannedQty: '', itemNumber: 44050, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789050', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 40, orderedQty: 1.00, scannedQty: '', itemNumber: 44051, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789051', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 41, orderedQty: 1.00, scannedQty: '', itemNumber: 44052, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789052', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 42, orderedQty: 1.00, scannedQty: '', itemNumber: 44053, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789053', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
  { lineNumber: 43, orderedQty: 1.00, scannedQty: '', itemNumber: 44054, description: 'DUTCH 2/129 MENTHOL 30CT', pack: 1, size: 'BOX', upc: '123456789054', salesCategory: 'cigars', priceClass: 'A', section: '01', location: 'A5', vendorItem: 'V011', sequence: 11 },
];

// Template interface
interface PicklistTemplate {
  id: string;
  name: string;
  selectedFields: { [key: string]: boolean };
  groupBy: 'salesCategory' | 'priceClass' | 'section' | 'location' | 'sectionSalesCategory' | 'locationSalesCategory' | 'sequence' | 'sequenceSalesCategory' | '';
  newCategoryOnNewPage: boolean;
  headerPosition: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  footerPosition: 'left' | 'right';
  pickedByPosition: 'top' | 'bottom';
  checkedByPosition: 'top' | 'bottom';
  // Header options
  showBarcode?: boolean;
  // Footer options - all configurable
  showTotalCartons?: boolean;
  showTotalPieces?: boolean;
  showTotalLines?: boolean;
  showPickedBy?: boolean;
  showCheckedBy?: boolean;
  showBundles?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Storage key for localStorage
const STORAGE_KEY = 'picklist_templates';

// Template storage abstraction (easy to switch to API later)
const templateStorage = {
  // Get all templates
  getAll: (): PicklistTemplate[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  },

  // Save template
  save: (template: PicklistTemplate): void => {
    try {
      const templates = templateStorage.getAll();
      const existingIndex = templates.findIndex(t => t.id === template.id);
      
      if (existingIndex >= 0) {
        templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
      } else {
        templates.push({ ...template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  // Delete template
  delete: (id: string): void => {
    try {
      const templates = templateStorage.getAll();
      const filtered = templates.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // Get template by ID
  getById: (id: string): PicklistTemplate | null => {
    const templates = templateStorage.getAll();
    return templates.find(t => t.id === id) || null;
  },

  // Get template by name
  getByTemplateName: (name: string): PicklistTemplate | null => {
    const templates = templateStorage.getAll();
    return templates.find(t => t.name === name) || null;
  },
};

// Future API integration (commented out for now)
// const templateApi = {
//   getAll: async (): Promise<PicklistTemplate[]> => {
//     const response = await fetch('/api/picklist-templates');
//     return response.json();
//   },
//   save: async (template: PicklistTemplate): Promise<PicklistTemplate> => {
//     const response = await fetch('/api/picklist-templates', {
//       method: template.id ? 'PUT' : 'POST',
//       body: JSON.stringify(template),
//     });
//     return response.json();
//   },
//   delete: async (id: string): Promise<void> => {
//     await fetch(`/api/picklist-templates/${id}`, { method: 'DELETE' });
//   },
// };

const PicklistTemplateTab: React.FC = () => {
  const theme = useTheme();
  
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({
    lineNumber: true,
    orderedQty: true,
    scannedQty: true,
    description: true,
    itemNumber: true,
    pack: true,
    size: true,
  });
  
  const [groupBy, setGroupBy] = useState<'salesCategory' | 'priceClass' | 'section' | 'location' | 'sectionSalesCategory' | 'locationSalesCategory' | 'sequence' | 'sequenceSalesCategory' | ''>('');
  const [newCategoryOnNewPage, setNewCategoryOnNewPage] = useState(false);
  // Header is always topRight, Footer is always bottom center - no need for state
  const [pickedByPosition, setPickedByPosition] = useState<'top' | 'bottom'>('top');
  const [checkedByPosition, setCheckedByPosition] = useState<'top' | 'bottom'>('top');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Header options
  const [showBarcode, setShowBarcode] = useState(true);
  
  // Footer options - all configurable
  const [showTotalCartons, setShowTotalCartons] = useState(true);
  const [showTotalPieces, setShowTotalPieces] = useState(true);
  const [showTotalLines, setShowTotalLines] = useState(true);
  const [showPickedBy, setShowPickedBy] = useState(true);
  const [showCheckedBy, setShowCheckedBy] = useState(true);
  const [showBundles, setShowBundles] = useState(true);
  
  // Static preview data (not saved in templates)
  const invoiceNumber = '474537';
  const isReprint = true;
  const orderNumber = '174527';
  const invoiceDate = '12/23/2025';

  // Generate template name from groupBy
  const getTemplateName = (groupByValue: string): string => {
    if (!groupByValue || groupByValue === 'none') return 'tempNone';
    // Convert camelCase to PascalCase and add "temp" prefix
    // Examples: salesCategory -> tempSalesCategory, sectionSalesCategory -> tempSectionSalesCategory
    const firstChar = groupByValue.charAt(0).toUpperCase();
    const rest = groupByValue.slice(1);
    return `temp${firstChar}${rest}`;
  };

  // Get current template name
  const currentTemplateName = groupBy ? getTemplateName(groupBy) : '';
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);

  // Load template from API on component mount
  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      try {
        const response: any = await getPicklistTemplate();
        const responseData = response?.data;
        
        // Handle new API response structure: { success, message, data: { picklists: [...] } }
        const picklists = responseData?.picklists || [];
        
        if (picklists.length > 0) {
          // There is one template in the array
          const templateData = picklists[0];
          
          // Store template ID for updates
          if (templateData.id) {
            setCurrentTemplateId(String(templateData.id));
          }
          
          // Set groupBy first (this will trigger template loading)
          // Convert 'none' back to empty string for UI (RadioGroup uses '' for "None")
          if (templateData.groupBy) {
            setGroupBy(templateData.groupBy === 'none' ? '' : templateData.groupBy);
          }
          
          // Set all other fields - filter out invalid fields (like unitCost, extendedCost, retail)
          if (templateData.selectedFields) {
            const validFieldKeys = PICKLIST_FIELDS.map(f => f.key);
            const cleanedSelectedFields: { [key: string]: boolean } = {};
            Object.keys(templateData.selectedFields).forEach(key => {
              if (validFieldKeys.includes(key)) {
                cleanedSelectedFields[key] = templateData.selectedFields[key];
              }
            });
            setSelectedFields(cleanedSelectedFields);
          }
          if (templateData.newCategoryOnNewPage !== undefined) {
            setNewCategoryOnNewPage(templateData.newCategoryOnNewPage);
          }
          // Header and footer positions are fixed - no need to load
          if (templateData.pickedByPosition) {
            setPickedByPosition(templateData.pickedByPosition);
          }
          if (templateData.checkedByPosition) {
            setCheckedByPosition(templateData.checkedByPosition);
          }
          // Load header options
          if (templateData.showBarcode !== undefined) {
            setShowBarcode(templateData.showBarcode);
          }
          // Load footer options
          if (templateData.showTotalCartons !== undefined) {
            setShowTotalCartons(templateData.showTotalCartons);
          }
          if (templateData.showTotalPieces !== undefined) {
            setShowTotalPieces(templateData.showTotalPieces);
          }
          if (templateData.showTotalLines !== undefined) {
            setShowTotalLines(templateData.showTotalLines);
          }
          if (templateData.showPickedBy !== undefined) {
            setShowPickedBy(templateData.showPickedBy);
          }
          if (templateData.showCheckedBy !== undefined) {
            setShowCheckedBy(templateData.showCheckedBy);
          }
          if (templateData.showBundles !== undefined) {
            setShowBundles(templateData.showBundles);
          }
        } else {
          // No template exists - reset ID so POST will be used
          setCurrentTemplateId(null);
        }
      } catch (error) {
        console.error('Error loading template:', error);
        // If no template exists, use defaults (already set in initial state)
        setCurrentTemplateId(null);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, []);

  // Load template when groupBy changes (from localStorage as fallback)
  useEffect(() => {
    if (!groupBy) {
      // Reset to defaults when no groupBy selected
      setSelectedFields({
        lineNumber: true,
        orderedQty: true,
        scannedQty: true,
        description: true,
        itemNumber: true,
        pack: true,
        size: true,
      });
      setNewCategoryOnNewPage(false);
      setPickedByPosition('top');
      setCheckedByPosition('top');
      return;
    }

    // Try to load from localStorage as fallback (for backward compatibility)
    const templateName = getTemplateName(groupBy);
    const template = templateStorage.getByTemplateName(templateName);
    if (template) {
      setSelectedFields(template.selectedFields);
      setNewCategoryOnNewPage(template.newCategoryOnNewPage);
      setPickedByPosition(template.pickedByPosition || 'top');
      setCheckedByPosition(template.checkedByPosition || 'top');
    }
  }, [groupBy]);

  // Save template to API
  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const templateName = getTemplateName(groupBy || '');
      // Clean selectedFields to only include valid fields
      const validFieldKeys = PICKLIST_FIELDS.map(f => f.key);
      const cleanedSelectedFields: { [key: string]: boolean } = {};
      Object.keys(selectedFields).forEach(key => {
        if (validFieldKeys.includes(key)) {
          cleanedSelectedFields[key] = selectedFields[key];
        }
      });
      const templateData = {
        name: templateName,
        selectedFields: cleanedSelectedFields,
        groupBy: groupBy || 'none',
        newCategoryOnNewPage: newCategoryOnNewPage || false, // Explicitly include false
        headerPosition: 'topRight', // Always top right
        footerPosition: 'left', // Always bottom center (left is default, but footer is centered)
        pickedByPosition,
        checkedByPosition,
        showBarcode: showBarcode !== undefined ? showBarcode : true, // Explicitly include false
        showTotalCartons: showTotalCartons !== undefined ? showTotalCartons : true, // Explicitly include false
        showTotalPieces: showTotalPieces !== undefined ? showTotalPieces : true, // Explicitly include false
        showTotalLines: showTotalLines !== undefined ? showTotalLines : true, // Explicitly include false
        showPickedBy: showPickedBy !== undefined ? showPickedBy : true, // Explicitly include false
        showCheckedBy: showCheckedBy !== undefined ? showCheckedBy : true, // Explicitly include false
        showBundles: showBundles !== undefined ? showBundles : true, // Explicitly include false
      };

      // Use PUT (update) if template ID exists, otherwise POST (create)
      if (currentTemplateId) {
        await updatePicklistTemplate(currentTemplateId, templateData);
        toast.success('Template updated successfully');
      } else {
        const response: any = await savePicklistTemplate(templateData);
        // Store the ID if returned from create
        // Response structure: { success, message, data: { id, ... } }
        const createdTemplate = response?.data;
        if (createdTemplate?.id) {
          setCurrentTemplateId(String(createdTemplate.id));
        }
        toast.success('Template saved successfully');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error?.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Get template data for API (this will be called when generating PDF or exporting)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTemplateDataForAPI = () => {
    return {
      templateName: currentTemplateName,
      fields: Object.keys(selectedFields).filter(key => selectedFields[key]),
      groupBy,
      newCategoryOnNewPage,
      headerPosition: 'topRight', // Always top right
      footerPosition: 'left', // Always bottom center
      pickedByPosition,
      checkedByPosition,
    };
  };


  const handleFieldToggle = (field: string, checked: boolean) => {
    // Ordered Qty and Scanned Qty are always required and together
    if (field === 'orderedQty' || field === 'scannedQty') {
      // If one is toggled, toggle both together
      setSelectedFields(prev => ({
        ...prev,
        orderedQty: checked,
        scannedQty: checked
      }));
    } else {
      setSelectedFields(prev => ({
        ...prev,
        [field]: checked
      }));
    }
  };

  // Generate barcode as data URL
  const generateBarcodeDataUrl = (text: string): string | null => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 1.5,
        height: 30,
        displayValue: true,
        fontSize: 10,
        margin: 2,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      return null;
    }
  };

  // Load logo as data URL
  const loadLogoAsDataUrl = async (): Promise<string | null> => {
    try {
      return new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width || 40;
              canvas.height = img.height || 33;
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Error converting logo to canvas:', error);
            resolve(null);
          }
        };
        
        img.onerror = async () => {
          try {
            const logoPath = rabbitLogo;
            if (typeof rabbitLogo === 'string' && !rabbitLogo.startsWith('data:') && !rabbitLogo.startsWith('http')) {
              const response = await fetch(logoPath);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    resolve(reader.result);
                  } else {
                    resolve(null);
                  }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
                return;
              }
            }
            
            const publicResponse = await fetch('/Rabbit.svg');
            if (publicResponse.ok) {
              const blob = await publicResponse.blob();
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  resolve(null);
                }
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            } else {
              resolve(null);
            }
          } catch (fetchError) {
            console.error('Error fetching logo:', fetchError);
            resolve(null);
          }
        };
        
        if (typeof rabbitLogo === 'string') {
          img.src = rabbitLogo;
        } else {
          img.src = rabbitLogo as string;
        }
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  // Add footer to PDF - "Generated by Woopsa" centered above footer with margin
  const addFooterToPage = (doc: jsPDF, logoDataUrl?: string) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // "Generated by Woopsa" text - centered at very bottom with proper margin
    const generatedByY = pageHeight - 5; // Very close to bottom, but with margin
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const text = 'Picklist Generated by Woopsa';
    const textWidth = doc.getTextWidth(text);
    const textX = (pageWidth - textWidth) / 2; // Center horizontally
    
    doc.text(text, textX, generatedByY);
    
    // Logo next to text
    if (logoDataUrl) {
      try {
        const logoWidth = 4;
        const logoHeight = 4;
        const logoSpacing = 1.5;
        const logoX = textX + textWidth + logoSpacing;
        const logoY = generatedByY - 3.5;
        
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch {
          try {
            doc.addImage(logoDataUrl, 'SVG', logoX, logoY, logoWidth, logoHeight);
          } catch {
            doc.addImage(logoDataUrl, logoX, logoY, logoWidth, logoHeight);
          }
        }
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
  };

  // Add full header information to each page
  const addFullHeaderToPage = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const headerStartY = 8;
    const yPos = headerStartY + 4;
    
    // Page number at top right (above header box)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const pageText = `Page ${pageNum} of ${totalPages}`;
    const textWidth = doc.getTextWidth(pageText);
    doc.text(pageText, pageWidth - margin - textWidth, 6);
    
    // Calculate column widths (3 columns: left, middle, right)
    const leftColumnWidth = (pageWidth - (margin * 2)) * 0.35; // 35% for customer info
    const middleColumnWidth = (pageWidth - (margin * 2)) * 0.30; // 30% for barcode
    const leftX = margin + 2;
    const middleX = margin + leftColumnWidth + 5;
    const rightX = pageWidth - margin - 2;
    
    // First, calculate the header height by simulating content positions
    // This is needed to draw the background box first
    let estimatedRightHeight = 4; // Date
    estimatedRightHeight += 3.8; // Doc
    estimatedRightHeight += 3.8; // Order
    estimatedRightHeight += 4.5; // Distributor
    if (isReprint) estimatedRightHeight += 5;
    if (pickedByPosition === 'top' && showPickedBy) estimatedRightHeight += 5;
    if (checkedByPosition === 'top' && showCheckedBy) estimatedRightHeight += 5;
    
    let estimatedLeftHeight = 5; // Title spacing
    estimatedLeftHeight += 4.5; // Customer Information label
    estimatedLeftHeight += 3.5; // ID
    estimatedLeftHeight += 3.5; // Name
    estimatedLeftHeight += 3.5; // Address
    if (SAMPLE_CUSTOMER.phone) estimatedLeftHeight += 3.5; // Phone
    estimatedLeftHeight += 3.5; // Route/Stop
    
    const estimatedBarcodeHeight = 15; // Barcode height
    const estimatedMaxHeight = Math.max(estimatedLeftHeight, estimatedRightHeight, estimatedBarcodeHeight);
    const estimatedHeaderBoxHeight = estimatedMaxHeight + 8; // Add padding
    
    // Draw header background box FIRST (before content)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, headerStartY, pageWidth - (margin * 2), estimatedHeaderBoxHeight, 1, 1, 'F');
    
    // Track actual Y positions as we render content
    let leftYPos = yPos;
    let rightYPos = yPos;
    let maxYPos = yPos;
    
    // Main title - PICKLIST (bold, larger) - Left column
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('PICKLIST', leftX, leftYPos);
    maxYPos = Math.max(maxYPos, leftYPos);
    
    // Middle column: Barcode of order number (doc number)
    let barcodeBottomY = yPos;
    if (showBarcode && orderNumber) {
      const barcodeDataUrl = generateBarcodeDataUrl(orderNumber);
      if (barcodeDataUrl) {
        try {
          const barcodeWidth = 25;
          const barcodeHeight = 15;
          const barcodeX = middleX + (middleColumnWidth - barcodeWidth) / 2;
          const barcodeY = yPos - 2;
          doc.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
          barcodeBottomY = barcodeY + barcodeHeight;
          maxYPos = Math.max(maxYPos, barcodeBottomY);
        } catch (error) {
          console.error('Error adding barcode to PDF:', error);
        }
      }
    }
    
    // Right side: Document information section
    // Date
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Date:', rightX - 35, rightYPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceDate, rightX, rightYPos, { align: 'right' });
    rightYPos += 3.8;
    maxYPos = Math.max(maxYPos, rightYPos);
    
    // Doc Number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    // doc.text('Doc:', rightX - 35, rightYPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceNumber, rightX, rightYPos, { align: 'right' });
    rightYPos += 3.8;
    maxYPos = Math.max(maxYPos, rightYPos);
    
    // Order Number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Order:', rightX - 35, rightYPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(orderNumber, rightX, rightYPos, { align: 'right' });
    rightYPos += 3.8;
    maxYPos = Math.max(maxYPos, rightYPos);
    
    // Distributor
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Distributor:', rightX - 35, rightYPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.text(SAMPLE_DISTRIBUTOR.name, rightX, rightYPos, { align: 'right' });
    rightYPos += 4.5;
    maxYPos = Math.max(maxYPos, rightYPos);
    
    // REPRINT badge
    if (isReprint) {
      doc.setFillColor(255, 240, 240);
      doc.setDrawColor(220, 0, 0);
      doc.setLineWidth(0.3);
      const reprintWidth = 20;
      const reprintX = rightX - reprintWidth;
      doc.roundedRect(reprintX, rightYPos - 3, reprintWidth, 4, 1, 1, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0);
      doc.text('REPRINT', rightX - reprintWidth / 2, rightYPos, { align: 'center' });
      rightYPos += 5;
      maxYPos = Math.max(maxYPos, rightYPos);
    }
    
    // Picked by and Checked by (right side, top position)
    if ((pickedByPosition === 'top' && showPickedBy) || 
        (checkedByPosition === 'top' && showCheckedBy)) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      if (pickedByPosition === 'top' && showPickedBy) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('Picked by:', rightX - 35, rightYPos, { align: 'right' });
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(rightX - 30, rightYPos + 2, rightX, rightYPos + 2);
        rightYPos += 5;
        maxYPos = Math.max(maxYPos, rightYPos);
      }
      if (checkedByPosition === 'top' && showCheckedBy) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('Checked by:', rightX - 35, rightYPos, { align: 'right' });
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(rightX - 30, rightYPos + 2, rightX, rightYPos + 2);
        rightYPos += 5;
        maxYPos = Math.max(maxYPos, rightYPos);
      }
    }
    
    // Left side: Customer information section
    leftYPos += 5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Customer Information', leftX, leftYPos);
    leftYPos += 4.5;
    maxYPos = Math.max(maxYPos, leftYPos);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Customer details with labels
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('ID:', leftX, leftYPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(SAMPLE_CUSTOMER.number), leftX + 8, leftYPos);
    leftYPos += 3.5;
    maxYPos = Math.max(maxYPos, leftYPos);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Name:', leftX, leftYPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(SAMPLE_CUSTOMER.name, leftX + 12, leftYPos);
    leftYPos += 3.5;
    maxYPos = Math.max(maxYPos, leftYPos);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Address:', leftX, leftYPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(SAMPLE_CUSTOMER.address, leftX + 15, leftYPos);
    leftYPos += 3.5;
    maxYPos = Math.max(maxYPos, leftYPos);
    
    if (SAMPLE_CUSTOMER.phone) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Phone:', leftX, leftYPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(SAMPLE_CUSTOMER.phone, leftX + 12, leftYPos);
      leftYPos += 3.5;
      maxYPos = Math.max(maxYPos, leftYPos);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Route:', leftX, leftYPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(SAMPLE_CUSTOMER.route), leftX + 12, leftYPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Stop:', leftX + 35, leftYPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(SAMPLE_CUSTOMER.stop), leftX + 42, leftYPos);
    maxYPos = Math.max(maxYPos, leftYPos);
    
    // Calculate actual header box height based on rendered content
    const actualContentHeight = maxYPos - headerStartY;
    const headerBoxHeight = Math.max(actualContentHeight + 8, estimatedHeaderBoxHeight); // Use actual or estimated, whichever is larger
    
    // Add divider below header (dark color like footer)
    const dividerY = headerStartY + headerBoxHeight + 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, dividerY, pageWidth - margin, dividerY);
    
    // Return the bottom position of header (divider + spacing) for table positioning
    return dividerY + 4; // Divider + spacing
  };

  // Natural/alphanumeric sort function for mixed alphanumeric strings (e.g., D, D01, DD2, DE1)
  const naturalSort = (a: string, b: string): number => {
    // If both are numeric, sort numerically
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    // Natural sort for alphanumeric strings
    const aParts = a.match(/(\d+|\D+)/g) || [];
    const bParts = b.match(/(\d+|\D+)/g) || [];
    const maxLength = Math.max(aParts.length, bParts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || '';
      const bPart = bParts[i] || '';
      
      const aIsNum = !isNaN(parseFloat(aPart));
      const bIsNum = !isNaN(parseFloat(bPart));
      
      if (aIsNum && bIsNum) {
        const diff = parseFloat(aPart) - parseFloat(bPart);
        if (diff !== 0) return diff;
      } else if (aIsNum) {
        return -1; // Numbers come before non-numbers
      } else if (bIsNum) {
        return 1; // Numbers come before non-numbers
      } else {
        const diff = aPart.localeCompare(bPart);
        if (diff !== 0) return diff;
      }
    }
    
    return 0;
  };

  // Sort by description with priority: space, symbolic, numeric, alphabetic
  const sortByDescription = (a: typeof SAMPLE_ITEMS[0], b: typeof SAMPLE_ITEMS[0]): number => {
    const descA = String(a.description || '').trim();
    const descB = String(b.description || '').trim();
    
    // Get first character of each description
    const firstCharA = descA.charAt(0);
    const firstCharB = descB.charAt(0);
    
    // Get priority for first character: space (0), symbolic (1), numeric (2), alphabetic (3)
    const getPriority = (char: string): number => {
      if (char === ' ') return 0; // Space
      if (/[0-9]/.test(char)) return 2; // Numeric
      if (/[a-zA-Z]/.test(char)) return 3; // Alphabetic
      return 1; // Symbolic (everything else)
    };
    
    const priorityA = getPriority(firstCharA);
    const priorityB = getPriority(firstCharB);
    
    // Sort by priority first
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort alphabetically
    return descA.localeCompare(descB);
  };

  // Group items based on selected grouping
  const groupItems = (items: typeof SAMPLE_ITEMS) => {
    if (!groupBy) return [{ key: 'all', items: items.sort(sortByDescription) }];
    
    // Handle hierarchical grouping (Sales Category first, then Section/Location/Sequence)
    if (groupBy === 'sequenceSalesCategory') {
      // First group by Sales Category, then by Sequence within each category
      const primaryGrouped: { [key: string]: typeof SAMPLE_ITEMS } = {};
      
      items.forEach(item => {
        const salesCat = item.salesCategory || 'No Category';
        if (!primaryGrouped[salesCat]) {
          primaryGrouped[salesCat] = [];
        }
        primaryGrouped[salesCat].push(item);
      });
      
      // Sort primary groups alphabetically
      const sortedPrimaryKeys = Object.keys(primaryGrouped).sort();
      
      // Within each primary group, group by sequence and sort numerically
      const result: Array<{ salesCategory: string; subGroups: Array<{ key: string; items: typeof SAMPLE_ITEMS }> }> = [];
      sortedPrimaryKeys.forEach(primaryKey => {
        const secondaryGrouped: { [key: string]: typeof SAMPLE_ITEMS } = {};
        primaryGrouped[primaryKey].forEach(item => {
          const seq = String(item.sequence || 0);
          if (!secondaryGrouped[seq]) {
            secondaryGrouped[seq] = [];
          }
          secondaryGrouped[seq].push(item);
        });
        
        // Sort sequences numerically
        const sortedSeqs = Object.keys(secondaryGrouped).sort((a, b) => parseInt(a) - parseInt(b));
        const subGroups = sortedSeqs.map(seq => ({
          key: seq,
          items: secondaryGrouped[seq].sort(sortByDescription)
        }));
        
        result.push({
          salesCategory: primaryKey,
          subGroups
        });
      });
      
      return result;
    } else if (groupBy === 'sectionSalesCategory') {
      // First group by Sales Category, then by Section within each category
      const primaryGrouped: { [key: string]: typeof SAMPLE_ITEMS } = {};
      
      items.forEach(item => {
        const salesCat = item.salesCategory || 'No Category';
        if (!primaryGrouped[salesCat]) {
          primaryGrouped[salesCat] = [];
        }
        primaryGrouped[salesCat].push(item);
      });
      
      // Sort primary groups alphabetically
      const sortedPrimaryKeys = Object.keys(primaryGrouped).sort();
      
      // Within each primary group, group by section and sort naturally (D, D01, DD2, DE1)
      const result: Array<{ salesCategory: string; subGroups: Array<{ key: string; items: typeof SAMPLE_ITEMS }> }> = [];
      sortedPrimaryKeys.forEach(primaryKey => {
        const secondaryGrouped: { [key: string]: typeof SAMPLE_ITEMS } = {};
        primaryGrouped[primaryKey].forEach(item => {
          const section = item.section || '';
          if (!secondaryGrouped[section]) {
            secondaryGrouped[section] = [];
          }
          secondaryGrouped[section].push(item);
        });
        
        // Sort sections naturally (D, D01, DD2, DE1)
        const sortedSections = Object.keys(secondaryGrouped).sort(naturalSort);
        const subGroups = sortedSections.map(section => ({
          key: section,
          items: secondaryGrouped[section].sort(sortByDescription)
        }));
        
        result.push({
          salesCategory: primaryKey,
          subGroups
        });
      });
      
      return result;
    } else if (groupBy === 'locationSalesCategory') {
      // First group by Sales Category, then by Location within each category
      const primaryGrouped: { [key: string]: typeof SAMPLE_ITEMS } = {};
      
      items.forEach(item => {
        const salesCat = item.salesCategory || 'No Category';
        if (!primaryGrouped[salesCat]) {
          primaryGrouped[salesCat] = [];
        }
        primaryGrouped[salesCat].push(item);
      });
      
      // Sort primary groups alphabetically
      const sortedPrimaryKeys = Object.keys(primaryGrouped).sort();
      
      // Within each primary group, group by location and sort numerically
      const result: Array<{ salesCategory: string; subGroups: Array<{ key: string; items: typeof SAMPLE_ITEMS }> }> = [];
      sortedPrimaryKeys.forEach(primaryKey => {
        const secondaryGrouped: { [key: string]: typeof SAMPLE_ITEMS } = {};
        primaryGrouped[primaryKey].forEach(item => {
          // Show "0" instead of "No Location" when location is empty or 0
          const location = item.location && item.location !== '' ? String(item.location) : '0';
          if (!secondaryGrouped[location]) {
            secondaryGrouped[location] = [];
          }
          secondaryGrouped[location].push(item);
        });
        
        // Sort locations numerically
        const sortedLocations = Object.keys(secondaryGrouped).sort((a, b) => {
          const aNum = parseFloat(a);
          const bNum = parseFloat(b);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return naturalSort(a, b);
        });
        const subGroups = sortedLocations.map(location => ({
          key: location,
          items: secondaryGrouped[location].sort(sortByDescription)
        }));
        
        result.push({
          salesCategory: primaryKey,
          subGroups
        });
      });
      
      return result;
    }
    
    // Simple grouping for other options
    const grouped: { [key: string]: typeof SAMPLE_ITEMS } = {};
    
    items.forEach(item => {
      let groupKey = '';
      
      if (groupBy === 'salesCategory') {
        groupKey = item.salesCategory || '';
      } else if (groupBy === 'priceClass') {
        groupKey = item.priceClass || '';
      } else if (groupBy === 'section') {
        groupKey = item.section || '';
      } else if (groupBy === 'location') {
        // Show "0" instead of "No Location" when location is empty or 0
        groupKey = item.location && item.location !== '' ? String(item.location) : '0';
      } else if (groupBy === 'sequence') {
        groupKey = String(item.sequence || 0);
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });
    
    // Sort keys - numerical for location and sequence, natural for section, alphabetical for others
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (groupBy === 'sequence' || groupBy === 'location') {
        // Numerical sort for sequence and location
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return naturalSort(a, b);
      } else if (groupBy === 'section') {
        // Natural sort for section (D, D01, DD2, DE1)
        return naturalSort(a, b);
      }
      // Alphabetical for others
      return a.localeCompare(b);
    });
    
    return sortedKeys.map(key => ({
      key,
      items: grouped[key].sort(sortByDescription)
    }));
  };

  // Generate PDF preview
  const generatePDF = async () => {
    const logoDataUrl = await loadLogoAsDataUrl();
    const selectedFieldKeys = Object.keys(selectedFields).filter(key => selectedFields[key]);
    const totalFields = selectedFieldKeys.length;
    const hasSectionOrLocation = selectedFieldKeys.includes('section') || selectedFieldKeys.includes('location');
    const isLandscape = totalFields > 7 && !hasSectionOrLocation;
    
    const doc = new jsPDF(isLandscape ? 'landscape' : 'portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    
    // Add header to first page to get actual header height
    const headerHeight = addFullHeaderToPage(doc, 1, 1);
    const headerMargin = 2;
    let yPosition = headerHeight + headerMargin; // Start below header divider with margin
    
    // Group items
    const grouped = groupItems(SAMPLE_ITEMS);
    
    // Fixed column sequence: lineNumber, orderedQty, scannedQty, description, itemNumber, pack, size, then others
    const fixedOrder = ['lineNumber', 'orderedQty', 'scannedQty', 'description', 'itemNumber', 'pack', 'size'];
    const finalFieldKeys: string[] = [];
    
    // First, add fixed order fields that are selected
    fixedOrder.forEach(key => {
      if (selectedFieldKeys.includes(key)) {
        finalFieldKeys.push(key);
      }
    });
    
    // Then add other selected fields in their original order
    selectedFieldKeys.forEach(key => {
      if (!fixedOrder.includes(key)) {
        finalFieldKeys.push(key);
      }
    });
    const headerLabels = finalFieldKeys.map(key => 
      PICKLIST_FIELDS.find(f => f.key === key)?.label || key
    );
    
    const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
    
    // Check if grouped has nested structure (for Sales Category combinations)
    const isNestedStructure = grouped.length > 0 && 'salesCategory' in grouped[0] && 'subGroups' in grouped[0];
    
    if (isNestedStructure) {
      // Handle nested structure: Sales Category -> Section/Location/Sequence
      (grouped as Array<{ salesCategory: string; subGroups: Array<{ key: string; items: typeof SAMPLE_ITEMS }> }>).forEach((categoryGroup, categoryIndex) => {
        // Check if we need a new page for new category
        if (newCategoryOnNewPage && categoryIndex > 0) {
          doc.addPage();
          yPosition = headerHeight + headerMargin;
        }
        
        // Add spacing before new category (except first one, and skip if new category on new page)
        if (categoryIndex > 0 && !newCategoryOnNewPage) {
          yPosition += 4;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
          yPosition += 4;
        }
        
        // Sales Category header - prominent with background box
        const categoryBoxHeight = 6;
        doc.setFillColor(240, 245, 250);
        doc.setDrawColor(200, 210, 220);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, yPosition - 4, pageWidth - (margin * 2), categoryBoxHeight, 1.5, 1.5, 'FD');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 50, 80);
        doc.text('Sales Category:', margin + 3, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const categoryLabelWidth = doc.getTextWidth('Sales Category:');
        doc.text(categoryGroup.salesCategory, margin + 3 + categoryLabelWidth + 2, yPosition);
        yPosition += 7;
        
        // Sub-groups (Section/Location/Sequence) - visually distinct with indentation
        categoryGroup.subGroups.forEach((subGroup, subIndex) => {
          // Add small spacing between sub-groups
          if (subIndex > 0) {
            yPosition += 2;
          }
          
          // Sub-group header with indentation and subtle background
          const subBoxHeight = 5;
          doc.setFillColor(250, 252, 255);
          doc.setDrawColor(220, 225, 230);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin + 3, yPosition - 3.5, pageWidth - (margin * 2) - 6, subBoxHeight, 1, 1, 'FD');
          
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(50, 70, 100);
          
          let subLabel = '';
          if (groupBy === 'sequenceSalesCategory') {
            subLabel = 'Sequence:';
          } else if (groupBy === 'sectionSalesCategory') {
            subLabel = 'Section:';
          } else if (groupBy === 'locationSalesCategory') {
            subLabel = 'Location:';
          }
          
          doc.text(subLabel, margin + 6, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(0, 0, 0);
          const subLabelWidth = doc.getTextWidth(subLabel);
          doc.text(subGroup.key, margin + 6 + subLabelWidth + 2, yPosition);
          yPosition += 5.5;
          
          // Table data
          const tableData = subGroup.items.map(item => 
            finalFieldKeys.map(key => {
              const value = (item as any)[key];
              return value !== null && value !== undefined ? String(value) : '-';
            })
          );
          
          // Store callback for header/footer on each page
          const pageCallback = () => {
            const currentPage = doc.getNumberOfPages();
            const tempTotalPages = doc.getNumberOfPages();
            addFooterToPage(doc, logoDataUrl || undefined);
            addFullHeaderToPage(doc, currentPage, tempTotalPages);
          };
          
          autoTableFn(doc, {
            head: [headerLabels],
            body: tableData,
            startY: yPosition,
            styles: { 
              fontSize: 7, 
              cellPadding: 1.5,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
            },
            headStyles: { 
              fillColor: [240, 240, 240], 
              textColor: [0, 0, 0], 
              fontStyle: 'normal',
              fontSize: 7,
            },
            margin: { top: headerHeight + headerMargin, left: margin, right: margin, bottom: 40 },
            didDrawPage: pageCallback,
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 5;
        });
      });
    } else {
      // Handle simple structure (non-nested)
      (grouped as Array<{ key: string; items: typeof SAMPLE_ITEMS }>).forEach((group, groupIndex) => {
        // Check if we need a new page for new category
        const isSalesCategoryGrouping = groupBy === 'salesCategory' || 
                                       groupBy === 'sectionSalesCategory' || 
                                       groupBy === 'locationSalesCategory' || 
                                       groupBy === 'sequenceSalesCategory';
        if (newCategoryOnNewPage && isSalesCategoryGrouping && groupIndex > 0) {
          doc.addPage();
          yPosition = headerHeight + headerMargin;
        }
        
        // Add spacing before new group (except first one, and skip if new category on new page)
        if (groupIndex > 0 && !(newCategoryOnNewPage && isSalesCategoryGrouping)) {
          yPosition += 4;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
          yPosition += 4;
        }
        
        // Group header - prominent with background box
        if (groupBy) {
          const groupBoxHeight = 6;
          doc.setFillColor(240, 245, 250);
          doc.setDrawColor(200, 210, 220);
          doc.setLineWidth(0.3);
          doc.roundedRect(margin, yPosition - 4, pageWidth - (margin * 2), groupBoxHeight, 1.5, 1.5, 'FD');
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 50, 80);
          
          let label = '';
          if (groupBy === 'salesCategory') {
            label = 'Sales Category:';
          } else if (groupBy === 'priceClass') {
            label = 'Price Class:';
          } else if (groupBy === 'section') {
            label = 'Section:';
          } else if (groupBy === 'location') {
            label = 'Location:';
          } else if (groupBy === 'sequence') {
            label = 'Sequence:';
          }
          
          doc.text(label, margin + 3, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          const labelWidth = doc.getTextWidth(label);
          doc.text(group.key, margin + 3 + labelWidth + 2, yPosition);
          yPosition += 7;
        }
        
        // Table data
        const tableData = group.items.map(item => 
          finalFieldKeys.map(key => {
            const value = (item as any)[key];
            return value !== null && value !== undefined ? String(value) : '-';
          })
        );
        
        // Store callback for header/footer on each page
        const pageCallback = () => {
          const currentPage = doc.getNumberOfPages();
          const tempTotalPages = doc.getNumberOfPages();
          addFooterToPage(doc, logoDataUrl || undefined);
          addFullHeaderToPage(doc, currentPage, tempTotalPages);
        };
        
        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          styles: { 
            fontSize: 7, 
            cellPadding: 1.5,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
          headStyles: { 
            fillColor: [240, 240, 240], 
            textColor: [0, 0, 0], 
            fontStyle: 'normal',
            fontSize: 7,
          },
          margin: { top: headerHeight + headerMargin, left: margin, right: margin, bottom: 40 },
          didDrawPage: pageCallback,
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 5;
      });
    }
    
    // Totals section at bottom (on last page only) - ensure enough space above footer
    let currentPage = doc.getNumberOfPages();
    doc.setPage(currentPage);
    
    // Calculate totals section position - dynamically adjust based on enabled footer items
    // Calculate space needed: fill-in fields take 7mm, auto-filled fields take 5mm
    let spaceNeeded = 11; // Base space for footer text + margin
    if (showPickedBy && pickedByPosition === 'bottom') spaceNeeded += 7;
    if (showCheckedBy && checkedByPosition === 'bottom') spaceNeeded += 7;
    if (showBundles) spaceNeeded += 7;
    if (showTotalCartons) spaceNeeded += 7; // Fill-in-the-blank
    if (showTotalPieces) spaceNeeded += 7; // Fill-in-the-blank
    if (showTotalLines) spaceNeeded += 5; // Auto-filled
    const totalsY = pageHeight - spaceNeeded;
    
    // Check if we need a new page for totals section
    // We need at least 10mm gap between last content and divider
    const minGapBeforeTotals = 10;
    const dividerY = totalsY - 6;
    const requiredYForDivider = dividerY - minGapBeforeTotals;
    
    // Get the last Y position from the last table
    const lastTableY = (doc as any).lastAutoTable?.finalY || yPosition;
    
    // If last content is too close to totals section, add a new page
    if (lastTableY > requiredYForDivider) {
      doc.addPage();
      currentPage = doc.getNumberOfPages();
      doc.setPage(currentPage);
      yPosition = headerHeight + headerMargin;
    }
    
    // Ensure we're on the correct page before adding totals
    doc.setPage(currentPage);
    
    // Add divider above footer/totals section (with more gap before totals)
    doc.setDrawColor(0, 0, 0); // Black
    doc.setLineWidth(0.3);
    doc.line(margin, dividerY, pageWidth - margin, dividerY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Left side: Fill-in fields (Picked by, Checked by, Bundles)
    let leftYPos = totalsY;
    if (pickedByPosition === 'bottom' && showPickedBy) {
      doc.text('Picked by:', margin, leftYPos);
      // Add blank line for manual entry
      doc.setDrawColor(200, 200, 200);
      doc.line(margin + 25, leftYPos + 2, margin + 60, leftYPos + 2);
      leftYPos += 7;
    }
    if (checkedByPosition === 'bottom' && showCheckedBy) {
      doc.text('Checked by:', margin, leftYPos);
      // Add blank line for manual entry
      doc.setDrawColor(200, 200, 200);
      doc.line(margin + 30, leftYPos + 2, margin + 65, leftYPos + 2);
      leftYPos += 7;
    }
    if (showBundles) {
      doc.text('Bundles:', margin, leftYPos);
      // Add blank line for manual entry
      doc.setDrawColor(200, 200, 200);
      doc.line(margin + 25, leftYPos + 2, margin + 60, leftYPos + 2);
      leftYPos += 7;
    }
    
    // Right side: Total Cartons/Pieces/Lines - only if enabled (fill-in-the-blank)
    let rightYPos = totalsY;
    if (showTotalCartons) {
      const labelText = 'Total Cartons:';
      const labelWidth = doc.getTextWidth(labelText);
      const labelX = pageWidth - margin - 40; // Position label to leave space for line
      doc.text(labelText, labelX, rightYPos);
      // Add blank line for manual entry (beside the label)
      doc.setDrawColor(200, 200, 200);
      doc.line(labelX + labelWidth + 2, rightYPos + 2, pageWidth - margin, rightYPos + 2);
      rightYPos += 7;
    }
    if (showTotalPieces) {
      const labelText = 'Total Pieces:';
      const labelWidth = doc.getTextWidth(labelText);
      const labelX = pageWidth - margin - 40; // Position label to leave space for line
      doc.text(labelText, labelX, rightYPos);
      // Add blank line for manual entry (beside the label)
      doc.setDrawColor(200, 200, 200);
      doc.line(labelX + labelWidth + 2, rightYPos + 2, pageWidth - margin, rightYPos + 2);
      rightYPos += 7;
    }
    if (showTotalLines) {
      const labelX = pageWidth - margin - 40; // Same starting position as other fields
      doc.text(`Total Lines: ${SAMPLE_ITEMS.length}`, labelX, rightYPos);
      rightYPos += 5;
    }
    
    // Add footer and full header to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooterToPage(doc, logoDataUrl || undefined);
      addFullHeaderToPage(doc, i, totalPages);
    }
    
    // Save PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`picklist-template-${timestamp}.pdf`);
  };

  const selectedFieldKeys = Object.keys(selectedFields).filter(key => selectedFields[key]);
  const totalFields = selectedFieldKeys.length;
  const hasSectionOrLocation = selectedFieldKeys.includes('section') || selectedFieldKeys.includes('location');
  const isLandscape = totalFields > 7 && !hasSectionOrLocation;

  return (
    <Box sx={{ 
      height: { xs: "auto", md: '100%' }, 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        minHeight: 0,
        p: 2,
        pt: 0,
      }}>
        {!showPreview && (
          <>
            {/* Template Info */}
            {groupBy && (
              <Paper sx={{ p: 1.5, mb: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    Template:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'primary.main' }}>
                    {currentTemplateName}
                  </Typography>
                </Box>
              </Paper>
            )}
          </>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
              Loading template...
            </Typography>
          </Box>
        ) : !showPreview ? (
          <Paper sx={{ 
            p: 0.75, 
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                {/* Group By */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Group By
                  </Typography>
                  <RadioGroup
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                  >
                    <FormControlLabel value="" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>None</Typography>} />
                    <FormControlLabel value="salesCategory" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Sales Category</Typography>} />
                    <FormControlLabel value="priceClass" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Price Class</Typography>} />
                    <FormControlLabel value="section" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Section</Typography>} />
                    <FormControlLabel value="location" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Location</Typography>} />
                    <FormControlLabel value="sectionSalesCategory" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Section + Sales Category</Typography>} />
                    <FormControlLabel value="locationSalesCategory" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Location + Sales Category</Typography>} />
                    <FormControlLabel value="sequence" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Sequence</Typography>} />
                    <FormControlLabel value="sequenceSalesCategory" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Sequence + Sales Category</Typography>} />
                  </RadioGroup>
                </Box>

                {/* New Category on New Page */}
                {(groupBy === 'salesCategory' || 
                  groupBy === 'sectionSalesCategory' || 
                  groupBy === 'locationSalesCategory' || 
                  groupBy === 'sequenceSalesCategory') && (
                  <Box sx={{ mb: 1.25, ml: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={newCategoryOnNewPage}
                          onChange={(e) => setNewCategoryOnNewPage(e.target.checked)}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem' }}>New Category on New Page</Typography>}
                    />
                  </Box>
                )}

                {/* Picked By Position */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Picked By Position
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={pickedByPosition}
                      onChange={(e) => setPickedByPosition(e.target.value as any)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      <MenuItem value="top" sx={{ fontSize: '0.68rem' }}>Top</MenuItem>
                      <MenuItem value="bottom" sx={{ fontSize: '0.68rem' }}>Bottom</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Checked By Position */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Checked By Position
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={checkedByPosition}
                      onChange={(e) => setCheckedByPosition(e.target.value as any)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      <MenuItem value="top" sx={{ fontSize: '0.68rem' }}>Top</MenuItem>
                      <MenuItem value="bottom" sx={{ fontSize: '0.68rem' }}>Bottom</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Show Barcode */}
                <Box sx={{ mb: 1.25, ml: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={showBarcode}
                        onChange={(e) => setShowBarcode(e.target.checked)}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.7rem' }}>Show Doc Number Barcode in Header</Typography>}
                  />
                </Box>

              </Grid>

              <Grid size={{ xs: 12, md: 9 }}>
                <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Fields
                </Typography>
                <Typography variant="caption" sx={{ mb: 0.6, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                  {isLandscape ? 'Landscape A4' : 'Portrait A4'} ({totalFields} fields selected)
                </Typography>
                <Box sx={{ 
                  maxHeight: 'calc(100vh - 260px)',
                  overflowY: 'auto',
                  pr: 0.5,
                }}>
                  <Grid container spacing={0.4}>
                    {PICKLIST_FIELDS.map((field) => (
                      <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3}} key={field.key}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 0.35,
                            px: 0.5,
                            borderRadius: 0.75,
                            transition: 'all 0.15s ease',
                            backgroundColor: selectedFields[field.key] 
                              ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.06)')
                              : 'transparent',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.03)' 
                                : 'rgba(0, 0, 0, 0.02)',
                            },
                          }}
                        >
                          <Switch
                            size="small"
                            checked={selectedFields[field.key] || false}
                            onChange={(e) => handleFieldToggle(field.key, e.target.checked)}
                            disabled={field.required}
                            sx={{ flexShrink: 0 }}
                          />
                          <Typography 
                            sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: selectedFields[field.key] ? 500 : 400,
                              color: selectedFields[field.key] ? 'primary.main' : 'text.secondary',
                              transition: 'all 0.15s ease',
                              flex: 1,
                            }}
                          >
                            {field.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Footer Options - Below Field Selection */}
                <Box sx={{ mt: 2, mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Footer Options
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={showTotalCartons}
                            onChange={(e) => setShowTotalCartons(e.target.checked)}
                          />
                        }
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Total Cartons</Typography>}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={showTotalPieces}
                            onChange={(e) => setShowTotalPieces(e.target.checked)}
                          />
                        }
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Total Pieces</Typography>}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={showTotalLines}
                            onChange={(e) => setShowTotalLines(e.target.checked)}
                          />
                        }
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Total Lines</Typography>}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={showPickedBy}
                            onChange={(e) => setShowPickedBy(e.target.checked)}
                          />
                        }
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Picked By</Typography>}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={showCheckedBy}
                            onChange={(e) => setShowCheckedBy(e.target.checked)}
                          />
                        }
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Checked By</Typography>}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={showBundles}
                            onChange={(e) => setShowBundles(e.target.checked)}
                          />
                        }
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Bundles</Typography>}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Paper sx={{ 
            p: 1.5, 
            mb: 1.5, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
              PDF Preview Generated
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 2 }}>
              The PDF has been generated and downloaded. Check your downloads folder.
            </Typography>
          </Paper>
        )}
      </Box>

      <Box sx={{ 
        p: 1.5,
        py: 1,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        flexShrink: 0,
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 -2px 8px rgba(0, 0, 0, 0.3)' 
          : '0 -2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        {!showPreview ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, width: '100%' }}>
            <Button
              variant="contained"
              onClick={handleSaveTemplate}
              disabled={saving || loading}
              startIcon={saving ? <CircularProgress size={16} /> : null}
              sx={{
                minWidth: 120,
                fontSize: '0.875rem',
                textTransform: 'none',
                color: 'white',
              }}
            >
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                await generatePDF();
                setShowPreview(true);
                setTimeout(() => setShowPreview(false), 3000);
              }}
              disabled={loading}
              sx={{
                minWidth: 150,
                fontSize: '0.875rem',
                textTransform: 'none',
              }}
            >
              Generate PDF Preview
            </Button>
          </Box>
        ) : (
          <button
            onClick={() => setShowPreview(false)}
            style={{
              padding: '10px 20px',
              backgroundColor: theme.palette.grey[500],
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Back to Configuration
          </button>
        )}
      </Box>

    </Box>
  );
};

export default PicklistTemplateTab;


