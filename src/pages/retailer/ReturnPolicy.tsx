import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

const ReturnPolicy = () => {
  return (
    <Box sx={{ p: '0px 20px', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography sx={{ fontWeight: 400, mb: 2, color: 'text.primary', fontSize: 20 }}>
        Return Policy
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
          We want you to be completely satisfied with your purchase. If you are not satisfied with your purchase, you may return it within 30 days of receipt for a full refund of the item price, subject to the conditions outlined below.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging. To complete your return, we require a receipt or proof of purchase.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please note that certain items are non-returnable, including perishable goods, custom products, digital products, and items marked as final sale. Gift cards and downloadable software products are also non-returnable.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Shipping costs for returns are the responsibility of the customer unless the return is due to our error. If you receive a refund, the cost of return shipping will be deducted from your refund unless the return was due to our error.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Copyright © 2025 | WOOPSA | Version 1.0.0
        </Typography>
      </Paper>
    </Box>
  )
}

export default ReturnPolicy