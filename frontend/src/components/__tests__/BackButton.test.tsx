import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackButton from '../BackButton';

const backMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: backMock }),
}));

describe('BackButton', () => {
  it('renders a "Back" label', () => {
    render(<BackButton />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('navigates back on click', async () => {
    const user = userEvent.setup();
    render(<BackButton />);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
