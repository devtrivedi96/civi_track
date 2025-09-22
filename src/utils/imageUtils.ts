import Resizer from "react-image-file-resizer";

// Convert and resize image to base64
export const convertImageToBase64 = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 70
): Promise<string> => {
  return new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      maxWidth,
      maxHeight,
      "JPEG",
      quality,
      0,
      (uri) => {
        resolve(uri as string);
      },
      "base64"
    );
  });
};

// Create a smaller thumbnail version
export const createThumbnail = (file: File): Promise<string> => {
  return convertImageToBase64(file, 150, 150, 60);
};

// Process single image for storage
export const processImage = async (
  file: File
): Promise<{
  fullImage: string;
  thumbnail: string;
  imageId: string;
}> => {
  // Generate a unique ID for the image
  const imageId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

  // Process both full image and thumbnail in parallel
  const [fullImage, thumbnail] = await Promise.all([
    convertImageToBase64(file, 800, 600, 70),
    createThumbnail(file),
  ]);

  return {
    fullImage,
    thumbnail,
    imageId,
  };
};

// Process multiple images
export const processMultipleImages = async (
  files: File[]
): Promise<
  Array<{
    fullImage: string;
    thumbnail: string;
    imageId: string;
  }>
> => {
  const processPromises = files.map((file) => processImage(file));
  return Promise.all(processPromises);
};
