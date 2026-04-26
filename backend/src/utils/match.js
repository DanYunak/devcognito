const toLowerSet = (list) => new Set((list || []).map((item) => String(item).toLowerCase().trim()));

const calculateMatchPercentage = ({ candidate, vacancy }) => {
  const requiredSkills = vacancy.skills_required || [];
  const candidateSkills = candidate.profile?.skills || [];

  const requiredSet = toLowerSet(requiredSkills);
  const candidateSet = toLowerSet(candidateSkills);

  const matchedSkills = [...requiredSet].filter((skill) => candidateSet.has(skill)).length;

  // Weighted score part 1: skills contribute up to 60%.
  // If vacancy has no required skills, give full score for this dimension.
  const skillsScore =
    requiredSet.size === 0 ? 60 : (matchedSkills / requiredSet.size) * 60;

  // Weighted score part 2: experience contributes 20% only when candidate meets/exceeds requirement.
  const experienceScore =
    (candidate.profile?.experienceYears || 0) >= (vacancy.experience_required || 0) ? 20 : 0;

  // Weighted score part 3: salary contributes 20% only when expected salary is within vacancy range.
  const expectedSalary = candidate.profile?.expectedSalary || 0;
  const salaryMin = vacancy.salary_range?.min || 0;
  const salaryMax = vacancy.salary_range?.max || 0;
  const salaryScore = expectedSalary >= salaryMin && expectedSalary <= salaryMax ? 20 : 0;

  return Math.round(skillsScore + experienceScore + salaryScore);
};

module.exports = {
  calculateMatchPercentage
};
