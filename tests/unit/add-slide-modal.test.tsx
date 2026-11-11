import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddSlideModal } from '@/features/creator/components/AddSlideModal';

describe('AddSlideModal (U3)', () => {
  it('displays Add, Find, Import tabs with no AI Generate tab and selects R1 slide types', async () => {
    const user = userEvent.setup();
    const onSelectType = vi.fn();
    const onOpenChange = vi.fn();

    render(<AddSlideModal open onOpenChange={onOpenChange} onSelectType={onSelectType} />);

    expect(screen.getByRole('tab', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Find' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Import' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Generate/i })).toBeNull();

    expect(screen.getByText('Test knowledge')).toBeInTheDocument();
    expect(screen.getByText('Collect opinions')).toBeInTheDocument();
    expect(screen.getByText('Media slides')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /True or false/i }));
    expect(onSelectType).toHaveBeenCalledWith('true_false');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

