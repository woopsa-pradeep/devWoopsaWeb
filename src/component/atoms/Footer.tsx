import React from 'react';
import { Box, Container, Grid, Typography, IconButton } from '@mui/material';
import logo from '../../assets/Woopsa White.svg';
import UserWhiteIcon from '../../assets/User_White.svg';
import EmailWhiteIcon from '../../assets/Email_White.svg';
import LocationWhiteIcon from '../../assets/Location_White.svg';
import CallWhiteIcon from '../../assets/Call_White.svg';
import MapImage from './MapImage';

interface FooterProps {
  contactData?: {
    D_Name?: string;
    D_Email?: string;
    D_Phone?: string;
    D_Addr1?: string;
    D_City?: string;
    D_State?: string;
    D_Zip?: string;
    logo?: string;
    links?: Array<{
      id: string;
      name: string;
      url: string;
      logo?: string;
    }>;
    quickLinks?: Array<{
      id: string;
      name: string;
      link: string;
    }>;
    location?: Array<{
      id: number;
      latitude: string;
      longitude: string;
    }>;
  };
}

const Footer: React.FC<FooterProps> = ({ contactData }) => {
  

  
  return (
    <Box sx={{ backgroundColor: 'var(--color-Blue-900, #002C3F)' }}>
      {/* Main Footer Content */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={1}>
          {/* Company Information & Partnership */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ mb: {xs: 2, md: 0}}}>
            <Box sx={{ mb: 1 }}>
              <img src={contactData?.logo ? contactData.logo : logo} alt={contactData?.D_Name} style={{ height: '28px', marginBottom: '6px' }} />
            </Box>
            
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 500, mb: 1, fontSize: '13px' }}>
              Become a Retailer Partner
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, fontSize: '10px' }}>
              Interested in becoming a retailer partner? Fill out our comprehensive application form to get started with wholesale pricing and exclusive deals. 
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, fontSize: '10px' }}>
              Complete application takes approximately 10-15 minutes.
            </Typography>

            <Box 
              component="button"
              sx={{
                backgroundColor: '#3C7795',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.6rem',
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#357ABD'
                }
              }}
              onClick={() => window.location.href = '/contact-us'}
              >
              Apply Now
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid size={{ xs: 12, md: 3, lg: 2 }} sx={{ mb: {xs: 2, md: 0}}}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 500, mb: 2, fontSize: '0.9rem' }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Dynamic Quick Links */}
              {contactData?.quickLinks && contactData.quickLinks.length > 0 ? (
                contactData.quickLinks.map((quickLink) => (
                  <Typography 
                    key={quickLink.id}
                    component="a" 
                    href={quickLink.link} 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      textDecoration: 'none',
                      '&:hover': { color: 'white' },
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    {quickLink.name}
                  </Typography>
                ))
              ) : null}
              
              {/* Static Links */}
              <Typography 
                component="span" 
                onClick={() => window.location.href = '/privacy-policy'}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  textDecoration: 'none',
                  '&:hover': { color: 'white' },
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Privacy Policy
              </Typography>
              <Typography 
                component="span" 
                onClick={() => window.location.href = '/terms-conditions'}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  textDecoration: 'none',
                  '&:hover': { color: 'white' },
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Terms & Conditions
              </Typography>
              <Typography 
                component="span" 
                onClick={() => window.location.href = '/software-license'}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  textDecoration: 'none',
                  '&:hover': { color: 'white' },
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Software License
              </Typography>
              <Typography
                component="a"
                href="https://woopsamarketplace.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  '&:hover': { color: 'white' },
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Woopsa Marketplace
              </Typography>
            </Box>
          </Grid>

          {/* Contact Us */}
          <Grid size={{ xs: 12, md: 3, lg: 2 }} sx={{ mb: {xs: 2, md: 0}}}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 500, mb: 2, fontSize: '0.9rem' }}>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img src={UserWhiteIcon} alt="Person" style={{ width: '16px', height: '16px' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {contactData?.D_Name == "CAROLINA DISCOUNT TOBACCO" ? "CDT" : contactData?.D_Name || '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img src={LocationWhiteIcon} alt="Location" style={{ width: '16px', height: '16px' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {contactData?.D_Addr1 || '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img src={CallWhiteIcon} alt="Phone" style={{ width: '16px', height: '16px' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {contactData?.D_Phone ? `+1 (${contactData.D_Phone.slice(0, 3)}) ${contactData.D_Phone.slice(3, 6)}-${contactData.D_Phone.slice(6)}` : '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img src={EmailWhiteIcon} alt="Email" style={{ width: '16px', height: '16px' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', wordBreak: 'break-all',  '&:hover': { color: 'white' }, cursor: 'pointer' , textDecoration: 'none'}} component="a" href={`mailto:${contactData?.D_Email}`}>
                  {contactData?.D_Email || '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Map Section */}
          <Grid size={{ xs: 12, md: 3, lg: 3 }} sx={{ mb: {xs: 2, md: 0}}}>
            {contactData?.location && contactData.location.length > 0 ? (
              <MapImage
                latitude={contactData.location[0].latitude}
                longitude={contactData.location[0].longitude}
                width="95%"
                height="180px"
                address={`${contactData.D_Addr1}, ${contactData.D_City}, ${contactData.D_State} ${contactData.D_Zip}`}
              />
            ) : (
              <Box sx={{ 
                width: '95%', 
                height: '180px', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', fontSize: '0.7rem' }}>
                  Map Placeholder
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Social Media */}
          <Grid
            size={{ xs: 12, md: 3, lg: 2 }}
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'flex-start' },
              flexDirection: 'column',
              width: '100%',
              pl: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 500,
                mb: 1,
                fontSize: '0.9rem',
                textAlign: { xs: 'left', md: 'left' },
                width: '100%',
              }}
            >
              Social Media
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: { xs: 'flex-start', md: 'flex-start' },
                width: '100%',
              }}
            >
              {contactData?.links && contactData.links.length > 0 ? (
                contactData.links.map((link) => (
                  <IconButton
                    key={link.id}
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { color: 'white' },
                      padding: '2px',
                      '& .MuiSvgIcon-root': { fontSize: '1rem' },
                      minWidth: 26,
                      minHeight: 26,
                      borderRadius: '50%',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {link.logo ? (
                      <img
                        src={link.logo}
                        alt={link.name}
                        style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                        {link.name}
                      </Typography>
                    )}
                  </IconButton>
                ))
              ) : (
                "-"
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Bottom Copyright Bar */}
      <Box sx={{ backgroundColor: '#001721', py: 1 }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1
          }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
              Copyright © and powered by
            </Typography>
            <a
              href="https://woopsamarketplace.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <img src={logo} alt="WOOPSA" style={{ height: '14px' }} />
            </a>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem', ml: 1 }}>
              01.00.01
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
