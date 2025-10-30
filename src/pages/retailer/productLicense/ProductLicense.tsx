import React from 'react';
import { Box, Paper, Typography, Link } from '@mui/material';

const ProductLicense = () => {
  return (
    <Box sx={{ p: '0px 20px', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography sx={{ fontWeight: 400, mb: 2, color: 'text.primary', fontSize: 20 }}>
        Product License
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
          VAS Global LLC software cannot be sold. There is absolutely no transfer of ownership of any software product of any kind. Rather, VAS Global LLC (AI) licenses the software product to the end user under the terms of the EULA applicable to the version of the software product licensed. The terms of this EULA may vary depending upon the specific software product (with the specific type, edition, and/or version of license being issued) and the specific territory in which the software product was obtained.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Territory means the country in which the VAS Global LLC software was acquired, unless (i) the software acquired resides in a member country of the European Union or the European Free Trade Associations, in which the case territory means all the countries of the European Union and the European Free Trade Association; or (ii) otherwise specified in the software product and associated materials.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Unauthorized reproduction, appropriation of, or access to, copyrighted materials (as defined below) is expressly prohibited. Please refer to the EULA terms for software terms that may supersede any on-screen EULA found within the software product.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Unless you have another agreement directly with AI that controls and alters use of AI Software Products, the terms and conditions of this EULA apply to you. The VAS Global LLC software as described in the computer program in which this EULA is embedded or that is delivered prepackaged, or downloaded, with this EULA ("software") and its associated materials in this package consisting of any or all of: DVDs, programs, documentation, guides, database schema, database models, database hierarchies, database organization, data, Web Services, and additional components of the products, procedures and techniques) ("Associated Materials") are copyrighted, and all rights in, title to, and ownership thereof are reserved by VAS Global LLC (collectively, the "copyrighted materials").
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Copyright laws and international copyright treaties, as well as other intellectual property laws and treaties, protect copyrighted materials. Installing, copying, uploading, updating, accessing, using or benefiting from the use of all or any portion of this software product or any copyrighted materials except as permitted by this EULA constitutes a material breach of this EULA and is an infringement of the copyright and other intellectual property rights of AI.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Copyright © 2025 | WOOPSA | Version{' '}
          <Link href="#" underline="hover" target="_blank" rel="noopener">
            1.0.0
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProductLicense;