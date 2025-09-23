import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Camera, MapPin, Upload, X, Loader, Check, AlertCircle, Image, CheckCircle2 } from "lucide-react";
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

  useEffect(() => {
    map.flyTo(position, map.getZoom(), {
      animate: true,
      duration: 1,
    });
  }, [position, map]);

  return <Marker position={position} />;
}

// Success Modal Component
function SuccessModal({ isOpen, onClose, reportId }: { isOpen: boolean; onClose: () => void; reportId: string | null }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600 max-w-md w-full mx-4 transform animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            Report Submitted Successfully!
          </h3>
          
          <p className="text-slate-300 mb-6">
            Thank you for helping improve your community. Your report has been submitted and will be reviewed by the relevant authorities.
          </p>
          
          {reportId && (
            <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-slate-400 mb-1">Report ID</p>
              <p className="text-sm font-mono text-slate-200">{reportId.slice(0, 8).toUpperCase()}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
            >
              View Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast Notification Component
function ToastNotification({ isVisible, message, type = 'success', onClose }: { 
  isVisible: boolean; 
  message: string; 
  type?: 'success' | 'error'; 
  onClose: () => void; 
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 transform animate-in slide-in-from-right-full duration-300">
      <div className={`p-4 rounded-xl shadow-2xl border max-w-sm ${
        type === 'success' 
          ? 'bg-gradient-to-r from-green-600 to-emerald-700 border-green-500/30' 
          : 'bg-gradient-to-r from-red-600 to-red-700 border-red-500/30'
      }`}>
        <div className="flex items-center gap-3">
          {type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 text-white" />
          )}
          <p className="text-white text-sm font-medium flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
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
  
  // Success states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

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

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showToastMessage("Geolocation is not supported by your browser", 'error');
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

      const isWithinBounds =
        lat >= INDIA_BOUNDS.southWest.lat &&
        lat <= INDIA_BOUNDS.northEast.lat &&
        lng >= INDIA_BOUNDS.southWest.lng &&
        lng <= INDIA_BOUNDS.northEast.lng;

      if (!isWithinBounds) {
        showToastMessage("Your location is outside India. Using default location instead.", 'error');
        setLocation(DEFAULT_CENTER);
      } else {
        setLocation([lat, lng]);
        showToastMessage("Location updated successfully!");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      showToastMessage("Could not get your location. Please select location on the map.", 'error');
      setLocation(DEFAULT_CENTER);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...newImages]);

    newImages.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImageUrls((prev) => [...prev, url]);
    });

    showToastMessage(`${newImages.length} image(s) added successfully!`);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    showToastMessage("Image removed");
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

      if (images.length > 0) {
        setUploadingImages(true);
        processedImages = await processMultipleImages(images);
        setUploadingImages(false);
      }

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
        const docRef = await addDoc(collection(db, "reports"), reportData);

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
        }

        // Show success modal instead of alert
        setSubmittedReportId(docRef.id);
        setShowSuccessModal(true);
        
        // Navigate after a delay
        setTimeout(() => {
          navigate(`/report/${docRef.id}`);
        }, 3000);
        
      } catch (error) {
        console.error("Error submitting report:", error);
        throw error;
      }
    } catch (error) {
      console.error("Final error handling:", error);
      if (error instanceof Error && !error.message.includes("statusHistory")) {
        showToastMessage("Error submitting report. Please try again.", 'error');
      }
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (submittedReportId) {
      navigate(`/report/${submittedReportId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600 mb-6">
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  Report an Issue
                </h1>
                <p className="text-slate-300 text-sm">
                  Help improve your community by reporting civic issues
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600">
          <div className="p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title & Category Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Report Title *
                  </label>
                  <input
                    {...register("title", { required: "Title is required" })}
                    type="text"
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-700/50 focus:bg-slate-700 backdrop-blur-sm text-white placeholder-slate-400"
                    placeholder="Brief description of the issue"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Category *
                  </label>
                  <select
                    {...register("category", { required: "Category is required" })}
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-700/50 focus:bg-slate-700 text-white"
                  >
                    <option value="" className="bg-slate-700">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-slate-700">
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Severity Level *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: "low", label: "Low", color: "from-green-500 to-green-600" },
                    { value: "medium", label: "Medium", color: "from-yellow-500 to-yellow-600" },
                    { value: "high", label: "High", color: "from-orange-500 to-orange-600" },
                    { value: "critical", label: "Critical", color: "from-red-500 to-red-600" },
                  ].map((severity) => (
                    <label key={severity.value} className="cursor-pointer group">
                      <input
                        {...register("severity", { required: "Severity is required" })}
                        type="radio"
                        value={severity.value}
                        className="sr-only peer"
                      />
                      <div className={`p-3 rounded-xl border-2 border-slate-600 peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:${severity.color} transition-all duration-200 hover:border-slate-500 group-hover:scale-105`}>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white peer-checked:text-white">
                            {severity.label}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.severity && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.severity.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-700/50 focus:bg-slate-700 backdrop-blur-sm text-white placeholder-slate-400 resize-none"
                  placeholder="Provide a detailed description of the issue, including what you observed, when it occurred, and any other relevant information..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Photos ({images.length}/5)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={images.length >= 5}
                    className="flex items-center justify-center p-6 border-2 border-dashed border-slate-600 rounded-xl hover:border-blue-400 hover:bg-slate-700/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-400 mr-3 transition-colors" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-slate-300 group-hover:text-blue-400 transition-colors">
                        Take Photo
                      </span>
                      <p className="text-xs text-slate-400 mt-1">Use camera</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 5}
                    className="flex items-center justify-center p-6 border-2 border-dashed border-slate-600 rounded-xl hover:border-blue-400 hover:bg-slate-700/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400 mr-3 transition-colors" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-slate-300 group-hover:text-blue-400 transition-colors">
                        Upload Files
                      </span>
                      <p className="text-xs text-slate-400 mt-1">Choose from gallery</p>
                    </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-xl border border-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all duration-200" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Location *
                </label>

                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center text-sm text-slate-300 bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-600">
                      <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="truncate">
                        {address || "Click on the map to set location"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border ${
                        gettingLocation
                          ? "text-slate-400 bg-slate-700/30 border-slate-600 cursor-not-allowed"
                          : "text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:scale-105"
                      }`}
                    >
                      {gettingLocation ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Use Current Location
                        </>
                      )}
                    </button>
                  </div>

                  <div className="h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-600 shadow-inner">
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
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-600">
                <button
                  type="submit"
                  disabled={loading || uploadingImages}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 disabled:from-blue-400 disabled:to-purple-500 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:scale-100"
                >
                  {uploadingImages ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Uploading Images...
                    </>
                  ) : loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleSuccessModalClose}
        reportId={submittedReportId}
      />

      {/* Toast Notifications */}
      <ToastNotification
        isVisible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}