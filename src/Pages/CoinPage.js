// src/Pages/CoinPage.js
import { LinearProgress, makeStyles, Typography } from "@material-ui/core"; // Removed Box
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import parse from 'html-react-parser';
import CoinInfo from "../components/CoinInfo";
import { SingleCoin } from "../config/api"; // Ensure this uses relative path
// Import formatting functions from CoinsTable
import { numberWithCommas, formatLargeNumber } from "../components/CoinsTable";
import { CryptoState } from "../CryptoContext";

const CoinPage = () => {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { currency, symbol } = CryptoState();

  const useStyles = makeStyles((theme) => ({
    container: {
      display: "flex",
      [theme.breakpoints.down("md")]: {
        flexDirection: "column",
        alignItems: "center",
      },
    },
    sidebar: {
      width: "30%",
      [theme.breakpoints.down("md")]: {
        width: "100%",
        borderRight: "none",
      },
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: 25,
      borderRight: "2px solid grey",
    },
    heading: {
      fontWeight: "bold",
      marginBottom: 20,
      fontFamily: "Montserrat",
    },
    description: {
      width: "100%",
      fontFamily: "Montserrat",
      padding: 25,
      paddingBottom: 15,
      paddingTop: 0,
      textAlign: "justify",
    },
    marketData: {
      alignSelf: "start",
      padding: 25,
      paddingTop: 10,
      width: "100%",
      [theme.breakpoints.down("md")]: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 15,
      },
      [theme.breakpoints.down("xs")]: {
        alignItems: "start",
      },
    },
    loadingErrorContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        width: '100%',
    },
    errorText: {
        color: theme.palette.error.main,
        textAlign: 'center',
    }
  }));

  const classes = useStyles();

  const fetchCoin = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setCoin(null);

    try {
      // This relies on SingleCoin using a relative path from api.js
      const { data } = await axios.get(SingleCoin(id));
      setCoin(data);
    } catch (err) {
      console.error("Error fetching coin data:", err);
      if (err.response && err.response.status === 429) {
          setError(`Too many requests for ${id}. Please wait a moment.`);
      } else if (err.response && err.response.status === 404) {
          setError(`Coin with ID '${id}' not found.`);
      } else {
          // Check if it's a CORS error (often shows as Network Error)
          if (err.message === 'Network Error' && !err.response) {
             setError(`CORS Error: Ensure api.js uses relative paths and proxy is set.`);
          } else {
             setError(`Could not load data for ${id}.`);
          }
      }
      setCoin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currency]);

  if (loading) {
    return (
        <div className={classes.loadingErrorContainer}>
            <LinearProgress style={{ backgroundColor: "gold", width: '80%' }} />
        </div>
    );
  }

  if (error) {
      return (
          <div className={classes.loadingErrorContainer}>
              <Typography className={classes.errorText}>{error}</Typography>
          </div>
      );
  }

  if (!coin) {
      return (
          <div className={classes.loadingErrorContainer}>
              <Typography>Coin data not available.</Typography>
          </div>
      );
  }

  const descriptionText = coin.description?.en?.split(". ")[0] || '';
  const currentPrice = coin.market_data?.current_price?.[currency.toLowerCase()];
  const marketCap = coin.market_data?.market_cap?.[currency.toLowerCase()];
  // Now formatLargeNumber is imported and can be used directly
  const formattedMarketCap = formatLargeNumber(marketCap, symbol);


  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <img
          src={coin.image?.large}
          alt={coin.name || 'Coin image'}
          height="200"
          style={{ marginBottom: 20 }}
        />
        <Typography variant="h3" className={classes.heading}>
          {coin.name}
        </Typography>
        {descriptionText && (
            <Typography variant="subtitle1" className={classes.description}>
                {parse(descriptionText)}.
            </Typography>
        )}
        <div className={classes.marketData}>
          <span style={{ display: "flex", alignItems: 'baseline' }}>
            <Typography variant="h5" className={classes.heading}>
              Rank:
            </Typography>
            &nbsp; &nbsp;
            <Typography
              variant="h5"
              style={{ fontFamily: "Montserrat" }}
            >
              {coin.market_cap_rank ? numberWithCommas(coin.market_cap_rank) : 'N/A'}
            </Typography>
          </span>

          <span style={{ display: "flex", alignItems: 'baseline' }}>
            <Typography variant="h5" className={classes.heading}>
              Current Price:
            </Typography>
            &nbsp; &nbsp;
            <Typography
              variant="h5"
              style={{ fontFamily: "Montserrat" }}
            >
              {symbol}{" "}
              {currentPrice ? numberWithCommas(currentPrice.toFixed(2)) : 'N/A'}
            </Typography>
          </span>
          <span style={{ display: "flex", alignItems: 'baseline' }}>
            <Typography variant="h5" className={classes.heading}>
              Market Cap:
            </Typography>
            &nbsp; &nbsp;
            <Typography
              variant="h5"
              style={{ fontFamily: "Montserrat" }}
            >
              {/* Use the imported function */}
              {formattedMarketCap}
            </Typography>
          </span>
        </div>
      </div>
      <CoinInfo coin={coin} />
    </div>
  );
};

export default CoinPage;
