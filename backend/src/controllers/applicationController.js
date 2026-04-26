const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Application = require('../models/Application');
const Vacancy = require('../models/Vacancy');
const User = require('../models/User');
const { canRevealCandidatePII, sanitizeCandidateForRecruiter } = require('../utils/anonymity');

const applyToVacancy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { vacancy_id, cover_letter = '' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vacancy_id)) {
    return res.status(400).json({ message: 'Invalid vacancy id' });
  }

  const vacancy = await Vacancy.findById(vacancy_id);
  if (!vacancy || vacancy.status !== 'active') {
    return res.status(404).json({ message: 'Vacancy not found or not active' });
  }

  const existing = await Application.findOne({
    vacancy_id,
    candidate_id: req.user.id
  });

  if (existing) {
    return res.status(409).json({ message: 'You already applied to this vacancy' });
  }

  const application = await Application.create({
    vacancy_id,
    candidate_id: req.user.id,
    cover_letter,
    status: 'new',
    status_history: [
      {
        from: null,
        to: 'new',
        changedBy: req.user.id,
        at: new Date()
      }
    ]
  });

  return res.status(201).json({ application });
};

const getMyApplications = async (req, res) => {
  const applications = await Application.find({ candidate_id: req.user.id })
    .populate({
      path: 'vacancy_id',
      populate: {
        path: 'company_id',
        select: 'name verified'
      }
    })
    .sort({ createdAt: -1 });

  return res.json({ applications });
};

const getApplicationsForVacancy = async (req, res) => {
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
    return res.status(403).json({ message: 'Forbidden for this vacancy' });
  }

  const applications = await Application.find({ vacancy_id: vacancyId })
    .populate('candidate_id', 'role email profile')
    .sort({ createdAt: -1 });

  const payload = applications.map((application) => {
    const candidate = application.candidate_id;
    const reveal = canRevealCandidatePII(application.status);

    return {
      _id: application._id,
      vacancy_id: application.vacancy_id,
      status: application.status,
      status_history: application.status_history,
      cover_letter: application.cover_letter,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      candidate: sanitizeCandidateForRecruiter({ candidate, canReveal: reveal })
    };
  });

  return res.json({ vacancy, applications: payload });
};

const updateApplicationStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { applicationId } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    return res.status(400).json({ message: 'Invalid application id' });
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  const vacancy = await Vacancy.findById(application.vacancy_id);
  if (!vacancy) {
    return res.status(404).json({ message: 'Vacancy not found' });
  }

  const isOwnerRecruiter = String(vacancy.recruiter_id) === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnerRecruiter && !isAdmin) {
    return res.status(403).json({ message: 'Forbidden for this application' });
  }

  const previousStatus = application.status;
  if (previousStatus === status) {
    return res.json({ application, message: 'Status unchanged' });
  }

  application.status = status;
  application.status_history.push({
    from: previousStatus,
    to: status,
    changedBy: req.user.id,
    at: new Date()
  });

  await application.save();

  const candidate = await User.findById(application.candidate_id).select('role email profile');

  return res.json({
    application: {
      _id: application._id,
      vacancy_id: application.vacancy_id,
      candidate_id: application.candidate_id,
      status: application.status,
      status_history: application.status_history,
      cover_letter: application.cover_letter,
      updatedAt: application.updatedAt,
      candidate: sanitizeCandidateForRecruiter({
        candidate,
        canReveal: canRevealCandidatePII(application.status)
      })
    }
  });
};

const getRecruiterApplicationsBoard = async (req, res) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const vacancyQuery = req.user.role === 'admin' ? {} : { recruiter_id: req.user.id };
  const vacancies = await Vacancy.find(vacancyQuery).select('_id title recruiter_id company_id');

  if (!vacancies.length) {
    return res.json({ board: { new: [], interview: [], offer: [], rejected: [] } });
  }

  const vacancyIds = vacancies.map((v) => v._id);
  const vacancyById = new Map(vacancies.map((v) => [String(v._id), v]));

  const applications = await Application.find({ vacancy_id: { $in: vacancyIds } })
    .populate('candidate_id', 'role email profile')
    .sort({ updatedAt: -1 });

  const board = { new: [], interview: [], offer: [], rejected: [] };

  applications.forEach((application) => {
    const candidate = application.candidate_id;
    const reveal = canRevealCandidatePII(application.status);
    const vacancy = vacancyById.get(String(application.vacancy_id));

    board[application.status].push({
      _id: application._id,
      vacancy_id: application.vacancy_id,
      vacancyTitle: vacancy?.title || 'Unknown vacancy',
      status: application.status,
      status_history: application.status_history,
      cover_letter: application.cover_letter,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      candidate: sanitizeCandidateForRecruiter({ candidate, canReveal: reveal })
    });
  });

  return res.json({ board });
};

module.exports = {
  applyToVacancy,
  getMyApplications,
  getApplicationsForVacancy,
  updateApplicationStatus,
  getRecruiterApplicationsBoard
};
