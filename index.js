const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { SYSTEM_PROMPT } = require("./constants");

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Theme Generator Server is running" });
});

// Theme generation endpoint - supports both JSON and multipart form data
app.post("/generate-theme", upload.single("image"), async (req, res) => {
  try {
    let image_url = req.body.image_url;
    let primary_color = req.body.primary_color;
    let secondary_color = req.body.secondary_color;
    let uploadedImagePath = null;

    // Check if an image was uploaded
    if (req.file) {
      uploadedImagePath = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
      image_url = uploadedImagePath; // Use uploaded image as the image_url
    }

    // Validate input
    if (!image_url && (!primary_color || !secondary_color)) {
      return res.status(400).json({
        error:
          "Please provide either an uploaded image, image_url, or both primary_color and secondary_color",
      });
    }

    // Validate hex colors if provided
    if (primary_color && !isValidHexColor(primary_color)) {
      return res.status(400).json({
        error: "primary_color must be a valid hex color (e.g., #123456)",
      });
    }

    if (secondary_color && !isValidHexColor(secondary_color)) {
      return res.status(400).json({
        error: "secondary_color must be a valid hex color (e.g., #abcdef)",
      });
    }

    // Construct prompts based on input
    const { systemPrompt, userPrompt } = constructPrompts(
      image_url,
      primary_color,
      secondary_color,
      uploadedImagePath
    );

    // Call Azure OpenAI API
    const themes = await callAzureOpenAI(systemPrompt, userPrompt);

    res.json({
      success: true,
      themes: themes,
      input: {
        image_url: image_url || null,
        primary_color: primary_color || null,
        secondary_color: secondary_color || null,
        uploaded_image: uploadedImagePath || null,
      },
    });
  } catch (error) {
    console.error("Error generating theme:", error);
    res.status(500).json({
      error: "Failed to generate theme",
      message: error.message,
    });
  }
});

// Helper function to validate hex colors
function isValidHexColor(color) {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

// Helper function to construct prompts
function constructPrompts(
  imageUrl,
  primaryColor,
  secondaryColor,
  uploadedImagePath
) {
  const systemPrompt = SYSTEM_PROMPT;

  let userPrompt;

  if (imageUrl) {
    if (uploadedImagePath) {
      // User uploaded an image - emphasize using the image in themes
      userPrompt = `Generate 4-5 event platform themes based on this uploaded image: ${imageUrl}

IMPORTANT: Since this is a user-uploaded image, you can and should use this exact image (or parts of it) in the theme configurations. The uploaded image can be used as:
- event_background
- splash_page_hero  
- stage_background
- virtual_backgrounds

Analyze the image's color palette, mood, and style to create cohesive themes. Each theme should capture different aspects or variations inspired by the image, and at least one theme should directly incorporate the uploaded image as a background element.`;
    } else {
      // External image URL
      userPrompt = `Generate 4-5 event platform themes based on this image: ${imageUrl}

Analyze the image's color palette, mood, and style to create cohesive themes. Each theme should capture different aspects or variations inspired by the image.`;
    }
  } else {
    userPrompt = `Generate 4-5 event platform themes using these colors as inspiration:
Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}

Create themes that complement and expand upon these colors, ensuring good color harmony and contrast.`;
  }

  return { systemPrompt, userPrompt };
}

// Helper function to call Azure OpenAI API
async function callAzureOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      "Missing Azure OpenAI configuration. Please check your environment variables."
    );
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-04-01-preview`;

  const requestBody = {
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 3000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      timeout: 30000, // 30 second timeout
    });

    const content = response.data.choices[0].message.content;

    // Try to parse the JSON response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.log("Raw response:", content);
      throw new Error("Invalid JSON response from Azure OpenAI");
    }
  } catch (error) {
    if (error.response) {
      console.error("Azure OpenAI API Error:", error.response.data);
      throw new Error(
        `Azure OpenAI API Error: ${
          error.response.data.error?.message || "Unknown error"
        }`
      );
    } else if (error.request) {
      throw new Error("No response received from Azure OpenAI API");
    } else {
      throw error;
    }
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Theme Generator Server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🎨 Generate themes: POST http://localhost:${PORT}/generate-theme`
  );
});

module.exports = app;
