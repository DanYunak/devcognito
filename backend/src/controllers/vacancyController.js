const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Vacancy = require('../models/Vacancy');
const User = require('../models/User');
const Application = require('../models/Application');
const { calculateMatchPercentage } = require('../utils/match');
const { canRevealCandidatePII, sanitizeCandidateForRecruiter } = require('../utils/anonymity');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

const createVacancy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user.role === 'recruiter' && !req.user.companyId) {
    return res.status(400).json({ message: 'Recruiter account must be linked to a company' });
  }

  const {
    title,
    skills_required = [],
    experience_required = 0,
    salary_range,
    status = 'active'
  } = req.body;

  const vacancy = await Vacancy.create({
    company_id: req.user.companyId,
    recruiter_id: req.user.id,
    title,
    skills_required,
    experience_required,
    salary_range,
    status,
    deletedAt: null
  });

  return res.status(201).json({ vacancy });
};

const getPublicVacancies = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;
  const { search, skills, expMin, expMax, salaryMin, salaryMax } = req.query;

  const query = { status: 'active', deletedAt: null };

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (skills) {
    const skillsArr = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillsArr.length) {
      query.skills_required = {
        $in: skillsArr.map((s) => new RegExp(escapeRegex(s), 'i'))
      };
    }
  }

  if (expMin !== undefined || expMax !== undefined) {
    query.experience_required = {};
    if (expMin !== undefined && expMin !== '') query.experience_required.$gte = Number(expMin);
    if (expMax !== undefined && expMax !== '') query.experience_required.$lte = Number(expMax);
  }

  if (salaryMin !== undefined && salaryMin !== '') {
    query['salary_range.max'] = { $gte: Number(salaryMin) };
  }
  if (salaryMax !== undefined && salaryMax !== '') {
    query['salary_range.min'] = { $lte: Number(salaryMax) };
  }

  const total = await Vacancy.countDocuments(query);
  const vacancies = await Vacancy.find(query)
    .populate('company_id', 'name description verified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.json({
    vacancies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
};

const getMatchedVacancies = async (req, res) => {
  const candidate = await User.findById(req.user.id);
  if (!candidate || candidate.role !== 'candidate') {
    return res.status(403).json({ message: 'Only candidates can view matched vacancies' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;
  const { search, skills, expMin, expMax, salaryMin, salaryMax } = req.query;

  const query = { status: 'active', deletedAt: null };

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (skills) {
    const skillsArr = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillsArr.length) {
      query.skills_required = {
        $in: skillsArr.map((s) => new RegExp(escapeRegex(s), 'i'))
      };
    }
  }

  if (expMin !== undefined || expMax !== undefined) {
    query.experience_required = {};
    if (expMin !== undefined && expMin !== '') query.experience_required.$gte = Number(expMin);
    if (expMax !== undefined && expMax !== '') query.experience_required.$lte = Number(expMax);
  }

  if (salaryMin !== undefined && salaryMin !== '') {
    query['salary_range.max'] = { $gte: Number(salaryMin) };
  }
  if (salaryMax !== undefined && salaryMax !== '') {
    query['salary_range.min'] = { $lte: Number(salaryMax) };
  }

  const candidateSkills = (candidate.profile?.skills || [])
    .map((skill) => String(skill).toLowerCase().trim())
    .filter(Boolean);
  const candidateExperience = Number(candidate.profile?.experienceYears || 0);
  const candidateSalary = Number(candidate.profile?.expectedSalary || 0);

  const total = await Vacancy.countDocuments(query);

  const vacancies = await Vacancy.aggregate([
    { $match: query },
    {
      $addFields: {
        candidateSkills: { $literal: candidateSkills },
        candidateExperience: { $literal: candidateExperience },
        candidateSalary: { $literal: candidateSalary }
      }
    },
    {
      $addFields: {
        requiredSkillsLower: {
          $map: {
            input: '$skills_required',
            as: 'skill',
            in: { $toLower: '$$skill' }
          }
        }
      }
    },
    {
      $addFields: {
        matchedSkillsCount: {
          $size: {
            $setIntersection: ['$candidateSkills', '$requiredSkillsLower']
          }
        },
        requiredSkillsCount: { $size: '$requiredSkillsLower' }
      }
    },
    {
      $addFields: {
        skillsScore: {
          $cond: [
            { $eq: ['$requiredSkillsCount', 0] },
            60,
            {
              $multiply: [
                { $divide: ['$matchedSkillsCount', '$requiredSkillsCount'] },
                60
              ]
            }
          ]
        },
        experienceScore: {
          $cond: [
            { $gte: ['$candidateExperience', '$experience_required'] },
            20,
            0
          ]
        },
        salaryScore: {
          $cond: [
            {
              $and: [
                { $gte: ['$candidateSalary', '$salary_range.min'] },
                { $lte: ['$candidateSalary', '$salary_range.max'] }
              ]
            },
            20,
            0
          ]
        }
      }
    },
    {
      $addFields: {
        matchPercentage: {
          $round: [{ $add: ['$skillsScore', '$experienceScore', '$salaryScore'] }, 0]
        }
      }
    },
    { $sort: { matchPercentage: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'companies',
        localField: 'company_id',
        foreignField: '_id',
        pipeline: [
          { $project: { name: 1, description: 1, verified: 1 } }
        ],
        as: 'company_id'
      }
    },
    {
      $unwind: {
        path: '$company_id',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        candidateSkills: 0,
        candidateExperience: 0,
        candidateSalary: 0,
        requiredSkillsLower: 0,
        matchedSkillsCount: 0,
        requiredSkillsCount: 0,
        skillsScore: 0,
        experienceScore: 0,
        salaryScore: 0
      }
    }
  ]);

  return res.json({
    vacancies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
};

const getMyVacancies = async (req, res) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;

  const query = req.user.role === 'admin'
    ? { deletedAt: null }
    : { recruiter_id: req.user.id, deletedAt: null };

  const total = await Vacancy.countDocuments(query);
  const vacancies = await Vacancy.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.json({
    vacancies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
};

const getCandidatesForVacancy = async (req, res) => {
  const { vacancyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vacancyId)) {
    return res.status(400).json({ message: 'Invalid vacancy id' });
  }

  const vacancy = await Vacancy.findOne({ _id: vacancyId, deletedAt: null })
    .populate('company_id', 'name verified');
  if (!vacancy) {
    return res.status(404).json({ message: 'Vacancy not found' });
  }

  const isOwnerRecruiter = String(vacancy.recruiter_id) === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnerRecruiter && !isAdmin) {
    return res.status(403).json({ message: 'You can view candidates only for your own vacancies' });
  }

  const applications = await Application.find({ vacancy_id: vacancyId })
    .populate('candidate_id', 'role email profile')
    .sort({ createdAt: -1 });

  const candidates = applications.map((application) => {
    const candidate = application.candidate_id;
    const reveal = canRevealCandidatePII(application.status);
    const safeCandidate = sanitizeCandidateForRecruiter({ candidate, canReveal: reveal });

    return {
      applicationId: application._id,
      status: application.status,
      status_history: application.status_history,
      createdAt: application.createdAt,
      cover_letter: application.cover_letter,
      matchPercentage: calculateMatchPercentage({
        candidate,
        vacancy
      }),
      candidate: safeCandidate
    };
  });

  return res.json({
    vacancy,
    candidates
  });
};

const updateVacancy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { vacancyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vacancyId)) {
    return res.status(400).json({ message: 'Invalid vacancy id' });
  }

  const vacancy = await Vacancy.findOne({ _id: vacancyId, deletedAt: null });
  if (!vacancy) {
    return res.status(404).json({ message: 'Vacancy not found' });
  }

  const isOwnerRecruiter = String(vacancy.recruiter_id) === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnerRecruiter && !isAdmin) {
    return res.status(403).json({ message: 'You can update only your own vacancies' });
  }

  const {
    title,
    skills_required,
    experience_required,
    salary_range
  } = req.body;

  if (title !== undefined) vacancy.title = title;
  if (skills_required !== undefined) vacancy.skills_required = skills_required;
  if (experience_required !== undefined) vacancy.experience_required = experience_required;
  if (salary_range?.min !== undefined) vacancy.salary_range.min = salary_range.min;
  if (salary_range?.max !== undefined) vacancy.salary_range.max = salary_range.max;

  await vacancy.save();

  return res.json({ vacancy });
};

const updateVacancyStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { vacancyId } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vacancyId)) {
    return res.status(400).json({ message: 'Invalid vacancy id' });
  }

  const vacancy = await Vacancy.findOne({ _id: vacancyId, deletedAt: null });
  if (!vacancy) {
    return res.status(404).json({ message: 'Vacancy not found' });
  }

  const isOwnerRecruiter = String(vacancy.recruiter_id) === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnerRecruiter && !isAdmin) {
    return res.status(403).json({ message: 'You can update only your own vacancies' });
  }

  const previousStatus = vacancy.status;
  if (previousStatus === status) {
    return res.json({ vacancy, message: 'Status unchanged' });
  }

  vacancy.status = status;
  await vacancy.save();

  if (status === 'closed') {
    const now = new Date();
    const changedBy = new mongoose.Types.ObjectId(req.user.id);
    await Application.updateMany(
      {
        vacancy_id: vacancyId,
        status: { $in: ['new', 'interview'] }
      },
      [
        {
          $set: {
            status: 'rejected',
            status_history: {
              $concatArrays: [
                { $ifNull: ['$status_history', []] },
                [
                  {
                    from: '$status',
                    to: 'rejected',
                    changedBy: { $literal: changedBy },
                    at: { $literal: now }
                  }
                ]
              ]
            }
          }
        }
      ]
    );
  }

  return res.json({ vacancy });
};

const deleteVacancy = async (req, res) => {
  const { vacancyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vacancyId)) {
    return res.status(400).json({ message: 'Invalid vacancy id' });
  }

  const vacancy = await Vacancy.findOne({ _id: vacancyId, deletedAt: null });
  if (!vacancy) {
    return res.status(404).json({ message: 'Vacancy not found' });
  }

  const isOwnerRecruiter = String(vacancy.recruiter_id) === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnerRecruiter && !isAdmin) {
    return res.status(403).json({ message: 'You can delete only your own vacancies' });
  }

  vacancy.deletedAt = new Date();
  vacancy.status = 'closed';
  await vacancy.save();

  const now = new Date();
  const changedBy = new mongoose.Types.ObjectId(req.user.id);
  await Application.updateMany(
    {
      vacancy_id: vacancyId,
      status: { $in: ['new', 'interview'] }
    },
    [
      {
        $set: {
          status: 'withdrawn_by_company',
          status_history: {
            $concatArrays: [
              { $ifNull: ['$status_history', []] },
              [
                {
                  from: '$status',
                  to: 'withdrawn_by_company',
                  changedBy: { $literal: changedBy },
                  at: { $literal: now }
                }
              ]
            ]
          }
        }
      }
    ]
  );

  return res.json({ vacancy });
};

module.exports = {
  createVacancy,
  getPublicVacancies,
  getMatchedVacancies,
  getMyVacancies,
  getCandidatesForVacancy,
  updateVacancy,
  updateVacancyStatus,
  deleteVacancy
};
