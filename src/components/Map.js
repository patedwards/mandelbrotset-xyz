import DeckGL from "@deck.gl/react";
import { createTileLayer } from "../utilities/deck";

const Map = ({ scale, maxIterations, colors, gradientFunction, initialViewState, setViewState }) => {
  const layer = createTileLayer({
    scale,
    maxIterations,
    colors,
    gradientFunction
  });

  return (
    <DeckGL
      controller={true}
      initialViewState={initialViewState}
      onViewStateChange={({viewState}) => setViewState(viewState)}
      layers={[layer]}
    />
  );
};

export default Map;
