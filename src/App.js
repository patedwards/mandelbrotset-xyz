import { useState } from "react";
import DeckGL from "@deck.gl/react";
import { load } from "@loaders.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import Drawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Selector from "./Selector";
import { BitmapLayer } from 'deck.gl';


const COLOR_MAPS = [
  "magma",
  "inferno",
  "plasma",
  "viridis",
  "cividis",
  "twilight",
  "twilight_shifted",
  "turbo",
  "Blues",
  "BrBG",
  "BuGn",
  "BuPu",
  "CMRmap",
  "GnBu",
  "Greens",
  "Greys",
  "OrRd",
  "Oranges",
  "PRGn",
  "PiYG",
  "PuBu",
  "PuBuGn",
  "PuOr",
  "PuRd",
  "Purples",
  "RdBu",
  "RdGy",
  "RdPu",
  "RdYlBu",
  "RdYlGn",
  "Reds",
  "Spectral",
  "Wistia",
  "YlGn",
  "YlGnBu",
  "YlOrBr",
  "YlOrRd",
  "afmhot",
  "autumn",
  "binary",
  "bone",
  "brg",
  "bwr",
  "cool",
  "coolwarm",
  "copper",
  "cubehelix",
  "flag",
  "gist_earth",
  "gist_gray",
  "gist_heat",
  "gist_ncar",
  "gist_rainbow",
  "gist_stern",
  "gist_yarg",
  "gnuplot",
  "gnuplot2",
  "gray",
  "hot",
  "hsv",
  "jet",
  "nipy_spectral",
  "ocean",
  "pink",
  "prism",
  "rainbow",
  "seismic",
  "spring",
  "summer",
  "terrain",
  "winter",
  "Accent",
  "Dark2",
  "Paired",
  "Pastel1",
  "Pastel2",
  "Set1",
  "Set2",
  "Set3",
  "tab10",
  "tab20",
  "tab20b",
  "tab20c",
  "magma_r",
  "inferno_r",
  "plasma_r",
  "viridis_r",
  "cividis_r",
  "twilight_r",
  "twilight_shifted_r",
  "turbo_r",
  "Blues_r",
  "BrBG_r",
  "BuGn_r",
  "BuPu_r",
  "CMRmap_r",
  "GnBu_r",
  "Greens_r",
  "Greys_r",
  "OrRd_r",
  "Oranges_r",
  "PRGn_r",
  "PiYG_r",
  "PuBu_r",
  "PuBuGn_r",
  "PuOr_r",
  "PuRd_r",
  "Purples_r",
  "RdBu_r",
  "RdGy_r",
  "RdPu_r",
  "RdYlBu_r",
  "RdYlGn_r",
  "Reds_r",
  "Spectral_r",
  "Wistia_r",
  "YlGn_r",
  "YlGnBu_r",
  "YlOrBr_r",
  "YlOrRd_r",
  "afmhot_r",
  "autumn_r",
  "binary_r",
  "bone_r",
  "brg_r",
  "bwr_r",
  "cool_r",
  "coolwarm_r",
  "copper_r",
  "cubehelix_r",
  "flag_r",
  "gist_earth_r",
  "gist_gray_r",
  "gist_heat_r",
  "gist_ncar_r",
  "gist_rainbow_r",
  "gist_stern_r",
  "gist_yarg_r",
  "gnuplot_r",
  "gnuplot2_r",
  "gray_r",
  "hot_r",
  "hsv_r",
  "jet_r",
  "nipy_spectral_r",
  "ocean_r",
  "pink_r",
  "prism_r",
  "rainbow_r",
  "seismic_r",
  "spring_r",
  "summer_r",
  "terrain_r",
  "winter_r",
  "Accent_r",
  "Dark2_r",
  "Paired_r",
  "Pastel1_r",
  "Pastel2_r",
  "Set1_r",
  "Set2_r",
  "Set3_r",
  "tab10_r",
  "tab20_r",
  "tab20b_r",
  "tab20c_r"
];

function App() {
  const [viewState, setViewState] = useState({
    longitude: -2.8125,
    latitude: 1.9167318494636127,
    zoom: 6
  });

  const [scale, setScale] = useState(-6);
  const [iterations, setIterations] = useState(500);
  const [cmap, setCmap] = useState("turbo");
  const [redFactor, setRedFactor] = useState(1)

  const saveState = () => {
    fetch(
      `http://127.0.0.1:8890/save?latitude=${viewState.latitude}&longitude=${viewState.longitude}&width=${viewState.width}&height=${viewState.height}&scale=${scale}&maxIterations=${iterations}&cmap=${cmap}&zoom=${viewState.zoom}`
    ).then(r => console.log(r));
  };

  const layer = new TileLayer({
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    data: `http://127.0.0.1:8899/{z}/{x}/{y}?scale=${scale}&maxIterations=${iterations}&cmap=${cmap}`,
    minZoom: 0,
    maxZoom: Infinity,
    tileSize: 256,
    getTileData: async tile => {
      return load(tile.url)
    },

    renderSubLayers: props => {
      const {
        bbox: { west, south, east, north },
      } = props.tile;
      
      return new BitmapLayer(props, {
        // can maybe load the image from an array see https://loaders.gl/docs/specifications/category-image
        // this means API would return an array not an image
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
        colorMap: [redFactor, 1, 1]
      });
    }
  });

  return (
    <div>
      <Drawer anchor={"right"} open={true} variant="permanent">
        <TextField
          value={scale}
          onChange={event => setScale(event.target.value)}
        />
        <TextField
          value={iterations}
          onChange={event => setIterations(event.target.value)}
        />
        <TextField
          value={redFactor}
          onChange={event => setRedFactor(event.target.value)}
        />
        <Selector
          items={COLOR_MAPS.map(c => ({ label: c }))}
          handleSelection={item => setCmap(item.label)}
        />
      </Drawer>

      <DeckGL
        controller={true}
        initialViewState={{
          latitude: -30.33432259963514,
            longitude: -124.46095039521886,
            zoom: 1,
          maxZoom: Infinity
        }}
        onViewStateChange= {({viewState}) => {
          setViewState(viewState)
          }
        }
        layers={[layer]}
      />
      <Box
        style={{
          zIndex: 10000,
          position: "absolute",
          top: 16,
          left: 16,
          width: 256
        }}
      >
        <Button onClick={() => saveState()}>Save</Button>
      </Box>
    </div>
  );
}

export default App;
//7 1.40625 0.8398268729947986
