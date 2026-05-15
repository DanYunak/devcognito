const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDb = require('./src/config/db');
const Company = require('./src/models/Company');
const Vacancy = require('./src/models/Vacancy');

const companies = [
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000004'),
    name: 'Luxoft',
    description: 'DXC Technology Company.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000003'),
    name: 'Epam Systems',
    description: 'Software engineering and IT consulting.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000008'),
    name: 'Sigma Software',
    description: 'IT consulting and software product delivery.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000005'),
    name: 'Ciklum',
    description: 'Global Digital Solutions Company.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000010'),
    name: 'Eleks',
    description: 'Custom software development company.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000002'),
    name: 'SoftServe',
    description: 'IT consulting and digital services.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000009'),
    name: 'N-iX',
    description: 'Software development service company.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000007'),
    name: 'Intellias',
    description: 'Technology enabler for top tier organizations.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000001'),
    name: 'GlobalLogic',
    description: 'Digital product engineering company.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000006'),
    name: 'DataArt',
    description: 'Global software engineering firm.',
    verified: true,
    createdAt: new Date('2026-04-26T15:39:01.661Z'),
    updatedAt: new Date('2026-04-26T15:39:01.661Z')
  }
];

const vacancies = [
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acbc'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000007'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Senior React Native',
    skills_required: ['React Native', 'TypeScript', 'Redux'],
    experience_required: 4,
    salary_range: { min: 4000, max: 5500 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acc3'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000010'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Senior Automation QA',
    skills_required: ['Cypress', 'JavaScript', 'Playwright'],
    experience_required: 4,
    salary_range: { min: 3500, max: 5000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb9'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000005'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Senior iOS Developer',
    skills_required: ['Swift', 'Objective-C', 'iOS SDK'],
    experience_required: 5,
    salary_range: { min: 4500, max: 6500 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acc1'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000009'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Junior UI/UX Designer',
    skills_required: ['Figma', 'Prototyping', 'Wireframing'],
    experience_required: 1,
    salary_range: { min: 700, max: 1200 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb5'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000003'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle DevOps Engineer',
    skills_required: ['Docker', 'Kubernetes', 'CI/CD'],
    experience_required: 3,
    salary_range: { min: 3000, max: 4500 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb6'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000004'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle Python Engineer',
    skills_required: ['Python', 'Django', 'Docker'],
    experience_required: 2,
    salary_range: { min: 2000, max: 3000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb8'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000005'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Junior Vue.js Developer',
    skills_required: ['Vue.js', 'JavaScript', 'HTML/CSS'],
    experience_required: 0,
    salary_range: { min: 500, max: 900 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acbb'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000006'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle Business Analyst',
    skills_required: ['Jira', 'Agile', 'Requirements Analysis'],
    experience_required: 2,
    salary_range: { min: 1800, max: 2800 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acc2'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000010'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle Go Developer',
    skills_required: ['Golang', 'Microservices', 'Docker'],
    experience_required: 3,
    salary_range: { min: 3000, max: 4500 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb3'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000002'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Junior QA Engineer',
    skills_required: ['Manual Testing', 'Postman', 'SQL'],
    experience_required: 1,
    salary_range: { min: 600, max: 1000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb4'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000003'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Senior Java Developer',
    skills_required: ['Java', 'Spring Boot', 'AWS'],
    experience_required: 5,
    salary_range: { min: 5000, max: 7000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb7'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000004'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Senior Data Scientist',
    skills_required: ['Python', 'Machine Learning', 'SQL'],
    experience_required: 4,
    salary_range: { min: 4000, max: 6000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acba'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000006'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle .NET Developer',
    skills_required: ['C#', '.NET Core', 'SQL Server'],
    experience_required: 3,
    salary_range: { min: 2800, max: 4000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acbd'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000007'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle NestJS Backend',
    skills_required: ['NestJS', 'Node.js', 'PostgreSQL'],
    experience_required: 2,
    salary_range: { min: 2500, max: 3500 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acbf'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000008'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Senior Cyber Security Expert',
    skills_required: ['Security Audit', 'Penetration Testing', 'Network Security'],
    experience_required: 6,
    salary_range: { min: 6000, max: 8000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acbe'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000008'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Junior PHP Developer',
    skills_required: ['PHP', 'Laravel', 'MySQL'],
    experience_required: 1,
    salary_range: { min: 800, max: 1300 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acc0'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000009'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle Android Developer',
    skills_required: ['Kotlin', 'Android SDK', 'Coroutines'],
    experience_required: 3,
    salary_range: { min: 2500, max: 4000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb0'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000001'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Junior React Developer',
    skills_required: ['React', 'JavaScript', 'CSS'],
    experience_required: 1,
    salary_range: { min: 800, max: 1200 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb1'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000001'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Senior Node.js Backend',
    skills_required: ['Node.js', 'Express', 'MongoDB'],
    experience_required: 5,
    salary_range: { min: 4500, max: 6000 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  },
  {
    _id: new mongoose.Types.ObjectId('69ee319ad7df141e77d9acb2'),
    company_id: new mongoose.Types.ObjectId('660000000000000000000002'),
    recruiter_id: new mongoose.Types.ObjectId('669999999999999999999999'),
    title: 'Middle Full-Stack Developer',
    skills_required: ['React', 'Node.js', 'PostgreSQL'],
    experience_required: 3,
    salary_range: { min: 2500, max: 3500 },
    status: 'active',
    createdAt: new Date('2026-04-26T15:39:06.353Z'),
    updatedAt: new Date('2026-04-26T15:39:06.353Z')
  }
];

dotenv.config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Missing required environment variable: MONGO_URI');
  process.exit(1);
}

const seedForce = String(process.env.SEED_FORCE || '').toLowerCase() === 'true';

const companyIds = companies.map((company) => company._id);
const vacancyIds = vacancies.map((vacancy) => vacancy._id);

const run = async () => {
  const connection = await connectDb(mongoUri);

  try {
    if (!seedForce) {
      const [existingCompanies, existingVacancies] = await Promise.all([
        Company.countDocuments({ _id: { $in: companyIds } }),
        Vacancy.countDocuments({ _id: { $in: vacancyIds } })
      ]);

      if (existingCompanies > 0 || existingVacancies > 0) {
        console.log('Seed skipped: seed data already present.');
        return;
      }
    }

    const companyOps = companies.map((company) => ({
      updateOne: {
        filter: { _id: company._id },
        update: { $set: company },
        upsert: true
      }
    }));

    const vacancyOps = vacancies.map((vacancy) => ({
      updateOne: {
        filter: { _id: vacancy._id },
        update: { $set: vacancy },
        upsert: true
      }
    }));

    await Company.bulkWrite(companyOps, { ordered: true });
    await Vacancy.bulkWrite(vacancyOps, { ordered: true });

    console.log('Seed complete: companies and vacancies upserted.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.close();
  }
};

run();
