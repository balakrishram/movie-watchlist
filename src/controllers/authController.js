import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

const register = async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await prisma.user.findUnique({ 
        where: { email:email },
    });

    if(userExists) {
        return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    // Generate JWT token
    const token = generateToken(user.id,res);

    res.status(201).json({ 
        status: "success", 
        data: {
            user: {
                id: user.id,
                name: name,
                email: email,
            },
            token: token,   
        },
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists in the table
    const user = await prisma.user.findUnique({ 
        where: { email:email },
    });

    if(!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    // verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user.id,res);

    res.status(200).json({ 
        status: "success", 
        data: {
            user: {
                id: user.id,
                email: user.email,
            },
            token: token,
        },
    });
};

const logout = (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(0), // Set the cookie to expire in the past
    });
    res.status(200).json({ 
        message: "Logged out successfully",
        status: "success",
    });
};

export { register, login, logout };