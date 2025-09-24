// Image Analysis Service

interface ImageAnalysisResult {
  title?: string;
  description?: string;
  category?: string;
  severity?: "low" | "medium" | "high" | "critical";
  location?: {
    lat: number;
    lng: number;
  };
}

// Map of civic issue keywords to categories
const CATEGORY_KEYWORDS = {
  pothole: "Roads and Transportation",
  road: "Roads and Transportation",
  traffic: "Roads and Transportation",
  garbage: "Sanitation",
  waste: "Sanitation",
  trash: "Sanitation",
  light: "Street Lighting",
  streetlight: "Street Lighting",
  lamp: "Street Lighting",
  water: "Water Supply",
  pipeline: "Water Supply",
  leakage: "Water Supply",
  drain: "Drainage",
  sewage: "Drainage",
  flooding: "Drainage",
  signal: "Traffic Management",
  congestion: "Traffic Management",
  park: "Parks and Recreation",
  garden: "Parks and Recreation",
  playground: "Parks and Recreation",
  tree: "Parks and Recreation",
  construction: "Construction",
  building: "Construction",
  pollution: "Environmental Issues",
  smoke: "Environmental Issues",
  noise: "Environmental Issues",
};

// Severity assessment rules
const SEVERITY_RULES = {
  critical: [
    "emergency",
    "hazard",
    "danger",
    "accident",
    "death",
    "fatal",
    "collapse",
  ],
  high: ["serious", "severe", "major", "large", "deep", "risk", "unsafe"],
  medium: ["moderate", "concerning", "issue", "problem", "damaged"],
  low: ["minor", "small", "slight", "minimal", "cosmetic"],
};

export class ImageAnalysisService {
  private static instance: ImageAnalysisService;

  private constructor() {}

  public static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  async analyzeImage(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      // Call Google Cloud Vision API directly
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${
          import.meta.env.VITE_GOOGLE_CLOUD_API_KEY
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  { type: "LABEL_DETECTION", maxResults: 10 },
                  { type: "TEXT_DETECTION" },
                  { type: "OBJECT_LOCALIZATION", maxResults: 10 },
                  { type: "IMAGE_PROPERTIES" },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const result = await response.json();

      // Format the response to match our expected structure
      const formattedResult = {
        description: {
          captions: [
            {
              text:
                result.responses[0].labelAnnotations
                  ?.slice(0, 3)
                  ?.map((label: any) => label.description)
                  ?.join(", ") || "",
            },
          ],
        },
        tags:
          result.responses[0].labelAnnotations?.map((label: any) => ({
            name: label.description,
            confidence: label.score,
          })) || [],
        objects:
          result.responses[0].localizedObjectAnnotations?.map((obj: any) => ({
            object: obj.name,
            confidence: obj.score,
          })) || [],
      };

      // Process the analysis results
      return this.processAnalysisResults(formattedResult, imageFile);
    } catch (error) {
      console.error("Error analyzing image:", error);
      return this.getMockAnalysis();
    }
  }

  private async processAnalysisResults(
    apiResult: any,
    imageFile: File
  ): Promise<ImageAnalysisResult> {
    const { description, tags, objects } = apiResult;

    // Convert all text to lowercase for easier matching
    const allText = description?.captions?.[0]?.text?.toLowerCase() || "";
    const allTags = tags?.map((t: any) => t.name.toLowerCase()) || [];

    // Determine category
    const category = this.determineCategory(allTags, allText);

    // Determine severity
    const severity = this.determineSeverity(allTags, allText);

    // Generate title
    const title = this.generateTitle(category, objects, allTags);

    // Get location from image metadata
    const location = await this.extractLocationFromImage(imageFile);

    return {
      title,
      description:
        description?.captions?.[0]?.text ||
        this.generateDescription(category, severity),
      category,
      severity,
      location,
    };
  }

  private determineCategory(tags: string[], text: string): string {
    // Check each category keyword against tags and text
    for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
      if (tags.includes(keyword) || text.includes(keyword)) {
        return category;
      }
    }
    return "Others";
  }

  private determineSeverity(
    tags: string[],
    text: string
  ): "low" | "medium" | "high" | "critical" {
    const allText = text + " " + tags.join(" ");

    // Check severity rules in order of priority
    if (SEVERITY_RULES.critical.some((keyword) => allText.includes(keyword))) {
      return "critical";
    }
    if (SEVERITY_RULES.high.some((keyword) => allText.includes(keyword))) {
      return "high";
    }
    if (SEVERITY_RULES.medium.some((keyword) => allText.includes(keyword))) {
      return "medium";
    }
    if (SEVERITY_RULES.low.some((keyword) => allText.includes(keyword))) {
      return "low";
    }

    return "medium"; // Default severity
  }

  private generateTitle(
    category: string,
    objects: any[],
    tags: string[]
  ): string {
    // Try to use the most relevant object or tag
    const mainObject = objects?.[0]?.object || tags[0] || "";

    if (!mainObject) {
      return `${category} Issue Report`;
    }

    return `${
      mainObject.charAt(0).toUpperCase() + mainObject.slice(1)
    } Issue in ${category}`;
  }

  private generateDescription(category: string, severity: string): string {
    return `A ${severity} priority civic issue detected in the ${category} category. The image shows conditions that require attention from relevant authorities.`;
  }

  private async extractLocationFromImage(
    file: File
  ): Promise<{ lat: number; lng: number } | undefined> {
    try {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Here you would typically use EXIF.js to extract GPS coordinates
          // For now, return undefined or default coordinates
          resolve(undefined);
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error("Error extracting location from image:", error);
      return undefined;
    }
  }

  private getMockAnalysis(): ImageAnalysisResult {
    return {
      title: "Road Pothole Damage",
      description:
        "Large pothole observed on the road surface, approximately 2 feet in diameter and 6 inches deep. The pothole appears to be causing traffic slowdown and poses risk to vehicles.",
      category: "Roads and Transportation",
      severity: "high",
      location: {
        lat: 19.076, // Mumbai coordinates for example
        lng: 72.8777,
      },
    };
  }
}

export const imageAnalysisService = ImageAnalysisService.getInstance();
