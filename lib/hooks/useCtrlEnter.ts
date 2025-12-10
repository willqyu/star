import { useEffect } from 'react';

/**
 * Hook to submit a form when Ctrl+Enter is pressed
 * @param formRef - Reference to the form element or null/undefined
 */
export function useCtrlEnter(formRef: React.RefObject<HTMLFormElement> | null | undefined) {
  useEffect(() => {
    if (!formRef?.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const submitButton = formRef.current?.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.click();
        }
      }
    };

    const form = formRef.current;
    form.addEventListener('keydown', handleKeyDown);

    return () => {
      form.removeEventListener('keydown', handleKeyDown);
    };
  }, [formRef]);
}
