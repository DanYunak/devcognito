const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 5000;

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/IT_Jobs_Platform')
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

const VacancySchema = new mongoose.Schema({
    title: String,
    company: String,
    salary: Number,
    requirements: [String],
    status: { type: String, default: 'active' }
});

const Vacancy = mongoose.model('Vacancy', VacancySchema, 'Vacancies');

const ApplicationSchema = new mongoose.Schema({
    vacancy_id: mongoose.Schema.Types.ObjectId,
    candidate_name: String,
    cover_letter: String,
    status: { type: String, default: 'new' }
});

const Application = mongoose.model('Application', ApplicationSchema, 'Applications');

app.get('/api/vacancies', async (req, res) => {
    const vacancies = await Vacancy.find({ status: 'active' });
    res.json(vacancies);
});

app.post('/api/vacancies', async (req, res) => {
    const newVacancy = new Vacancy(req.body);
    await newVacancy.save();
    res.status(201).json({ message: "Vacancy created successfully!" });
});

app.post('/api/applications', async (req, res) => {
    const newApp = new Application(req.body);
    await newApp.save();
    res.status(201).json({ message: "Application sent!" });
});

app.patch('/api/applications/:id', async (req, res) => {
    try {
        const updatedApp = await Application.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        res.json({ message: "Status updated", updatedApp });
    } catch (err) {
        res.status(404).json({ message: "Application not found" });
    }
});

app.delete('/api/vacancies/:id', async (req, res) => {
    await Vacancy.findByIdAndDelete(req.params.id);
    res.json({ message: "Vacancy deleted" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});