# Theme Generator Server

A Node.js Express server that generates event platform themes using Azure OpenAI. The server accepts either an image URL or color values and returns 4-5 complete theme configurations.

## Features

- 🎨 Generate themes from image URLs, uploaded images, or color combinations
- 🤖 Powered by Azure OpenAI GPT-4
- 🌐 CORS enabled for cross-origin requests
- ✅ Input validation and error handling
- 📝 Comprehensive API documentation
- 📁 File upload support with automatic image serving

## Prerequisites

- Node.js (v14 or higher)
- Azure OpenAI service with GPT-4 deployment
- Azure OpenAI API key and endpoint

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Azure OpenAI credentials:
   ```env
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   PORT=3000
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Generate Theme
```
POST /generate-theme
```

**Request Body Options:**

**Option 1 - Image URL:**
```json
{
  "image_url": "https://example.com/image.jpg"
}
```

**Option 2 - Color Values:**
```json
{
  "primary_color": "#123456",
  "secondary_color": "#abcdef"
}
```

**Option 3 - Uploaded Image (Multipart Form Data):**
```
Content-Type: multipart/form-data

Form field: "image" (file upload)
```

**Response:**
```json
{
  "success": true,
  "themes": [
    {
      "theme_primary_color": "#1a365d",
      "theme_secondary_color": "#3182ce",
      "event_background": "https://images.pexels.com/photos/...",
      "splash_page_hero": "https://images.unsplash.com/...",
      "theme_font_src": "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&display=swap",
      "theme_font_family": "Inter, sans-serif",
      "theme_accent_color": "#f56565",
      "theme_text_color": "#2d3748",
      "theme_button_style": "Rounded corners with subtle shadow",
      "theme_card_style": "Clean white cards with border radius"
    }
  ],
  "input": {
    "image_url": "https://example.com/image.jpg",
    "primary_color": null,
    "secondary_color": null
  }
}
```

## Usage Examples

### Using cURL

**Generate theme from image:**
```bash
curl -X POST http://localhost:3000/generate-theme \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg"
  }'
```

**Generate theme from uploaded image:**
```bash
curl -X POST http://localhost:3000/generate-theme \
  -F "image=@/path/to/your/image.jpg"
```

**Generate theme from colors:**
```bash
curl -X POST http://localhost:3000/generate-theme \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#1a365d",
    "secondary_color": "#3182ce"
  }'
```

### Using JavaScript/Fetch

```javascript
// Generate theme from image
const response = await fetch('http://localhost:3000/generate-theme', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg'
  })
});

const result = await response.json();
console.log(result.themes);
```

### Using JavaScript with File Upload

```javascript
// Generate theme from uploaded image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/generate-theme', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.themes);
```

## Theme Properties

Each generated theme includes:

- **theme_primary_color**: Main brand color (hex)
- **theme_secondary_color**: Supporting color (hex)
- **event_background**: Background image URL (Pexels/Pixabay/Unsplash or uploaded image)
- **splash_page_hero**: Hero image URL (can include uploaded image)
- **theme_font_src**: Google Fonts CSS URL
- **theme_font_family**: Font family name
- **theme_accent_color**: Accent color (hex)
- **theme_text_color**: Text color (hex)
- **theme_button_style**: Button styling description
- **theme_card_style**: Card styling description

## Uploaded Images

When you upload an image, the server:
- Stores it in the `uploads/` directory
- Makes it accessible via `/uploads/filename`
- Uses the uploaded image URL in theme generation
- Can incorporate the uploaded image directly into theme backgrounds

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Invalid input (missing parameters, invalid hex colors)
- `500`: Server error or Azure OpenAI API error

Error response format:
```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_API_KEY` | Your Azure OpenAI API key | Yes |
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint URL | Yes |
| `AZURE_OPENAI_DEPLOYMENT` | Your GPT-4 deployment name | Yes |
| `PORT` | Server port (default: 3000) | No |

### Azure OpenAI Settings

- **Model**: GPT-4
- **Temperature**: 0.7
- **Max Tokens**: 3000
- **API Version**: 2023-05-15

## Development

### Project Structure
```
theme-generator/
├── index.js          # Main server file
├── package.json      # Dependencies and scripts
├── env.example       # Environment variables template
└── README.md         # This file
```

### Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start development server with nodemon

## Troubleshooting

1. **"Missing Azure OpenAI configuration"**: Check your `.env` file and ensure all required variables are set.

2. **"Invalid JSON response"**: The Azure OpenAI response couldn't be parsed. Check the server logs for the raw response.

3. **"Azure OpenAI API Error"**: Verify your API key, endpoint, and deployment name are correct.

4. **CORS issues**: The server includes CORS middleware, but ensure your client is making requests from an allowed origin.

## License

MIT License 