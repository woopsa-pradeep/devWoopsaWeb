import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, Button, CircularProgress } from "@mui/material";
import { KeyboardBackspaceOutlined, Print as PrintIcon } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import OrderStatusStepper from "../../../components/OrderStatusStepper";
import PriceDetails from "../../../components/PriceDetails";
import {
  getOrderDeliveryStatus,
  getOrderHistoryByOrderNumber,
  getOrderDetailByOrderNumberForInvoice,
} from "../../../redux/apis/distrubutor/orderDistrubutorApis";
import { getWarehouseSetting, makePickListPrinted } from "../../../redux/apis/distrubutor/settingApis";
import { generatePicklistPDF } from "../../../utils/picklistPdfGenerator";
import toast from 'react-hot-toast';
import image from "../../../assets/Default-Product-Image.jpg";
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

const AdminOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderHeader, setOrderHeader] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [picklistLoading, setPicklistLoading] = useState(false);
  const [showWithPerpaidTax, setShowWithPerpaidTax] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [orderDeliveryStatus, setOrderDeliveryStatus] = useState<any>({});
  const stepData = Array.isArray(orderDeliveryStatus)
    ? [...orderDeliveryStatus]
    : [];

  // Sort it safely
  const sortedSteps = stepData.sort((a: any, b: any) => a.no - b.no);

  // Find current active step
  const currentStep = sortedSteps?.reduce(
    (acc: any, item: any) => (item.active ? item.no : acc),
    0
  );

  // Format time into readable format (e.g., 'July 16th 2025')
  const dates = stepData?.map((step: any) => step.time);

  // Check if PrintInvoice is true in any delivery status item
  const canPrintInvoice = stepData.some((step: any) => step.PrintInvoice === true);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      setLoading(true);
      try {
        const response: any = await getOrderHistoryByOrderNumber(orderId, currentPage, pageSize);
        setOrderHistory(response?.data?.data || []);
        setOrderHeader(response?.data?.orderHeader || {});
        setTotalPages(response?.data?.totalPages || 1);
        setTotalItems(response?.data?.totalCount || 0);
      } catch (error) {
        console.error("Error fetching order history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderHistory();
    }
  }, [orderId, currentPage, pageSize]);
  const getOrderDeliveryStatusApi = async () => {
    const response: any = (await getOrderDeliveryStatus(orderId)) as any;
    setOrderDeliveryStatus(response?.data);
  };
  useEffect(() => {
    if (orderId) {
      getOrderDeliveryStatusApi();
    }
  }, [orderId]);

  // Fetch warehouse setting to get showWithPerpaidTax
  useEffect(() => {
    const fetchWarehouseSetting = async () => {
      try {
        const response: any = await getWarehouseSetting();
        console.log(response);
        if (response?.data?.success && response?.data?.data) {
          setShowWithPerpaidTax(response.data.data.showWithPerpaidTax ?? true);
        }
      } catch (error) {
        console.error('Failed to fetch warehouse setting:', error);
        // Default to true if API fails
        setShowWithPerpaidTax(true);
      }
    };
    fetchWarehouseSetting();
  }, []);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle Print Picklist
  const handlePrintPicklist = async () => {
    if (!orderId) return;
    
    setPicklistLoading(true);
    try {
      // Fetch order details
      const response: any = await getOrderDetailByOrderNumberForInvoice(orderId);
      const invoiceData = response?.data;
      
      if (!invoiceData || !invoiceData.orderHeader) {
        toast.error('Failed to fetch order details');
        return;
      }

      const orderHeader = invoiceData.orderHeader;
      const orderDetails = orderHeader.orderDetails || [];
      const distributor = orderHeader.distributor || {};
      const customer = orderHeader.customer || {};
      
      // Determine if this is a reprint based on Picklist_Printed flag
      const picklistPrinted = orderHeader.Picklist_Printed || false;
      const isReprint = picklistPrinted || orderHeader.IsReprint || false;

      // Transform order data to match picklist format
      const items = orderDetails.map((item: any, index: number) => {
        // Get UPC from inventory if available
        const upc = item.inventory?.UPCList?.[0]?.UPC_Number || 
                   item.UPC_Number || 
                   item.UPC || 
                   '';
        
        // Get description - ItemDescription is empty, use inventory.Description
        const description = item.ItemDescription || 
                           item.Description || 
                           item.Item_Description || 
                           item.inventory?.Description || 
                           '';
        
        // Get size/UOM - from inventory.UOM
        const size = item.Size || 
                    item.UOM || 
                    item.inventory?.UOM || 
                    '';
        
        // Get on hand from inventory
        const onhand = item.OnHand || 
                      item.Inventory_OnHand || 
                      item.inventory?.OnHand || 
                      0;
        
        // Ensure proper type conversion
        const lineNumber = item.Line_Number !== undefined && item.Line_Number !== null 
          ? Number(item.Line_Number) 
          : index + 1;
        
        const orderedQty = item.Quantity_Ordered !== undefined && item.Quantity_Ordered !== null
          ? Number(item.Quantity_Ordered)
          : (item.QuantityOrdered !== undefined && item.QuantityOrdered !== null
            ? Number(item.QuantityOrdered)
            : 0);
        
        const itemNumber = item.Item_Number !== undefined && item.Item_Number !== null
          ? String(item.Item_Number)
          : (item.ItemNumber !== undefined && item.ItemNumber !== null
            ? String(item.ItemNumber)
            : '');
        
        const pack = item.Pack !== undefined && item.Pack !== null
          ? Number(item.Pack)
          : (item.CaseCount !== undefined && item.CaseCount !== null
            ? Number(item.CaseCount)
            : (item.inventory?.CaseCount !== undefined && item.inventory?.CaseCount !== null
              ? Number(item.inventory.CaseCount)
              : 1));
        
        // Unit cost = Price (as per user requirement)
        const unitCost = item.Price !== undefined && item.Price !== null
          ? Number(item.Price)
          : 0;
        
        // Extended cost = (Price + OTP_Amount_State) * Quantity_Ordered + PrepaidTax_Amount
        const otpAmountState = item.OTP_Amount_State !== undefined && item.OTP_Amount_State !== null
          ? Number(item.OTP_Amount_State)
          : 0;
        const prepaidTaxAmount = item.PrepaidTax_Amount !== undefined && item.PrepaidTax_Amount !== null
          ? Number(item.PrepaidTax_Amount)
          : 0;
        const extendedCost = (unitCost + otpAmountState) * orderedQty + prepaidTaxAmount;
        
        const retail = item.Retail !== undefined && item.Retail !== null
          ? Number(item.Retail)
          : (item.Retail_Price !== undefined && item.Retail_Price !== null
            ? Number(item.Retail_Price)
            : (item.Price !== undefined && item.Price !== null
              ? Number(item.Price)
              : 0));
        
        const sequence = item.Sequence !== undefined && item.Sequence !== null
          ? Number(item.Sequence)
          : (item.Line_Number !== undefined && item.Line_Number !== null
            ? Number(item.Line_Number)
            : index + 1);
        
        // Sales Category - from inventory.SalesCategory.Category_Desc or Sales_Category
        const salesCategory = item.inventory?.SalesCategory?.Category_Desc || 
                            item.Sales_Category_Desc || 
                            item.SalesCategory || 
                            (item.Sales_Category !== undefined && item.Sales_Category !== null ? String(item.Sales_Category) : '') ||
                            '';
        
        return {
          lineNumber,
          orderedQty,
          scannedQty: '', // Empty for manual entry
          itemNumber,
          description: String(description || ''),
          pack,
          size: String(size || ''),
          upc: String(upc || ''),
          onhand: Number(onhand || 0),
          salesCategory: String(salesCategory),
          priceClass: String(item.Price_Class_Desc || item.PriceClass || item.Price_Class || ''),
          unitCost,
          extendedCost,
          retail,
          section: String(item.Section || ''),
          location: String(item.Location || ''),
          vendorItem: String(item.Vendor_Item || item.VendorItem || ''),
          sequence,
        };
      });

      const totals = {
        totalPieces: items.reduce((sum: number, item: any) => sum + (item.orderedQty || 0), 0),
        totalCartons: items.length,
        totalLines: items.length,
        totalExtendedCost: items.reduce((sum: number, item: any) => sum + (item.extendedCost || 0), 0),
      };

      // Get customer route and stop from Routes array
      const customerRoute = customer.Routes && customer.Routes.length > 0 
        ? customer.Routes[0].Route_Number || 0 
        : (customer.Route || 0);
      const customerStop = customer.Routes && customer.Routes.length > 0 
        ? customer.Routes[0].Stop_Number || 0 
        : (customer.Stop || 0);
      
      // Build customer address from components
      const customerAddress = customer.C_Address || '';
      const customerCity = customer.C_City || '';
      const customerState = customer.C_State || '';
      const customerZip = customer.C_Zip || '';
      const fullAddress = [customerAddress, customerCity, customerState, customerZip]
        .filter(Boolean)
        .join(', ');
      
      // Build distributor address from components
      const distributorAddr1 = distributor.D_Addr1 || '';
      const distributorAddr2 = distributor.D_Addr2 || '';
      const distributorCity = distributor.D_City || '';
      const distributorState = distributor.D_State || '';
      const distributorZip = distributor.D_Zip || '';
      const distributorAddressParts = [distributorAddr1, distributorAddr2, distributorCity, distributorState, distributorZip]
        .filter(Boolean);
      const distributorAddress = distributorAddressParts.join(', ');
      
      const orderData = {
        customer: {
          number: orderHeader.C_Number || customer.C_Number || 0,
          name: customer.C_Name || '',
          address: fullAddress || customer.C_Address || '',
          phone: customer.C_Phone || '',
          route: customerRoute,
          stop: customerStop,
        },
        distributor: {
          name: distributor.D_Name || '',
          address: distributorAddress || distributor.D_Addr1 || '',
        },
        invoiceNumber: orderHeader.Invoice_Number || orderId,
        isReprint: isReprint,
        orderNumber: orderHeader.Order_Number || orderId,
        orderDate: orderHeader.Order_Date || '',
        invoiceDate: orderHeader.Invoice_Date || orderHeader.Order_Date || '',
        items,
        totals,
      };

      // Generate PDF
      await generatePicklistPDF(orderData);
      
      // Mark picklist as printed only if it hasn't been printed before
      if (!picklistPrinted) {
        try {
          await makePickListPrinted(orderId);
        } catch (printError: any) {
          console.error('Error marking picklist as printed:', printError);
          // Don't show error to user if PDF was generated successfully
        }
      }
      
      toast.success('Picklist PDF generated successfully');
    } catch (error: any) {
      console.error('Error generating picklist PDF:', error);
      toast.error(error?.message || 'Failed to generate picklist PDF');
    } finally {
      setPicklistLoading(false);
    }
  };

  // Helper to load logo as data URL
  const loadLogoAsDataUrl = async (logoUrl?: string): Promise<string | null> => {
    try {
      return new Promise<string | null>((resolve) => {
        if (!logoUrl) {
          // For local rabbit logo
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } else {
                resolve(null);
              }
            } catch (error) {
              console.error('Error converting logo to data URL:', error);
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          if (typeof rabbitLogo === 'string') {
            img.src = rabbitLogo;
          } else {
            img.src = rabbitLogo as string;
          }
          return;
        }

        // For URL-based logos, try multiple approaches to handle CORS
        // Since the image opens in browser but CORS blocks canvas access,
        // we'll try different methods and suppress expected CORS errors
        
        // Method 1: Try Image element without crossOrigin (sometimes works)
        const img1 = new Image();
        img1.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img1.width;
            canvas.height = img1.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img1, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } else {
              resolve(null);
            }
          } catch {
            // CORS error when drawing to canvas - try next method
            tryMethod2();
          }
        };
        img1.onerror = () => tryMethod2();
        
        const tryMethod2 = () => {
          // Method 2: Try with crossOrigin
          const img2 = new Image();
          img2.crossOrigin = 'anonymous';
          img2.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img2.width;
              canvas.height = img2.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img2, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } else {
                resolve(null);
              }
            } catch {
              // CORS error - silently fail
              resolve(null);
            }
          };
          img2.onerror = () => {
            // CORS blocked - silently fail without trying fetch (which will also fail)
            // This prevents console errors
            resolve(null);
          };
          img2.src = logoUrl;
        };
        
        // Start with method 1
        img1.src = logoUrl;
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  // Helper function to add footer with logo and "Report Generated by Woopsa" to each page
  const addFooterToPage = (doc: jsPDF, logoDataUrl?: string, pageNum?: number, totalPages?: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = pageHeight - 8;
    const margin = 10;
    
    // Left side: "Report Generated by Woopsa" + logo
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const text = 'Report Generated by Woopsa';
    doc.text(text, margin, footerY);
    
    if (logoDataUrl) {
      try {
        const logoWidth = 4;
        const logoHeight = 4;
        const textWidth = doc.getTextWidth(text);
        const logoX = margin + textWidth + 1.5;
        const logoY = footerY - 3;
        
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch {
          try {
            doc.addImage(logoDataUrl, 'JPEG', logoX, logoY, logoWidth, logoHeight);
          } catch {
            try {
              doc.addImage(logoDataUrl, 'SVG', logoX, logoY, logoWidth, logoHeight);
            } catch {
              doc.addImage(logoDataUrl, logoX, logoY, logoWidth, logoHeight);
            }
          }
        }
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Right side: Page number
    if (pageNum !== undefined && totalPages !== undefined) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const pageText = `Page ${pageNum} of ${totalPages}`;
      doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
    }
  };

  // Generate PDF Invoice
  const generateInvoicePDF = async () => {
    setPdfLoading(true);
    try {
      const response: any = await getOrderDetailByOrderNumberForInvoice(orderId);
      const invoiceData = response?.data;
      
      if (!invoiceData || !invoiceData.orderHeader) {
        console.error('Invalid invoice data');
        return;
      }

      const orderHeader = invoiceData.orderHeader;
      const orderDetails = orderHeader.orderDetails || [];
      const distributor = orderHeader.distributor || {};
      const customer = orderHeader.customer || {};
      const distributorLogoUrl = orderHeader.logo;

      // Load logos - only load distributor logo if URL is provided by API
      const [rabbitLogoDataUrl, distributorLogoDataUrl] = await Promise.all([
        loadLogoAsDataUrl(),
        distributorLogoUrl ? loadLogoAsDataUrl(distributorLogoUrl) : Promise.resolve(null),
      ]);

      // Only use distributor logo if successfully loaded from API (no fallback to default image)
      const finalLogoDataUrl = distributorLogoDataUrl;

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // 3-column layout: Distributor | Logo | Customer - Full width justified with space-between
      const totalAvailableWidth = pageWidth - (margin * 2);
      const logoColumnWidth = 30; // Smaller space for logo
      
      // Calculate remaining width for distributor and customer (reduced width to force wrapping)
      const remainingWidth = totalAvailableWidth - logoColumnWidth;
      const distributorWidth = (remainingWidth / 2) * 0.7; // Reduced to 70% to force text wrapping
      const customerWidth = (remainingWidth / 2) * 0.7; // Reduced to 70% to force text wrapping
      
      // Column positions - justified across full width (space-between style)
      // Distributor starts at left margin
      const distributorX = margin;
      // Logo is centered on the page
      const logoX = (pageWidth / 2) - (logoColumnWidth / 2);
      // Customer ends at right margin (right-aligned)
      const customerX = pageWidth - margin - customerWidth;
      
      let distributorY = margin;
      let customerY = margin;
      
      // Distributor details (left column)
      const distributorText = [
        distributor.D_Name || '',
        distributor.D_Addr1 || '',
        distributor.D_Addr2 || '',
        `${distributor.D_City || ''}${distributor.D_State ? `, ${distributor.D_State}` : ''} ${distributor.D_Zip || ''}`.trim(),
        distributor.D_Phone || '',
        distributor.D_Email || '',
      ].filter(Boolean);

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      distributorText.forEach((line, index) => {
        if (line) {
          doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
          doc.setFontSize(index === 0 ? 12 : 10);
          
          // Split text to fit within distributor column width
          const wrappedLines = doc.splitTextToSize(line, distributorWidth);
          
          // Make phone and email clickable links
          if (index === 4 && distributor.D_Phone) {
            // Phone number - make it a tel: link to open phone dialer
            wrappedLines.forEach((wrappedLine: string, lineIndex: number) => {
              const textWidth = doc.getTextWidth(wrappedLine);
              doc.setTextColor(0, 102, 204);
              doc.text(wrappedLine, distributorX, distributorY);
              doc.link(distributorX, distributorY - 3, textWidth, 4, { url: `tel:${distributor.D_Phone}` });
              doc.setTextColor(60, 60, 60);
              if (lineIndex < wrappedLines.length - 1) {
                distributorY += 4.5;
              }
            });
          } else if (index === 5 && distributor.D_Email) {
            // Email - make it a mailto: link
            wrappedLines.forEach((wrappedLine: string, lineIndex: number) => {
              const textWidth = doc.getTextWidth(wrappedLine);
              doc.setTextColor(0, 102, 204);
              doc.text(wrappedLine, distributorX, distributorY);
              doc.link(distributorX, distributorY - 3, textWidth, 4, { url: `mailto:${distributor.D_Email}` });
              doc.setTextColor(60, 60, 60);
              if (lineIndex < wrappedLines.length - 1) {
                distributorY += 4.5;
              }
            });
          } else {
            wrappedLines.forEach((wrappedLine: string, lineIndex: number) => {
              doc.text(wrappedLine, distributorX, distributorY);
              if (lineIndex < wrappedLines.length - 1) {
                distributorY += 4.5;
              }
            });
          }
          distributorY += index === 0 ? 6 : 4.5;
        }
      });

      // Customer details (right column)
      const routes = customer.Routes || [];
      const routeInfo = routes.length > 0 
        ? `Route: ${routes[0].Route_Number || ''}${routes[0].Stop_Number !== undefined ? `, Stop: ${routes[0].Stop_Number}` : ''}`
        : '';
      
      const customerText = [
        customer.C_Name || '',
        customer.C_CoName || '',
        customer.C_Address || '',
        `${customer.C_City || ''}${customer.C_State ? `, ${customer.C_State}` : ''} ${customer.C_Zip || ''}`.trim(),
        customer.C_Country || '',
        routeInfo,
        customer.salesRep?.S_Desc || '',
        customer.terms?.Terms || '',
        customer.C_Phone || '',
        customer.C_Email || '',
      ].filter(Boolean);

      doc.setTextColor(60, 60, 60);
      customerText.forEach((line, index) => {
        if (line) {
          doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
          doc.setFontSize(index === 0 ? 12 : 10);
          
          // Make phone and email clickable links - check by content match
          if (customer.C_Phone && line === customer.C_Phone) {
            // Phone number - make it a tel: link to open phone dialer
            const wrappedLines = doc.splitTextToSize(line, customerWidth);
            wrappedLines.forEach((wrappedLine: string, lineIndex: number) => {
              const textWidth = doc.getTextWidth(wrappedLine);
              doc.setTextColor(0, 102, 204);
              doc.text(wrappedLine, customerX + customerWidth, customerY, { align: 'right' });
              doc.link(customerX + customerWidth - textWidth, customerY - 3, textWidth, 4, { url: `tel:${customer.C_Phone}` });
              doc.setTextColor(60, 60, 60);
              if (lineIndex < wrappedLines.length - 1) {
                customerY += 4.5;
              }
            });
          } else if (customer.C_Email && line === customer.C_Email) {
            // Email - make it a mailto: link
            const wrappedLines = doc.splitTextToSize(line, customerWidth);
            wrappedLines.forEach((wrappedLine: string, lineIndex: number) => {
              const textWidth = doc.getTextWidth(wrappedLine);
              doc.setTextColor(0, 102, 204);
              doc.text(wrappedLine, customerX + customerWidth, customerY, { align: 'right' });
              doc.link(customerX + customerWidth - textWidth, customerY - 3, textWidth, 4, { url: `mailto:${customer.C_Email}` });
              doc.setTextColor(60, 60, 60);
              if (lineIndex < wrappedLines.length - 1) {
                customerY += 4.5;
              }
            });
          } else {
            // Split text to fit within customer column width
            const wrappedLines = doc.splitTextToSize(line, customerWidth);
            
            wrappedLines.forEach((wrappedLine: string, lineIndex: number) => {
              doc.text(wrappedLine, customerX + customerWidth, customerY, { align: 'right' });
              if (lineIndex < wrappedLines.length - 1) {
                customerY += 4.5;
              }
            });
          }
          
          customerY += index === 0 ? 6 : 4.5;
        }
      });

      // Add logo in center column - centered horizontally and vertically
      if (finalLogoDataUrl && finalLogoDataUrl.startsWith('data:')) {
        try {
          const logoWidth = 25; // mm - smaller logo
          const logoHeight = 8; // mm - compact height
          
          // Calculate center Y position (middle of distributor and customer sections)
          const maxY = Math.max(distributorY, customerY);
          const minY = margin;
          const centerY = (minY + maxY) / 2 - (logoHeight / 2); // Center vertically
          
          // Calculate center X position (center of logo column)
          const logoCenterX = logoX + (logoColumnWidth / 2) - (logoWidth / 2); // Center horizontally
          
          // Extract format from data URL
          const formatMatch = finalLogoDataUrl.match(/data:image\/(\w+);/);
          const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
          
          try {
            doc.addImage(finalLogoDataUrl, format, logoCenterX, centerY, logoWidth, logoHeight);
          } catch {
            // Logo couldn't be added, continue without it
          }
        } catch {
          // Logo processing failed, continue without it
        }
      }

      // Order info - below all sections
      yPosition = Math.max(distributorY, customerY) + 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`Order #${orderHeader.Order_Number || ''}`, margin, yPosition);
      
      // Format date to mm-dd-yyyy
      const formatDateToMMDDYYYY = (dateString: string): string => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            // If date parsing fails, try to parse common formats
            const parts = dateString.split(/[-/]/);
            if (parts.length === 3) {
              // Assume yyyy-mm-dd or similar
              const year = parts[0].length === 4 ? parts[0] : parts[2];
              const month = parts[0].length === 4 ? parts[1] : parts[0];
              const day = parts[0].length === 4 ? parts[2] : parts[1];
              return `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
            }
            return dateString;
          }
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}-${day}-${year}`;
        } catch {
          return dateString;
        }
      };
      
      const orderDateText = formatDateToMMDDYYYY(orderHeader.Order_Date || '');
      doc.setFont('helvetica', 'normal');
      doc.text(orderDateText, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 6;
      
      // Add divider line below order number and date
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Order Details Table - Modern Design
      const tableHeaders = ['Qty', 'Shipped', 'Item #', 'Description', 'Pack', 'Size', 'Price', 'Shipped Price'];
      const tableData: any[][] = [];

      orderDetails.forEach((item: any) => {
        tableData.push([
          item.Quantity_Ordered?.toString() || '0',
          item.Quantity_Shipped?.toString() || '0',
          item.Item_Number?.toString() || '',
          item.ItemDescription || item.inventory?.Description || '',
          item.Pack?.toString() || '',
          item.inventory?.UOM || '',
          `$${Number(item.Price || 0).toFixed(2)}`,
          `$${Number(item.Price * item.Quantity_Shipped || 0).toFixed(2)}`,
        ]);
      });

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
      
      autoTableFn(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { 
          fontSize: 9, 
          cellPadding: 2.5, 
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
          textColor: [50, 50, 50]
        },
        headStyles: { 
          fillColor: [60, 60, 60], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold', 
          lineWidth: 0.1,
          fontSize: 9
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // Qty - Reduced
          1: { cellWidth: 19, halign: 'center' }, // Shipped - Reduced
          2: { cellWidth: 18, halign: 'center' }, // Item # - Reduced
          3: { cellWidth: 70, halign: 'left' }, // Description - Increased to compensate
          4: { cellWidth: 13, halign: 'center' }, // Pack
          5: { cellWidth: 15, halign: 'center' }, // Size
          6: { cellWidth: 20, halign: 'right' }, // Price
          7: { cellWidth: 20, halign: 'right' }, // Shipped Price
        },
        didDrawPage: (data: any) => {
          addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Add divider between the two tables
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(1);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8; // Space after divider

      // Category-wise summary table
      const categoryGroups: { [key: string]: any[] } = {};
      orderDetails.forEach((item: any) => {
        const categoryName = item.inventory?.SalesCategory?.Category_Desc || 'Uncategorized';
        if (!categoryGroups[categoryName]) {
          categoryGroups[categoryName] = [];
        }
        categoryGroups[categoryName].push(item);
      });

      // Sort categories
      const sortedCategories = Object.keys(categoryGroups).sort();

      // Calculate totals for each category
      const categorySummaryData: any[][] = [];
      sortedCategories.forEach((categoryName) => {
        const categoryItems = categoryGroups[categoryName];
        const totalShippedQty = categoryItems.reduce((sum, item) => {
          return sum + Number(item.Quantity_Shipped || 0);
        }, 0);
        const totalPrice = categoryItems.reduce((sum, item) => {
          const itemPrice = Number(item.Price || 0);
          const itemShippedQty = Number(item.Quantity_Shipped || 0);
          return sum + (itemPrice * itemShippedQty);
        }, 0);
        
        categorySummaryData.push([
          categoryName,
          totalShippedQty.toString(),
          `$${totalPrice.toFixed(2)}`,
        ]);
      });

      // Check if we need a new page
      const estimatedHeight = categorySummaryData.length * 5 + 15;
      if (yPosition + estimatedHeight > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }

      // Category summary table
      const categoryTableHeaders = ['Sales Category', 'Total Shipped Qty', 'Total Price'];

      autoTableFn(doc, {
        head: [categoryTableHeaders],
        body: categorySummaryData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { 
          fontSize: 9, 
          cellPadding: 2.5, 
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
          textColor: [50, 50, 50]
        },
        headStyles: { 
          fillColor: [60, 60, 60], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold', 
          lineWidth: 0.1,
          fontSize: 9
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 120, halign: 'left' }, // Sales Category
          1: { cellWidth: 40, halign: 'center' }, // Total Shipped Qty
          2: { cellWidth: 30, halign: 'right' }, // Total Price
        },
        didDrawPage: (data: any) => {
          addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Totals section
      const totalPrice = Number(orderHeader.Total_Price || 0);
      const totalDiscount = Number(orderHeader.Total_Discount || 0);
      const totalDeposit = Number(orderHeader.Total_Deposit || 0);
      const deliveryCharge = Number(orderHeader.Delivery_Charge || 0);
      const total = totalPrice - totalDiscount + deliveryCharge;

      const totalsData = [
        ['Total Price', `$${totalPrice.toFixed(2)}`],
        ['Discount', `$${totalDiscount.toFixed(2)}`],
        ['Deposit', `$${totalDeposit.toFixed(2)}`],
        ['Delivery Charge', `$${deliveryCharge.toFixed(2)}`],
        ['Total', `$${total.toFixed(2)}`],
      ];

      // Check if we need a new page for totals
      if (yPosition + totalsData.length * 6 > pageHeight - 15) {
        doc.addPage();
        yPosition = margin;
      }

      // Totals section with modern styling
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(1);
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 3;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      totalsData.forEach(([label, value], index) => {
        doc.setFont('helvetica', index === totalsData.length - 1 ? 'bold' : 'normal');
        doc.setFontSize(index === totalsData.length - 1 ? 11 : 10);
        doc.text(label, margin, yPosition);
        doc.text(value, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 6;
      });

      yPosition += 10;

      // Add footer to all pages after content is complete
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooterToPage(doc, rabbitLogoDataUrl || undefined, i, totalPages);
      }

      // Open PDF in new window and trigger print dialog
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // Clean up the blob URL after printing
            URL.revokeObjectURL(pdfUrl);
          }, 250);
        };
      } else {
        // Fallback: if popup blocked, download the file
        doc.save(`Invoice_${orderHeader.Order_Number || 'Order'}.pdf`);
      }
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  const columns: TableColumn<any>[] = [
    {
      id: "products",
      label: "Products",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={2}>
          <img
            src={
              row.isDistributorImageShow && row.distributorImage
                ? row.distributorImage
                : row.masterImage
            }
            onError={(e) => {
              e.currentTarget.src = image;
            }}
            alt={row.ItemDescription || row.inventory?.Description}
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
          <Box>
            <Typography fontSize={14} fontWeight={500}>
              {row.ItemDescription || row.inventory?.Description}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Pack: {row.Pack} Case: {row.CaseCount} Size: {row.inventory?.UOM}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { id: "Item_Number", label: "Item Number" },
    { id: "Quantity_Ordered", label: "Qty", render: (row) => `${Number(row.Quantity_Ordered).toFixed(0)}` },
    {
      id: "Price",
      label: "Price",
      align: "right",
      render: (row) => {
        const price = Number(row.Price) || 0;
        if (!showWithPerpaidTax && row.PrepaidTax_Amount !== undefined) {
          const prepaidTaxAmount = Number(row.PrepaidTax_Amount) || 0;
          const displayPrice = price - prepaidTaxAmount;
          return `$${displayPrice.toFixed(2)}`;
        }
        return `$${price.toFixed(2)}`;
      },
    },
    // {
    //   id: "subtotal",
    //   label: "Subtotal",
    //   align: "right",
    //   render: (row) => `$${Number(row.Price * row.Quantity_Ordered).toFixed(2)}`,
    // },
    // {
    //   id: "discount",
    //   label: "Discount",
    //   align: "right",
    //   render: (row) => `$${Number(row.OffInvoice_Amount || 0).toFixed(2)}`,
    // },
    {
      id: "totalPrice",
      label: "Total Price",
      align: "right",
      render: (row) => {
        const price = Number(row.Price) || 0;
        const quantity = Number(row.Quantity_Ordered) || 0;
        const discount = Number(row.OffInvoice_Amount || 0);
        let totalPrice = (price * quantity) - discount;
        
        // If showWithPerpaidTax is false, subtract prepaid tax from total
        if (!showWithPerpaidTax && row.PrepaidTax_Amount !== undefined) {
          const prepaidTaxAmount = Number(row.PrepaidTax_Amount) || 0;
          totalPrice = totalPrice - (prepaidTaxAmount * quantity);
        }
        
        return `$${totalPrice.toFixed(2)}`;
      },
    },
  ];

  // Calculate totals
  const originalSubtotal = Number(orderHeader?.Total_Price) || 0;
  const discount = Number(orderHeader?.Total_Discount) || 0;
  const crv = Number(orderHeader?.Total_Deposit) || 0;
  const deliveryCharges = Number(orderHeader?.Delivery_Charge) || 0;
  const totalPrepaidTax = Number(orderHeader?.Total_PrepaidTax) || 0;
  
  // Calculate subtotal: when showWithPerpaidTax is false, subtract prepaid tax from subtotal
  let subtotal = originalSubtotal;
  if (!showWithPerpaidTax && totalPrepaidTax > 0) {
    subtotal = subtotal - totalPrepaidTax;
  }
  
  // Grand total should always show with prepaid tax (original total)
  const estimatedTotal = originalSubtotal - discount + deliveryCharges; // Grand total = original - discount + delivery charge (includes prepaid tax)
  // const subtotal =  orderHeader?.Total_Price || 0;
  //   ? (orderHistory.map((item: any) => item.Price * item.Quantity_Ordered).reduce((acc: any, curr: any) => acc + curr, 0) - (orderHistory.map((item: any) => item.OffInvoice_Amount || 0).reduce((acc: any, curr: any) => acc + curr, 0)))
  //   : 0;
  // const discount = orderHeader?.Total_Discount || 0;
  // const crv = orderHeader?.Total_Deposit || 0;
  // const deliveryCharges = orderHeader?.Delivery_Charge || 0;
  // const estimatedTotal = subtotal - discount + deliveryCharges;
  // const subtotal = orderHistory?.length > 0
  //   ? (orderHistory.map((item: any) => item.Price * item.Quantity_Ordered).reduce((acc: any, curr: any) => acc + curr, 0) - (orderHistory.map((item: any) => item.OffInvoice_Amount || 0).reduce((acc: any, curr: any) => acc + curr, 0)))
  //   : 0;
  // const discount = orderHistory?.length > 0
  //   ? orderHistory.map((item: any) => item.OffInvoice_Amount || 0).reduce((acc: any, curr: any) => acc + curr, 0)
  //   : 0;
  // const crv = orderHistory?.length > 0
  //   ? orderHistory.map((item: any) => item.CRV || 0).reduce((acc: any, curr: any) => acc + curr, 0)
  //   : 0;
  //    const deliveryCharges = orderHistory?.length > 0
  //   ? orderHistory.map((item: any) => item.Delivery_Charges || 0).reduce((acc: any, curr: any) => acc + curr, 0)
  //   : 0;
  // const estimatedTotal = subtotal - discount + deliveryCharges;

  return (
    <Box sx={{ padding: "20px" }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <KeyboardBackspaceOutlined
          onClick={() => navigate("/admin/order")}
          sx={{ cursor: "pointer" }}
        />
        <Typography fontSize={20} fontWeight={500}>
          Order Details
        </Typography>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              mb: 3,
              borderRadius: "10px",
              height: "100%",
              boxShadow: "none",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
              borderBottom="1px solid #E0E0E0"
              p={1.5}
            >
              <Typography fontSize={16} fontWeight={500}>
                Order Number: {orderHeader?.Order_Number || "-"}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="contained"
                  startIcon={picklistLoading ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
                  onClick={handlePrintPicklist}
                  size="small"
                  disabled={picklistLoading || pdfLoading}
                  sx={{ backgroundColor: "primary.main", color: "white" }}
                >
                  {picklistLoading ? "Generating..." : "Print Picklist"}
                </Button>
                {canPrintInvoice && (
                  <Button
                    variant="contained"
                    startIcon={pdfLoading ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
                    onClick={generateInvoicePDF}
                    size="small"
                    disabled={pdfLoading || picklistLoading}
                    sx={{ backgroundColor: "primary.main", color: "white" }}
                  >
                    {pdfLoading ? "Generating..." : "Print Invoice"}
                  </Button>
                )}
                <Typography
                  fontSize={14}
                  color="primary.main"
                  border={1}
                  borderColor="primary.main"
                  borderRadius={1}
                  px={1}
                  py={0.5}
                >
                  {totalItems} Items
                </Typography>
              </Box>
            </Box>
            <OrderStatusStepper currentStep={currentStep} dates={dates} />{" "}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {/* Price Details */}
          <PriceDetails
            subtotal={subtotal}
            // discount={discount}
            crv={crv}
            deliveryCharges={deliveryCharges}
            estimatedTotal={estimatedTotal}
            prepaidTax={totalPrepaidTax}
            showPrepaidTax={!showWithPerpaidTax && totalPrepaidTax > 0}
          />
        </Grid>

        <Grid size={12}>
          {/* Order Details Table */}
          <CommonTable
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            data={orderHistory}
            columns={columns}
            // containerHeight="calc(100vh - 575px)"
            loading={loading}
            filterComponent={null}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOrderDetail;
