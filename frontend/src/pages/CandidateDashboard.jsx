import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMatchedVacancies } from '../features/vacancies/vacanciesSlice';
import VacancyFilters from '../components/VacancyFilters';
import {
  applyToVacancy,
  fetchMyApplications,
  withdrawApplication,
} from '../features/applications/applicationsSlice';
import {
  addBookmark,
  fetchBookmarks,
  removeBookmark,
} from '../features/bookmarks/bookmarksSlice';
import { logout } from '../features/auth/authSlice';
import ChatPanel from '../components/ChatPanel';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  interview: 'bg-yellow-100 text-yellow-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  on_hold: 'bg-amber-50 text-amber-700',
  withdrawn_by_company: 'bg-slate-100 text-slate-500',
};

const STATUS_LABELS = {
  new: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Not selected',
  on_hold: 'Hiring Paused',
  withdrawn_by_company: 'Vacancy deleted by company',
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
  const {
    list: vacancies,
    loading: vacLoading,
    loadingMore: vacLoadingMore,
    pagination,
    filters,
  } = useSelector((state) => state.vacancies);
  const { list: bookmarks, loading: bookmarksLoading } = useSelector(
    (state) => state.bookmarks
  );
  const {
    myApplications,
    loading: appLoading,
    error: appError,
  } = useSelector((state) => state.applications);

  const [coverLetters, setCoverLetters] = useState({});
  const [applyingTo, setApplyingTo] = useState(null);
  const [openChatApp, setOpenChatApp] = useState(null);
  const [activeTab, setActiveTab] = useState('vacancies');
  const [withdrawConfirmId, setWithdrawConfirmId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMatchedVacancies({ page: 1, limit: 10, filters }));
    dispatch(fetchMyApplications());
    dispatch(fetchBookmarks());
  }, [dispatch]);

  const appliedIds = new Set(
    myApplications.map((a) => String(a.vacancy_id?._id || a.vacancy_id))
  );

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((v) => String(v._id))),
    [bookmarks]
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

  const handleWithdraw = async (applicationId) => {
    setWithdrawingId(applicationId);
    await dispatch(withdrawApplication(applicationId));
    setWithdrawingId(null);
    setWithdrawConfirmId(null);
  };

  const chatAllowed = (status) => status === 'interview' || status === 'offer';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">🔍 DevCognito</h1>
          <p className="text-xs text-slate-500">
            Candidate: {user?.profile?.fullName || user?.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Edit Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-6">
          {['vacancies', 'applications', 'bookmarks'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'vacancies'
                ? `Matched Vacancies (${pagination.total || vacancies.length})`
                : tab === 'applications'
                ? `My Applications (${myApplications.length})`
                : `Bookmarks (${bookmarks.length})`}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Vacancies Tab */}
        {activeTab === 'vacancies' && (
          <div>
            <VacancyFilters />
            {vacLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : vacancies.length === 0 ? (
              <p className="text-center text-slate-500 py-16">No active vacancies found.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Showing {vacancies.length} of {pagination.total} vacancies
                </p>
                {vacancies.map((vacancy) => {
                  const alreadyApplied = appliedIds.has(String(vacancy._id));
                  const isBookmarked = bookmarkedIds.has(String(vacancy._id));
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
                        <button
                          onClick={() =>
                            dispatch(
                              isBookmarked
                                ? removeBookmark(vacancy._id)
                                : addBookmark(vacancy._id)
                            ).then(() => dispatch(fetchBookmarks()))
                          }
                          className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                            isBookmarked
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isBookmarked ? '★ Saved' : '☆ Save'}
                        </button>
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
                {pagination.hasMore && (
                  <button
                    onClick={() =>
                      dispatch(
                        fetchMatchedVacancies({
                          page: pagination.page + 1,
                          limit: pagination.limit,
                          filters,
                        })
                      )
                    }
                    disabled={vacLoadingMore}
                    className="w-full border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                  >
                    {vacLoadingMore ? 'Loading...' : 'Load more vacancies'}
                  </button>
                )}
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
                        {STATUS_LABELS[app.status] || app.status}
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

                    {app.status === 'new' && (
                      <div className="mt-3">
                        {withdrawConfirmId === app._id ? (
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-slate-500">
                              Withdraw this application?
                            </span>
                            <button
                              onClick={() => handleWithdraw(app._id)}
                              disabled={withdrawingId === app._id}
                              className="text-xs border border-red-200 text-red-700 px-3 py-1 rounded-full hover:bg-red-50 disabled:opacity-60"
                            >
                              {withdrawingId === app._id ? 'Withdrawing…' : 'Yes, withdraw'}
                            </button>
                            <button
                              onClick={() => setWithdrawConfirmId(null)}
                              disabled={withdrawingId === app._id}
                              className="text-xs border border-slate-200 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-50 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setWithdrawConfirmId(app._id)}
                            className="text-xs border border-red-200 text-red-700 px-3 py-1 rounded-full hover:bg-red-50"
                          >
                            Withdraw application
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div>
            {bookmarksLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : bookmarks.length === 0 ? (
              <p className="text-center text-slate-500 py-16">No saved vacancies yet.</p>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((vacancy) => (
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
                      </div>
                      <button
                        onClick={() =>
                          dispatch(removeBookmark(vacancy._id)).then(() => dispatch(fetchBookmarks()))
                        }
                        className="text-xs border border-slate-200 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-50"
                      >
                        Remove bookmark
                      </button>
                    </div>
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
