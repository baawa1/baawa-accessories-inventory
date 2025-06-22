import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveTextContent(text?: string | RegExp): R;
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveValue(value?: string | number | string[]): R;
      toBeChecked(): R;
      toHaveFocus(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
    }
  }
}
