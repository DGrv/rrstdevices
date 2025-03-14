var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);

console.log("API_KEY:", process.env.API_KEY);



async function fetchData(DeviceID) {
  async function apiRequest(token) {
    const response = await fetch('https://rest.devices.raceresult.com/customers/846/devices/' + DeviceID, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const responseData = await response.json();
    // console.log(responseData)
    // console.log(accessToken)
    const position = responseData.Position;

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.status}`);
    }
    return await position; // Return API response
    // return await responseData; // Return API response
  }


  async function getNewToken() {
    const authResponse = await fetch('https://rest.devices.raceresult.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'apikey': 'blabla'
        'apikey': process.env.API_KEY
      },
      body: ""
    });

    if (!authResponse.ok) {
      throw new Error(`Auth Failed: ${authResponse.status}`);
    }

    const data = await authResponse.json();
    // console.log('Response getNewToken:', data);
    return data.access_token;
  }

  try {
    if (typeof accessToken !== 'undefined' && accessToken !== null) {
      // First API request attempt
      console.log("I Have alread a token ahahaha");
      return await apiRequest(accessToken);
    } else {
      accessToken = await getNewToken();
      return await apiRequest(accessToken);
    }
  } catch (error) {
    if (error.message.includes('401')) {
      console.warn("Token expired, getting a new one...");
      accessToken = await getNewToken();
      return await apiRequest(accessToken); // Retry with new token
    } else {
      throw error; // If not 401, throw other errors
    }
  }
}


// ======= NEW API ROUTE TO FETCH JSON FROM AN EXTERNAL API =======
app.post('/api/get-data', async (req, res) => {

  try {
    let boxid = "T-20346";
    let data = await fetchData(boxid);

    console.log('API Response:', data);

    // Send the fetched data as a response to the client
    res.json({ success: true, position: data });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, error: error.message });
  }

});






// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
