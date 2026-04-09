import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, useTheme, useMediaQuery, Paper, Typography, CircularProgress, Alert, IconButton, Tooltip } from "@mui/material";
import PrivacyTip from "../../../assets/privacyPolicy (2).svg"
import PrivacyTipActive from "../../../assets/privacyPolicyActive.svg"
import TermsAndConditions from "../../../assets/termCondition.svg"
import TermsAndConditionsActive from "../../../assets/termConditionActive.svg"
import SoftwareLicense from "../../../assets/softwareLicence.svg"
import SoftwareLicenseActive from "../../../assets/softwareLicenceActive.svg"
import RefundPolicies from "../../../assets/refundPolicy.svg"
import RefundPoliciesActive from "../../../assets/refundPoliciesActive.svg"
import Disclaimers from "../../../assets/disclaimers.svg"
import DisclaimersActive from "../../../assets/disclaimersActive.svg"
import { getPolicies, updateRefundPolicies } from "../../../redux/apis/distrubutor/policiesApis";
import RichTextEditor from "../../atoms/RichTextEditor";
import CustomButton from "../../atoms/CustomButton";
import { Edit as EditIcon } from "@mui/icons-material";

interface PolicyData {
  id: number;
  PrivacyPolicies: string;
  TermsAndConditions: string;
  SoftwareLicense: string;
  RefundPolicies: string;
  Disclaimer: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

const PoliciesTabs = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery("(max-width:1199px)");
    const [value, setValue] = useState(0);
    const [policies, setPolicies] = useState<PolicyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [updating, setUpdating] = useState(false);
    
