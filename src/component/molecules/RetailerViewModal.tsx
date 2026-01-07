import React from 'react';
import {
  Box,
  Typography,
  Grid,
  // Chip,
  Paper,
  Link,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  LocationOn as LocationOnIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import CommonModal from '../atoms/CommonModal';

interface Retailer {
  C_Number: number;
  C_Name: string;
  C_Email: string;
  C_Inactive: boolean;
  C_CoName: string;
  C_PhoneMobile: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  C_DateCreated: string;
  Routes?: any;
  orderStats?: {
    ERP: number;
    Mobile: number;
    Web: number;
  };
  customerLimit?: {
    maxOrderLimit: number | null;
    minOrderAmount: number | null;
  };
  retailerDocuments?: {
    feinDocument: string | null;
    attachments: string[];
    salesTaxDoc: string | null;
    CigTaxDoc: string | null;
    licenseAttachments: string[];
  };
}

interface RetailerViewModalProps {
  retailer: Retailer | null;
  open: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) =>
  dayjs(dateString).format('MMM DD, YYYY · h:mm A');

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <Box >
    <Typography fontSize={12} fontWeight={400} color="text.secondary">
      {label}
    </Typography>
    <Typography fontSize={13} fontWeight={400} color="text.primary">
      {value || '-'}
    </Typography>
  </Box>
);

const SectionBox = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <Box mb={2}>
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      {icon}
      <Typography fontSize={14} fontWeight={400} color="text.primary">
        {title}
      </Typography>
    </Box>
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: 'paper',
        borderColor: '#eee',
      }}
    >
      {children}
    </Paper>
  </Box>
);

const RetailerViewModal: React.FC<RetailerViewModalProps> = ({
  retailer,
  open,
  onClose,
}) => {
  if (!retailer) return null;

  return (
    <CommonModal open={open} onClose={onClose} size="md" title="Retailer Details">
      <Box sx={{ p: 1 }}>
        {/* Header */}
        {/* <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
      
          <Chip
            label={retailer.C_Inactive ? 'Inactive' : 'Active'}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              fontWeight: 500,
              px: 1.2,
              borderRadius: '6px',
              backgroundColor: retailer.C_Inactive ? '#fbeaea' : '#eafaf2',
              color: retailer.C_Inactive ? '#d32f2f' : '#2e7d32',
            }}
          />
        </Box> */}

        {/* Sections */}
        <SectionBox icon={<PersonIcon fontSize="small" color="primary" />} title="Basic Info">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <InfoItem label="Customer ID" value={retailer.C_Number} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <InfoItem label="Name" value={retailer.C_Name} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <InfoItem label="Company" value={retailer.C_CoName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <InfoItem label="Created At" value={formatDate(retailer.C_DateCreated)} />
            </Grid>
          </Grid>
        </SectionBox>

        <SectionBox icon={<PhoneIcon fontSize="small" color="primary" />} title="Contact">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <InfoItem label="Phone" value={retailer.C_PhoneMobile} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <InfoItem label="Email" value={retailer.C_Email} />
            </Grid>
          </Grid>
        </SectionBox>
        {retailer.Routes && retailer.Routes.length > 0 && (
          <SectionBox icon={<LocationOnIcon fontSize="small" color="primary" />} title="Routes">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem label="Routes" value={retailer.Routes[0]?.Route_Number || 'N/A'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem label="Stop Number" value={retailer.Routes[0]?.Stop_Number || 'N/A'} />
              </Grid>
            </Grid>
          </SectionBox>
        )}

        <SectionBox icon={<LocationIcon fontSize="small" color="primary" />} title="Address">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <InfoItem label="Address" value={retailer.C_Address} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <InfoItem label="City" value={retailer.C_City} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <InfoItem label="State" value={retailer.C_State} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <InfoItem label="ZIP Code" value={retailer.C_Zip} />
            </Grid>
          </Grid>
        </SectionBox>

        {retailer.retailerDocuments && (
          <SectionBox icon={<AttachFileIcon fontSize="small" color="primary" />} title="Documents">
            <Grid container spacing={2}>
              {retailer.retailerDocuments.feinDocument && (
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography fontSize={12} fontWeight={400} color="text.secondary" mb={0.5}>
                      FEIN Document
                    </Typography>
                    <Link
                      href={retailer.retailerDocuments.feinDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: 13, cursor: 'pointer' }}
                    >
                      View FEIN Document
                    </Link>
                  </Box>
                </Grid>
              )}
              {retailer.retailerDocuments.salesTaxDoc && (
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography fontSize={12} fontWeight={400} color="text.secondary" mb={0.5}>
                      Sales Tax Document
                    </Typography>
                    <Link
                      href={retailer.retailerDocuments.salesTaxDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: 13, cursor: 'pointer' }}
                    >
                      View Sales Tax Document
                    </Link>
                  </Box>
                </Grid>
              )}
              {retailer.retailerDocuments.CigTaxDoc && (
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography fontSize={12} fontWeight={400} color="text.secondary" mb={0.5}>
                      Cig Tax Document
                    </Typography>
                    <Link
                      href={retailer.retailerDocuments.CigTaxDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: 13, cursor: 'pointer' }}
                    >
                      View Cig Tax Document
                    </Link>
                  </Box>
                </Grid>
              )}
              {retailer.retailerDocuments.attachments && retailer.retailerDocuments.attachments.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography fontSize={12} fontWeight={400} color="text.secondary" mb={1}>
                      Attachments
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {retailer.retailerDocuments.attachments.map((url: string, idx: number) => (
                        <Link
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ fontSize: 13, cursor: 'pointer' }}
                        >
                          Attachment {idx + 1}
                        </Link>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
              {retailer.retailerDocuments.licenseAttachments && retailer.retailerDocuments.licenseAttachments.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography fontSize={12} fontWeight={400} color="text.secondary" mb={1}>
                      License Attachments
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {retailer.retailerDocuments.licenseAttachments.map((url: string, idx: number) => (
                        <Link
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ fontSize: 13, cursor: 'pointer' }}
                        >
                          License Attachment {idx + 1}
                        </Link>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
              {!retailer.retailerDocuments.feinDocument && 
               !retailer.retailerDocuments.salesTaxDoc && 
               !retailer.retailerDocuments.CigTaxDoc && 
               (!retailer.retailerDocuments.attachments || retailer.retailerDocuments.attachments.length === 0) &&
               (!retailer.retailerDocuments.licenseAttachments || retailer.retailerDocuments.licenseAttachments.length === 0) && (
                <Grid size={{ xs: 12 }}>
                  <Typography fontSize={13} color="text.secondary">No documents available</Typography>
                </Grid>
              )}
            </Grid>
          </SectionBox>
        )}
      </Box>
    </CommonModal>
  );
};

export default RetailerViewModal;
