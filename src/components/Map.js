import DeckGL from "@deck.gl/react";
import { createTileLayer } from "../utilities/deck";

const Map = ({ scale, maxIterations, colors, gradientFunction, setViewState }) => {
  const layer = createTileLayer({
    scale,
    maxIterations,
    colors,
    gradientFunction
  });

  return (
    <DeckGL
      controller={true}
      initialViewState={{
        latitude: 23.793501867101057,
        longitude: -58.11059317562626,
        zoom: 0.592703456010508,
        maxZoom: Infinity
      }}
      onViewStateChange={({viewState}) => setViewState(viewState)}
      layers={[layer]}
    />
  );
};

export default Map;
