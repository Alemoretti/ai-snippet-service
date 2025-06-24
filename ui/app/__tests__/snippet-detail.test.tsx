import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SnippetDetailPage from '../routes/snippets.$id';

interface Snippet {
  id: string;
  title: string;
  text: string;
  summary: string;
  createdAt: string;
}

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockSnippet: Snippet = {
  id: '123',
  title: 'Test Snippet',
  text: 'This is a test snippet with some content that should be displayed.',
  summary: 'AI generated summary of the test snippet.',
  createdAt: '2024-01-01T00:00:00Z',
};

function createMockResponse<T>(
  data: T,
  extra: Partial<Response> = {},
): Response {
  return {
    ok: true,
    status: 200,
    async json() {
      await Promise.resolve();
      return data;
    },
    ...extra,
  } as unknown as Response;
}

describe('Snippet Detail View', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should render the snippet detail page', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(mockSnippet));
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Snippet Details')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(
      // Intentionally empty function for never-resolving promise
      () =>
        new Promise(() => {
          /* intentionally empty */
        }) as unknown as Response,
    );
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should fetch snippet data on mount', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(mockSnippet));
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/snippets/123');
    });
  });

  it('should display snippet details after successful fetch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(mockSnippet));
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Test Snippet')).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'This is a test snippet with some content that should be displayed.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('AI generated summary of the test snippet.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('should show error message when snippet is not found', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({}, { ok: false, status: 404 }),
    );
    render(
      <MemoryRouter initialEntries={['/snippets/999']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Snippet not found')).toBeInTheDocument();
    });
  });

  it('should show error message on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Failed to load snippet')).toBeInTheDocument();
    });
  });

  it('should have a back button to return to snippets list', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(mockSnippet));
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('← Back to Summaries')).toBeInTheDocument();
    });
  });

  it('should handle long text content with proper formatting', async () => {
    const longTextSnippet = {
      ...mockSnippet,
      text: 'A'.repeat(500),
    };
    mockFetch.mockResolvedValueOnce(createMockResponse(longTextSnippet));
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(longTextSnippet.title)).toBeInTheDocument();
    });
    expect(screen.getByText(longTextSnippet.text)).toBeInTheDocument();
  });

  it('should handle special characters in snippet content', async () => {
    const specialCharSnippet = {
      ...mockSnippet,
      title: 'Snippet with 🚀 emoji & special chars: !@#$%',
      text: 'Content with unicode: 你好世界 and quotes: "test" \'test\'',
    };
    mockFetch.mockResolvedValueOnce(createMockResponse(specialCharSnippet));
    render(
      <MemoryRouter initialEntries={['/snippets/123']}>
        <Routes>
          <Route path="/snippets/:id" element={<SnippetDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText('Snippet with 🚀 emoji & special chars: !@#$%'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'Content with unicode: 你好世界 and quotes: "test" \'test\'',
      ),
    ).toBeInTheDocument();
  });
});
