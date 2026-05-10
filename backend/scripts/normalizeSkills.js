const mongoose = require('mongoose');
const connectDb = require('../src/config/db');
const env = require('../src/config/env');
const Vacancy = require('../src/models/Vacancy');
const User = require('../src/models/User');

const normalizeSkills = (skills = []) =>
  skills
    .map((skill) => String(skill).toLowerCase().trim())
    .filter(Boolean);

const run = async () => {
  await connectDb(env.mongoUri);

  let vacancyUpdates = 0;
  let userUpdates = 0;

  const vacancyCursor = Vacancy.find({}, { skills_required: 1 }).cursor();
  const vacancyOps = [];

  for (let vacancy = await vacancyCursor.next(); vacancy != null; vacancy = await vacancyCursor.next()) {
    const normalized = normalizeSkills(vacancy.skills_required || []);
    const original = vacancy.skills_required || [];
    const hasChange =
      normalized.length !== original.length ||
      normalized.some((skill, index) => skill !== String(original[index]).toLowerCase().trim());

    if (hasChange) {
      vacancyOps.push({
        updateOne: {
          filter: { _id: vacancy._id },
          update: { $set: { skills_required: normalized } }
        }
      });
    }

    if (vacancyOps.length >= 500) {
      const result = await Vacancy.bulkWrite(vacancyOps, { ordered: false });
      vacancyUpdates += result.modifiedCount || 0;
      vacancyOps.length = 0;
    }
  }

  if (vacancyOps.length) {
    const result = await Vacancy.bulkWrite(vacancyOps, { ordered: false });
    vacancyUpdates += result.modifiedCount || 0;
  }

  const userCursor = User.find({ role: 'candidate' }, { 'profile.skills': 1 }).cursor();
  const userOps = [];

  for (let user = await userCursor.next(); user != null; user = await userCursor.next()) {
    const original = user.profile?.skills || [];
    const normalized = normalizeSkills(original);
    const hasChange =
      normalized.length !== original.length ||
      normalized.some((skill, index) => skill !== String(original[index]).toLowerCase().trim());

    if (hasChange) {
      userOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { 'profile.skills': normalized } }
        }
      });
    }

    if (userOps.length >= 500) {
      const result = await User.bulkWrite(userOps, { ordered: false });
      userUpdates += result.modifiedCount || 0;
      userOps.length = 0;
    }
  }

  if (userOps.length) {
    const result = await User.bulkWrite(userOps, { ordered: false });
    userUpdates += result.modifiedCount || 0;
  }

  console.log(`Vacancies updated: ${vacancyUpdates}`);
  console.log(`Candidates updated: ${userUpdates}`);

  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('Normalization failed:', err);
  process.exit(1);
});
