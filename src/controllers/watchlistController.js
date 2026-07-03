import { prisma } from "../config/db.js";

const addToWatchlist = async (req, res) => {
  try {
    const { movieId, status, rating, notes } = req.body;

    // Verify movie exists
    const movie = await prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      return res.status(404).json({
        error: "Movie not found",
      });
    }

    const existingInWatchlist = await prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId: movieId,
        },
      },
    });

    if (existingInWatchlist) {
      return res.status(404).json({
        error: "Movie already exists in the watchlist",
      });
    }

    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        userId : req.user.id,
        movieId,
        status: status || "PLANNED",
        rating,
        notes,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        watchlistItem,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const removeFromWatchlist = async (req, res) => {
  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!watchlistItem) {
    return res.status(404).json({
      error: "Watchlist item not found",
    });
  }

  // Ensure only owner can delete their watchlist item
  if (watchlistItem.userId !== req.user.id) {
    return res.status(403).json({
      error: "You are not authorized to delete this watchlist item",
    });
  }

  await prisma.watchlistItem.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Watchlist item removed successfully",
    data: {
      watchlistItem,
    },
  });
};

const updateWatchlistItem = async (req, res) => {
  const { status, rating, notes } = req.body;
  
  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if(!watchlistItem) {
    return res.status(404).json({
      error: "Watchlist item not found",
    });
  }

  // Ensure only owner can update their watchlist item
  if (watchlistItem.userId !== req.user.id) {
    return res.status(403).json({
      error: "You are not authorized to update this watchlist item",
    });
  }

  const updatedWatchlistItem = await prisma.watchlistItem.update({
    where: {
      id: req.params.id,
    },
    data: {
      status,
      rating,
      notes,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Watchlist item updated successfully",
    data: {
      watchlistItem: updatedWatchlistItem,
    },
  });
};

export { addToWatchlist,removeFromWatchlist,updateWatchlistItem };