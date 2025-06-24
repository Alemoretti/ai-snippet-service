import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test component
function TestComponent() {
  return (
    <div data-testid="test-component">
      <h1>Test Component</h1>
      <p>This is a test</p>
    </div>
  );
}

describe('Testing Setup', () => {
  it('should have vitest working', () => {
    expect(true).toBe(true);
  });

  it('should render a component', () => {
    render(<TestComponent />);
    const element = screen.getByText('Test Component');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Test Component');
  });

  it('should find elements by test ID', () => {
    render(<TestComponent />);
    const element = screen.getByTestId('test-component');
    expect(element).toBeDefined();
    expect(element.textContent).toContain('Test Component');
  });
});
