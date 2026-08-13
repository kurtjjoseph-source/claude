import { geoAlbersUsa, geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import usTopo from "us-atlas/states-10m.json";
import worldTopo from "world-atlas/countries-110m.json";
import type { Topology } from "topojson-specification";

/**
 * Server-side basemap projection.
 *
 * The geometry is projected here and handed to the client as plain SVG path
 * strings, so d3-geo, topojson-client and several megabytes of TopoJSON never
 * enter the browser bundle. It also means no tile server, no API key and no
 * external request — the map works offline and cannot break because someone
 * else's service changed.
 */

export type MapView = "us" | "world";

export interface Basemap {
  view: MapView;
  width: number;
  height: number;
  /** One SVG path per state or country. */
  shapes: string[];
  /** Outer boundary, drawn heavier than the internal divisions. */
  outline: string | null;
}

const WIDTH = 960;
const HEIGHT = 560;

function projectionFor(view: MapView): GeoProjection {
  if (view === "us") {
    return geoAlbersUsa().scale(1_180).translate([WIDTH / 2, HEIGHT / 2 + 20]);
  }
  // Trimmed vertically: nobody is buying farmland in Antarctica.
  return geoNaturalEarth1().scale(175).translate([WIDTH / 2, HEIGHT / 2 + 40]);
}

let cache: Partial<Record<MapView, Basemap>> = {};

export function buildBasemap(view: MapView): Basemap {
  const cached = cache[view];
  if (cached) return cached;

  const projection = projectionFor(view);
  const path = geoPath(projection);

  const topo = (view === "us" ? usTopo : worldTopo) as unknown as Topology;
  const key = view === "us" ? "states" : "countries";
  const collection = feature(topo, topo.objects[key]!) as unknown as FeatureCollection<Geometry>;

  const shapes = collection.features
    .map((f) => path(f))
    .filter((d): d is string => Boolean(d));

  const built: Basemap = { view, width: WIDTH, height: HEIGHT, shapes, outline: null };
  cache = { ...cache, [view]: built };
  return built;
}

/**
 * Projects a coordinate into the basemap's pixel space.
 * Returns null when the point falls outside the projection — geoAlbersUsa
 * deliberately returns nothing for anywhere that is not the United States,
 * which is exactly the behaviour needed to keep foreign pins off the US map.
 */
export function projectPoint(view: MapView, lng: number, lat: number): { x: number; y: number } | null {
  const projected = projectionFor(view)([lng, lat]);
  if (!projected) return null;
  const [x, y] = projected;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < 0 || y < 0 || x > WIDTH || y > HEIGHT) return null;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}
