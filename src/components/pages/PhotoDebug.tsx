import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAuth } from '../../contexts/AuthContext';

export function PhotoDebug() {
  const { accessToken, isAdmin } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all photos
        const photosRes = await fetch(`${serverUrl}/photos`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);

        // Fetch all content keys related to images
        const imageKeys = [
          'home_hero_image_1',
          'home_hero_image_2', 
          'home_hero_image_3',
          'home_hero_image_4',
          'home_hero_image_5'
        ];

        const contentData = [];
        for (const key of imageKeys) {
          const res = await fetch(`${serverUrl}/content/${key}`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          });
          const data = await res.json();
          if (data.content) {
            contentData.push({ key, ...data.content });
          }
        }
        setContent(contentData);

      } catch (error) {
        console.error('Error fetching debug data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  if (!isAdmin) {
    return <div className="container mx-auto px-6 py-20 text-center">Unauthorized</div>;
  }

  if (loading) {
    return <div className="container mx-auto px-6 py-20 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-20">
      <h1 className="mb-8">Photo Debug Page</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Photos */}
        <div>
          <h2 className="mb-4">All Photos in Gallery</h2>
          <div className="space-y-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="p-4">
                <div className="flex gap-4">
                  <img src={photo.publicUrl} alt={photo.title} className="w-24 h-24 object-cover rounded-lg" />
                  <div className="flex-1 text-sm">
                    <p><strong>ID:</strong> {photo.id}</p>
                    <p><strong>Title:</strong> {photo.title}</p>
                    <p><strong>Status:</strong> <span className={photo.status === 'published' ? 'text-green-600' : 'text-orange-600'}>{photo.status}</span></p>
                    <p><strong>Display Location:</strong> <span className={photo.displayLocation === 'hidden' ? 'text-red-600' : ''}>{photo.displayLocation}</span></p>
                    <p><strong>Category:</strong> {photo.category}</p>
                    <p><strong>Featured:</strong> {photo.featured ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Content Keys */}
        <div>
          <h2 className="mb-4">Image Content Keys</h2>
          <div className="space-y-4">
            {content.map((item) => (
              <Card key={item.key} className="p-4">
                <p className="text-sm"><strong>Content Key:</strong> {item.key}</p>
                <p className="text-sm"><strong>Photo ID:</strong> {item.value}</p>
                {item.value && photos.find(p => p.id === item.value) && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p>Photo Status: {photos.find(p => p.id === item.value)?.status}</p>
                    <p>Photo Display Location: {photos.find(p => p.id === item.value)?.displayLocation}</p>
                    <p className="mt-1 font-bold">
                      Will Display: {
                        photos.find(p => p.id === item.value)?.status === 'published' && 
                        photos.find(p => p.id === item.value)?.displayLocation !== 'hidden' 
                          ? <span className="text-green-600">YES</span>
                          : <span className="text-red-600">NO (will use default)</span>
                      }
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
