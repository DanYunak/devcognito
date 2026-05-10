import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBoard } from '../features/applications/applicationsSlice';
import {
  createVacancy,
  fetchMyVacancies,
  updateVacancy,
  updateVacancyStatus,
  deleteVacancy,
} from '../features/vacancies/vacanciesSlice';
import { logout } from '../features/auth/authSlice';
import ApplicationKanban from '../components/ApplicationKanban';

const EMPTY_VACANCY = {
  title: '',
  skills_required: '',
  experience_required: '',
  salary_min: '',
  salary_max: '',
};

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function RecruiterDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { loading: boardLoading } = useSelector((state) => state.applications);
  const board = useSelector((state) => state.applications.board);
  const {
    myVacancies,
    loadingMine: vacanciesLoading,
    error: vacancyError,
  } = useSelector((state) => state.vacancies);

  const [showForm, setShowForm] = useState(false);
  const [showVacancies, setShowVacancies] = useState(true);
  const [form, setForm] = useState(EMPTY_VACANCY);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editVacancyId, setEditVacancyId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_VACANCY);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const boardHasCards = Object.values(board).some((col) => col.length > 0);

  useEffect(() => {
    dispatch(fetchBoard());
    dispatch(fetchMyVacancies());
  }, [dispatch]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch(fetchBoard());
    }, 10000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const startEdit = (vacancy) => {
    setEditVacancyId(vacancy._id);
    setEditForm({
      title: vacancy.title || '',
      skills_required: (vacancy.skills_required || []).join(', '),
      experience_required: String(vacancy.experience_required ?? ''),
      salary_min: String(vacancy.salary_range?.min ?? ''),
      salary_max: String(vacancy.salary_range?.max ?? ''),
    });
  };

  const cancelEdit = () => {
    setEditVacancyId(null);
    setEditForm(EMPTY_VACANCY);
  };

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
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
      }, 1500);
    } else {
      setFormError(result.payload || 'Failed to create vacancy.');
    }
  };

  const handleUpdateVacancy = async (e) => {
    e.preventDefault();
    if (!editVacancyId) return;

    const salaryMin = Number(editForm.salary_min);
    const salaryMax = Number(editForm.salary_max);
    if (salaryMin > salaryMax) {
      setFormError('Salary min cannot exceed max.');
      return;
    }

    setSubmitting(true);
    const result = await dispatch(
      updateVacancy({
        vacancyId: editVacancyId,
        updates: {
          title: editForm.title,
          skills_required: editForm.skills_required
            ? editForm.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          experience_required: Number(editForm.experience_required) || 0,
          salary_range: { min: salaryMin, max: salaryMax },
        },
      })
    );
    setSubmitting(false);

    if (updateVacancy.fulfilled.match(result)) {
      cancelEdit();
    } else {
      setFormError(result.payload || 'Failed to update vacancy.');
    }
  };

  const handleStatusChange = async (vacancyId, status) => {
    setStatusUpdatingId(vacancyId);
    await dispatch(updateVacancyStatus({ vacancyId, status }));
    setStatusUpdatingId(null);
  };

  const handleDeleteVacancy = async (vacancyId) => {
    setDeletingId(vacancyId);
    const result = await dispatch(deleteVacancy(vacancyId));
    if (deleteVacancy.fulfilled.match(result)) {
      dispatch(fetchBoard());
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-slate-800">My Vacancies</h2>
              <span className="text-xs text-slate-500">
                {myVacancies.length} total
              </span>
            </div>
            <button
              onClick={() => setShowVacancies((prev) => !prev)}
              className="text-xs border border-slate-200 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-50"
            >
              {showVacancies ? 'Hide list' : 'Show list'}
            </button>
          </div>

          {showVacancies && vacancyError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {vacancyError}
            </div>
          )}

          {showVacancies && vacanciesLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : showVacancies && myVacancies.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
              No vacancies yet. Create your first vacancy above.
            </div>
          ) : showVacancies ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {myVacancies.map((vacancy) => {
                const isEditing = editVacancyId === vacancy._id;
                return (
                  <div
                    key={vacancy._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800">{vacancy.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs border px-2 py-0.5 rounded-full capitalize ${
                              STATUS_STYLES[vacancy.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {vacancy.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            Created {new Date(vacancy.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => (isEditing ? cancelEdit() : startEdit(vacancy))}
                          className="text-xs border border-slate-200 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-50"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                    </div>

                    {!isEditing && (
                      <>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(vacancy.skills_required || []).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500 mt-2">
                          <span>📅 {vacancy.experience_required}+ yrs</span>
                          <span>
                            💰 ${vacancy.salary_range?.min?.toLocaleString()} – $
                            {vacancy.salary_range?.max?.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}

                    {isEditing && (
                      <form onSubmit={handleUpdateVacancy} className="mt-4 grid grid-cols-1 gap-3">
                        <input
                          name="title"
                          required
                          minLength={2}
                          value={editForm.title}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          placeholder="Job Title"
                        />
                        <input
                          name="skills_required"
                          value={editForm.skills_required}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          placeholder="Skills (comma-separated)"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            name="experience_required"
                            type="number"
                            min="0"
                            value={editForm.experience_required}
                            onChange={handleEditChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="Min experience"
                          />
                          <input
                            name="salary_min"
                            type="number"
                            min="0"
                            required
                            value={editForm.salary_min}
                            onChange={handleEditChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="Salary min"
                          />
                          <input
                            name="salary_max"
                            type="number"
                            min="0"
                            required
                            value={editForm.salary_max}
                            onChange={handleEditChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="Salary max"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg"
                          >
                            {submitting ? 'Saving…' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {!isEditing && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {['active', 'paused', 'closed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(vacancy._id, status)}
                            disabled={statusUpdatingId === vacancy._id || vacancy.status === status}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors disabled:opacity-60 ${
                              vacancy.status === status
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : status === 'active'
                                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                : status === 'paused'
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {statusUpdatingId === vacancy._id && vacancy.status !== status
                              ? 'Updating…'
                              : status}
                          </button>
                        ))}
                        <button
                          onClick={() => handleDeleteVacancy(vacancy._id)}
                          disabled={deletingId === vacancy._id}
                          className="text-xs px-3 py-1 rounded-full border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === vacancy._id ? 'Deleting…' : 'Delete vacancy'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

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

            <form
              onSubmit={handleCreateVacancy}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
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

        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Applications Board</h2>

          {boardLoading && !boardHasCards ? (
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
