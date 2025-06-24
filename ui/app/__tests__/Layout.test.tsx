import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';

describe('Layout', () => {
  const renderWithRouter = (ui: React.ReactNode) =>
    render(<MemoryRouter>{ui}</MemoryRouter>);

  it('should render children content', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="test-content">Test content</div>
      </Layout>,
    );

    const content = screen.getByTestId('test-content');
    expect(content).toBeDefined();
    expect(content.textContent).toBe('Test content');
  });

  it('should render header with logo', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    const logo = screen.getByText('AI Snippet Service');
    expect(logo).toBeDefined();
  });

  it('should render navigation links', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    const homeLink = screen.getByText('Home');
    const snippetsLink = screen.getByText('Snippets');
    const createLink = screen.getByText('Create');

    expect(homeLink).toBeDefined();
    expect(snippetsLink).toBeDefined();
    expect(createLink).toBeDefined();
  });

  it('should render footer', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    const footer = screen.getByText('Summary service powered by AI (OpenAI)');
    expect(footer).toBeDefined();
  });
});
