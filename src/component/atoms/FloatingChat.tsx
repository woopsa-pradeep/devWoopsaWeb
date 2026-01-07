import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery,
  Box,
  Typography,
  Avatar,
  Chip,
  Alert,
  TextField,
  Tooltip,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  keyframes,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Wifi as OnlineIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import rabbitIcon from '../../assets/Rabbit.svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  jsonData?: any[] | { headers: string[]; data: any[][] }; // For storing parsed JSON array data or headers/data format
}

interface ChatResponse {
  answer?: string;
  reply?: string;
  response?: string;
  message?: string;
}

// Utility function to extract JSON from code blocks
const extractJSONFromCodeBlock = (text: string): { jsonData: any[] | { headers: string[]; data: any[][] } | null; textWithoutJSON: string } => {
  try {
    // Check for JSON code blocks: ```json ... ``` or ``` ... ```
    const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
    let match;
    let jsonData: any[] | { headers: string[]; data: any[][] } | null = null;
    let textWithoutJSON = text;

    while ((match = jsonCodeBlockRegex.exec(text)) !== null) {
      const jsonContent = match[1].trim();
      try {
        const parsed = JSON.parse(jsonContent);
        
        // Check if it's an object with headers and data (new format)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          if (parsed.headers && Array.isArray(parsed.headers) && parsed.data && Array.isArray(parsed.data)) {
            jsonData = { headers: parsed.headers, data: parsed.data };
            // Remove the code block from text
            textWithoutJSON = textWithoutJSON.replace(match[0], '').trim();
            break;
          }
        }
        
        // Check if it's an array (existing format)
        if (Array.isArray(parsed) && parsed.length > 0) {
          jsonData = parsed;
          // Remove the code block from text
          textWithoutJSON = textWithoutJSON.replace(match[0], '').trim();
          break;
        }
      } catch {
        // Not valid JSON, continue
      }
    }

    // Also check for inline JSON arrays or objects
    if (!jsonData) {
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Check if it's an object with headers and data
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            if (parsed.headers && Array.isArray(parsed.headers) && parsed.data && Array.isArray(parsed.data)) {
              jsonData = { headers: parsed.headers, data: parsed.data };
              textWithoutJSON = textWithoutJSON.replace(jsonMatch[0], '').trim();
            }
          }
          
          // Check if it's an array
          if (Array.isArray(parsed) && parsed.length > 0) {
            jsonData = parsed;
            textWithoutJSON = textWithoutJSON.replace(jsonMatch[0], '').trim();
          }
        } catch {
          // Not valid JSON
        }
      }
    }

    return { jsonData, textWithoutJSON };
  } catch {
    return { jsonData: null, textWithoutJSON: text };
  }
};

// Utility function to parse and format structured responses
const formatStructuredResponse = (text: string): string => {
  try {
    // Check if it's JSON-formatted text
    if (text.includes('{') && text.includes('}')) {
      // Look for JSON patterns and extract them
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        try {
          const parsed = JSON.parse(jsonStr);
          return formatJSONResponse(parsed);
        } catch (e) {
          console.log(e);
          // If it's not valid JSON, treat as structured text
          return formatStructuredText(text);
        }
      }
    }
    
    // If no JSON found, check for structured text patterns
    return formatStructuredText(text);
  } catch (error) {
    console.log(error);
    return text; // Fallback to original text
  }
};

const formatJSONResponse = (obj: any): string => {
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (obj.answer) {
    return formatStructuredText(obj.answer);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => formatJSONResponse(item)).join('\n');
  }
  
  if (typeof obj === 'object') {
    let result = '';
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        result += `**${key}**\n`;
        result += formatJSONResponse(value).split('').map(() => '  ').join('') + formatJSONResponse(value);
        result += '\n\n';
      } else {
        result += `• **${key}**: ${value}\n`;
      }
    }
    return result.trim();
  }
  
  return String(obj);
};

const formatStructuredText = (text: string): string => {
  // Handle bullet points and lists
  const formatted = text
    // Convert asterisk-based lists to bullet points
    .replace(/^\* (.+)$/gm, '• $1')
    // Convert dash-based lists to bullet points
    .replace(/^- (.+)$/gm, '• $1')
    // Format nested bullet points
    .replace(/^    \* (.+)$/gm, '  ◦ $1')
    .replace(/^    - (.+)$/gm, '  ◦ $1')
    // Format sub-bullets
    .replace(/^        \* (.+)$/gm, '    ◦ $1')
    .replace(/^        - (.+)$/gm, '    ◦ $1')
    // Clean up extra whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
  
  return formatted;
};

