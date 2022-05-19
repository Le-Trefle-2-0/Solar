import { NextApiRequest, NextApiResponse } from "next";
import session, { sessionAccountWithRoles } from "../interfaces/session";
import type { ObjectShape, OptionalObjectSchema } from "yup/lib/object"
import {ValidationError} from "yup";

export type NextApiRequestWithUser = NextApiRequest & {session: session};

export default function checkSchema<T extends OptionalObjectSchema<ObjectShape>>({body, query}:{body?: T, query?: T}) : (req: NextApiRequestWithUser, res: NextApiResponse, next: () => any)=>Promise<void> {
    return async function(req, res, next) {
        try {
            if(body) req.body = await body.validate(req.body)
            if(query) req.query = await query.validate(req.query)
      
            return next();
          } catch (error) {
            if (error instanceof ValidationError) { 
              return res.status(422).json(error.message)
            }
            return res.status(422).json("")
          }
    }
}