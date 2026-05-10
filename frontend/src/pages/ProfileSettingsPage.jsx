import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile, clearError } from '../features/auth/authSlice';

const emptyForm = {
  fullName: '',
  contacts: '',
  skills: '',
  experienceYears: '',
  expectedSalary: '',
};

export default function ProfileSettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState(emptyForm);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setForm({
        fullName: user.profile.fullName || '',
        contacts: user.profile.contacts || '',
        skills: (user.profile.skills || []).join(', '),
        experienceYears: user.profile.experienceYears ?? '',
        expectedSalary: user.profile.expectedSalary ?? '',
      });
    }
  }, [user]);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    const payload = {
      fullName: form.fullName,
      contacts: form.contacts,
      skills: form.skills
        ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
      expectedSalary: form.expectedSalary === '' ? undefined : Number(form.expectedSalary),
    };

    const result = await dispatch(updateProfile(payload));
    if (result.meta.requestStatus === 'fulfilled') {
      setSuccess(true);
      navigate('/candidate');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Profile Settings</h1>
          <p className="text-xs text-slate-500">Update your candidate profile</p>
        </div>
        <button
          onClick={() => navigate('/candidate')}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Profile info</h2>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              Profile updated successfully.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contacts
              </label>
              <input
                name="contacts"
                value={form.contacts}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Email, Telegram, LinkedIn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
              </label>
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Experience (yrs)
                </label>
                <input
                  name="experienceYears"
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expected Salary ($)
                </label>
                <input
                  name="expectedSalary"
                  type="number"
                  min="0"
                  value={form.expectedSalary}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="80000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
