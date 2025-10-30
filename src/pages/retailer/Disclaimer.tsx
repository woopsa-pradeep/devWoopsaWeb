import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

const Disclaimer = () => {
  return (
    <Box sx={{ p: '0px 20px', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography sx={{ fontWeight: 400, mb: 2, color: 'text.primary', fontSize: 20 }}>
        Disclaimer
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
          The information provided on this website is for general informational purposes only. While we strive to keep the information up to date and accurate, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability or availability of the information, products, services, or related graphics contained on the website.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Any reliance you place on such information is strictly at your own risk. In no event will we be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Through this website you may be able to link to other websites which are not under our control. We have no control over the nature, content and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Every effort is made to keep the website up and running smoothly. However, we take no responsibility for, and will not be liable for, the website being temporarily unavailable due to technical issues beyond our control.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All product specifications, prices, and availability are subject to change without notice. While we make every effort to provide accurate product and pricing information, pricing or typographical errors may occur. We reserve the right to correct any errors, inaccuracies or omissions and to change or update information at any time without prior notice.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Copyright © 2025 | WOOPSA | Version 1.0.0
        </Typography>
      </Paper>
    </Box>
  )
}

export default Disclaimer