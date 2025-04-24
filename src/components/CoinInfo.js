// src/components/CoinInfo.js
import axios from "axios";
import { useEffect, useState } from "react";
import { HistoricalChart } from "../config/api"; // Ensure this uses relative path
import { Line } from "react-chartjs-2";
import {
  CircularProgress,
  createTheme,
  makeStyles,
  ThemeProvider,
  Typography, // Added Typography for error message
} from "@material-ui/core";
import SelectButton from "./SelectButton";
import { chartDays } from "../config/data";
import { CryptoState } from "../CryptoContext";
// Required for Chart.js v3+ integration with react-chartjs-2
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


const CoinInfo = ({ coin }) => {
  const [historicData, setHistoricData] = useState();
  const [days, setDays] = useState(1);
  const { currency } = CryptoState();
  // --- Removed flag state ---
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(null); // Added error state

  const useStyles = makeStyles((theme) => ({
    container: {
      width: "75%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
      padding: 40,
      [theme.breakpoints.down("md")]: {
        width: "100%",
        marginTop: 0,
        padding: 20,
        paddingTop: 0,
      },
    },
    errorText: { // Style for error message
        color: theme.palette.error.main,
        textAlign: 'center',
        marginTop: theme.spacing(2),
    },
    buttonsContainer: { // Style for buttons
        display: "flex",
        marginTop: 20,
        justifyContent: "space-around",
        width: "100%",
    }
  }));

  const classes = useStyles();

  const fetchHistoricData = async () => {
    // Prevent fetching if coin.id is not available
    if (!coin?.id) return;

    setLoading(true);
    setError(null); // Reset error
    setHistoricData(undefined); // Clear previous data

    try {
      const { data } = await axios.get(HistoricalChart(coin.id, days, currency));
      setHistoricData(data.prices);
    } catch (err) {
      console.error("Error fetching historic data:", err);
      // Check if it's a rate limit error (429) or other network issue
      if (err.response && err.response.status === 429) {
          setError("Too many requests. Please wait a moment and try again.");
      } else {
          setError("Could not load chart data.");
      }
      setHistoricData(undefined); // Ensure data is cleared on error
    } finally {
      setLoading(false);
    }
  };

  // --- Removed console.log(coin); ---

  useEffect(() => {
    fetchHistoricData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, days, coin.id]); // Added currency and coin.id to dependencies

  const darkTheme = createTheme({
    palette: {
      primary: {
        main: "#fff",
      },
      type: "dark",
    },
  });

  // Prepare chart data safely
  const lineChartData = {
    labels: historicData?.map((chartCoin) => {
      let date = new Date(chartCoin[0]);
      let time =
        date.getHours() > 12
          ? `${date.getHours() - 12}:${date.getMinutes()} PM`
          : `${date.getHours()}:${date.getMinutes()} AM`;
      return days === 1 ? time : date.toLocaleDateString();
    }) || [], // Default to empty array if no data

    datasets: [
      {
        data: historicData?.map((chartCoin) => chartCoin[1]) || [], // Default to empty array
        label: `Price ( Past ${days} Days ) in ${currency}`,
        borderColor: "#EEBC1D",
      },
    ],
  };

  const lineChartOptions = {
    elements: {
      point: {
        radius: 1,
      },
    },
    // Optional: Add more chart options if needed
    responsive: true,
    maintainAspectRatio: true, // Adjust if needed
  };


  return (
    <ThemeProvider theme={darkTheme}>
      <div className={classes.container}>
        {/* --- Updated Loading/Error/Chart Logic --- */}
        {loading ? (
          <CircularProgress
            style={{ color: "gold" }}
            size={250}
            thickness={1}
          />
        ) : error ? (
           <Typography className={classes.errorText}>{error}</Typography>
        ) : historicData ? (
          <>
            <Line
              data={lineChartData}
              options={lineChartOptions}
            />
            <div className={classes.buttonsContainer}>
              {chartDays.map((day) => (
                <SelectButton
                  key={day.value}
                  onClick={() => {
                    setDays(day.value);
                    // --- Removed setflag(false); ---
                  }}
                  selected={day.value === days}
                >
                  {day.label}
                </SelectButton>
              ))}
            </div>
          </>
        ) : (
           // Optional: Message if data is empty but no error/loading
           <Typography>No chart data available.</Typography>
        )}
      </div>
    </ThemeProvider>
  );
};

export default CoinInfo;
