import React, { useEffect } from 'react';
import { Button } from '../ui/button';
import { Cloud } from 'lucide-react';

/**
 * Google Drive Picker Component
 * 
 * SETUP INSTRUCTIONS:
 * To enable Google Drive integration, you need to set up Google Cloud credentials:
 * 
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project (or select existing)
 * 3. Enable the Google Picker API and Google Drive API:
 *    - Go to "APIs & Services" > "Library"
 *    - Search for "Google Picker API" and enable it
 *    - Search for "Google Drive API" and enable it
 * 
 * 4. Create OAuth 2.0 credentials:
 *    - Go to "APIs & Services" > "Credentials"
 *    - Click "Create Credentials" > "OAuth client ID"
 *    - Application type: "Web application"
 *    - Add authorized JavaScript origins:
 *      - http://localhost:3000 (for development)
 *      - Your production domain (e.g., https://yourdomain.com)
 *    - Copy the Client ID
 * 
 * 5. Create an API Key:
 *    - Click "Create Credentials" > "API key"
 *    - Restrict the key (recommended):
 *      - Application restrictions: HTTP referrers
 *      - API restrictions: Google Picker API, Google Drive API
 *    - Copy the API Key
 * 
 * 6. Replace the placeholder values in this file:
 *    - Line ~54: Replace 'YOUR_GOOGLE_CLIENT_ID_HERE' with your OAuth Client ID
 *    - Line ~81: Replace 'YOUR_GOOGLE_API_KEY_HERE' with your API Key
 * 
 * IMPORTANT: For production use, store these in environment variables instead of hardcoding.
 */

interface GoogleDrivePickerProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function GoogleDrivePicker({ onFileSelected, disabled }: GoogleDrivePickerProps) {
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);
  const [isApiLoaded, setIsApiLoaded] = React.useState(false);

  useEffect(() => {
    // Load Google API script
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }

    // Load Google Identity Services script
    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (isScriptLoaded && !isApiLoaded) {
      window.gapi.load('picker', () => {
        setIsApiLoaded(true);
      });
    }
  }, [isScriptLoaded, isApiLoaded]);

  const handlePickFromDrive = async () => {
    if (!isApiLoaded) {
      alert('Google Drive is still loading. Please try again in a moment.');
      return;
    }

    try {
      // Create OAuth token
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: 'YOUR_GOOGLE_CLIENT_ID_HERE', // This is a placeholder - user will need their own
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('OAuth error:', tokenResponse);
            alert('Failed to authenticate with Google Drive. Please try again.');
            return;
          }

          // Create and show picker
          const picker = new window.google.picker.PickerBuilder()
            .addView(
              new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
                .setMode(window.google.picker.DocsViewMode.LIST)
            )
            .addView(
              new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
                .setMode(window.google.picker.DocsViewMode.GRID)
            )
            .setOAuthToken(tokenResponse.access_token)
            .setDeveloperKey('YOUR_GOOGLE_API_KEY_HERE') // Placeholder - user needs their own
            .setCallback(async (data: any) => {
              if (data.action === window.google.picker.Action.PICKED) {
                const fileId = data.docs[0].id;
                const fileName = data.docs[0].name;
                const mimeType = data.docs[0].mimeType;

                // Download the file
                try {
                  const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                    {
                      headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`
                      }
                    }
                  );

                  if (!response.ok) {
                    throw new Error('Failed to download file from Google Drive');
                  }

                  const blob = await response.blob();
                  const file = new File([blob], fileName, { type: mimeType });

                  onFileSelected(file);
                } catch (error) {
                  console.error('Error downloading file:', error);
                  alert('Failed to download file from Google Drive. Please try uploading from your computer instead.');
                }
              }
            })
            .build();

          picker.setVisible(true);
        }
      });

      client.requestAccessToken();
    } catch (error) {
      console.error('Google Drive Picker error:', error);
      alert('Failed to open Google Drive picker. Please try uploading from your computer instead.');
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handlePickFromDrive}
      disabled={disabled || !isApiLoaded}
    >
      <Cloud className="w-4 h-4 mr-2" />
      {isApiLoaded ? 'Choose from Google Drive' : 'Loading Google Drive...'}
    </Button>
  );
}

// TypeScript declarations for Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}