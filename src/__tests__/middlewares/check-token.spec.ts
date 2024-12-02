import { describe, it, expect, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { checkToken } from '../../middlewares/check-token'
import { getToken } from '../../utils/get-token'
import { verifyToken } from '../../utils/verify-token'

vi.mock('../../utils/get-token')
vi.mock('../../utils/verify-token')

describe('checkToken middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks(); 
  });

  it('should return 401 if no token is provided', () => {
    vi.mocked(getToken).mockReturnValue(null);

    checkToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Acesso negado!' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next if token is valid', () => {
    vi.mocked(getToken).mockReturnValue('valid-token');
    vi.mocked(verifyToken).mockImplementation(() => {
      return {
        userId: 'user-id',
        name: 'John Doe',
        email: 'jdoe@example.com'
      }
    })

    checkToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should return 400 if token is invalid', () => {
    vi.mocked(getToken).mockReturnValue('invalid-token');
    vi.mocked(verifyToken).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    checkToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Token inválido!',
      err: expect.any(Error),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
})