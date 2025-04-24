import React, { useEffect, useState, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Pagination from "@material-ui/lab/Pagination";
import {
  Container,
  createTheme,
  TableCell,
  LinearProgress,
  ThemeProvider,
  Typography,
  TextField,
  TableBody,
  TableRow,
  TableHead,
  TableContainer,
  Table,
  Paper,
  Box,
} from "@material-ui/core";
import axios from "axios";
import { CoinList } from "../config/api";
import { useHistory } from "react-router-dom";
import { CryptoState } from "../CryptoContext";

// Helper function for formatting large numbers with commas and suffixes (M, B, T)
export function formatLargeNumber(num, currencySymbol = '') {
  if (num == null) return "N/A"; // Handle null or undefined input

  const absNum = Math.abs(num);
  let formattedNum;
  let suffix = '';

  if (absNum >= 1e12) { // Trillions
    formattedNum = (num / 1e12).toFixed(2);
    suffix = 'T';
  } else if (absNum >= 1e9) { // Billions
    formattedNum = (num / 1e9).toFixed(2);
    suffix = 'B';
  } else if (absNum >= 1e6) { // Millions
    formattedNum = (num / 1e6).toFixed(2);
    suffix = 'M';
  } else { // Less than a million
    // Decide if you want decimals for smaller numbers
    formattedNum = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Add commas to the number part before the suffix (if not already handled by toLocaleString)
  if (suffix) {
      const parts = formattedNum.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      formattedNum = parts.join('.');
  }


  return `${currencySymbol} ${formattedNum}${suffix}`;
}

// Original numberWithCommas (keep if used elsewhere, otherwise remove)
export function numberWithCommas(x) {
  if (x == null) return ""; // Handle null or undefined input
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


// Define items per page as a constant
const ITEMS_PER_PAGE = 10;

export default function CoinsTable() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { currency, symbol } = CryptoState();
  const history = useHistory();

  const useStyles = makeStyles((theme) => ({
    row: {
      backgroundColor: "#16171a",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#131111",
      },
      fontFamily: "Montserrat",
    },
    pagination: {
      "& .MuiPaginationItem-root": {
        color: "gold",
      },
    },
    tableHeadCell: {
      color: "black",
      fontWeight: "700",
      fontFamily: "Montserrat",
    },
    coinSymbol: {
      textTransform: "uppercase",
      fontSize: 22,
    },
    coinName: {
      color: "darkgrey",
    },
    profitText: {
      color: "rgb(14, 203, 129)",
      fontWeight: 500,
    },
    lossText: {
      color: "red",
      fontWeight: 500,
    },
    tableContainer: {},
    searchField: {
      marginBottom: 20,
      width: "100%",
    },
    title: {
      margin: 18,
      fontFamily: "Montserrat",
    },
    loadingErrorContainer: {
      padding: theme.spacing(3),
      textAlign: 'center',
    }
  }));

  const classes = useStyles();

  const darkTheme = createTheme({
    palette: {
      primary: {
        main: "#fff",
      },
      type: "dark",
    },
  });

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(CoinList(currency));
      setCoins(data);
    } catch (err) {
      console.error("Error fetching coins:", err);
      setError("Failed to load coin data. Please try again later.");
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const filteredCoins = useMemo(() => {
    if (!coins) return [];
    const searchTerm = search.toLowerCase();
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(searchTerm) ||
        coin.symbol.toLowerCase().includes(searchTerm)
    );
  }, [coins, search]);

  useEffect(() => {
    setPage(1);
  }, [search, currency]);

  const pageCount = Math.ceil(filteredCoins.length / ITEMS_PER_PAGE);

  const paginatedCoins = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCoins.slice(startIndex, endIndex);
  }, [filteredCoins, page]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    window.scroll(0, 450);
  };

  const handleRowClick = (id) => {
    history.push(`/coins/${id}`);
  };

  const tableHeaders = ["Coin", "Price", "24h Change", "Market Cap"];

  return (
    <ThemeProvider theme={darkTheme}>
      <Container style={{ textAlign: "center" }}>
        <Typography variant="h4" className={classes.title}>
          Cryptocurrency Prices by Market Cap
        </Typography>
        <TextField
          label="Search For a Crypto Currency.."
          variant="outlined"
          className={classes.searchField}
          value={search}
          onChange={handleSearchChange}
        />
        <TableContainer component={Paper} className={classes.tableContainer}>
          {loading ? (
            <LinearProgress style={{ backgroundColor: "gold" }} />
          ) : error ? (
            <Box className={classes.loadingErrorContainer}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <Table aria-label="Cryptocurrency table">
              <TableHead style={{ backgroundColor: "#EEBC1D" }}>
                <TableRow>
                  {tableHeaders.map((head) => (
                    <TableCell
                      className={classes.tableHeadCell}
                      key={head}
                      align={head === "Coin" ? "left" : "right"}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedCoins.length > 0 ? (
                  paginatedCoins.map((row) => {
                    if (!row || !row.id || !row.name || !row.symbol || row.current_price == null || row.price_change_percentage_24h == null || row.market_cap == null) {
                      console.warn("Skipping row with incomplete data:", row);
                      return null;
                    }

                    const profit = row.price_change_percentage_24h > 0;
                    const priceChangeStyle = profit ? classes.profitText : classes.lossText;

                    return (
                      <TableRow
                        onClick={() => handleRowClick(row.id)}
                        className={classes.row}
                        key={row.id}
                        hover
                        role="link"
                      >
                        <TableCell component="th" scope="row">
                          <Box display="flex" alignItems="center" gap={2}>
                            <img
                              src={row.image}
                              alt={row.name}
                              height="50"
                            />
                            <Box>
                              <Typography component="span" className={classes.coinSymbol}>
                                {row.symbol}
                              </Typography>
                              <Typography component="div" className={classes.coinName}>
                                {row.name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {symbol}{" "}
                          {/* Using original numberWithCommas for price */}
                          {numberWithCommas(row.current_price.toFixed(2))}
                        </TableCell>
                        <TableCell align="right" className={priceChangeStyle}>
                          {profit && "+"}
                          {row.price_change_percentage_24h.toFixed(2)}%
                        </TableCell>
                        <TableCell align="right">
                          {/* Use the new formatting function */}
                          {formatLargeNumber(row.market_cap, symbol)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} align="center">
                      No coins found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {!loading && !error && pageCount > 1 && (
          <Pagination
            count={pageCount}
            page={page}
            style={{
              padding: 20,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
            classes={{ ul: classes.pagination }}
            onChange={handlePageChange}
          />
        )}
      </Container>
    </ThemeProvider>
  );
}
