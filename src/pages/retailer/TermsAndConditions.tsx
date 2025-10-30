import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

const TermsAndConditions = () => {
  return (
    <Box sx={{ p: '0px 20px', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography sx={{ fontWeight: 400, mb: 2, color: 'text.primary', fontSize: 20 }}>
        Terms and Conditions
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
          By accessing and using this website, you agree to be bound by these terms and conditions. Please read them carefully before using our services. If you do not agree with any part of these terms, you must not use our website.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The content of this website is for general information purposes only. We reserve the right to modify, suspend or discontinue any aspect of our services at any time without notice. We may also impose limits on certain features or restrict access to parts of the service without notice or liability.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You agree to use our website only for lawful purposes and in a manner that does not infringe the rights of any third party. You must not attempt to gain unauthorized access to our website, the server on which our website is stored, or any server, computer, or database connected to our website.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All intellectual property rights in the website and the material published on it are owned by us or our licensors. These works are protected by copyright laws and treaties around the world. All such rights are reserved.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These terms and conditions are governed by and construed in accordance with applicable laws. Any disputes relating to these terms and conditions shall be subject to the exclusive jurisdiction of the courts in the relevant jurisdiction.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Copyright © 2025 | WOOPSA | Version 1.0.0
        </Typography>
      </Paper>
    </Box>
  )
}

export default TermsAndConditions