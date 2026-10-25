import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentLearningPaths } from '@/components/classroom/StudentLearningPaths';

const db = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: db.from } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/data/tutorials', () => ({ tutorials: [{ id: 'lesson-1', title: 'Fractions', minutes: 5 }] }));
const path = { id: 'path-1', class_id: 'class-1', title: 'Number skills', due_date: null };
const item = { id: 'item-1', path_id: 'path-1', tutorial_id: 'lesson-1', position: 1 };
const classes = [{ id: 'class-1', name: 'Maths' }];
type Result = { data: unknown; error: Error | null };
let replies: Record<string, () => Promise<Result>>;
function deferred() {
  let resolve!: (value: Result) => void;
  const promise = new Promise<Result>((r) => { resolve = r; });
  return { promise, resolve };
}
function mount(userId = 'learner-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const element = (id: string) => <QueryClientProvider client={client}><MemoryRouter><StudentLearningPaths classes={classes} userId={id} /></MemoryRouter></QueryClientProvider>;
  const view = render(element(userId));
  return { ...view, switchUser: (id: string) => view.rerender(element(id)) };
}
beforeEach(() => {
  vi.clearAllMocks();
  replies = {
    class_learning_paths: async () => ({ data: [path], error: null }),
    class_learning_path_items: async () => ({ data: [item], error: null }),
    user_tutorial_progress: async () => ({ data: [{ tutorial_id: 'lesson-1', completed_at: '2026-10-25' }], error: null }),
  };
  db.from.mockImplementation((table: string) => {
    const builder = {
      select: () => builder,
      in: () => builder,
      order: () => builder,
      eq: (...args: unknown[]) => { db.eq(...args); return builder; },
      then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) => replies[table]().then(resolve, reject),
    };
    return builder;
  });
});
afterEach(cleanup);

describe('student learning path loading and recovery', () => {
  it('does not claim completion while lessons are still loading', async () => {
    const pending = deferred();
    replies.class_learning_path_items = () => pending.promise;
    mount();
    await waitFor(() => expect(db.from).toHaveBeenCalledWith('class_learning_path_items'));
    expect(screen.getByRole('status')).toHaveTextContent('learningPaths.loading');
    expect(screen.queryByText('learningPaths.complete')).not.toBeInTheDocument();
    pending.resolve({ data: [item], error: null });
    expect(await screen.findByText('learningPaths.complete')).toBeInTheDocument();
  });
  it('waits for learner progress before showing a completion status', async () => {
    const pending = deferred();
    replies.user_tutorial_progress = () => pending.promise;
    mount();
    await waitFor(() => expect(db.eq).toHaveBeenCalledWith('user_id', 'learner-1'));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('learningPaths.start')).not.toBeInTheDocument();
    pending.resolve({ data: [], error: null });
    expect(await screen.findByText('learningPaths.start')).toBeInTheDocument();
  });
  it.each(['class_learning_paths', 'class_learning_path_items', 'user_tutorial_progress'])('reports and retries a failure in %s', async (table) => {
    const success = replies[table];
    replies[table] = async () => ({ data: null, error: new Error('Offline') });
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('learningPaths.loadFailed');
    expect(screen.queryByText('learningPaths.complete')).not.toBeInTheDocument();
    replies[table] = success;
    fireEvent.click(screen.getByText('common.retry'));
    expect(await screen.findByText('learningPaths.complete')).toBeInTheDocument();
  });
  it('does not mark an empty path complete', async () => {
    replies.class_learning_path_items = async () => ({ data: [], error: null });
    mount();
    expect(await screen.findByText('learningPaths.noLessons')).toBeInTheDocument();
    expect(screen.queryByText('learningPaths.complete')).not.toBeInTheDocument();
    expect(db.from).not.toHaveBeenCalledWith('user_tutorial_progress');
  });
  it('does not query or display paths for a signed-out learner', () => {
    mount('');
    expect(db.from).not.toHaveBeenCalled();
    expect(screen.queryByText('Number skills')).not.toBeInTheDocument();
  });
  it('does not reuse another learner’s cached lessons after an account switch', async () => {
    const view = mount();
    await screen.findByText('learningPaths.complete');
    const pending = deferred();
    replies.class_learning_path_items = () => pending.promise;
    view.switchUser('learner-2');
    await waitFor(() => expect(db.from.mock.calls.filter(([table]) => table === 'class_learning_path_items')).toHaveLength(2));
    expect(screen.queryByText('learningPaths.complete')).not.toBeInTheDocument();
    pending.resolve({ data: [], error: null });
    expect(await screen.findByText('learningPaths.noLessons')).toBeInTheDocument();
  });
});
