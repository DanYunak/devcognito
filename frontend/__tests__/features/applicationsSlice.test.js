import applicationsReducer, {
  updateStatus,
} from '../../src/features/applications/applicationsSlice';

const makeApp = (id, status, extra = {}) => ({
  _id: id,
  status,
  vacancy_id: 'vacancy_1',
  cover_letter: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  candidate: { profile: { skills: [] } },
  ...extra,
});

const preloadedBoard = {
  new:      [makeApp('app_1', 'new'), makeApp('app_2', 'new')],
  interview:[makeApp('app_3', 'interview')],
  offer:    [],
  rejected: [],
};

const initialState = {
  myApplications: [],
  board: preloadedBoard,
  loading: false,
  error: null,
};

const fulfilled = (payload) =>
  updateStatus.fulfilled(payload, 'requestId', {});

describe('applicationsSlice — updateStatus.fulfilled', () => {
  describe('removes the application from its old column', () => {
    it('removes app_1 from the "new" column', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const ids = state.board.new.map((a) => a._id);
      expect(ids).not.toContain('app_1');
    });

    it('leaves other cards in the same column untouched', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const ids = state.board.new.map((a) => a._id);
      expect(ids).toContain('app_2');
      expect(ids).toHaveLength(1);
    });
  });

  describe('inserts the application into the correct new column', () => {
    it('adds the updated app to the "interview" column', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const ids = state.board.interview.map((a) => a._id);
      expect(ids).toContain('app_1');
    });

    it('adds the updated app to the "offer" column', () => {
      const updatedApp = { ...makeApp('app_1', 'offer') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const ids = state.board.offer.map((a) => a._id);
      expect(ids).toContain('app_1');
    });

    it('adds the updated app to the "rejected" column', () => {
      const updatedApp = { ...makeApp('app_1', 'rejected') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const ids = state.board.rejected.map((a) => a._id);
      expect(ids).toContain('app_1');
    });
  });

  describe('prepends the card to the top of the destination column', () => {
    it('places the moved card at index 0', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      expect(state.board.interview[0]._id).toBe('app_1');
    });

    it('pushes the pre-existing card in the column to index 1', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      // app_3 was already in interview before the move
      expect(state.board.interview[1]._id).toBe('app_3');
    });

    it('destination column has the correct total length', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      expect(state.board.interview).toHaveLength(2);
    });
  });

  describe('preserves the updated payload data', () => {
    it('stores the full updated application object, not just its id', () => {
      const updatedApp = {
        ...makeApp('app_1', 'offer'),
        cover_letter: 'Updated letter',
      };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const stored = state.board.offer.find((a) => a._id === 'app_1');
      expect(stored.cover_letter).toBe('Updated letter');
    });

    it('updates the status field on the stored object', () => {
      const updatedApp = { ...makeApp('app_1', 'rejected') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const stored = state.board.rejected.find((a) => a._id === 'app_1');
      expect(stored.status).toBe('rejected');
    });
  });

  describe('does not mutate unrelated columns', () => {
    it('leaves the "offer" column empty when moving new → interview', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      expect(state.board.offer).toHaveLength(0);
    });

    it('leaves the "rejected" column empty when moving new → interview', () => {
      const updatedApp = { ...makeApp('app_1', 'interview') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      expect(state.board.rejected).toHaveLength(0);
    });

    it('leaves the "interview" source card (app_3) when moving app_1 → offer', () => {
      const updatedApp = { ...makeApp('app_1', 'offer') };
      const state = applicationsReducer(initialState, fulfilled(updatedApp));

      const ids = state.board.interview.map((a) => a._id);
      expect(ids).toContain('app_3');
    });
  });

  describe('immutability', () => {
    it('does not mutate the original state object', () => {
      const frozen = JSON.parse(JSON.stringify(initialState));
      const updatedApp = { ...makeApp('app_1', 'interview') };
      applicationsReducer(initialState, fulfilled(updatedApp));

      expect(initialState.board.new.map((a) => a._id)).toEqual(
        frozen.board.new.map((a) => a._id)
      );
    });
  });
});