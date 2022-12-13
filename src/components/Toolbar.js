import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import LibraryIcon from '@mui/icons-material/PhotoLibrary';
import SaveIcon from '@mui/icons-material/BookmarkAdd';
import PaletteIcon from "@mui/icons-material/Palette";
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';

export default function SimpleBottomNavigation({setLibraryOpen, setStylebarOpen, stylebarOpen, handleScreenshot}) {
  const [value, setValue] = React.useState(0);

  return (
      <BottomNavigation
        sx={{position: "absolute", bottom: 0}}
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
      >
        <BottomNavigationAction label="Library" icon={<LibraryIcon />} onClick={() => setLibraryOpen(true)}/>
        <BottomNavigationAction label="Save" icon={<SaveIcon />} />
        <BottomNavigationAction label="Capture" icon={<ScreenshotMonitorIcon />} onClick={handleScreenshot}/>
        <BottomNavigationAction label="Style" icon={<PaletteIcon />} onClick={() => {setStylebarOpen(!stylebarOpen)}}/>
      </BottomNavigation>
  );
}