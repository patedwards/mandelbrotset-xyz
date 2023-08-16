import { useState, useEffect, useCallback } from "react";

export const useStore = () => {
  const [library, setLibrary] = useState([]);

  const syncLibrary = useCallback(() => {
    try {
      const updatedLibrary = JSON.parse(localStorage.getItem("library")) || [];
      setLibrary(updatedLibrary);
    } catch (error) {
      console.error("Failed to sync library from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const initialLibrary = JSON.parse(localStorage.getItem("library")) || [];
      setLibrary(initialLibrary);
    } catch (error) {
      console.error("Failed to read from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "library") {
        syncLibrary();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncLibrary]);

  const addLibraryItem = useCallback(
    (item) => {
      const updatedLibrary = [...library, item];
      try {
        localStorage.setItem("library", JSON.stringify(updatedLibrary));
        setLibrary(updatedLibrary);
      } catch (error) {
        console.error("Failed to add item to localStorage:", error);
      }
    },
    [library]
  );

  const removeLibraryItem = useCallback(
    (imageLocation) => {
      try {
        const updatedLibrary = library.filter(
          (item) => item.imageLocation !== imageLocation
        );
        localStorage.setItem("library", JSON.stringify(updatedLibrary));
        setLibrary(updatedLibrary);
      } catch (error) {
        console.error("Failed to remove item from localStorage:", error);
      }
    },
    [library]
  );

  const updateLibraryItem = useCallback(
    (imageLocation, newName) => {
      const updatedLibrary = [...library];
      const itemIndex = updatedLibrary.findIndex(
        (item) => item.imageLocation === imageLocation
      );
      if (itemIndex !== -1) {
        updatedLibrary[itemIndex].name = newName;
        try {
          localStorage.setItem("library", JSON.stringify(updatedLibrary));
          setLibrary(updatedLibrary);
        } catch (error) {
          console.error("Failed to update item in localStorage:", error);
        }
      }
    },
    [library]
  );

  return {
    library,
    addLibraryItem,
    removeLibraryItem,
    updateLibraryItem,
    syncLibrary,
  };
};