    // console.log("Policies state:", policies);
    // console.log("Loading state:", loading);
    // console.log("Error state:", error);
  
    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
      // Reset edit mode when switching tabs
      if (isEditing) {
        setIsEditing(false);
        setEditedContent("");
      }
    };

    useEffect(() => {
      const fetchPolicies = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response: any = await getPolicies();
          
          // Check if the response has the expected structure
          if (response && response.success && response.data) {
            setPolicies(response.data);
          } else {
            throw new Error("Invalid response format from API");
          }
        } catch (err: any) {
          console.error("Error fetching policies:", err);
          setError(err.message || "Failed to fetch policies");
        } finally {
          setLoading(false);
        }
      };

      fetchPolicies();
    }, []);

    const handleEditClick = () => {
      if (policies?.RefundPolicies) {
        // The content is already HTML, so we can use it directly
        setEditedContent(policies.RefundPolicies);
        setIsEditing(true);
      }
    };

    const handleSave = async () => {
      if (!editedContent.trim()) return;
      
      try {
        setUpdating(true);
        const response = await updateRefundPolicies({ RefundPolicies: editedContent });
        
        // Type assertion to handle the API response
        const apiResponse = response as ApiResponse;
        
        if (apiResponse && apiResponse.success) {
          // Update local state with the HTML content
          setPolicies(prev => prev ? { ...prev, RefundPolicies: editedContent } : null);
          setIsEditing(false);
          setEditedContent("");
        } else {
          throw new Error("Failed to update refund policies");
        }
      } catch (err: any) {
        console.error("Error updating refund policies:", err);
        setError(err.message || "Failed to update refund policies");
      } finally {
        setUpdating(false);
      }
    };

    const handleCancel = () => {
      setIsEditing(false);
      setEditedContent("");
    };

    const tabStyle = {
      alignItems: "center", 
      textTransform: "none",
      fontWeight: 400,
      justifyContent: "flex-start",
      minHeight: "auto",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      width: isSmallScreen ? "auto" : "100% !important",
      px: 2,
      mt: 1,
      mb: 1,
      py: 1,
      color: theme.palette.text.secondary,
      "&.Mui-selected": {
        color: theme.palette.primary.main,
        fontWeight: 500,
        borderLeft: isSmallScreen
          ? "none"
          : `4px solid ${theme.palette.primary.main}`,
        borderBottom: isSmallScreen
          ? `2px solid ${theme.palette.primary.main}`
          : "none",
      },
    };

    const renderPolicyContent = (policyType: string, content: string | null) => {
      if (!content) {
        return (
          <Box>
            <Typography 
              fontSize="20px"
              fontWeight={500} 
              mb={3}
              color={theme.palette.primary.main}
            >
              {policyType}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              No content available for {policyType.toLowerCase()}.
            </Alert>
            <Typography 
              fontSize="14px"
              fontWeight={400}
              lineHeight={1.8}
              color={theme.palette.text.secondary}
            >
              This section is currently being updated. Please check back later for the complete {policyType.toLowerCase()}.
            </Typography>
          </Box>
        );
      }

      return (
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography 
              fontSize="20px"
              fontWeight={500} 
              color={theme.palette.primary.main}
            >
              {policyType}
            </Typography>
            {policyType === "Refund Policy" && !isEditing && (
              <Tooltip title="Edit Refund Policy" arrow>
                <IconButton
                  onClick={handleEditClick}
                  size="small"
                  sx={{ 
                    color: theme.palette.primary.main,
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          {isEditing && policyType === "Refund Policy" ? (
            <Box>
              <RichTextEditor
                value={editedContent}
                onChange={setEditedContent}
                placeholder="Enter refund policies content..."
                height="400px"
              />
              <Box display="flex" gap={2} mt={2}>
                <CustomButton
                  onClick={handleSave}
                  loading={updating}
                  buttonType="primary"
                  appearance="filled"
                  size="medium"
                  fullWidth={false}
                >
                  {updating ? 'Saving...' : 'Save'}
                </CustomButton>
                <CustomButton
               onClick={handleCancel}
              disabled={updating}
              buttonType="cancel"
              appearance="outlined"
              size="medium"
             fullWidth={false}
             sx={{
             color: 'text.primary',
            borderColor: 'divider',
            bgcolor: 'background.paper',
           "&:hover": {
            bgcolor: 'action.hover',
            borderColor: 'primary.main'
            },
          "&.Mui-disabled": {
           color: 'text.disabled',
           borderColor: 'divider',
          bgcolor: 'action.disabledBackground'
      }
    }}
        >
         Cancel
        </CustomButton>
              </Box>
            </Box>
          ) : (
            <Box
              dangerouslySetInnerHTML={{ __html: content }}
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1.8,
                color: theme.palette.text.secondary,
                '& p': {
                  margin: '0 0 12px 0',
                },
                '& strong': {
                  fontWeight: 600,
                },
                '& br': {
                  marginBottom: '8px',
                },
                '& ul, & ol': {
                  paddingLeft: '24px',
                  margin: '8px 0',
                },
                '& li': {
                  margin: '4px 0',
                },
              }}
            />
          )}
        </Box>
      );
    };

    const getPolicyContent = (tabIndex: number): string | null => {
      if (!policies) return null;
      
      switch (tabIndex) {
        case 0: return policies.PrivacyPolicies;
        case 1: return policies.TermsAndConditions;
        case 2: return policies.SoftwareLicense;
        case 3: return policies.RefundPolicies;
        case 4: return policies.Disclaimer;
        default: return null;
      }
    };

    const getPolicyTitle = (tabIndex: number): string => {
      switch (tabIndex) {
        case 0: return " Privacy Policy";
        case 1: return "Terms and Conditions";
        case 2: return "Software License";
        case 3: return "Refund Policy";
        case 4: return "Disclaimers";
        default: return "";
      }
    };

    return (
      <Box
        display="flex"
        flexDirection={isSmallScreen ? "column" : "row"}
        mt={3}
        gap={3}
        sx={{
          height: isSmallScreen ? "auto" : "calc(100vh - 223px)",
          overflow: "hidden",
        }}
      >
        <Paper
          elevation={1}
          sx={{
            width: isSmallScreen ? "100%" : "250px !important",
            minWidth: isSmallScreen ? "auto" : "250px !important",                      
            borderRadius: 3,
            overflow: isSmallScreen ? "hidden" : "auto",
            height: isSmallScreen ? "auto" : "100%",
            boxShadow: "none"
          }}
        >
          <Tabs
            orientation={isSmallScreen ? "horizontal" : "vertical"}
            variant="scrollable"
            value={value}
            onChange={handleChange}
            sx={{ py: isSmallScreen ? 0 : 2 }}
            TabIndicatorProps={{ style: { display: "none" } }}
          >
            <Tab
              icon={value === 0 ? <img src={PrivacyTipActive} alt="Privacy Policy" /> : <img src={PrivacyTip} alt="Privacy Policy" />}
              iconPosition="start"
              label=" Privacy Policy"
              sx={tabStyle}
            />
            <Tab
              icon={value === 1 ? <img src={TermsAndConditionsActive} alt="Terms and Conditions" /> : <img src={TermsAndConditions} alt="Terms and Conditions" />}
              iconPosition="start"
              label="Terms and Conditions"
              sx={tabStyle}
            />
            <Tab
              icon={value === 2 ? <img src={SoftwareLicenseActive} alt="Software License" /> : <img src={SoftwareLicense} alt="Software License" />}
              iconPosition="start"
              label="Software License"
              sx={tabStyle}
            />
            <Tab
              icon={value === 3 ? <img src={RefundPoliciesActive} alt="Refund Policy" /> : <img src={RefundPolicies} alt="Refund Policy" />}
              iconPosition="start"
              label="Refund Policy"
              sx={tabStyle}
            />
            <Tab
              icon={value === 4 ? <img src={DisclaimersActive} alt="Disclaimers" /> : <img src={Disclaimers} alt="Disclaimers" />}
              iconPosition="start"
              label="Disclaimers"
              sx={tabStyle}
            />
          </Tabs>
        </Paper>

        <Paper
          elevation={1}
          sx={{
            flexGrow: 1,
            borderRadius: 3,
            p: 3,
            boxShadow: "none",
            overflow: isSmallScreen ? "hidden" : "auto",
            height: isSmallScreen ? "auto" : "100%",
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : policies ? (
            renderPolicyContent(getPolicyTitle(value), getPolicyContent(value))
          ) : (
            <Alert severity="warning">
              No policies data available.
            </Alert>
          )}
        </Paper>
      </Box>
    );
};

export default PoliciesTabs;