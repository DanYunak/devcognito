const { calculateMatchPercentage } = require('../../src/utils/match');

const makeCandidate = ({
  skills = [],
  experienceYears = 0,
  expectedSalary = 0,
} = {}) => ({
  profile: { skills, experienceYears, expectedSalary },
});

const makeVacancy = ({
  skills_required = [],
  experience_required = 0,
  salaryMin = 0,
  salaryMax = 0,
} = {}) => ({
  skills_required,
  experience_required,
  salary_range: { min: salaryMin, max: salaryMax },
});

describe('calculateMatchPercentage', () => {
  describe('100% match', () => {
    it('returns 100 when skills, experience and salary all match perfectly', () => {
      const candidate = makeCandidate({
        skills: ['React', 'Node.js', 'CSS'],
        experienceYears: 5,
        expectedSalary: 80_000,
      });
      const vacancy = makeVacancy({
        skills_required: ['React', 'Node.js', 'CSS'],
        experience_required: 5,
        salaryMin: 70_000,
        salaryMax: 90_000,
      });

      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(100);
    });

    it('is case-insensitive when matching skills', () => {
      const candidate = makeCandidate({
        skills: ['react', 'NODE.JS'],
        experienceYears: 3,
        expectedSalary: 60_000,
      });
      const vacancy = makeVacancy({
        skills_required: ['React', 'Node.js'],
        experience_required: 3,
        salaryMin: 50_000,
        salaryMax: 70_000,
      });

      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(100);
    });
  });

  describe('partial match', () => {
    it('scores 60 when only skills match (experience and salary miss)', () => {
      const candidate = makeCandidate({
        skills: ['React', 'Node.js'],
        experienceYears: 1,       // below required 3
        expectedSalary: 120_000,  // above salary max
      });
      const vacancy = makeVacancy({
        skills_required: ['React', 'Node.js'],
        experience_required: 3,
        salaryMin: 60_000,
        salaryMax: 90_000,
      });

      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(60);
    });

    it('scores 20 when only experience matches', () => {
      const candidate = makeCandidate({
        skills: [],               // no skills to match
        experienceYears: 5,       // meets requirement
        expectedSalary: 200_000,  // outside range
      });
      const vacancy = makeVacancy({
        skills_required: ['TypeScript', 'AWS'],
        experience_required: 5,
        salaryMin: 70_000,
        salaryMax: 90_000,
      });

      // skills: 0/2 × 60 = 0 | experience: 20 | salary: 0
      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(20);
    });

    it('scores 20 when only salary is within range', () => {
      const candidate = makeCandidate({
        skills: [],         // no skills
        experienceYears: 0, // below required
        expectedSalary: 75_000,
      });
      const vacancy = makeVacancy({
        skills_required: ['Python'],
        experience_required: 2,
        salaryMin: 70_000,
        salaryMax: 80_000,
      });

      // skills: 0 | experience: 0 | salary: 20
      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(20);
    });

    it('scores 80 when skills and experience match but salary misses', () => {
      const candidate = makeCandidate({
        skills: ['Go', 'Docker'],
        experienceYears: 4,
        expectedSalary: 150_000, // above max
      });
      const vacancy = makeVacancy({
        skills_required: ['Go', 'Docker'],
        experience_required: 4,
        salaryMin: 80_000,
        salaryMax: 100_000,
      });

      // skills: 60 | experience: 20 | salary: 0
      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(80);
    });

    it('gives partial skills score for a subset match', () => {
      const candidate = makeCandidate({
        skills: ['React'],        // 1 of 2 required skills
        experienceYears: 5,
        expectedSalary: 75_000,
      });
      const vacancy = makeVacancy({
        skills_required: ['React', 'TypeScript'],
        experience_required: 5,
        salaryMin: 70_000,
        salaryMax: 80_000,
      });

      // skills: 1/2 × 60 = 30 | experience: 20 | salary: 20
      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(70);
    });
  });

  describe('0% match', () => {
    it('returns 0 when skills, experience and salary all miss', () => {
      const candidate = makeCandidate({
        skills: ['PHP'],
        experienceYears: 1,
        expectedSalary: 200_000,
      });
      const vacancy = makeVacancy({
        skills_required: ['Rust', 'WASM'],
        experience_required: 5,
        salaryMin: 80_000,
        salaryMax: 100_000,
      });

      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(0);
    });

    it('returns 0 when candidate has no profile data', () => {
      const candidate = { profile: {} };
      const vacancy = makeVacancy({
        skills_required: ['React'],
        experience_required: 3,
        salaryMin: 60_000,
        salaryMax: 90_000,
      });

      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('gives full skills score (60) when vacancy requires no skills', () => {
      const candidate = makeCandidate({
        skills: [],
        experienceYears: 0,
        expectedSalary: 0,
      });
      const vacancy = makeVacancy({
        skills_required: [],   // no requirements
        experience_required: 0,
        salaryMin: 0,
        salaryMax: 0,
      });

      // skills: 60 (no req = full) | experience: 20 | salary: 20
      expect(calculateMatchPercentage({ candidate, vacancy })).toBe(100);
    });

    it('returns a whole integer, never a float', () => {
      const candidate = makeCandidate({
        skills: ['React'],     // 1 of 3 → 20 pts
        experienceYears: 2,
        expectedSalary: 50_000,
      });
      const vacancy = makeVacancy({
        skills_required: ['React', 'Vue', 'Angular'],
        experience_required: 2,
        salaryMin: 40_000,
        salaryMax: 60_000,
      });

      const result = calculateMatchPercentage({ candidate, vacancy });
      expect(Number.isInteger(result)).toBe(true);
    });

    it('does not exceed 100 under any circumstances', () => {
      const candidate = makeCandidate({
        skills: ['a', 'b', 'c', 'd'],
        experienceYears: 99,
        expectedSalary: 50_000,
      });
      const vacancy = makeVacancy({
        skills_required: ['a', 'b'],
        experience_required: 1,
        salaryMin: 40_000,
        salaryMax: 60_000,
      });

      expect(calculateMatchPercentage({ candidate, vacancy })).toBeLessThanOrEqual(100);
    });
  });
});