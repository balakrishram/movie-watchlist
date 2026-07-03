import { z } from "zod";

export const addToWatchlistSchema = z.object({
  movieId: z.string().uuid(),
  status: z.enum(["PLANNED", "WATCHING", "DROPPED", "COMPLETED"],{
    error: () => ({
        message: "Status must be one of PLANNED, WATCHING, DROPPED, or COMPLETED",
    })
  }).optional(),
  rating: z.coerce.number().int("Rating must be a whole number").min(1,"Rating must be between 1 and 10").max(10,"Rating must be between 1 and 10").optional(),
  notes: z.string().max(200).optional(),
});