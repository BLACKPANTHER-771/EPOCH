const { useEffect, useRef, useState } = React;

/* ============================================
   2D MAP VIEW - MapLibre GL JS
   ============================================ */
const MapView = (props: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sourcesReady = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-122.4194, 37.7749],
      zoom: 12.5,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on('load', () => {
      // --- Hazard zones ---
      map.addSource('hazards', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'hazards-fill', type: 'fill', source: 'hazards', paint: {
        'fill-color': ['match', ['get', 'type'], 'EARTHQUAKE', '#f59e0b', 'FLOOD', '#3b82f6', 'FIRE', '#ef4444', '#8b5cf6'],
        'fill-opacity': 0.15
      }});
      map.addLayer({ id: 'hazards-outline', type: 'line', source: 'hazards', paint: {
        'line-color': ['match', ['get', 'type'], 'EARTHQUAKE', '#f59e0b', 'FLOOD', '#3b82f6', 'FIRE', '#ef4444', '#8b5cf6'],
        'line-width': 2, 'line-dasharray': [3, 2]
      }});

      // --- Roads ---
      map.addSource('roads', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'roads-layer', type: 'line', source: 'roads', paint: {
        'line-color': ['match', ['get', 'state'], 'OPEN', '#10b981', 'DEGRADED', '#f59e0b', 'BLOCKED', '#ef4444', '#6b7280'],
        'line-width': 3, 'line-opacity': 0.8
      }});

      // --- EO layers ---
      map.addSource('eo', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'eo-fill', type: 'fill', source: 'eo', paint: { 'fill-color': '#8b5cf6', 'fill-opacity': 0.1 }});

      // --- Hospitals ---
      map.addSource('hospitals', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'hospitals-layer', type: 'circle', source: 'hospitals', paint: {
        'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff'
      }});

      // --- Shelters ---
      map.addSource('shelters', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'shelters-layer', type: 'circle', source: 'shelters', paint: {
        'circle-radius': 7, 'circle-color': '#10b981', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff'
      }});

      // --- Resources ---
      map.addSource('resources', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'resources-layer', type: 'circle', source: 'resources', paint: {
        'circle-radius': 7,
        'circle-color': ['match', ['get', 'type'],
          'AMBULANCE', '#f472b6', 'RESCUE_TEAM', '#fb923c', 'MEDICAL_UNIT', '#38bdf8',
          'HAZMAT', '#a78bfa', 'FIRE_TRUCK', '#ef4444', '#6b7280'],
        'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(255,255,255,0.8)'
      }});

      // --- Incidents ---
      map.addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'incidents-glow', type: 'circle', source: 'incidents', paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 1, 12, 5, 28],
        'circle-color': ['match', ['get', 'severity'], 5,'#ef4444', 4,'#f97316', 3,'#f59e0b', 2,'#3b82f6', 1,'#10b981', '#888'],
        'circle-opacity': 0.15, 'circle-blur': 1
      }});
      map.addLayer({ id: 'incidents-layer', type: 'circle', source: 'incidents', paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 1, 5, 5, 12],
        'circle-color': ['match', ['get', 'severity'], 5,'#ef4444', 4,'#f97316', 3,'#f59e0b', 2,'#3b82f6', 1,'#10b981', '#888'],
        'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff'
      }});

      // --- Allocation routes ---
      map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'routes-layer', type: 'line', source: 'routes', paint: {
        'line-color': '#8b5cf6', 'line-width': 2, 'line-dasharray': [4, 4], 'line-opacity': 0.7
      }});

      sourcesReady.current = true;

      // Click handlers
      map.on('click', 'incidents-layer', (e: any) => {
        if (e.features?.length && props.onSelectIncident) {
          props.onSelectIncident(e.features[0].properties.id);
        }
      });
      map.on('click', 'resources-layer', (e: any) => {
        if (e.features?.length && props.onSelectResource) {
          props.onSelectResource(e.features[0].properties.id);
        }
      });

      // Cursor
      for (const layer of ['incidents-layer', 'resources-layer', 'hospitals-layer', 'shelters-layer']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }

      // Popup
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 15 });
      map.on('mouseenter', 'incidents-layer', (e: any) => {
        if (e.features?.length) {
          const f = e.features[0].properties;
          popup.setLngLat(e.lngLat).setHTML(`<strong>${f.title || 'Incident'}</strong><br/>Severity: ${f.severity} | ${f.status}`).addTo(map);
        }
      });
      map.on('mouseleave', 'incidents-layer', () => popup.remove());
      map.on('mouseenter', 'resources-layer', (e: any) => {
        if (e.features?.length) {
          const f = e.features[0].properties;
          popup.setLngLat(e.lngLat).setHTML(`<strong>${f.name || 'Resource'}</strong><br/>${f.type} | ${f.status}`).addTo(map);
        }
      });
      map.on('mouseleave', 'resources-layer', () => popup.remove());
    });

    return () => { map.remove(); mapRef.current = null; sourcesReady.current = false; };
  }, []);

  // Update data
  useEffect(() => {
    if (!mapRef.current || !sourcesReady.current) return;
    const map = mapRef.current;
    const setData = (name: string, fc: any) => { const s = map.getSource(name); if (s) s.setData(fc); };

    if (props.incidents) {
      setData('incidents', { type: 'FeatureCollection', features: props.incidents.map((i: any) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [i.longitude, i.latitude] }, properties: i
      }))});
    }
    if (props.resources) {
      setData('resources', { type: 'FeatureCollection', features: props.resources.map((r: any) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] }, properties: r
      }))});
    }
    if (props.roads) {
      setData('roads', { type: 'FeatureCollection', features: props.roads.map((r: any) => ({
        type: 'Feature', geometry: { type: 'LineString', coordinates: r.geometry }, properties: r
      }))});
    }
    if (props.hazards) {
      setData('hazards', { type: 'FeatureCollection', features: props.hazards.map((h: any) => ({
        type: 'Feature', geometry: { type: 'Polygon', coordinates: h.geometry }, properties: h
      }))});
    }
    if (props.hospitals) {
      setData('hospitals', { type: 'FeatureCollection', features: props.hospitals.map((h: any) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [h.longitude, h.latitude] }, properties: h
      }))});
    }
    if (props.shelters) {
      setData('shelters', { type: 'FeatureCollection', features: props.shelters.map((s: any) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] }, properties: s
      }))});
    }
    if (props.eoLayers) {
      const features = props.eoLayers.filter((l: any) => l.geometry?.geometry).map((l: any) => ({
        type: 'Feature', geometry: l.geometry.geometry, properties: l
      }));
      setData('eo', { type: 'FeatureCollection', features });
    }
    // Routes from allocations
    if (props.allocations && props.incidents && props.resources) {
      const features = props.allocations.map((a: any) => {
        const inc = props.incidents.find((i: any) => i.id === a.incident_id);
        const res = props.resources.find((r: any) => r.id === a.resource_id);
        if (!inc || !res) return null;
        return { type: 'Feature', geometry: { type: 'LineString', coordinates: [
          [res.longitude, res.latitude], [inc.longitude, inc.latitude]
        ]}, properties: a };
      }).filter(Boolean);
      setData('routes', { type: 'FeatureCollection', features });
    }
  }, [props.incidents, props.resources, props.roads, props.hazards, props.hospitals, props.shelters, props.eoLayers, props.allocations]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="map-container" />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-panel-solid rounded-xl p-3 text-xs space-y-1.5 z-10 min-w-[140px]">
        <div className="font-semibold text-gray-300 mb-2">Legend</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Critical</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Severe</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> High</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Moderate / Hospital</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Low / Shelter</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-400 inline-block"></span> Resource</div>
        <div className="border-t border-gray-700 pt-1 mt-1"></div>
        <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-emerald-500 inline-block"></span> Road Open</div>
        <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-yellow-500 inline-block"></span> Road Degraded</div>
        <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-red-500 inline-block"></span> Road Blocked</div>
      </div>
    </div>
  );
};

