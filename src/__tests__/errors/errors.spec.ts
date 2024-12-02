import { AppError } from '../../errors/api-error';

describe('AppError', () => {
  it('should create an instance with a custom error message', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
  });

  it('should create an instance with a default status code of 400', () => {
    const error = new AppError('Something went wrong');
    expect(error.statusCode).toBe(400);
  });

  it('should create an instance with a custom status code', () => {
    const error = new AppError('Something went wrong', 500);
    expect(error.statusCode).toBe(500);
  });

  it('should extend the built-in Error class', () => {
    const error = new AppError('Something went wrong');
    expect(error instanceof Error).toBe(true);
  });
});