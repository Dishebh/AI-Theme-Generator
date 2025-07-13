const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";

async function testServer() {
  console.log("🧪 Testing Theme Generator Server...\n");

  try {
    // Test 1: Health check
    console.log("1. Testing health check...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check passed:", healthResponse.data);
    console.log("");

    // Test 2: Generate theme from colors
    console.log("2. Testing theme generation from colors...");
    const colorResponse = await axios.post(`${BASE_URL}/generate-theme`, {
      primary_color: "#1a365d",
      secondary_color: "#3182ce",
    });
    console.log("✅ Color-based theme generation passed");
    console.log(`   Generated ${colorResponse.data.themes.length} themes`);
    console.log(
      "   Sample theme:",
      JSON.stringify(colorResponse.data.themes[0], null, 2)
    );
    console.log("");

    // Test 3: Generate theme from image URL
    console.log("3. Testing theme generation from image URL...");
    const imageResponse = await axios.post(`${BASE_URL}/generate-theme`, {
      image_url:
        "https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg",
    });
    console.log("✅ Image-based theme generation passed");
    console.log(`   Generated ${imageResponse.data.themes.length} themes`);
    console.log("");

    // Test 3.5: Generate theme from uploaded image (if test image exists)
    console.log("3.5. Testing theme generation from uploaded image...");
    const testImagePath = path.join(__dirname, "test-image.jpg");
    if (fs.existsSync(testImagePath)) {
      const formData = new FormData();
      formData.append("image", fs.createReadStream(testImagePath));

      const uploadResponse = await axios.post(
        `${BASE_URL}/generate-theme`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );
      console.log("✅ Uploaded image theme generation passed");
      console.log(`   Generated ${uploadResponse.data.themes.length} themes`);
      console.log(
        `   Uploaded image URL: ${uploadResponse.data.input.uploaded_image}`
      );
    } else {
      console.log("⚠️  Skipping uploaded image test (no test-image.jpg found)");
      console.log(
        "   Create a test-image.jpg file in the project root to test image uploads"
      );
    }
    console.log("");

    // Test 4: Test error handling (invalid hex color)
    console.log("4. Testing error handling (invalid hex color)...");
    try {
      await axios.post(`${BASE_URL}/generate-theme`, {
        primary_color: "#invalid",
        secondary_color: "#abcdef",
      });
      console.log("❌ Should have failed with invalid hex color");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log("✅ Error handling passed:", error.response.data.error);
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    }
    console.log("");

    // Test 5: Test error handling (missing input)
    console.log("5. Testing error handling (missing input)...");
    try {
      await axios.post(`${BASE_URL}/generate-theme`, {});
      console.log("❌ Should have failed with missing input");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log("✅ Error handling passed:", error.response.data.error);
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    }

    console.log("\n🎉 All tests completed!");
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log(
        "❌ Server is not running. Please start the server with: npm start"
      );
    } else {
      console.log("❌ Test failed:", error.message);
      if (error.response) {
        console.log("   Response:", error.response.data);
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testServer();
}

module.exports = { testServer };
