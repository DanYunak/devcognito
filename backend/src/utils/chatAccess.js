const mongoose = require('mongoose');
const Application = require('../models/Application');
const Vacancy = require('../models/Vacancy');

const CHAT_OPEN_STATUSES = new Set(['interview', 'offer']);

const ensureChatAccess = async ({ applicationId, user }) => {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    const error = new Error('Invalid application id');
    error.status = 400;
    throw error;
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    const error = new Error('Application not found');
    error.status = 404;
    throw error;
  }

  if (!CHAT_OPEN_STATUSES.has(application.status)) {
    const error = new Error('Chat is available only for interview or offer status');
    error.status = 403;
    throw error;
  }

  const vacancy = await Vacancy.findById(application.vacancy_id).select('recruiter_id company_id');
  if (!vacancy) {
    const error = new Error('Vacancy not found');
    error.status = 404;
    throw error;
  }

  const userId = String(user.id);
  const isCandidateOwner = String(application.candidate_id) === userId;
  const isRecruiterOwner = String(vacancy.recruiter_id) === userId;
  const isAdmin = user.role === 'admin';

  if (!isCandidateOwner && !isRecruiterOwner && !isAdmin) {
    const error = new Error('Forbidden for this application chat');
    error.status = 403;
    throw error;
  }

  return { application, vacancy };
};

module.exports = {
  CHAT_OPEN_STATUSES,
  ensureChatAccess
};
