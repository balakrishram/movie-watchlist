import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

//Read the token from the request
//Check if the token is valid
export const authMiddleware = async (req, res, next) => {
    console.log("authMiddleware called");
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    } else if(req.cookies?.jwt){
        token = req.cookies.jwt;
    }

    if(!token){
        return res.status(401).json({error: "Not authorized, no token provided"});
    }

    try{
        //Verify the token and extract the userId
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({where: {id: decoded.id}});

        if(!user){
            return res.status(401).json({error: "User not longer exists"});
        }

        req.user = user;
        next();
    } catch(err){
        console.error(err);
        return res.status(401).json({error: "Not authorized, token failed"});
    }
};