import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Camera, MapPin, Upload, X, Loader, Check } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { processMultipleImages } from "../utils/imageUtils";
import { reverseGeocode } from "../utils/geocoding";
import { DEFAULT_CENTER, INDIA_BOUNDS } from "../components/MapView";
import "leaflet/dist/leaflet.css";

interface ReportFormData {
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface LocationMarkerProps {
  position: [number, number];
  setPosition: (position: [number, number]) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  // Pan to new location whenever position changes
  useEffect(() => {
    map.flyTo(position, map.getZoom(), {
      animate: true,
      duration: 1,
    });
  }, [position, map]);

  return <Marker position={position} />;
}

const categories = [
  "Road & Traffic",
  "Public Safety",
  "Utilities",
  "Environment",
  "Public Transport",
  "Parks & Recreation",
  "Housing",
  "Noise Complaints",
  "Sanitation",
  "Other",
];

export function ReportForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormData>();

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [location, setLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      const updateLocation = async () => {
        const result = await reverseGeocode(location[0], location[1]);
        setAddress(result);
      };
      updateLocation();
    }
  }, [location]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Check if location is within India's bounds
      const isWithinBounds =
        lat >= INDIA_BOUNDS.southWest.lat &&
        lat <= INDIA_BOUNDS.northEast.lat &&
        lng >= INDIA_BOUNDS.southWest.lng &&
        lng <= INDIA_BOUNDS.northEast.lng;

      if (!isWithinBounds) {
        alert(
          "Your location is outside India. Using default location instead."
        );
        setLocation(DEFAULT_CENTER);
      } else {
        setLocation([lat, lng]);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Could not get your location. Please select location on the map.");
      setLocation(DEFAULT_CENTER);
    } finally {
      setGettingLocation(false);
    }
  };
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...newImages]);

    // Create preview URLs
    newImages.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImageUrls((prev) => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!user) return;

    setLoading(true);

    try {
      let processedImages: Array<{
        fullImage: string;
        thumbnail: string;
        imageId: string;
      }> = [];

      // Process images
      if (images.length > 0) {
        setUploadingImages(true);
        processedImages = await processMultipleImages(images);
        setUploadingImages(false);
      }

      // Create the report
      const reportData = {
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        latitude: location[0],
        longitude: location[1],
        address,
        images: processedImages.map((img) => ({
          id: img.imageId,
          data: img.fullImage,
        })),
        thumbnail:
          processedImages.length > 0 ? processedImages[0].thumbnail : null,
        userId: user.uid,
        status: "submitted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        // First try to add the report
        const docRef = await addDoc(collection(db, "reports"), reportData);

        // If report is added successfully, try to add status history
        try {
          await addDoc(collection(db, "statusHistory"), {
            reportId: docRef.id,
            status: "submitted",
            changedBy: user.uid,
            notes: "Report submitted",
            createdAt: serverTimestamp(),
          });
        } catch (statusError) {
          console.error("Error creating status history:", statusError);
          // Don't show error to user since report was created successfully
        }

        // Show success message and navigate
        alert("Report submitted successfully!");
        navigate(`/report/${docRef.id}`);
      } catch (error) {
        console.error("Error submitting report:", error);
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("Final error handling:", error);
      // Only show error alert if the report creation failed
      if (error instanceof Error && !error.message.includes("statusHistory")) {
        alert("Error submitting report. Please try again.");
      }
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Report an Issue
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                {...register("title", { required: "Title is required" })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the issue"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                {...register("category", { required: "Category is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity *
              </label>
              <select
                {...register("severity", { required: "Severity is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {errors.severity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.severity.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register("description", {
                  required: "Description is required",
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the issue"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (up to 5)
              </label>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <Camera className="w-6 h-6 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Take Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Upload</span>
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {address || "Click on the map to set location"}
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className={`flex items-center px-3 py-1.5 text-sm font-medium ${
                      gettingLocation
                        ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                        : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    } rounded-md transition-colors`}
                  >
                    {gettingLocation ? (
                      <>
                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-1" />
                        Use Current Location
                      </>
                    )}
                  </button>
                </div>

                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer
                    center={location}
                    zoom={15}
                    className="h-full w-full"
                    maxBounds={[
                      [INDIA_BOUNDS.southWest.lat, INDIA_BOUNDS.southWest.lng],
                      [INDIA_BOUNDS.northEast.lat, INDIA_BOUNDS.northEast.lng],
                    ]}
                    minZoom={4}
                    maxZoom={18}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                      position={location}
                      setPosition={setLocation}
                    />
                  </MapContainer>
                </div>
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Use current location
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || uploadingImages}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
              >
                {uploadingImages ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Uploading Images...
                  </>
                ) : loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
