import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import H from "@here/maps-api-for-javascript";
import onResize from "simple-element-resize-detector";
import carIcon from "../assets/car"

const Map = () => {
  const ref = useRef();
  const [map, setMap] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [lineString, setLineString] = useState(null);
  const [marker, setMarker] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!map) {
      const platform = new H.service.Platform({
        apikey: "8wHfV6SOa0zbUYV_1kSNT_8wfGutMhNKEeNpLVnlZyw",
      });
      const layers = platform.createDefaultLayers();
      const map = new H.Map(ref.current, layers.vector.normal.map, {
        pixelRatio: window.devicePixelRatio,
        center: { lat: 21.032310742, lng: 105.828814871 },
        zoom: 15,
      });
      onResize(ref.current, () => {
        map.getViewPort().resize();
      });
      new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
      setMap(map);
      setPlatform(platform);
    }
  }, [map]);
  const routingParameters = useMemo(() => {
    return {
      routingMode: "fast",
      transportMode: "car",
      origin: "21.037439,105.83454218",
      destination: "21.02666435,105.8022269",
      return: "polyline",
    };
  }, []);

  let onResult = useCallback(
    (result) => {
      // ensure that at least one route was found
      if (result.routes.length) {
        result.routes[0].sections.forEach((section) => {
          // Create a linestring to use as a point source for the route line
          let lineString = H.geo.LineString.fromFlexiblePolyline(
            section.polyline
          );
          setLineString(lineString);
          // Create a polyline to display the route:
          let routeLine = new H.map.Polyline(lineString, {
            style: { strokeColor: "deepSkyBlue", lineWidth: 10 },
          });

          let startMarker = new H.map.Marker(section.departure.place.location);

          let endMarker = new H.map.Marker(section.arrival.place.location);

          map.addObjects([routeLine, startMarker, endMarker]);
          map
            .getViewModel()
            .setLookAtData({ bounds: routeLine.getBoundingBox() });
        });
      }
    },
    [map]
  );
  let svg = carIcon;
  let markIcon = useMemo(() => {
    return new H.map.DomIcon(svg);
  }, [svg]);

  const createMarker = useCallback(() => {
    const marker =  new H.map.DomMarker(
      { lat: 21.03909147120901, lng: 105.83570610761625 },
      {
        icon: markIcon,
      }
    );
    setMarker(marker);
    map.addObject(marker);
  }, [map, markIcon]);

  useEffect(() => {
    if (platform) {
      let router = platform.getRoutingService(null, 8);
      router.calculateRoute(routingParameters, onResult, function (error) {
        console.log(error);
      });
      createMarker();
    }
  }, [createMarker, onResult, platform, routingParameters]);

  useEffect(() => {
    const setTime = setInterval(function updatePosition() {
      if (lineString && step < lineString.getPointCount()) {
        marker.setGeometry(lineString.extractPoint(step))
        setStep(step + 1);
      }
    }, 200);

    return () => {
        clearInterval(setTime);
    };
  }, [lineString, map, markIcon, marker, step]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100vh" }}
      ref={ref}
    />
  );
};
export default Map;
