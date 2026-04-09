import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  InputBase, 
  IconButton,
  Paper
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import CommonModal from "./CommonModal";

const EXT_TO_MIME: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".png": ["image/png"],
};

function parseAcceptExtensions(accept: string): string[] {
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((token) => (token.startsWith(".") ? token : `.${token}`));
}

function formatAcceptLabel(accept: string): string {
  const exts = parseAcceptExtensions(accept);
  const raw = exts.map((e) => e.replace(/^\./, "").toUpperCase());
  const labels = raw.filter((v, i) => raw.indexOf(v) === i);
  if (labels.length === 0) return "allowed";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`;
}

type Props = {
  label: string;
  onChange: (file: File | null) => void;
  error?: boolean;
  helperText?: string;
  preview?: string | null;
  accept?: string;
  value?: File | null;
  id?: string;
  /** When set, max file size in bytes for all types (overrides default image/video/document limits). */
  maxFileSizeBytes?: number;
  /** When true, file extension (and MIME when present) must match `accept`. */
  enforceAccept?: boolean;
  /** Called when client-side validation fails (e.g. show a toast). */
  onValidationError?: (message: string) => void;
};

const FileUploadInput: React.FC<Props> = ({
  label,
  onChange,
  error,
  helperText,
  preview,
  accept = '*',
  value,
  id,
  maxFileSizeBytes,
  enforceAccept,
  onValidationError,
}) => {
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileError, setFileError] = useState<string>('');

  // File size limits
  const maxImageSize = 5 * 1024 * 1024; // 5MB
  const maxVideoSize = 25 * 1024 * 1024; // 25MB
  const maxDocumentSize = 10 * 1024 * 1024; // 10MB for documents

  // Sync with external value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedFile(value);
      setFileError(''); // Clear any previous errors
    }
  }, [value]);

  // Validate file size and type
  const validateFile = (file: File): { isValid: boolean; error: string } => {
    if (enforceAccept && accept && accept !== "*") {
      const allowedExts = parseAcceptExtensions(accept);
      const lastDot = file.name.lastIndexOf(".");
      const ext =
        lastDot >= 0 ? file.name.slice(lastDot).toLowerCase() : "";
      if (!ext || !allowedExts.includes(ext)) {
        return {
          isValid: false,
          error: `Invalid file type. Only ${formatAcceptLabel(accept)} files are allowed.`,
        };
      }
      const allowedMime = EXT_TO_MIME[ext];
      if (allowedMime && file.type && !allowedMime.includes(file.type)) {
        return {
          isValid: false,
          error: `Invalid file type. Only ${formatAcceptLabel(accept)} files are allowed.`,
        };
      }
    }

    let maxSize: number;
    if (maxFileSizeBytes != null) {
      maxSize = maxFileSizeBytes;
    } else {
      maxSize = maxDocumentSize;
      if (file.type.startsWith("image/")) {
        maxSize = maxImageSize;
      } else if (file.type.startsWith("video/")) {
        maxSize = maxVideoSize;
      }
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(
        maxSize % (1024 * 1024) === 0 ? 0 : 1
      );
      return {
        isValid: false,
        error: `File size must be ${maxSizeMB} MB or less.`,
      };
    }

    return { isValid: true, error: "" };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const validation = validateFile(file);
      if (validation.isValid) {
        setSelectedFile(file);
        setFileError('');
        onChange(file);
      } else {
        setFileError(validation.error);
        onValidationError?.(validation.error);
        setSelectedFile(null);
        onChange(null);
        // Clear the input value
        const inputId = id || 'upload-input';
        const input = document.getElementById(inputId) as HTMLInputElement;
        if (input) {
          input.value = '';
        }
      }
    } else {
      setSelectedFile(null);
      setFileError('');
      onChange(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileError('');
    onChange(null);
    // Clear the input value
    const inputId = id || 'upload-input';
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  const handleUploadClick = () => {
    const inputId = id || 'upload-input';
    document.getElementById(inputId)?.click();
  };

  const handleEyeClick = () => {
    if (hasFile) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getFileName = () => {
    if (selectedFile) {
      return selectedFile.name;
    }
    if (preview) {
      // Extract filename from URL if it's a preview URL
      const urlParts = preview.split('/');
      return urlParts[urlParts.length - 1] || 'Uploaded file';
    }
    return '';
  };

  const hasFile = selectedFile || preview;

  return (
    <Box mb={2}>
      {/* Label with Eye Icon */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb="5px"
      >
        <Typography
          fontSize={14}
          fontWeight={600}
          sx={{ opacity: 0.7 }}
        >
          {label}
        </Typography>
        {hasFile && (
          <IconButton
            // size="small"    
            onClick={handleEyeClick}
            sx={{
              color: theme.palette.primary.main,
              fontSize: 12,
              p: 0,
              '&:hover': {
                // backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.dark,
              },
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        id={id || 'upload-input'}
        type="file"
        hidden
        onChange={handleFileChange}
        accept={accept}
      />

      {/* Text field appearance */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
          borderRadius: 1,
          backgroundColor: theme.palette.background.paper,
          '&:hover': {
            borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
          },
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
        }}
      >
        <InputBase
          sx={{
            flex: 1,
            px: 2,
            py: 1.2,
            fontSize: 12,
            color: getFileName() ? theme.palette.text.primary : theme.palette.text.secondary,
          }}
          placeholder="Choose a file..."
          value={getFileName()}
          readOnly
        />
        <IconButton
          onClick={handleUploadClick}
          sx={{
            mr: 0.5,
            color: theme.palette.primary.main,
            '&:hover': {
              // backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.dark,
            },
          }}
        >
          <AttachFileIcon sx={{ fontSize: 18 }} />
        </IconButton>
        {selectedFile && (
          <IconButton
            onClick={handleClearFile}
            sx={{
              mr: 0.5,
              color: theme.palette.error.main,
              '&:hover': {
                color: theme.palette.error.dark,
              },
            }}
          >
            <ClearIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Helper text */}
      {helperText && (
        <Typography
          variant="caption"
          color={error ? "error" : "textSecondary"}
          mt={0.5}
          display="block"
        >
          {helperText}
        </Typography>
      )}
      
      {/* File validation error */}
      {fileError && (
        <Typography
          variant="caption"
          color="error"
          mt={0.5}
          display="block"
        >
          {fileError}
        </Typography>
      )}

      {/* Preview Modal */}
      <CommonModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="File Preview"
        size="lg"
      >
          <Paper
            sx={{
              // p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: 'none',
            }}
          >
            {/* <Typography variant="h6" component="h2" id="preview-modal-title">
              File Preview
            </Typography> */}
            
            {preview && (
              <Box
                component="img"
                src={preview}
                alt="File preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  minHeight: '300px',
                  maxHeight: '350px',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            )}
            
            {selectedFile && !preview && (
              <Box
                sx={{
                  p: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  textAlign: 'center',
                }}
              >
                <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}
          </Paper>
      </CommonModal>
    </Box>
  );
};

export default FileUploadInput;
