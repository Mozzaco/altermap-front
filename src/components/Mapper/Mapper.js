import React, {
  useEffect, useState, useRef, useCallback,
} from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import {
  Map, TileLayer, ZoomControl, FeatureGroup, GeoJSON,
} from 'react-leaflet';
import { BoxZoomControl } from 'react-leaflet-box-zoom';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import './Mapper.css';
import ConstructionSiteForm from '../ConstructionSiteForm/ConstructionSiteForm';
import Popup from '../Popup/Popup';
import Layers from '../Layers/Layers';

function Mapper({
  position,
  zoom,
  setPopupStatus,
  popup,
  displayWaterLayer,
  displayLimitsLayer,
  waterLayerStatus,
  limitsLayerStatus,
  polygonToUpdate,
  setPolygonToUpdate,
}) {
  // Hook of polygons
  const [constructionSites, setConstructionSites] = useState([]);
  const [staticWaterLayer, setStaticWaterLayer] = useState(null);
  const [staticLimitsLayer, setStaticLimitsLayer] = useState(null);
  const [tempCoords, setTempCoords] = useState(null);
  const [deletionEvent, addDeletionEvent] = useState(null);
  const [waterIsLoading, setWaterIsLoading] = useState(false);
  const [limitsIsLoading, setLimitsIsLoading] = useState(false);
  const [editConstructionSite, setEditConstructionSite] = useState(null);

  // Hook for layers
  const featureGroupRef = useRef();

  // Function to display GeoJson
  const getGeoJson = useCallback((coordinates) => ({
    type: 'FeatureCollection',
    features: [
      {
        type: 'FeatureCollection',
        features: coordinates.map((polygon) => ({
          type: 'Feature',
          properties: {
            id: polygon.id,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [polygon.coords],
          },
        })),
      },
    ],
  }), []);

  // useEffect for the map
  useEffect(() => {
    if (constructionSites.length === 0) { return; }
    const leafletGeoJSON = new L.GeoJSON(getGeoJson(constructionSites));
    const leafletFG = featureGroupRef.current.leafletElement;
    let i = 0;
    leafletGeoJSON.eachLayer((layer) => {
      leafletFG.addLayer(layer);
      layer.bindTooltip(constructionSites[i].name, { className: "polygon__name" });
      i++;
    });
  }, [constructionSites, getGeoJson]);

  useEffect(() => {
    let Limits;
    let Water;
    if (displayWaterLayer && !staticWaterLayer) {
      Water = async () => {
        setWaterIsLoading(true);
        await axios.get('/geojson/zones_inondables_66.geojson')
          .then((response) => setStaticWaterLayer(response.data));
        setWaterIsLoading(false);
      };
      Water();
    }
    if (displayLimitsLayer && !staticLimitsLayer) {
      Limits = async () => {
        setLimitsIsLoading(true);
        await axios.get('/geojson/departement_66.geojson')
          .then((response) => setStaticLimitsLayer(response.data));
        setLimitsIsLoading(false);
      };
      Limits();
    }
  }, [displayLimitsLayer, displayWaterLayer, staticLimitsLayer, staticWaterLayer]);

  // UseEffect like componentDidMount
  useEffect(() => {
    axios
      .get('/api/v1/construction-sites')
      .then((response) => setConstructionSites(response.data));
  }, []);

  let count = 0;

  Array.from(document.querySelectorAll('.leaflet-right > *'))
    .map(
      (x) => (x.children.length === 0 ? 1 : x.children.length)
      ,
    ).map(
      (item) => {
        count += item;
        return item;
      },
    );

  const coordsOfPolygonUpdate = () => {
    axios.get(`/api/v1/construction-sites/${polygonToUpdate}`)
      .then((res) => {
        setEditConstructionSite(res.data);
        !tempCoords && setTempCoords(res.data.coords)
      });
  };

  if (polygonToUpdate && !editConstructionSite) {
    coordsOfPolygonUpdate();
  }

  return (
    <div>
      <Map
        className="Mapper"
        id="Map"
        center={position}
        zoom={zoom}
        zoomControl={false}
        maxZoom={17} // Set zoom max
        minZoom={6} // Set zoom min
      >
        {/* Fond de carte */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="topright" />
        <BoxZoomControl position="topright" />
        <div className="Mapper__options" style={{ marginTop: count > 4 ? 37 * count : 37 * (count - 1), transition: 'ease .5s' }}>
          <Layers displayWaterLayer={waterLayerStatus} displayLimitsLayer={limitsLayerStatus} waterIsLoading={waterIsLoading} limitsIsLoading={limitsIsLoading} />
        </div>
        {/* Feature Group for draw controls */}
        <FeatureGroup ref={featureGroupRef}>
          {localStorage.getItem('altermap-token') && Number(jwtDecode(localStorage.getItem('altermap-token')).role) > 1
            && (
              <EditControl
                position="topright"
                // Edition of polygons
                onEdited={(e) => {
                  // Recovery numbers of modified polygons
                  const polygonsEdit = Object.keys(e.layers._layers);
                  polygonsEdit.forEach((polygon) => {
                    // Recovery id of polygon
                    const { id } = e.layers._layers[polygon].feature.properties;
                    // Recovery of coords
                    const coords = e.layers._layers[polygon]._latlngs[0].map(
                      (point) => [point.lng, point.lat],
                    );
                    // Set id of modified polygons
                    setTempCoords(coords);
                    setPolygonToUpdate(id);
                  });
                }}

                // Creation of polygons
                onCreated={(e) => {
                  // Recovery of polygon coords
                  const coords = e.layer.editing.latlngs[0][0].map((x) => [
                    x.lng,
                    x.lat,
                  ]);
                  setTempCoords(coords);
                }}
                // Deletion of polygons
                onDeleted={(e) => {
                  // Open popup
                  setPopupStatus(true);
                  // store event
                  addDeletionEvent(e);
                }}

                edit={{ remove: true }}
                draw={{
                  marker: false,
                  circle: false,
                  rectangle: false,
                  polygon: true,
                  polyline: false,
                  circlemarker: false,
                }}
              />
            )}
        </FeatureGroup>
        {displayWaterLayer && staticWaterLayer && <GeoJSON data={staticWaterLayer} style={{
          color: 'red',
          opacity: 0.5,
        }} />}
        {displayLimitsLayer && staticLimitsLayer
          && (
            <GeoJSON
              data={staticLimitsLayer}
              style={{
                color: 'black',
                opacity: 0.5,
                fill: 'rgba(0,0,0,0)',
                fillOpacity: 0,
              }}
            />
          )}
      </Map>
      {tempCoords && !editConstructionSite && (
        <ConstructionSiteForm coords={tempCoords} refreshCoords={setTempCoords} />
      )}
      {tempCoords && editConstructionSite && (
        <ConstructionSiteForm coords={tempCoords} refreshCoords={setTempCoords} id={polygonToUpdate} constructionSite={editConstructionSite} />
      )}
      {
        popup && deletionEvent && (
          <Popup setPopupStatus={setPopupStatus} deleteEvent={deletionEvent} resetDeletionEvent={addDeletionEvent} />
        )
      }
    </div>
  );
}

export default Mapper;
