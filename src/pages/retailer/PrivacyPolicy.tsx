import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

const PrivacyPolicy = () => {
  return (
    <Box sx={{ p: '0px 20px', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography sx={{ fontWeight: 400, mb: 2, color: 'text.primary', fontSize: 20 }}>
        Privacy Policy
      </Typography>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 3,
          bgcolor: 'background.paper',
          mx: 'auto',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose and protect your information when you use our website and services.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We collect information that you provide directly to us, including but not limited to your name, email address, phone number, and billing information when you register for an account or make a purchase. We also automatically collect certain information about your device when you use our website.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your information is used to provide and improve our services, process your transactions, communicate with you, and comply with legal obligations. We may share your information with service providers who assist in our operations, but we do not sell your personal information to third parties.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We may use cookies and similar tracking technologies to enhance your experience on our website. You can choose to disable cookies through your browser settings, but this may affect the functionality of our website.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Copyright © 2025 | WOOPSA | Version 1.0.0
        </Typography>
      </Paper>
    </Box>
  )
}

export default PrivacyPolicy