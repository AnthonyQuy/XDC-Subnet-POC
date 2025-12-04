/**
 * Validation utility functions for XDC Network Manager
 */

import { ValidationResult, MemberDataValidation, MemberFormData } from '../types/contract';

/**
 * Validates if a string is valid hexadecimal
 */
export const isValidHex = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  // Remove 0x prefix if present
  const cleanStr = str.startsWith('0x') ? str.slice(2) : str;
  
  // Check if string contains only hex characters
  return /^[0-9a-fA-F]*$/.test(cleanStr);
};

/**
 * Validates Ethereum address format
 */
export const isValidAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validates certificate serial hex
 * This field stores the X.509 certificate serial number
 */
export const validateCertSerialHex = (certSerialHex: string): ValidationResult & { sanitized: string } => {
  if (!certSerialHex || typeof certSerialHex !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Certificate serial is required'
    };
  }

  // Trim whitespace
  let trimmed = certSerialHex.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Certificate serial cannot be empty'
    };
  }

  // Ensure it has 0x prefix for hex format
  if (!trimmed.startsWith('0x')) {
    trimmed = '0x' + trimmed;
  }

  // Validate hex format
  if (!isValidHex(trimmed)) {
    return {
      isValid: false,
      sanitized: trimmed,
      error: 'Certificate serial must be in valid hex format'
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    error: ''
  };
};

/**
 * Validates X.500 Distinguished Name format
 */
export const validateX500Name = (x500Name: string): ValidationResult => {
  if (!x500Name || typeof x500Name !== 'string') {
    return {
      isValid: false,
      error: 'X.500 name is required'
    };
  }

  const trimmed = x500Name.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'X.500 name cannot be empty'
    };
  }

  // Basic X.500 format validation (CN=..., O=..., etc.)
  // More lenient - just check for presence of = sign
  if (!trimmed.includes('=')) {
    return {
      isValid: false,
      error: 'X.500 name must be in format: CN=Name,O=Org,C=Country'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Validates port number
 */
export const validatePort = (port: number | string): ValidationResult => {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

  if (isNaN(portNum)) {
    return {
      isValid: false,
      error: 'Port must be a valid number'
    };
  }

  if (portNum < 1 || portNum > 65535) {
    return {
      isValid: false,
      error: 'Port must be between 1 and 65535'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Validates host address
 */
export const validateHost = (host: string): ValidationResult => {
  if (!host || typeof host !== 'string') {
    return {
      isValid: false,
      error: 'Host address is required'
    };
  }

  const trimmed = host.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Host address cannot be empty'
    };
  }

  // Basic format validation (allows domain names and IPs)
  // Very permissive - just check it's not empty and has reasonable chars
  if (!/^[a-zA-Z0-9.-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Host address contains invalid characters'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Validates platform version
 */
export const validatePlatformVersion = (version: number | string): ValidationResult => {
  const versionNum = typeof version === 'string' ? parseInt(version, 10) : version;

  if (isNaN(versionNum)) {
    return {
      isValid: false,
      error: 'Platform version must be a valid number'
    };
  }

  if (versionNum < 0 || versionNum > 65535) {
    return {
      isValid: false,
      error: 'Platform version must be between 0 and 65535'
    };
  }

  return {
    isValid: true,
    error: ''
  };
};

/**
 * Validates all member data before submission
 */
export const validateMemberData = (memberData: MemberFormData): MemberDataValidation => {
  const errors: Record<string, string> = {};

  // Validate address
  if (!isValidAddress(memberData.address)) {
    errors.address = 'Please enter a valid Ethereum address (0x followed by 40 hex characters)';
  }

  // Validate X.500 name
  const x500Validation = validateX500Name(memberData.x500Name);
  if (!x500Validation.isValid) {
    errors.x500Name = x500Validation.error || '';
  }

  // Validate certificate serial
  const certValidation = validateCertSerialHex(memberData.certSerialHex);
  if (!certValidation.isValid) {
    errors.certSerialHex = certValidation.error || '';
  }

  // Validate platform version
  const versionValidation = validatePlatformVersion(memberData.platformVersion);
  if (!versionValidation.isValid) {
    errors.platformVersion = versionValidation.error || '';
  }

  // Validate host
  const hostValidation = validateHost(memberData.host);
  if (!hostValidation.isValid) {
    errors.host = hostValidation.error || '';
  }

  // Validate port
  const portValidation = validatePort(memberData.port);
  if (!portValidation.isValid) {
    errors.port = portValidation.error || '';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedCertSerial: certValidation.isValid ? certValidation.sanitized : memberData.certSerialHex
  };
};
