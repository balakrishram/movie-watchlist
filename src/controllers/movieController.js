import { prisma } from "../config/db.js";

const createMovie = async (req, res) => {
    const { title, overview, releaseYear, genres, runtime, posterUrl  } = req.body;

    // Check if movie already available
    const available = await prisma.movie.findFirst({
      where: {
        title: title,
      },
    });

    if(available){
        return res.status(404).json({
        error: "Movie already in Movielist",
      });
    }
    console.log(req.user);
    const movie = await prisma.movie.create({
      data: {
        title : title,
        overview: overview,
        releaseYear: releaseYear,
        genres: genres,
        runtime: runtime,
        posterUrl: posterUrl,
        creator: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Movie created successfully",
      movie,
    });
}

const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      overview,
      releaseYear,
      genres,
      runtime,
      posterUrl,
    } = req.body;

    // Check movie exists
    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return res.status(404).json({
        error: "Movie not found",
      });
    }

    // Only creator can update
    if (movie.createdBy !== req.user.id) {
      return res.status(403).json({
        error: "Not authorized",
      });
    }

    const updatedMovie = await prisma.movie.update({
      where: { id },
      data: {
        title,
        overview,
        releaseYear,
        genres,
        runtime,
        posterUrl,
      },
    });

    return res.status(200).json({
      message: "Movie updated successfully",
      movie: updatedMovie,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export { createMovie, updateMovie};