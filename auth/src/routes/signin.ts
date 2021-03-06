import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { validationRequest } from '../middlewares/validate-requests';
import { User } from '../models/user';
import { Password } from '../util/password';
import { BadRequestError } from '../errors/bad-request-error';

const router = express.Router();

router.post('/api/users/signin', 
  [
    body('email')
      .isEmail()
      .withMessage('Email must be valid'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('You must supply a password')
  ],
  validationRequest,
  async (req: Request, res: Response) => {
    const { email, password} = req.body;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }
    
    const passwordsMatch = await Password.compare(
      existingUser.password, 
      password
    );
    
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid Credentials');
    }

    const userJwt = jwt.sign(
      {
      id: existingUser.id,
      email: existingUser.email
      }, 
      process.env.JWT_KEY!
    );
    // Store it on seesion object
    req.session = {
      jwt: userJwt
    };

    res.status(200).send(existingUser);
  }
);

export { router as signinRouter };