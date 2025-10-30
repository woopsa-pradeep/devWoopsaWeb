export interface DeviceInfo {
  deviceType: string;
  deviceName: string;
  deviceId: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  // Device type is always 'web' for web applications
  const deviceType = 'web';
  
  // Get device name from user agent
  const getUserAgent = (): string => {
    const userAgent = navigator.userAgent;
    
    // Detect browser
    if (userAgent.includes('Chrome')) {
      return 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('Safari')) {
      return 'Safari';
    } else if (userAgent.includes('Edge')) {
      return 'Edge';
    } else if (userAgent.includes('Opera')) {
      return 'Opera';
    } else {
      return 'Unknown Browser';
    }
  };
  
  // Get device name (OS + Browser)
  const getDeviceName = (): string => {
    const userAgent = navigator.userAgent;
    let os = 'Unknown OS';
    
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS')) {
      os = 'iOS';
    }
    
    const browser = getUserAgent();
    return `${os} - ${browser}`;
  };

  return {
    deviceType,
    deviceName: getDeviceName(),
    deviceId: getDeviceName()
  };
};

export const getDeviceHeaders = () => {
  const deviceInfo = getDeviceInfo();
  return {
    'x-device-type': deviceInfo.deviceType,
    'x-device-name': deviceInfo.deviceName,
    'x-device-id': deviceInfo.deviceId
  };
}; 