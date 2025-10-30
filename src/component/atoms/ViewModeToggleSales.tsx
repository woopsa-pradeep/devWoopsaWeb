import { Box, IconButton, Tooltip, Divider } from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import GridViewIcon from '@mui/icons-material/GridView';
import KeyboardIcon from '@mui/icons-material/Keyboard';
// import { useSelector } from 'react-redux';
// import { RootState } from '../../redux/store';

const ViewModeToggleSales = ({ viewMode, setViewMode }: { viewMode: 'grid' | 'table' | 'keyboard'; setViewMode: (mode: 'grid' | 'table' | 'keyboard') => void }) => {
  // const currentTheme = useSelector((s: RootState) => s.theme.currentTheme);
  return (
    <Box
      display="flex"
      alignItems="center"
      border="1px solid"
      borderColor="divider"
      borderRadius="8px"
      overflow="hidden"
    >
      <Tooltip title="Table View">
        <IconButton
          onClick={() => setViewMode('table')}
          sx={{
            backgroundColor: viewMode === 'table' ? 'action.selected' : 'transparent',
            borderRadius: 0,
          }}
        >
          <TableViewIcon sx={{color: viewMode === 'table' ? "primary.main" : 'inherit'}} />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Grid View">
        <IconButton
          onClick={() => setViewMode('grid')}
          sx={{
            backgroundColor: viewMode === 'grid' ? 'action.selected' : 'transparent',
            borderRadius: 0,
          }}
        >
          <GridViewIcon sx={{color: viewMode === 'grid' ? "primary.main" : 'inherit'}} />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Keyboard Mode (Sales)">
        <IconButton
          onClick={() => setViewMode('keyboard')}
          sx={{
            backgroundColor: viewMode === 'keyboard' ? 'action.selected' : 'transparent',
            borderRadius: 0,
          }}
        >
          <KeyboardIcon sx={{color: viewMode === 'keyboard' ? "primary.main" : 'inherit'}} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ViewModeToggleSales;
