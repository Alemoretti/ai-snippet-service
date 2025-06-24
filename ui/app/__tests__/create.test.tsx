import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatePage from '../routes/create';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Create Snippet Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactNode) =>
    render(<MemoryRouter>{ui}</MemoryRouter>);

  it('should render the create snippet form', () => {
    renderWithRouter(<CreatePage />);
    expect(screen.getByText('Create New Snippet')).toBeTruthy();
    expect(screen.getByLabelText(/title/i)).toBeTruthy();
    expect(screen.getByLabelText(/code/i)).toBeTruthy();
    expect(screen.getByLabelText(/language/i)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /create snippet/i }),
    ).toBeTruthy();
  });

  it('should have required form fields', () => {
    renderWithRouter(<CreatePage />);
    const titleInput = screen.getByLabelText(/title/i);
    const codeInput = screen.getByLabelText(/code/i);
    const languageSelect = screen.getByLabelText(/language/i);
    expect(titleInput).toBeTruthy();
    expect(codeInput).toBeTruthy();
    expect(languageSelect).toBeTruthy();
  });

  it('should show validation errors for empty required fields', async () => {
    renderWithRouter(<CreatePage />);
    const submitButton = screen.getByRole('button', {
      name: /create snippet/i,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText(/title is required/i)).toBeTruthy();
      expect(screen.queryByText(/code is required/i)).toBeTruthy();
      expect(screen.queryByText(/language is required/i)).toBeTruthy();
    });
  });

  it('should submit form with valid data', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: '123',
        title: 'Test Snippet',
        code: 'console.log("hello")',
        language: 'javascript',
        summary: 'A simple console log statement',
        createdAt: new Date().toISOString(),
      }),
    });
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Snippet' },
    });
    fireEvent.change(screen.getByLabelText(/code/i), {
      target: { value: 'console.log("hello")' },
    });
    fireEvent.change(screen.getByLabelText(/language/i), {
      target: { value: 'javascript' },
    });
    const submitButton = screen.getByRole('button', {
      name: /create snippet/i,
    });
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
      target: { value: 'Test Snippet' },
    });
    fireEvent.change(screen.getByLabelText(/code/i), {
      target: { value: 'console.log("hello")' },
    });
    fireEvent.change(screen.getByLabelText(/language/i), {
      target: { value: 'javascript' },
    });
    const submitButton = screen.getByRole('button', {
      name: /create snippet/i,
    });
    fireEvent.click(submitButton);
    expect(screen.getByText(/creating/i)).toBeTruthy();
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('should show success message after successful submission', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: '123',
        title: 'Test Snippet',
        code: 'console.log("hello")',
        language: 'javascript',
        summary: 'A simple console log statement',
        createdAt: new Date().toISOString(),
      }),
    });
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Snippet' },
    });
    fireEvent.change(screen.getByLabelText(/code/i), {
      target: { value: 'console.log("hello")' },
    });
    fireEvent.change(screen.getByLabelText(/language/i), {
      target: { value: 'javascript' },
    });
    const submitButton = screen.getByRole('button', {
      name: /create snippet/i,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText(/snippet created successfully/i)).toBeTruthy();
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
      target: { value: 'Test Snippet' },
    });
    fireEvent.change(screen.getByLabelText(/code/i), {
      target: { value: 'console.log("hello")' },
    });
    fireEvent.change(screen.getByLabelText(/language/i), {
      target: { value: 'javascript' },
    });
    const submitButton = screen.getByRole('button', {
      name: /create snippet/i,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText(/failed to create snippet/i)).toBeTruthy();
    });
  });

  it('should clear form after successful submission', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: '123',
        title: 'Test Snippet',
        code: 'console.log("hello")',
        language: 'javascript',
        summary: 'A simple console log statement',
        createdAt: new Date().toISOString(),
      }),
    });
    global.fetch = mockFetch;
    renderWithRouter(<CreatePage />);
    const titleInput = screen.getByLabelText(/title/i);
    const codeInput = screen.getByLabelText(/code/i);
    const languageSelect = screen.getByLabelText(/language/i);
    fireEvent.change(titleInput, { target: { value: 'Test Snippet' } });
    fireEvent.change(codeInput, { target: { value: 'console.log("hello")' } });
    fireEvent.change(languageSelect, { target: { value: 'javascript' } });
    const submitButton = screen.getByRole('button', {
      name: /create snippet/i,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect((titleInput as HTMLInputElement).value).toBe('');
      expect((codeInput as HTMLInputElement).value).toBe('');
      expect((languageSelect as HTMLSelectElement).value).toBe('');
    });
  });
});
