'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Polygon,
  Popup,
  Rectangle,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import {
  CATEGORY_META,
  STATUS_META,
  PRIORITY_META,
  type EnvIssue,
  type IssueStatus,
} from '@/types'
import { CAMPUS_AREAS } from '@/data/locations'

// Clean floor-plan image (public/floorplan.png) is 1672 x 941.
const IMG_W = 1672
const IMG_H = 941
const BOUNDS = L.latLngBounds([
  [0, 0],
  [IMG_H, IMG_W],
])

// Severity color: red if any pending, else orange if in-progress, else green.
function zoneColor(statuses: IssueStatus[]): string {
  if (statuses.includes('open')) return STATUS_META.open.color
  if (statuses.includes('in_progress')) return STATUS_META.in_progress.color
  return STATUS_META.resolved.color
}

function makePinIcon(color: string, status: IssueStatus) {
  // Warning-triangle marker (SVG), filled by category color. The status class
  // drives the attention animation (pending pulses, resolved dims).
  const svg = `<svg class="issue-marker status-${status}" width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3.2 L21.2 20 H2.8 Z" fill="${color}" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M12 9.5 V14" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round"/>
    <circle cx="12" cy="17.2" r="1.15" fill="#ffffff"/>
  </svg>`
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [30, 30],
    iconAnchor: [15, 18],
    popupAnchor: [0, -16],
  })
}

/** Captures map clicks while in "placing" mode. */
function ClickCapture({
  enabled,
  onPick,
}: {
  enabled: boolean
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (enabled) onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Fits the floor-plan image to the container, and refits when it resizes. */
function FitBounds() {
  const map = useMap()
  useEffect(() => {
    const fit = () => {
      map.invalidateSize()
      map.fitBounds(BOUNDS, { padding: [8, 8], animate: false })
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(fit))
    const t1 = setTimeout(fit, 150)
    const t2 = setTimeout(fit, 500)
    const ro = new ResizeObserver(() => fit())
    ro.observe(map.getContainer())
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
    }
  }, [map])
  return null
}

/** Pans the map to the selected issue when chosen from the sidebar. */
function FlyToFocus({
  issues,
  focusId,
}: {
  issues: EnvIssue[]
  focusId: string | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!focusId) return
    const target = issues.find((i) => i.id === focusId)
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 0), {
        duration: 0.6,
      })
    }
  }, [focusId, issues, map])
  return null
}

interface ZoneData {
  name: string
  bounds?: [[number, number], [number, number]]
  polygon?: [number, number][]
  polygons?: [number, number][][]
  color: string | null
  total: number
  open: number
  in_progress: number
  resolved: number
  issues: EnvIssue[]
}

