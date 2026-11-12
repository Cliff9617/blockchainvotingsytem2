import React, { useState, useEffect } from 'react';
import { POSITIONS, POSITION_NAMES, getPositionIndex } from '../utils/electionFilters';
import { counties, constituencies, wards } from '../data/kenyaLocations';
import { validatePhotoFile, uploadCandidatePhoto } from '../services/storageService';

// Position options for dropdown
const POSITION_OPTIONS = [
  { value: 'president', label: 'President (National)', index: 0 },
  { value: 'governor', label: 'Governor (County)', index: 1 },
  { value: 'senator', label: 'Senator (County)', index: 2 },
  { value: 'woman representative', label: 'Woman Representative (County)', index: 3 },
  { value: 'member of parliament', label: 'Member of Parliament (Constituency)', index: 4 },
  { value: 'mca', label: 'MCA (Ward)', index: 5 },
];

// Get fields to show based on position
const getRequiredFields = (position) => {
  switch (position) {
    case 'president':
      return { showCounty: false, showConstituency: false, showWard: false, countyRequired: false, constituencyRequired: false, wardRequired: false };
    case 'governor':
    case 'senator':
    case 'woman representative':
      return { showCounty: true, showConstituency: false, showWard: false, countyRequired: true, constituencyRequired: false, wardRequired: false };
    case 'member of parliament':
      return { showCounty: true, showConstituency: true, showWard: false, countyRequired: true, constituencyRequired: true, wardRequired: false };
    case 'mca':
      return { showCounty: true, showConstituency: true, showWard: true, countyRequired: true, constituencyRequired: true, wardRequired: true };
    default:
      return { showCounty: false, showConstituency: false, showWard: false, countyRequired: false, constituencyRequired: false, wardRequired: false };
  }
};

