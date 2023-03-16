import { useState, useEffect } from "react";
import {
  processFeatureFromDocSnapshot,
  updateDocument
} from "../firebaseUtils/firestore";
import {
  useFireStoreDocument,
  useFireStoreDocStream,
  useFireStoreCollection
} from "./firestore";

export const streamAppStateSessionId = () => {
  const [state] = useState("session-1");
  return state;
};

export const streamSelectedFeatureIds = () => {
  const appStateSessionId = streamAppStateSessionId();
  const [selectedFeatureIds] = useFireStoreDocStream(
    `appStates/${appStateSessionId}.selectedFeatureIds`,
    [],
    []
  );

  return selectedFeatureIds;
};

export const mapSources = () => {
  const mapId = appStateStream("mapId")();
  const sources = useFireStoreCollection(
    `maps/${mapId}/sources`,
    [],
    docSnapshot => {console.log("docSnapshot", docSnapshot); return docSnapshot.data()}, // TODO: put this in the utilities
    [mapId]
  )
  return sources
};

export const streamSelectedFeatureProperties = () => {
  const mapId = appStateStream("mapId")();
  const selectedFeatureIds = streamSelectedFeatureIds();
  const fid = selectedFeatureIds[0];
  const [
    selectedFeatureProperties
  ] = useFireStoreDocStream(`maps/${mapId}/features/${fid}.properties`, {}, [
    fid
  ]);

  return selectedFeatureProperties;
};

export const appStateStream = field => (
  defaultValue = null,
  dependencies = []
) => {
  const appStateSessionId = streamAppStateSessionId();
  const [
    state
  ] = useFireStoreDocStream(
    `appStates/${appStateSessionId}.${field}`,
    defaultValue,
    [appStateSessionId, ...dependencies]
  );

  return state;
};

export const appStateSync = field => (
  defaultValue = null,
  dependencies = []
) => {
  const appStateSessionId = streamAppStateSessionId();
  const [
    state,
    setState
  ] = useFireStoreDocument(
    `appStates/${appStateSessionId}.${field}`,
    defaultValue,
    [appStateSessionId, ...dependencies]
  );

  return [state, setState];
};

export const streamFeatures = () => {
  const mapId = appStateStream("mapId")();
  const features = useFireStoreCollection(
    `maps/${mapId}/features`,
    [],
    processFeatureFromDocSnapshot,
    [mapId]
  );

  return features;
};

export const updateFeatureProperty = ({ fieldName, value }) => {
  const selectedFeatureIds = streamSelectedFeatureIds();
  const fid = selectedFeatureIds[0];
  const mapId = appStateStream("mapId")();
  updateDocument(`maps/${mapId}/features/${fid}`, {
    [`properties.${fieldName}`]: value
  });
};

export const updateFeatureGeometry = () => {
  const mapId = appStateStream("mapId")();
  const [feature, setFeature] = useState(null);

  useEffect(() => {
    const update = () => {
      const fid = feature.properties.__fid;
      updateDocument(`maps/${mapId}/features/${fid}`, {
        geometry: JSON.stringify(feature.geometry)
      });
    };
    if (feature === null) {
      return;
    }
    update();
  }, [feature]);

  return setFeature;
};

export const updateSelectedFeatureProperty = () => {
  const mapId = appStateStream("mapId")();
  const selectedFeatureIds = streamSelectedFeatureIds();
  const fid = selectedFeatureIds[0];
  const [propertyObj, setPropertyObj] = useState(null);

  useEffect(() => {
    const update = () => {
      updateDocument(`maps/${mapId}/features/${fid}`, {
        [`properties.${propertyObj.fieldName}`]: propertyObj.value
      });
    };
    if (propertyObj === null) {
      return;
    }
    update();
  }, [propertyObj]);

  return setPropertyObj;
};
