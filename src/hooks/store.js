import { useState, useEffect, useCallback } from "react";

/*
 Todo: 
 - use indexedDB instead of localStorage, this will help with the 5MB limit
 - use firebase to store the library for authenticated users

*/

export const useStore = () => {
  // State for the library
  const [library, setLibrary] = useState([]);

  useEffect(() => {
    // Fetch the library from localStorage when the hook is used
    const initialLibrary = JSON.parse(localStorage.getItem("library")) || [];
    setLibrary(initialLibrary);
  }, []);

  // adding this function to sync the library with localStorage, this is useful when the library is updated from another tab
  const syncLibrary = () => {
    const updatedLibrary = JSON.parse(localStorage.getItem("library")) || [];
    setLibrary(updatedLibrary);
  };

  // Function to add a new item to the library
  const addLibraryItem = useCallback((item) => {
    console.log("Adding item to library");
    const updatedLibrary = [...library, item];
    localStorage.setItem("library", JSON.stringify(updatedLibrary));
    setLibrary(updatedLibrary);
  }, []);

  // Function to remove an item from the library
  const removeLibraryItem = (imageLocation) => {
    localStorage.removeItem(imageLocation);
    const updatedLibrary = library.filter(
      (item) => item.imageLocation !== imageLocation
    );
    localStorage.setItem("library", JSON.stringify(updatedLibrary));
    setLibrary(updatedLibrary);
  };

  // Function to update an item in the library
  const updateLibraryItem = (imageLocation, newName) => {
    const updatedLibrary = [...library];
    const itemIndex = updatedLibrary.findIndex(
      (item) => item.imageLocation === imageLocation
    );
    updatedLibrary[itemIndex].name = newName;
    localStorage.setItem("library", JSON.stringify(updatedLibrary));
    setLibrary(updatedLibrary);
  };

  return {
    library,
    addLibraryItem,
    removeLibraryItem,
    updateLibraryItem,
    syncLibrary,
  };
};
