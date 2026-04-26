const REVEAL_STATUSES = new Set(['interview', 'offer']);

const canRevealCandidatePII = (applicationStatus) => REVEAL_STATUSES.has(applicationStatus);

const sanitizeCandidateForRecruiter = ({ candidate, canReveal = false }) => {
  const profile = candidate.profile || {};

  if (canReveal) {
    return {
      _id: candidate._id,
      role: candidate.role,
      email: candidate.email,
      profile: {
        fullName: profile.fullName || '',
        contacts: profile.contacts || '',
        skills: profile.skills || [],
        experienceYears: profile.experienceYears || 0,
        expectedSalary: profile.expectedSalary || 0,
        hidden: false
      }
    };
  }

  // Critical anonymity filter: strip PII until status becomes interview/offer.
  return {
    _id: candidate._id,
    role: candidate.role,
    profile: {
      fullName: null,
      contacts: null,
      skills: profile.skills || [],
      experienceYears: profile.experienceYears || 0,
      expectedSalary: profile.expectedSalary || 0,
      hidden: true
    }
  };
};

module.exports = {
  canRevealCandidatePII,
  sanitizeCandidateForRecruiter
};
