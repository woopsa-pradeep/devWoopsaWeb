import React, { useState } from 'react';
import { Box, Typography, Grid, IconButton, CircularProgress, Link } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileUploadInput from '../../atoms/FileUploadInput';
import CustomButton from '../../atoms/CustomButton';
import { uploadImages, createRetailerDocuments, updateRetailerDocuments } from '../../../redux/apis/profileAPIs';
import toast from 'react-hot-toast';

interface DocumentsProps {
  documents: {
    id: number;
    feinDocument: string | null;
    customerNumber: number;
    attachments: string[];
    salesTaxDoc: string | null;
    CigTaxDoc: string | null;
    licenseAttachments: string[] | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  customerNumber: number;
  onDocumentsUpdate: () => void;
}

const Documents: React.FC<DocumentsProps> = ({ documents, customerNumber, onDocumentsUpdate }) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [salesTaxDoc, setSalesTaxDoc] = useState<File | null>(null);
  const [CigTaxDoc, setCigTaxDoc] = useState<File | null>(null);
  const [licenseAttachments, setLicenseAttachments] = useState<File[]>([]);
  const [feinDocument, setFeinDocument] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Helper function to upload a file and get URL
  const uploadFileAndGetUrl = async (file: File): Promise<string> => {
    try {
      const response = await uploadImages(file) as any;
      return response?.data?.url || response?.url || response?.data || '';
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Function to save documents
  const saveDocuments = async (documentData: {
    attachments?: string[];
    salesTaxDoc?: string | null;
    CigTaxDoc?: string | null;
    licenseAttachments?: string[];
    feinDocument?: string | null;
  }) => {
    try {
      const payload = {
        customerNumber,
        ...documentData,
      };

      if (documents?.id) {
        // Update existing document
        await updateRetailerDocuments(documents.id, payload);
      } else {
        // Create new document
        await createRetailerDocuments(payload);
      }
    } catch (error: any) {
      console.error('Error saving documents:', error);
      throw error;
    }
  };

  // Handle file upload and save
  const handleFileUpload = async (file: File, type: 'attachments' | 'salesTaxDoc' | 'CigTaxDoc' | 'licenseAttachments' | 'feinDocument') => {
    try {
      setUploading(true);
      // Upload file and get URL
      const url = await uploadFileAndGetUrl(file);
      
      // Get current document URLs
      const currentUrls = {
        attachments: documents?.attachments || [],
        salesTaxDoc: documents?.salesTaxDoc || null,
        CigTaxDoc: documents?.CigTaxDoc || null,
        licenseAttachments: documents?.licenseAttachments || [],
        feinDocument: documents?.feinDocument || null,
      };
      
      // Update the appropriate field
      if (type === 'attachments') {
        currentUrls.attachments = [...currentUrls.attachments, url];
      } else if (type === 'licenseAttachments') {
        currentUrls.licenseAttachments = [...(currentUrls.licenseAttachments || []), url];
      } else {
        currentUrls[type] = url;
      }
      
      // Save to retailer documents
      await saveDocuments(currentUrls);
      
      toast.success('Document uploaded successfully!');
      onDocumentsUpdate();
      
      // Clear the file from state
      if (type === 'attachments') {
        setAttachments([]);
      } else if (type === 'licenseAttachments') {
        setLicenseAttachments([]);
      } else if (type === 'salesTaxDoc') {
        setSalesTaxDoc(null);
      } else if (type === 'CigTaxDoc') {
        setCigTaxDoc(null);
      } else if (type === 'feinDocument') {
        setFeinDocument(null);
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(error?.response?.data?.message || `Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle multiple file uploads
  const handleMultipleFileUpload = async (files: File[], type: 'attachments' | 'licenseAttachments') => {
    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        const url = await uploadFileAndGetUrl(file);
        uploadedUrls.push(url);
      }
      
      // Get current document URLs
      const currentUrls = {
        attachments: documents?.attachments || [],
        salesTaxDoc: documents?.salesTaxDoc || null,
        CigTaxDoc: documents?.CigTaxDoc || null,
        licenseAttachments: documents?.licenseAttachments || [],
        feinDocument: documents?.feinDocument || null,
      };
      
      // Update the appropriate field
      if (type === 'attachments') {
        currentUrls.attachments = [...currentUrls.attachments, ...uploadedUrls];
      } else {
        currentUrls.licenseAttachments = [...(currentUrls.licenseAttachments || []), ...uploadedUrls];
      }
      
      // Save to retailer documents
      await saveDocuments(currentUrls);
      
      toast.success('Documents uploaded successfully!');
      onDocumentsUpdate();
      
      // Clear files from state
      if (type === 'attachments') {
        setAttachments([]);
      } else {
        setLicenseAttachments([]);
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(error?.response?.data?.message || `Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle remove document
  const handleRemoveDocument = async (type: 'attachments' | 'salesTaxDoc' | 'CigTaxDoc' | 'licenseAttachments' | 'feinDocument', index?: number) => {
    try {
      setUploading(true);
      const currentUrls = {
        attachments: documents?.attachments || [],
        salesTaxDoc: documents?.salesTaxDoc || null,
        CigTaxDoc: documents?.CigTaxDoc || null,
        licenseAttachments: documents?.licenseAttachments || [],
        feinDocument: documents?.feinDocument || null,
      };
      
      if (type === 'attachments' && index !== undefined) {
        currentUrls.attachments = currentUrls.attachments.filter((_, i) => i !== index);
      } else if (type === 'licenseAttachments' && index !== undefined) {
        currentUrls.licenseAttachments = (currentUrls.licenseAttachments || []).filter((_, i) => i !== index);
      } else if (type === 'salesTaxDoc') {
        currentUrls.salesTaxDoc = null;
      } else if (type === 'CigTaxDoc') {
        currentUrls.CigTaxDoc = null;
      } else if (type === 'feinDocument') {
        currentUrls.feinDocument = null;
      }
      
      await saveDocuments(currentUrls);
      toast.success('Document removed successfully!');
      onDocumentsUpdate();
    } catch (error: any) {
      console.error('Error removing document:', error);
      toast.error(error?.response?.data?.message || 'Failed to remove document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography fontSize="18px" fontWeight={500} mb={4}>
        Documents
      </Typography>

      <Grid container spacing={3}>
        {/* Attachments (Multiple Files) */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
              Attachments (Max 3)
            </Typography>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const currentCount = attachments.length + (documents?.attachments?.length || 0);
                
                if (currentCount + files.length > 3) {
                  toast.error('Maximum 3 attachments allowed');
                  return;
                }
                
                setAttachments([...attachments, ...files]);
              }}
              style={{ display: 'none' }}
              id="attachments-upload"
              disabled={uploading}
            />
            <CustomButton
              onClick={() => {
                const currentCount = attachments.length + (documents?.attachments?.length || 0);
                if (currentCount >= 3) {
                  toast.error('Maximum 3 attachments allowed');
                  return;
                }
                document.getElementById('attachments-upload')?.click();
              }}
              buttonType="cancel"
              appearance="outlined"
              fullWidth={false}
              sx={{ mb: 1 }}
              disabled={uploading || (attachments.length + (documents?.attachments?.length || 0) >= 3)}
            >
              Select Files
            </CustomButton>
            {attachments.length > 0 && (
              <Box sx={{ mt: 1, mb: 1 }}>
                {attachments.map((file, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {file.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newFiles = attachments.filter((_, i) => i !== index);
                        setAttachments(newFiles);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <CustomButton
                  onClick={() => handleMultipleFileUpload(attachments, 'attachments')}
                  buttonType="primary"
                  appearance="filled"
                  fullWidth={false}
                  disabled={uploading}
                  sx={{ mt: 1 }}
                  icon={uploading ? <CircularProgress size={20} /> : null}
                >
                  Upload
                </CustomButton>
              </Box>
            )}
            {documents?.attachments && documents.attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
                  Existing attachments:
                </Typography>
                {documents.attachments.map((url, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: 12,
                        color: 'primary.main',
                        textDecoration: 'none',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {url.split('/').pop()}
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </Link>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveDocument('attachments', index)}
                      disabled={uploading}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Sales Tax Document */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FileUploadInput
            label="Sales Tax Document"
            onChange={(file) => setSalesTaxDoc(file)}
            accept=".pdf,.jpg,.jpeg,.png"
            value={salesTaxDoc}
            id="sales-tax-doc-upload"
            preview={documents?.salesTaxDoc || undefined}
          />
          {salesTaxDoc && (
            <CustomButton
              onClick={() => handleFileUpload(salesTaxDoc, 'salesTaxDoc')}
              buttonType="primary"
              appearance="filled"
              fullWidth={false}
              disabled={uploading}
              sx={{ mt: 1 }}
              icon={uploading ? <CircularProgress size={20} /> : null}
            >
              Upload
            </CustomButton>
          )}
          {documents?.salesTaxDoc && !salesTaxDoc && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Link
                href={documents.salesTaxDoc}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontSize: 12,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <VisibilityIcon sx={{ fontSize: 16 }} />
                View Document
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
              <CustomButton
                onClick={() => handleRemoveDocument('salesTaxDoc')}
                buttonType="cancel"
                appearance="outlined"
                fullWidth={false}
                disabled={uploading}
              >
                Remove
              </CustomButton>
            </Box>
          )}
        </Grid>

        {/* Cigarette Tax Document */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FileUploadInput
            label="Cigarette Tax Document"
            onChange={(file) => setCigTaxDoc(file)}
            accept=".pdf,.jpg,.jpeg,.png"
            value={CigTaxDoc}
            id="cig-tax-doc-upload"
            preview={documents?.CigTaxDoc || undefined}
          />
          {CigTaxDoc && (
            <CustomButton
              onClick={() => handleFileUpload(CigTaxDoc, 'CigTaxDoc')}
              buttonType="primary"
              appearance="filled"
              fullWidth={false}
              disabled={uploading}
              sx={{ mt: 1 }}
              icon={uploading ? <CircularProgress size={20} /> : null}
            >
              Upload
            </CustomButton>
          )}
          {documents?.CigTaxDoc && !CigTaxDoc && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Link
                href={documents.CigTaxDoc}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontSize: 12,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <VisibilityIcon sx={{ fontSize: 16 }} />
                View Document
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
              <CustomButton
                onClick={() => handleRemoveDocument('CigTaxDoc')}
                buttonType="cancel"
                appearance="outlined"
                fullWidth={false}
                disabled={uploading}
              >
                Remove
              </CustomButton>
            </Box>
          )}
        </Grid>

        {/* License Attachments (Multiple Files) */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
              License Attachments (Max 3)
            </Typography>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const currentCount = licenseAttachments.length + (documents?.licenseAttachments?.length || 0);
                
                if (currentCount + files.length > 3) {
                  toast.error('Maximum 3 license attachments allowed');
                  return;
                }
                
                setLicenseAttachments([...licenseAttachments, ...files]);
              }}
              style={{ display: 'none' }}
              id="license-attachments-upload"
              disabled={uploading}
            />
            <CustomButton
              onClick={() => {
                const currentCount = licenseAttachments.length + (documents?.licenseAttachments?.length || 0);
                if (currentCount >= 3) {
                  toast.error('Maximum 3 license attachments allowed');
                  return;
                }
                document.getElementById('license-attachments-upload')?.click();
              }}
              buttonType="cancel"
              appearance="outlined"
              fullWidth={false}
              sx={{ mb: 1 }}
              disabled={uploading || (licenseAttachments.length + (documents?.licenseAttachments?.length || 0) >= 3)}
            >
              Select Files
            </CustomButton>
            {licenseAttachments.length > 0 && (
              <Box sx={{ mt: 1, mb: 1 }}>
                {licenseAttachments.map((file, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {file.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newFiles = licenseAttachments.filter((_, i) => i !== index);
                        setLicenseAttachments(newFiles);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <CustomButton
                  onClick={() => handleMultipleFileUpload(licenseAttachments, 'licenseAttachments')}
                  buttonType="primary"
                  appearance="filled"
                  fullWidth={false}
                  disabled={uploading}
                  sx={{ mt: 1 }}
                  icon={uploading ? <CircularProgress size={20} /> : null}
                >
                  Upload
                </CustomButton>
              </Box>
            )}
            {documents?.licenseAttachments && documents.licenseAttachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
                  Existing license attachments:
                </Typography>
                {documents.licenseAttachments.map((url, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: 12,
                        color: 'primary.main',
                        textDecoration: 'none',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {url.split('/').pop()}
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </Link>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveDocument('licenseAttachments', index)}
                      disabled={uploading}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* FEIN Document */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FileUploadInput
            label="FEIN Document"
            onChange={(file) => setFeinDocument(file)}
            accept=".pdf,.jpg,.jpeg,.png"
            value={feinDocument}
            id="fein-document-upload"
            preview={documents?.feinDocument || undefined}
          />
          {feinDocument && (
            <CustomButton
              onClick={() => handleFileUpload(feinDocument, 'feinDocument')}
              buttonType="primary"
              appearance="filled"
              fullWidth={false}
              disabled={uploading}
              sx={{ mt: 1 }}
              icon={uploading ? <CircularProgress size={20} /> : null}
            >
              Upload
            </CustomButton>
          )}
          {documents?.feinDocument && !feinDocument && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Link
                href={documents.feinDocument}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontSize: 12,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <VisibilityIcon sx={{ fontSize: 16 }} />
                View Document
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
              <CustomButton
                onClick={() => handleRemoveDocument('feinDocument')}
                buttonType="cancel"
                appearance="outlined"
                fullWidth={false}
                disabled={uploading}
              >
                Remove
              </CustomButton>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Documents;

