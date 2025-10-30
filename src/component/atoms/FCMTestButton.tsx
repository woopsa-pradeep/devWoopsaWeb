import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { initializeFCMAndSendToken, getStoredFcmToken, isFCMSupported } from '../../utils/fcmUtils';
import { isNotificationPermissionGranted } from '../../firebase-messaging';

const FCMTestButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleTestFCM = async () => {
    setLoading(true);
    setStatus('');
    setError('');

    try {
      // Check if FCM is supported
      if (!isFCMSupported()) {
        setError('FCM is not supported in this browser');
        return;
      }

      setStatus('Checking notification permission...');
      
      // Check permission
      if (!isNotificationPermissionGranted()) {
        setStatus('Requesting notification permission...');
        const granted = await new Promise<boolean>((resolve) => {
          Notification.requestPermission().then((permission) => {
            resolve(permission === 'granted');
          });
        });
        
        if (!granted) {
          setError('Notification permission denied by user');
          return;
        }
      }

      setStatus('Initializing FCM...');
      
      // Initialize FCM
      const token = await initializeFCMAndSendToken();
      
      if (token) {
        setStatus(`FCM initialized successfully! Token: ${token.substring(0, 20)}...`);
      } else {
        setError('Failed to get FCM token');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStoredToken = () => {
    const token = getStoredFcmToken();
    if (token) {
      setStatus(`Stored token: ${token.substring(0, 20)}...`);
    } else {
      setStatus('No stored token found');
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        FCM Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleTestFCM} 
          disabled={loading}
          sx={{ mr: 1 }}
        >
          {loading ? 'Testing...' : 'Test FCM'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={handleCheckStoredToken}
        >
          Check Stored Token
        </Button>
      </Box>

      {status && (
        <Alert severity="info" sx={{ mb: 1 }}>
          {status}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        FCM Supported: {isFCMSupported() ? 'Yes' : 'No'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Permission: {isNotificationPermissionGranted() ? 'Granted' : 'Not Granted'}
      </Typography>
    </Box>
  );
};

export default FCMTestButton; 