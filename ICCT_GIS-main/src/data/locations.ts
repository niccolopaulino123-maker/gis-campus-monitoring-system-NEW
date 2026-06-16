/**
 * Room zones for ICCT Binangonan, aligned to the clean floor-plan image
 * (public/floorplan.png, 1672 x 941). Coordinates are authored in IMAGE PIXELS
 * (px from left, py from TOP) via room()/poly(), then converted to Leaflet
 * CRS.Simple space ([y, x], y-up) where lat = IMG_H - py. Because the image is
 * orthographic, these boxes line up with the black-line divisions.
 */
const IMG_H = 941

export interface CampusArea {
  name: string
  /** [y, x] centroid in CRS.Simple space. */
  point: [number, number]
  /** [[yMin, xMin], [yMax, xMax]] room rectangle; omit for non-room areas. */
  bounds?: [[number, number], [number, number]]
  /** Ring of [y, x] points for slanted rooms. */
  polygon?: [number, number][]
  /** Multiple rings (e.g. a corridor network) rendered as one zone. */
  polygons?: [number, number][][]
}

/** Rectangle from image pixels: left, right, top, bottom. */
function room(
  name: string,
  px0: number,
  px1: number,
  pyTop: number,
  pyBottom: number,
): CampusArea {
  return {
    name,
    bounds: [
      [IMG_H - pyBottom, px0],
      [IMG_H - pyTop, px1],
    ],
    point: [IMG_H - (pyTop + pyBottom) / 2, (px0 + px1) / 2],
  }
}

/** Multi-rectangle zone from image-pixel rects [x0, x1, pyTop, pyBottom]. */
function corridors(
  name: string,
  rects: [number, number, number, number][],
): CampusArea {
  const polygons = rects.map(
    ([x0, x1, t, bm]) =>
      [
        [IMG_H - bm, x0],
        [IMG_H - t, x0],
        [IMG_H - t, x1],
        [IMG_H - bm, x1],
      ] as [number, number][],
  )
  const [x0, x1, t, bm] = rects[0]
  return { name, polygons, point: [IMG_H - (t + bm) / 2, (x0 + x1) / 2] }
}

/** Polygon from image pixels: ring of [px, py] points. */
function poly(name: string, ring: [number, number][]): CampusArea {
  const pts = ring.map(([px, py]) => [IMG_H - py, px] as [number, number])
  const cy = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cx = pts.reduce((s, p) => s + p[1], 0) / pts.length
  return { name, polygon: pts, point: [cy, cx] }
}

export const CAMPUS_AREAS: CampusArea[] = [
  // Top-left classroom strip
  poly('Classroom 4', [
    [68, 145],
    [189, 145],
    [189, 236],
    [85, 236],
  ]),
  room('Classroom 3', 188, 295, 145, 237),
  room('Classroom 2', 295, 400, 145, 237),
  room('Classroom 1', 402, 505, 145, 237),
  room('Canteen', 505, 574, 166, 237),

  // Left blocks (slanted parallelograms, traced to the black outline)
  poly('Existing Warehouse', [
    [120, 292],
    [312, 292],
    [312, 718],
    [200, 718],
  ]),
  // Wraps around the warehouse: right column + under it + the left slot
  // (between the warehouse and the slanted outer property wall).
  poly('Vacant Lot', [
    [312, 292],
    [573, 292],
    [573, 900],
    [190, 889],
    [160, 690],
    [95, 295],
    [120, 295],
    [200, 718],
    [312, 718],
    
  ]),

  // Main building — top strip
  room('Laundry Area', 758, 855, 130, 153),
  room('Female Toilet', 856, 921, 110, 153),
  room('Male Toilet', 982, 1044, 110, 153),

  // Main building — paired rooms (left / right columns)
  room('Mini Hotel Simulation', 688, 865, 155, 265),
  room('Hot & Cold Kitchen', 865, 1060, 155, 265),
  room('Beauty Care, Demo Room & Working Area', 688, 835, 267, 380),
  room('Criminology - 2', 902, 1060, 266, 382),
  room('Chemistry, Physics & Science (Laboratory Room)', 689, 865, 380, 498),
  room('Criminology - 1', 902, 1060, 382, 496),
  room('Computer Lab 2', 688, 865, 498, 609),
  room('Broadcasting / Judicial Room', 868, 1060, 498, 609),

  // Hallway — the full corridor network, as separate "Hallway" rectangles
  // (each hovers reliably; all share the name so reports tag "Hallway").
  room('Hallway', 80, 610, 238, 290), // classroom-front corridor
  room('Hallway', 620, 688, 152, 612), // left of the main-building columns
  room('Hallway', 1060, 1100, 152, 762), // right of the columns
  room('Hallway', 665, 1060, 612, 640), // horizontal HALLWAY strip
  room('Hallway', 838, 888, 640, 868), // vertical HALLWAY (lower section)
  room('Hallway', 620, 665, 640, 878), // left of the lower-section rooms

  // Main building — lower section
  room('Computer Laboratory', 669, 840, 641, 748),
  room('Library / Learning Resource Area', 670, 841, 748, 860),
  room('Faculty Room', 890, 980, 670, 762),
  room('Accounting Office', 1000, 1078, 670, 705),
  room('Files Storage', 990, 1078, 718, 750),
  room('Admission Area', 888, 995, 765, 804),
  room('Social Clinic', 995, 1048, 760, 815),
  room('Toilet (Ground)', 1048, 1088, 790, 815),
  room('Lobby', 888, 995, 815, 852),
  room('Guidance Office', 995, 1075, 818, 870),

  // Right block (slanted)
  poly('Covered Court / Gym', [
    [1090, 648],
    [1170, 652],
    [1185, 832],
    [1100, 838],
  ]),

  // Gates (perimeter access points) — small reportable zones
  room('Gate (Canteen)', 505, 572, 166, 236),
  room('Gate (Hallway Left)', 688, 645, 615, 652),
  room('Gate (Hallway Right)', 1060, 1110, 640, 662),
  room('Gate (Front, Vacant Lot)', 405, 465, 898, 932),
  room('Gate (Front, Entrance)', 846, 912, 903, 936),

  // Non-room / outdoor (no box)
  { name: 'Other / Outdoor Area', point: [IMG_H - 600, 450] },
]

/** Unique area names (some areas like "Hallway" span several zones). */
export const AREA_NAMES: string[] = Array.from(
  new Set(CAMPUS_AREAS.map((a) => a.name)),
)

function inRect(
  lat: number,
  lng: number,
  b: [[number, number], [number, number]],
): boolean {
  return lat >= b[0][0] && lat <= b[1][0] && lng >= b[0][1] && lng <= b[1][1]
}

// Ray-casting point-in-polygon (handles the concave/U-shaped zones).
function inPoly(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i]
    const [yj, xj] = ring[j]
    const hit =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (hit) inside = !inside
  }
  return inside
}

/** Returns the name of the campus area containing the [lat, lng] point. */
export function findAreaAt(lat: number, lng: number): string {
  for (const a of CAMPUS_AREAS) {
    if (a.bounds && inRect(lat, lng, a.bounds)) return a.name
    if (a.polygon && inPoly(lat, lng, a.polygon)) return a.name
    if (a.polygons && a.polygons.some((r) => inPoly(lat, lng, r))) return a.name
  }
  return 'Other / Outdoor Area'
}
