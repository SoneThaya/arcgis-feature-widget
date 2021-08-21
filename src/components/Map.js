import React, { useEffect, useRef } from "react";
import { loadModules } from "esri-loader";

const Map = () => {
  const MapEl = useRef(null);

  useEffect(() => {
    loadModules([
      "esri/core/promiseUtils",
      "esri/Map",
      "esri/layers/FeatureLayer",
      "esri/views/MapView",
      "esri/widgets/Feature",
    ]).then(([promiseUtils, Map, FeatureLayer, MapView, Feature]) => {
      const fLayer = new FeatureLayer({
        portalItem: {
          id: "673e64cb978d4e79ab47f541a7c52d65",
        },
        outFields: ["*"],
      });

      const map = new Map({
        basemap: "gray-vector",
        layers: [fLayer],
      });

      const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-80, 40],
        scale: 5000000,
      });

      // Create a default graphic for when the application starts
      const graphic = {
        popupTemplate: {
          content: "Mouse over features to show details...",
        },
      };

      // Provide graphic to a new instance of a Feature widget
      const feature = new Feature({
        graphic: graphic,
        map: view.map,
        spatialReference: view.spatialReference,
      });

      view.ui.add(feature, "bottom-left");

      view.whenLayerView(fLayer).then(function (layerView) {
        let highlight;
        let objectId;

        const debouncedUpdate = promiseUtils.debounce(function (event) {
          // Perform a hitTest on the View
          view.hitTest(event).then(function (event) {
            // Make sure graphic has a popupTemplate
            let results = event.results.filter(function (result) {
              return result.graphic.layer.popupTemplate;
            });

            let result = results[0];
            let newObjectId =
              result && result.graphic.attributes[fLayer.objectIdField];

            if (!newObjectId) {
              highlight && highlight.remove();
              objectId = feature.graphic = null;
            } else if (objectId !== newObjectId) {
              highlight && highlight.remove();
              objectId = newObjectId;
              feature.graphic = result.graphic;
              highlight = layerView.highlight(result.graphic);
            }
          });
        });

        // Listen for the pointer-move event on the View
        // and make sure that function is not invoked more
        // than one at a time
        view.on("pointer-move", function (event) {
          debouncedUpdate(event).catch(function (err) {
            if (!promiseUtils.isAbortError(err)) {
              throw err;
            }
          });
        });
      });
    });
  }, []);

  return (
    <div
      id="viewDiv"
      style={{ height: "100vh", width: "100vw" }}
      ref={MapEl}
      className="esri-widget"
    ></div>
  );
};

export default Map;