const FloatingChat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { role } = useSelector((state: RootState) => state.auth);
  
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Woopsa assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const { wareHouseDetail } = useSelector((state: RootState) => state.auth);
  
  const API_BASE_URL = process.env.REACT_APP_CHAT_API_URL || 'https://apichatbot.woopsa.app/api/v1';
  // Base server URL for static files (without /api/v1)
  const SERVER_BASE_URL = process.env.REACT_APP_CHAT_SERVER_URL || 'https://apichatbot.woopsa.app';
  
  // Parse wareHouseDetail helper function
  const parseWareHouseDetail = (detail: any): any[] | null => {
    if (!detail) return null;
    
    try {
      // If it's already an array, return it
      if (Array.isArray(detail)) {
        return detail;
      }
      
      // If it's a string, parse it
      if (typeof detail === 'string') {
        const parsed = JSON.parse(detail);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing wareHouseDetail:', error);
      return null;
    }
  };
  
  // Get user_id from PM_ID in wareHouseDetail
  const userId = useMemo((): string => {
    const warehouseDataArray = parseWareHouseDetail(wareHouseDetail);
    const warehouseData = warehouseDataArray?.[0] as any;
    if (warehouseData?.PM_ID) {
      return warehouseData.PM_ID.toString();
    }
    return 'distributor_user';
  }, [wareHouseDetail]);

  // Get session ID from D_Name and TM_id (or PM_ID as fallback) in wareHouseDetail
  const sessionId = useMemo((): string => {
    const warehouseDataArray = parseWareHouseDetail(wareHouseDetail);
    const warehouseData = warehouseDataArray?.[0] as any;
    console.log('Parsed warehouse data:', warehouseData); // Debug log
    if (warehouseData?.D_Name) {
      // Replace spaces in D_Name with underscores to make it session-safe
      const safeDName = warehouseData.D_Name.toString().replace(/\s+/g, '_');
      // Use TM_id if available, otherwise use PM_ID as fallback
      const id = warehouseData.TM_id || warehouseData.PM_ID;
      if (id) {
        const sessionIdValue = `${safeDName}_${id}`;
        console.log('Generated session ID:', sessionIdValue); // Debug log
        return sessionIdValue;
      }
      // If no ID available, just use sanitized D_Name
      return safeDName;
    }
    console.log('No D_Name found, using default_session'); // Debug log
    return 'default_session';
  }, [wareHouseDetail]);

  // Only show for distributors
  if (role !== 'distributor') {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Load chat history function
  const loadChatHistory = useCallback(async () => {
    if (!sessionId || historyLoaded) return;
    console.log(sessionId,"sessionId");

    try {
      // URL-encode the sessionId to handle special characters like #, spaces, etc.
      const encodedSessionId = encodeURIComponent(sessionId);
      const response = await fetch(
        `${API_BASE_URL}/history/${encodedSessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      // Handle new response format with history array
      const historyArray = data?.history || (Array.isArray(data) ? data : []);
      
      if (historyArray && Array.isArray(historyArray) && historyArray.length > 0) {
        const historyMessages: Message[] = historyArray
          .map((item: any, index: number) => {
            // Handle new format: role-based messages
            if (item.role && item.content) {
              const isUser = item.role === 'user';
              
              if (isUser) {
                return {
                  id: `history_user_${index}_${Date.now()}`,
                  text: item.content,
                  isUser: true,
                  timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
                };
              } else {
                // Handle assistant response
                const { jsonData, textWithoutJSON } = extractJSONFromCodeBlock(item.content);
                return {
                  id: `history_bot_${index}_${Date.now()}`,
                  text: formatStructuredResponse(textWithoutJSON),
                  isUser: false,
                  timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
                  jsonData: jsonData ?? undefined
                };
              }
            }
            
            // Fallback to old format for backward compatibility
            const messages: Message[] = [];
            
            // Handle user message
            if (item.user_message || item.userMessage || item.message) {
              messages.push({
                id: `history_user_${index}_${Date.now()}`,
                text: item.user_message || item.userMessage || item.message,
                isUser: true,
                timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
              });
            }
            
            // Handle bot response
            if (item.bot_response || item.botResponse || item.response || item.answer) {
              const botText = item.bot_response || item.botResponse || item.response || item.answer;
              const { jsonData, textWithoutJSON } = extractJSONFromCodeBlock(botText);
              messages.push({
                id: `history_bot_${index}_${Date.now()}`,
                text: formatStructuredResponse(textWithoutJSON),
                isUser: false,
                timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
                jsonData: jsonData ?? undefined
              });
            }

            return messages;
          })
          .flat()
          .filter((msg: Message) => msg && msg.text && msg.text.trim() !== '');

        if (historyMessages.length > 0) {
          // Replace messages with history, keeping welcome message at the start
          setMessages([
            {
              id: '1',
              text: 'Hello! I\'m your Woopsa assistant. How can I help you today?',
              isUser: false,
              timestamp: new Date()
            },
            ...historyMessages
          ]);
        }
        setHistoryLoaded(true);
      } else {
        setHistoryLoaded(true);
      }
    } catch (err: any) {
      console.error('Error loading chat history:', err);
      setHistoryLoaded(true);
      // Don't show error to user, just start with welcome message
    }
  }, [sessionId, historyLoaded]);

  // Load chat history when dialog opens
  useEffect(() => {
    if (open && sessionId && !historyLoaded) {
      loadChatHistory();
    }
  }, [open, sessionId, historyLoaded, loadChatHistory]);

  // Reset history loaded flag when dialog closes
  useEffect(() => {
    if (!open) {
      setHistoryLoaded(false);
    }
  }, [open]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      // Use a longer timeout to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 400); // Wait for animation and rendering to complete
      
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Auto-focus input after messages update and loading stops
  useEffect(() => {
    if (open && !isLoading && messages.length > 0) {
      // Focus after a short delay to ensure message is rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [open, isLoading, messages.length]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);
    
    // Auto-focus on input after sending message (keep focus while loading)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
            user_message: messageText
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json() as ChatResponse;
      console.log(responseData, 'responsechat');
      // Handle different possible response formats
      const rawText = responseData.answer || 
                     responseData.reply || 
                     responseData.response || 
                     responseData.message || 
                     (typeof responseData === 'string' ? responseData : 'I received your message but couldn\'t process it properly.');
      
      // Extract JSON data if present
      const { jsonData, textWithoutJSON } = extractJSONFromCodeBlock(rawText);
      const formattedText = formatStructuredResponse(textWithoutJSON);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: formattedText,
        isUser: false,
        timestamp: new Date(),
        jsonData: jsonData ?? undefined
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Auto-focus will be handled by useEffect when isLoading becomes false
    } catch (err: any) {
      console.error('Chat API Error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(err.response?.data?.message || err.message || 'Failed to send message');
      
      // Auto-focus will be handled by useEffect when isLoading becomes false
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const bounceAnimation = keyframes`
    0%, 60%, 100% {
      transform: translateY(0);
      background-color: ${theme.palette.text.secondary};
    }
    30% {
      transform: translateY(-8px);
      background-color: ${theme.palette.primary.main};
    }
  `;

  const bounceAnimationWhite = keyframes`
    0%, 60%, 100% {
      transform: translateY(0);
      background-color: rgba(255, 255, 255, 0.6);
    }
    30% {
      transform: translateY(-8px);
      background-color: white;
    }
  `;

  const TypingIndicator = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5 }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: theme.palette.text.secondary,
            animation: `${bounceAnimation} 1.4s infinite`,
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </Box>
  );

  const TypingIndicatorSmall = ({ color = 'default' }: { color?: 'default' | 'white' }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: color === 'white' ? 'rgba(255, 255, 255, 0.6)' : theme.palette.text.secondary,
            animation: color === 'white' 
              ? `${bounceAnimationWhite} 1.4s infinite` 
              : `${bounceAnimation} 1.4s infinite`,
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </Box>
  );

  // Component to render JSON data as a table
  const JSONTable = ({ data, isUser }: { data: any[] | { headers: string[]; data: any[][] }; isUser: boolean }) => {
    if (!data) return null;

    // Check if data is in new format (object with headers and data)
    const isNewFormat = typeof data === 'object' && !Array.isArray(data) && 'headers' in data && 'data' in data;
    
    let headers: string[] = [];
    let rows: any[][] = [];

    if (isNewFormat) {
      // New format: { headers: [...], data: [[...], [...]] }
      const formattedData = data as { headers: string[]; data: any[][] };
      headers = formattedData.headers || [];
      rows = formattedData.data || [];
    } else {
      // Old format: array of objects
      const dataArray = data as any[];
      if (dataArray.length === 0) return null;

      // Get all unique keys from all objects
      const allKeys = new Set<string>();
      dataArray.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      headers = Array.from(allKeys);
      
      // Convert array of objects to array of arrays
      rows = dataArray.map(item => {
        return headers.map(key => {
          return item[key] !== null && item[key] !== undefined ? item[key] : null;
        });
      });
    }

    if (headers.length === 0 || rows.length === 0) return null;

    return (
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: '300px',
          overflowY: 'auto',
          mt: 1,
          backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : theme.palette.background.paper,
          '& .MuiTable-root': {
            minWidth: '100%',
          },
          '& .MuiTableCell-root': {
            fontSize: '12px',
            padding: '8px 12px',
            borderColor: isUser ? 'rgba(255,255,255,0.2)' : theme.palette.divider,
            color: isUser ? 'white' : theme.palette.text.primary,
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            fontWeight: 'bold',
            backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : theme.palette.background.default,
            position: 'sticky',
            top: 0,
            zIndex: 1,
          },
          '& .MuiTableBody-root .MuiTableRow-root:hover': {
            backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : theme.palette.action.hover,
          },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell key={index}>
                  {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {cell !== null && cell !== undefined
                      ? typeof cell === 'object'
                        ? JSON.stringify(cell)
                        : String(cell)
                      : '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Component to render formatted text with basic styling
  const FormattedText = ({ text, isUser }: { text: string; isUser: boolean }) => {
    // Function to parse markdown links and render them
    const parseMarkdownLinks = (line: string) => {
      // Match markdown links: [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts: (string | React.ReactElement)[] = [];
      let lastIndex = 0;
      let match;
      let linkIndex = 0;

      while ((match = linkRegex.exec(line)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }

        const linkText = match[1];
        const linkUrl = match[2];
        const isDownloadLink = /\.(csv|pdf|txt|xlsx|xls|zip|doc|docx)$/i.test(linkUrl);
        
        // Simple logic: For download links with /static/ or /exports/, extract path and use env URL
        let fullUrl = linkUrl;
        if (isDownloadLink && (linkUrl.includes('/static/') || linkUrl.includes('/exports/'))) {
          // Find the index of /static/ or /exports/ in the URL
          const staticIndex = linkUrl.indexOf('/static/');
          const exportsIndex = linkUrl.indexOf('/exports/');
          const pathIndex = staticIndex !== -1 ? staticIndex : exportsIndex;
          
          if (pathIndex !== -1) {
            // Extract everything from /static/ or /exports/ onwards
            const path = linkUrl.substring(pathIndex);
            // Construct URL: SERVER_BASE_URL + /api/v1 + path
            fullUrl = `${SERVER_BASE_URL}/api/v1${path}`;
          } else {
            // Fallback: if /static/ or /exports/ not found, use as is
            fullUrl = linkUrl;
          }
        } else {
          // For non-download links, use existing logic
          const isRelativeUrl = linkUrl.startsWith('/') && !linkUrl.startsWith('//');
          const isStaticFile = linkUrl.startsWith('/static/') || linkUrl.startsWith('/exports/');
          fullUrl = isRelativeUrl 
            ? (isStaticFile ? `${SERVER_BASE_URL}${linkUrl}` : `${API_BASE_URL}${linkUrl}`)
            : linkUrl;
        }

        parts.push(
          <Link
            key={`link-${linkIndex++}`}
            href={fullUrl}
            target={isDownloadLink ? undefined : '_blank'}
            rel="noopener noreferrer"
            download={isDownloadLink ? linkUrl.split('/').pop() || 'download' : undefined}
            onClick={async (e) => {
              if (isDownloadLink) {
                // For download links, prevent default and trigger download via fetch
                e.preventDefault();
                e.stopPropagation();
                
                // Get the filename from the URL
                const filename = linkUrl.split('/').pop() || fullUrl.split('/').pop() || 'download';
                
                try {
                  // Fetch the file as a blob
                  const response = await fetch(fullUrl);
                  if (!response.ok) {
                    throw new Error(`Failed to download: ${response.statusText}`);
                  }
                  
                  const blob = await response.blob();
                  
                  // Create a blob URL and trigger download
                  const blobUrl = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = filename;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  
                  // Clean up
                  setTimeout(() => {
                    if (document.body.contains(link)) {
                      document.body.removeChild(link);
                    }
                    window.URL.revokeObjectURL(blobUrl);
                  }, 100);
                } catch (error) {
                  console.error('Download error:', error);
                  // Fallback: open in new tab if download fails
                  window.open(fullUrl, '_blank');
                }
              }
            }}
            sx={{
              color: isUser ? 'rgba(255,255,255,0.9)' : theme.palette.primary.main,
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': {
                color: isUser ? 'white' : theme.palette.primary.dark,
                textDecoration: 'underline',
              },
            }}
          >
            {linkText}
            {isDownloadLink && (
              <DownloadIcon sx={{ fontSize: '14px', ml: 0.5 }} />
            )}
          </Link>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text after the last link
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      // If no links were found, return the original line
      if (parts.length === 0) {
        return line;
      }

      return parts;
    };

    // Helper to render content that may contain links and bold text
    const renderFormattedContent = (content: string | (string | React.ReactElement)[]) => {
      const contentStr = typeof content === 'string' ? content : content.join('');
      
      // Check for bold text **text**
      if (contentStr.includes('**')) {
        const parts = contentStr.split(/(\*\*[^*]+\*\*)/);
        return (
          <>
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <span key={partIndex} style={{ fontWeight: 'bold', color: isUser ? 'white' : theme.palette.primary.main }}>
                    {part.slice(2, -2)}
                  </span>
                );
              }
              // Parse links in each part
              const parsed = parseMarkdownLinks(part);
              return Array.isArray(parsed) ? <React.Fragment key={partIndex}>{parsed}</React.Fragment> : parsed;
            })}
          </>
        );
      }
      
      // If content is already parsed (array), return it
      if (Array.isArray(content)) {
        return <>{content}</>;
      }
      
      // Otherwise parse links
      const parsed = parseMarkdownLinks(content);
      return Array.isArray(parsed) ? <>{parsed}</> : parsed;
    };

    const formatText = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <br key={index} />;
        
        // Check for bullet points
        if (trimmedLine.startsWith('•')) {
          return (
            <div key={index} style={{ marginLeft: '16px', marginBottom: '2px' }}>
              {renderFormattedContent(trimmedLine)}
            </div>
          );
        }
        
        // Check for sub-bullets
        if (trimmedLine.startsWith('◦') || trimmedLine.startsWith('*')) {
          return (
            <div key={index} style={{ marginLeft: '32px', marginBottom: '2px', fontSize: '12px' }}>
              {renderFormattedContent(trimmedLine)}
            </div>
          );
        }
        
        // Regular text (may contain links and bold text)
        return (
          <div key={index} style={{ marginBottom: index < lines.length - 1 ? '4px' : '0' }}>
            {renderFormattedContent(trimmedLine)}
          </div>
        );
      });
    };

    return <>{formatText(text)}</>;
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 56,
          height: 56,
          color: 'white',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Chat Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={isDesktop ? 'md' : isTablet ? 'sm' : false}
        fullWidth={!isMobile}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile 
              ? '100vh' 
              : isDesktop 
                ? '700px' 
                : isTablet 
                  ? '600px' 
                  : '500px',
            maxHeight: isMobile 
              ? '100vh' 
              : isDesktop 
                ? '700px' 
                : isTablet 
                  ? '600px' 
                  : '500px',
            borderRadius: isMobile ? 0 : 3,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            bottom: isMobile ? 0 : 100,
            right: isMobile ? 0 : 24,
            margin: 0,
            maxWidth: isMobile 
              ? '100vw' 
              : isDesktop 
                ? '600px' 
                : isTablet 
                  ? '500px' 
                  : '400px',
            width: isMobile 
              ? '100vw' 
              : isDesktop 
                ? '600px' 
                : isTablet 
                  ? '500px' 
                  : '400px',
            animation: open ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-in',
            '@keyframes slideUp': {
              '0%': {
                transform: 'translateY(100%)',
                opacity: 0,
              },
              '100%': {
                transform: 'translateY(0)',
                opacity: 1,
              },
            },
            '@keyframes slideDown': {
              '0%': {
                transform: 'translateY(0)',
                opacity: 1,
              },
              '100%': {
                transform: 'translateY(100%)',
                opacity: 0,
              },
            },
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
          },
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: isMobile ? 'flex-end' : 'flex-end',
            justifyContent: isMobile ? 'center' : 'flex-end',
          },
        }}
      >
        {/* Modal Header */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                width: 40,
                height: 40,
              }}
            >
              <BotIcon />
            </Avatar> */}
            <Box>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', pl: 1 }}>
                Woopsa Assistant
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={isLoading ? <TypingIndicatorSmall color="white" /> : <OnlineIcon />}
              label="Online"
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': {
                  color: 'white',
                },
              }}
            />
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Messages Container */}
        <DialogContent
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {messages.map((message, index) => (
            <Fade in timeout={300} key={message.id}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1,
                  pt: index === 0 ? 2 : 0,
                }}
              >
                 {!message.isUser && (
                   <Avatar
                     sx={{
                       bgcolor: theme.palette.primary.light,
                       width: 28,
                       height: 28,
                       mt: 0.5,
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                     }}
                   >
                     <Box
                       component="img"
                       src={rabbitIcon}
                       alt="Rabbit"
                       sx={{
                         width: '18px',
                         height: '18px',
                         filter: 'brightness(0) invert(1)',
                       }}
                     />
                   </Avatar>
                 )}
                
                 <Box
                   sx={{
                     maxWidth: isMobile ? '80%' : message.jsonData ? '90%' : '65%',
                     minWidth: '80px',
                     width: message.jsonData ? '100%' : 'auto',
                   }}
                 >
                   <Box
                     sx={{
                       p: 1,
                       borderRadius: 2,
                       backgroundColor: message.isUser 
                         ? theme.palette.primary.main 
                         : theme.palette.background.default,
                       color: message.isUser 
                         ? 'white' 
                         : theme.palette.text.primary,
                       position: 'relative',
                       boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                       '&::before': message.isUser ? {
                         content: '""',
                         position: 'absolute',
                         top: 8,
                         right: -6,
                         width: 0,
                         height: 0,
                         borderLeft: `6px solid ${theme.palette.primary.main}`,
                         borderTop: '6px solid transparent',
                         borderBottom: '6px solid transparent',
                       } : {
                         content: '""',
                         position: 'absolute',
                         top: 8,
                         left: -6,
                         width: 0,
                         height: 0,
                         borderRight: `6px solid ${theme.palette.background.default}`,
                         borderTop: '6px solid transparent',
                         borderBottom: '6px solid transparent',
                       },
                     }}
                   >
                     {message.text && message.text.trim() && (
                       <Typography 
                         component="div"
                         variant="body2" 
                         sx={{ 
                           lineHeight: 1.4, 
                           wordBreak: 'break-word',
                           fontSize: '13px',
                           fontWeight: 400,
                           mb: message.jsonData ? 1 : 0,
                         }}
                       >
                         <FormattedText text={message.text} isUser={message.isUser} />
                       </Typography>
                     )}
                     {message.jsonData && (
                       <JSONTable data={message.jsonData} isUser={message.isUser} />
                     )}
                   </Box>
                 </Box>

                 {message.isUser && (
                   <Avatar
                     sx={{
                       bgcolor: theme.palette.background.default,
                       width: 28,
                       height: 28,
                       mt: 0.5,
                     }}
                   >
                     <PersonIcon sx={{ fontSize: '16px', color: theme.palette.primary.main }} />
                   </Avatar>
                 )}
              </Box>
            </Fade>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <Fade in timeout={300}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                 <Avatar
                   sx={{
                     bgcolor: theme.palette.primary.light,
                     width: 28,
                     height: 28,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                   }}
                 >
                   <Box
                     component="img"
                     src={rabbitIcon}
                     alt="Rabbit"
                     sx={{
                       width: '18px',
                       height: '18px',
                       filter: 'brightness(0) invert(1)',
                     }}
                   />
                 </Avatar>
                 <Box>
                   <TypingIndicator />
                 </Box>
               </Box>
             </Fade>
           )}
           
           <div ref={messagesEndRef} />
         </DialogContent>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mx: 2, mb: 1 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Input Area */}
        <Box
          sx={{
            p: 1.5,
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'flex-end',
              backgroundColor: theme.palette.background.default,
              borderRadius: 3,
              p: 1,
              border: `1px solid ${theme.palette.divider}`,
              '&:focus-within': {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
                boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`,
              },
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              variant="standard"
              InputProps={{
                inputRef: inputRef as React.Ref<HTMLInputElement | HTMLTextAreaElement>,
                disableUnderline: true,
                sx: {
                  fontSize: '14px',
                  '& input': {
                    padding: '8px 12px',
                  },
                  '& textarea': {
                    padding: '8px 12px',
                    fontSize: '14px',
                    lineHeight: 1.4,
                  },
                },
              }}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'transparent',
                },
              }}
            />
            <Tooltip title="Send message">
              <IconButton
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    bgcolor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    transform: 'none',
                  },
                }}
              >
                {isLoading ? (
                  <TypingIndicatorSmall />
                ) : (
                  <SendIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default FloatingChat;
