import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { compileSketch } from '../services/compiler';

const router = Router();

// Rate limiting: 10 requests per minute per IP
const compileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    errors: [{
      line: 0,
      column: 0,
      message: 'Too many compilation requests from this IP, please try again after a minute.',
      severity: 'error'
    }]
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/compile', compileLimiter, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  try {
    const { code, board } = req.body;

    // Request validation
    if (typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        errors: [{
          line: 0,
          column: 0,
          message: 'Invalid request: "code" field must be a string.',
          severity: 'error'
        }]
      });
    }

    if (code.length === 0 || code.length > 100000) {
      return res.status(400).json({
        success: false,
        errors: [{
          line: 0,
          column: 0,
          message: `Invalid request: "code" length must be between 1 and 100000 characters (got ${code.length}).`,
          severity: 'error'
        }]
      });
    }

    // Call the compiler service
    const result = await compileSketch(code, typeof board === 'string' ? board : 'arduino');
    
    const duration = Date.now() - startTime;
    const resultLog = result.success ? 'success' : `${result.errors?.length || 0} errors`;
    
    console.log(`[Compile] IP: ${ip} | Length: ${code.length} | Result: ${resultLog} | Duration: ${duration}ms`);

    return res.json(result);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Compile] UNEXPECTED ERROR | IP: ${ip} | Duration: ${duration}ms`, error);
    
    return res.status(500).json({
      success: false,
      errors: [{
        line: 0,
        column: 0,
        message: 'Internal server error during compilation process.',
        severity: 'error'
      }]
    });
  }
});

export default router;
