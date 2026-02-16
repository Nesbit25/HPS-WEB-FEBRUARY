import React from 'react';

export function HeroImagePreview() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Desktop Hero Image Preview</h1>
          <p className="text-gray-600 mb-6">This is how your image will appear on desktop with the current settings</p>
          
          {/* Desktop Preview */}
          <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-2xl border-4 border-gray-300">
            {/* Hero Image */}
            <img
              src="figma:asset/0218e27594568d6d88e8a1a81fef94b5f944513c.png"
              alt="Dr. Hanemann Desktop Hero"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center center' }}
            />
            
            {/* Dark gradient overlay - exactly as in production */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center px-6">
              <div className="max-w-3xl">
                <h2 className="text-secondary text-sm uppercase tracking-[0.3em] mb-4 font-bold">
                  Double Board Certified Plastic Surgeon
                </h2>
                <h1 className="text-5xl lg:text-7xl font-serif text-white mb-6 leading-tight">
                  Revealing Beauty
                </h1>
                <p className="text-gray-200 text-lg lg:text-xl mb-8 font-light max-w-2xl leading-relaxed">
                  Recognizing that each patient's goal is unique, Dr. Hanemann offers creative solutions for his patients, utilizing the latest technology and procedures to achieve desired results
                </p>
                <button className="inline-block bg-secondary text-white px-10 py-4 rounded-full text-base uppercase tracking-widest hover:bg-white hover:text-primary transition-all duration-300">
                  Schedule Consultation
                </button>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3">Current Settings:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><span className="font-semibold">Object Position:</span> center center (horizontally and vertically centered)</li>
              <li><span className="font-semibold">Gradient Overlay:</span> Dark gradient from left (70% opacity) to right (transparent)</li>
              <li><span className="font-semibold">Aspect Ratio:</span> 16:9 landscape recommended (1920x1080px)</li>
              <li><span className="font-semibold">Display:</span> Full viewport height with object-cover (maintains aspect ratio)</li>
            </ul>
          </div>

          {/* Image Analysis */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-bold text-blue-900 mb-2">✅ Image Analysis:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• <strong>Professional portrait</strong> - Perfect for medical practice</li>
              <li>• <strong>Subject positioned center-right</strong> - Allows text on left side ✅</li>
              <li>• <strong>Warm office background</strong> - Professional and inviting</li>
              <li>• <strong>Good lighting</strong> - Subject is well-lit and clearly visible</li>
              <li>• <strong>Gradient overlay works well</strong> - Text remains readable over darker left side</li>
            </ul>
          </div>

          {/* Recommendations */}
          <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
            <h3 className="font-bold text-amber-900 mb-2">💡 Positioning Recommendation:</h3>
            <p className="text-sm text-amber-800 mb-3">
              The subject (Dr. Hanemann) is slightly right of center, which works PERFECTLY with the text overlay on the left. 
              Current setting <code className="bg-amber-100 px-2 py-1 rounded">center center</code> is optimal.
            </p>
            <p className="text-sm text-amber-800">
              <strong>Alternative positioning options if needed:</strong>
            </p>
            <ul className="text-sm text-amber-800 mt-2 space-y-1">
              <li>• <code className="bg-amber-100 px-2 py-1 rounded">40% center</code> - Shift subject slightly more right</li>
              <li>• <code className="bg-amber-100 px-2 py-1 rounded">60% center</code> - Shift subject slightly more left</li>
              <li>• Current: <code className="bg-green-100 px-2 py-1 rounded">center center</code> ✅ Perfect balance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
