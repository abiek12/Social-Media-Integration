import * as bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { FORBIDDEN, NOT_AUTHORIZED } from "./common";
import { CustomError } from "./response";
import jwt from "jsonwebtoken";
import { userRoles } from "../users/subscriber/dataModels/enums/userRoles.enums";

export class authUtility {
    public async hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const saltRounds = 10;
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                    reject(err);
                } else {
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(hash);
                        }
                    });
                }
            });
        });
    }

    // Middleware to verify token
    verifyToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
          let token = req.headers.authorization;

          if (!token) {
            res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "Un-Authorized Access"));
            return;
          }

          if (token.startsWith("Bearer ")) {
            token = token.slice(7, token.length).trimLeft();
          }

          const decoded = jwt.verify(token, process.env.jwtSecretKey as string);
          (req as any).user = decoded;

          next(); // Move to the next middleware or route handler
        } catch (error) {
            res.status(NOT_AUTHORIZED).send(CustomError(NOT_AUTHORIZED, "Un-Authorized Token"));
            return;
        }
    };

    // Middleware to check if the user is a subscriber
     isSubscriber = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { userId, role } = (req as any).user;   
          if (!userId || role !== userRoles.SUBSCRIBER) {
            res.status(FORBIDDEN).send(CustomError(FORBIDDEN, "Forbidden"));
            return;
          } 
          next(); // Move to the next middleware or route handler
        } catch (error) {
            console.error(`Error in isSubscriber: ${error}`);
            res.status(FORBIDDEN).send(CustomError(FORBIDDEN, "Error in subscriber check"));
            return;
        }
    };


    comparePassword = async ( rawPassword: string, hashedPassword: string ): Promise<boolean> => {
        try {
          console.log(`rawPassword: ${rawPassword}, hashedPassword: ${hashedPassword}`);
          return await bcrypt.compare(rawPassword, hashedPassword);
        } catch (err) {
          console.error(`Error in comparePassword: ${err}`);
          throw err;
        }
    };

    generateAccessToken = async (userRole: string, userId: number): Promise<string> => {
        try {
          return await jwt.sign({ userId, role: userRole }, process.env.SECRET_KEY as string, { expiresIn: "1h" });
        } catch (err) {
          console.error(`Error in generateAccessToken: ${err}`);
          throw err;
        }
    };

    generateRefreshToken = async (userRole: string, userId: number): Promise<string> => {
        try {
          return await jwt.sign({ userId, role: userRole }, process.env.SECRET_KEY as string, { expiresIn: "7d" });
        } catch (err) {
          console.error(`Error in generateRefreshToken: ${err}`);
          throw err;
        }
    };
}