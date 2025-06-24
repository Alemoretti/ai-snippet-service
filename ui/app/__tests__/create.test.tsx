import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatePage from '../routes/create';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Create Summary Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactNode) =>
    render(<MemoryRouter>{ui}</MemoryRouter>);

  it('should render the create summary form', () => {
    renderWithRouter(<CreatePage />);
    expect(screen.getByText('Create New Summary')).toBeTruthy();
    expect(screen.getByLabelText(/title/i)).toBeTruthy();
    expect(screen.getByLabelText(/text to summarize/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /get summary/i })).toBeTruthy();
  });

  it('should have required form fields', () => {
    renderWithRouter(<CreatePage />);
    const titleInput = screen.getByLabelText(/title/i);
    const textInput = screen.getByLabelText(/text to summarize/i);
    expect(titleInput).toBeTruthy();
    expect(textInput).toBeTruthy();
  });

  it('should show validation errors for empty required fields', async () => {
    renderWithRouter(<CreatePage />);
    const submitButton = screen.getByRole('button', { name: /get summary/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText(/title is required/i)).toBeTruthy();
      expect(screen.queryByText(/text is required/i)).toBeTruthy();
    });
  });

  it('should submit form with valid data', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: '123',
        title: 'Test Summary',
        code: 'This is some text to summarize',
        language: 'text',
        summary: 'A summary of the text',
        createdAt: new Date().toISOString(),
      }),
    });
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Summary' },
    });
    fireEvent.change(screen.getByLabelText(/text to summarize/i), {
      target: { value: 'This is some text to summarize' },
    });
    const submitButton = screen.getByRole('button', { name: /get summary/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/snippets',
        expect.anything(),
      );
    });
  });

  it('should show loading state during submission', () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Summary' },
    });
    fireEvent.change(screen.getByLabelText(/text to summarize/i), {
      target: { value: 'This is some text to summarize' },
    });
    const submitButton = screen.getByRole('button', { name: /get summary/i });
    fireEvent.click(submitButton);
    expect(screen.getByText(/summarizing/i)).toBeTruthy();
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('should show success message after successful submission', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: '123',
        title: 'Test Summary',
        code: 'This is some text to summarize',
        language: 'text',
        summary: 'A summary of the text',
        createdAt: new Date().toISOString(),
      }),
    });
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Summary' },
    });
    fireEvent.change(screen.getByLabelText(/text to summarize/i), {
      target: { value: 'This is some text to summarize' },
    });
    const submitButton = screen.getByRole('button', { name: /get summary/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText(/text summarized successfully/i)).toBeTruthy();
    });
  });

  it('should show error message on API failure', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => ({ error: 'Invalid data' }),
    });
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Summary' },
    });
    fireEvent.change(screen.getByLabelText(/text to summarize/i), {
      target: { value: 'This is some text to summarize' },
    });
    const submitButton = screen.getByRole('button', { name: /get summary/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText(/failed to summarize text/i)).toBeTruthy();
    });
  });

  it('should clear form after successful submission', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: '123',
        title: 'Test Summary',
        code: 'This is some text to summarize',
        language: 'text',
        summary: 'A summary of the text',
        createdAt: new Date().toISOString(),
      }),
    });
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    const titleInput = screen.getByLabelText(/title/i);
    const textInput = screen.getByLabelText(/text to summarize/i);
    fireEvent.change(titleInput, { target: { value: 'Test Summary' } });
    fireEvent.change(textInput, {
      target: { value: 'This is some text to summarize' },
    });
    const submitButton = screen.getByRole('button', {
      name: /get summary/i,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(textInput.value).toBe('');
    });
  });
});
