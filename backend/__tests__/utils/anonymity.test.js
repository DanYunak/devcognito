const {
  canRevealCandidatePII,
  sanitizeCandidateForRecruiter,
} = require('../../src/utils/anonymity');

const makeCandidate = (overrides = {}) => ({
  _id: 'user_abc123',
  role: 'candidate',
  email: 'jane@example.com',
  profile: {
    fullName: 'Jane Doe',
    contacts: '+1-555-0100',
    skills: ['React', 'Node.js'],
    experienceYears: 4,
    expectedSalary: 85_000,
    hidden: true,
    ...overrides.profile,
  },
  ...overrides,
});

describe('canRevealCandidatePII', () => {
  it.each(['interview', 'offer'])(
    'returns true for status "%s"',
    (status) => {
      expect(canRevealCandidatePII(status)).toBe(true);
    }
  );

  it.each(['new', 'rejected', '', undefined, null, 'unknown'])(
    'returns false for status "%s"',
    (status) => {
      expect(canRevealCandidatePII(status)).toBe(false);
    }
  );
});

describe('sanitizeCandidateForRecruiter', () => {
  describe('when canReveal is false (status: new | rejected)', () => {
    let result;

    beforeEach(() => {
      result = sanitizeCandidateForRecruiter({
        candidate: makeCandidate(),
        canReveal: false,
      });
    });

    it('sets fullName to null', () => {
      expect(result.profile.fullName).toBeNull();
    });

    it('sets contacts to null', () => {
      expect(result.profile.contacts).toBeNull();
    });

    it('sets hidden to true', () => {
      expect(result.profile.hidden).toBe(true);
    });

    it('does NOT expose the email', () => {
      expect(result).not.toHaveProperty('email');
    });

    it('still exposes non-PII profile fields (skills, experience, salary)', () => {
      expect(result.profile.skills).toEqual(['React', 'Node.js']);
      expect(result.profile.experienceYears).toBe(4);
      expect(result.profile.expectedSalary).toBe(85_000);
    });

    it('still exposes _id and role', () => {
      expect(result._id).toBe('user_abc123');
      expect(result.role).toBe('candidate');
    });
  });

  describe('when canReveal is true (status: interview | offer)', () => {
    let result;

    beforeEach(() => {
      result = sanitizeCandidateForRecruiter({
        candidate: makeCandidate(),
        canReveal: true,
      });
    });

    it('reveals fullName', () => {
      expect(result.profile.fullName).toBe('Jane Doe');
    });

    it('reveals contacts', () => {
      expect(result.profile.contacts).toBe('+1-555-0100');
    });

    it('sets hidden to false', () => {
      expect(result.profile.hidden).toBe(false);
    });

    it('exposes the email', () => {
      expect(result.email).toBe('jane@example.com');
    });

    it('exposes all profile fields', () => {
      expect(result.profile.skills).toEqual(['React', 'Node.js']);
      expect(result.profile.experienceYears).toBe(4);
      expect(result.profile.expectedSalary).toBe(85_000);
    });

    it('exposes _id and role', () => {
      expect(result._id).toBe('user_abc123');
      expect(result.role).toBe('candidate');
    });
  });

  describe('defaults and edge cases', () => {
    it('defaults canReveal to false when the flag is omitted', () => {
      const result = sanitizeCandidateForRecruiter({
        candidate: makeCandidate(),
        // canReveal intentionally omitted
      });
      expect(result.profile.fullName).toBeNull();
      expect(result.profile.hidden).toBe(true);
    });

    it('handles a candidate with an empty profile object gracefully', () => {
      const sparse = { _id: 'x', role: 'candidate', profile: {} };

      const hidden = sanitizeCandidateForRecruiter({
        candidate: sparse,
        canReveal: false,
      });
      expect(hidden.profile.skills).toEqual([]);
      expect(hidden.profile.experienceYears).toBe(0);
      expect(hidden.profile.expectedSalary).toBe(0);

      const revealed = sanitizeCandidateForRecruiter({
        candidate: sparse,
        canReveal: true,
      });
      expect(revealed.profile.fullName).toBe('');
      expect(revealed.profile.contacts).toBe('');
    });
  });
});