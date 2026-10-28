import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SkipToContent } from '@/components/layout/SkipToContent';
import { emptyResponse, inspectQuestion, isCorrectResponse } from '@/lib/qaEngine';
import { buildRevisionWeek } from '@/lib/revisionWeek';
import type { MasteryEvidence } from '@/lib/educationBridge';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
afterEach(cleanup);
describe('learning and accessibility fixes', () => {
  it('announces navigation and current page without duplicate image labels', () => {
    render(<MemoryRouter initialEntries={['/subjects']}><MobileBottomNav /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'nav.mobileNavigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nav.subjects' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'nav.aiTutor' })).toHaveAccessibleName('nav.aiTutor');
    expect(screen.queryByRole('link', { name: 'nav.dashboard' })).not.toBeInTheDocument();
  });
  it('does not mark an unrelated prefix route as active', () => {
    render(<MemoryRouter initialEntries={['/subjects-other']}><MobileBottomNav /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'nav.subjects' })).not.toHaveAttribute('aria-current');
  });
  it('moves focus to a main element without requiring an id', () => {
    render(<><SkipToContent /><div id="app-content"><main>Lesson</main></div></>);
    const main = screen.getByRole('main'); main.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole('link', { name: 'nav.skipToContent' }));
    expect(main).toHaveFocus();
  });
  it('falls back to the content wrapper when there is no main', () => {
    render(<><SkipToContent /><div id="app-content">Lesson</div></>);
    const target = document.getElementById('app-content')!; target.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole('link', { name: 'nav.skipToContent' }));
    expect(target).toHaveFocus();
  });
  it('rejects invalid numeric input and tolerance while accepting decimal formats', () => {
    const q = { question: 'What is the decimal value?', options: [], answer: '16', explanation: 'The value is sixteen.', format: 'numeric' as const };
    const response = emptyResponse(q);
    expect(isCorrectResponse(q, {...response, freeText: '0x10'})).toBe(false);
    expect(isCorrectResponse(q, {...response, freeText: '16,0'})).toBe(true);
    expect(isCorrectResponse(q, {...response, freeText: '1.6e1'})).toBe(true);
    expect(isCorrectResponse({...q, tolerance: Infinity}, {...response, freeText: '20'})).toBe(false);
    expect(inspectQuestion({...q, answer: ' '})).toContain('numeric answer invalid');
  });
  it('keeps other revision topics and schedules a single follow-up for duplicated evidence', () => {
    const row: MasteryEvidence = { curriculum: 'gcse', subject: 'maths', topic: 'Algebra', mastery_score: 10, confidence_score: 50, attempts: 4, correct_attempts: 2, next_review_at: '2026-10-16' };
    const plan = buildRevisionWeek([...Array.from({length:12}, () => ({...row})), {...row, topic:'Graphs'}], new Date('2026-10-17T12:00:00Z'));
    expect(plan.totalTopics).toBe(2);
    expect(plan.dates.flatMap(d => d.tasks).filter(t => t.topic === 'Algebra' && t.reason === 'follow-up')).toHaveLength(1);
  });
});
