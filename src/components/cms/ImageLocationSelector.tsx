import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';

interface ImageLocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Comprehensive list of all image locations across the website
// Organized by page -> section
const IMAGE_LOCATIONS = {
  home: {
    label: 'Home Page',
    sections: {
      'home_hero_image_1': 'Hero Carousel - Slide 1',
      'home_hero_image_2': 'Hero Carousel - Slide 2',
      'home_hero_image_3': 'Hero Carousel - Slide 3',
      'home_hero_image_4': 'Hero Carousel - Slide 4',
      'home_hero_image_5': 'Hero Carousel - Slide 5',
    }
  },
  about: {
    label: 'About Page',
    sections: {
      'about_hero_image': 'Hero Section',
      'about_doctor_image': 'Doctor Profile Image',
      'about_team_image_1': 'Team Member 1',
      'about_team_image_2': 'Team Member 2',
      'about_team_image_3': 'Team Member 3',
      'about_facility_image_1': 'Facility Photo 1',
      'about_facility_image_2': 'Facility Photo 2',
      'about_facility_image_3': 'Facility Photo 3',
    }
  },
  procedures: {
    label: 'Procedure Pages',
    sections: {
      'procedure_nose_hero': 'Nose - Hero Section',
      'procedure_nose_detail_1': 'Nose - Detail Image 1',
      'procedure_nose_detail_2': 'Nose - Detail Image 2',
      'procedure_face_hero': 'Face - Hero Section',
      'procedure_face_detail_1': 'Face - Detail Image 1',
      'procedure_face_detail_2': 'Face - Detail Image 2',
      'procedure_breast_hero': 'Breast - Hero Section',
      'procedure_breast_detail_1': 'Breast - Detail Image 1',
      'procedure_breast_detail_2': 'Breast - Detail Image 2',
      'procedure_body_hero': 'Body - Hero Section',
      'procedure_body_detail_1': 'Body - Detail Image 1',
      'procedure_body_detail_2': 'Body - Detail Image 2',
    }
  },
  gallery: {
    label: 'Gallery Page',
    sections: {
      'gallery_hero_image': 'Hero Section',
      'gallery_featured_1': 'Featured Gallery Item 1',
      'gallery_featured_2': 'Featured Gallery Item 2',
      'gallery_featured_3': 'Featured Gallery Item 3',
    }
  },
  resources: {
    label: 'Resources Page',
    sections: {
      'resources_hero_image': 'Hero Section',
      'resources_video_thumb_1': 'Video Thumbnail 1',
      'resources_video_thumb_2': 'Video Thumbnail 2',
      'resources_video_thumb_3': 'Video Thumbnail 3',
    }
  },
  contact: {
    label: 'Contact Page',
    sections: {
      'contact_hero_image': 'Hero Section',
      'contact_office_image': 'Office Photo',
    }
  },
  global: {
    label: 'Global Elements',
    sections: {
      'header_logo': 'Header Logo',
      'footer_logo': 'Footer Logo',
      'hidden': 'Hidden (Don\'t Display)',
    }
  }
};

export function ImageLocationSelector({ value, onChange }: ImageLocationSelectorProps) {
  return (
    <div>
      <Label htmlFor="display-location">Display Location</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl" id="display-location">
          <SelectValue placeholder="Select where to display this image" />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {Object.entries(IMAGE_LOCATIONS).map(([pageKey, page]) => (
            <SelectGroup key={pageKey}>
              <SelectLabel className="text-secondary font-semibold">{page.label}</SelectLabel>
              {Object.entries(page.sections).map(([locationKey, locationLabel]) => (
                <SelectItem key={locationKey} value={locationKey}>
                  {locationLabel}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        Choose where this photo appears on the website
      </p>
    </div>
  );
}

// Helper function to get human-readable location label
export function getLocationLabel(locationKey: string): string {
  for (const page of Object.values(IMAGE_LOCATIONS)) {
    if (page.sections[locationKey]) {
      return `${page.label} - ${page.sections[locationKey]}`;
    }
  }
  return locationKey;
}
