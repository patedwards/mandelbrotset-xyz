import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import FolderIcon from '@mui/icons-material/Folder';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import SaveIcon from '@mui/icons-material/Save';

export default function LabelBottomNavigation({takeScreenshot, handleLibraryClick}) {
  const [value, setValue] = React.useState('recents');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <BottomNavigation sx={{ width: 500, bottom: 0, position: "absolute", zIndex: 99999999 }} value={value} onChange={handleChange}>
      <BottomNavigationAction
        label="Bookmarks"
        value="bookmarks"
        icon={<BookmarksIcon onClick={() => handleLibraryClick()} />}
      />
      <BottomNavigationAction
        label="Save view"
        value="save"
        icon={<SaveIcon onClick={() => takeScreenshot()}/>}
      />
      <BottomNavigationAction
        label="Nearby"
        value="nearby"
        icon={<LocationOnIcon />}
      />
      <BottomNavigationAction label="Folder" value="folder" icon={<FolderIcon />} />
    </BottomNavigation>
  );
}
