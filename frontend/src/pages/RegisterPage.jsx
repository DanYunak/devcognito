import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../features/auth/authSlice';

const INITIAL_FORM = {
  role: 'candidate',
  email: '',
  password: '',
  profile: {
    fullName: '',
    skills: '',
    experienceYears: '',
    expectedSalary: '',
  },
  company_id: '',
};

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'candidate' ? '/candidate' : '/recruiter', { replace: true });
    }
    return () => dispatch(clearError());
  }, [user, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      role: form.role,
      email: form.email,
      password: form.password,
      profile: {
        fullName: form.profile.fullName,
        skills: form.profile.skills
          ? form.profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        experienceYears: Number(form.profile.experienceYears) || 0,
        expectedSalary: Number(form.profile.expectedSalary) || 0,
      },
    };
    if (form.role === 'recruiter' && form.company_id) {
      payload.company_id = form.company_id;
    }
    dispatch(register(payload));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Create account</h1>
        <p className="text-slate-500 text-sm mb-6">Join the Anonymous Job Board</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              name="profile.fullName"
              value={form.profile.fullName}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="min 6 characters"
            />
          </div>

          {/* Candidate-only fields */}
          {form.role === 'candidate' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Skills{' '}
                  <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  name="profile.skills"
                  value={form.profile.skills}
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
                    name="profile.experienceYears"
                    type="number"
                    min="0"
                    value={form.profile.experienceYears}
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
                    name="profile.expectedSalary"
                    type="number"
                    min="0"
                    value={form.profile.expectedSalary}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="80000"
                  />
                </div>
              </div>
            </>
          )}

          {/* Recruiter-only fields */}
          {form.role === 'recruiter' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company ID{' '}
                <span className="text-slate-400 font-normal">(MongoDB ObjectId)</span>
              </label>
              <input
                name="company_id"
                value={form.company_id}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="665f1b2c3e4a5b6c7d8e9f0a"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}