interface ZoneShapeProps {
  zone: ZoneData
  placing: boolean
  canSetStatus: boolean
  canEditDetails: (issue: EnvIssue) => boolean
  canRemove: (issue: EnvIssue) => boolean
  canArchive: (issue: EnvIssue) => boolean
  hovered: boolean
  onHover: (name: string | null) => void
  onUpdateStatus: (id: string, status: IssueStatus) => void
  onEdit: (issue: EnvIssue) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

/**
 * A room hit-area aligned to the floor-plan's black-line box. Invisible by
 * default (the image shows through); highlights on hover. Hover is keyed by
 * name in the parent, so all zones sharing a name (e.g. the multi-segment
 * "Hallway") highlight together. Clicking opens a popup with the room's issues.
 */
function ZoneShape({
  zone,
  placing,
  canSetStatus,
  canEditDetails,
  canRemove,
  canArchive,
  hovered,
  onHover,
  onUpdateStatus,
  onEdit,
  onDelete,
  onArchive,
}: ZoneShapeProps) {
  const hover = hovered
  const hasIssues = zone.total > 0
  const accent = hasIssues ? (zone.color as string) : '#10b981'
  const pathOptions = {
    color: hover || hasIssues ? (hasIssues ? accent : '#0f766e') : '#000000',
    weight: hover ? 1 : hasIssues ? 1 : 0,
    opacity: hover || hasIssues ? 0.9 : 0,
    fillColor: accent,
    // Keep a near-zero fill so the box stays hoverable while invisible.
    fillOpacity: hasIssues ? (hover ? 0.42 : 0.3) : hover ? 0.16 : 0.001,
  }
  const eventHandlers = {
    mouseover: () => onHover(zone.name),
    mouseout: () => onHover(null),
  }

  const renderContent = () => (
    <>
      <Tooltip sticky direction="top" opacity={1}>
        <div className="text-xs">
          <p className="font-bold text-slate-800">{zone.name}</p>
          {hasIssues ? (
            <p className="text-slate-600">
              {zone.total} issue{zone.total !== 1 ? 's' : ''}
              {zone.open > 0 && ` · ${zone.open} pending`}
              {zone.in_progress > 0 && ` · ${zone.in_progress} in progress`}
              {zone.resolved > 0 && ` · ${zone.resolved} resolved`}
            </p>
          ) : (
            <p className="text-slate-400">No issues reported</p>
          )}
        </div>
      </Tooltip>

      {hasIssues && (
        <Popup maxWidth={280}>
          <div className="max-h-64 min-w-[210px] overflow-y-auto">
            <p className="mb-1 text-sm font-bold text-slate-800">{zone.name}</p>
            <ul className="space-y-2">
              {zone.issues.map((issue) => (
                <li key={issue.id} className="border-t border-slate-100 pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: CATEGORY_META[issue.category].color }}
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      {issue.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {CATEGORY_META[issue.category].label} ·{' '}
                    {PRIORITY_META[issue.priority].label} priority
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {canSetStatus ? (
                      <select
                        value={issue.status}
                        onChange={(e) =>
                          onUpdateStatus(issue.id, e.target.value as IssueStatus)
                        }
                        className="flex-1 rounded border border-slate-300 px-1.5 py-1 text-[11px]"
                        style={{ color: STATUS_META[issue.status].color }}
                      >
                        {(Object.keys(STATUS_META) as IssueStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-white"
                        style={{ background: STATUS_META[issue.status].color }}
                      >
                        {STATUS_META[issue.status].label}
                      </span>
                    )}
                    {canEditDetails(issue) && (
                      <button
                        onClick={() => onEdit(issue)}
                        className="rounded px-1.5 py-1 text-[11px] text-emerald-600 hover:bg-emerald-50"
                      >
                        Edit
                      </button>
                    )}
                    {canArchive(issue) && (
                      <button
                        onClick={() => onArchive(issue.id)}
                        className="rounded px-1.5 py-1 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      >
                        Archive
                      </button>
                    )}
                    {canRemove(issue) && (
                      <button
                        onClick={() => onDelete(issue.id)}
                        className="rounded px-1.5 py-1 text-[11px] text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Popup>
      )}
    </>
  )

  if (zone.polygons) {
    // Render each corridor segment as its own single-ring polygon (reliable
    // hover), all sharing the same hover state so they highlight together.
    return (
      <>
        {zone.polygons.map((ring, i) => (
          <Polygon
            key={i}
            positions={ring}
            interactive={!placing}
            pathOptions={pathOptions}
            eventHandlers={eventHandlers}
          >
            {renderContent()}
          </Polygon>
        ))}
      </>
    )
  }

  return zone.polygon ? (
    <Polygon
      positions={zone.polygon}
      interactive={!placing}
      pathOptions={pathOptions}
      eventHandlers={eventHandlers}
    >
      {renderContent()}
    </Polygon>
  ) : (
    <Rectangle
      bounds={zone.bounds!}
      interactive={!placing}
      pathOptions={pathOptions}
      eventHandlers={eventHandlers}
    >
      {renderContent()}
    </Rectangle>
  )
}

interface CampusMapProps {
  issues: EnvIssue[]
  placing: boolean
  canSetStatus: boolean
  canEditDetails: (issue: EnvIssue) => boolean
  canRemove: (issue: EnvIssue) => boolean
  canArchive: (issue: EnvIssue) => boolean
  onPickLocation: (lat: number, lng: number) => void
  onUpdateStatus: (id: string, status: IssueStatus) => void
  onEdit: (issue: EnvIssue) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  focusId: string | null
}

export default function CampusMap({
  issues,
  placing,
  canSetStatus,
  canEditDetails,
  canRemove,
  canArchive,
  onPickLocation,
  onUpdateStatus,
  onEdit,
  onDelete,
  onArchive,
  focusId,
}: CampusMapProps) {
  // Hover keyed by name so multi-segment zones (Hallway) highlight together.
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>()
    for (const issue of issues) {
      const meta = CATEGORY_META[issue.category]
      const key = `${issue.category}-${issue.status}`
      if (!map.has(key)) {
        map.set(key, makePinIcon(meta.color, issue.status))
      }
    }
    return map
  }, [issues])

  // One hit-area per known room; tinted by severity when it has issues.
  const zones = useMemo<ZoneData[]>(() => {
    return CAMPUS_AREAS.filter((a) => a.bounds || a.polygon).map((area) => {
      const areaIssues = issues.filter((i) => i.locationName === area.name)
      const statuses = areaIssues.map((i) => i.status)
      return {
        name: area.name,
        bounds: area.bounds,
        polygon: area.polygon,
        polygons: area.polygons,
        color: areaIssues.length ? zoneColor(statuses) : null,
        total: areaIssues.length,
        open: statuses.filter((s) => s === 'open').length,
        in_progress: statuses.filter((s) => s === 'in_progress').length,
        resolved: statuses.filter((s) => s === 'resolved').length,
        issues: areaIssues,
      }
    })
  }, [issues])

  return (
    <div
      className={`relative h-full w-full ${placing ? 'cursor-crosshair' : ''}`}
    >
      {placing && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg">
          Click on the map where the issue is located
        </div>
      )}

      <MapContainer
        crs={L.CRS.Simple}
        bounds={BOUNDS}
        maxBounds={BOUNDS.pad(0.25)}
        minZoom={-4}
        maxZoom={2}
        zoomSnap={0}
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="topright" />
        <ImageOverlay url="/floorplan.png" bounds={BOUNDS} />
        <FitBounds />
        <ClickCapture enabled={placing} onPick={onPickLocation} />
        <FlyToFocus issues={issues} focusId={focusId} />

        {zones.map((zone, i) => (
          <ZoneShape
            key={`${zone.name}-${i}`}
            zone={zone}
            placing={placing}
            canSetStatus={canSetStatus}
            canEditDetails={canEditDetails}
            canRemove={canRemove}
            canArchive={canArchive}
            hovered={hoveredName === zone.name}
            onHover={setHoveredName}
            onUpdateStatus={onUpdateStatus}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
          />
        ))}

        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={icons.get(`${issue.category}-${issue.status}`)}
            zIndexOffset={issue.id === focusId ? 1000 : 0}
            opacity={focusId && focusId !== issue.id ? 0.5 : 1}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ background: CATEGORY_META[issue.category].color }}
                  >
                    {CATEGORY_META[issue.category].label}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">{issue.title}</p>
                <p className="text-xs text-slate-500">Area: {issue.locationName}</p>
                <p className="my-1 text-xs text-slate-600">{issue.description}</p>
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className="font-semibold"
                    style={{ color: PRIORITY_META[issue.priority].color }}
                  >
                    {PRIORITY_META[issue.priority].label} priority
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {issue.imageUrls && issue.imageUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {issue.imageUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Issue attachment"
                          className="h-14 w-14 rounded-md border border-slate-200 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                <p className="mt-1.5 text-[11px] text-slate-500">
                  Reported by{' '}
                  <span className="font-semibold text-slate-700">
                    {issue.reportedBy}
                  </span>
                </p>

                <div className="mt-2 border-t border-slate-100 pt-2">
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                    Status
                  </label>
                  {canSetStatus ? (
                    <select
                      value={issue.status}
                      onChange={(e) =>
                        onUpdateStatus(issue.id, e.target.value as IssueStatus)
                      }
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      style={{ color: STATUS_META[issue.status].color }}
                    >
                      {(Object.keys(STATUS_META) as IssueStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ background: STATUS_META[issue.status].color }}
                    >
                      {STATUS_META[issue.status].label}
                    </span>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    {canEditDetails(issue) && (
                      <button
                        onClick={() => onEdit(issue)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700"
                      >
                        Edit details
                      </button>
                    )}
                    {canArchive(issue) && (
                      <button
                        onClick={() => onArchive(issue.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-700"
                      >
                        Archive
                      </button>
                    )}
                    {canRemove(issue) && (
                      <button
                        onClick={() => onDelete(issue.id)}
                        className="text-[11px] text-red-500 hover:text-red-700"
                      >
                        Delete report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
