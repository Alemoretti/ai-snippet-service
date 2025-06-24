import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SnippetsPage from '../routes/snippets';

global.fetch = vi.fn();

describe('Summary List View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactNode) =>
    render(<MemoryRouter>{ui}</MemoryRouter>);

  it('should render the summary list page', () => {
    renderWithRouter(<SnippetsPage />);
    expect(screen.getByText('Summaries')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    renderWithRouter(<SnippetsPage />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('should fetch summaries from API on mount', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => [
        {
          id: '1',
          title: 'Test Summary 1',
          text: 'This is some text content',
          summary: 'AI generated summary 1',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Test Summary 2',
          text: 'This is more text content',
          summary: 'AI generated summary 2',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ],
    });
    global.fetch = mockFetch;

    renderWithRouter(<SnippetsPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/snippets');
    });
  });

  it('should display summaries after successful API call', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => [
        {
          id: '1',
          title: 'Test Summary 1',
          text: 'This is some text content',
          summary: 'AI generated summary 1',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
    global.fetch = mockFetch;

    renderWithRouter(<SnippetsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Summary 1')).toBeTruthy();
      expect(screen.getByText('AI generated summary 1')).toBeTruthy();
    });
  });

  it('should show error message on API failure', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    global.fetch = mockFetch;

    renderWithRouter(<SnippetsPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load summaries/i)).toBeTruthy();
    });
  });

  it('should have a search input', () => {
    renderWithRouter(<SnippetsPage />);
    expect(screen.getByPlaceholderText(/search summaries/i)).toBeTruthy();
  });

  it('should filter summaries when searching', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => [
        {
          id: '1',
          title: 'JavaScript Summary',
          text: 'Some JavaScript text',
          summary: 'JS summary',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Python Summary',
          text: 'Some Python text',
          summary: 'Python summary',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ],
    });
    global.fetch = mockFetch;

    renderWithRouter(<SnippetsPage />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Summary')).toBeTruthy();
      expect(screen.getByText('Python Summary')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/search summaries/i);
    fireEvent.change(searchInput, { target: { value: 'JavaScript' } });

    expect(screen.getByText('JavaScript Summary')).toBeTruthy();
    expect(screen.queryByText('Python Summary')).toBeNull();
  });
});