const AddCandidate = ({ contract, isLoading, onAddCandidate }) => {
  const [formData, setFormData] = useState({
    name: '',
    party: '',
    position: 'president',
    county: '',
    constituency: '',
    ward: '',
    candidateCode: '',
    imageUrl: '',
  });
  const [status, setStatus] = useState('');
  const [availableConstituencies, setAvailableConstituencies] = useState([]);
  const [availableWards, setAvailableWards] = useState([]);
  
  // Photo state
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const fields = getRequiredFields(formData.position);

  // Update constituencies when county changes
  useEffect(() => {
    if (formData.county && counties[formData.county]) {
      setAvailableConstituencies(counties[formData.county] || []);
    } else {
      setAvailableConstituencies([]);
    }
    setFormData(prev => ({ ...prev, constituency: '', ward: '' }));
    setAvailableWards([]);
  }, [formData.county]);

  // Update wards when constituency changes
  useEffect(() => {
    if (formData.constituency && constituencies[formData.constituency]) {
      setAvailableWards(constituencies[formData.constituency] || []);
    } else {
      setAvailableWards([]);
    }
    setFormData(prev => ({ ...prev, ward: '' }));
  }, [formData.constituency]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate the file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error);
      setSelectedPhoto(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
      return;
    }

    setPhotoError('');
    setSelectedPhoto(file);
    
    // Create preview
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    setPhotoError('');
    // Reset the file input
    const fileInput = document.getElementById('candidate-photo-upload');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setStatus("Please enter a candidate name");
      return false;
    }
    if (!formData.party.trim()) {
      setStatus("Please enter the candidate's party or 'Independent'");
      return false;
    }

    // Validate geographical fields based on position
    if (fields.countyRequired && !formData.county) {
      setStatus("Please select a county");
      return false;
    }
    if (fields.constituencyRequired && !formData.constituency) {
      setStatus("Please select a constituency");
      return false;
    }
    if (fields.wardRequired && !formData.ward) {
      setStatus("Please select a ward");
      return false;
    }

    return true;
  };

  const handleAddCandidate = async () => {
    if (!validateForm()) return;

    try {
      setStatus("Adding candidate to blockchain...");
      
      const positionIndex = getPositionIndex(formData.position);
      
      // Process photo if selected - uses Base64 conversion (no Firebase Storage)
      let photoUrl = formData.imageUrl || '';
      if (selectedPhoto) {
        setIsProcessingPhoto(true);
        setStatus("Processing Image...");
        
        const tempId = `temp_${Date.now()}`;
        photoUrl = await uploadCandidatePhoto(selectedPhoto, tempId);
        
        setIsProcessingPhoto(false);
      }
      
      setStatus("Creating Candidate...");
      
      const candidateData = {
        name: formData.name.trim(),
        party: formData.party.trim(),
        position: formData.position,
        positionIndex: positionIndex,
        county: formData.county || '',
        constituency: formData.constituency || '',
        ward: formData.ward || '',
        candidateCode: formData.candidateCode || '',
        imageUrl: photoUrl,
      };

      console.log('[AddCandidate] Adding candidate:', candidateData);
      
      await onAddCandidate(candidateData);
      setStatus("Candidate Added Successfully.");
      
      // Reset form
      setFormData({
        name: '',
        party: '',
        position: 'president',
        county: '',
        constituency: '',
        ward: '',
        candidateCode: '',
        imageUrl: '',
      });
      handleRemovePhoto();
    } catch (err) {
      console.error(err);
      setStatus("Failed to add candidate: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Candidate</h3>
      
      <div className="space-y-4">
        {/* Candidate Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Candidate Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter candidate name..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Party */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Party / Independent *
          </label>
          <input
            type="text"
            name="party"
            value={formData.party}
            onChange={handleInputChange}
            placeholder="e.g. UDA, ODM, Wiper, Independent..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position *
          </label>
          <select
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            disabled={isLoading}
          >
            {POSITION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* County */}
        {fields.showCounty && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              County {fields.countyRequired && '*'}
            </label>
            <select
              name="county"
              value={formData.county}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              disabled={isLoading}
            >
              <option value="">Select County</option>
              {Object.keys(counties).map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>
        )}

        {/* Constituency */}
        {fields.showConstituency && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Constituency {fields.constituencyRequired && '*'}
            </label>
            <select
              name="constituency"
              value={formData.constituency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              disabled={isLoading}
            >
              <option value="">Select Constituency</option>
              {availableConstituencies.map(constituency => (
                <option key={constituency} value={constituency}>{constituency}</option>
              ))}
            </select>
          </div>
        )}

        {/* Ward */}
        {fields.showWard && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ward {fields.wardRequired && '*'}
            </label>
            <select
              name="ward"
              value={formData.ward}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              disabled={isLoading}
            >
              <option value="">Select Ward</option>
              {availableWards.map(ward => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>
          </div>
        )}

        {/* Candidate Code (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Candidate Code (Optional)
          </label>
          <input
            type="text"
            name="candidateCode"
            value={formData.candidateCode}
            onChange={handleInputChange}
            placeholder="e.g. PRES-001, GOV-NBO-01..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Internal reference code for the candidate
          </p>
        </div>

        {/* Candidate Photograph Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Candidate Photograph
          </label>
          
          {!photoPreview ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="candidate-photo-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload Image</span>
                    <input
                      id="candidate-photo-upload"
                      name="candidate-photo"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                      disabled={isLoading || isProcessingPhoto}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  JPG, JPEG, PNG, or WEBP up to 5 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              {/* Photo Preview */}
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Candidate preview"
                  className="h-48 w-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  disabled={isLoading || isProcessingPhoto}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click the X to remove and select a different image
              </p>
            </div>
          )}

          {/* Processing indicator (replaces old upload progress bar) */}
          {isProcessingPhoto && (
            <div className="mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing Image...</span>
              </div>
            </div>
          )}

          {/* Photo Error */}
          {photoError && (
            <p className="mt-2 text-sm text-red-600">{photoError}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            onClick={handleAddCandidate}
            disabled={isLoading || isProcessingPhoto || !formData.name.trim()}
            className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring"
          >
            {isLoading || isProcessingPhoto ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isProcessingPhoto ? 'Processing Image...' : 'Processing...'}</span>
              </div>
            ) : (
              "Add Candidate"
            )}
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`p-3 rounded-lg ${
            status.includes("Successfully") || status.includes("success")
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            <p className="text-sm">{status}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Position & Area Requirements:</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• <strong>President:</strong> National position, no geographical area needed</li>
            <li>• <strong>Governor/Senator/Woman Rep:</strong> County-level position</li>
            <li>• <strong>MP:</strong> Constituency-level position</li>
            <li>• <strong>MCA:</strong> Ward-level position</li>
          </ul>
        </div>

        <div className="mt-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Note:</h4>
          <p className="text-sm text-purple-700">
            Candidates can only be added before the election starts. Once the election begins, 
            no new candidates can be added to ensure election integrity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddCandidate;