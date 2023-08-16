import { v4 as uuidv4 } from "uuid";
import {
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
  memo,
} from "react";
import DeckGL from "@deck.gl/react";

import { useStore } from "../hooks/store";
import { useTileLayer, useInitialViewState } from "../hooks/state";

const Map = forwardRef(({}, ref) => {
  const [initialViewState] = useInitialViewState();
  const [deckViewState, setDeckViewState] = useState(null);
  const deckViewStateRef = useRef(null);

  console.log("Rendering Map", initialViewState);

  const { addLibraryItem } = useStore();
  const layer = useTileLayer();

  const deckRef = useRef();

  const [isDeckLoaded, setIsDeckLoaded] = useState(false);
  const [captureThumbnail, setCaptureThumbnail] = useState(false);
  const [captureHD, setCaptureHD] = useState(false);

  useEffect(() => {
    if (deckRef.current && deckRef.current.deck) {
      setIsDeckLoaded(true);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    captureThumbnail: async () => {
      if (!isDeckLoaded) {
        console.error("DeckGL is not loaded yet");
        return;
      }
      setCaptureThumbnail(true); // add this line
    },
    captureHD: async () => {
      if (!isDeckLoaded) {
        console.error("DeckGL is not loaded yet");
        return;
      }
      setCaptureHD(true); // add this line
    },
  }));

  const onAfterRender = () => {
    if (captureHD) {
      const base64Image =
        deckRef?.current?.deck?.canvas?.toDataURL("image/png");

      const a = document.createElement("a");
      a.href = base64Image;
      a.download = "screenshot.png";
      a.click();

      setCaptureHD(false); // add this line
    }
    if (captureThumbnail) {
      console.log("captureThumbnail");
      const deck = deckRef.current.deck;
      const canvas = deck.canvas;

      // Create an offscreen canvas for down sampling
      const offscreenCanvas = document.createElement("canvas");

      // Define the maximum dimension for the thumbnail
      const maxSize = 200;

      // Calculate the ratio of the original canvas
      const ratio = canvas.width / canvas.height;

      // Set the dimensions of the offscreen canvas based on the ratio
      if (ratio > 1) {
        offscreenCanvas.width = maxSize;
        offscreenCanvas.height = maxSize / ratio;
      } else {
        offscreenCanvas.height = maxSize;
        offscreenCanvas.width = maxSize * ratio;
      }

      const offscreenContext = offscreenCanvas.getContext("2d");

      // Draw the original canvas into the offscreen canvas, downscaling it in the process
      offscreenContext.drawImage(
        canvas,
        0,
        0,
        offscreenCanvas.width,
        offscreenCanvas.height
      );

      const base64Image = offscreenCanvas.toDataURL("image/png");

      const imageLocation = uuidv4(); // Create a unique identifier for the image

      // Save the image and viewState separately as strings
      localStorage.setItem(imageLocation, base64Image);

      console.log("layer", layer, layer.props.parameters);

      // Update the library
      const newItem = {
        imageLocation,
        viewState: deckViewStateRef.current,
        ...layer.props.parameters,
      };
      addLibraryItem(newItem);

      setCaptureThumbnail(false);
    }
  };

  return (
    <DeckGL
      ref={deckRef}
      onAfterRender={onAfterRender}
      controller={true}
      initialViewState={initialViewState}
      onViewStateChange={({ viewState }) => {
        deckViewStateRef.current = viewState;
      }}
      layers={[layer]}
      onWebGLInitialized={setIsDeckLoaded}
    />
  );
});

export default memo(Map);
