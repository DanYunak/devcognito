import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMatchedVacancies } from '../features/vacancies/vacanciesSlice';
import { applyToVacancy, fetchMyApplications } from '../features/applications/applicationsSlice';
import { logout } from '../features/auth/authSlice';
import ChatPanel from '../components/ChatPanel';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  interview: 'bg-yellow-100 text-yellow-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const MatchBar = ({ percent }) => (
  <div className="flex items-center gap-2 mt-2">
    <div className="flex-1 bg-slate-100 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-indigo-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
    <span className="text-xs font-semibold text-indigo-600 w-10 text-right">{percent}%</span>
  </div>
);

export default function CandidateDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { list: vacancies, loading: vacLoading } = useSelector((state) => state.vacancies);
  const {
    myApplications,
    loading: appLoading,
    error: appError,
  } = useSelector((state) => state.applications);

  const [coverLetters, setCoverLetters] = useState({});
  const [applyingTo, setApplyingTo] = useState(null);
  const [openChatApp, setOpenChatApp] = useState(null);
  const [activeTab, setActiveTab] = useState('vacancies');

  useEffect(() => {
    dispatch(fetchMatchedVacancies());
    dispatch(fetchMyApplications());
  }, [dispatch]);

  const appliedIds = new Set(
    myApplications.map((a) => String(a.vacancy_id?._id || a.vacancy_id))
  );

  const handleApply = async (vacancyId) => {
    setApplyingTo(vacancyId);
    await dispatch(
      applyToVacancy({
        vacancy_id: vacancyId,
        cover_letter: coverLetters[vacancyId] || '',
      })
    );
    setApplyingTo(null);
    setCoverLetters((prev) => ({ ...prev, [vacancyId]: '' }));
    dispatch(fetchMyApplications());
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const chatAllowed = (status) => status === 'interview' || status === 'offer';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">🔍 Anonymous Job Board</h1>
          <p className="text-xs text-slate-500">
            Candidate: {user?.profile?.fullName || user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-red-600 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-6">
          {['vacancies', 'applications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'vacancies' ? `Matched Vacancies (${vacancies.length})` : `My Applications (${myApplications.length})`}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Vacancies Tab */}
        {activeTab === 'vacancies' && (
          <div>
            {vacLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : vacancies.length === 0 ? (
              <p className="text-center text-slate-500 py-16">No active vacancies found.</p>
            ) : (
              <div className="space-y-4">
                {vacancies.map((vacancy) => {
                  const alreadyApplied = appliedIds.has(String(vacancy._id));
                  return (
                    <div
                      key={vacancy._id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h2 className="font-semibold text-slate-800">{vacancy.title}</h2>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {vacancy.company_id?.name || 'Unknown company'}
                            {vacancy.company_id?.verified && (
                              <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                ✓ Verified
                              </span>
                            )}
                          </p>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {vacancy.skills_required.map((skill) => (
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

                          <MatchBar percent={vacancy.matchPercentage ?? 0} />
                        </div>
                      </div>

                      {!alreadyApplied ? (
                        <div className="mt-4 space-y-2">
                          <textarea
                            value={coverLetters[vacancy._id] || ''}
                            onChange={(e) =>
                              setCoverLetters((prev) => ({
                                ...prev,
                                [vacancy._id]: e.target.value,
                              }))
                            }
                            rows={2}
                            placeholder="Cover letter (optional)"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <button
                            onClick={() => handleApply(vacancy._id)}
                            disabled={appLoading && applyingTo === vacancy._id}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
                          >
                            {applyingTo === vacancy._id ? 'Applying…' : 'Apply'}
                          </button>
                          {appError && applyingTo === null && (
                            <p className="text-xs text-red-600">{appError}</p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-green-600 font-medium">✓ Applied</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            {appLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : myApplications.length === 0 ? (
              <p className="text-center text-slate-500 py-16">You haven't applied to any jobs yet.</p>
            ) : (
              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div
                    key={app._id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {app.vacancy_id?.title || 'Unknown position'}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {app.vacancy_id?.company_id?.name || ''}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                          STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    {app.cover_letter && (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {app.cover_letter}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 mt-1">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </p>

                    {chatAllowed(app.status) && (
                      <button
                        onClick={() =>
                          setOpenChatApp(openChatApp === app._id ? null : app._id)
                        }
                        className="mt-3 text-sm text-indigo-600 hover:underline"
                      >
                        {openChatApp === app._id ? 'Close chat' : '💬 Open chat with recruiter'}
                      </button>
                    )}

                    {openChatApp === app._id && (
                      <div className="mt-3">
                        <ChatPanel applicationId={app._id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}