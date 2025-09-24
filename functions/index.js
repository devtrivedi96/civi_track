const functions = require("firebase-functions");
const vision = require("@google-cloud/vision");
const cors = require("cors")({ origin: true });

exports.analyzeImage = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // Check if method is POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { imageUrl } = req.body;

    // Check if imageUrl is provided
    if (!imageUrl) {
      return res.status(400).json({ error: "No image URL provided" });
    }

    try {
      const client = new vision.ImageAnnotatorClient();
      const [result] = await client.annotateImage({
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: "LABEL_DETECTION", maxResults: 10 },
          { type: "TEXT_DETECTION" },
          { type: "OBJECT_LOCALIZATION", maxResults: 10 },
          { type: "IMAGE_PROPERTIES" },
        ],
      });

      // Process and format the response
      const formattedResponse = {
        description: {
          captions: [
            {
              text: result.labelAnnotations
                .slice(0, 3)
                .map((label) => label.description)
                .join(", "),
            },
          ],
        },
        tags: result.labelAnnotations.map((label) => ({
          name: label.description,
          confidence: label.score,
        })),
        objects: result.localizedObjectAnnotations.map((obj) => ({
          object: obj.name,
          confidence: obj.score,
        })),
      };

      res.json(formattedResponse);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });
});