/* ============================================
   3D VIEW - CesiumJS with procedural fallback
   ============================================ */
const Map3DView = (props: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const markersSource = useRef<any>(null);
  const buildingsAdded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const initCesium = async () => {
      try {
        let viewer: any;
        const hasToken = !!(window as any).CESIUM_ION_TOKEN;

        if (hasToken) {
          Cesium.Ion.defaultAccessToken = (window as any).CESIUM_ION_TOKEN;
          viewer = new Cesium.Viewer(containerRef.current, {
            terrain: Cesium.Terrain.fromWorldTerrain(),
            animation: false, timeline: false, baseLayerPicker: false,
            geocoder: false, homeButton: false, sceneModePicker: false,
            navigationHelpButton: false, fullscreenButton: false, infoBox: false,
          });
          try { viewer.scene.primitives.add(await Cesium.createOsmBuildingsAsync()); } catch(e) { console.warn('OSM buildings unavailable'); }
        } else {
          viewer = new Cesium.Viewer(containerRef.current, {
            imageryProvider: new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
            animation: false, timeline: false, baseLayerPicker: false,
            geocoder: false, homeButton: false, sceneModePicker: false,
            navigationHelpButton: false, fullscreenButton: false, infoBox: false,
            requestRenderMode: false,
          });

          // Procedural 3D city
          const buildingSource = new Cesium.CustomDataSource('buildings');
          viewer.dataSources.add(buildingSource);
          const rng = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
          const rand = rng(42);
          // Downtown financial district - tall buildings
          for (let i = 0; i < 80; i++) {
            const lat = 37.790 + (rand() - 0.5) * 0.012;
            const lon = -122.400 + (rand() - 0.5) * 0.012;
            const h = 40 + rand() * 220;
            const s = 15 + rand() * 35;
            const gray = 25 + rand() * 30;
            buildingSource.entities.add({
              position: Cesium.Cartesian3.fromDegrees(lon, lat, h / 2),
              box: { dimensions: new Cesium.Cartesian3(s, s, h),
                material: Cesium.Color.fromBytes(gray, gray + 8, gray + 18, 210),
                outline: true, outlineColor: Cesium.Color.fromAlpha(Cesium.Color.WHITE, 0.06) }
            });
          }
          // Residential areas - shorter buildings
          for (let i = 0; i < 160; i++) {
            const lat = 37.755 + rand() * 0.055;
            const lon = -122.43 + rand() * 0.05;
            const h = 8 + rand() * 45;
            const s = 12 + rand() * 25;
            const gray = 20 + rand() * 25;
            buildingSource.entities.add({
              position: Cesium.Cartesian3.fromDegrees(lon, lat, h / 2),
              box: { dimensions: new Cesium.Cartesian3(s, s * (0.8 + rand() * 0.4), h),
                material: Cesium.Color.fromBytes(gray, gray + 5, gray + 12, 190),
                outline: true, outlineColor: Cesium.Color.fromAlpha(Cesium.Color.WHITE, 0.04) }
            });
          }
          buildingsAdded.current = true;
        }

        // Markers data source
        const markers = new Cesium.CustomDataSource('markers');
        viewer.dataSources.add(markers);
        markersSource.current = markers;

        // Camera
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-122.4194, 37.76, 4500),
          orientation: { heading: Cesium.Math.toRadians(15), pitch: Cesium.Math.toRadians(-40), roll: 0 },
          duration: 2
        });

        // Click handler
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((click: any) => {
          const picked = viewer.scene.pick(click.position);
          if (Cesium.defined(picked) && picked.id?.properties) {
            const p = picked.id.properties;
            if (p.entityType?.getValue() === 'incident' && props.onSelectIncident) {
              props.onSelectIncident(p.entityId.getValue());
            } else if (p.entityType?.getValue() === 'resource' && props.onSelectResource) {
              props.onSelectResource(p.entityId.getValue());
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        viewerRef.current = viewer;
      } catch (err) {
        console.error('Cesium init error:', err);
      }
    };

    initCesium();
    return () => { if (viewerRef.current) { viewerRef.current.destroy(); viewerRef.current = null; markersSource.current = null; } };
  }, []);

  // Update markers
  useEffect(() => {
    if (!markersSource.current) return;
    const src = markersSource.current;
    src.entities.removeAll();

    const sevColor = (s: number) => {
      if (s >= 5) return Cesium.Color.fromCssColorString('#ef4444');
      if (s >= 4) return Cesium.Color.fromCssColorString('#f97316');
      if (s >= 3) return Cesium.Color.fromCssColorString('#f59e0b');
      if (s >= 2) return Cesium.Color.fromCssColorString('#3b82f6');
      return Cesium.Color.fromCssColorString('#10b981');
    };

    // Incidents
    (props.incidents || []).forEach((inc: any) => {
      src.entities.add({
        position: Cesium.Cartesian3.fromDegrees(inc.longitude, inc.latitude, 50),
        point: { pixelSize: 8 + inc.severity * 3, color: sevColor(inc.severity),
          outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
        label: { text: inc.title, font: '13px Inter, sans-serif', style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2, outlineColor: Cesium.Color.BLACK, verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16), fillColor: Cesium.Color.WHITE,
          showBackground: true, backgroundColor: Cesium.Color.fromAlpha(Cesium.Color.BLACK, 0.6),
          backgroundPadding: new Cesium.Cartesian2(6, 4), distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000) },
        properties: { entityType: 'incident', entityId: inc.id }
      });
    });

    // Resources
    (props.resources || []).forEach((res: any) => {
      src.entities.add({
        position: Cesium.Cartesian3.fromDegrees(res.longitude, res.latitude, 30),
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
        label: { text: res.name, font: '11px JetBrains Mono, monospace', style: Cesium.LabelStyle.FILL,
          fillColor: Cesium.Color.fromCssColorString('#93c5fd'), verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000) },
        properties: { entityType: 'resource', entityId: res.id }
      });
    });

    // Hospitals
    (props.hospitals || []).forEach((h: any) => {
      src.entities.add({
        position: Cesium.Cartesian3.fromDegrees(h.longitude, h.latitude, 20),
        point: { pixelSize: 12, color: Cesium.Color.fromCssColorString('#3b82f6'), outlineColor: Cesium.Color.WHITE, outlineWidth: 3 },
        label: { text: '🏥 ' + h.name, font: '12px Inter, sans-serif', fillColor: Cesium.Color.WHITE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -18),
          showBackground: true, backgroundColor: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString('#1e3a5f'), 0.8),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000) }
      });
    });

    // Shelters
    (props.shelters || []).forEach((s: any) => {
      src.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, 20),
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#10b981'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
        label: { text: '⛺ ' + s.name, font: '11px Inter, sans-serif', fillColor: Cesium.Color.fromCssColorString('#6ee7b7'),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -14),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000) }
      });
    });

    // Hazard zones
    (props.hazards || []).forEach((hz: any) => {
      if (!hz.geometry?.[0]) return;
      const positions = hz.geometry[0].map((c: number[]) => Cesium.Cartesian3.fromDegrees(c[0], c[1], 5));
      const hzColor = hz.type === 'EARTHQUAKE' ? '#f59e0b' : hz.type === 'FLOOD' ? '#3b82f6' : '#ef4444';
      src.entities.add({
        polygon: { hierarchy: new Cesium.PolygonHierarchy(positions),
          material: Cesium.Color.fromCssColorString(hzColor).withAlpha(0.15),
          outline: true, outlineColor: Cesium.Color.fromCssColorString(hzColor).withAlpha(0.5),
          height: 2 }
      });
    });

    // Allocation routes
    if (props.allocations && props.incidents && props.resources) {
      props.allocations.forEach((a: any) => {
        const inc = (props.incidents || []).find((i: any) => i.id === a.incident_id);
        const res = (props.resources || []).find((r: any) => r.id === a.resource_id);
        if (!inc || !res) return;
        src.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([res.longitude, res.latitude, 50, inc.longitude, inc.latitude, 50]),
            width: 3, material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#a78bfa'), dashLength: 16 })
          }
        });
      });
    }
  }, [props.incidents, props.resources, props.hospitals, props.shelters, props.hazards, props.allocations]);

  return <div ref={containerRef} className="map-container" />;
};

(window as any).MapView = MapView;
(window as any).Map3DView = Map3DView;
