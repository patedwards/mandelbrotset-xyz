import { useLocalStorage } from "./localStorage";

// Use library List-Update
export const useLibraryLU = () => {
    const [state, setState] = useLocalStorage("views", [])

    const updateLibrary = (view) => {
        setState([...state, view])
    }

    const removeItem = viewToRemove => {
        window.localStorage.removeItem(viewToRemove.imgPath)
        setState(state.filter(view => viewToRemove.imgPath !== view.imgPath))
    }

    return [state, updateLibrary, removeItem]
}