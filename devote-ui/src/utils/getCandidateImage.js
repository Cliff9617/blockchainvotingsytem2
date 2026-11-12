/**
 * getCandidateImage - Unified helper to retrieve candidate image source
 *
 * Supports both old and new candidate image field names:
 * 1. candidatePhoto (new Base64 field from Firestore)
 * 2. imageData     (alternate Base64 field)
 * 3. imageUrl      (legacy URL or Base64 field)
 *
 * If none exist, returns a placeholder image URL.
 *
 * @param {Object} candidate - Candidate object
 * @returns {string} - Image source URL or placeholder
 */
export const DEFAULT_CANDIDATE_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e2e8f0"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="%2394a3b8" font-family="Arial">?</text></svg>';

export const getCandidateImage = (candidate) => {
  if (!candidate) return DEFAULT_CANDIDATE_PLACEHOLDER;

  return (
    candidate.candidatePhoto ||
    candidate.imageData ||
    candidate.imageUrl ||
    DEFAULT_CANDIDATE_PLACEHOLDER
  );
};

export default getCandidateImage;