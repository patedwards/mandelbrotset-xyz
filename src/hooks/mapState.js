import { useState } from "react";

export const useDeckViewState = initialViewState => {
    const [viewState, setViewState] = useState(initialViewState)

    return [viewState, setViewState]
}