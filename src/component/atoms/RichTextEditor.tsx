import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  Link as LinkIcon,
  Undo,
  Redo,
  Clear,
} from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
  distributorId?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  height = '300px',
}) => {
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'image',
          style: 'max-width: 100%; height: auto; border-radius: 4px;',
        },
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key.toLowerCase()) {
            case 'b':
              event.preventDefault();
              applyBold();
              return true;
            case 'i':
              event.preventDefault();
              applyItalic();
              return true;
            case 'u':
              event.preventDefault();
              applyUnderline();
              return true;
            case 'z':
              if (event.shiftKey) {
                event.preventDefault();
                editor.chain().focus().redo().run();
                return true;
              }
              break;
          }
        }
        return false;
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <Box sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 2, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <Typography color="text.secondary">Loading editor...</Typography>
      </Box>
    );
  }

  const getCurrentHeading = () => {
    // Check if cursor is inside a heading
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i as 1 | 2 | 3 | 4 | 5 | 6 })) {
        return i;
      }
    }
    return 0; // Paragraph
  };


  // Enhanced formatting functions that work on selection only
  const applyBold = () => {
    if (editor.state.selection.empty) {
      // If no text selected, insert bold text
      editor.chain().focus().insertContent('<strong>Bold Text</strong>').run();
    } else {
      // Apply bold to selected text - toggle on/off
      const isBold = editor.isActive('bold');
      if (isBold) {
        editor.chain().focus().unsetBold().run();
      } else {
        editor.chain().focus().setBold().run();
      }
    }
  };

  const applyItalic = () => {
    if (editor.state.selection.empty) {
      // If no text selected, insert italic text
      editor.chain().focus().insertContent('<em>Italic Text</em>').run();
    } else {
      // Apply italic to selected text - toggle on/off
      const isItalic = editor.isActive('italic');
      if (isItalic) {
        editor.chain().focus().unsetItalic().run();
      } else {
        editor.chain().focus().setItalic().run();
      }
    }
  };

  const applyUnderline = () => {
    if (editor.state.selection.empty) {
      // If no text selected, insert underlined text
      editor.chain().focus().insertContent('<u>Underlined Text</u>').run();
    } else {
      // Apply underline to selected text - toggle on/off
      const isUnderline = editor.isActive('underline');
      if (isUnderline) {
        editor.chain().focus().unsetUnderline().run();
      } else {
        editor.chain().focus().setUnderline().run();
      }
    }
  };

  const applyStrike = () => {
    if (editor.state.selection.empty) {
      // If no text selected, insert strikethrough text
      editor.chain().focus().insertContent('<s>Strikethrough Text</s>').run();
    } else {
      // Apply strikethrough to selected text - toggle on/off
      const isStrike = editor.isActive('strike');
      if (isStrike) {
        editor.chain().focus().unsetStrike().run();
      } else {
        editor.chain().focus().setStrike().run();
      }
    }
  };

  const applyBulletList = () => {
    if (editor.state.selection.empty) {
      // If no text selected, create a new bullet list
      editor.chain().focus().insertContent('<ul><li>List Item</li></ul>').run();
    } else {
      // Convert selected text to bullet list
      editor.chain().focus().toggleBulletList().run();
    }
  };

  const applyOrderedList = () => {
    if (editor.state.selection.empty) {
      // If no text selected, create a new ordered list
      editor.chain().focus().insertContent('<ol><li>List Item</li></ul>').run();
    } else {
      // Convert selected text to ordered list
      editor.chain().focus().toggleOrderedList().run();
    }
  };

  const applyTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (editor.state.selection.empty) {
      // If no text selected, apply alignment to current block
      editor.chain().focus().setTextAlign(align).run();
    } else {
      // Apply alignment to selected text
      editor.chain().focus().setTextAlign(align).run();
    }
  };

  const setHeading = (level: number) => {
    const { from, to } = editor.state.selection;
    const hasSelection = !editor.state.selection.empty;
    
    if (level === 0) {
      // Convert to paragraph
      if (!hasSelection) {
        editor.chain().focus().insertContent('<p>New Paragraph</p>').run();
      } else {
        // Get selected text and wrap it in paragraph tags
        const selectedText = editor.state.doc.textBetween(from, to);
        editor.chain().focus().deleteRange({ from, to }).run();
        editor.chain().focus().insertContent(`<p>${selectedText}</p>`).run();
        // Select the inserted content
        const newFrom = from;
        const newTo = from + selectedText.length + 7; // +7 for <p></p> tags
        editor.chain().focus().setTextSelection({ from: newFrom, to: newTo }).run();
      }
    } else {
      // Convert to heading
      if (!hasSelection) {
        editor.chain().focus().insertContent(`<h${level}>Heading ${level}</h${level}>`).run();
      } else {
        // Get selected text and wrap it in heading tags
        const selectedText = editor.state.doc.textBetween(from, to);
        editor.chain().focus().deleteRange({ from, to }).run();
        editor.chain().focus().insertContent(`<h${level}>${selectedText}</h${level}>`).run();
        // Select the inserted content
        const newFrom = from;
        const newTo = from + selectedText.length + 7 + level.toString().length; // +7 for <h></h> tags + level number
        editor.chain().focus().setTextSelection({ from: newFrom, to: newTo }).run();
      }
    }
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      if (editor.isActive('link')) {
        // If link is active, update it
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      } else {
        // If no link is active, check if text is selected
        if (editor.state.selection.empty) {
          // Insert link with the URL as text
          editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`).run();
        } else {
          // Apply link to selected text
          editor.chain().focus().setLink({ href: linkUrl }).run();
        }
      }
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  };

  const clearContent = () => {
    // Only clear if user confirms or if it's a new document
    if (editor.getHTML().trim() === '' || window.confirm('Are you sure you want to clear all content?')) {
      editor.chain().focus().clearContent().run();
    }
  };

  return (
    <Box sx={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: 2, 
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: '#1976d2',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
      '&:focus-within': {
        borderColor: '#1976d2',
        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
      }
    }}>
      {/* Enhanced Toolbar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 1,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          flexWrap: 'wrap',
          minHeight: '48px',
        }}
      >
        {/* Heading Dropdown */}
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={getCurrentHeading()}
              onChange={(e) => setHeading(e.target.value as number)}
              displayEmpty
              sx={{ 
                height: '32px',
                fontSize: '12px',
                '& .MuiSelect-select': { py: 0.5 }
              }}
            >
              <MenuItem value={0}>Paragraph</MenuItem>
              <MenuItem value={1}>Heading 1</MenuItem>
              <MenuItem value={2}>Heading 2</MenuItem>
              <MenuItem value={3}>Heading 3</MenuItem>
              <MenuItem value={4}>Heading 4</MenuItem>
              <MenuItem value={5}>Heading 5</MenuItem>
              <MenuItem value={6}>Heading 6</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Text Formatting */}
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          <Tooltip title="Bold (Ctrl+B)" arrow>
            <IconButton
              size="small"
              onClick={applyBold}
              color={editor.isActive('bold') ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                backgroundColor: editor.isActive('bold') ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Italic (Ctrl+I)" arrow>
            <IconButton
              size="small"
              onClick={applyItalic}
              color={editor.isActive('italic') ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                backgroundColor: editor.isActive('italic') ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Underline (Ctrl+U)" arrow>
            <IconButton
              size="small"
              onClick={applyUnderline}
              color={editor.isActive('underline') ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                backgroundColor: editor.isActive('underline') ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Strikethrough" arrow>
            <IconButton
              size="small"
              onClick={applyStrike}
              color={editor.isActive('strike') ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                backgroundColor: editor.isActive('strike') ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatStrikethrough fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Lists */}
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          <Tooltip title="Bullet List" arrow>
            <IconButton
              size="small"
              onClick={applyBulletList}
              color={editor.isActive('bulletList') ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Numbered List" arrow>
            <IconButton
              size="small"
              onClick={applyOrderedList}
              color={editor.isActive('orderedList') ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Text Alignment */}
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          <Tooltip title="Align Left" arrow>
            <IconButton
              size="small"
              onClick={() => applyTextAlign('left')}
              color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatAlignLeft fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Align Center" arrow>
            <IconButton
              size="small"
              onClick={() => applyTextAlign('center')}
              color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatAlignCenter fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Align Right" arrow>
            <IconButton
              size="small"
              onClick={() => applyTextAlign('right')}
              color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatAlignRight fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Justify" arrow>
            <IconButton
              size="small"
              onClick={() => applyTextAlign('justify')}
              color={editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <FormatAlignJustify fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Links */}
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          <Tooltip title="Add Link" arrow>
            <IconButton
              size="small"
              onClick={() => setLinkDialogOpen(true)}
              color={editor.isActive('link') ? 'primary' : 'default'}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Undo/Redo/Clear */}
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          <Tooltip title="Undo (Ctrl+Z)" arrow>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <Undo fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Redo (Ctrl+Y)" arrow>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <Redo fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear All" arrow>
            <IconButton
              size="small"
              onClick={clearContent}
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <Clear fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Instructions */}
      {!readOnly && (
        <Box sx={{ 
          p: 1, 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #e0e0e0',
          fontSize: '12px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          💡 <strong>How to use:</strong> 
          <br />• <strong>For Headings:</strong> Select text → Choose heading level → Only selected text becomes heading
          <br />• <strong>For Formatting:</strong> Select text → Click formatting button → Formatting toggles ON/OFF
          <br />• <strong>No selection:</strong> Tools create new formatted content
          <br />• <strong>Keyboard shortcuts:</strong> Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline)
        </Box>
      )}

      {/* Enhanced Editor Content */}
      <Box sx={{ 
        height, 
        overflow: 'auto',
        backgroundColor: '#ffffff',
        '& .ProseMirror': {
          padding: '16px',
          minHeight: '100%',
          outline: 'none',
          fontSize: '14px',
          lineHeight: 1.6,
          color: '#333',
          cursor: 'text',
          '& p': {
            margin: '0 0 12px 0',
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            margin: '16px 0 8px 0',
            fontWeight: 600,
            lineHeight: 1.3,
          },
          '& h1': { fontSize: '24px' },
          '& h2': { fontSize: '20px' },
          '& h3': { fontSize: '18px' },
          '& h4': { fontSize: '16px' },
          '& h5': { fontSize: '14px' },
          '& h6': { fontSize: '12px' },
          '& ul, & ol': {
            paddingLeft: '24px',
            margin: '8px 0',
          },
          '& li': {
            margin: '4px 0',
          },
          '& blockquote': {
            borderLeft: '4px solid #e0e0e0',
            margin: '16px 0',
            paddingLeft: '16px',
            fontStyle: 'italic',
            color: '#666',
          },
          '& code': {
            backgroundColor: '#f5f5f5',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '13px',
            fontFamily: 'monospace',
          },
          '& pre': {
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            margin: '12px 0',
          },
          '& a': {
            color: '#1976d2',
            textDecoration: 'underline',
            '&:hover': {
              color: '#1565c0',
            },
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '4px',
            margin: '8px 0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
          '& .is-editor-empty:first-child::before': {
            content: `"${placeholder}"`,
            float: 'left',
            color: '#adb5bd',
            pointerEvents: 'none',
            height: 0,
          },
          // Better selection styling
          '& ::selection': {
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            color: 'inherit',
          },
          '& ::-moz-selection': {
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            color: 'inherit',
          },
          // Active formatting indicators
          '& strong, & b': {
            fontWeight: 600,
          },
          '& em, & i': {
            fontStyle: 'italic',
          },
          '& u': {
            textDecoration: 'underline',
          },
          '& s, & strike': {
            textDecoration: 'line-through',
          },
        },
      }}>
        <EditorContent editor={editor} />
      </Box>

      {/* Enhanced Link Dialog */}
      <Dialog 
        open={linkDialogOpen} 
        onClose={() => setLinkDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Add Link
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            variant="outlined"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addLink();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setLinkDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={addLink} 
            variant="contained"
            disabled={!linkUrl.trim()}
          >
            Add Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RichTextEditor; 