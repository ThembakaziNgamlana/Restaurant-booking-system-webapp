import express from "express";
import pgPromise from "pg-promise";
import exphbs from "express-handlebars";
import bodyParser from "body-parser";
import flash from "flash-express";
import restaurant from './restaurant.js';

const app = express();
const pgp = pgPromise();

app.use(express.static('public'));
app.use(flash());

const connectionString = 'postgres://gszqobxa:mI7uNIVxtYUc6rzUiGaK9VgrJnkiu_XQ@dumbo.db.elephantsql.com/gszqobxa';
const db = pgp(connectionString);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const restaurantApp = restaurant(db);

const handlebarSetup = exphbs.engine({
    partialsDir: "./views/partials",
    viewPath: './views',
    layoutsDir: './views/layouts'
});

app.engine('handlebars', handlebarSetup);
app.set('view engine', 'handlebars');

app.get("/", async (req, res) => {
    // Fetch all tables from the database
    const tables = await restaurantApp.getTables();

    // Determine if each table is already booked and hide the radio button accordingly
    const formattedTables = tables.map((table) => {
        return {
            ...table,
            canBook: !table.booked,
        };
    });

    res.render('index', { tables: formattedTables });
});

app.post("/book", async (req, res) => {
    const { tableName, numCustomers } = req.body;

    // Check if the table is already booked
    const isBooked = await restaurantApp.isTableBooked(tableName);
    if (isBooked) {
        req.flash('error', 'Table is already booked.');
        return res.redirect('/');
    }

    // Fetch table capacity
    const table = await db.one('SELECT capacity FROM tables WHERE name = $1', tableName);

    // Check if the table's capacity is sufficient
    if (numCustomers > table.capacity) {
        req.flash('error', 'Table capacity exceeded.');
        return res.redirect('/');
    }

    // Book the table
    await restaurantApp.bookTable(tableName, numCustomers);

    req.flash('success', 'Table booked successfully!');
    res.redirect('/');
});

app.get("/bookings", async (req, res) => {
    // Fetch all bookings from the database
    const bookings = await restaurantApp.getAllBookings();

    res.render('bookings', { bookings });
});

app.get("/bookings/:username", async (req, res) => {
    const username = req.params.username;

    // Fetch all bookings made by the given user from the database
    const userBookings = await restaurantApp.getBookedTablesForUser(username);

    res.render('user_bookings', { userBookings });
});

app.post("/cancel", async (req, res) => {
    const { tableName } = req.body;

    
    const cancellationMessage = await restaurantApp.cancelTableBooking(tableName);

    // After successfully canceling the booking, redirect back to the /bookings screen
    req.flash('success', cancellationMessage);
    res.redirect('/bookings');
});

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log('App started at port', PORT);
});
