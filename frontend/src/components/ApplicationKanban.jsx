import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateStatus } from '../features/applications/applicationsSlice';
import ChatPanel from './ChatPanel';

const COLUMNS = [
  { key: 'new', label: 'New', color: 'border-blue-400' },
  { key: 'interview', label: 'Interview', color: 'border-yellow-400' },
  { key: 'offer', label: 'Offer', color: 'border-green-400' },
  { key: 'rejected', label: 'Rejected', color: 'border-red-400' },
];

const STATUS_TRANSITIONS = {
  new: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['rejected'],
  rejected: [],
};

const AnonymousBadge = () => (
  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
    🔒 Anonymous
  </span>
);

function ApplicationCard({ application, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const { loading } = useSelector((state) => state.applications);

  const { candidate } = application;
  const isRevealed = !candidate?.profile?.hidden;
  const chatAllowed = application.status === 'interview' || application.status === 'offer';
  const transitions = STATUS_TRANSITIONS[application.status] || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      {/* Candidate info */}
      <div className="flex items-center justify-between">
        <div>
          {isRevealed ? (
            <p className="font-semibold text-slate-800 text-sm">
              {candidate.profile.fullName || 'Unnamed'}
            </p>
          ) : (
            <AnonymousBadge />
          )}
          {isRevealed && (
            <p className="text-xs text-slate-500">{candidate.email}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          {expanded ? '▲ Less' : '▼ More'}
        </button>
      </div>

      {/* Skills always visible */}
      <div className="flex flex-wrap gap-1">
        {(candidate?.profile?.skills || []).map((skill) => (
          <span
            key={skill}
            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Stats always visible */}
      <div className="flex gap-3 text-xs text-slate-500">
        <span>🗂 {candidate?.profile?.experienceYears ?? 0} yrs exp</span>
        <span>💰 ${candidate?.profile?.expectedSalary?.toLocaleString() ?? 0}</span>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
          {application.cover_letter && (
            <p className="italic">"{application.cover_letter}"</p>
          )}
          {isRevealed && candidate.profile.contacts && (
            <p>📞 {candidate.profile.contacts}</p>
          )}
          <p className="text-slate-400">
            Applied {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="flex gap-2 flex-wrap pt-1">
          {transitions.map((nextStatus) => (
            <button
              key={nextStatus}
              disabled={loading}
              onClick={() =>
                onStatusChange({ applicationId: application._id, status: nextStatus })
              }
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
                nextStatus === 'rejected'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : nextStatus === 'offer'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              → {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      {chatAllowed && (
        <>
          <button
            onClick={() => setOpenChat((p) => !p)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {openChat ? 'Close chat' : '💬 Open chat'}
          </button>
          {openChat && (
            <ChatPanel applicationId={String(application._id)} />
          )}
        </>
      )}
    </div>
  );
}

export default function ApplicationKanban() {
  const dispatch = useDispatch();
  const { board, loading } = useSelector((state) => state.applications);

  const handleStatusChange = ({ applicationId, status }) => {
    dispatch(updateStatus({ applicationId, status }));
  };

  return (
    <div className="overflow-x-auto pb-4">
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      )}
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map(({ key, label, color }) => {
          const cards = board[key] || [];
          return (
            <div key={key} className="w-72">
              <div
                className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${color}`}
              >
                <h3 className="font-semibold text-slate-700 text-sm">{label}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-3">
                {cards.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No applications</p>
                ) : (
                  cards.map((app) => (
                    <ApplicationCard
                      key={app._id}
                      application={app}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}