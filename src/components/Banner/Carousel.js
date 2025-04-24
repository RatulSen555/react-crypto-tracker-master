import { makeStyles, CircularProgress, Typography } from "@material-ui/core"; // Removed Box
import axios from "axios";
import { useEffect, useState } from "react";
import AliceCarousel from "react-alice-carousel";
import { Link } from "react-router-dom";
import { TrendingCoins } from "../../config/api"; // Ensure this uses relative path for proxy
import { CryptoState } from "../../CryptoContext";
import { numberWithCommas } from "../CoinsTable"; // Assuming this is still needed for price

const Carousel = () => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(null); // Added error state
  const { currency, symbol } = CryptoState();

  const useStyles = makeStyles((theme) => ({
    carousel: {
      height: "50%",
      display: "flex",
      alignItems: "center",
    },
    carouselItem: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      textTransform: "uppercase",
      color: "white",
      textDecoration: "none", // Remove underline from Link
    },
    errorText: { // Style for error message
        color: theme.palette.error.main,
        textAlign: 'center',
        marginTop: theme.spacing(2),
    }
  }));

  const classes = useStyles();

  const fetchTrendingCoins = async () => {
    setLoading(true);
    setError(null); // Reset error on new fetch
    try {
      // Ensure TrendingCoins(currency) returns a relative path like /api/v3/...
      const { data } = await axios.get(TrendingCoins(currency));
      setTrending(data);
    } catch (err) {
      console.error("Error fetching trending coins:", err); // Keep console error for debugging
      setError("Could not load trending coins."); // Set user-facing error message
      setTrending([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingCoins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]); // Dependency array is correct

  // Map items only if trending data is available
  const items = trending.map((coin) => {
    // Basic check for essential data
    if (!coin || !coin.id || !coin.name || coin.price_change_percentage_24h == null || coin.current_price == null) {
        console.warn("Skipping carousel item with incomplete data:", coin);
        return null; // Or render a placeholder/error item
    }

    let profit = coin.price_change_percentage_24h >= 0;

    return (
      <Link className={classes.carouselItem} to={`/coins/${coin.id}`} key={coin.id}> {/* Added key prop */}
        <img
          src={coin.image} // Optional chaining might not be needed if check above is done
          alt={coin.name}
          height="80"
          style={{ marginBottom: 10 }}
        />
        <span>
          {coin.symbol}
          &nbsp;
          <span
            style={{
              // Simplified profit check
              color: profit ? "rgb(14, 203, 129)" : "red",
              fontWeight: 500,
            }}
          >
            {profit && "+"}
            {coin.price_change_percentage_24h.toFixed(2)}%
          </span>
        </span>
        <span style={{ fontSize: 22, fontWeight: 500 }}>
          {symbol} {numberWithCommas(coin.current_price.toFixed(2))}
        </span>
      </Link>
    );
  }).filter(item => item !== null); // Filter out any null items from the map

  const responsive = {
    0: {
      items: 2,
    },
    512: {
      items: 4,
    },
  };

  // Handle loading and error states
  if (loading) {
    return <CircularProgress style={{ color: "gold" }} />;
  }

  if (error) {
    return <Typography className={classes.errorText}>{error}</Typography>;
  }

  return (
    <div className={classes.carousel}>
      {items.length > 0 ? ( // Render carousel only if items exist
        <AliceCarousel
          mouseTracking
          infinite
          autoPlayInterval={1000}
          animationDuration={1500}
          disableDotsControls
          disableButtonsControls
          responsive={responsive}
          items={items}
          autoPlay
        />
      ) : (
        // Optional: Display a message if no trending coins loaded (and no error)
        <Typography style={{ textAlign: 'center', width: '100%' }}>
          No trending coins available.
        </Typography>
      )}
    </div>
  );
};

export default Carousel;
