import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBoard } from '../features/applications/applicationsSlice';
import { createVacancy } from '../features/vacancies/vacanciesSlice';
import { logout } from '../features/auth/authSlice';
import ApplicationKanban from '../components/ApplicationKanban';

const EMPTY_VACANCY = {
  title: '',
  skills_required: '',
  experience_required: '',
  salary_min: '',
  salary_max: '',
};

export default function RecruiterDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading: boardLoading } = useSelector((state) => state.applications);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_VACANCY);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchBoard());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreateVacancy = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const salaryMin = Number(form.salary_min);
    const salaryMax = Number(form.salary_max);

    if (salaryMin > salaryMax) {
      setFormError('Salary min cannot exceed max.');
      return;
    }

    setSubmitting(true);
    const result = await dispatch(
      createVacancy({
        title: form.title,
        skills_required: form.skills_required
          ? form.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        experience_required: Number(form.experience_required) || 0,
        salary_range: { min: salaryMin, max: salaryMax },
        status: 'active',
      })
    );
    setSubmitting(false);

    if (createVacancy.fulfilled.match(result)) {
      setFormSuccess('Vacancy created successfully!');
      setForm(EMPTY_VACANCY);
      setTimeout(() => setShowForm(false), 1200);
    } else {
      setFormError(result.payload || 'Failed to create vacancy.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">🏢 Recruiter Dashboard</h1>
          <p className="text-xs text-slate-500">
            {user?.profile?.fullName || user?.email} ·{' '}
            <span className="capitalize">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((p) => !p)}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Vacancy'}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Create vacancy form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Create New Vacancy</h2>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateVacancy} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Job Title *
                </label>
                <input
                  name="title"
                  required
                  minLength={2}
                  value={form.title}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Senior Frontend Developer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Required Skills{' '}
                  <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  name="skills_required"
                  value={form.skills_required}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="React, TypeScript, CSS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Experience (yrs)
                </label>
                <input
                  name="experience_required"
                  type="number"
                  min="0"
                  value={form.experience_required}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Salary Min ($) *
                  </label>
                  <input
                    name="salary_min"
                    type="number"
                    min="0"
                    required
                    value={form.salary_min}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="60000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Salary Max ($) *
                  </label>
                  <input
                    name="salary_max"
                    type="number"
                    min="0"
                    required
                    value={form.salary_max}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? 'Creating…' : 'Create Vacancy'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kanban board */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Applications Board</h2>
          {boardLoading && !Object.values(
            useSelector((state) => state.applications.board)
          ).some((col) => col.length > 0) ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <ApplicationKanban />
          )}
        </div>
      </main>
    </div>
  );
}