const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Vacancy = require('../models/Vacancy');
const User = require('../models/User');
const Application = require('../models/Application');
const { calculateMatchPercentage } = require('../utils/match');
const { canRevealCandidatePII, sanitizeCandidateForRecruiter } = require('../utils/anonymity');

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
    status
  });

  return res.status(201).json({ vacancy });
};

const getPublicVacancies = async (req, res) => {
  const vacancies = await Vacancy.find({ status: 'active' })
    .populate('company_id', 'name description verified')
    .sort({ createdAt: -1 });

  return res.json({ vacancies });
};

const getMatchedVacancies = async (req, res) => {
  const candidate = await User.findById(req.user.id);
  if (!candidate || candidate.role !== 'candidate') {
    return res.status(403).json({ message: 'Only candidates can view matched vacancies' });
  }

  const vacancies = await Vacancy.find({ status: 'active' })
    .populate('company_id', 'name description verified')
    .sort({ createdAt: -1 });

  const matchedVacancies = vacancies.map((vacancy) => {
    const vacancyObj = vacancy.toObject();
    return {
      ...vacancyObj,
      matchPercentage: calculateMatchPercentage({ candidate, vacancy: vacancyObj })
    };
  });

  matchedVacancies.sort((a, b) => b.matchPercentage - a.matchPercentage);

  return res.json({ vacancies: matchedVacancies });
};

const getCandidatesForVacancy = async (req, res) => {
  const { vacancyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vacancyId)) {
    return res.status(400).json({ message: 'Invalid vacancy id' });
  }

  const vacancy = await Vacancy.findById(vacancyId).populate('company_id', 'name verified');
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

module.exports = {
  createVacancy,
  getPublicVacancies,
  getMatchedVacancies,
  getCandidatesForVacancy
};
