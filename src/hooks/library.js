import { useLocalStorage } from "./localStorage";

// Use library List-Update
export const useLibraryLU = () => {
    const [state, setState] = useLocalStorage("views", [])

    const updateLibrary = (view) => {
        setState([...state, view])
    }

    return [state, updateLibrary]
}