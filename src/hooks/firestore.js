import { useState, useEffect } from "react";

import {
  getDocumentField,
  updateDocument,
  streamDocumentFieldToState,
  streamCollectionToState
} from "../firebaseUtils/firestore";

export const useFireStoreDocument = (fullPath, defaultValue, dependencies) => {
  const [state, setState] = useState(defaultValue);
  const [path, field] = fullPath.split(".");
  useEffect(() => {
    const load = async () => {
      setState(await getDocumentField(path, field));
    };
    load();
  }, dependencies);

  useEffect(() => {
    if (state == null) {
      return;
    }
    if (field) {
      updateDocument(path, { [field]: state });
    } else {
      updateDocument(path, state);
    }
  }, [state]);

  return [state, setState];
};

export const useFireStoreDocStream = (fullPath, defaultValue, dependencies) => {
  const [state, setState] = useState(defaultValue);
  const [newData, setNewData] = useState(null)
  console.log("Calling", fullPath)

  useEffect(() => {
    const [path, field] = fullPath.split(".");
    return streamDocumentFieldToState(path, setState, field);
  }, dependencies);

  useEffect(() => {
    const [path, field] = fullPath.split(".");
    if (newData == null || newData === undefined) {
      return;
    }
    if (field) {
      updateDocument(path, { [field]: newData });
    } else {
      updateDocument(path, newData);
    }
  }, [newData])
  console.log(fullPath, state)
  return [state, setNewData];
};

export const useFireStoreCollection = (
  path,
  defaultValue,
  docMap,
  dependencies
) => {
  const [state, setState] = useState(defaultValue);
  useEffect(() => {
    console.log("useFireStoreCollection", path);
    return streamCollectionToState(path, setState, docMap);
  }, dependencies);

  return state.filter(x => x !== null && x !== undefined);
};

export const useMultipleFireStoreCollections = (
  paths,
  defaultValue,
  docMap,
  dependencies
) => {
  const [state, setState] = useState(null);

  const stateHandler = (path, data) => {
    setState({ ...state, [path]: data });
  };

  useEffect(() => {
    const unsubscribes = paths.map(path =>
      streamCollectionToState(path, data => stateHandler(path, data), docMap)
    );
    return () => unsubscribes.forEach(u => u());
  }, dependencies);
  return state;
};
