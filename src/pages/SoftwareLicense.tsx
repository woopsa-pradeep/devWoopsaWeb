import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress, Drawer, IconButton, useMediaQuery, useTheme, List, ListItemText, ListItemButton } from '@mui/material';
import CustomButton from '../component/atoms/CustomButton';
import Footer from '../component/atoms/Footer';
import './LandingPage.css';
import distributorLogo from '../assets/Woopsa White.svg';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Import APIs
import { getContactUsData } from '../redux/apis/landingPageApis';

const SoftwareLicense: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Responsive navigation state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
//   const [isAgeConfirmed, setIsAgeConfirmed] = useState(() => {
//     const isAgeVerified = sessionStorage.getItem('woopsa_age_verified');
//     return !!isAgeVerified;
//   });
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check age verification on component mount
  useEffect(() => {
    try {
      const isAgeVerified = sessionStorage.getItem('woopsa_age_verified');
      if (!isAgeVerified) {
        navigate('/');
      }
    } catch (error) {
      console.log('Error checking age verification:', error);
      navigate('/');
    }
  }, [navigate]);

  // Fetch contact data
  useEffect(() => {
    let isMounted = true;

    const fetchContactData = async () => {
      try {
        setLoading(true);
        const contactRes = await getContactUsData();
        if (isMounted && contactRes) {
          setContactData(contactRes);
        }
      } catch (err) {
        console.error('Error fetching contact data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContactData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginRedirect = () => {
    sessionStorage.removeItem('woopsa_age_verified');
    navigate('/login');
  };

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#3C7795', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#3C7795' }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img
              src={contactData?.logo || distributorLogo}
              alt={contactData?.D_Name || "Distributor"}
              style={{ height: '35px', cursor: 'pointer' }}
              onClick={() => navigate("/")}
              onError={(e) => {
                e.currentTarget.src = distributorLogo;
              }}
            />
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="nav-menu">
              <a
                href="#"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
              >
                Home
              </a>
              <a
                href="#"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/products');
                }}
              >
                All Products
              </a>
              <a
                href="#"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/contact-us');
                }}
              >
                Become a Retailer
              </a>
              <CustomButton
                onClick={handleLoginRedirect}
                buttonType="primary"
                appearance="filled"
                size="medium"
                fullWidth={false}
                sx={{ mt: 0 }}
              >
                Login
              </CustomButton>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CustomButton
                onClick={handleLoginRedirect}
                buttonType="primary"
                appearance="filled"
                size="small"
                fullWidth={false}
                sx={{ mt: 0 }}
              >
                Login
              </CustomButton>
              <IconButton
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ color: 'primary.main' }}
              >
                <MenuIcon />
              </IconButton>
            </div>
          )}
        </div>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '280px',
              backgroundColor: '#f8f9fa',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <img
                src={contactData?.logo || distributorLogo}
                alt={contactData?.D_Name || "Distributor"}
                style={{ height: '30px' }}
                onError={(e) => {
                  e.currentTarget.src = distributorLogo;
                }}
              />
              <IconButton onClick={() => setMobileDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <List sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate('/');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="Home" />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate('/products');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="All Products" />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate('/contact-us');
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText primary="Become a Retailer" />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
      </nav>

      {/* Content */}
      <div style={{ marginTop: '80px', minHeight: 'calc(100vh - 80px - 200px)' }}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="h3" sx={{ mb: 4, color: '#2c3e50', fontWeight: 600 }}>
            SOFTWARE PRODUCT LICENSE
          </Typography>
          
          <Typography variant="h5" sx={{ mb: 3, color: '#34495e', fontWeight: 500 }}>
            Last Updated: December 2024
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: '#555' }}>
              VAS Global LLC software cannot be sold. There is absolutely no transfer of ownership of any software product of any kind. Rather, VAS Global LLC (AI) licenses the software product to the end user under the terms of the EULA applicable to the version of the software product licensed. The terms of this EULA may vary depending upon the specific software product (with the specific type, edition, and/or version of license being issued) and the specific territory in which the software product was obtained.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              Territory
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: '#555' }}>
              Territory means the country in which the VAS Global LLC software was acquired, unless (i) the software acquired resides in a member country of the European Union or the European Free Trade Associations, in which the case territory means all the countries of the European Union and the European Free Trade Association; or (ii) otherwise specified in the software product and associated materials.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              Copyright and Intellectual Property
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: '#555' }}>
              Unauthorized reproduction, appropriation of, or access to, copyrighted materials (as defined below) is expressly prohibited. Please refer to the EULA terms for software terms that may supersede any on-screen EULA found within the software product.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: '#555' }}>
              Unless you have another agreement directly with Al that controls and alters use of Al Software Products, the terms and conditions of this EULA apply to you. The VAS Global LLC software as described in the computer program in which this EULA is embedded or that is delivered prepackaged, or downloaded, with this EULA ("Software") and its associated materials in this package consisting of any or all of: DVDs, programs, documentation, guides, database schema, database models, database hierarchies, database organization, data, Web Services, and additional components of the products, procedures and techniques) ("Associated Materials") are copyrighted, and all rights in, title to, and ownership thereof are reserved by VAS Global LLC (collectively, the "copyrighted materials").
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              Legal Protection
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: '#555' }}>
              Copyright laws and international copyright treaties, as well as other intellectual property laws and treaties, protect copyrighted materials. Installing, copying, uploading, updating, accessing, using or benefiting from the use of all or any portion of this software product or any copyrighted materials except as permitted by this EULA constitutes a material breach of this EULA and is an infringement of the copyright and other intellectual property rights of Al.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              Contact Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: '#555' }}>
              If you have any questions about this Software License Agreement, please contact us at:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: '#555' }}>
              Email: licensing@woopsa.com<br />
              Phone: +1 (555) 123-4567<br />
              Address: 123 License Street, Software City, SC 12345
            </Typography>
          </Box>
        </Container>
      </div>

      {/* Footer */}
      <Footer contactData={contactData} />
    </div>
  );
};

export default SoftwareLicense;
