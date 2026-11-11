import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerTile } from '@/components/eroot/AnswerTile';
import { ANSWER_TILE_THEMES } from '@shared/constants/answer-tiles';

describe('AnswerTile', () => {
  it('renders distinct geometric shapes, letters, and accessible labels for tiles 0..3', () => {
    render(
      <div>
        <AnswerTile index={0} label="Paris" />
        <AnswerTile index={1} label="Madrid" />
        <AnswerTile index={2} label="Rabat" />
        <AnswerTile index={3} label="Lisbon" />
      </div>
    );

    expect(screen.getByTestId('answer-tile-A')).toHaveAttribute('data-shape', 'triangle');
    expect(screen.getByTestId('answer-tile-B')).toHaveAttribute('data-shape', 'diamond');
    expect(screen.getByTestId('answer-tile-C')).toHaveAttribute('data-shape', 'circle');
    expect(screen.getByTestId('answer-tile-D')).toHaveAttribute('data-shape', 'square');

    expect(screen.getByRole('button', { name: /Option A \(triangle\): Paris/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Option C \(circle\): Rabat/i })).toBeInTheDocument();
  });

  it('uses dark foreground ink on bright yellow tile for WCAG AA contrast', () => {
    const yellowTile = ANSWER_TILE_THEMES[2]!;
    expect(yellowTile.colorName).toBe('Yellow');
    expect(yellowTile.fgHex).toBe('#0f172a');
  });

  it('fires onClick when interactive and ignores clicks when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const { rerender } = render(<AnswerTile index={0} label="Alpha" onClick={onClick} />);
    await user.click(screen.getByTestId('answer-tile-A'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<AnswerTile index={0} label="Alpha" disabled onClick={onClick} />);
    await user.click(screen.getByTestId('answer-tile-A'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

