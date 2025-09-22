import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, Marker as LeafletMarker, Map as LeafletMap } from "leaflet";
import { Report } from "../lib/firebase";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
const DefaultIcon = new Icon({
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Severity-based marker icon
function createSeverityIcon(severity: string) {
  const severityIcons: Record<string, string> = {
    low: "/marker-icon-green.png",
    medium: "/marker-icon-yellow.png",
    high: "/marker-icon-orange.png",
    critical: "/marker-icon-red.png",
  };
  const iconUrl = severityIcons[severity] || "/marker-icon.png";
  return new Icon({
    iconUrl,
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
}

interface MapViewProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  onReportClick?: (report: Report) => void;
  hideResolved?: boolean; // Control visibility of resolved issues on map
}

// Default center coordinates for India
export const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
export const DEFAULT_ZOOM = 5;

// Define bounds for India
export const INDIA_BOUNDS = {
  northEast: { lat: 35.513327, lng: 97.395555 },
  southWest: { lat: 6.4626999, lng: 68.7203 },
};

export function MapView({
  reports,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onReportClick,
  hideResolved = true, // Default to hiding resolved issues on map
}: MapViewProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    // Set default icon for Leaflet markers without relying on global `L`
    (LeafletMarker as any).prototype.options.icon = DefaultIcon;

    // Set bounds when map is loaded
    if (mapRef.current) {
      mapRef.current.setMaxBounds([
        [INDIA_BOUNDS.southWest.lat, INDIA_BOUNDS.southWest.lng],
        [INDIA_BOUNDS.northEast.lat, INDIA_BOUNDS.northEast.lng],
      ]);
    }
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: "bg-gray-500",
      verified: "bg-blue-500",
      assigned: "bg-yellow-500",
      resolved: "bg-green-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };
    return colors[severity as keyof typeof colors] || "text-gray-600";
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-[600px] w-full"
      style={{ height: "600px", width: "100%" }}
      ref={mapRef}
      maxBounds={[
        [INDIA_BOUNDS.southWest.lat, INDIA_BOUNDS.southWest.lng],
        [INDIA_BOUNDS.northEast.lat, INDIA_BOUNDS.northEast.lng],
      ]}
      minZoom={4}
      maxZoom={18}
      boundsOptions={{ padding: [50, 50] }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Filter out resolved issues if hideResolved is true */}
      {reports
        .filter((report) => !hideResolved || report.status !== "resolved")
        .map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createSeverityIcon(report.severity)}
          >
            <Popup className="custom-popup">
              <div className="p-2 max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {report.status.charAt(0).toUpperCase() +
                      report.status.slice(1)}
                  </span>
                  <span
                    className={`text-xs font-medium capitalize ${getSeverityColor(
                      report.severity
                    )}`}
                  >
                    {report.severity}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                  {report.title}
                </h3>

                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {report.description}
                </p>

                <div className="text-xs text-gray-500 mb-2">
                  <div className="font-medium">{report.category}</div>
                  <div>{format(report.createdAt, "MMM dd, yyyy")}</div>
                  {report.address && (
                    <div className="line-clamp-1">{report.address}</div>
                  )}
                </div>

                {report.thumbnail && (
                  <img
                    src={report.thumbnail}
                    alt="Report thumbnail"
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                )}

                {onReportClick && (
                  <button
                    onClick={() => onReportClick(report)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
