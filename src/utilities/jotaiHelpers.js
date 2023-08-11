import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { useSearchParams } from "react-router-dom";

export const subscribeAtomToUrl = (atom, key, f = (x) => x) => {
  return () => {
    const [searchParams] = useSearchParams();
    const [value, setValue] = useAtom(atom);
    const previousValue = useRef(null);

    useEffect(() => {
      const valueFromUrl = searchParams.get(key);
      if (valueFromUrl && valueFromUrl !== previousValue.current) {
        setValue(f(valueFromUrl));
        previousValue.current = valueFromUrl;
      }
    }, [searchParams, setValue]);

    return [value, setValue];
  };
};
