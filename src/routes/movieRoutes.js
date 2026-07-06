import express from "express";
import { createMovie,updateMovie } from "../controllers/movieController.js";

import { validateRequest } from "../middleware/validateRequest.js";
import { createMovieSchema, updateMovieSchema } from "../validators/movieValidators.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",authMiddleware,validateRequest(createMovieSchema),createMovie);

router.put("/:id",authMiddleware,validateRequest(updateMovieSchema),updateMovie);

export default router;