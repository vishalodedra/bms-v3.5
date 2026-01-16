/**
 * Wizard UX Guardrails
 * Shared helper functions for consistent wizard behavior.
 * Adoption is optional for existing flows.
 * @foundation V34-STAB-BP-02
 */

export type WizardActionType = 'BACK' | 'RESET' | 'SAVE' | 'NEXT' | 'SUBMIT' | 'CLOSE';

/**
 * Returns a standardized sort order for footer actions.
 * Order: RESET -> BACK -> SAVE -> [NEXT/SUBMIT] -> CLOSE
 */
export function standardFooterOrder(actions: WizardActionType[]): WizardActionType[] {
  const order: WizardActionType[] = ['RESET', 'BACK', 'SAVE', 'NEXT', 'SUBMIT', 'CLOSE'];
  return [...actions].sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    // If not found in order, push to end
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

/**
 * Identifies if an action is the primary "moving forward" action.
 */
export function isPrimaryAction(action: WizardActionType): boolean {
  return action === 'NEXT' || action === 'SUBMIT';
}

/**
 * Returns a generic title for common wizard steps if not provided by the model.
 */
export function getDefaultStepTitle(stepId: string): string {
  const titles: Record<string, string> = {
    'DRAFT': 'Draft Parameters',
    'REVIEW': 'Verification Review',
    'APPROVAL': 'Final Authorization',
    'EXECUTION': 'Operational Step',
    'COMPLETION': 'Flow Finalized'
  };
  return titles[stepId.toUpperCase()] || 'Workflow Step';
}

/**
 * Logic gate for disabling navigation buttons.
 */
export function shouldDisableNext(isValid: boolean, isLoading: boolean = false): boolean {
  return !isValid || isLoading;
}
