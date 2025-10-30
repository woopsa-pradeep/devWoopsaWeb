import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, useTheme, useMediaQuery, Paper, Typography, CircularProgress, Alert } from "@mui/material";
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
import { getPolicies } from "../../../redux/apis/retailer/policiesApis";

interface PolicyData {
  id: number;
  PrivacyPolicies: string;
  TermsAndConditions: string;
  SoftwareLicense: string;
  RefundPolicies: string;
  Disclaimer: string | null;
}

const RetailerPoliciesTabs = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery("(max-width:1199px)");
    const [value, setValue] = useState(0);
    const [policies, setPolicies] = useState<PolicyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchPolicies = async () => {
        try {
          setLoading(true);
          const response : any = await getPolicies();
          setPolicies(response?.data);
          setError(null);
        } catch (err) {
          setError('Failed to fetch policies. Please try again later.');
          console.error('Error fetching policies:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchPolicies();
    }, []);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };

    const getPolicyContent = (policyType: string) => {
      if (!policies) return '';
      
      switch (policyType) {
        case ' Privacy Policy':
          return policies.PrivacyPolicies;
        case 'Terms and Conditions':
          return policies.TermsAndConditions;
        case 'Software License':
          return policies.SoftwareLicense;
        case 'Refund Policy':
          return policies.RefundPolicies;
        case 'Disclaimers':
          return policies.Disclaimer || 'No disclaimer information available.';
        default:
          return '';
      }
    };

    const getPolicyTitle = (policyType: string) => {
      switch (policyType) {
        case ' Privacy Policy':
          return ' Privacy Policy';
        case 'Terms and Conditions':
          return 'Terms and Conditions';
        case 'Software License':
          return 'Software License';
        case 'Refund Policy':
          return 'Refund Policy';
        case 'Disclaimers':
          return 'Disclaimers';
        default:
          return policyType;
      }
    };

    const renderPolicyContent = (policyType: string) => {
      if (loading) {
        return (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        );
      }

      if (error) {
        return (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        );
      }

      const content = getPolicyContent(policyType);
      
      return (
        <Box>
          <Typography 
            fontSize="20px"
            fontWeight={500} 
            mb={3}
            color={theme.palette.primary.main}
          >
            {getPolicyTitle(policyType)}
          </Typography>
          <Box
            dangerouslySetInnerHTML={{ __html: content }}
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: theme.palette.text.secondary,
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                margin: '16px 0 8px 0',
                // fontWeight: 600,
                // lineHeight: 1.3,
                // color: theme.palette.primary.main,
              },
              // '& h1': { fontSize: '24px' },
              // '& h2': { fontSize: '20px' },
              // '& h3': { fontSize: '18px' },
              // '& h4': { fontSize: '16px' },
              // '& h5': { fontSize: '14px' },
              // '& h6': { fontSize: '12px' },
              '& p': {
                margin: '0 0 12px 0',
              },
              '& ul, & ol': {
                paddingLeft: '24px',
                margin: '8px 0',
              },
              '& li': {
                margin: '4px 0',
              },
              '& strong, & b': {
                fontWeight: 600,
              },
              '& em, & i': {
                fontStyle: 'italic',
              },
            }}
          />
        </Box>
      );
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
          {value === 0 && renderPolicyContent(" Privacy Policy")}
          {value === 1 && renderPolicyContent("Terms and Conditions")}
          {value === 2 && renderPolicyContent("Software License")}
          {value === 3 && renderPolicyContent("Refund Policy")}
          {value === 4 && renderPolicyContent("Disclaimers")}
        </Paper>
      </Box>
    );
};

export default RetailerPoliciesTabs;